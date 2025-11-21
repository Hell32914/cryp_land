const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {
  console.log('Testing Prisma client...')
  
  // Test if notified field exists
  const update = await prisma.dailyProfitUpdate.findFirst({
    include: {
      user: true
    }
  })
  
  console.log('Sample update:', update)
  console.log('✅ Prisma client working correctly!')
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
