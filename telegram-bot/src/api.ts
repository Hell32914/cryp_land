import express, { type RequestHandler } from 'express'
import cors from 'cors'
import { prisma } from './db.js'
import axios from 'axios'
import { webhookCallback } from 'grammy'
import type { Bot } from 'grammy'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
const app = express()
const PORT = process.env.PORT || process.env.API_PORT || 3001
const BIND_HOST = process.env.API_BIND_HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0')

// Generate webhook secret token for security
const isProduction = process.env.NODE_ENV === 'production'

export const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN || crypto.randomBytes(32).toString('hex')
if (!process.env.WEBHOOK_SECRET_TOKEN) {
  if (isProduction) {
    throw new Error('❌ WEBHOOK_SECRET_TOKEN must be set in .env for production!')
  }
  console.warn('⚠️ WEBHOOK_SECRET_TOKEN not set in .env, using generated token. Add it to .env for persistence.')
  console.log(`Generated WEBHOOK_SECRET_TOKEN=${WEBHOOK_SECRET_TOKEN.slice(0, 8)}...${WEBHOOK_SECRET_TOKEN.slice(-8)}`)
}

// Track pending withdrawal requests to prevent double-clicking race condition
const pendingWithdrawalRequests = new Set<string>()

// Get IP geolocation data
async function getIpGeoData(ip: string) {
  try {
    // Use ip-api.com (free, no API key needed, 45 requests/minute)
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,timezone,proxy,query`)
    if (response.data.status === 'success') {
      return {
        country: response.data.country || null,
        city: response.data.city || null,
        isp: response.data.isp || null,
        timezone: response.data.timezone || null,
        isVpnProxy: response.data.proxy || false
      }
    }
  } catch (error) {
    console.error('Error fetching IP geo data:', error)
  }
  return { country: null, city: null, isp: null, timezone: null, isVpnProxy: null }
}

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

// Configure CORS with allowed origins
const allowedOrigins = [
  'https://syntrix.website',
  'https://www.syntrix.website',
  'https://crypto.syntrix.website',
  'https://trade.syntrix.website',
  'https://invest.syntrix.website',
  'https://official.syntrix.website',
  'https://app.syntrix.website',
  'https://admin.syntrix.website',
  'https://syntrix-crm.onrender.com',
  'http://localhost:5173', // Development
  'http://localhost:3000'  // Development
]

// Trust proxy for nginx (required for rate limiting)
app.set('trust proxy', 1)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json())

const CRM_ADMIN_USERNAME = process.env.CRM_ADMIN_USERNAME
const CRM_ADMIN_PASSWORD = process.env.CRM_ADMIN_PASSWORD
const CRM_JWT_SECRET = process.env.CRM_JWT_SECRET
const ADMIN_TOKEN_EXPIRATION = '12h'

// User JWT secret for mini-app authentication
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || crypto.randomBytes(32).toString('hex')
if (!process.env.USER_JWT_SECRET) {
  if (isProduction) {
    throw new Error('❌ USER_JWT_SECRET must be set in .env for production!')
  }
  console.warn('⚠️ USER_JWT_SECRET not set in .env, using generated secret. Add it to .env for persistence.')
  console.log(`Generated USER_JWT_SECRET=${USER_JWT_SECRET.slice(0, 8)}...${USER_JWT_SECRET.slice(-8)}`)
}

if (!CRM_ADMIN_USERNAME || !CRM_ADMIN_PASSWORD || !CRM_JWT_SECRET) {
  console.warn('⚠️ CRM admin credentials are not configured. Admin API endpoints will be disabled until CRM_ADMIN_* env vars are set.')
}

const isAdminAuthConfigured = () => Boolean(CRM_ADMIN_USERNAME && CRM_ADMIN_PASSWORD && CRM_JWT_SECRET)

// Rate limiting configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 auth requests per 15 minutes
  message: 'Too many authentication requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 withdrawal requests per hour
  message: 'Too many withdrawal requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

const depositLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Max 30 deposit requests per hour
  message: 'Too many deposit requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

const aiAnalyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute
  message: 'Too many AI analytics requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

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

// Middleware to verify user JWT token and extract telegramId
const requireUserAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, USER_JWT_SECRET) as { telegramId: string }
    
    // Verify that telegramId in token matches telegramId in URL
    const urlTelegramId = req.params.telegramId
    if (urlTelegramId && decoded.telegramId !== urlTelegramId) {
      console.warn(`⚠️ Token telegramId mismatch: ${decoded.telegramId} !== ${urlTelegramId}`)
      return res.status(403).json({ error: 'Forbidden: telegramId mismatch' })
    }
    
    // Attach verified telegramId to request for use in route handlers
    ;(req as any).verifiedTelegramId = decoded.telegramId
    next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

app.post('/api/admin/login', loginLimiter, (req, res) => {
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

// Validate Telegram WebApp initData
function validateTelegramWebAppData(
  initData: string,
  botToken: string
): { valid: boolean; telegramId?: string; authDate?: number } {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')
    
    if (!hash) {
      return { valid: false }
    }

    // Create data check string
    const dataCheckArr = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
    const dataCheckString = dataCheckArr.join('\n')

    // Calculate secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    
    // Calculate hash
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    if (!safeCompare(calculatedHash, hash)) {
      return { valid: false }
    }

    // Enforce initData freshness to reduce replay risk
    const authDateStr = urlParams.get('auth_date')
    const authDate = authDateStr ? Number(authDateStr) : NaN
    if (!Number.isFinite(authDate)) {
      return { valid: false }
    }

    const maxAgeSecondsRaw = process.env.TELEGRAM_INITDATA_MAX_AGE_SECONDS
    const maxAgeSeconds = Number.isFinite(Number(maxAgeSecondsRaw)) ? Number(maxAgeSecondsRaw) : 600
    const nowSeconds = Math.floor(Date.now() / 1000)

    // Basic sanity bounds (allow small clock skew)
    if (authDate > nowSeconds + 60) {
      return { valid: false }
    }
    if (nowSeconds - authDate > maxAgeSeconds) {
      return { valid: false }
    }

    // Extract user data
    const userStr = urlParams.get('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      return { valid: true, telegramId: String(userData.id), authDate }
    }

    return { valid: false }
  } catch (error) {
    console.error('Error validating Telegram WebApp data:', error)
    return { valid: false }
  }
}

// User authentication endpoint - generates JWT for mini-app users
app.post('/api/user/auth', authLimiter, async (req, res) => {
  try {
    const { telegramId, initData } = req.body

    let effectiveTelegramId: string | undefined

    // PRODUCTION: initData is mandatory; telegramId must be derived from validated initData.
    if (isProduction) {
      if (!initData || typeof initData !== 'string') {
        return res.status(401).json({ error: 'initData is required' })
      }

      const botToken = process.env.BOT_TOKEN
      if (!botToken) {
        return res.status(500).json({ error: 'Server configuration error' })
      }

      const validation = validateTelegramWebAppData(initData, botToken)
      if (!validation.valid || !validation.telegramId) {
        console.warn('⚠️ Invalid Telegram WebApp initData')
        return res.status(401).json({ error: 'Invalid authentication data' })
      }

      effectiveTelegramId = validation.telegramId

      // If client also sends telegramId, it must match (defense-in-depth)
      if (telegramId && telegramId !== effectiveTelegramId) {
        console.warn(`⚠️ telegramId mismatch in auth body: ${telegramId} !== ${effectiveTelegramId}`)
        return res.status(401).json({ error: 'Invalid authentication data' })
      }
    } else {
      // DEVELOPMENT: allow plain telegramId for local testing
      if (!telegramId) {
        return res.status(400).json({ error: 'telegramId is required' })
      }
      effectiveTelegramId = telegramId
    }
    
    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { telegramId: effectiveTelegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate JWT token for user
    const token = jwt.sign(
      { telegramId: effectiveTelegramId },
      USER_JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    )

    res.json({ token })
  } catch (error) {
    console.error('Error generating user token:', error)
    res.status(500).json({ error: 'Failed to generate token' })
  }
})

const aiAnalyticsRequestSchema = z
  .object({
    locale: z.string().optional(),
    symbol: z.string().optional(),
    timeframe: z.string().optional(),
    modelId: z.enum(['syntrix', 'modelA', 'modelB', 'modelC', 'modelD']).optional(),
  })
  .passthrough()

type AiModelId = 'syntrix' | 'modelA' | 'modelB' | 'modelC' | 'modelD'
type AiAnalyticsItem = {
  modelId: AiModelId
  displayName: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidencePct: number
  profitPct: number
  message: string
}

const buildFallbackAiAnalytics = (): AiAnalyticsItem[] => {
  const base = new Date().getUTCDate()
  const pick = <T,>(items: T[], offset: number) => items[(base + offset) % items.length]
  const signals: Array<'BUY' | 'SELL' | 'HOLD'> = ['BUY', 'SELL', 'HOLD']
  // Profit ranges are illustrative and biased for demo purposes:
  // Syntrix is typically higher; others are typically lower (with occasional overlap).
  const profitRanges: Record<AiModelId, { min: number; max: number; overlapChancePct: number }> = {
    syntrix: { min: 6, max: 18, overlapChancePct: 0 },
    modelA: { min: -2, max: 5, overlapChancePct: 8 },
    modelB: { min: -3, max: 4, overlapChancePct: 6 },
    modelC: { min: -4, max: 4, overlapChancePct: 5 },
    modelD: { min: -2, max: 6, overlapChancePct: 10 },
  }

  const models: Array<{ modelId: AiModelId; displayName: string; idx: number }> = [
    { modelId: 'syntrix', displayName: 'Syntrix AI', idx: 0 },
    { modelId: 'modelA', displayName: 'DEEPSEEK CHAT V3.1', idx: 1 },
    { modelId: 'modelB', displayName: 'CLAUDE SONNET 4.5', idx: 2 },
    { modelId: 'modelC', displayName: 'QWEN3 MAX', idx: 3 },
    { modelId: 'modelD', displayName: 'GEMINI 2.5 PRO', idx: 4 },
  ]

  return models.map((m) => {
    const signal = pick(signals, m.idx)
    const confidencePct = 55 + ((base * 7 + m.idx * 11) % 40)

    const r = profitRanges[m.modelId]
    // deterministic-ish pseudo-random using date + model index
    const seed = (base * 97 + m.idx * 193) % 10_000
    const u = (seed % 1000) / 1000
    let profit = r.min + (r.max - r.min) * u

    // Rare overlap: let some non-syntrix models occasionally approach higher values
    if (m.modelId !== 'syntrix') {
      const overlapRoll = (seed % 100)
      if (overlapRoll < r.overlapChancePct) {
        profit = Math.min(r.max + 3, profit + 4)
      }
    }

    const profitPct = Number(profit.toFixed(2))

    return {
      modelId: m.modelId,
      displayName: m.displayName,
      signal,
      confidencePct,
      profitPct,
      message:
        `Signal: ${signal}. Confidence: ${confidencePct}%. ` +
        `Estimated P/L: ${profitPct >= 0 ? '+' : ''}${profitPct}%.`,
    }
  })
}

app.post('/api/user/:telegramId/ai-analytics', aiAnalyticsLimiter, async (req, res) => {
  const parsed = aiAnalyticsRequestSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const locale = (parsed.data.locale || 'en').toString().slice(0, 8)
  const symbol = (parsed.data.symbol || 'BTC/USDT').toString().slice(0, 20)
  const timeframe = (parsed.data.timeframe || '1h').toString().slice(0, 10)
  const requestedModelId = parsed.data.modelId

  const openAiKey = process.env.OPENAI_API_KEY
  const openAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!openAiKey) {
    const all = buildFallbackAiAnalytics()
    return res.json({
      generatedAt: new Date().toISOString(),
      simulated: true,
      items: requestedModelId ? all.filter((i) => i.modelId === requestedModelId) : all,
    })
  }

  try {
    const system =
      'You generate trading analytics for a demo UI. ' +
      'Respond in English only. ' +
      'Never imply real trading execution or guaranteed returns. ' +
      'Do not include disclaimers such as "simulation", "simulated", or "not financial advice". ' +
      'Avoid direct imperatives (e.g., "you should buy"); keep language descriptive and neutral. ' +
      'Return STRICT JSON only. No markdown.'

    const user = {
      locale,
      symbol,
      timeframe,
      requestedModelId: requestedModelId || null,
      models: [
        { modelId: 'syntrix', displayName: 'Syntrix AI' },
        { modelId: 'modelA', displayName: 'DEEPSEEK CHAT V3.1' },
        { modelId: 'modelB', displayName: 'CLAUDE SONNET 4.5' },
        { modelId: 'modelC', displayName: 'QWEN3 MAX' },
        { modelId: 'modelD', displayName: 'GEMINI 2.5 PRO' },
      ],
      outputShape: {
        items: [
          {
            modelId: 'syntrix | modelA | modelB | modelC | modelD',
            displayName: 'string',
            signal: 'BUY | SELL | HOLD',
            confidencePct: 0,
            profitPct: 0,
            message: 'string',
          },
        ],
      },
      constraints: [
        'message must be 2-4 short sentences',
        'confidencePct must be integer 40..95',
        'profitPct must be illustrative and plausible',
        'Syntrix AI profitPct should usually be higher (e.g., +6..+18)',
        'Other models profitPct should usually be lower (e.g., -4..+6), occasional overlap is allowed',
        'If requestedModelId is not null, include ONLY that model in items',
      ],
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: openAiModel,
        temperature: 0.8,
        max_tokens: 700,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(user) },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20_000,
      }
    )

    const content = response.data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('OpenAI returned empty response')
    }

    const parsedJson = JSON.parse(content)
    const items = Array.isArray(parsedJson?.items) ? (parsedJson.items as AiAnalyticsItem[]) : null

    if (!items || !items.length) {
      throw new Error('OpenAI response JSON missing items')
    }

    // Minimal sanitization
    let filtered = items
    if (requestedModelId) {
      filtered = items.filter((i) => i?.modelId === requestedModelId)
    }

    const sanitized: AiAnalyticsItem[] = filtered
      .filter((it) => it && typeof it === 'object')
      .slice(0, 5)
      .map((it) => {
        const modelId = (it.modelId as AiModelId) || 'modelA'
        const displayName = typeof it.displayName === 'string' ? it.displayName.slice(0, 40) : 'Model'
        const signal = (it.signal as any) === 'BUY' || (it.signal as any) === 'SELL' || (it.signal as any) === 'HOLD' ? (it.signal as any) : 'HOLD'
        const confidencePct = Math.max(0, Math.min(100, Math.round(Number(it.confidencePct) || 0)))
        const profitPct = Number((Number(it.profitPct) || 0).toFixed(2))
        const message = typeof it.message === 'string' ? it.message.slice(0, 700) : ''
        return { modelId, displayName, signal, confidencePct, profitPct, message }
      })

    res.json({
      generatedAt: new Date().toISOString(),
      simulated: true,
      items: sanitized,
    })
  } catch (error) {
    console.error('AI analytics generation failed:', error)
    const all = buildFallbackAiAnalytics()
    res.json({
      generatedAt: new Date().toISOString(),
      simulated: true,
      items: requestedModelId ? all.filter((i) => i.modelId === requestedModelId) : all,
    })
  }
})

app.get('/api/admin/overview', requireAdminAuth, async (req, res) => {
  try {
    const now = new Date()
    
    // Parse period parameters
    const fromParam = req.query.from as string | undefined
    const toParam = req.query.to as string | undefined
    
    // Default: start of today for "today" stats
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    
    // Period for filtering (defaults to all time if not specified)
    const periodStart = fromParam ? new Date(fromParam) : null
    const periodEnd = toParam ? new Date(toParam) : now
    
    // Chart always shows based on period or last 7 days
    const chartDays = 7
    const chartStart = periodStart || new Date(startOfToday)
    if (!periodStart) {
      chartStart.setDate(startOfToday.getDate() - (chartDays - 1))
    }

    // Build where conditions based on period
    const periodWhere = periodStart ? {
      gte: periodStart,
      lte: periodEnd
    } : undefined

    const userWhere = periodWhere
      ? { isHidden: false, createdAt: periodWhere }
      : { isHidden: false }

    const depositWhere = periodWhere
      ? { status: 'COMPLETED', createdAt: periodWhere }
      : { status: 'COMPLETED' }

    const withdrawalWhere = periodWhere
      ? { status: 'COMPLETED', createdAt: periodWhere }
      : { status: 'COMPLETED' }

    const [
      totalUsers,
      balanceAgg,
      depositsTodayAgg,
      withdrawalsTodayAgg,
      profitAgg,
      // Period deposits/withdrawals for KPI cards
      depositsInPeriodAgg,
      withdrawalsInPeriodAgg,
      recentDeposits,
      recentWithdrawals,
      recentProfits,
      geoGroups,
      geoUsers,
      geoDeposits,
      geoWithdrawals,
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.user.aggregate({ _sum: { balance: true }, where: { isHidden: false } }),
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
        where: periodWhere ? {
          timestamp: periodWhere,
        } : undefined,
      }),
      // Deposits in selected period (for KPI)
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: depositWhere,
      }),
      // Withdrawals in selected period (for KPI)
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: withdrawalWhere,
      }),
      prisma.deposit.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: periodWhere || { gte: chartStart },
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.withdrawal.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: periodWhere || { gte: chartStart },
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.dailyProfitUpdate.findMany({
        where: {
          timestamp: periodWhere || { gte: chartStart },
        },
        select: { amount: true, timestamp: true },
      }),
      prisma.user.groupBy({
        by: ['country'],
        where: userWhere,
        _count: { country: true },
      }),
      prisma.user.findMany({
        where: userWhere,
        select: { telegramId: true, username: true, firstName: true, lastName: true, country: true },
      }),
      prisma.deposit.findMany({
        where: depositWhere,
        include: {
          user: {
            select: { country: true, telegramId: true, username: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.withdrawal.findMany({
        where: withdrawalWhere,
        include: {
          user: {
            select: { country: true },
          },
        },
      }),
    ])

    // Build date series dynamically based on period
    const effectiveStart = periodStart || chartStart
    const effectiveEnd = periodEnd
    const daysDiff = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const seriesMap = buildDateSeries(Math.min(daysDiff, 30), effectiveStart) // Max 30 days on chart

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

    // Country metrics using period filters
    const countryUserCount = new Map<string, number>()
    geoUsers.forEach((u) => {
      const country = u.country ?? 'Unknown'
      countryUserCount.set(country, (countryUserCount.get(country) || 0) + 1)
    })

    // Deposit/withdrawal aggregates per country within period
    const countryDeposits = new Map<string, { total: number; byUser: Map<string, { amount: number; user: any }> }>()
    geoDeposits.forEach((d) => {
      const country = d.user?.country ?? 'Unknown'
      const userKey = String(d.user?.telegramId ?? 'unknown')
      if (!countryDeposits.has(country)) countryDeposits.set(country, { total: 0, byUser: new Map() })
      const entry = countryDeposits.get(country)!
      entry.total += Number(d.amount)
      const userEntry = entry.byUser.get(userKey) || { amount: 0, user: d.user }
      userEntry.amount += Number(d.amount)
      entry.byUser.set(userKey, userEntry)
    })

    const countryWithdrawals = new Map<string, number>()
    geoWithdrawals.forEach((w) => {
      const country = w.user?.country ?? 'Unknown'
      countryWithdrawals.set(country, (countryWithdrawals.get(country) || 0) + Number(w.amount))
    })

    const totalGeoUsers = Array.from(countryUserCount.values()).reduce((a, b) => a + b, 0)
    const sortedGeo = Array.from(countryUserCount.entries())
      .map(([country, count]) => ({ country, userCount: count }))
      .sort((a, b) => b.userCount - a.userCount)

    const geoLimit = 6
    const limitedGeo = sortedGeo.slice(0, geoLimit)
    const includedCount = limitedGeo.reduce((sum, entry) => sum + entry.userCount, 0)
    const remaining = totalGeoUsers - includedCount

    if (remaining > 0) {
      limitedGeo.push({ country: 'Others', userCount: remaining })
    }

    const geoData = limitedGeo.map((entry) => {
      if (entry.country === 'Others') {
        return {
          country: entry.country,
          userCount: entry.userCount,
          percentage: totalGeoUsers === 0 ? 0 : Number(((entry.userCount / totalGeoUsers) * 100).toFixed(1)),
          ftdCount: 0,
          conversionRate: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalProfit: 0,
          topDepositors: [],
        }
      }

      const depositsEntry = countryDeposits.get(entry.country)
      const totalDeposits = depositsEntry?.total || 0
      const totalWithdrawals = countryWithdrawals.get(entry.country) || 0

      // FTD = unique users with at least one deposit in period
      const ftdCount = depositsEntry ? depositsEntry.byUser.size : 0
      const conversionRate = entry.userCount > 0 ? Number(((ftdCount / entry.userCount) * 100).toFixed(1)) : 0

      // Top depositors by amount within period
      const topDepositors = depositsEntry
        ? Array.from(depositsEntry.byUser.values())
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(({ amount, user }) => ({
              telegramId: user?.telegramId,
              username: user?.username,
              fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || String(user?.telegramId),
              totalDeposit: amount,
            }))
        : []

      return {
        country: entry.country,
        userCount: entry.userCount,
        percentage: totalGeoUsers === 0 ? 0 : Number(((entry.userCount / totalGeoUsers) * 100).toFixed(1)),
        ftdCount,
        conversionRate,
        totalDeposits,
        totalWithdrawals,
        totalProfit: 0, // Profit per country not yet tracked by period
        topDepositors,
      }
    })

    // Get top 5 users by balance (totalDeposit is the working balance)
    const topUsersByBalance = await prisma.user.findMany({
      where: { isHidden: false, totalDeposit: { gt: 0 } },
      orderBy: { totalDeposit: 'desc' },
      take: 5,
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        balance: true,
        totalDeposit: true,
        lifetimeDeposit: true,
      },
    })

    const topUsers = topUsersByBalance.map(user => ({
      telegramId: Number(user.telegramId),
      username: user.username,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.telegramId,
      balance: user.totalDeposit, // Working balance
      totalDeposit: user.lifetimeDeposit || user.totalDeposit, // Lifetime deposits
    }))

    // Transaction statistics
    const [
      allDepositsAgg,
      allWithdrawalsAgg,
      depositsCount,
      withdrawalsCount,
      allProfitsAgg,
      profitsCount,
    ] = await Promise.all([
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: depositWhere,
      }),
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: withdrawalWhere,
      }),
      prisma.deposit.count({
        where: depositWhere,
      }),
      prisma.withdrawal.count({
        where: withdrawalWhere,
      }),
      prisma.dailyProfitUpdate.aggregate({
        _sum: { amount: true },
        where: periodWhere ? { timestamp: periodWhere } : undefined,
      }),
      prisma.dailyProfitUpdate.count({
        where: periodWhere ? { timestamp: periodWhere } : undefined,
      }),
    ])

    // Reinvest is calculated as total profit generated
    const transactionStats = {
      totalDeposits: Number(allDepositsAgg._sum.amount ?? 0),
      depositsCount,
      totalWithdrawals: Number(allWithdrawalsAgg._sum.amount ?? 0),
      withdrawalsCount,
      totalReinvest: Number(allProfitsAgg._sum.amount ?? 0),
      reinvestCount: profitsCount,
    }

    return res.json({
      kpis: {
        totalUsers,
        totalBalance: Number(balanceAgg._sum.balance ?? 0),
        depositsToday: Number(depositsTodayAgg._sum.amount ?? 0),
        withdrawalsToday: Number(withdrawalsTodayAgg._sum.amount ?? 0),
        profitPeriod: Number(profitAgg._sum.amount ?? 0),
        // Period-based KPIs (all time if no period specified)
        depositsPeriod: Number(depositsInPeriodAgg._sum.amount ?? 0),
        withdrawalsPeriod: Number(withdrawalsInPeriodAgg._sum.amount ?? 0),
      },
      financialData: Array.from(seriesMap.values()),
      geoData,
      topUsers,
      transactionStats,
      generatedAt: now.toISOString(),
      period: periodStart ? {
        from: periodStart.toISOString(),
        to: periodEnd.toISOString(),
      } : null,
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return res.status(500).json({ error: 'Failed to load dashboard data' })
  }
})

const mapUserSummary = (user: any, marketingLink?: any) => ({
  id: user.id,
  telegramId: user.telegramId,
  username: user.username,
  fullName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.telegramId,
  country: user.country || 'Unknown',
  status: user.status,
  plan: user.plan,
  balance: user.totalDeposit, // Current working balance (available for withdrawal)
  profit: user.profit,
  totalDeposit: user.lifetimeDeposit || user.totalDeposit, // All-time deposits
  totalWithdraw: user.totalWithdraw,
  kycRequired: user.kycRequired,
  isBlocked: user.isBlocked,
  role: user.role || 'user',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  // New fields
  comment: user.comment || null,
  currentProfit: user.profit, // Current profit balance
  totalProfit: user.totalProfit || 0, // Lifetime profit
  remainingBalance: user.totalDeposit - user.totalWithdraw, // Working balance - withdrawals
  referralCount: user.referralCount || 0,
  referredBy: user.referredBy || null,
  withdrawalStatus: user.kycRequired ? 'verification' : (user.isBlocked ? 'blocked' : 'allowed'),
  firstDepositAmount: user.firstDepositAmount || 0,
  languageCode: user.languageCode || null,
  marketingSource: user.marketingSource || null,
  utmParams: user.utmParams || null,
  // Marketing link info (from joined data or stored linkId)
  trafficerName: marketingLink?.trafficerName || user.trafficerName || null,
  linkName: marketingLink?.linkName || user.linkName || null,
  linkId: marketingLink?.linkId || user.linkId || null,
})

app.get('/api/admin/users', requireAdminAuth, async (req, res) => {
  try {
    const { search = '', limit = '50', page = '1', sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const take = Math.min(parseInt(String(limit), 10) || 50, 100)
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1)
    const skip = (pageNum - 1) * take

    const searchValue = String(search).trim()

    const where = searchValue
      ? {
          isHidden: false,
          OR: [
            { telegramId: { contains: searchValue } },
            { username: { contains: searchValue } },
            { firstName: { contains: searchValue } },
            { lastName: { contains: searchValue } },
          ],
        }
      : { isHidden: false }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where })
    const totalPages = Math.ceil(totalCount / take)

    // Map frontend sortBy to database fields
    const sortByField = String(sortBy)
    let dbSortField = sortByField
    
    // Map computed fields to database fields
    if (sortByField === 'totalDeposit') {
      dbSortField = 'lifetimeDeposit' // Sort by lifetime deposits
    } else if (sortByField === 'balance') {
      dbSortField = 'totalDeposit' // Sort by current balance
    }

    // Get users with referral counts and first deposit amounts
    const users = await prisma.user.findMany({
      where,
      orderBy: { [dbSortField]: sortOrder === 'asc' ? 'asc' : 'desc' },
      take,
      skip,
      include: {
        referrals: {
          select: { id: true },
        },
        deposits: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { amount: true },
        },
        dailyUpdates: {
          select: { amount: true },
        },
      },
    })

    // Get all marketing links to match with users
    const marketingLinks = await prisma.marketingLink.findMany()
    const linksByLinkId = new Map(marketingLinks.map(l => [l.linkId, l]))

    // Calculate additional fields and get marketing link info
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const firstDeposit = user.deposits[0]
      const totalProfit = user.dailyUpdates.reduce((sum, update) => sum + update.amount, 0)
      
      // Find marketing link for this user by linkId stored in utmParams
      let marketingLink = null
      if (user.utmParams) {
        // Check if utmParams contains a linkId (mk_...)
        const linkIdMatch = user.utmParams.match(/mk_[a-zA-Z0-9_]+/)
        if (linkIdMatch) {
          marketingLink = linksByLinkId.get(linkIdMatch[0])
        }
      }
      // Also check if user has linkId directly stored
      if (!marketingLink && (user as any).linkId) {
        marketingLink = linksByLinkId.get((user as any).linkId)
      }
      
      // Build linkName from marketing link metadata
      let linkName = null
      if (marketingLink) {
        const parts = [
          marketingLink.trafficerName,
          marketingLink.stream,
          marketingLink.geo,
          marketingLink.creative
        ].filter(Boolean)
        linkName = parts.length > 0 ? parts.join('_') : marketingLink.linkId
      }
      
      return {
        ...user,
        referralCount: user.referrals.length,
        firstDepositAmount: firstDeposit?.amount || 0,
        totalProfit,
        trafficerName: marketingLink?.trafficerName || null,
        linkName: linkName,
        linkId: marketingLink?.linkId || null,
      }
    }))

    // Map to summary format
    const mappedUsers = enrichedUsers.map(u => mapUserSummary(u))
    
    // Re-sort if sorting by computed fields (that weren't sorted in DB)
    const computedFields = ['balance', 'totalDeposit', 'totalWithdraw', 'profit']
    if (computedFields.includes(sortByField)) {
      mappedUsers.sort((a, b) => {
        const aValue = (a as any)[sortByField] || 0
        const bValue = (b as any)[sortByField] || 0
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      })
    }

    return res.json({
      users: mappedUsers,
      count: mappedUsers.length,
      totalCount,
      page: pageNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
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
      include: { 
        user: {
          include: {
            withdrawals: {
              where: { status: 'COMPLETED' },
              select: { id: true },
            },
            dailyUpdates: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    })

    // Get all marketing links to match with users
    const marketingLinks = await prisma.marketingLink.findMany()
    const linksByLinkId = new Map(marketingLinks.map(l => [l.linkId, l]))

    const payload = deposits.map((deposit) => {
      // Determine depStatus based on deposit status
      const depStatus = deposit.status === 'COMPLETED' ? 'paid' : 'processing'
      
      // Determine leadStatus
      let leadStatus: 'FTD' | 'withdraw' | 'reinvest' | 'active' = 'active'
      
      // Check if this is first deposit
      const userDeposits = deposits.filter(d => d.user.telegramId === deposit.user.telegramId && d.status === 'COMPLETED')
      const isFirstDeposit = userDeposits.length > 0 && userDeposits[0].id === deposit.id
      
      if (isFirstDeposit) {
        leadStatus = 'FTD'
      } else if (deposit.user.withdrawals.length > 0) {
        leadStatus = 'withdraw'
      } else if (deposit.user.dailyUpdates.length > 0) {
        leadStatus = 'reinvest'
      }

      // Find marketing link for this user
      let marketingLink = null
      let linkName = null
      if (deposit.user.utmParams) {
        const linkIdMatch = deposit.user.utmParams.match(/mk_[a-zA-Z0-9_]+/)
        if (linkIdMatch) {
          marketingLink = linksByLinkId.get(linkIdMatch[0])
          if (marketingLink) {
            const parts = [
              marketingLink.trafficerName,
              marketingLink.stream,
              marketingLink.geo,
              marketingLink.creative
            ].filter(Boolean)
            linkName = parts.length > 0 ? parts.join('_') : marketingLink.linkId
          }
        }
      }

      return {
        id: deposit.id,
        status: deposit.status,
        paymentMethod: (deposit as any).paymentMethod,
        amount: deposit.amount,
        currency: deposit.currency,
        network: deposit.network,
        txHash: deposit.txHash,
        createdAt: deposit.createdAt,
        user: mapUserSummary(deposit.user),
        depStatus,
        leadStatus,
        trafficSource: deposit.user.marketingSource,
        referralLink: deposit.user.utmParams,
        trafficerName: marketingLink?.trafficerName || null,
        linkName: linkName,
      }
    })

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
      paymentMethod: (withdrawal as any).paymentMethod,
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

const buildDateSeries = (days: number, startDate?: Date) => {
  const map = new Map<string, { date: string; deposits: number; withdrawals: number; profit: number }>()
  const baseDate = startDate ? new Date(startDate) : new Date()
  baseDate.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i)
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

app.get('/api/user/:telegramId', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId
    
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

    // Calculate plan progress based on totalDeposit (working balance)
    const planProgress = calculatePlanProgress(user.totalDeposit)

    res.json({
      id: user.telegramId,
      nickname: user.username || user.firstName || 'User',
      createdAt: user.createdAt,
      status: user.status,
      languageCode: user.languageCode || null,
      balance: user.balance,
      profit: user.profit || 0,
      totalDeposit: user.totalDeposit,
      totalWithdraw: user.totalWithdraw,
      bonusTokens: user.bonusTokens || 0,
      plan: user.plan,
      kycRequired: user.kycRequired,
      isBlocked: user.isBlocked,
      lastProfitUpdate: user.lastProfitUpdate,
      referralEarnings: user.referralEarnings || 0,
      contactSupportSeen: user.contactSupportSeen || false,
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
app.get('/api/user/:telegramId/notifications', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId
    
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
app.post('/api/user/:telegramId/reinvest', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId
    
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
        plan: calculatePlanProgress(user.totalDeposit + profitAmount).currentPlan
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
app.get('/api/user/:telegramId/referrals', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId

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
app.get('/api/user/:telegramId/daily-updates', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfToday.getDate() + 1)

    const updates = await prisma.dailyProfitUpdate.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: startOfToday,
          lt: startOfTomorrow
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    // Show only updates that have already been applied/notified
    const visibleUpdates = updates.filter((update: any) => update.notified)

    // Calculate total daily profit from visible updates (sum of amounts shown so far)
    const visibleProfit = visibleUpdates.reduce((sum: number, u: any) => sum + u.amount, 0)

    // Get full daily total from any update (all updates have same dailyTotal)
    const fullDailyTotal = updates.length > 0 ? updates[0].dailyTotal : 0

    res.json({
      updates: visibleUpdates,
      totalUpdates: updates.length,
      visibleUpdatesCount: visibleUpdates.length,
      totalProfit: fullDailyTotal, // Full daily profit target
      accruedProfit: visibleProfit  // Profit shown so far
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Reinvest referral earnings to balance
app.post('/api/user/:telegramId/referral-reinvest', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId

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
        plan: calculatePlanProgress(user.totalDeposit + referralAmount).currentPlan
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
app.post('/api/user/:telegramId/create-deposit', depositLimiter, requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId
    const { amount, currency, method } = req.body

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum deposit amount is $10' })
    }

    const paymentMethod = String(method || 'OXAPAY').toUpperCase()

    if (paymentMethod !== 'OXAPAY' && paymentMethod !== 'PAYPAL') {
      return res.status(400).json({ error: 'Invalid payment method' })
    }

    if (paymentMethod === 'PAYPAL') {
      // Check if PayPal is configured
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        console.error('❌ PayPal payment method requested but credentials not configured')
        return res.status(503).json({ 
          error: 'PayPal is temporarily unavailable. Please use another payment method or contact support.',
          code: 'PAYPAL_NOT_CONFIGURED'
        })
      }

      // PayPal flow: create deposit record, then create PayPal order.
      const deposit = await prisma.deposit.create({
        data: {
          userId: user.id,
          amount,
          status: 'PENDING',
          currency: 'USD',
          paymentMethod: 'PAYPAL',
        }
      })

      const returnUrl = process.env.PAYPAL_RETURN_URL || process.env.TELEGRAM_APP_URL || process.env.WEBAPP_URL || 'https://syntrix.website'
      const cancelUrl = process.env.PAYPAL_CANCEL_URL || returnUrl

      const { createPayPalOrder } = await import('./paypal.js')
      const order = await createPayPalOrder({
        amount,
        currency: 'USD',
        returnUrl,
        cancelUrl,
        customId: String(deposit.id),
        description: `Deposit for ${user.username || user.telegramId}`
      })

      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          txHash: order.id,
          trackId: order.id,
        }
      })

      return res.json({
        success: true,
        depositId: deposit.id,
        method: 'PAYPAL',
        paypalOrderId: order.id,
        paymentUrl: order.approveUrl,
      })
    }

    // OxaPay flow (existing)
    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' })
    }

    // Import OxaPay service
    const { createInvoice } = await import('./oxapay.js')
    
    // Get callback URL from environment or use Railway URL
    const callbackUrl = process.env.WEBHOOK_URL 
      ? `${process.env.WEBHOOK_URL.startsWith('http') ? process.env.WEBHOOK_URL : `https://${process.env.WEBHOOK_URL}`}/api/oxapay-callback`
      : 'https://api.syntrix.website/api/oxapay-callback'
    
    // Create invoice with amount in USD and selected crypto as payCurrency
    const invoice = await createInvoice({
      amount,
      currency: 'USD', // Amount is always in USD
      payCurrency: currency, // BTC, ETH, USDT, etc. - crypto to pay with
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
        paymentMethod: 'OXAPAY',
        txHash: invoice.trackId
      }
    })

    return res.json({
      success: true,
      depositId: deposit.id,
      method: 'OXAPAY',
      trackId: invoice.trackId,
      payLink: invoice.payLink,
      paymentUrl: invoice.payLink,
      qrCode: invoice.qrCode,
      address: invoice.address,
      amount: invoice.amount
    })
  } catch (error: any) {
    console.error('API Error:', error)
    
    // Enhanced PayPal error logging
    if (error.response?.data) {
      const paypalError = error.response.data
      console.error('PayPal Error Details:', {
        name: paypalError.name,
        message: paypalError.message,
        debug_id: paypalError.debug_id,
        details: paypalError.details,
        headers: error.response.headers?.['paypal-debug-id']
      })
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Capture PayPal order and complete deposit
app.post('/api/user/:telegramId/paypal-capture', depositLimiter, requireUserAuth, async (req, res) => {
  try {
    const telegramId = (req as any).verifiedTelegramId
    const { orderId } = req.body

    if (!orderId) return res.status(400).json({ error: 'orderId is required' })

    const user = await prisma.user.findUnique({ where: { telegramId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const deposit = await prisma.deposit.findFirst({
      where: {
        userId: user.id,
        paymentMethod: 'PAYPAL',
        txHash: String(orderId),
      },
      include: { user: true },
    })

    if (!deposit) return res.status(404).json({ error: 'Deposit not found' })
    if (deposit.status === 'COMPLETED') return res.json({ success: true, status: 'COMPLETED' })

    const { capturePayPalOrder } = await import('./paypal.js')
    const capture = await capturePayPalOrder(String(orderId))

    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ error: `Payment not completed. PayPal status: ${capture.status}` })
    }

    // Optional amount validation (best-effort)
    if (typeof capture.amountValue === 'number' && Math.abs(capture.amountValue - deposit.amount) > 0.01) {
      return res.status(400).json({ error: 'Amount mismatch' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: deposit.id },
        data: { status: 'COMPLETED' },
      })

      await tx.user.update({
        where: { id: deposit.userId },
        data: {
          totalDeposit: { increment: deposit.amount },
          lifetimeDeposit: { increment: deposit.amount },
          status: deposit.user.status === 'INACTIVE' ? 'ACTIVE' : undefined,
        },
      })
    })

    const updatedUser = await prisma.user.findUnique({ where: { id: deposit.userId } })
    if (!updatedUser) return res.status(500).json({ error: 'Failed to update user' })

    // Reuse the same notification logic as OxaPay callback (simplified)
    try {
      const { bot: botInstance } = await import('./index.js')
      const planInfo = calculateTariffPlan(updatedUser.totalDeposit)
      await botInstance.api.sendMessage(
        deposit.user.telegramId,
        `✅ *Deposit Successful!*\n\n` +
          `💰 Amount: $${deposit.amount.toFixed(2)} USD\n` +
          `💳 New Deposit: $${updatedUser.totalDeposit.toFixed(2)}\n\n` +
          `📈 *Plan:* ${planInfo.currentPlan} (${planInfo.dailyPercent}% daily)`,
        { parse_mode: 'Markdown' }
      )
    } catch (err) {
      console.error('Failed to notify user about PayPal deposit:', err)
    }

    try {
      const { notifySupport } = await import('./index.js')
      const escapedUsername = (deposit.user.username || 'no_username').replace(/_/g, '\\_')
      await notifySupport(
        `💰 *New Deposit Received (PayPal)*\n\n` +
          `👤 User: @${escapedUsername} (ID: ${deposit.user.telegramId})\n` +
          `💵 Amount: $${deposit.amount.toFixed(2)} USD\n` +
          `🧾 Order ID: ${deposit.txHash}`,
        { parse_mode: 'Markdown' }
      )
    } catch (err) {
      console.error('Failed to notify support team about PayPal deposit:', err)
    }

    return res.json({ success: true, status: 'COMPLETED' })
  } catch (error: any) {
    console.error('PayPal capture error:', error)
    
    // Enhanced PayPal error logging
    if (error.response?.data) {
      const paypalError = error.response.data
      console.error('PayPal Capture Error Details:', {
        name: paypalError.name,
        message: paypalError.message,
        debug_id: paypalError.debug_id,
        details: paypalError.details,
        headers: error.response.headers?.['paypal-debug-id']
      })
    }
    
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// PayPal Webhook Handler - автоматическое пополнение без кнопки Confirm
app.post('/api/paypal-webhook', async (req, res) => {
  try {
    console.log('📨 PayPal Webhook received')
    
    // Body is already parsed by express.json()
    const body = req.body
    
    const eventType = body.event_type
    const resource = body.resource
    
    console.log('Webhook event type:', eventType)
    console.log('Webhook resource ID:', resource?.id)
    
    // Handle order approval and capture
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = resource?.id
      
      if (!orderId) {
        console.error('❌ No order ID in webhook')
        return res.sendStatus(400)
      }
      
      console.log(`✅ Order ${orderId} approved, attempting auto-capture...`)
      
      // Find the deposit by order ID
      const deposit = await prisma.deposit.findFirst({
        where: {
          paymentMethod: 'PAYPAL',
          txHash: orderId,
          status: 'PENDING'
        },
        include: { user: true }
      })
      
      if (!deposit) {
        console.log(`⚠️  No pending deposit found for order ${orderId}`)
        return res.sendStatus(200) // Still return 200 to acknowledge webhook
      }
      
      // Auto-capture the payment
      try {
        const { capturePayPalOrder } = await import('./paypal.js')
        const capture = await capturePayPalOrder(orderId)
        
        if (capture.status === 'COMPLETED') {
          console.log(`✅ Payment captured successfully for order ${orderId}`)
          
          // Update deposit and user balance
          await prisma.$transaction(async (tx) => {
            await tx.deposit.update({
              where: { id: deposit.id },
              data: { status: 'COMPLETED' }
            })
            
            await tx.user.update({
              where: { id: deposit.userId },
              data: {
                totalDeposit: { increment: deposit.amount },
                lifetimeDeposit: { increment: deposit.amount },
                status: deposit.user.status === 'INACTIVE' ? 'ACTIVE' : undefined
              }
            })
          })
          
          const updatedUser = await prisma.user.findUnique({ where: { id: deposit.userId } })
          
          // Notify user
          try {
            const { bot: botInstance } = await import('./index.js')
            const planInfo = calculateTariffPlan(updatedUser!.totalDeposit)
            await botInstance.api.sendMessage(
              deposit.user.telegramId,
              `✅ *Deposit Successful!*\n\n` +
                `💰 Amount: $${deposit.amount.toFixed(2)} USD\n` +
                `💳 New Balance: $${updatedUser!.totalDeposit.toFixed(2)}\n\n` +
                `📈 *Plan:* ${planInfo.currentPlan} (${planInfo.dailyPercent}% daily)`,
              { parse_mode: 'Markdown' }
            )
          } catch (err) {
            console.error('Failed to notify user:', err)
          }
          
          // Notify support
          try {
            const { notifySupport } = await import('./index.js')
            const escapedUsername = (deposit.user.username || 'no_username').replace(/_/g, '\\_')
            await notifySupport(
              `💰 *New Deposit (PayPal - Auto)*\n\n` +
                `👤 User: @${escapedUsername} (ID: ${deposit.user.telegramId})\n` +
                `💵 Amount: $${deposit.amount.toFixed(2)} USD\n` +
                `🧾 Order ID: ${orderId}`,
              { parse_mode: 'Markdown' }
            )
          } catch (err) {
            console.error('Failed to notify support:', err)
          }
          
          console.log(`🎉 Deposit completed automatically for user ${deposit.user.telegramId}`)
        }
      } catch (captureError) {
        console.error('❌ Failed to auto-capture payment:', captureError)
      }
    }
    
    // Also handle PAYMENT.CAPTURE.COMPLETED as backup
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = resource?.supplementary_data?.related_ids?.order_id
      
      if (orderId) {
        console.log(`✅ Payment capture completed for order ${orderId}`)
        
        const deposit = await prisma.deposit.findFirst({
          where: {
            paymentMethod: 'PAYPAL',
            txHash: orderId,
            status: 'PENDING'
          },
          include: { user: true }
        })
        
        if (deposit) {
          await prisma.$transaction(async (tx) => {
            await tx.deposit.update({
              where: { id: deposit.id },
              data: { status: 'COMPLETED' }
            })
            
            await tx.user.update({
              where: { id: deposit.userId },
              data: {
                totalDeposit: { increment: deposit.amount },
                lifetimeDeposit: { increment: deposit.amount },
                status: deposit.user.status === 'INACTIVE' ? 'ACTIVE' : undefined
              }
            })
          })
          
          console.log(`🎉 Deposit completed via CAPTURE event for user ${deposit.user.telegramId}`)
        }
      }
    }
    
    res.sendStatus(200)
  } catch (error) {
    console.error('❌ PayPal webhook error:', error)
    res.sendStatus(500)
  }
})

// Create withdrawal request
app.post('/api/user/:telegramId/create-withdrawal', withdrawalLimiter, requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId
    const { amount, currency, address, network, method, paypalEmail } = req.body

    // Check for duplicate request (race condition protection)
    const requestKey = `${telegramId}_${amount}_${address}`
    if (pendingWithdrawalRequests.has(requestKey)) {
      console.log(`⚠️ Duplicate withdrawal request blocked for ${telegramId}: $${amount}`)
      return res.status(429).json({ error: 'Withdrawal request already in progress. Please wait.' })
    }
    
    // Add to pending requests
    pendingWithdrawalRequests.add(requestKey)
    
    // Auto-remove from pending after 30 seconds (cleanup)
    setTimeout(() => {
      pendingWithdrawalRequests.delete(requestKey)
    }, 30000)

    const user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      pendingWithdrawalRequests.delete(requestKey)
      return res.status(404).json({ error: 'User not found' })
    }

    if (!amount || amount < 10) {
      pendingWithdrawalRequests.delete(requestKey)
      return res.status(400).json({ error: 'Minimum withdrawal amount is $10' })
    }

    // Available balance = totalDeposit + profit (bonus tokens cannot be withdrawn)
    const availableBalance = user.totalDeposit + (user.profit || 0)
    if (amount > availableBalance) {
      pendingWithdrawalRequests.delete(requestKey)
      return res.status(400).json({ error: 'Insufficient balance. Bonus tokens cannot be withdrawn.' })
    }

    const paymentMethod = String(method || 'OXAPAY').toUpperCase()
    if (paymentMethod !== 'OXAPAY' && paymentMethod !== 'PAYPAL') {
      pendingWithdrawalRequests.delete(requestKey)
      return res.status(400).json({ error: 'Invalid payment method' })
    }

    // Normalize required fields per method
    let normalizedCurrency = currency
    let normalizedNetwork = network
    let normalizedAddress = address
    let normalizedPaypalEmail: string | null = null

    if (paymentMethod === 'PAYPAL') {
      const email = String(paypalEmail || '').trim()
      if (!email || !email.includes('@')) {
        pendingWithdrawalRequests.delete(requestKey)
        return res.status(400).json({ error: 'PayPal email is required' })
      }
      normalizedPaypalEmail = email
      normalizedCurrency = 'USD'
      normalizedNetwork = 'PAYPAL'
      normalizedAddress = email
    } else {
      if (!normalizedAddress || !normalizedCurrency) {
        pendingWithdrawalRequests.delete(requestKey)
        return res.status(400).json({ error: 'Address and currency are required' })
      }
      normalizedNetwork = normalizedNetwork || 'TRC20'
    }

    // Get client IP address from request
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 
                     req.headers['x-real-ip']?.toString() || 
                     req.ip || 
                     req.socket.remoteAddress || 
                     'unknown'

    // Collect metadata from request
    const userAgent = req.headers['user-agent'] || null
    const language = req.headers['accept-language']?.split(',')[0] || null
    const referrerHeader = req.headers['referer'] || req.headers['referrer']
    const referrer = typeof referrerHeader === 'string' ? referrerHeader : (Array.isArray(referrerHeader) ? referrerHeader[0] : null)
    
    // Get additional metadata from request body (sent from frontend)
    const deviceFingerprint = req.body.deviceFingerprint || null
    const screenResolution = req.body.screenResolution || null
    const clientTimezone = req.body.timezone || null

    // Get IP geolocation data
    const geoData = await getIpGeoData(clientIp)

    // Calculate account statistics
    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
    const previousWithdrawals = await prisma.withdrawal.count({
      where: { userId: user.id, status: 'COMPLETED' }
    })
    
    const lastDeposit = await prisma.deposit.findFirst({
      where: { userId: user.id, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' }
    })
    
    const hoursSinceLastDeposit = lastDeposit 
      ? (Date.now() - lastDeposit.createdAt.getTime()) / (1000 * 60 * 60)
      : null
    
    const depositToWithdrawRatio = user.totalDeposit > 0 ? amount / user.totalDeposit : null
    const percentOfBalance = availableBalance > 0 ? (amount / availableBalance) * 100 : null
    
    // Check if IP changed since registration
    const ipChanged = user.ipAddress && user.ipAddress !== clientIp ? true : false

    // Create withdrawal record with all metadata
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount,
        status: 'PENDING',
        paymentMethod,
        currency: normalizedCurrency,
        address: normalizedAddress,
        network: normalizedNetwork,
        paypalEmail: normalizedPaypalEmail,
        ipAddress: clientIp,
        userAgent,
        country: geoData.country,
        city: geoData.city,
        isp: geoData.isp,
        timezone: clientTimezone || geoData.timezone,
        language,
        referrer,
        deviceFingerprint,
        screenResolution,
        isVpnProxy: geoData.isVpnProxy,
        accountAge,
        previousWithdrawals,
        depositToWithdrawRatio,
        hoursSinceLastDeposit,
        percentOfBalance,
        ipChanged
      }
    })

    // ALL withdrawals now require admin approval
    // Deduct balance immediately (reserve funds) and set status to PROCESSING
    const { bot, notifySupport } = await import('./index.js')
    
    console.log(`💰 Withdrawal ${withdrawal.id} for $${amount} requires approval. Reserving funds...`)
    
    // Calculate how much to deduct from profit vs totalDeposit
    const profitToDeduct = Math.min(user.profit || 0, amount)
    const depositToDeduct = amount - profitToDeduct
    const newDeposit = user.totalDeposit - depositToDeduct
    
    // STEP 1: Deduct from profit first, then totalDeposit (reserve funds)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profit: { decrement: profitToDeduct },
        totalDeposit: { decrement: depositToDeduct },
        totalWithdraw: { increment: amount }
      }
    })
    
    // STEP 2: Update withdrawal status to PROCESSING
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: 'PROCESSING' }
    })
    
    console.log(`✅ Funds reserved. New deposit: $${newDeposit.toFixed(2)}`)
    
    const username = (user.username || 'no_username').replace(/_/g, '\\_')
    const adminMessage = `🔔 *Withdrawal Request - Requires Approval*\n\n` +
      `👤 User: @${username} (ID: ${user.telegramId})\n` +
      `💰 Amount: $${amount.toFixed(2)}\n` +
      `💳 Method: ${paymentMethod}\n` +
      `💎 Currency: ${normalizedCurrency}\n` +
      `🌐 Network: ${normalizedNetwork}\n` +
      `📍 Address: \`${normalizedAddress}\`\n\n` +
      `💳 Previous Deposit: $${user.totalDeposit.toFixed(2)}\n` +
      `💳 New Deposit: $${newDeposit.toFixed(2)}\n` +
      `✅ Funds have been reserved\n\n` +
      `🆔 Withdrawal ID: ${withdrawal.id}`
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Approve & Process', callback_data: `approve_withdrawal_${withdrawal.id}` },
          { text: '❌ Reject', callback_data: `reject_withdrawal_${withdrawal.id}` }
        ],
        [
          { text: '📊 Подробнее', callback_data: `withdrawal_details_${withdrawal.id}` }
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
        `💳 Method: ${paymentMethod}\n` +
        `💎 Currency: ${normalizedCurrency}\n` +
        `🌐 Network: ${normalizedNetwork}\n` +
        `📍 Address: \`${normalizedAddress}\`\n\n` +
        `📋 Your withdrawal request has been sent to admin for approval.\n` +
        `⏱ This usually takes a few minutes.\n\n` +
        `✅ Funds have been reserved from your deposit\n` +
        `💳 New deposit: $${newDeposit.toFixed(2)}\n\n` +
        `ℹ️ If rejected, funds will be returned to your account.`,
        { parse_mode: 'Markdown' }
      )
    } catch (err) {
      console.error('Failed to notify user:', err)
    }

    // Clear pending request key
    pendingWithdrawalRequests.delete(requestKey)
    
    return res.json({
      success: true,
      withdrawalId: withdrawal.id,
      status: 'PROCESSING',
      message: 'Withdrawal request sent to admin for approval. Funds have been reserved.',
      newBalance: newDeposit
    })
  } catch (error: any) {
    console.error('❌ Withdrawal API Error:', error)
    
    // Clear pending request key on error
    const requestKey = `${req.params.telegramId}_${req.body.amount}_${req.body.address || req.body.paypalEmail || ''}`
    pendingWithdrawalRequests.delete(requestKey)
    
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
app.get('/api/user/:telegramId/transactions', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId

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
        network: d.network,
        status: d.status,
        paymentMethod: d.paymentMethod,
        address: d.txHash,
        txHash: d.txHash,
        trackId: d.trackId,
        createdAt: d.createdAt
      })),
      ...user.withdrawals.map((w: any) => ({
        id: `withdrawal_${w.id}`,
        type: 'WITHDRAWAL',
        amount: w.amount,
        currency: w.currency,
        network: w.network,
        status: w.status,
        paymentMethod: w.paymentMethod,
        address: w.address,
        txHash: w.txHash,
        trackId: w.trackId,
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
    
    const { trackId, status, orderid, amount, txID, type } = req.body
    
    // SECURITY: Validate required fields
    if (!trackId) {
      console.error('⚠️ Missing trackId in callback')
      return res.status(400).json({ success: false, error: 'Missing trackId' })
    }
    
    // Check if this is a payout (withdrawal) callback
    if (type === 'payout' || req.body.hasOwnProperty('payoutId')) {
      console.log('💸 Processing payout callback')
      
      // Find withdrawal by txHash
      const withdrawal = await prisma.withdrawal.findFirst({
        where: { 
          txHash: trackId
        },
        include: { user: true }
      })

      if (!withdrawal) {
        console.log(`⚠️ Withdrawal not found for trackId: ${trackId}`)
        return res.json({ success: false, error: 'Withdrawal not found' })
      }
      
      // SECURITY: Prevent status downgrade - only allow PENDING/PROCESSING -> COMPLETED
      if (withdrawal.status === 'COMPLETED') {
        console.log(`✓ Withdrawal already completed: ${trackId}`)
        return res.json({ success: true, message: 'Already processed' })
      }

      // Update withdrawal with real blockchain transaction hash
      if (txID && txID.length === 64) {
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: { 
            txHash: txID,
            status: status === 'Paid' || status === 'paid' ? 'COMPLETED' : withdrawal.status
          }
        })
        console.log(`✅ Withdrawal ${withdrawal.id} updated with blockchain hash: ${txID}`)
        
        // Notify user about blockchain confirmation
        if (status === 'Paid' || status === 'paid') {
          try {
            const { bot: botInstance } = await import('./index.js')
            await botInstance.api.sendMessage(
              withdrawal.user.telegramId,
              `✅ *Withdrawal Confirmed in Blockchain!*\n\n` +
              `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
              `💎 Currency: ${withdrawal.currency}\n` +
              `🌐 Network: ${withdrawal.network}\n` +
              `🔗 TX Hash: \`${txID}\`\n\n` +
              `You can track your transaction in blockchain explorer.`,
              { parse_mode: 'Markdown' }
            )
          } catch (err) {
            console.error('Failed to notify user about withdrawal:', err)
          }
        }
      }
      
      return res.json({ success: true })
    }
    
    // Original deposit processing logic
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
    
    // SECURITY: Verify amount matches (if provided in callback)
    if (amount && Math.abs(parseFloat(amount) - deposit.amount) > 0.01) {
      console.error(`⚠️ Amount mismatch for trackId ${trackId}: callback=${amount}, expected=${deposit.amount}`)
      return res.status(400).json({ success: false, error: 'Amount mismatch' })
    }

    // SECURITY: Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update deposit status to COMPLETED
      await tx.deposit.update({
        where: { id: deposit.id },
        data: { status: 'COMPLETED' }
      })

      // Add amount to user totalDeposit and activate account if needed
      await tx.user.update({
        where: { id: deposit.userId },
        data: {
          totalDeposit: { increment: deposit.amount },
          lifetimeDeposit: { increment: deposit.amount },
          status: deposit.user.status === 'INACTIVE' ? 'ACTIVE' : undefined
        }
      })
    })
    
    // Fetch updated user data after transaction
    const updatedUser = await prisma.user.findUnique({
      where: { id: deposit.userId }
    })
    
    if (!updatedUser) {
      console.error('Failed to fetch updated user')
      return res.status(500).json({ success: false, error: 'Failed to update user' })
    }

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
    
    // Calculate plan info for user based on totalDeposit
    const planInfo = calculateTariffPlan(updatedUser.totalDeposit)
    const progressBar = '█'.repeat(Math.floor(planInfo.progress / 10)) + '░'.repeat(10 - Math.floor(planInfo.progress / 10))
    
    // Notify user about successful deposit
    try {
      const { bot: botInstance } = await import('./index.js')
      
      let userMessage = `✅ *Deposit Successful!*\n\n`
      userMessage += `💰 Amount: $${deposit.amount.toFixed(2)} ${deposit.currency}\n`
      userMessage += `💳 New Deposit: $${updatedUser.totalDeposit.toFixed(2)}\n\n`
      
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
      const escapedUsername = (deposit.user.username || 'no_username').replace(/_/g, '\\_')
      
      await notifySupport(
        `💰 *New Deposit Received*\n\n` +
        `👤 User: @${escapedUsername} (ID: ${deposit.user.telegramId})\n` +
        `💵 Amount: $${deposit.amount.toFixed(2)}\n` +
        `💎 Currency: ${deposit.currency}\n` +
        `📊 Total Deposited: $${(updatedUser.lifetimeDeposit || updatedUser.totalDeposit).toFixed(2)}\n` +
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

const DEFAULT_LANDING_DOMAIN = 'syntrix.website'

const normalizeDomain = (domain?: string | null) => {
  if (!domain) return DEFAULT_LANDING_DOMAIN
  const trimmed = domain.trim()
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '')
  const withoutTrailingSlash = withoutProtocol.replace(/\/+$/, '')
  return withoutTrailingSlash || DEFAULT_LANDING_DOMAIN
}

const buildMarketingLinkUrl = (domain: string | null | undefined, linkId: string) => {
  const cleanDomain = normalizeDomain(domain)
  return `https://${cleanDomain}/?ref=${linkId}`
}

// Public: fetch tracking pixel HTML for a marketing link.
// Used by the landing page to inject per-link pixels (Google Tag, Meta Pixel, etc.).
app.get('/api/marketing-links/:linkId/pixel', async (req, res) => {
  try {
    const { linkId } = req.params
    if (!linkId) return res.status(400).json({ error: 'linkId is required' })

    const link = await prisma.marketingLink.findUnique({
      where: { linkId }
    })

    if (!link || !link.isActive) {
      return res.json({ trackingPixel: null })
    }

    const trackingPixel = (link.trackingPixel || '').trim()
    return res.json({ trackingPixel: trackingPixel.length > 0 ? trackingPixel : null })
  } catch (error) {
    console.error('Get marketing link pixel error:', error)
    return res.status(500).json({ error: 'Failed to load tracking pixel' })
  }
})

// Create marketing link
app.post('/api/admin/marketing-links', requireAdminAuth, async (req, res) => {
  try {
    const { source, utmParams, trafficerName, stream, geo, creative, language, domain, trackingPixel } = req.body
    
    if (!source) {
      return res.status(400).json({ error: 'Source is required' })
    }

    const normalizedDomain = normalizeDomain(domain)
    
    // Generate unique linkId
    const linkId = `mk_${source}_${Date.now().toString(36)}`
    
    const link = await prisma.marketingLink.create({
      data: {
        linkId,
        source,
        utmParams: utmParams ? JSON.stringify(utmParams) : null,
        trafficerName: trafficerName || null,
        stream: stream || null,
        geo: geo || null,
        creative: creative || null,
        language: language || 'EN',
        domain: normalizedDomain,
        trackingPixel: trackingPixel || null
      }
    })
    
    return res.json({
      ...link,
      linkUrl: buildMarketingLinkUrl(normalizedDomain, linkId)
    })
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
    
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Calculate metrics for each link
    const enrichedLinks = await Promise.all(links.map(async (link) => {
      // Get users from this link (by exact linkId stored in utmParams)
      // Note: utmParams now stores the exact linkId (mk_...) for marketing links
      const users = await prisma.user.findMany({
        where: {
          utmParams: link.linkId,
          isHidden: false
        },
        include: {
          deposits: {
            where: { status: 'COMPLETED' }
          },
          withdrawals: {
            where: { status: 'COMPLETED' }
          }
        }
      })
      
      // Leads = users WITHOUT IP (only pressed /start in bot, didn't open mini-app)
      const leads = users.filter(u => !u.ipAddress)
      const totalLeads = leads.length
      
      // Users = users WITH IP (opened mini-app)
      const appUsers = users.filter(u => u.ipAddress)
      const totalUsers = appUsers.length
      
      // Leads today (without IP)
      const leadsToday = leads.filter(u => u.createdAt >= startOfToday).length
      
      // Leads this week (without IP)
      const leadsWeek = leads.filter(u => u.createdAt >= startOfWeek).length
      
      // Users today (with IP)
      const usersToday = appUsers.filter(u => u.createdAt >= startOfToday).length
      
      // Users this week (with IP)
      const usersWeek = appUsers.filter(u => u.createdAt >= startOfWeek).length
      
      // Users with first deposit (FTD) - only count users who opened app
      const usersWithDeposits = appUsers.filter(u => u.deposits.length > 0)
      const ftdCount = usersWithDeposits.length
      
      // Total deposits count and amount
      const allDeposits = users.flatMap(u => u.deposits)
      const totalDeposits = allDeposits.length
      const totalDepositAmount = allDeposits.reduce((sum, d) => sum + d.amount, 0)
      
      // Total withdrawals amount
      const allWithdrawals = users.flatMap(u => u.withdrawals)
      const totalWithdrawalAmount = allWithdrawals.reduce((sum, w) => sum + w.amount, 0)
      
      // Total profit (sum of user profits)
      const totalProfit = users.reduce((sum, u) => sum + u.profit, 0)
      
      // Deposit conversion rate (FTD / Total Users * 100) - based on app users, not leads
      const depositConversionRate = totalUsers > 0 ? Number(((ftdCount / totalUsers) * 100).toFixed(2)) : 0
      
      // CFPD (Cost per First Deposit)
      const cfpd = ftdCount > 0 ? Number((link.trafficCost / ftdCount).toFixed(2)) : 0
      
      // ROI based on Profit vs Traffic Cost: (Profit - Cost) / Cost * 100
      // If no traffic cost, show 0
      const roi = link.trafficCost > 0 ? Number((((totalProfit - link.trafficCost) / link.trafficCost) * 100).toFixed(2)) : 0
      
      return {
        linkId: link.linkId,
        source: link.source,
        domain: normalizeDomain(link.domain),
        linkUrl: buildMarketingLinkUrl(link.domain, link.linkId),
        clicks: link.clicks,
        conversions: link.conversions,
        conversionRate: link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(2) : '0.00',
        isActive: link.isActive,
        createdAt: link.createdAt.toISOString(),
        trackingPixel: link.trackingPixel,
        ownerName: link.trafficerName || 'Unknown',
        linkName: link.source,
        trafficerName: link.trafficerName,
        stream: link.stream,
        geo: link.geo,
        creative: link.creative,
        leadsToday,
        leadsWeek,
        totalLeads,
        usersToday,
        usersWeek,
        totalUsers,
        ftdCount,
        depositConversionRate,
        totalDeposits,
        totalDepositAmount,
        totalWithdrawalAmount,
        totalProfit,
        trafficCost: link.trafficCost,
        cfpd,
        roi
      }
    }))
    
    return res.json({ links: enrichedLinks })
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
        marketingSource: { not: null },
        isHidden: false
      },
      include: {
        deposits: true
      }
    })
  } catch (error) {
    console.error('Get marketing stats error:', error)
    return res.status(500).json({ error: 'Failed to load marketing stats' })
  }
})

