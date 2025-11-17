import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addProfitFields() {
  try {
    // Add profit column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE User ADD COLUMN profit REAL DEFAULT 0
    `)
    console.log('✅ Added profit column')
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  profit column already exists')
    } else {
      console.error('❌ Error adding profit column:', error.message)
    }
  }

  try {
    // Add lastProfitUpdate column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE User ADD COLUMN lastProfitUpdate DATETIME
    `)
    console.log('✅ Added lastProfitUpdate column')
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  lastProfitUpdate column already exists')
    } else {
      console.error('❌ Error adding lastProfitUpdate column:', error.message)
    }
  }

  await prisma.$disconnect()
  console.log('✅ Migration completed')
}

addProfitFields()
