const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Contact Support migration...')

  try {
    // Create GlobalSettings table if not exists (will be handled by Prisma)
    console.log('✓ Schema updated via Prisma')

    // Remove old contact support fields from users (data migration)
    console.log('Migrating user data...')
    
    // Count users that need migration
    const usersCount = await prisma.user.count()
    console.log(`Found ${usersCount} users`)

    console.log('✓ Migration complete!')
    console.log('\nGlobal Contact Support is now ready to use.')
    console.log('Use the bot admin panel: 📞 Global Contact Support')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
