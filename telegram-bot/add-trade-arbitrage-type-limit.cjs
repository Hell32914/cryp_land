const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📝 Adding tradeArbitrageTypeLimit field to User table...')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "tradeArbitrageTypeLimit" INTEGER NOT NULL DEFAULT 1
    `)

    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "tradeArbitrageTypeLimit" = 1
      WHERE "tradeArbitrageTypeLimit" IS NULL OR "tradeArbitrageTypeLimit" < 1
    `)

    console.log('✅ tradeArbitrageTypeLimit field is ready')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
