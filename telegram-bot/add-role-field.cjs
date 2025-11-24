const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Adding role field to users...')
  
  try {
    // Update all existing users to have 'user' role by default
    const result = await prisma.$executeRaw`
      UPDATE User SET role = 'user' WHERE role IS NULL OR role = ''
    `
    
    // Set admins to have 'admin' role
    const adminResult = await prisma.$executeRaw`
      UPDATE User SET role = 'admin' WHERE isAdmin = 1
    `
    
    console.log(`✅ Updated ${result} users to 'user' role`)
    console.log(`✅ Updated ${adminResult} users to 'admin' role`)
    console.log('✅ Role field migration completed')
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
