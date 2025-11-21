const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Adding notified field to DailyProfitUpdate table...')
  
  try {
    // SQLite doesn't support ALTER TABLE to add foreign keys directly
    // So we need to use raw SQL
    await prisma.$executeRaw`
      CREATE TABLE "DailyProfitUpdate_new" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "amount" REAL NOT NULL,
        "timestamp" DATETIME NOT NULL,
        "dailyTotal" REAL NOT NULL,
        "notified" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DailyProfitUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `
    
    await prisma.$executeRaw`
      INSERT INTO "DailyProfitUpdate_new" ("id", "userId", "amount", "timestamp", "dailyTotal", "createdAt")
      SELECT "id", "userId", "amount", "timestamp", "dailyTotal", "createdAt" FROM "DailyProfitUpdate"
    `
    
    await prisma.$executeRaw`DROP TABLE "DailyProfitUpdate"`
    await prisma.$executeRaw`ALTER TABLE "DailyProfitUpdate_new" RENAME TO "DailyProfitUpdate"`
    
    console.log('✅ Successfully added notified field')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
