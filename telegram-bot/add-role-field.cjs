const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Checking and adding role field to users...')
  
  try {
    // Check if role column exists
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(User)`
    const hasRoleColumn = tableInfo.some(col => col.name === 'role')
    
    if (!hasRoleColumn) {
      console.log('⚠️  Role column does not exist, adding it...')
      
      // Add role column with default value
      await prisma.$executeRaw`ALTER TABLE User ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`
      console.log('✅ Role column added successfully')
    } else {
      console.log('✅ Role column already exists')
    }
    
    // Update all existing users to have 'user' role by default (if role is empty)
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
    console.error('Error details:', error.message)
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
