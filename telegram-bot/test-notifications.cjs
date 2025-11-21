const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testScheduledNotifications() {
  console.log('🔄 Testing scheduled notifications system...\n')
  
  // Get all updates grouped by user
  const updates = await prisma.dailyProfitUpdate.findMany({
    include: {
      user: true
    },
    orderBy: {
      timestamp: 'asc'
    }
  })
  
  console.log(`📊 Total updates in database: ${updates.length}\n`)
  
  // Group by user
  const byUser = {}
  for (const update of updates) {
    if (!byUser[update.user.telegramId]) {
      byUser[update.user.telegramId] = {
        username: update.user.username,
        updates: []
      }
    }
    byUser[update.user.telegramId].updates.push(update)
  }
  
  // Show schedule for each user
  for (const [telegramId, data] of Object.entries(byUser)) {
    console.log(`👤 User: @${data.username} (${telegramId})`)
    console.log(`   Total updates: ${data.updates.length}`)
    console.log(`   Updates schedule:`)
    
    data.updates.forEach((update, i) => {
      const time = new Date(update.timestamp).toLocaleString('ru-RU')
      const notified = update.notified ? '✅ Sent' : '⏳ Pending'
      console.log(`      ${i + 1}. $${update.amount.toFixed(4)} at ${time} ${notified}`)
    })
    console.log()
  }
  
  // Show how many updates are pending
  const now = new Date()
  const pending = updates.filter(u => new Date(u.timestamp) <= now && !u.notified)
  const future = updates.filter(u => new Date(u.timestamp) > now)
  const sent = updates.filter(u => u.notified)
  
  console.log('📈 Statistics:')
  console.log(`   ✅ Already sent: ${sent.length}`)
  console.log(`   ⏳ Pending (should send now): ${pending.length}`)
  console.log(`   📅 Future updates: ${future.length}`)
}

testScheduledNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
