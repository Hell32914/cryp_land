const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addWithdrawalMetadataFields() {
  try {
    console.log('🔧 Adding metadata fields to Withdrawal table...')
    
    // Execute raw SQL to add the columns
    await prisma.$executeRaw`
      ALTER TABLE "Withdrawal" 
      ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
      ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
      ADD COLUMN IF NOT EXISTS "country" TEXT,
      ADD COLUMN IF NOT EXISTS "city" TEXT,
      ADD COLUMN IF NOT EXISTS "isp" TEXT,
      ADD COLUMN IF NOT EXISTS "timezone" TEXT,
      ADD COLUMN IF NOT EXISTS "language" TEXT,
      ADD COLUMN IF NOT EXISTS "referrer" TEXT,
      ADD COLUMN IF NOT EXISTS "deviceFingerprint" TEXT,
      ADD COLUMN IF NOT EXISTS "screenResolution" TEXT,
      ADD COLUMN IF NOT EXISTS "isVpnProxy" BOOLEAN,
      ADD COLUMN IF NOT EXISTS "accountAge" INTEGER,
      ADD COLUMN IF NOT EXISTS "previousWithdrawals" INTEGER,
      ADD COLUMN IF NOT EXISTS "depositToWithdrawRatio" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "hoursSinceLastDeposit" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "percentOfBalance" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "ipChanged" BOOLEAN;
    `
    
    console.log('✅ All metadata fields added successfully to Withdrawal table')
  } catch (error) {
    console.error('❌ Error adding metadata fields:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addWithdrawalMetadataFields()
