const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addAdmin() {
  try {
    const telegramId = '1450570156'
    
    const user = await prisma.user.findUnique({
      where: { telegramId }
    })
    
    if (user) {
      await prisma.user.update({
        where: { telegramId },
        data: { isAdmin: true }
      })
      console.log(`✅ User ${telegramId} is now admin`)
    } else {
      console.log(`❌ User ${telegramId} not found in database. They need to start the bot first.`)
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addAdmin()
