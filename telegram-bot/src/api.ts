import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { webhookCallback } from 'grammy'
import type { Bot } from 'grammy'

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || process.env.API_PORT || 3001

app.use(cors())
app.use(express.json())

// Tariff plans configuration (same as in index.ts)
const TARIFF_PLANS = [
  { name: 'Bronze', minDeposit: 10, maxDeposit: 99, dailyPercent: 0.5 },
  { name: 'Silver', minDeposit: 100, maxDeposit: 499, dailyPercent: 1.0 },
  { name: 'Gold', minDeposit: 500, maxDeposit: 999, dailyPercent: 2.0 },
  { name: 'Platinum', minDeposit: 1000, maxDeposit: 4999, dailyPercent: 3.0 },
  { name: 'Diamond', minDeposit: 5000, maxDeposit: 19999, dailyPercent: 5.0 },
  { name: 'Black', minDeposit: 20000, maxDeposit: Infinity, dailyPercent: 7.0 }
]

// Calculate tariff plan progress
function calculatePlanProgress(balance: number) {
  const plan = TARIFF_PLANS.find(p => balance >= p.minDeposit && balance <= p.maxDeposit) || TARIFF_PLANS[0]
  const nextPlan = TARIFF_PLANS[TARIFF_PLANS.indexOf(plan) + 1]
  const leftUntilNext = nextPlan ? nextPlan.minDeposit - balance : 0
  const progress = nextPlan 
    ? ((balance - plan.minDeposit) / (nextPlan.minDeposit - plan.minDeposit)) * 100
    : 100
  
  return {
    currentPlan: plan.name,
    dailyPercent: plan.dailyPercent,
    nextPlan: nextPlan?.name || null,
    leftUntilNext: leftUntilNext > 0 ? leftUntilNext : 0,
    progress: Math.min(Math.max(progress, 0), 100)
  }
}

// Get user data by Telegram ID
// Get country from IP using ipapi.co
async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    // Skip if localhost or private IP
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null
    }
    
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 })
    return response.data.country_name || null
  } catch (error) {
    console.error('Error getting country from IP:', error)
    return null
  }
}

// Get client IP from request
function getClientIP(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]) : req.socket.remoteAddress
  return ip || 'unknown'
}

