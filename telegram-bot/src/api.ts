import express, { type RequestHandler } from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { webhookCallback } from 'grammy'
import type { Bot } from 'grammy'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { z } from 'zod'

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || process.env.API_PORT || 3001

// Tariff plans configuration
const TARIFF_PLANS = [
  { name: 'Bronze', minDeposit: 10, maxDeposit: 99, dailyPercent: 0.5 },
  { name: 'Silver', minDeposit: 100, maxDeposit: 499, dailyPercent: 1.0 },
  { name: 'Gold', minDeposit: 500, maxDeposit: 999, dailyPercent: 2.0 },
  { name: 'Platinum', minDeposit: 1000, maxDeposit: 4999, dailyPercent: 3.0 },
  { name: 'Diamond', minDeposit: 5000, maxDeposit: 19999, dailyPercent: 5.0 },
  { name: 'Black', minDeposit: 20000, maxDeposit: Infinity, dailyPercent: 7.0 }
]

// Calculate tariff plan based on balance
function calculateTariffPlan(balance: number) {
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

app.use(cors())
app.use(express.json())

const CRM_ADMIN_USERNAME = process.env.CRM_ADMIN_USERNAME
const CRM_ADMIN_PASSWORD = process.env.CRM_ADMIN_PASSWORD
const CRM_JWT_SECRET = process.env.CRM_JWT_SECRET
const ADMIN_TOKEN_EXPIRATION = '12h'

if (!CRM_ADMIN_USERNAME || !CRM_ADMIN_PASSWORD || !CRM_JWT_SECRET) {
  console.warn('⚠️ CRM admin credentials are not configured. Admin API endpoints will be disabled until CRM_ADMIN_* env vars are set.')
}

const isAdminAuthConfigured = () => Boolean(CRM_ADMIN_USERNAME && CRM_ADMIN_PASSWORD && CRM_JWT_SECRET)

const safeCompare = (first?: string, second?: string) => {
  if (typeof first !== 'string' || typeof second !== 'string') {
    return false
  }

  const firstBuffer = Buffer.from(first)
  const secondBuffer = Buffer.from(second)

  if (firstBuffer.length !== secondBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer)
}

const requireAdminAuth: RequestHandler = (req, res, next) => {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({ error: 'Admin auth is not configured' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const token = authHeader.slice(7)
    jwt.verify(token, CRM_JWT_SECRET!)
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

app.post('/api/admin/login', (req, res) => {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({ error: 'Admin auth is not configured' })
  }

  const parseResult = loginSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const { username, password } = parseResult.data

  const isValidUser = safeCompare(username, CRM_ADMIN_USERNAME)
  const isValidPassword = safeCompare(password, CRM_ADMIN_PASSWORD)

  if (!isValidUser || !isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    {
      username,
      role: 'admin',
    },
    CRM_JWT_SECRET!,
    { expiresIn: ADMIN_TOKEN_EXPIRATION }
  )

  return res.json({ token })
})

app.get('/api/admin/overview', requireAdminAuth, async (req, res) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const chartDays = 7
    const chartStart = new Date(startOfToday)
    chartStart.setDate(startOfToday.getDate() - (chartDays - 1))

    const [
      totalUsers,
      balanceAgg,
      depositsTodayAgg,
      withdrawalsTodayAgg,
      profitAgg,
      recentDeposits,
      recentWithdrawals,
      recentProfits,
      geoGroups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { balance: true } }),
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.dailyProfitUpdate.aggregate({
        _sum: { amount: true },
        where: {
          timestamp: { gte: chartStart },
        },
      }),
      prisma.deposit.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: chartStart },
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.withdrawal.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: chartStart },
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.dailyProfitUpdate.findMany({
        where: {
          timestamp: { gte: chartStart },
        },
        select: { amount: true, timestamp: true },
      }),
      prisma.user.groupBy({
        by: ['country'],
        _count: { country: true },
      }),
    ])

    const seriesMap = buildDateSeries(chartDays)

    recentDeposits.forEach((deposit) => {
      const key = getDateKey(deposit.createdAt)
      const entry = seriesMap.get(key)
      if (entry) {
        entry.deposits += deposit.amount
      }
    })

    recentWithdrawals.forEach((withdrawal) => {
      const key = getDateKey(withdrawal.createdAt)
      const entry = seriesMap.get(key)
      if (entry) {
        entry.withdrawals += withdrawal.amount
      }
    })

    recentProfits.forEach((profit) => {
      const key = getDateKey(profit.timestamp)
      const entry = seriesMap.get(key)
      if (entry) {
        entry.profit += profit.amount
      }
    })

    const totalGeoUsers = geoGroups.reduce((sum, group) => sum + group._count.country, 0)
    const sortedGeo = geoGroups
      .map((group) => ({
        country: group.country ?? 'Unknown',
        userCount: group._count.country,
      }))
      .sort((a, b) => b.userCount - a.userCount)

    const geoLimit = 6
    const limitedGeo = sortedGeo.slice(0, geoLimit)
    const includedCount = limitedGeo.reduce((sum, entry) => sum + entry.userCount, 0)
    const remaining = totalGeoUsers - includedCount

    if (remaining > 0) {
      limitedGeo.push({ country: 'Others', userCount: remaining })
    }

    const geoData = limitedGeo.map((entry) => ({
      country: entry.country,
      userCount: entry.userCount,
      percentage:
        totalGeoUsers === 0
          ? 0
          : Number(((entry.userCount / totalGeoUsers) * 100).toFixed(1)),
    }))

    return res.json({
      kpis: {
        totalUsers,
        totalBalance: Number(balanceAgg._sum.balance ?? 0),
        depositsToday: Number(depositsTodayAgg._sum.amount ?? 0),
        withdrawalsToday: Number(withdrawalsTodayAgg._sum.amount ?? 0),
        profitPeriod: Number(profitAgg._sum.amount ?? 0),
      },
      financialData: Array.from(seriesMap.values()),
      geoData,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return res.status(500).json({ error: 'Failed to load dashboard data' })
  }
})

