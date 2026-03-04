const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📝 Adding tradeAssetsLimit field to User table...')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "tradeAssetsLimit" INTEGER NOT NULL DEFAULT 2
    `)

    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "tradeAssetsLimit" = 2
      WHERE "tradeAssetsLimit" IS NULL OR "tradeAssetsLimit" < 1
    `)

    console.log('✅ tradeAssetsLimit field is ready')
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
