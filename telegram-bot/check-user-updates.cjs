// Check specific user's daily updates
const Database = require('better-sqlite3')
const db = new Database('./prisma/dev.db')

const telegramId = process.argv[2] || '503856039'

try {
  console.log(`🔍 Checking Daily Updates for User ${telegramId}\n`)
  
  // Get user
  const user = db.prepare('SELECT * FROM User WHERE telegramId = ?').get(telegramId)
  
  if (!user) {
    console.log('❌ User not found')
    process.exit(1)
  }
  
  console.log(`👤 User Info:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Telegram ID: ${user.telegramId}`)
  console.log(`   Balance: $${user.balance}`)
  console.log(`   Total Deposit: $${user.totalDeposit}`)
  console.log(`   Profit: $${user.profit}`)
  console.log(`   Status: ${user.status}`)
  
  // Get all updates
  const updates = db.prepare(`
    SELECT * FROM DailyProfitUpdate 
    WHERE userId = ? 
    ORDER BY timestamp ASC
  `).all(user.id)
  
  console.log(`\n📊 Daily Updates: ${updates.length} total`)
  
  if (updates.length === 0) {
    console.log('❌ No daily updates found for this user')
    process.exit(0)
  }
  
  console.log(`   Daily Total: $${updates[0].dailyTotal.toFixed(2)}`)
  
  const now = new Date()
  const visible = updates.filter(u => new Date(u.timestamp) <= now)
  const future = updates.filter(u => new Date(u.timestamp) > now)
  const notified = updates.filter(u => u.notified)
  
  console.log(`   ✅ Visible: ${visible.length}`)
  console.log(`   ⏰ Future: ${future.length}`)
  console.log(`   📤 Notified: ${notified.length}`)
  console.log(`   📭 Not notified: ${updates.length - notified.length}`)
  
  console.log(`\n📋 All Updates:`)
  updates.forEach((u, i) => {
    const timestamp = new Date(u.timestamp)
    const isPast = timestamp <= now
    const status = isPast ? '✅' : '⏰'
    const sent = u.notified ? '📤' : '📭'
    const time = timestamp.toLocaleString('ru-RU', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    console.log(`   ${status} ${sent} #${i + 1}: $${u.amount.toFixed(2)} at ${time}`)
  })
  
  const totalSum = updates.reduce((sum, u) => sum + u.amount, 0)
  const visibleSum = visible.reduce((sum, u) => sum + u.amount, 0)
  
  console.log(`\n💰 Calculations:`)
  console.log(`   Sum of all updates: $${totalSum.toFixed(2)}`)
  console.log(`   Sum of visible: $${visibleSum.toFixed(2)}`)
  console.log(`   Expected daily total: $${updates[0].dailyTotal.toFixed(2)}`)
  console.log(`   Difference: $${Math.abs(totalSum - updates[0].dailyTotal).toFixed(4)}`)
  
  if (Math.abs(totalSum - updates[0].dailyTotal) > 0.01) {
    console.log(`   ⚠️  WARNING: Sum doesn't match daily total!`)
  }
  
} catch (error) {
  console.error('❌ Error:', error)
} finally {
  db.close()
}
