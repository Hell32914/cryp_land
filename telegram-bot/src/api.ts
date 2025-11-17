import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.API_PORT || 3001

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

    // Calculate plan progress
    const planProgress = calculatePlanProgress(user.balance)

    res.json({
      id: user.telegramId,
      nickname: user.username || user.firstName || 'User',
      status: user.status,
      balance: user.balance,
      totalDeposit: user.totalDeposit,
      totalWithdraw: user.totalWithdraw,
      plan: user.plan,
      kycRequired: user.kycRequired,
      isBlocked: user.isBlocked,
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

let server: any

export function startApiServer() {
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
