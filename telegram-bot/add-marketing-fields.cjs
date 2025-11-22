const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Adding marketing fields to database...')
  
  try {
    // Check if migration is needed by trying to query new fields
    const user = await prisma.user.findFirst()
    if (user && 'marketingSource' in user) {
      console.log('✅ Marketing fields already exist')
      return
    }
  } catch (e) {
    // Fields don't exist, continue with migration
  }

  // Apply schema changes
  const { execSync } = require('child_process')
  
  console.log('Pushing schema changes...')
  execSync('npx prisma db push --skip-generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  })
  
  console.log('✅ Marketing fields added successfully!')
  console.log('   - User.marketingSource')
  console.log('   - User.utmParams')
  console.log('   - MarketingLink table created')
}

main()
  .catch((error) => {
    console.error('Migration error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
