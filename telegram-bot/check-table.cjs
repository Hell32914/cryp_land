const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.$queryRaw`PRAGMA table_info(MarketingLink)`
  result.forEach(col => {
    console.log(`${col.name} - ${col.type}`)
  })
  await prisma.$disconnect()
}

main().catch(console.error)
