const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if columns already exist
    const allColumns = await prisma.$queryRaw`PRAGMA table_info(MarketingLink)`
    const columnNames = allColumns.map(c => c.name)
    
    console.log('Current columns:', columnNames)
    
    const columnsToAdd = []
    if (!columnNames.includes('trafficerName')) columnsToAdd.push('trafficerName')
    if (!columnNames.includes('stream')) columnsToAdd.push('stream')
    if (!columnNames.includes('geo')) columnsToAdd.push('geo')
    if (!columnNames.includes('creative')) columnsToAdd.push('creative')
    if (!columnNames.includes('creativeUrl')) columnsToAdd.push('creativeUrl')
    
    console.log('Columns to add:', columnsToAdd)

    if (columnsToAdd.length === 0) {
      console.log('✅ All marketing link metadata columns already exist')
      return
    }

    // Add missing columns
    for (const column of columnsToAdd) {
      const sql = `ALTER TABLE MarketingLink ADD COLUMN ${column} TEXT`
      await prisma.$executeRawUnsafe(sql)
      console.log(`✅ Added ${column} column`)
    }

    console.log('✅ Successfully added marketing link metadata columns')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
