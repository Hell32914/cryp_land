// Check all updates for a user with full details
const Database = require('better-sqlite3')
const db = new Database('./prisma/dev.db')

const telegramId = process.argv[2] || '503856039'

try {
  console.log(`🔍 Detailed Check for User ${telegramId}\n`)
  
  const user = db.prepare('SELECT * FROM User WHERE telegramId = ?').get(telegramId)
  
  if (!user) {
    console.log('❌ User not found')
    process.exit(1)
  }
  
  console.log(`👤 User ID: ${user.id}, Telegram ID: ${user.telegramId}`)
  console.log(`   Total Deposit: $${user.totalDeposit}, Profit: $${user.profit}\n`)
  
  // Get ALL updates ever created for this user
  const updates = db.prepare(`
    SELECT 
      id,
      userId,
      amount,
      timestamp,
      dailyTotal,
      notified,
      createdAt
    FROM DailyProfitUpdate 
    WHERE userId = ? 
    ORDER BY timestamp DESC
  `).all(user.id)
  
  console.log(`📊 Total updates in DB: ${updates.length}\n`)
  
  // Group by date
  const byDate = {}
  updates.forEach(u => {
    const date = new Date(u.timestamp).toLocaleDateString('ru-RU')
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(u)
  })
  
  console.log('📅 Updates grouped by date:\n')
  
  for (const date in byDate) {
    const dateUpdates = byDate[date]
    const sum = dateUpdates.reduce((s, u) => s + u.amount, 0)
    const notifiedCount = dateUpdates.filter(u => u.notified).length
    
    console.log(`   ${date}: ${dateUpdates.length} updates, sum: $${sum.toFixed(2)}, notified: ${notifiedCount}/${dateUpdates.length}`)
    
    dateUpdates.forEach(u => {
      const time = new Date(u.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      const created = new Date(u.createdAt).toLocaleString('ru-RU')
      const sent = u.notified ? '📤' : '📭'
      console.log(`      ${sent} ID:${u.id} $${u.amount.toFixed(2)} at ${time} (created: ${created})`)
    })
    console.log()
  }
  
  // Check for duplicates or issues
  console.log('🔍 Analysis:')
  
  const dateCount = Object.keys(byDate).length
  console.log(`   Number of different dates: ${dateCount}`)
  
  if (dateCount > 1) {
    console.log('   ⚠️  WARNING: Updates from multiple dates found!')
    console.log('   This should not happen - old updates should be deleted.')
  }
  
  // Check if notified updates are from past
  const now = new Date()
  const notifiedFuture = updates.filter(u => u.notified && new Date(u.timestamp) > now)
  if (notifiedFuture.length > 0) {
    console.log(`   ⚠️  WARNING: ${notifiedFuture.length} future updates marked as notified!`)
  }
  
} catch (error) {
  console.error('❌ Error:', error)
} finally {
  db.close()
}