const mapUserSummary = (user: any) => ({
  id: user.id,
  telegramId: user.telegramId,
  username: user.username,
  fullName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.telegramId,
  country: user.country || 'Unknown',
  status: user.status,
  plan: user.plan,
  balance: user.balance,
  profit: user.profit,
  totalDeposit: user.totalDeposit,
  totalWithdraw: user.totalWithdraw,
  kycRequired: user.kycRequired,
  isBlocked: user.isBlocked,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

app.get('/api/admin/users', requireAdminAuth, async (req, res) => {
  try {
    const { search = '', limit = '100' } = req.query
    const take = Math.min(parseInt(String(limit), 10) || 100, 500)

    const searchValue = String(search).trim()

    const where = searchValue
      ? {
          OR: [
            { telegramId: { contains: searchValue } },
            { username: { contains: searchValue } },
            { firstName: { contains: searchValue } },
            { lastName: { contains: searchValue } },
          ],
        }
      : undefined

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    })

    return res.json({
      users: users.map(mapUserSummary),
      count: users.length,
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return res.status(500).json({ error: 'Failed to load users' })
  }
})

app.get('/api/admin/deposits', requireAdminAuth, async (req, res) => {
  try {
    const { status, limit = '100' } = req.query
    const take = Math.min(parseInt(String(limit), 10) || 100, 500)

    const deposits = await prisma.deposit.findMany({
      where: status
        ? {
            status: String(status).toUpperCase(),
          }
        : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take,
    })

    const payload = deposits.map((deposit) => ({
      id: deposit.id,
      status: deposit.status,
      amount: deposit.amount,
      currency: deposit.currency,
      network: deposit.network,
      txHash: deposit.txHash,
      createdAt: deposit.createdAt,
      user: mapUserSummary(deposit.user),
    }))

    return res.json({ deposits: payload })
  } catch (error) {
    console.error('Admin deposits error:', error)
    return res.status(500).json({ error: 'Failed to load deposits' })
  }
})

app.get('/api/admin/withdrawals', requireAdminAuth, async (req, res) => {
  try {
    const { status, limit = '100' } = req.query
    const take = Math.min(parseInt(String(limit), 10) || 100, 500)

    const withdrawals = await prisma.withdrawal.findMany({
      where: status
        ? {
            status: String(status).toUpperCase(),
          }
        : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take,
    })

    const payload = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      status: withdrawal.status,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      network: withdrawal.network,
      address: withdrawal.address,
      txHash: withdrawal.txHash,
      createdAt: withdrawal.createdAt,
      user: mapUserSummary(withdrawal.user),
    }))

    return res.json({ withdrawals: payload })
  } catch (error) {
    console.error('Admin withdrawals error:', error)
    return res.status(500).json({ error: 'Failed to load withdrawals' })
  }
})