// Update marketing link traffic cost
app.patch('/api/admin/marketing-links/:linkId/traffic-cost', requireAdminAuth, async (req, res) => {
  try {
    const { linkId } = req.params
    const { trafficCost } = req.body

    if (typeof trafficCost !== 'number' || trafficCost < 0) {
      return res.status(400).json({ error: 'Invalid traffic cost value' })
    }

    const link = await prisma.marketingLink.update({
      where: { linkId },
      data: { trafficCost }
    })

    return res.json({ success: true, link })
  } catch (error) {
    console.error('Update traffic cost error:', error)
    return res.status(500).json({ error: 'Failed to update traffic cost' })
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

// Get global contact support settings
app.get('/api/settings/contact-support', async (req, res) => {
  try {
    let settings = await prisma.globalSettings.findFirst()

    const DEFAULT_BONUS_AMOUNT = 25
    const DEFAULT_TIMER_MINUTES = 1440 // 1 day
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          // Default: new users get $25 offer for 2 days
          contactSupportEnabled: true,
          contactSupportBonusAmount: DEFAULT_BONUS_AMOUNT,
          contactSupportTimerMinutes: DEFAULT_TIMER_MINUTES
        }
      })
    } else if (
      settings.contactSupportBonusAmount === 0 &&
      settings.contactSupportTimerMinutes === 0
    ) {
      // If settings exist but were never configured, seed sensible defaults
      settings = await prisma.globalSettings.update({
        where: { id: settings.id },
        data: {
          contactSupportEnabled: true,
          contactSupportBonusAmount: DEFAULT_BONUS_AMOUNT,
          contactSupportTimerMinutes: DEFAULT_TIMER_MINUTES,
        },
      })
    }
    
    return res.json(settings)
  } catch (error) {
    console.error('Get contact support settings error:', error)
    return res.status(500).json({ error: 'Failed to get settings' })
  }
})

