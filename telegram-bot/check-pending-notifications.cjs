// Manually send pending notifications
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function sendPendingNotifications() {
  try {
    console.log('🔄 Checking for pending notifications...\n')
    
    const now = new Date()
    
    const pendingUpdates = await prisma.dailyProfitUpdate.findMany({
      where: {
        timestamp: { lte: now },
        notified: false
      },
      include: { user: true },
      orderBy: { timestamp: 'asc' }
    })
    
    console.log(`Found ${pendingUpdates.length} pending notifications\n`)
    
    if (pendingUpdates.length === 0) {
      console.log('✅ No pending notifications')
      return
    }
    
    // Group by user
    const userGroups = {}
    pendingUpdates.forEach(update => {
      const userId = update.user.telegramId
      if (!userGroups[userId]) {
        userGroups[userId] = []
      }
      userGroups[userId].push(update)
    })
    
    console.log('📊 Pending notifications by user:')
    for (const userId in userGroups) {
      const updates = userGroups[userId]
      console.log(`\n   User ${userId}: ${updates.length} updates`)
      updates.forEach(u => {
        const time = new Date(u.timestamp).toLocaleString('ru-RU')
        console.log(`      - $${u.amount.toFixed(2)} at ${time}`)
      })
    }
    
    console.log('\n\n⚠️  To send these notifications, the bot needs to be running.')
    console.log('The sendScheduledNotifications function will automatically send them.')
    console.log('\nIf bot is running and notifications are not being sent:')
    console.log('1. Check bot logs: pm2 logs syntrix')
    console.log('2. Restart bot: pm2 restart syntrix')
    console.log('3. Wait 1-2 minutes for scheduler to run')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

sendPendingNotifications()
