// Migration: Add admin deposit/profit tracking fields
// Adds adminDeposit, adminProfit to User and adminAmount to DailyProfitUpdate
// Then backfills ALL historical data so CRM shows correct numbers

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

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Get direct admin deposits per user
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📊 Step 1: Calculating direct admin deposits per user...\n')

  const adminDeposits = await prisma.$queryRawUnsafe(`
    SELECT "userId", SUM("amount") as total
    FROM "Deposit"
    WHERE "paymentMethod" = 'ADMIN' AND "status" = 'COMPLETED'
    GROUP BY "userId"
  `)

  const directAdminByUser = new Map()
  for (const row of adminDeposits) {
    directAdminByUser.set(Number(row.userId), Number(row.total) || 0)
  }
  console.log(`  Found ${directAdminByUser.size} users with admin deposits`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Get ALL users with admin deposits and their stats
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📊 Step 2: Loading user data...\n')

  const userIds = Array.from(directAdminByUser.keys())
  if (userIds.length === 0) {
    console.log('  No users with admin deposits found. Done.')
    await prisma.$disconnect()
    return
  }

  const users = await prisma.$queryRawUnsafe(`
    SELECT "id", "totalDeposit", "profit", "lifetimeDeposit"
    FROM "User"
    WHERE "id" IN (${userIds.join(',')})
  `)

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Get total profit generated per user (from DailyProfitUpdate)
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 Step 3: Calculating total profit generated per user...\n')

  const profitSums = await prisma.$queryRawUnsafe(`
    SELECT "userId", SUM("amount") as "totalProfit"
    FROM "DailyProfitUpdate"
    WHERE "userId" IN (${userIds.join(',')})
    GROUP BY "userId"
  `)

  const totalProfitByUser = new Map()
  for (const row of profitSums) {
    totalProfitByUser.set(Number(row.userId), Number(row.totalProfit) || 0)
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Get total real deposits per user (non-admin, non-profit)
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 Step 4: Calculating real deposits per user...\n')

  const realDepositSums = await prisma.$queryRawUnsafe(`
    SELECT "userId", SUM("amount") as "total"
    FROM "Deposit"
    WHERE "status" = 'COMPLETED'
      AND "paymentMethod" != 'ADMIN'
      AND "currency" != 'PROFIT'
      AND "userId" IN (${userIds.join(',')})
    GROUP BY "userId"
  `)

  const realDepositsByUser = new Map()
  for (const row of realDepositSums) {
    realDepositsByUser.set(Number(row.userId), Number(row.total) || 0)
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Calculate admin ratio and backfill DailyProfitUpdate.adminAmount
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 Step 5: Backfilling DailyProfitUpdate.adminAmount...\n')

  let updatedRecords = 0
  let updatedUsers = 0

  for (const user of users) {
    const userId = Number(user.id)
    const directAdmin = directAdminByUser.get(userId) || 0
    const realDeposits = realDepositsByUser.get(userId) || 0
    const totalDeposit = Number(user.totalDeposit) || 0
    const profit = Number(user.profit) || 0
    const totalProfitGenerated = totalProfitByUser.get(userId) || 0
    const lifetimeDeposit = Number(user.lifetimeDeposit) || 0

    if (directAdmin <= 0 || totalDeposit <= 0) continue

    // Total deposits ever made (admin + real). lifetimeDeposit tracks all deposits but NOT reinvests.
    // lifetimeDeposit = real deposits + admin deposits
    // totalDeposit = lifetimeDeposit + reinvested profit - withdrawals
    // So reinvested profit ≈ totalDeposit - lifetimeDeposit + totalWithdraw (approximately)
    // But for ratio calculation, we use the deposit composition:
    // Admin share of initial deposits = directAdmin / lifetimeDeposit (or directAdmin / (directAdmin + realDeposits))
    const totalInitialDeposits = directAdmin + realDeposits
    const adminRatio = totalInitialDeposits > 0
      ? Math.min(directAdmin / totalInitialDeposits, 1)
      : 0

    if (adminRatio <= 0) continue

    // Update all DailyProfitUpdate records for this user
    // adminAmount = amount * adminRatio (for DEPOSIT source only, not TOKEN)
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "DailyProfitUpdate"
      SET "adminAmount" = "amount" * ${adminRatio}
      WHERE "userId" = ${userId} AND "source" != 'TOKEN'
    `)

    updatedRecords += Number(result) || 0

    // Calculate total admin profit generated from history
    const adminProfitGenerated = totalProfitGenerated * adminRatio

    // Reinvested admin profit = total admin profit generated - admin profit still in user.profit
    const adminProfitInCurrentProfit = profit * adminRatio
    const reinvestedAdminProfit = Math.max(adminProfitGenerated - adminProfitInCurrentProfit, 0)

    // adminDeposit = direct admin deposits + reinvested admin profit
    const newAdminDeposit = directAdmin + reinvestedAdminProfit
    const newAdminProfit = adminProfitInCurrentProfit

    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "adminDeposit" = ${newAdminDeposit},
          "adminProfit" = ${newAdminProfit}
      WHERE "id" = ${userId}
    `)

    console.log(`  User #${userId}: ratio=${(adminRatio * 100).toFixed(1)}% | adminDep=$${newAdminDeposit.toFixed(2)} (direct=$${directAdmin.toFixed(2)} + reinvest=$${reinvestedAdminProfit.toFixed(2)}) | adminProfit=$${newAdminProfit.toFixed(2)} | totalProfitGen=$${adminProfitGenerated.toFixed(2)}`)
    updatedUsers++
  }

  console.log(`\n✅ Updated ${updatedRecords} DailyProfitUpdate records for ${updatedUsers} users`)

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📈 Verification summary:\n')

  const summary = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COALESCE(SUM("adminDeposit"), 0) FROM "User") as "totalAdminBalance",
      (SELECT COALESCE(SUM("amount"), 0) FROM "Deposit" WHERE "paymentMethod" = 'ADMIN' AND "status" = 'COMPLETED') as "totalAdminDeposits",
      (SELECT COALESCE(SUM("adminAmount"), 0) FROM "DailyProfitUpdate") as "totalAdminProfit",
      (SELECT COALESCE(SUM("adminProfit"), 0) FROM "User") as "totalUnreinvestedAdminProfit"
  `)

  const s = summary[0]
  const adminDepositsTotal = Number(s.totalAdminDeposits) || 0
  const adminBalance = Number(s.totalAdminBalance) || 0
  const adminProfitTotal = Number(s.totalAdminProfit) || 0
  const adminReinvest = adminBalance - adminDepositsTotal

  console.log(`  Admin Deposits (direct):   $${adminDepositsTotal.toFixed(2)}`)
  console.log(`  Admin Profit (total):      $${adminProfitTotal.toFixed(2)}`)
  console.log(`  Admin Reinvest:            $${adminReinvest.toFixed(2)}`)
  console.log(`  Admin Balance (total):     $${adminBalance.toFixed(2)}`)
  console.log(`  Unreinvested admin profit: $${Number(s.totalUnreinvestedAdminProfit || 0).toFixed(2)}`)

  console.log('\n🎉 Migration & backfill completed successfully!')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Migration failed:', e)
  prisma.$disconnect()
  process.exit(1)
})
