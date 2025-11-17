import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addReferralFields() {
  try {
    // Add referredBy column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE User ADD COLUMN referredBy TEXT
    `)
    console.log('✅ Added referredBy column')
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  referredBy column already exists')
    } else {
      console.error('❌ Error adding referredBy column:', error.message)
    }
  }

  try {
    // Add referralEarnings column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE User ADD COLUMN referralEarnings REAL DEFAULT 0
    `)
    console.log('✅ Added referralEarnings column')
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  referralEarnings column already exists')
    } else {
      console.error('❌ Error adding referralEarnings column:', error.message)
    }
  }

  try {
    // Create Referral table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Referral (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        referredUserId TEXT NOT NULL,
        referredUsername TEXT,
        level INTEGER NOT NULL,
        earnings REAL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `)
    console.log('✅ Created Referral table')
  } catch (error) {
    console.error('❌ Error creating Referral table:', error.message)
  }

  await prisma.$disconnect()
  console.log('✅ Migration completed')
}

addReferralFields()
