const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📝 Adding tradePriceCheckLimit field to User table...')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "tradePriceCheckLimit" INTEGER NOT NULL DEFAULT 1
    `)

    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "tradePriceCheckLimit" = 1
      WHERE "tradePriceCheckLimit" IS NULL OR "tradePriceCheckLimit" < 1
    `)

    console.log('✅ tradePriceCheckLimit field is ready')
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
