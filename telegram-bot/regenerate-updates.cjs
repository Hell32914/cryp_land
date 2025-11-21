const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function generateDailyUpdates(totalProfit) {
  const updates = []
  const numUpdates = Math.floor(Math.random() * 8) + 4 // 4-11 updates
  
  // Generate random percentages that sum to 1
  const percentages = []
  let sum = 0
  for (let i = 0; i < numUpdates; i++) {
    const rand = Math.random()
    percentages.push(rand)
    sum += rand
  }
  
  // Normalize percentages
  const normalizedPercentages = percentages.map(p => p / sum)
  
  // Generate random timestamps throughout TODAY (from now to 23:59)
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  
  for (let i = 0; i < numUpdates; i++) {
    // Generate timestamps from NOW onwards
    const randomTime = now.getTime() + Math.random() * (endOfDay.getTime() - now.getTime())
    const timestamp = new Date(randomTime)
    const amount = totalProfit * normalizedPercentages[i]
    
    updates.push({ amount, timestamp })
  }
  
  // Sort by timestamp
  updates.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  return updates
}

async function regenerateUpdates() {
  console.log('🔄 Regenerating daily updates with proper scheduling...\n')
  
  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      balance: { gt: 0 }
    }
  })
  
  for (const user of users) {
    // Calculate daily profit based on balance
    let dailyPercent = 0.5
    if (user.balance >= 10000) dailyPercent = 2.5
    else if (user.balance >= 5000) dailyPercent = 2.0
    else if (user.balance >= 1000) dailyPercent = 1.5
    else if (user.balance >= 100) dailyPercent = 1.0
    
    const dailyProfit = (user.balance * dailyPercent) / 100
    
    // Delete old updates
    await prisma.dailyProfitUpdate.deleteMany({
      where: { userId: user.id }
    })
    
    // Generate new updates
    const updates = generateDailyUpdates(dailyProfit)
    
    console.log(`👤 User @${user.username} (Balance: $${user.balance})`)
    console.log(`   Daily profit: $${dailyProfit.toFixed(2)} (${dailyPercent}%)`)
    console.log(`   Generated ${updates.length} updates:`)
    
    // Create new updates
    for (const [i, update] of updates.entries()) {
      await prisma.dailyProfitUpdate.create({
        data: {
          userId: user.id,
          amount: update.amount,
          timestamp: update.timestamp,
          dailyTotal: dailyProfit,
          notified: false
        }
      })
      
      const time = update.timestamp.toLocaleString('ru-RU')
      console.log(`      ${i + 1}. $${update.amount.toFixed(4)} at ${time}`)
    }
    console.log()
  }
  
  console.log('✅ Updates regenerated successfully!')
}

regenerateUpdates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
