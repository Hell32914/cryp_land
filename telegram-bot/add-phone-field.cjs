const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📝 Adding phoneNumber field to User table...')
    
    // Add phoneNumber column to User table
    await prisma.$executeRaw`
      ALTER TABLE User ADD COLUMN phoneNumber TEXT
    `
    
    console.log('✅ phoneNumber field added successfully!')
  } catch (error) {
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('⚠️ phoneNumber field already exists')
    } else {
      console.error('❌ Migration failed:', error)
      console.error('Error details:', error.message)
      throw error
    }
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
