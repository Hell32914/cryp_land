const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Adding comment field to users table...')
  
  try {
    // SQLite doesn't support ALTER TABLE ADD COLUMN for nullable fields directly
    // But Prisma migrations handle this automatically
    await prisma.$executeRaw`
      ALTER TABLE User ADD COLUMN comment TEXT;
    `
    
    console.log('✅ Comment field added successfully')
  } catch (error) {
    // Field might already exist
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  Comment field already exists')
    } else {
      throw error
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
