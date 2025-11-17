import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.API_PORT || 3001

app.use(cors())
app.use(express.json())

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
      deposits: user.deposits.map(d => ({
        amount: d.amount,
        status: d.status,
        currency: d.currency,
        createdAt: d.createdAt
      })),
      withdrawals: user.withdrawals.map(w => ({
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