app.get('/api/admin/expenses', requireAdminAuth, async (_req, res) => {
  try {
    const [expenses, totalAgg] = await Promise.all([
      prisma.expense.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ])

    return res.json({
      expenses,
      totalAmount: Number(totalAgg._sum.amount ?? 0),
    })
  } catch (error) {
    console.error('Admin expenses error:', error)
    return res.status(500).json({ error: 'Failed to load expenses' })
  }
})

const expenseSchema = z.object({
  category: z.string().min(1),
  comment: z.string().min(1),
  amount: z.number().positive(),
})

app.post('/api/admin/expenses', requireAdminAuth, async (req, res) => {
  try {
    const parsed = expenseSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid expense payload' })
    }

    const expense = await prisma.expense.create({ data: parsed.data })

    return res.status(201).json(expense)
  } catch (error) {
    console.error('Create expense error:', error)
    return res.status(500).json({ error: 'Failed to create expense' })
  }
})

app.get('/api/admin/referrals', requireAdminAuth, async (_req, res) => {
  try {
    const referrals = await prisma.referral.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const referredIds = Array.from(new Set(referrals.map((ref) => ref.referredUserId)))

    const referredUsers = referredIds.length
      ? await prisma.user.findMany({ where: { id: { in: referredIds } } })
      : []

    const referredMap = new Map<number, ReturnType<typeof mapUserSummary>>()
    referredUsers.forEach((user) => {
      referredMap.set(user.id, mapUserSummary(user))
    })

    const payload = referrals.map((ref) => ({
      id: ref.id,
      level: ref.level,
      earnings: ref.earnings,
      createdAt: ref.createdAt,
      referrer: mapUserSummary(ref.user),
      referredUser: referredMap.get(ref.referredUserId) || {
        id: ref.referredUserId,
        telegramId: ref.referredUsername || String(ref.referredUserId),
        username: ref.referredUsername,
        fullName: ref.referredUsername || 'Unknown',
        country: 'Unknown',
        status: 'UNKNOWN',
        plan: 'Bronze',
        balance: 0,
        profit: 0,
        totalDeposit: 0,
        totalWithdraw: 0,
        kycRequired: false,
        isBlocked: false,
        createdAt: ref.createdAt,
        updatedAt: ref.createdAt,
      },
    }))

    return res.json({ referrals: payload })
  } catch (error) {
    console.error('Admin referrals error:', error)
    return res.status(500).json({ error: 'Failed to load referrals' })
  }
})

const getDateKey = (date: Date) => date.toISOString().split('T')[0]

