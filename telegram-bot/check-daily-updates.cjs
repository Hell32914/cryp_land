// Check daily updates in database
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUpdates() {
  try {
    console.log('🔍 Checking Daily Updates\n')
    
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      take: 5
    })
    
    for (const user of users) {
      const updates = await prisma.dailyProfitUpdate.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'asc' }
      })
      
      if (updates.length > 0) {
        console.log(`\n👤 User ${user.telegramId}:`)
        console.log(`   Total updates: ${updates.length}`)
        console.log(`   Daily total: $${updates[0].dailyTotal.toFixed(2)}`)
        
        const now = new Date()
        const visible = updates.filter(u => new Date(u.timestamp) <= now)
        const future = updates.filter(u => new Date(u.timestamp) > now)
        
        console.log(`   ✅ Visible (sent): ${visible.length}`)
        console.log(`   ⏰ Future (pending): ${future.length}`)
        
        console.log(`\n   Updates:`)
        updates.forEach((u, i) => {
          const isPast = new Date(u.timestamp) <= now
          const status = isPast ? '✅' : '⏰'
          const time = new Date(u.timestamp).toLocaleString('ru-RU')
          const notified = u.notified ? '📤' : '📭'
          console.log(`   ${status} ${notified} #${i + 1}: $${u.amount.toFixed(2)} at ${time}`)
        })
        
        const visibleSum = visible.reduce((sum, u) => sum + u.amount, 0)
        console.log(`\n   Sum of visible updates: $${visibleSum.toFixed(2)}`)
        console.log(`   Expected total: $${updates[0].dailyTotal.toFixed(2)}`)
        console.log(`   Difference: $${(updates[0].dailyTotal - visibleSum).toFixed(2)}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUpdates()
