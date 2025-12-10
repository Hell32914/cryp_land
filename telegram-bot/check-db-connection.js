#!/usr/bin/env node

/**
 * Database Connection Checker
 * This script verifies the Prisma database connection
 */

import { prisma } from './dist/db.js'

async function checkConnection() {
  console.log('🔍 Checking database connection...\n')
  
  try {
    // Check connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Get database info
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('📊 Database info:', result)
    
    // Check tables
    const userCount = await prisma.user.count()
    const depositCount = await prisma.deposit.count()
    const withdrawalCount = await prisma.withdrawal.count()
    const dailyUpdateCount = await prisma.dailyProfitUpdate.count()
    const tradingPostCount = await prisma.tradingPost.count()
    
    console.log('\n📈 Database statistics:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Deposits: ${depositCount}`)
    console.log(`   Withdrawals: ${withdrawalCount}`)
    console.log(`   Daily Profit Updates: ${dailyUpdateCount}`)
    console.log(`   Trading Posts: ${tradingPostCount}`)
    
    // Check for pending notifications
    const pendingNotifications = await prisma.dailyProfitUpdate.count({
      where: {
        notified: false,
        timestamp: {
          lte: new Date()
        }
      }
    })
    
    console.log(`\n🔔 Pending profit notifications: ${pendingNotifications}`)
    
    if (pendingNotifications > 0) {
      console.log('⚠️  There are pending notifications that should be sent!')
      
      // Show some pending notifications
      const samples = await prisma.dailyProfitUpdate.findMany({
        where: {
          notified: false,
          timestamp: {
            lte: new Date()
          }
        },
        include: {
          user: {
            select: {
              telegramId: true,
              firstName: true
            }
          }
        },
        take: 5
      })
      
      console.log('\n📝 Sample pending notifications:')
      samples.forEach(notification => {
        console.log(`   User ${notification.user.telegramId} (${notification.user.firstName}): $${notification.amount.toFixed(2)} at ${notification.timestamp.toISOString()}`)
      })
    }
    
    console.log('\n✅ All checks completed successfully!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('\n📝 Please check:')
    console.error('   1. DATABASE_URL is set correctly in .env')
    console.error('   2. Database is accessible from this server')
    console.error('   3. Prisma migrations are up to date (run: npm run prisma:migrate)')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkConnection()