const buildDateSeries = (days: number) => {
  const map = new Map<string, { date: string; deposits: number; withdrawals: number; profit: number }>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = getDateKey(d)
    map.set(key, {
      date: key,
      deposits: 0,
      withdrawals: 0,
      profit: 0,
    })
  }

  return map
}


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
  // Try multiple headers (Railway, Cloudflare, etc.)
  const xForwardedFor = req.headers['x-forwarded-for']
  const xRealIp = req.headers['x-real-ip']
  const cfConnectingIp = req.headers['cf-connecting-ip']
  
  // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > socket
  if (cfConnectingIp && typeof cfConnectingIp === 'string') {
    return cfConnectingIp
  }
  
  if (xRealIp && typeof xRealIp === 'string') {
    return xRealIp
  }
  
  if (xForwardedFor) {
    const ip = typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : xForwardedFor[0]
    return ip || 'unknown'
  }
  
  return req.socket.remoteAddress || 'unknown'
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
      console.log(`[GEO] User ${telegramId}: IP=${clientIP}, updating country...`)
      const country = await getCountryFromIP(clientIP)
      console.log(`[GEO] User ${telegramId}: Country=${country || 'null'}`)
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

    // If amount < 100, process automatically via OxaPay
    // If amount >= 100, require admin approval
    if (amount < 100) {
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

        // Calculate new balance before deduction
        const newBalance = user.balance - amount

        // SUCCESS: Deduct balance and update withdrawal
        const updatedUser = await prisma.user.update({
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

        console.log(`✅ Balance deducted, withdrawal marked as COMPLETED. New balance: $${newBalance.toFixed(2)}`)

        // Notify user about successful withdrawal
        try {
          const { bot } = await import('./index.js')
          await bot.api.sendMessage(
            user.telegramId,
            `✅ *Withdrawal Completed*\n\n` +
            `💰 Amount: $${amount.toFixed(2)}\n` +
            `💎 Currency: ${currency}\n` +
            `🌐 Network: ${network || 'TRC20'}\n` +
            `📍 Address: \`${address}\`\n\n` +
            `🔗 Track ID: ${payout.trackId}\n\n` +
            `💳 New balance: $${newBalance.toFixed(2)}`,
            { parse_mode: 'Markdown' }
          )
        } catch (err) {
          console.error('Failed to notify user:', err)
        }

        // Notify support team about withdrawal
        try {
          const { notifySupport } = await import('./index.js')
          await notifySupport(
            `💸 *Withdrawal Completed*\n\n` +
            `👤 User: @${user.username || 'no_username'} (ID: ${user.telegramId})\n` +
            `💰 Amount: $${amount.toFixed(2)}\n` +
            `💎 Currency: ${currency}\n` +
            `🌐 Network: ${network || 'TRC20'}\n` +
            `📍 Address: \`${address}\`\n` +
            `🔗 Track ID: ${payout.trackId}\n` +
            `💳 User New Balance: $${newBalance.toFixed(2)}`,
            { parse_mode: 'Markdown' }
          )
          console.log(`✅ Support team notified about withdrawal from ${user.telegramId}`)
        } catch (err) {
          console.error('Failed to notify support team about withdrawal:', err)
        }

        return res.json({
          success: true,
          withdrawalId: withdrawal.id,
          trackId: payout.trackId,
          status: 'COMPLETED',
          message: 'Withdrawal completed successfully',
          newBalance: newBalance
        })
      } catch (error: any) {
        console.error(`❌ Withdrawal ${withdrawal.id} failed:`, {
          error: error.message,
          stack: error.stack
        })

        // For withdrawals ≤ $100: If Oxapay fails, DO NOT deduct balance
        // Mark withdrawal as FAILED
        console.log(`❌ OxaPay request failed for withdrawal ${withdrawal.id}. Not deducting balance, marking as FAILED.`)

        // Mark withdrawal as FAILED
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: 'FAILED' }
        })

        console.log(`❌ Withdrawal marked as FAILED. User balance unchanged: $${user.balance.toFixed(2)}`)

        // Notify user about failed withdrawal
        try {
          const { bot } = await import('./index.js')
          await bot.api.sendMessage(
            user.telegramId,
            `❌ *Withdrawal Failed*\n\n` +
            `💰 Amount: $${amount.toFixed(2)}\n` +
            `💎 Currency: ${currency}\n` +
            `🌐 Network: ${network || 'TRC20'}\n` +
            `📍 Address: \`${address}\`\n\n` +
            `⚠️ Payment provider error: ${error.message}\n\n` +
            `💳 Your balance remains unchanged: $${user.balance.toFixed(2)}\n\n` +
            `Please try again later or contact support.`,
            { parse_mode: 'Markdown' }
          )
        } catch (err) {
          console.error('Failed to notify user:', err)
        }

        return res.status(400).json({
          success: false,
          withdrawalId: withdrawal.id,
          status: 'FAILED',
          error: 'Withdrawal failed. Please try again.',
          details: error.message
        })
      }
    } else {
      // Amount >= 100, deduct balance immediately (reserve funds) and set status to PROCESSING
      const { bot, ADMIN_ID, ADMIN_ID_2 } = await import('./index.js')
      
      console.log(`💰 Withdrawal ${withdrawal.id} for $${amount} requires approval. Reserving funds...`)
      
      // Calculate new balance
      const newBalance = user.balance - amount
      
      // STEP 1: Deduct balance immediately (reserve funds)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amount },
          totalWithdraw: { increment: amount }
        }
      })
      
      // STEP 2: Update withdrawal status to PROCESSING
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: 'PROCESSING' }
      })
      
      console.log(`✅ Funds reserved. New balance: $${newBalance.toFixed(2)}`)
      
      const adminMessage = `🔔 *Withdrawal Request - Manual Approval Required*\n\n` +
        `👤 User: @${user.username || 'no_username'} (ID: ${user.telegramId})\n` +
        `💰 Amount: $${amount.toFixed(2)}\n` +
        `💎 Currency: ${currency}\n` +
        `🌐 Network: ${network || 'TRC20'}\n` +
        `📍 Address: \`${address}\`\n\n` +
        `💳 Previous Balance: $${user.balance.toFixed(2)}\n` +
        `💳 New Balance: $${newBalance.toFixed(2)}\n` +
        `✅ Funds have been reserved\n\n` +
        `⚠️ Amount ≥ $100 - Requires approval\n` +
        `🆔 Withdrawal ID: ${withdrawal.id}`
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Approve & Process', callback_data: `approve_withdrawal_${withdrawal.id}` },
            { text: '❌ Reject', callback_data: `reject_withdrawal_${withdrawal.id}` }
          ]
        ]
      }
      
      // Notify support team about withdrawal requiring approval
      try {
        const { notifySupport } = await import('./index.js')
        console.log(`📨 Sending withdrawal notification to support team`)
        
        // Get all support users
        const { ADMIN_IDS } = await import('./index.js')
        for (const adminId of ADMIN_IDS) {
          try {
            await bot.api.sendMessage(adminId, adminMessage, { parse_mode: 'Markdown', reply_markup: keyboard })
            console.log(`✅ Notification sent to admin/support ${adminId}`)
          } catch (err) {
            console.error(`❌ Failed to notify ${adminId}:`, err)
          }
        }
        
        // Also notify support users from database
        const supportUsers = await prisma.user.findMany({
          where: { role: { in: ['admin', 'support'] } }
        })
        
        for (const supportUser of supportUsers) {
          if (ADMIN_IDS.includes(supportUser.telegramId)) continue // Already notified
          
          try {
            await bot.api.sendMessage(supportUser.telegramId, adminMessage, { parse_mode: 'Markdown', reply_markup: keyboard })
            console.log(`✅ Notification sent to support ${supportUser.telegramId}`)
          } catch (err) {
            console.error(`❌ Failed to notify support ${supportUser.telegramId}:`, err)
          }
        }
      } catch (error) {
        console.error('❌ Failed to send support team notifications:', error)
      }

      // Notify user that withdrawal is pending approval (funds already reserved)
      try {
        await bot.api.sendMessage(
          user.telegramId,
          `⏳ *Withdrawal Pending Approval*\n\n` +
          `💰 Amount: $${amount.toFixed(2)}\n` +
          `💎 Currency: ${currency}\n` +
          `🌐 Network: ${network || 'TRC20'}\n` +
          `📍 Address: \`${address}\`\n\n` +
          `📋 Your withdrawal request has been sent to admin for approval.\n` +
          `⏱ This usually takes a few minutes.\n\n` +
          `✅ Funds have been reserved from your balance\n` +
          `💳 New balance: $${newBalance.toFixed(2)}\n\n` +
          `ℹ️ If rejected, funds will be returned to your account.`,
          { parse_mode: 'Markdown' }
        )
      } catch (err) {
        console.error('Failed to notify user:', err)
      }

      return res.json({
        success: true,
        withdrawalId: withdrawal.id,
        status: 'PROCESSING',
        message: 'Withdrawal request sent to admin for approval. Funds have been reserved.',
        newBalance: newBalance
      })
    }
  } catch (error: any) {
    console.error('❌ Withdrawal API Error:', error)
    
    // If response already sent, don't try to send again
    if (res.headersSent) {
      console.error('⚠️ Headers already sent, cannot send error response')
      return
    }
    
    return res.status(500).json({ 
      error: 'Failed to process withdrawal. Please contact support.',
      details: error.message 
    })
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
    
    // Calculate plan info for user
    const planInfo = calculateTariffPlan(updatedUser.balance)
    const progressBar = '█'.repeat(Math.floor(planInfo.progress / 10)) + '░'.repeat(10 - Math.floor(planInfo.progress / 10))
    
    // Notify user about successful deposit
    try {
      const { bot: botInstance } = await import('./index.js')
      
      let userMessage = `✅ *Deposit Successful!*\n\n`
      userMessage += `💰 Amount: $${deposit.amount.toFixed(2)} ${deposit.currency}\n`
      userMessage += `💳 New Balance: $${updatedUser.balance.toFixed(2)}\n\n`
      
      // Add activation message if account was just activated
      if (deposit.user.status === 'INACTIVE') {
        userMessage += `🎉 *Account Activated!*\n\n`
        userMessage += `You can now start earning daily profits!\n\n`
      }
      
      userMessage += `📈 *Plan:* ${planInfo.currentPlan} (${planInfo.dailyPercent}% daily)\n`
      
      if (planInfo.nextPlan) {
        userMessage += `\n🎯 *Progress to ${planInfo.nextPlan}:*\n`
        userMessage += `${progressBar} ${planInfo.progress.toFixed(0)}%\n`
        userMessage += `💵 $${planInfo.leftUntilNext.toFixed(2)} left until ${planInfo.nextPlan}`
      } else {
        userMessage += `\n🏆 *You have the highest plan!*`
      }
      
      await botInstance.api.sendMessage(
        deposit.user.telegramId,
        userMessage,
        { parse_mode: 'Markdown' }
      )
      
      console.log(`✅ User ${deposit.user.telegramId} notified about deposit`)
    } catch (err) {
      console.error('Failed to notify user about deposit:', err)
    }
    
    // Notify support team about deposit
    try {
      const { notifySupport } = await import('./index.js')
      
      await notifySupport(
        `💰 *New Deposit Received*\n\n` +
        `👤 User: @${deposit.user.username || 'no_username'} (ID: ${deposit.user.telegramId})\n` +
        `💵 Amount: $${deposit.amount.toFixed(2)}\n` +
        `💎 Currency: ${deposit.currency}\n` +
        `📊 Total Deposited: $${updatedUser.totalDeposit.toFixed(2)}\n` +
        `💳 New Balance: $${updatedUser.balance.toFixed(2)}\n` +
        `📈 Plan: ${planInfo.currentPlan}`,
        { parse_mode: 'Markdown' }
      )
      
      console.log(`✅ Support team notified about deposit from ${deposit.user.telegramId}`)
    } catch (err) {
      console.error('Failed to notify support team about deposit:', err)
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ OxaPay callback error:', error)
    res.status(500).json({ success: false, error: 'Internal error' })
  }
})

