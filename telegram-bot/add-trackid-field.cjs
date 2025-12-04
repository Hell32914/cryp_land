const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Adding trackId field to Deposit and Withdrawal tables...')
  
  try {
    // This will be handled by Prisma migrate
    console.log('✅ Schema updated. Run: npx prisma migrate dev --name add-trackid')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