async function claimContactSupportBonus(telegramId: string) {
  const [settings, user] = await Promise.all([
    prisma.globalSettings.findFirst(),
    prisma.user.findUnique({ where: { telegramId } }),
  ])

  if (!user) {
    const err: any = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  const contactSupportEnabled = settings?.contactSupportEnabled ?? true
  const bonusAmount = settings?.contactSupportBonusAmount ?? 25
  const timerMinutes = settings?.contactSupportTimerMinutes ?? 1440

  if (!contactSupportEnabled || !timerMinutes) {
    const err: any = new Error('Contact support bonus is disabled')
    err.statusCode = 400
    throw err
  }

  // Offer window: user.createdAt -> +timerMinutes
  const offerEndsAt = new Date(user.createdAt.getTime() + timerMinutes * 60 * 1000)
  const now = new Date()
  if (now.getTime() > offerEndsAt.getTime()) {
    const err: any = new Error('Offer expired')
    err.statusCode = 400
    throw err
  }

  // Already claimed: return current user
  if (user.contactSupportSeen) {
    return user
  }

  // Prepare update data
  const updateData: any = {
    contactSupportSeen: true,
    bonusTokens: { increment: bonusAmount },
    contactSupportBonusGrantedAt: now,
    // Bonus becomes permanent after claim; no auto-expiry.
    contactSupportBonusExpiresAt: null,
    contactSupportBonusAmountGranted: bonusAmount,
  }

  // Activate account if it's INACTIVE (bonus token activates the account)
  if (user.status === 'INACTIVE') {
    updateData.status = 'ACTIVE'
  }

  return prisma.user.update({
    where: { telegramId },
    data: updateData,
  })
}

// Update global contact support settings
app.post('/api/admin/settings/contact-support', requireAdminAuth, async (req, res) => {
  try {
    const { enabled, bonusAmount, timerMinutes } = req.body
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid enabled value' })
    }
    
    if (typeof bonusAmount !== 'number' || bonusAmount < 0) {
      return res.status(400).json({ error: 'Invalid bonus amount' })
    }
    
    if (typeof timerMinutes !== 'number' || timerMinutes < 0) {
      return res.status(400).json({ error: 'Invalid timer duration' })
    }
    
    let settings = await prisma.globalSettings.findFirst()
    
    if (settings) {
      settings = await prisma.globalSettings.update({
        where: { id: settings.id },
        data: {
          contactSupportEnabled: enabled,
          contactSupportBonusAmount: bonusAmount,
          contactSupportTimerMinutes: timerMinutes,
          contactSupportActivatedAt: enabled ? new Date() : settings.contactSupportActivatedAt
        }
      })
    } else {
      settings = await prisma.globalSettings.create({
        data: {
          contactSupportEnabled: enabled,
          contactSupportBonusAmount: bonusAmount,
          contactSupportTimerMinutes: timerMinutes,
          contactSupportActivatedAt: enabled ? new Date() : null
        }
      })
    }
    
    return res.json(settings)
  } catch (error) {
    console.error('Update contact support settings error:', error)
    return res.status(500).json({ error: 'Failed to update settings' })
  }
})