// ============= MARKETING LINKS ENDPOINTS =============

// Create marketing link
app.post('/api/admin/marketing-links', requireAdminAuth, async (req, res) => {
  try {
    const { source, utmParams } = req.body
    
    if (!source) {
      return res.status(400).json({ error: 'Source is required' })
    }
    
    // Generate unique linkId
    const linkId = `mk_${source}_${Date.now().toString(36)}`
    
    const link = await prisma.marketingLink.create({
      data: {
        linkId,
        source,
        utmParams: utmParams ? JSON.stringify(utmParams) : null
      }
    })
    
    return res.json(link)
  } catch (error) {
    console.error('Create marketing link error:', error)
    return res.status(500).json({ error: 'Failed to create marketing link' })
  }
})

// Get all marketing links
app.get('/api/admin/marketing-links', requireAdminAuth, async (_req, res) => {
  try {
    const links = await prisma.marketingLink.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return res.json({ links })
  } catch (error) {
    console.error('Get marketing links error:', error)
    return res.status(500).json({ error: 'Failed to load marketing links' })
  }
})

// Get marketing stats by source
app.get('/api/admin/marketing-stats', requireAdminAuth, async (_req, res) => {
  try {
    // Get all users with marketing source
    const users = await prisma.user.findMany({
      where: {
        marketingSource: { not: null }
      },
      include: {
        deposits: true
      }
    })
    
    // Group by source
    const statsBySource = new Map<string, {
      source: string
      users: number
      deposits: number
      revenue: number
    }>()
    
    users.forEach(user => {
      const source = user.marketingSource || 'unknown'
      
      if (!statsBySource.has(source)) {
        statsBySource.set(source, {
          source,
          users: 0,
          deposits: 0,
          revenue: 0
        })
      }
      
      const stats = statsBySource.get(source)!
      stats.users++
      
      user.deposits.forEach(deposit => {
        if (deposit.status === 'COMPLETED') {
          stats.deposits++
          stats.revenue += deposit.amount
        }
      })
    })
    
    // Get marketing links stats
    const links = await prisma.marketingLink.findMany()
    
    return res.json({
      sources: Array.from(statsBySource.values()),
      links: links.map(link => ({
        linkId: link.linkId,
        source: link.source,
        clicks: link.clicks,
        conversions: link.conversions,
        conversionRate: link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(2) : '0.00',
        isActive: link.isActive,
        createdAt: link.createdAt
      }))
    })
  } catch (error) {
    console.error('Get marketing stats error:', error)
    return res.status(500).json({ error: 'Failed to load marketing stats' })
  }
})

