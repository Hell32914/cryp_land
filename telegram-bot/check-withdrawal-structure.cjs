const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStructure() {
  const result = await prisma.$queryRaw`PRAGMA table_info(Withdrawal)`
  console.log(result)
  await prisma.$disconnect()
}

checkStructure()