// Show contact support to all active users
app.post('/api/admin/contact-support/show-to-active', requireAdminAuth, async (req, res) => {
  try {
    // Reset contactSupportSeen for all users
    const result = await prisma.user.updateMany({
      data: {
        contactSupportSeen: false
      }
    })
    
    return res.json({ message: 'Contact support will be shown to all active users', usersUpdated: result.count })
  } catch (error) {
    console.error('Show to active users error:', error)
    return res.status(500).json({ error: 'Failed to show to active users' })
  }
})

// Disable contact support globally
app.post('/api/admin/contact-support/disable', requireAdminAuth, async (req, res) => {
  try {
    let settings = await prisma.globalSettings.findFirst()
    
    if (settings) {
      settings = await prisma.globalSettings.update({
        where: { id: settings.id },
        data: {
          contactSupportEnabled: false
        }
      })
    }
    
    return res.json({ message: 'Contact support disabled globally', settings })
  } catch (error) {
    console.error('Disable contact support error:', error)
    return res.status(500).json({ error: 'Failed to disable contact support' })
  }
})

// Mark user as seen contact support
app.post('/api/users/:telegramId/contact-support-seen', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId

    // Backwards compatible: treat "seen" as "claim" (SEND)
    const user = await claimContactSupportBonus(telegramId)
    return res.json(user)
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 500
    console.error('Mark/claim contact support error:', error)
    return res.status(statusCode).json({ error: (error as any)?.message || 'Failed to claim bonus' })
  }
})

