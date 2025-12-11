const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addIpAddressField() {
  try {
    console.log('🔧 Adding ipAddress field to Withdrawal table...')
    
    // Execute raw SQL to add the column
    await prisma.$executeRaw`
      ALTER TABLE "Withdrawal" 
      ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
    `
    
    console.log('✅ ipAddress field added successfully to Withdrawal table')
  } catch (error) {
    console.error('❌ Error adding ipAddress field:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addIpAddressField()
