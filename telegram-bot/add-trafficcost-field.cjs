const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if column already exists
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('MarketingLink') 
      WHERE name = 'trafficCost'
    `
    
    if (result[0].count > 0) {
      console.log('✅ trafficCost column already exists')
      return
    }

    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE MarketingLink 
      ADD COLUMN trafficCost REAL NOT NULL DEFAULT 0
    `

    console.log('✅ Successfully added trafficCost column to MarketingLink table')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