// Claim contact support bonus explicitly
app.post('/api/users/:telegramId/contact-support-claim', requireUserAuth, async (req, res) => {
  try {
    const telegramId = (req as any).verifiedTelegramId
    const user = await claimContactSupportBonus(telegramId)
    return res.json(user)
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 500
    console.error('Claim contact support error:', error)
    return res.status(statusCode).json({ error: (error as any)?.message || 'Failed to claim bonus' })
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
    app.post('/webhook', async (req, res) => {
      const clientIp = req.ip || req.headers['x-real-ip'] || req.headers['x-forwarded-for']
      console.log(`📥 Webhook request received from ${clientIp}`)

      // Verify secret token (do NOT log secrets)
      const receivedHeader = req.headers['x-telegram-bot-api-secret-token']
      const receivedToken = typeof receivedHeader === 'string'
        ? receivedHeader
        : (Array.isArray(receivedHeader) ? receivedHeader[0] : undefined)

      if (!safeCompare(receivedToken, WEBHOOK_SECRET_TOKEN)) {
        console.error('❌ Invalid webhook secret token')
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      console.log('✅ Token validated, processing webhook...')
      
      // Handle update with grammy
      try {
        await bot.handleUpdate(req.body)
        res.sendStatus(200)
      } catch (error) {
        console.error('Error processing webhook:', error)
        res.sendStatus(500)
      }
    })
    console.log('✅ Webhook handler registered at /webhook with debug logging')
  }
  
  server = app.listen(Number(PORT), BIND_HOST, () => {
    console.log(`🌐 API Server running on http://${BIND_HOST}:${PORT}`)
    
    // Check PayPal configuration
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.warn('⚠️  PayPal is NOT configured - PayPal deposits will be unavailable')
      console.warn('   Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env to enable PayPal payments')
      console.warn('   See PAYPAL_SETUP.md for setup instructions')
    } else {
      const env = (process.env.PAYPAL_ENV || 'live').toLowerCase()
      console.log(`✅ PayPal configured (${env} mode)`)
    }
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