// Toggle marketing link active status
app.patch('/api/admin/marketing-links/:linkId', requireAdminAuth, async (req, res) => {
  try {
    const { linkId } = req.params
    const { isActive } = req.body
    
    const link = await prisma.marketingLink.update({
      where: { linkId },
      data: { isActive }
    })
    
    return res.json(link)
  } catch (error) {
    console.error('Update marketing link error:', error)
    return res.status(500).json({ error: 'Failed to update marketing link' })
  }
})

// Delete marketing link
app.delete('/api/admin/marketing-links/:linkId', requireAdminAuth, async (req, res) => {
  try {
    const { linkId } = req.params
    
    await prisma.marketingLink.delete({
      where: { linkId }
    })
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Delete marketing link error:', error)
    return res.status(500).json({ error: 'Failed to delete marketing link' })
  }
})

// Update user role
app.patch('/api/admin/users/:telegramId/role', requireAdminAuth, async (req, res) => {
  try {
    const { telegramId } = req.params
    const { role } = req.body
    
    if (!['user', 'support', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    
    const user = await prisma.user.update({
      where: { telegramId },
      data: { 
        role,
        isAdmin: role === 'admin' // Update isAdmin flag for backwards compatibility
      }
    })
    
    return res.json(user)
  } catch (error) {
    console.error('Update user role error:', error)
    return res.status(500).json({ error: 'Failed to update user role' })
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
    app.post('/webhook', webhookCallback(bot, 'express', {
      timeoutMilliseconds: 60000 // 60 seconds timeout
    }))
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