app.get('/api/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params
    
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        deposits: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update IP address and country on each request
    const clientIP = getClientIP(req)
    if (clientIP && clientIP !== 'unknown' && clientIP !== user.ipAddress) {
      const country = await getCountryFromIP(clientIP)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ipAddress: clientIP,
          country: country || user.country
        }
      })
      user.ipAddress = clientIP
      if (country) user.country = country
    }

    // Calculate plan progress
    const planProgress = calculatePlanProgress(user.balance)

    res.json({
      id: user.telegramId,
      nickname: user.username || user.firstName || 'User',
      status: user.status,
      balance: user.balance,
      profit: user.profit || 0,
      totalDeposit: user.totalDeposit,
      totalWithdraw: user.totalWithdraw,
      plan: user.plan,
      kycRequired: user.kycRequired,
      isBlocked: user.isBlocked,
      lastProfitUpdate: user.lastProfitUpdate,
      referralEarnings: user.referralEarnings || 0,
      planProgress: {
        currentPlan: planProgress.currentPlan,
        dailyPercent: planProgress.dailyPercent,
        nextPlan: planProgress.nextPlan,
        leftUntilNext: planProgress.leftUntilNext,
        progress: planProgress.progress
      },
      deposits: user.deposits.map((d: any) => ({
        amount: d.amount,
        status: d.status,
        currency: d.currency,
        createdAt: d.createdAt
      })),
      withdrawals: user.withdrawals.map((w: any) => ({
        amount: w.amount,
        status: w.status,
        currency: w.currency,
        address: w.address,
        createdAt: w.createdAt
      }))
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user notifications
app.get('/api/user/:telegramId/notifications', async (req, res) => {
  try {
    const { telegramId } = req.params
    
    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    res.json(notifications)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Reinvest profit to balance
app.post('/api/user/:telegramId/reinvest', async (req, res) => {
  try {
    const { telegramId } = req.params
    
    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.profit <= 0) {
      return res.status(400).json({ error: 'No profit to reinvest' })
    }

    const profitAmount = user.profit

    // Move profit to balance and reset profit
    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: {
        balance: user.balance + profitAmount,
        totalDeposit: user.totalDeposit + profitAmount,
        profit: 0,
        plan: calculatePlanProgress(user.balance + profitAmount).currentPlan
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'REINVEST',
        message: `Successfully reinvested $${profitAmount.toFixed(2)} to your balance`
      }
    })

    res.json({
      success: true,
      reinvestedAmount: profitAmount,
      newBalance: updatedUser.balance,
      newProfit: updatedUser.profit,
      newPlan: updatedUser.plan
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user referrals
app.get('/api/user/:telegramId/referrals', async (req, res) => {
  try {
    const { telegramId } = req.params

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const referrals = await prisma.referral.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      referrals,
      totalReferralEarnings: user.referralEarnings
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get daily profit updates
app.get('/api/user/:telegramId/daily-updates', async (req, res) => {
  try {
    const { telegramId } = req.params

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updates = await prisma.dailyProfitUpdate.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'asc' }
    })

    // Filter updates that are in the past (up to current time)
    const now = new Date()
    const visibleUpdates = updates.filter((update: any) => new Date(update.timestamp) <= now)

    res.json({
      updates: visibleUpdates,
      totalUpdates: updates.length,
      totalProfit: updates.length > 0 ? updates[0].dailyTotal : 0
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Reinvest referral earnings to balance
app.post('/api/user/:telegramId/referral-reinvest', async (req, res) => {
  try {
    const { telegramId } = req.params

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.referralEarnings <= 0) {
      return res.status(400).json({ error: 'No referral earnings to reinvest' })
    }

    const referralAmount = user.referralEarnings

    // Move referral earnings to balance and reset referralEarnings
    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: {
        balance: user.balance + referralAmount,
        totalDeposit: user.totalDeposit + referralAmount,
        referralEarnings: 0,
        plan: calculatePlanProgress(user.balance + referralAmount).currentPlan
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'REINVEST',
        message: `Successfully reinvested $${referralAmount.toFixed(2)} referral earnings to your balance`
      }
    })

    res.json({
      success: true,
      reinvestedAmount: referralAmount,
      newBalance: updatedUser.balance,
      newReferralEarnings: updatedUser.referralEarnings,
      newPlan: updatedUser.plan
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create deposit invoice
app.post('/api/user/:telegramId/create-deposit', async (req, res) => {
  try {
    const { telegramId } = req.params
    const { amount, currency } = req.body

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum deposit amount is $10' })
    }

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' })
    }

    // Import OxaPay service
    const { createInvoice } = await import('./oxapay.js')
    
    // Get callback URL from environment or use Railway URL
    const callbackUrl = process.env.WEBHOOK_URL 
      ? `${process.env.WEBHOOK_URL.startsWith('http') ? process.env.WEBHOOK_URL : `https://${process.env.WEBHOOK_URL}`}/api/oxapay-callback`
      : 'https://crypland-production.up.railway.app/api/oxapay-callback'
    
    const invoice = await createInvoice({
      amount,
      currency,
      description: `Deposit for ${user.username || user.telegramId}`,
      callbackUrl
    })

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amount,
        status: 'PENDING',
        currency,
        txHash: invoice.trackId
      }
    })

    res.json({
      success: true,
      depositId: deposit.id,
      trackId: invoice.trackId,
      payLink: invoice.payLink,
      paymentUrl: invoice.payLink,
      qrCode: invoice.qrCode,
      address: invoice.address,
      amount: invoice.amount
    })
  } catch (error: any) {
    console.error('API Error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Create withdrawal request
app.post('/api/user/:telegramId/create-withdrawal', async (req, res) => {
  try {
    const { telegramId } = req.params
    const { amount, currency, address, network } = req.body

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is $10' })
    }

    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }

    if (!address || !currency) {
      return res.status(400).json({ error: 'Address and currency are required' })
    }

    // Create withdrawal record first (don't deduct balance yet)
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount,
        status: 'PENDING',
        currency,
        address,
        network: network || 'TRC20'
      }
    })

    // If amount <= 100, process automatically via OxaPay
    if (amount <= 100) {
      try {
        console.log(`💸 Processing withdrawal ${withdrawal.id} for user ${user.telegramId}`)
        const { createPayout } = await import('./oxapay.js')
        
        const payout = await createPayout({
          address,
          amount,
          currency,
          network: network || 'TRC20'
        })

        console.log(`✅ OxaPay payout successful:`, payout)

        // SUCCESS: Deduct balance and update withdrawal
        await prisma.user.update({
          where: { id: user.id },
          data: {
            balance: { decrement: amount },
            totalWithdraw: { increment: amount }
          }
        })

        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            txHash: payout.trackId,
            status: 'COMPLETED'
          }
        })

        console.log(`✅ Balance deducted, withdrawal marked as COMPLETED`)

        res.json({
          success: true,
          withdrawalId: withdrawal.id,
          trackId: payout.trackId,
          status: 'COMPLETED',
          message: 'Withdrawal completed successfully'
        })
      } catch (error: any) {
        console.error(`❌ Withdrawal ${withdrawal.id} failed:`, {
          error: error.message,
          stack: error.stack
        })

        // Check if this is OxaPay balance issue - send to admin for manual processing
        if (error.message.includes('Service temporarily unavailable') || error.message.includes('balance')) {
          console.log(`⚠️ OxaPay balance issue, sending to admin for manual processing`)

          // Deduct balance (reserve funds)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              balance: { decrement: amount },
              totalWithdraw: { increment: amount }
            }
          })

          const { bot, ADMIN_ID } = await import('./index.js')
          
          await bot.api.sendMessage(
            ADMIN_ID,
            `🔔 *Withdrawal Request (Auto-Failed)*\n\n` +
            `👤 User: @${user.username || 'no_username'} (ID: ${user.telegramId})\n` +
            `💰 Amount: $${amount.toFixed(2)}\n` +
            `💎 Currency: ${currency}\n` +
            `🌐 Network: ${network || 'TRC20'}\n` +
            `📍 Address: \`${address}\`\n\n` +
            `⚠️ OxaPay unavailable - requires manual processing\n` +
            `🆔 Withdrawal ID: ${withdrawal.id}`,
            { 
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✅ Process & Complete', callback_data: `approve_withdrawal_${withdrawal.id}` },
                    { text: '❌ Reject', callback_data: `reject_withdrawal_${withdrawal.id}` }
                  ]
                ]
              }
            }
          )

          return res.json({
            success: true,
            withdrawalId: withdrawal.id,
            status: 'PENDING',
            message: 'Withdrawal request sent to admin for manual processing. Your balance has been reserved.'
          })
        }

        // Other errors: Mark as FAILED, don't deduct balance
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: 'FAILED' }
        })

        return res.status(400).json({ 
          error: 'Failed to process withdrawal. Please contact support.',
          details: error.message 
        })
      }
    } else {
      // Amount > 100, deduct balance and notify admin for manual approval
      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amount },
          totalWithdraw: { increment: amount }
        }
      })

      const { bot, ADMIN_ID } = await import('./index.js')
      
      await bot.api.sendMessage(
        ADMIN_ID,
        `🔔 *Withdrawal Request*\n\n` +
        `👤 User: @${user.username || 'no_username'} (ID: ${user.telegramId})\n` +
        `💰 Amount: $${amount.toFixed(2)}\n` +
        `💎 Currency: ${currency}\n` +
        `🌐 Network: ${network || 'TRC20'}\n` +
        `📍 Address: \`${address}\`\n\n` +
        `⚠️ Manual approval required (amount > $100)\n` +
        `🆔 Withdrawal ID: ${withdrawal.id}`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve & Process', callback_data: `approve_withdrawal_${withdrawal.id}` },
                { text: '❌ Reject', callback_data: `reject_withdrawal_${withdrawal.id}` }
              ]
            ]
          }
        }
      )

      res.json({
        success: true,
        withdrawalId: withdrawal.id,
        status: 'PENDING',
        message: 'Withdrawal request sent to admin for approval. Balance has been reserved.'
      })
    }
  } catch (error: any) {
    console.error('API Error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Get transaction history
app.get('/api/user/:telegramId/transactions', async (req, res) => {
  try {
    const { telegramId } = req.params

    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        deposits: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Combine and sort transactions
    const transactions = [
      ...user.deposits.map((d: any) => ({
        id: `deposit_${d.id}`,
        type: 'DEPOSIT',
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        address: d.txHash,
        createdAt: d.createdAt
      })),
      ...user.withdrawals.map((w: any) => ({
        id: `withdrawal_${w.id}`,
        type: 'WITHDRAWAL',
        amount: w.amount,
        currency: w.currency,
        status: w.status,
        address: w.address,
        createdAt: w.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({
      transactions
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// OxaPay payment callback
app.post('/api/oxapay-callback', async (req, res) => {
  try {
    console.log('📥 OxaPay callback received:', req.body)
    
    const { trackId, status, orderid, amount } = req.body
    
    // Only process if payment is completed
    if (status !== 'Paid' && status !== 'paid') {
      console.log(`⏳ Payment not completed yet. Status: ${status}`)
      return res.json({ success: true })
    }

    // Find deposit by trackId
    const deposit = await prisma.deposit.findFirst({
      where: { txHash: trackId },
      include: { user: true }
    })

    if (!deposit) {
      console.log(`⚠️ Deposit not found for trackId: ${trackId}`)
      return res.json({ success: false, error: 'Deposit not found' })
    }

    if (deposit.status === 'COMPLETED') {
      console.log(`✓ Deposit already processed: ${trackId}`)
      return res.json({ success: true, message: 'Already processed' })
    }

    // Update deposit status to COMPLETED
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { status: 'COMPLETED' }
    })

    // Add amount to user balance and activate account if needed
    const updatedUser = await prisma.user.update({
      where: { id: deposit.userId },
      data: {
        balance: { increment: deposit.amount },
        totalDeposit: { increment: deposit.amount },
        status: deposit.user.status === 'INACTIVE' ? 'ACTIVE' : undefined
      }
    })

    console.log(`✅ Deposit completed: $${deposit.amount} added to user ${deposit.user.telegramId}`)
    
    // Check if user reached $1000 and activate referral
    if (updatedUser.totalDeposit >= 1000 && updatedUser.referredBy && !updatedUser.isActiveReferral) {
      await prisma.user.update({
        where: { id: updatedUser.id },
        data: { isActiveReferral: true }
      })
      
      // Notify referrer
      try {
        const { bot: botInstance } = await import('./index.js')
        await botInstance.api.sendMessage(
          updatedUser.referredBy,
          `🎉 Your referral has become active! They reached $1000 deposit.\nYou will now earn 4% from their daily profits.`
        )
      } catch (err) {
        console.error('Failed to notify referrer:', err)
      }
      
      console.log(`✅ Referral activated: ${deposit.user.telegramId} for referrer ${updatedUser.referredBy}`)
    }
    
    // Send notification to user (optional, import bot if needed)
    res.json({ success: true })
  } catch (error) {
    console.error('❌ OxaPay callback error:', error)
    res.status(500).json({ success: false, error: 'Internal error' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

let server: any

export function startApiServer(bot?: Bot) {
  // Add webhook endpoint if bot is provided
  if (bot) {
    app.post('/webhook', webhookCallback(bot, 'express'))
    console.log('✅ Webhook handler registered at /webhook')
  }
  
  server = app.listen(PORT, () => {
    console.log(`🌐 API Server running on http://localhost:${PORT}`)
  })
  return server
}

export function stopApiServer() {
  if (server) {
    server.close(() => {
      console.log('🛑 API Server stopped')
    })
  }
}

export { app, prisma }
