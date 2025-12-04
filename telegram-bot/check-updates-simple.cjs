// Check daily updates in database (simple version)
const Database = require('better-sqlite3')
const db = new Database('./prisma/dev.db')

try {
  console.log('🔍 Checking Daily Updates\n')
  
  // Get all users with updates
  const users = db.prepare(`
    SELECT DISTINCT u.id, u.telegramId 
    FROM User u
    INNER JOIN DailyProfitUpdate d ON d.userId = u.id
    LIMIT 5
  `).all()
  
  for (const user of users) {
    const updates = db.prepare(`
      SELECT * FROM DailyProfitUpdate 
      WHERE userId = ? 
      ORDER BY timestamp ASC
    `).all(user.id)
    
    if (updates.length > 0) {
      console.log(`\n👤 User ${user.telegramId}:`)
      console.log(`   Total updates: ${updates.length}`)
      console.log(`   Daily total: $${updates[0].dailyTotal.toFixed(2)}`)
      
      const now = new Date()
      const visible = updates.filter(u => new Date(u.timestamp) <= now)
      const future = updates.filter(u => new Date(u.timestamp) > now)
      
      console.log(`   ✅ Visible (should show in app): ${visible.length}`)
      console.log(`   ⏰ Future (not yet visible): ${future.length}`)
      
      console.log(`\n   Updates:`)
      updates.forEach((u, i) => {
        const timestamp = new Date(u.timestamp)
        const isPast = timestamp <= now
        const status = isPast ? '✅' : '⏰'
        const notified = u.notified ? '📤' : '📭'
        const time = timestamp.toLocaleString('ru-RU', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        console.log(`   ${status} ${notified} #${i + 1}: $${u.amount.toFixed(2)} at ${time}`)
      })
      
      const visibleSum = visible.reduce((sum, u) => sum + u.amount, 0)
      console.log(`\n   💰 Sum of visible updates: $${visibleSum.toFixed(2)}`)
      console.log(`   🎯 Expected total: $${updates[0].dailyTotal.toFixed(2)}`)
      console.log(`   📊 Remaining: $${(updates[0].dailyTotal - visibleSum).toFixed(2)}`)
      
      // Check notifications
      const notifiedCount = updates.filter(u => u.notified).length
      console.log(`\n   📤 Notifications sent: ${notifiedCount}/${updates.length}`)
    }
  }
  
  console.log('\n\n📊 Summary:')
  const totalUpdates = db.prepare('SELECT COUNT(*) as count FROM DailyProfitUpdate').get()
  const now = new Date().toISOString()
  const visibleCount = db.prepare(`SELECT COUNT(*) as count FROM DailyProfitUpdate WHERE timestamp <= ?`).get(now)
  console.log(`   Total updates in DB: ${totalUpdates.count}`)
  console.log(`   Visible updates: ${visibleCount.count}`)
  console.log(`   Future updates: ${totalUpdates.count - visibleCount.count}`)
  
} catch (error) {
  console.error('❌ Error:', error)
} finally {
  db.close()
}
