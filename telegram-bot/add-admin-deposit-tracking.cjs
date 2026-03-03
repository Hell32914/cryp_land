// Migration: Add admin deposit/profit tracking fields
// Adds adminDeposit, adminProfit to User and adminAmount to DailyProfitUpdate
// Then backfills adminDeposit from existing ADMIN deposits

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Adding admin deposit tracking fields...\n')

  // 1. Add adminDeposit column to User
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "adminDeposit" DOUBLE PRECISION DEFAULT 0`)
    console.log('✅ Added adminDeposit column to User')
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
      console.log('ℹ️  adminDeposit column already exists')
    } else {
      console.error('❌ Error adding adminDeposit:', e.message)
    }
  }

  // 2. Add adminProfit column to User
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "adminProfit" DOUBLE PRECISION DEFAULT 0`)
    console.log('✅ Added adminProfit column to User')
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
      console.log('ℹ️  adminProfit column already exists')
    } else {
      console.error('❌ Error adding adminProfit:', e.message)
    }
  }

  // 3. Add adminAmount column to DailyProfitUpdate
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "DailyProfitUpdate" ADD COLUMN "adminAmount" DOUBLE PRECISION DEFAULT 0`)
    console.log('✅ Added adminAmount column to DailyProfitUpdate')
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
      console.log('ℹ️  adminAmount column already exists')
    } else {
      console.error('❌ Error adding adminAmount:', e.message)
    }
  }

  // 4. Backfill: set adminDeposit = sum of ADMIN deposits for each user
  console.log('\n📊 Backfilling adminDeposit from historical ADMIN deposits...\n')

  const adminDeposits = await prisma.$queryRaw`
    SELECT "userId", SUM("amount") as total
    FROM "Deposit"
    WHERE "paymentMethod" = 'ADMIN' AND "status" = 'COMPLETED'
    GROUP BY "userId"
  `

  let backfilled = 0
  for (const row of adminDeposits) {
    const adminAmount = Number(row.total) || 0
    if (adminAmount > 0) {
      await prisma.$executeRaw`UPDATE "User" SET "adminDeposit" = ${adminAmount} WHERE "id" = ${row.userId}`
      console.log(`  User #${row.userId}: adminDeposit = $${adminAmount.toFixed(2)}`)
      backfilled++
    }
  }

  console.log(`\n✅ Backfilled adminDeposit for ${backfilled} users`)

  // 5. Estimate adminProfit for existing unreinvested profit
  // For users with current profit > 0, estimate the admin portion based on adminDeposit/totalDeposit ratio
  console.log('\n📊 Estimating adminProfit for users with unreinvested profit...\n')

  const usersWithProfit = await prisma.$queryRaw`
    SELECT "id", "profit", "totalDeposit", "adminDeposit"
    FROM "User"
    WHERE "profit" > 0 AND "totalDeposit" > 0 AND "adminDeposit" > 0
  `

  let profitBackfilled = 0
  for (const user of usersWithProfit) {
    const ratio = Number(user.adminDeposit) / Number(user.totalDeposit)
    const estimatedAdminProfit = Number(user.profit) * ratio
    if (estimatedAdminProfit > 0) {
      await prisma.$executeRaw`UPDATE "User" SET "adminProfit" = ${estimatedAdminProfit} WHERE "id" = ${user.id}`
      console.log(`  User #${user.id}: adminProfit ≈ $${estimatedAdminProfit.toFixed(2)} (ratio: ${(ratio * 100).toFixed(1)}%)`)
      profitBackfilled++
    }
  }

  console.log(`\n✅ Estimated adminProfit for ${profitBackfilled} users`)
  console.log('\n🎉 Migration completed successfully!')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Migration failed:', e)
  prisma.$disconnect()
  process.exit(1)
})
