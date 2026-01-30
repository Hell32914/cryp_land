import express, { type RequestHandler } from 'express'
import cors from 'cors'
import { prisma } from './db.js'
import { claimContactSupportBonus } from './contactSupportBonus.js'
import axios from 'axios'
import { webhookCallback, InputFile } from 'grammy'
import type { Bot } from 'grammy'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
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

export const SUPPORT_WEBHOOK_SECRET_TOKEN = process.env.SUPPORT_WEBHOOK_SECRET_TOKEN || crypto.randomBytes(32).toString('hex')
if (!process.env.SUPPORT_WEBHOOK_SECRET_TOKEN) {
  if (isProduction) {
    throw new Error('❌ SUPPORT_WEBHOOK_SECRET_TOKEN must be set in .env for production!')
  }
  console.warn('⚠️ SUPPORT_WEBHOOK_SECRET_TOKEN not set in .env, using generated token. Add it to .env for persistence.')
  console.log(`Generated SUPPORT_WEBHOOK_SECRET_TOKEN=${SUPPORT_WEBHOOK_SECRET_TOKEN.slice(0, 8)}...${SUPPORT_WEBHOOK_SECRET_TOKEN.slice(-8)}`)
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
  'https://info.syntrix.website',
  'https://ss.syntrix.website',
  'https://road.syntrix.website',
  'https://invest.syntrix.website',
  'https://invests.syntrix.website',
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

const scryptAsync = promisify(crypto.scrypt)

async function hashPassword(password: string, salt?: string) {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, actualSalt, 64)) as Buffer
  return { salt: actualSalt, hash: derived.toString('hex') }
}

async function verifyPassword(password: string, salt: string, expectedHashHex: string) {
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  const expected = Buffer.from(expectedHashHex, 'hex')
  if (expected.length !== derived.length) return false
  return crypto.timingSafeEqual(expected, derived)
}

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
  // Limit per IP+username so failed attempts for an operator don't lock out superadmin.
  // Also skip successful logins so normal usage doesn't consume the quota.
  keyGenerator: (req) => {
    const body: any = (req as any).body
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
    return `${req.ip}:${username}`
  },
  skipSuccessfulRequests: true,
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

function normalizeInviteLink(value: unknown): string | null {
  if (typeof value !== 'string') return null
  let v = value.trim()
  if (!v) return null
  v = v.replace(/^https?:\/\//i, '')
  v = v.replace(/^www\./i, '')
  v = v.replace(/^t\.me\//i, '')
  v = v.replace(/^telegram\.me\//i, '')
  v = v.replace(/\/+$/g, '')
  return v || null
}

function normalizeTelegramChatIdForApi(value: string): string {
  const raw = String(value || '').trim()
  if (!raw) return raw
  if (raw.startsWith('-') || raw.startsWith('@')) return raw
  if (/^\d+$/.test(raw)) return `-100${raw}`
  return raw
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
    const decoded = jwt.verify(token, CRM_JWT_SECRET!) as any

    // Backward-compatible: older CRM tokens used different claim names.
    const usernameCandidate =
      decoded?.username ??
      decoded?.adminUsername ??
      decoded?.login ??
      decoded?.user ??
      decoded?.sub

    const username = typeof usernameCandidate === 'string' ? usernameCandidate : undefined
    if (!username) return res.status(401).json({ error: 'Unauthorized' })

    // Env-based superadmin
    const isEnvAdmin = Boolean(CRM_ADMIN_USERNAME && username && username === CRM_ADMIN_USERNAME)
    if (isEnvAdmin) {
      ;(req as any).adminUsername = username
      ;(req as any).adminRole = 'superadmin'
      return next()
    }

    // DB operator: enforce active & derive role from DB (so disabling/deleting kicks everyone out)
    ;(async () => {
      const operator = await prisma.crmOperator.findUnique({
        where: { username },
        select: { username: true, isActive: true, role: true },
      })

      if (!operator || !operator.isActive) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const role = String(operator.role || 'admin')

      // Support role can ONLY access /api/admin/support/*
      const url = String(req.originalUrl || '')
      if (role === 'support' && !url.startsWith('/api/admin/support')) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      ;(req as any).adminUsername = operator.username
      ;(req as any).adminRole = role
      next()
    })().catch((e) => {
      console.error('Admin auth operator check error:', e)
      return res.status(401).json({ error: 'Unauthorized' })
    })
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

function requireSuperAdmin(req: any, res: any, next: any) {
  const role = String(req.adminRole || '')
  const username = String(req.adminUsername || '')
  const isEnvAdmin = Boolean(CRM_ADMIN_USERNAME && username && username === CRM_ADMIN_USERNAME)
  // Backward-compatible: old tokens may have role='admin' or missing role.
  if (role !== 'superadmin' && role !== 'admin' && !isEnvAdmin) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
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

const crmOperatorCreateSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(128),
  role: z.enum(['admin', 'support', 'tester']).optional(),
})

const crmOperatorSetRoleSchema = z.object({
  role: z.enum(['admin', 'support', 'tester']),
})

const crmOperatorResetPasswordSchema = z.object({
  password: z.string().min(6).max(128),
})

const supportChatsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  // CRM funnel board may need a larger slice to include older chats.
  limit: z.coerce.number().int().min(1).max(10000).optional(),
})

const supportSendMessageSchema = z.object({
  text: z.string().min(1).max(4096),
  replyToId: z.coerce.number().int().positive().optional(),
  adminUsername: z.string().optional(),
})

const supportSendPhotoSchema = z.object({
  caption: z.string().max(1024).optional(),
  replyToId: z.coerce.number().int().positive().optional(),
  adminUsername: z.string().optional(),
})

const supportNoteSchema = z.object({
  text: z.string().min(1).max(5000),
})

const supportSetStageSchema = z.object({
  stageId: z.string().trim().min(1).max(64),
})

const supportBroadcastCreateSchema = z.object({
  target: z.enum(['ALL', 'STAGE']),
  stageId: z.string().min(1).max(64).optional(),
  text: z.string().max(4096).optional(),
})

function canonicalizeSupportStageId(value?: string | null): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null
  if (raw === '__unknown_stage__') return null
  const normalized = raw
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0400-\u04ff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return normalized || null
}

app.post('/api/admin/login', loginLimiter, (req, res) => {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({ error: 'Admin auth is not configured' })
  }

  const parseResult = loginSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const { username, password } = parseResult.data

  // 1) Superadmin (env-based) login
  const isValidUser = safeCompare(username, CRM_ADMIN_USERNAME)
  const isValidPassword = safeCompare(password, CRM_ADMIN_PASSWORD)
  if (isValidUser && isValidPassword) {
    const token = jwt.sign(
      {
        username,
        role: 'superadmin',
      },
      CRM_JWT_SECRET!,
      { expiresIn: ADMIN_TOKEN_EXPIRATION }
    )
    return res.json({ token })
  }

  // 2) Operator login (DB)
  ;(async () => {
    const operator = await prisma.crmOperator.findUnique({ where: { username } })
    if (!operator || !operator.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const ok = await verifyPassword(password, operator.passwordSalt, operator.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      {
        username: operator.username,
        role: operator.role || 'admin',
      },
      CRM_JWT_SECRET!,
      { expiresIn: ADMIN_TOKEN_EXPIRATION }
    )
    return res.json({ token })
  })().catch((e) => {
    console.error('Operator login error:', e)
    return res.status(500).json({ error: 'Failed to login' })
  })
})

// ============= CRM OPERATORS (SUPERADMIN ONLY) =============

app.get('/api/admin/operators', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const operators = await prisma.crmOperator.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true, updatedAt: true },
      take: 500,
    })
    return res.json({ operators })
  } catch (error) {
    console.error('CRM operators list error:', error)
    return res.status(500).json({ error: 'Failed to fetch operators' })
  }
})

app.post('/api/admin/operators', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const parsed = crmOperatorCreateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid operator payload' })

    const username = parsed.data.username.trim()
    const password = parsed.data.password
    const role = parsed.data.role ?? 'admin'

    const existing = await prisma.crmOperator.findUnique({ where: { username } })
    if (existing) return res.status(409).json({ error: 'Username already exists' })

    const { salt, hash } = await hashPassword(password)
    const created = await prisma.crmOperator.create({
      data: {
        username,
        passwordSalt: salt,
        passwordHash: hash,
        role,
        isActive: true,
      },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    })

    return res.json(created)
  } catch (error) {
    console.error('CRM operator create error:', error)
    return res.status(500).json({ error: 'Failed to create operator' })
  }
})

app.post('/api/admin/operators/:id/reset-password', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const parsed = crmOperatorResetPasswordSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })

    const { salt, hash } = await hashPassword(parsed.data.password)
    const updated = await prisma.crmOperator.update({
      where: { id },
      data: { passwordSalt: salt, passwordHash: hash },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    })
    return res.json(updated)
  } catch (error) {
    console.error('CRM operator password reset error:', error)
    return res.status(500).json({ error: 'Failed to reset password' })
  }
})

app.post('/api/admin/operators/:id/toggle', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const existing = await prisma.crmOperator.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const updated = await prisma.crmOperator.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    })

    // If the operator is disabled, release any chats they were handling.
    if (!updated.isActive) {
      await prisma.supportChat.updateMany({
        where: {
          acceptedBy: updated.username,
          NOT: { status: 'ARCHIVE' },
        },
        data: {
          status: 'NEW',
          acceptedBy: null,
          acceptedAt: null,
        },
      })
    }

    return res.json(updated)
  } catch (error) {
    console.error('CRM operator toggle error:', error)
    return res.status(500).json({ error: 'Failed to update operator' })
  }
})

app.delete('/api/admin/operators/:id', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const existing = await prisma.crmOperator.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    // Release all chats assigned to this operator (move back to unaccepted).
    await prisma.supportChat.updateMany({
      where: {
        acceptedBy: existing.username,
        NOT: { status: 'ARCHIVE' },
      },
      data: {
        status: 'NEW',
        acceptedBy: null,
        acceptedAt: null,
      },
    })

    await prisma.crmOperator.delete({ where: { id } })
    return res.json({ success: true })
  } catch (error) {
    console.error('CRM operator delete error:', error)
    return res.status(500).json({ error: 'Failed to delete operator' })
  }
})

app.patch('/api/admin/operators/:id/role', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const parsed = crmOperatorSetRoleSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })

    const updated = await prisma.crmOperator.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    })
    return res.json(updated)
  } catch (error) {
    console.error('CRM operator role update error:', error)
    return res.status(500).json({ error: 'Failed to update operator role' })
  }
})

// ============= SUPPORT INBOX (CRM) =============
// IMPORTANT: these endpoints are for CRM admins only.
// They use separate tables SupportChat/SupportMessage.

let supportBotInstance: Bot | undefined

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Telegram Bot API allows up to ~10MB for photos; keep conservative
    fileSize: 10 * 1024 * 1024,
  },
})

app.get('/api/admin/support/chats', requireAdminAuth, async (req, res) => {
  try {
    // Self-heal: some legacy/buggy records may end up ACCEPTED without a funnel stage.
    // Per business rules, such chats should be treated as unaccepted and default to Primary contact.
    await prisma.supportChat.updateMany({
      where: {
        AND: [
          { NOT: { status: 'ARCHIVE' } },
          {
            OR: [
              { status: { in: ['ACCEPTED', 'TAKEN', 'IN_PROGRESS', 'ASSIGNED'] } },
              { acceptedBy: { not: null } },
              { acceptedAt: { not: null } },
            ],
          },
          { OR: [{ funnelStageId: null }, { funnelStageId: '' }] },
        ],
      },
      data: {
        status: 'NEW',
        acceptedBy: null,
        acceptedAt: null,
        archivedAt: null,
        funnelStageId: 'primary',
      },
    })

    const parsed = supportChatsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query' })
    }

    const { search, page = 1, limit = 50 } = parsed.data
    const where = search
      ? {
          OR: [
            { telegramId: { contains: search, mode: 'insensitive' as const } },
            { chatId: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    const skip = (page - 1) * limit
    const [totalCount, chatsRaw] = await Promise.all([
      prisma.supportChat.count({ where }),
      prisma.supportChat.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
    ])

    // Normalize stage ids to avoid UI splits like "Deposit" vs "deposit".
    const chats = chatsRaw.map((c: any) => {
      const sid = canonicalizeSupportStageId(c.funnelStageId)
      return sid && sid !== c.funnelStageId ? { ...c, funnelStageId: sid } : c
    })

    const totalPages = Math.max(1, Math.ceil(totalCount / limit))

    return res.json({
      chats,
      page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    })
  } catch (error) {
    console.error('Support chats fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch support chats' })
  }
})

app.get('/api/admin/support/chats/:chatId/messages', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const beforeId = req.query.beforeId ? Number(req.query.beforeId) : undefined

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    const messages = await prisma.supportMessage.findMany({
      where: {
        supportChatId: chat.id,
        ...(beforeId ? { id: { lt: beforeId } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        replyTo: {
          select: {
            id: true,
            direction: true,
            kind: true,
            text: true,
            fileId: true,
            adminUsername: true,
            createdAt: true,
          },
        },
      },
    })

    return res.json({
      chat,
      messages: messages.reverse(),
      hasMore: messages.length === limit,
      nextBeforeId: messages.length ? messages[0].id : null,
    })
  } catch (error) {
    console.error('Support messages fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

app.get('/api/admin/support/chats/:chatId/avatar', requireAdminAuth, async (req, res) => {
  try {
    if (!supportBotInstance) return res.status(503).json({ error: 'Support bot is not initialized' })

    const chatId = String(req.params.chatId)
    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    let tgChatId: any = chat.chatId
    if (/^-?\d+$/.test(tgChatId)) tgChatId = Number(tgChatId)

    const info = await supportBotInstance.api.getChat(tgChatId)
    const fileId = (info as any)?.photo?.small_file_id || (info as any)?.photo?.big_file_id || null

    return res.json({ fileId })
  } catch (error) {
    console.error('Support chat avatar fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch avatar' })
  }
})

app.post('/api/admin/support/chats/:chatId/read', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: { unreadCount: 0 },
    })
    return res.json(updated)
  } catch (error) {
    console.error('Support chat read error:', error)
    return res.status(500).json({ error: 'Failed to mark as read' })
  }
})

app.post('/api/admin/support/chats/:chatId/unread', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: { unreadCount: Math.max(1, chat.unreadCount || 0) },
    })
    return res.json(updated)
  } catch (error) {
    console.error('Support chat unread error:', error)
    return res.status(500).json({ error: 'Failed to mark as unread' })
  }
})

app.get('/api/admin/support/chats/:chatId/notes', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    const notes = await prisma.supportNote.findMany({
      where: { supportChatId: chat.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return res.json({ notes })
  } catch (error) {
    console.error('Support chat notes fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

app.post('/api/admin/support/chats/:chatId/notes', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const parsed = supportNoteSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid note payload' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const note = await prisma.supportNote.create({
      data: {
        supportChatId: chat.id,
        text: parsed.data.text,
        adminUsername,
      },
    })

    return res.json(note)
  } catch (error) {
    console.error('Support chat note create error:', error)
    return res.status(500).json({ error: 'Failed to add note' })
  }
})

app.patch('/api/admin/support/chats/:chatId/notes/:noteId', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const noteId = Number(req.params.noteId)
    if (!Number.isFinite(noteId)) return res.status(400).json({ error: 'Invalid note id' })

    const adminUsername = String((req as any).adminUsername || '').trim()
    const adminRole = String((req as any).adminRole || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const parsed = supportNoteSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid note payload' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const note = await prisma.supportNote.findUnique({ where: { id: noteId } })
    if (!note || note.supportChatId !== chat.id) return res.status(404).json({ error: 'Note not found' })

    const isAdminLike = adminRole === 'superadmin' || adminRole === 'admin'
    const isAuthor = Boolean(note.adminUsername) && note.adminUsername === adminUsername
    if (!isAdminLike && !isAuthor) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await prisma.supportNote.update({
      where: { id: noteId },
      data: { text: parsed.data.text },
    })

    return res.json(updated)
  } catch (error) {
    console.error('Support chat note update error:', error)
    return res.status(500).json({ error: 'Failed to update note' })
  }
})

app.delete('/api/admin/support/chats/:chatId/notes/:noteId', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const noteId = Number(req.params.noteId)
    if (!Number.isFinite(noteId)) return res.status(400).json({ error: 'Invalid note id' })

    const adminUsername = String((req as any).adminUsername || '').trim()
    const adminRole = String((req as any).adminRole || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const note = await prisma.supportNote.findUnique({ where: { id: noteId } })
    if (!note || note.supportChatId !== chat.id) return res.status(404).json({ error: 'Note not found' })

    const isAdminLike = adminRole === 'superadmin' || adminRole === 'admin'
    const isAuthor = Boolean(note.adminUsername) && note.adminUsername === adminUsername
    if (!isAdminLike && !isAuthor) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.supportNote.delete({ where: { id: noteId } })
    return res.json({ success: true })
  } catch (error) {
    console.error('Support chat note delete error:', error)
    return res.status(500).json({ error: 'Failed to delete note' })
  }
})

app.post('/api/admin/support/chats/:chatId/accept', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    // Allow accepting archived chat: it reopens the dialog and assigns operator.
    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(409).json({ error: 'Chat already accepted by another operator' })
    }

    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: {
        status: 'ACCEPTED',
        acceptedBy: adminUsername,
        acceptedAt: chat.acceptedAt || new Date(),
        funnelStageId: chat.funnelStageId || 'primary',
        archivedAt: null,
      },
    })
    return res.json(updated)
  } catch (error) {
    console.error('Support chat accept error:', error)
    return res.status(500).json({ error: 'Failed to accept chat' })
  }
})

app.post('/api/admin/support/chats/:chatId/stage', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const role = String((req as any).adminRole || '').toLowerCase()
    const isAdmin = role === 'admin' || role === 'superadmin'

    const parsed = supportSetStageSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid stage payload' })

    const stageId = canonicalizeSupportStageId(parsed.data.stageId)
    if (!stageId) return res.status(400).json({ error: 'Invalid stage payload' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ARCHIVE') {
      return res.status(409).json({ error: 'Chat is archived' })
    }
    if (chat.status !== 'ACCEPTED') {
      return res.status(409).json({ error: 'Chat must be accepted before changing stage' })
    }
    if (!isAdmin && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: {
        funnelStageId: stageId,
      },
    })

    return res.json(updated)
  } catch (error) {
    console.error('Support chat stage update error:', error)
    return res.status(500).json({ error: 'Failed to update stage' })
  }
})

app.post('/api/admin/support/chats/:chatId/unarchive', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: {
        status: 'NEW',
        archivedAt: null,
        acceptedBy: null,
        acceptedAt: null,
        funnelStageId: null,
      },
    })
    return res.json(updated)
  } catch (error) {
    console.error('Support chat unarchive error:', error)
    return res.status(500).json({ error: 'Failed to unarchive chat' })
  }
})

app.post('/api/admin/support/chats/:chatId/block', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedBy: adminUsername,
      },
    })
    return res.json(updated)
  } catch (error) {
    console.error('Support chat block error:', error)
    return res.status(500).json({ error: 'Failed to block user' })
  }
})

app.post('/api/admin/support/chats/:chatId/unblock', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)
    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedBy: null,
      },
    })
    return res.json(updated)
  } catch (error) {
    console.error('Support chat unblock error:', error)
    return res.status(500).json({ error: 'Failed to unblock user' })
  }
})

app.post('/api/admin/support/chats/:chatId/archive', requireAdminAuth, async (req, res) => {
  try {
    const chatId = String(req.params.chatId)

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const updated = await prisma.supportChat.update({
      where: { chatId },
      data: {
        status: 'ARCHIVE',
        archivedAt: new Date(),
        unreadCount: 0,
      },
    })
    return res.json(updated)
  } catch (error) {
    console.error('Support chat archive error:', error)
    return res.status(500).json({ error: 'Failed to archive chat' })
  }
})
app.post('/api/admin/support/chats/:chatId/messages', requireAdminAuth, async (req, res) => {
  try {
    if (!supportBotInstance) {
      return res.status(503).json({ error: 'Support bot is not configured' })
    }

    const chatId = String(req.params.chatId)
    const parseResult = supportSendMessageSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid message payload' })
    }

    const { text, replyToId } = parseResult.data
    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    if (chat.status === 'ARCHIVE') {
      return res.status(409).json({ error: 'Chat is archived' })
    }
    if (chat.status !== 'ACCEPTED') {
      return res.status(409).json({ error: 'Chat must be accepted before replying' })
    }
    if (chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is accepted by another operator' })
    }

    let replyToTelegramMessageId: number | undefined
    if (replyToId) {
      const replyTarget = await prisma.supportMessage.findUnique({ where: { id: replyToId } })
      if (!replyTarget || replyTarget.supportChatId !== chat.id) {
        return res.status(404).json({ error: 'Reply target not found' })
      }
      const tgId = Number((replyTarget as any).telegramMessageId)
      if (!Number.isFinite(tgId)) {
        return res.status(409).json({ error: 'Cannot reply in Telegram: target message id is missing' })
      }
      replyToTelegramMessageId = tgId
    }

    // Send to Telegram first (so we don't persist unsent messages)
    const sent = await supportBotInstance.api.sendMessage(
      chatId,
      text,
      replyToTelegramMessageId
        ? ({ reply_to_message_id: replyToTelegramMessageId, allow_sending_without_reply: true } as any)
        : undefined,
    )
    const telegramMessageId = Number((sent as any)?.message_id)

    // Use app time consistently across inbound/outbound so response-time calculation
    // (lastInboundAt vs lastOutboundAt) isn't affected by DB/app clock skew.
    const now = new Date()

    const message = await prisma.supportMessage.create({
      data: {
        supportChatId: chat.id,
        direction: 'OUT',
        kind: 'TEXT',
        text,
        telegramMessageId: Number.isFinite(telegramMessageId) ? telegramMessageId : null,
        replyToId: replyToId || null,
        adminUsername: adminUsername || null,
        createdAt: now,
      },
    })

    await prisma.supportChat.update({
      where: { id: chat.id },
      data: {
        lastMessageAt: now,
        lastMessageText: text,
        lastOutboundAt: now,
      },
    })

    return res.json(message)
  } catch (error) {
    console.error('Support send message error:', error)
    return res.status(500).json({ error: 'Failed to send message' })
  }
})

app.delete('/api/admin/support/chats/:chatId/messages/:messageId', requireAdminAuth, async (req, res) => {
  try {
    if (!supportBotInstance) {
      return res.status(503).json({ error: 'Support bot is not configured' })
    }

    const chatId = String(req.params.chatId)
    const messageId = Number(req.params.messageId)
    if (!Number.isFinite(messageId)) return res.status(400).json({ error: 'Invalid message id' })

    const adminUsername = String((req as any).adminUsername || '').trim()
    const adminRole = String((req as any).adminRole || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const chat = await prisma.supportChat.findUnique({ where: { chatId } })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })

    if (chat.status === 'ACCEPTED' && chat.acceptedBy && chat.acceptedBy !== adminUsername) {
      return res.status(403).json({ error: 'Chat is assigned to another operator' })
    }

    const message = await prisma.supportMessage.findUnique({ where: { id: messageId } })
    if (!message || message.supportChatId !== chat.id) return res.status(404).json({ error: 'Message not found' })

    // Only delete outbound staff messages (operator/admin replies).
    if (String(message.direction).toUpperCase() !== 'OUT' || !message.adminUsername) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const isAdminLike = adminRole === 'superadmin' || adminRole === 'admin'
    const isAuthor = message.adminUsername === adminUsername
    if (!isAdminLike && !isAuthor) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const tgMessageId = Number((message as any).telegramMessageId)
    if (!Number.isFinite(tgMessageId)) {
      return res.status(409).json({ error: 'Cannot delete from Telegram: message id is missing (sent before update)' })
    }

    try {
      await supportBotInstance.api.deleteMessage(chatId, tgMessageId)
    } catch (e: any) {
      // If Telegram refuses (e.g. too old), we keep the message in CRM too.
      return res.status(409).json({ error: e?.message || 'Failed to delete message in Telegram' })
    }

    await prisma.supportMessage.delete({ where: { id: messageId } })

    const [lastAny, lastOut, lastIn] = await Promise.all([
      prisma.supportMessage.findFirst({ where: { supportChatId: chat.id }, orderBy: { id: 'desc' } }),
      prisma.supportMessage.findFirst({ where: { supportChatId: chat.id, direction: 'OUT' }, orderBy: { id: 'desc' } }),
      prisma.supportMessage.findFirst({ where: { supportChatId: chat.id, direction: 'IN' }, orderBy: { id: 'desc' } }),
    ])

    const nextLastMessageTextRaw = (() => {
      if (!lastAny) return null
      const kind = String((lastAny as any).kind || '').toUpperCase()
      const text = (lastAny as any).text as string | null | undefined
      if (kind === 'PHOTO') return text ? String(text) : '[Photo]'
      return text ?? null
    })()

    await prisma.supportChat.update({
      where: { id: chat.id },
      data: {
        lastMessageAt: lastAny ? (lastAny as any).createdAt : null,
        lastMessageText: nextLastMessageTextRaw ? String(nextLastMessageTextRaw).slice(0, 500) : null,
        lastOutboundAt: lastOut ? (lastOut as any).createdAt : null,
        lastInboundAt: lastIn ? (lastIn as any).createdAt : null,
      },
    })

    return res.json({ success: true })
  } catch (error) {
    console.error('Support message delete error:', error)
    return res.status(500).json({ error: 'Failed to delete message' })
  }
})

app.post(
  '/api/admin/support/chats/:chatId/photos',
  requireAdminAuth,
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!supportBotInstance) {
        return res.status(503).json({ error: 'Support bot is not configured' })
      }

      const chatId = String(req.params.chatId)
      const chat = await prisma.supportChat.findUnique({ where: { chatId } })
      if (!chat) return res.status(404).json({ error: 'Chat not found' })

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'Photo file is required' })
      }

      const parsed = supportSendPhotoSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload' })
      }
      const { caption, replyToId } = parsed.data

      const adminUsername = String((req as any).adminUsername || '').trim()
      if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

      if (chat.status === 'ARCHIVE') {
        return res.status(409).json({ error: 'Chat is archived' })
      }
      if (chat.status !== 'ACCEPTED') {
        return res.status(409).json({ error: 'Chat must be accepted before replying' })
      }
      if (chat.acceptedBy && chat.acceptedBy !== adminUsername) {
        return res.status(403).json({ error: 'Chat is accepted by another operator' })
      }

      let replyToTelegramMessageId: number | undefined
      if (replyToId) {
        const replyTarget = await prisma.supportMessage.findUnique({ where: { id: replyToId } })
        if (!replyTarget || replyTarget.supportChatId !== chat.id) {
          return res.status(404).json({ error: 'Reply target not found' })
        }
        const tgId = Number((replyTarget as any).telegramMessageId)
        if (!Number.isFinite(tgId)) {
          return res.status(409).json({ error: 'Cannot reply in Telegram: target message id is missing' })
        }
        replyToTelegramMessageId = tgId
      }

      // Send to Telegram first
      const sent = await supportBotInstance.api.sendPhoto(
        chatId,
        new InputFile(req.file.buffer, req.file.originalname || 'photo.jpg'),
        {
          ...(caption ? { caption } : {}),
          ...(replyToTelegramMessageId
            ? ({ reply_to_message_id: replyToTelegramMessageId, allow_sending_without_reply: true } as any)
            : {}),
        } as any,
      )

      const telegramMessageId = Number((sent as any)?.message_id)

      // Use app time consistently across inbound/outbound so response-time calculation
      // (lastInboundAt vs lastOutboundAt) isn't affected by DB/app clock skew.
      const now = new Date()

      const photos = (sent as any)?.photo as Array<{ file_id: string; file_unique_id: string }> | undefined
      const largest = photos?.length ? photos[photos.length - 1] : undefined

      const message = await prisma.supportMessage.create({
        data: {
          supportChatId: chat.id,
          direction: 'OUT',
          kind: 'PHOTO',
          text: caption || null,
          telegramMessageId: Number.isFinite(telegramMessageId) ? telegramMessageId : null,
          replyToId: replyToId || null,
          fileId: largest?.file_id || null,
          fileUniqueId: largest?.file_unique_id || null,
          fileName: req.file.originalname || null,
          mimeType: req.file.mimetype || null,
          adminUsername: adminUsername || null,
          createdAt: now,
        },
      })

      await prisma.supportChat.update({
        where: { id: chat.id },
        data: {
          lastMessageAt: now,
          lastMessageText: caption ? caption.slice(0, 500) : '[Photo]',
          lastOutboundAt: now,
        },
      })

      return res.json(message)
    } catch (error) {
      console.error('Support send photo error:', error)
      return res.status(500).json({ error: 'Failed to send photo' })
    }
  },
)

// Proxy Telegram file (photo) to CRM without exposing bot token.
app.get('/api/admin/support/files/:fileId', requireAdminAuth, async (req, res) => {
  try {
    if (!supportBotInstance) {
      return res.status(503).json({ error: 'Support bot is not configured' })
    }

    const fileId = String(req.params.fileId)
    const file = await supportBotInstance.api.getFile(fileId)
    const filePath = (file as any)?.file_path
    if (!filePath) return res.status(404).json({ error: 'File not found' })

    // Use env token (most reliable in prod). Fallback to instance (dev).
    const token = process.env.SUPPORT_BOT_TOKEN || ((supportBotInstance as any)?.token as string | undefined)
    if (!token) return res.status(503).json({ error: 'Support bot token unavailable' })

    const url = `https://api.telegram.org/file/bot${token}/${filePath}`
    const response = await axios.get(url, { responseType: 'stream' })

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream')
    // Cache a bit in browser
    res.setHeader('Cache-Control', 'private, max-age=3600')

    response.data.pipe(res)
  } catch (error) {
    console.error('Support file proxy error:', error)
    return res.status(500).json({ error: 'Failed to fetch file' })
  }
})

// ============= SUPPORT BROADCASTS (MASS MESSAGING) =============

let supportBroadcastWorkerTimer: NodeJS.Timeout | null = null
let supportBroadcastWorkerInProgress = false

async function processSupportBroadcastTick() {
  if (supportBroadcastWorkerInProgress) return
  if (!supportBotInstance) return

  supportBroadcastWorkerInProgress = true
  try {
    const broadcast = await prisma.supportBroadcast.findFirst({
      where: { status: { in: ['PENDING', 'RUNNING'] } },
      orderBy: { createdAt: 'asc' },
    })
    if (!broadcast) return

    // Respect cancellation
    if (broadcast.status === 'CANCELLED' || broadcast.cancelledAt) {
      await prisma.supportBroadcastRecipient.updateMany({
        where: { broadcastId: broadcast.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      })
      return
    }

    if (broadcast.status === 'PENDING') {
      await prisma.supportBroadcast.update({
        where: { id: broadcast.id },
        data: { status: 'RUNNING', startedAt: new Date() },
      })
    }

    const pendingRecipients = await prisma.supportBroadcastRecipient.findMany({
      where: { broadcastId: broadcast.id, status: 'PENDING' },
      orderBy: { id: 'asc' },
      take: 5,
    })

    if (pendingRecipients.length === 0) {
      await prisma.supportBroadcast.update({
        where: { id: broadcast.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
      return
    }

    for (const recipient of pendingRecipients) {
      // Check cancellation between sends
      const latest = await prisma.supportBroadcast.findUnique({ where: { id: broadcast.id } })
      if (!latest || latest.status === 'CANCELLED' || latest.cancelledAt) {
        await prisma.supportBroadcastRecipient.updateMany({
          where: { broadcastId: broadcast.id, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        })
        return
      }

      try {
        const hasPhoto = Boolean(broadcast.photoData && (broadcast.photoData as any).length)
        const caption = broadcast.text ? String(broadcast.text).trim() : ''

        if (hasPhoto) {
          const sent = await supportBotInstance.api.sendPhoto(
            recipient.chatId,
            new InputFile(broadcast.photoData as Buffer, broadcast.photoFileName || 'broadcast.jpg'),
            caption ? ({ caption: caption.slice(0, 1024) } as any) : ({} as any),
          )
          const telegramMessageId = Number((sent as any)?.message_id)
          const photos = (sent as any)?.photo as Array<{ file_id: string; file_unique_id: string }> | undefined
          const largest = photos?.length ? photos[photos.length - 1] : undefined

          const message = await prisma.supportMessage.create({
            data: {
              supportChatId: recipient.supportChatId,
              direction: 'OUT',
              kind: 'PHOTO',
              text: caption || null,
              ...(Number.isFinite(telegramMessageId) ? { telegramMessageId } : {}),
              fileId: largest?.file_id || null,
              fileUniqueId: largest?.file_unique_id || null,
              fileName: broadcast.photoFileName || null,
              mimeType: broadcast.photoMimeType || null,
              adminUsername: broadcast.adminUsername,
            },
          })

          await prisma.supportChat.update({
            where: { id: recipient.supportChatId },
            data: {
              lastMessageAt: message.createdAt,
              lastMessageText: caption ? caption.slice(0, 500) : '[Photo]',
              lastOutboundAt: message.createdAt,
            },
          })

          await prisma.supportBroadcastRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              error: null,
              ...(Number.isFinite(telegramMessageId) ? { telegramMessageId } : {}),
              supportMessageId: message.id,
            },
          })

          await prisma.supportBroadcast.update({
            where: { id: broadcast.id },
            data: { sentCount: { increment: 1 } },
          })
        } else {
          const sent = await supportBotInstance.api.sendMessage(recipient.chatId, caption)
          const telegramMessageId = Number((sent as any)?.message_id)

          const message = await prisma.supportMessage.create({
            data: {
              supportChatId: recipient.supportChatId,
              direction: 'OUT',
              kind: 'TEXT',
              text: caption,
              ...(Number.isFinite(telegramMessageId) ? { telegramMessageId } : {}),
              adminUsername: broadcast.adminUsername,
            },
          })

          await prisma.supportChat.update({
            where: { id: recipient.supportChatId },
            data: {
              lastMessageAt: message.createdAt,
              lastMessageText: caption,
              lastOutboundAt: message.createdAt,
            },
          })

          await prisma.supportBroadcastRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              error: null,
              ...(Number.isFinite(telegramMessageId) ? { telegramMessageId } : {}),
              supportMessageId: message.id,
            },
          })

          await prisma.supportBroadcast.update({
            where: { id: broadcast.id },
            data: { sentCount: { increment: 1 } },
          })
        }
      } catch (error: any) {
        const msg = String(error?.message || 'Send failed').slice(0, 500)
        await prisma.supportBroadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', error: msg },
        })
        await prisma.supportBroadcast.update({
          where: { id: broadcast.id },
          data: { failedCount: { increment: 1 } },
        })
      }

      // Gentle throttle
      await new Promise((r) => setTimeout(r, 200))
    }
  } catch (error) {
    console.error('Support broadcast worker tick error:', error)
  } finally {
    supportBroadcastWorkerInProgress = false
  }
}

async function recomputeSupportChatLastMetaById(supportChatId: number) {
  const [lastAny, lastOut, lastIn] = await Promise.all([
    prisma.supportMessage.findFirst({ where: { supportChatId }, orderBy: { id: 'desc' } }),
    prisma.supportMessage.findFirst({ where: { supportChatId, direction: 'OUT' }, orderBy: { id: 'desc' } }),
    prisma.supportMessage.findFirst({ where: { supportChatId, direction: 'IN' }, orderBy: { id: 'desc' } }),
  ])

  const nextLastMessageTextRaw = (() => {
    if (!lastAny) return null
    const kind = String((lastAny as any).kind || '').toUpperCase()
    const text = (lastAny as any).text as string | null | undefined
    if (kind === 'PHOTO') return text ? String(text) : '[Photo]'
    return text ?? null
  })()

  await prisma.supportChat.update({
    where: { id: supportChatId },
    data: {
      lastMessageAt: lastAny ? (lastAny as any).createdAt : null,
      lastMessageText: nextLastMessageTextRaw ? String(nextLastMessageTextRaw).slice(0, 500) : null,
      lastOutboundAt: lastOut ? (lastOut as any).createdAt : null,
      lastInboundAt: lastIn ? (lastIn as any).createdAt : null,
    },
  })
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const limit = Math.max(1, Math.floor(concurrency || 1))
  const results: R[] = new Array(items.length)
  let idx = 0

  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const current = idx
      idx += 1
      if (current >= items.length) return
      results[current] = await fn(items[current])
    }
  })

  await Promise.all(workers)
  return results
}

app.post('/api/admin/support/broadcasts', requireAdminAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!supportBotInstance) {
      return res.status(503).json({ error: 'Support bot is not configured' })
    }

    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const parsed = supportBroadcastCreateSchema.safeParse({
      target: req.body?.target,
      stageId: req.body?.stageId,
      text: req.body?.text,
    })
    if (!parsed.success) return res.status(400).json({ error: 'Invalid broadcast payload' })

    if (parsed.data.target === 'STAGE' && !parsed.data.stageId) {
      return res.status(400).json({ error: 'stageId is required for STAGE target' })
    }

    const text = String(parsed.data.text || '').trim()
    const hasPhoto = Boolean(req.file && req.file.buffer)
    if (!text && !hasPhoto) {
      return res.status(400).json({ error: 'Text or photo is required' })
    }

    const where: any = {
      status: 'ACCEPTED',
      archivedAt: null,
      acceptedBy: adminUsername,
      isBlocked: false,
    }
    if (parsed.data.target === 'STAGE') {
      where.funnelStageId = parsed.data.stageId
    }

    const recipients = await prisma.supportChat.findMany({
      where,
      select: { id: true, chatId: true },
    })

    const created = await prisma.$transaction(async (tx) => {
      const broadcast = await tx.supportBroadcast.create({
        data: {
          adminUsername,
          target: parsed.data.target,
          stageId: parsed.data.target === 'STAGE' ? parsed.data.stageId! : null,
          text,
          photoData: hasPhoto ? req.file!.buffer : null,
          photoFileName: hasPhoto ? req.file!.originalname : null,
          photoMimeType: hasPhoto ? req.file!.mimetype : null,
          photoSize: hasPhoto ? req.file!.size : null,
          totalRecipients: recipients.length,
          status: recipients.length ? 'PENDING' : 'COMPLETED',
          completedAt: recipients.length ? null : new Date(),
        },
      })

      if (recipients.length) {
        await tx.supportBroadcastRecipient.createMany({
          data: recipients.map((r) => ({
            broadcastId: broadcast.id,
            supportChatId: r.id,
            chatId: r.chatId,
          })),
        })
      }

      return broadcast
    })

    const { photoData, ...rest } = created as any
    return res.json({ ...rest, hasPhoto: Boolean(created.photoSize || photoData) })
  } catch (error) {
    console.error('Support broadcast create error:', error)
    return res.status(500).json({ error: 'Failed to create broadcast' })
  }
})

app.get('/api/admin/support/broadcasts', requireAdminAuth, async (req, res) => {
  try {
    const broadcasts = await prisma.supportBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        adminUsername: true,
        target: true,
        stageId: true,
        text: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        startedAt: true,
        completedAt: true,
        cancelledAt: true,
        deletedAt: true,
        deletedBy: true,
        createdAt: true,
        updatedAt: true,
        photoFileName: true,
        photoMimeType: true,
        photoSize: true,
      },
    })
    return res.json({
      broadcasts: broadcasts.map((b) => ({
        ...b,
        hasPhoto: Boolean(b.photoSize),
      })),
    })
  } catch (error) {
    console.error('Support broadcast list error:', error)
    return res.status(500).json({ error: 'Failed to fetch broadcasts' })
  }
})

app.post('/api/admin/support/broadcasts/:id/cancel', requireAdminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const adminUsername = String((req as any).adminUsername || '').trim()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const existing = await prisma.supportBroadcast.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Broadcast not found' })
    if (existing.adminUsername !== adminUsername) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.supportBroadcast.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })

      await tx.supportBroadcastRecipient.updateMany({
        where: { broadcastId: id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      })

      return b
    })

    return res.json(updated)
  } catch (error) {
    console.error('Support broadcast cancel error:', error)
    return res.status(500).json({ error: 'Failed to cancel broadcast' })
  }
})

app.post('/api/admin/support/broadcasts/:id/delete', requireAdminAuth, async (req, res) => {
  try {
    if (!supportBotInstance) {
      return res.status(503).json({ error: 'Support bot is not configured' })
    }

    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

    const adminUsername = String((req as any).adminUsername || '').trim()
    const adminRole = String((req as any).adminRole || '').trim().toLowerCase()
    if (!adminUsername) return res.status(400).json({ error: 'Admin username missing' })

    const isAdminLike = adminRole === 'superadmin' || adminRole === 'admin'

    const broadcast = await prisma.supportBroadcast.findUnique({ where: { id } })
    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' })
    if (!isAdminLike && broadcast.adminUsername !== adminUsername) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const recipients = await prisma.supportBroadcastRecipient.findMany({
      where: {
        broadcastId: id,
        status: 'SENT',
        telegramMessageId: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        chatId: true,
        supportChatId: true,
        telegramMessageId: true,
        supportMessageId: true,
      },
      orderBy: { id: 'asc' },
    })

    const now = new Date()

    let deletedCount = 0
    let deleteFailedCount = 0
    let skippedCount = 0
    const affectedChatIds = new Set<number>()

    // If there are no stored telegramMessageId values, we cannot reliably delete in Telegram.
    // This can happen for old broadcasts created before we started saving message_id.
    if (recipients.length === 0) {
      // Still mark who requested deletion (audit), but don't pretend messages were deleted.
      await prisma.supportBroadcast.update({
        where: { id },
        data: { deletedAt: broadcast.deletedAt || now, deletedBy: broadcast.deletedBy || adminUsername },
      })
      return res.json({ success: true, deletedCount, deleteFailedCount, skippedCount, total: 0 })
    }

    await mapWithConcurrency(recipients, 8, async (r) => {
      const tgId = Number(r.telegramMessageId)
      if (!Number.isFinite(tgId)) {
        skippedCount += 1
        return
      }

      try {
        await supportBotInstance!.api.deleteMessage(r.chatId, tgId)

        if (r.supportMessageId) {
          try {
            await prisma.supportMessage.delete({ where: { id: r.supportMessageId } })
          } catch {
            // ignore: message already removed
          }
        }

        await prisma.supportBroadcastRecipient.update({
          where: { id: r.id },
          data: { deletedAt: now, deleteError: null },
        })

        affectedChatIds.add(r.supportChatId)
        deletedCount += 1
      } catch (e: any) {
        const msg = String(e?.message || 'Failed to delete in Telegram').slice(0, 500)
        await prisma.supportBroadcastRecipient.update({
          where: { id: r.id },
          data: { deleteError: msg },
        })
        deleteFailedCount += 1
      }

      // Gentle throttle to avoid Telegram rate limiting.
      await new Promise((rr) => setTimeout(rr, 80))
    })

    // Recompute last-message metadata for affected chats.
    for (const supportChatId of affectedChatIds) {
      await recomputeSupportChatLastMetaById(supportChatId)
    }

    await prisma.supportBroadcast.update({
      where: { id },
      data: { deletedAt: now, deletedBy: adminUsername },
    })

    return res.json({
      success: true,
      deletedCount,
      deleteFailedCount,
      skippedCount,
      total: recipients.length,
    })
  } catch (error) {
    console.error('Support broadcast delete error:', error)
    return res.status(500).json({ error: 'Failed to delete broadcast messages' })
  }
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

const buildFallbackAiAnalytics = (opts?: { date?: Date; symbol?: string }): AiAnalyticsItem[] => {
  const date = opts?.date ?? new Date()
  const symbol = (opts?.symbol || 'BTC/USDT').toString().slice(0, 20)

  const models: Array<{ modelId: AiModelId; displayName: string }> = [
    { modelId: 'syntrix', displayName: 'Syntrix AI' },
    { modelId: 'modelA', displayName: 'DEEPSEEK CHAT V3.1' },
    { modelId: 'modelB', displayName: 'CLAUDE SONNET 4.5' },
    { modelId: 'modelC', displayName: 'QWEN3 MAX' },
    { modelId: 'modelD', displayName: 'GEMINI 2.5 PRO' },
  ]

  return models.map((m) => {
    const { signal, confidencePct, profitPct, seed, includeInsight } = computeDeterministicAiAnalyticsForSlot({
      modelId: m.modelId,
      date,
      symbol,
    })

    return {
      modelId: m.modelId,
      displayName: m.displayName,
      signal,
      confidencePct,
      profitPct,
      message: buildAiAnalyticsMessage({
        signal,
        confidencePct,
        profitPct,
        modelId: m.modelId,
        symbol,
        seed,
        includeInsight,
      }),
    }
  })
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value
  const y = Number(get('year') || '0')
  const m = Number(get('month') || '1')
  const d = Number(get('day') || '1')
  const hh = Number(get('hour') || '0')
  const mm = Number(get('minute') || '0')
  const ss = Number(get('second') || '0')
  return { y, m, d, hh, mm, ss }
}

function kyivDateKey(date: Date) {
  const { y, m, d } = getTimeZoneParts(date, 'Europe/Kyiv')
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate()
}

function kyivSecondsSinceMidnight(date: Date) {
  const { hh, mm, ss } = getTimeZoneParts(date, 'Europe/Kyiv')
  return hh * 3600 + mm * 60 + ss
}

function kyivSlotIndex(date: Date) {
  // Schedule (Kyiv time): 2 refreshes per hour.
  // 24h * 2 = 48 slots per day, each slot is 30 minutes.
  const secs = kyivSecondsSinceMidnight(date)
  const slot = Math.floor(secs / (30 * 60))
  return Math.max(0, Math.min(47, slot))
}

function kyivPrevDayKey(date: Date) {
  // Compute previous calendar day in Kyiv, without relying on 24h subtraction (DST-safe).
  const { y, m, d } = getTimeZoneParts(date, 'Europe/Kyiv')
  if (d > 1) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d - 1).padStart(2, '0')}`
  }
  // previous month
  if (m > 1) {
    const pm = m - 1
    const pdays = daysInMonth(y, pm)
    return `${y}-${String(pm).padStart(2, '0')}-${String(pdays).padStart(2, '0')}`
  }
  // previous year
  const py = y - 1
  const pm = 12
  const pdays = daysInMonth(py, pm)
  return `${py}-${String(pm).padStart(2, '0')}-${String(pdays).padStart(2, '0')}`
}

function hashToUint32(input: string) {
  // Simple FNV-1a 32-bit
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function clampProfitPct(modelId: AiModelId, value: number) {
  // Product requirement:
  // - Syntrix AI: usually large positive, only minimal negatives.
  // - Other models: usually smaller, downside can be wider.
  if (modelId === 'syntrix') {
    return Math.min(60, Math.max(-3, value))
  }

  return Math.min(20, Math.max(-15, value))
}

function monthlyTargetEnd(modelId: AiModelId) {
  // Keep Syntrix higher than others, but within realistic UI ranges.
  switch (modelId) {
    case 'syntrix':
      return 18
    case 'modelA':
      return 6
    case 'modelB':
      return 5
    case 'modelC':
      return 4
    case 'modelD':
      return 5.5
  }
}

function monthlyStart(modelId: AiModelId) {
  switch (modelId) {
    case 'syntrix':
      return 6.5
    default:
      return 1.2
  }
}

function computeDailyBaselineProfitPct(opts: { modelId: AiModelId; date: Date; symbol: string }) {
  const { modelId, date, symbol } = opts
  const { y, m, d } = getTimeZoneParts(date, 'Europe/Kyiv')
  const dim = daysInMonth(y, m)
  const p = dim <= 1 ? 1 : (d - 1) / (dim - 1)

  const start = monthlyStart(modelId)
  const end = monthlyTargetEnd(modelId)
  const curve = start + (end - start) * Math.pow(p, 2.2)

  const seed = hashToUint32(`${kyivDateKey(date)}:${modelId}:${symbol}:day`)
  const rand = mulberry32(seed)

  // Day-to-day movement with pullbacks while trending upward.
  const amp = (end - start) * (0.035 + 0.045 * p)
  const phaseA = (seed % 1000) / 1000
  const phaseB = ((seed >>> 8) % 1000) / 1000
  const osc =
    Math.sin((d + phaseA) * (Math.PI * 2) / 5) * 0.75 +
    Math.sin((d + phaseB) * (Math.PI * 2) / 11) * 0.45
  const jitter = (rand() - 0.5) * 0.35
  const noise = amp * (osc / 1.3 + jitter)

  let profit = clampProfitPct(modelId, curve + noise)
  // Add rare small negative pullbacks for Syntrix, but keep them minimal.
  if (modelId === 'syntrix') {
    const extraSeed = hashToUint32(`${kyivDateKey(date)}:${modelId}:${symbol}:pullback:v1`)
    const r = mulberry32(extraSeed)()
    if (r < 0.08) {
      // 8% of days: slight negative reading
      profit = clampProfitPct(modelId, -0.5 - r * 3)
    }
  }
  void symbol
  return Number(profit.toFixed(2))
}

function computeProfitPctForSlot(opts: { modelId: AiModelId; date: Date; symbol: string; slotIndex: number }) {
  const { modelId, date, symbol, slotIndex } = opts
  const baseline = computeDailyBaselineProfitPct({ modelId, date, symbol })

  const seed = hashToUint32(`${kyivDateKey(date)}:${modelId}:${symbol}:slot:${slotIndex}`)
  const rand = mulberry32(seed)

  // Intra-day variation: stable within slot, changes only on slot boundaries.
  const amp = Math.max(0.6, Math.abs(baseline) * 0.012)
  const phase = (seed % 1000) / 1000
  const osc =
    Math.sin((slotIndex + phase) * (Math.PI * 2) / 8) * 0.9 +
    Math.sin((slotIndex + phase) * (Math.PI * 2) / 17) * 0.6
  const jitter = (rand() - 0.5) * 0.6
  const profit = clampProfitPct(modelId, baseline + amp * (osc / 1.4 + jitter))
  void symbol
  return Number(profit.toFixed(2))
}

function computeDeterministicAiAnalyticsForSlot(opts: { modelId: AiModelId; date: Date; symbol: string }) {
  const { modelId, date, symbol } = opts
  const slotIndex = kyivSlotIndex(date)
  const seed = hashToUint32(`${kyivDateKey(date)}:${modelId}:${symbol}:slot:${slotIndex}:v3`)
  const rand = mulberry32(seed)

  const profitPct = computeProfitPctForSlot({ modelId, date, symbol, slotIndex })

  // Confidence stays stable within the slot.
  const { y, m, d } = getTimeZoneParts(date, 'Europe/Kyiv')
  const dim = daysInMonth(y, m)
  const p = dim <= 1 ? 1 : (d - 1) / (dim - 1)
  const confidenceBase = 58 + 22 * p
  const confidenceNoise = (rand() - 0.5) * 12 + Math.sin((slotIndex + (seed % 7)) * 0.9) * 4
  const confidencePct = Math.max(40, Math.min(95, Math.round(confidenceBase + confidenceNoise)))

  // Signal derived from change vs previous slot.
  const prevSlotIndex = slotIndex > 0 ? slotIndex - 1 : 47
  const prevDate = slotIndex > 0 ? date : new Date(date.getTime())
  // If we're at the first slot of the day, use previous Kyiv day key in the seed.
  const prevProfit = slotIndex > 0
    ? computeProfitPctForSlot({ modelId, date, symbol, slotIndex: prevSlotIndex })
    : (() => {
        const prevDayKey = kyivPrevDayKey(date)
        const prevSeedDate = prevDayKey + ':seed'
        // Create a deterministic pseudo-date seed input (no need for real Date arithmetic)
        const prevSeed = hashToUint32(`${prevSeedDate}:${modelId}:${symbol}`)
        const prevRand = mulberry32(prevSeed)
        // Approximate previous day's last slot around that day's baseline.
        const baselineGuess = computeDailyBaselineProfitPct({ modelId, date, symbol })
        const osc = Math.sin((47 + (prevSeed % 1000) / 1000) * (Math.PI * 2) / 8)
        const amp = Math.max(0.6, Math.abs(baselineGuess) * 0.012)
        const jitter = (prevRand() - 0.5) * 0.6
        const v = clampProfitPct(modelId, baselineGuess + amp * (osc / 1.4 + jitter))
        return Number(v.toFixed(2))
      })()

  const delta = profitPct - prevProfit
  const threshold = Math.max(0.35, Math.max(1, Math.abs(profitPct)) * 0.006)
  const signal: 'BUY' | 'SELL' | 'HOLD' = delta > threshold ? 'BUY' : delta < -threshold ? 'SELL' : 'HOLD'

  // Always include the explanatory paragraph so all models show a richer message.
  const includeInsight = true
  void prevDate
  return { signal, confidencePct, profitPct, seed, includeInsight }
}

function buildAiAnalyticsMessage(opts: {
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidencePct: number
  profitPct: number
  modelId?: string
  symbol?: string
  seed?: number
  includeInsight?: boolean
}) {
  const { signal, confidencePct, profitPct } = opts
  const symbol = (opts.symbol || 'BTC/USDT').toString().slice(0, 20)
  const seed = Number.isFinite(opts.seed as number) ? (opts.seed as number) : 0
  // Default to including the explanatory paragraph.
  const includeInsight = opts.includeInsight !== false

  const base = `${signal}. Confidence: ${confidencePct}%. Estimated P/L: ${profitPct >= 0 ? '+' : ''}${profitPct}%.`
  if (!includeInsight) return base

  const pick = <T,>(arr: T[]) => arr[Math.abs(seed) % arr.length]

  const insightBySignal: Record<typeof signal, string[]> = {
    BUY: [
      `I analyzed the current market structure for ${symbol}. Indicators suggest a bullish trend; momentum is strong and may support further gains.`,
      `Current indicators suggest a bullish trend for ${symbol}. The momentum is strong, likely leading to further price increases.`,
    ],
    SELL: [
      `I analyzed recent momentum for ${symbol}. A potential decline is noted in the market; caution is advised for new positions.`,
      `A potential decline is noted in the market. Caution is advised for those considering new positions.`,
    ],
    HOLD: [
      `I analyzed the market for ${symbol}. Signals look indecisive; waiting for confirmation may be prudent.`,
      `Market conditions are mixed and direction is unclear. A neutral stance may fit until momentum improves.`,
    ],
  }

  const insight = pick(insightBySignal[signal])
  return `${base}\n\n${insight}`
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

  // Make AI analytics stable across manual updates: numbers only change by day.
  // Also ensure month-long growth trajectory with natural pullbacks.
  const now = new Date()
  const allDeterministic = buildFallbackAiAnalytics({ date: now, symbol })
  const responseItems = requestedModelId ? allDeterministic.filter((i) => i.modelId === requestedModelId) : allDeterministic

  // Persist each request so the client can show a full daily list (40+ requests/day).
  // If user is not found, still return analytics (no hard fail).
  try {
    const telegramId = String(req.params.telegramId || '').trim()
    if (telegramId) {
      const user = await prisma.user.findUnique({ where: { telegramId } })
      if (user) {
        await prisma.aiAnalyticsRequestLog.create({
          data: {
            userId: user.id,
            kyivDate: kyivDateKey(now),
            locale,
            symbol,
            timeframe,
            requestedModelId: requestedModelId ?? null,
            generatedAt: now,
            items: responseItems as any,
          },
        })
      }
    }
  } catch (e) {
    console.warn('AI analytics request logging failed:', e)
  }

  return res.json({
    generatedAt: now.toISOString(),
    simulated: true,
    items: responseItems,
  })

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
            message: 'string (start with signal like "HOLD."; do not include the word "Signal" or "Signal:")',
          },
        ],
      },
      constraints: [
        'message must be 2-4 short sentences',
        'message must NOT include the prefix "Signal:"; start with the signal value followed by a period (e.g., "HOLD.")',
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
    const items: AiAnalyticsItem[] = Array.isArray(parsedJson?.items) ? (parsedJson.items as AiAnalyticsItem[]) : []

    if (items.length === 0) {
      throw new Error('OpenAI response JSON missing items')
    }

    // Minimal sanitization
    const filtered = requestedModelId ? items.filter((i) => i?.modelId === requestedModelId) : items

    const sanitized: AiAnalyticsItem[] = filtered
      .filter((it) => it && typeof it === 'object')
      .slice(0, 5)
      .map((it) => {
        const modelId = (it.modelId as AiModelId) || 'modelA'
        const displayName = typeof it.displayName === 'string' ? it.displayName.slice(0, 40) : 'Model'
        const signal = (it.signal as any) === 'BUY' || (it.signal as any) === 'SELL' || (it.signal as any) === 'HOLD' ? (it.signal as any) : 'HOLD'
        const confidencePct = Math.max(0, Math.min(100, Math.round(Number(it.confidencePct) || 0)))
        const rawProfitPct = Number((Number(it.profitPct) || 0).toFixed(2))
        let profitPct = rawProfitPct
        // Normalize message format so UI doesn't show extra prefixes like "Signal:".
        // Also add an optional "insight" paragraph sometimes.
        const seed = (Date.now() + (modelId === 'syntrix' ? 1 : 0) * 17 + confidencePct * 31) % 10_000
        const includeInsight = (seed % 100) < 35
        profitPct = clampProfitPct(modelId, profitPct)
        const message = buildAiAnalyticsMessage({
          signal,
          confidencePct,
          profitPct,
          modelId,
          symbol,
          seed,
          includeInsight,
        }).slice(0, 700)
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

app.get('/api/user/:telegramId/ai-analytics/history', requireUserAuth, async (req, res) => {
  try {
    const telegramId = String(req.params.telegramId || '').trim()
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' })
    }

    const date = (typeof req.query.date === 'string' ? req.query.date : kyivDateKey(new Date())).trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' })
    }

    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100
    const offsetRaw = typeof req.query.offset === 'string' ? Number(req.query.offset) : 0

    const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 100))
    const offset = Math.max(0, Math.min(50_000, Number.isFinite(offsetRaw) ? Math.floor(offsetRaw) : 0))

    const user = await prisma.user.findUnique({ where: { telegramId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const rows = await prisma.aiAnalyticsRequestLog.findMany({
      where: { userId: user.id, kyivDate: date },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        createdAt: true,
        generatedAt: true,
        locale: true,
        symbol: true,
        timeframe: true,
        requestedModelId: true,
        items: true,
      },
    })

    return res.json({
      date,
      limit,
      offset,
      hasMore: rows.length === limit,
      nextOffset: offset + rows.length,
      requests: rows,
    })
  } catch (e) {
    console.error('AI analytics history failed:', e)
    return res.status(500).json({ error: 'Failed to load history' })
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
      usersForBalance,
      adminCreditsAgg,
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
      // totalDeposit is the working balance; legacy `balance` may be stale in old data.
      prisma.user.aggregate({ _sum: { totalDeposit: true }, where: { isHidden: false } }),
      prisma.user.findMany({
        where: { isHidden: false },
        select: { id: true, totalDeposit: true },
      }),
      prisma.deposit.groupBy({
        by: ['userId'],
        where: { status: 'COMPLETED', paymentMethod: 'ADMIN' },
        _sum: { amount: true },
      }),
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

    const adminCreditsByUser = new Map<number, number>()
    adminCreditsAgg.forEach((row) => {
      adminCreditsByUser.set(row.userId, Number(row._sum.amount ?? 0))
    })

    const totalBalanceNoAdmin = usersForBalance.reduce((sum, user) => {
      const adminCredits = adminCreditsByUser.get(user.id) || 0
      return sum + Math.max(user.totalDeposit - adminCredits, 0)
    }, 0)

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
        totalBalance: Number((balanceAgg as any)._sum.totalDeposit ?? 0),
        totalBalanceNoAdmin,
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
  botStartedAt: user.botStartedAt || null,
  // New fields
  comment: user.comment || null,
  currentProfit: user.profit, // Current profit balance
  totalProfit: user.totalProfit || 0, // Lifetime profit
  // totalDeposit is already the working balance (net of withdrawals/reservations).
  remainingBalance: user.totalDeposit,
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
    const linksByChannelInvite = new Map(
      marketingLinks
        .filter(l => Boolean((l as any).channelInviteLink))
        .map(l => [normalizeInviteLink((l as any).channelInviteLink) || String((l as any).channelInviteLink), l] as const)
    )

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

      // Channel attribution: if the user joined via a Telegram invite link whose name contains mk_...
      // (recommended: set the invite link name to the marketing linkId), attribute the lead to that link.
      if (!marketingLink) {
        const rawUtm = (user as any).utmParams
        if (rawUtm && typeof rawUtm === 'string' && rawUtm.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(rawUtm)
            const inviteLinkName = parsed?.inviteLinkName
            const inviteLink = parsed?.inviteLink
            const candidateSource = String(inviteLinkName || inviteLink || '')
            const mkMatch = candidateSource.match(/mk_[a-zA-Z0-9_]+/)
            const candidateLinkId = mkMatch ? mkMatch[0] : null
            if (candidateLinkId) {
              marketingLink = linksByLinkId.get(candidateLinkId) || null
            }
          } catch {
            // ignore JSON parse errors
          }
        }
      }

      // Channel attribution: exact match by inviteLink URL against stored marketingLink.channelInviteLink
      if (!marketingLink) {
        const rawUtm = (user as any).utmParams
        if (rawUtm && typeof rawUtm === 'string' && rawUtm.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(rawUtm)
            const inviteLink = parsed?.inviteLink
            if (inviteLink) {
              const key = normalizeInviteLink(inviteLink) || String(inviteLink)
              marketingLink = linksByChannelInvite.get(key) || null
            }
          } catch {
            // ignore JSON parse errors
          }
        }
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

      // If user came from Telegram channel, expose it as Link Name in CRM.
      // This makes channel leads visible even without mk_ marketing links.
      if (!linkName) {
        const isChannelSource = String((user as any).marketingSource || '').toLowerCase() === 'channel'
          || String((user as any).utmParams || '').toLowerCase() === 'channel'

        if (isChannelSource) {
          let channelLinkName: string | null = 'CHANNEL'
          const rawUtm = (user as any).utmParams
          if (rawUtm && typeof rawUtm === 'string' && rawUtm.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(rawUtm)
              if (parsed?.inviteLinkName) channelLinkName = String(parsed.inviteLinkName)
              else if (parsed?.inviteLink) channelLinkName = String(parsed.inviteLink)
            } catch {
              // ignore JSON parse errors
            }
          }
          linkName = channelLinkName
        }
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
    const { status, limit = '100', page = '1', search } = req.query
    const take = Math.min(parseInt(String(limit), 10) || 100, 500)
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1)
    const skip = (pageNum - 1) * take

    // NOTE: Previously we auto-expired stale deposits (default ~35 minutes) as a cleanup-on-read.
    // This can surprise support/admin by making PENDING deposits disappear from the CRM.
    // To avoid that, auto-expire is now opt-in.
    if (String(process.env.ADMIN_DEPOSIT_AUTO_EXPIRE || '').toLowerCase() === 'true') {
      // Auto-expire stale deposits when payment links are expected to be expired.
      // OxaPay invoices are created with lifeTime=30 minutes (see src/oxapay.ts).
      const oxapayExpireMinutes = Number(process.env.DEPOSIT_EXPIRE_MINUTES_OXAPAY || 35)
      const paypalExpireMinutes = Number(process.env.DEPOSIT_EXPIRE_MINUTES_PAYPAL || 35)
      const now = new Date()
      const oxapayCutoff = new Date(now.getTime() - oxapayExpireMinutes * 60 * 1000)
      const paypalCutoff = new Date(now.getTime() - paypalExpireMinutes * 60 * 1000)

      await prisma.deposit.updateMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          createdAt: { lt: oxapayCutoff },
          paymentMethod: 'OXAPAY',
        },
        data: { status: 'FAILED' },
      })

      await prisma.deposit.updateMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          createdAt: { lt: paypalCutoff },
          paymentMethod: 'PAYPAL',
        },
        data: { status: 'FAILED' },
      })
    }

    const baseWhere: any = status
      ? {
          status: String(status).toUpperCase(),
        }
      : {}

    const searchStr = typeof search === 'string' ? search.trim() : ''
    const where: any = { ...baseWhere }
    if (searchStr) {
      const or: any[] = []
      const asNumber = Number(searchStr)
      if (Number.isInteger(asNumber) && asNumber > 0) {
        or.push({ id: asNumber })
      }
      or.push({ user: { telegramId: { contains: searchStr, mode: 'insensitive' } } })
      or.push({ user: { username: { contains: searchStr, mode: 'insensitive' } } })
      or.push({ user: { firstName: { contains: searchStr, mode: 'insensitive' } } })
      or.push({ user: { lastName: { contains: searchStr, mode: 'insensitive' } } })
      where.OR = or
    }

    const totalCount = await prisma.deposit.count({ where })
    const totalPages = Math.ceil(totalCount / take) || 1

    const deposits = await prisma.deposit.findMany({
      where,
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
      skip,
      take,
    })

    // Precompute per-user first REAL (money) deposit id to properly label FTD.
    // Exclude synthetic deposits such as manual profit credits (currency = 'PROFIT').
    const userIds = Array.from(new Set(deposits.map(d => d.userId)))
    const completedRealDeposits = await prisma.deposit.findMany({
      where: {
        userId: { in: userIds },
        status: 'COMPLETED',
        NOT: [{ currency: 'PROFIT' }],
      },
      select: { id: true, userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const firstRealDepositIdByUserId = new Map<number, number>()
    for (const dep of completedRealDeposits) {
      if (!firstRealDepositIdByUserId.has(dep.userId)) {
        firstRealDepositIdByUserId.set(dep.userId, dep.id)
      }
    }

    // Get all marketing links to match with users
    const marketingLinks = await prisma.marketingLink.findMany()
    const linksByLinkId = new Map(marketingLinks.map(l => [l.linkId, l]))

    const payload = deposits.map((deposit) => {
      // Determine depStatus based on deposit status
      const depStatus = deposit.status === 'COMPLETED' ? 'paid' : deposit.status === 'FAILED' ? 'failed' : 'processing'
      
      // Determine leadStatus
      let leadStatus: 'FTD' | 'withdraw' | 'reinvest' | 'active' = 'active'
      
      const firstRealDepositId = firstRealDepositIdByUserId.get(deposit.userId)
      const hasRealFtd = typeof firstRealDepositId === 'number'
      const isFirstRealDeposit = deposit.status === 'COMPLETED' && firstRealDepositId === deposit.id && deposit.currency !== 'PROFIT'

      if (isFirstRealDeposit) {
        leadStatus = 'FTD'
      } else if (deposit.user.withdrawals.length > 0) {
        leadStatus = 'withdraw'
      } else if (hasRealFtd && deposit.user.dailyUpdates.length > 0) {
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

    return res.json({
      deposits: payload,
      count: payload.length,
      totalCount,
      page: pageNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    })
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
      status: withdrawal.status === 'APPROVED' ? 'COMPLETED' : withdrawal.status,
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
      // `balance` is legacy; `totalDeposit` is the working balance.
      balance: user.totalDeposit,
      profit: user.profit || 0,
      totalDeposit: user.totalDeposit,
      totalWithdraw: user.totalWithdraw,
      bonusTokens: user.bonusTokens || 0,
      arbitrageTradeEnabled: user.arbitrageTradeEnabled || false,
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

// Check if user is a member of the required chat/channel (gate access to mini-app)
app.get('/api/user/:telegramId/membership', requireUserAuth, async (req, res) => {
  try {
    const telegramId = (req as any).verifiedTelegramId as string

    const botToken = process.env.BOT_TOKEN
    if (!botToken) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const requiredChatId = process.env.REQUIRED_MEMBERSHIP_CHAT_ID
    const requiredChatLink = process.env.REQUIRED_MEMBERSHIP_LINK || 'https://t.me/+T-daFo58lL4yNDY6'
    if (!requiredChatId) {
      return res.status(500).json({ error: 'Membership chat is not configured', chatLink: requiredChatLink })
    }

    try {
      const tgRes = await axios.get(`https://api.telegram.org/bot${botToken}/getChatMember`, {
        params: {
          chat_id: requiredChatId,
          user_id: telegramId,
        },
        timeout: 8000,
      })

      const status = tgRes.data?.result?.status as string | undefined
      const isMember = status === 'creator' || status === 'administrator' || status === 'member'

      return res.json({ isMember, status: status || 'unknown', chatLink: requiredChatLink })
    } catch (err: any) {
      // If Telegram says the user isn't a participant, treat it as not a member.
      const description = err?.response?.data?.description as string | undefined
      const lower = description?.toLowerCase() || ''
      if (lower.includes('user not found') || lower.includes('user_not_participant') || lower.includes('not a member') || lower.includes('participant_id_invalid')) {
        return res.json({ isMember: false, status: 'left', chatLink: requiredChatLink })
      }

      console.error('Membership check failed:', description || err?.message || err)
      return res.status(500).json({ error: 'Membership check failed', chatLink: requiredChatLink })
    }
  } catch (error) {
    console.error('Membership API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Check whether the user has started the Support bot (used as an access gate in the mini-app)
app.get('/api/user/:telegramId/support-bot-started', requireUserAuth, async (req, res) => {
  try {
    const telegramId = (req as any).verifiedTelegramId as string

    const username = (process.env.SUPPORT_BOT_USERNAME || 'syntrix_support_bot').replace(/^@/, '')
    const baseLink = process.env.SUPPORT_BOT_LINK || `https://t.me/${username}`
    const supportBotLink = process.env.SUPPORT_BOT_START_LINK || `${baseLink}?start=activate`

    const [user, chat] = await Promise.all([
      prisma.user.findUnique({ where: { telegramId } }),
      prisma.supportChat.findUnique({ where: { telegramId } }),
    ])

    const started = Boolean(user?.contactSupportSeen)
    const startedAt = user?.contactSupportBonusGrantedAt || chat?.startedAt || null

    return res.json({
      started,
      startedAt,
      supportBotLink,
      supportBotConfigured: Boolean(process.env.SUPPORT_BOT_TOKEN) || Boolean(supportBotInstance),
    })
  } catch (error) {
    console.error('Support bot started check error:', error)
    return res.status(500).json({ error: 'Failed to check support bot status' })
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

const gameBuyBoxSchema = z.object({
  boxId: z.enum(['genesis', 'matrix', 'quantum', 'vault', 'liquidity', 'whale'])
})

type GameBoxId = z.infer<typeof gameBuyBoxSchema>['boxId']

type GameBoxConfig = {
  id: GameBoxId
  cost: number
  maxPrize: number
}

const GAME_BOXES: Record<GameBoxId, GameBoxConfig> = {
  genesis: { id: 'genesis', cost: 150, maxPrize: 250 },
  matrix: { id: 'matrix', cost: 525, maxPrize: 700 },
  quantum: { id: 'quantum', cost: 1500, maxPrize: 2000 },
  vault: { id: 'vault', cost: 3750, maxPrize: 5000 },
  liquidity: { id: 'liquidity', cost: 7500, maxPrize: 10000 },
  whale: { id: 'whale', cost: 18750, maxPrize: 25000 }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function buildGameOutcomes(cost: number, maxPrize: number): number[] {
  // 60 distinct prize options. Most outcomes are below cost so users lose more often than win.
  const values = new Set<number>()

  const push = (v: number) => {
    let x = Math.max(0, round2(v))
    while (values.has(x)) x = round2(x + 0.01)
    values.add(x)
  }

  // 45 loss-leaning values: 0 .. 0.9 * cost
  for (let i = 0; i < 45; i++) {
    const t = i / 44
    push(t * (cost * 0.9))
  }

  // 10 near break-even values: 0.9 * cost .. 1.05 * cost
  for (let i = 0; i < 10; i++) {
    const t = (i + 1) / 10
    push(cost * 0.9 + t * (cost * 0.15))
  }

  // 4 higher wins
  push(maxPrize * 0.35)
  push(maxPrize * 0.5)
  push(maxPrize * 0.7)
  push(maxPrize * 0.9)

  // 1 jackpot
  push(maxPrize)

  return Array.from(values)
    .slice(0, 60)
    .sort((a, b) => a - b)
}

// Buy a game box using bonusTokens (virtual credits)
app.post('/api/user/:telegramId/game/buy-box', requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Use verified telegramId from JWT, not from URL params
    const telegramId = (req as any).verifiedTelegramId

    const parsed = gameBuyBoxSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request' })
    }

    const box = GAME_BOXES[parsed.data.boxId]
    const outcomes = buildGameOutcomes(box.cost, box.maxPrize)

    // Pick outcome uniformly across 60 options
    const prizeIndex = crypto.randomInt(0, outcomes.length)
    const prize = outcomes[prizeIndex]
    const delta = prize - box.cost

    const user = await prisma.user.findUnique({ where: { telegramId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updated = await prisma.user.updateMany({
      where: {
        id: user.id,
        bonusTokens: { gte: box.cost }
      },
      data: {
        bonusTokens: { increment: delta }
      }
    })

    if (updated.count === 0) {
      return res.status(400).json({ error: 'Insufficient bonus tokens' })
    }

    const refreshed = await prisma.user.findUnique({ where: { id: user.id } })

    res.json({
      success: true,
      boxId: box.id,
      cost: box.cost,
      maxPrize: box.maxPrize,
      outcomes,
      prizeIndex,
      prize,
      newBonusTokens: refreshed?.bonusTokens ?? 0
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
        trackId: invoice.trackId
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
          balance: { increment: deposit.amount },
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
                balance: { increment: deposit.amount },
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
                balance: { increment: deposit.amount },
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

    // Reservation split: profit first, then deposit
    const profitToReserve = Math.min(user.profit || 0, amount)
    const depositToReserve = amount - profitToReserve
    const newDeposit = user.totalDeposit - depositToReserve

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
        reservedProfit: profitToReserve,
        reservedDeposit: depositToReserve,
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

    // STEP 1: Reserve funds (profit first, then deposit)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profit: { decrement: profitToReserve },
        totalDeposit: { decrement: depositToReserve },
        // Keep legacy balance mirrored with totalDeposit.
        balance: { decrement: depositToReserve }
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
    const callbackNetwork = req.body.network || req.body.chain || req.body.blockchain || req.body.payNetwork || req.body.pay_network
    const callbackCurrencyRaw = req.body.payCurrency || req.body.pay_currency || req.body.currency
    const callbackCurrency = callbackCurrencyRaw ? String(callbackCurrencyRaw).toUpperCase() : null
    
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
        const paid = status === 'Paid' || status === 'paid'

        await prisma.$transaction(async (tx) => {
          // Always store the real chain hash.
          await tx.withdrawal.update({
            where: { id: withdrawal.id },
            data: { txHash: txID },
          })

          if (paid) {
            // Mark completed once and only once.
            const marked = await tx.withdrawal.updateMany({
              where: { id: withdrawal.id, status: { not: 'COMPLETED' } },
              data: { status: 'COMPLETED' },
            })

            if (marked.count === 1) {
              await tx.user.update({
                where: { id: withdrawal.userId },
                data: { totalWithdraw: { increment: withdrawal.amount } },
              })
            }
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

    // Find deposit by trackId (or legacy txHash)
    const deposit = await prisma.deposit.findFirst({
      where: { OR: [{ trackId }, { txHash: trackId }] },
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

    const normalizedTxHash = typeof txID === 'string' && /[a-f0-9]{16,}/i.test(txID) ? txID : null
    const shouldClearLegacyTxHash = !normalizedTxHash && deposit.txHash === trackId

    // SECURITY: Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update deposit status to COMPLETED
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'COMPLETED',
          trackId: deposit.trackId || trackId,
          ...(callbackNetwork ? { network: String(callbackNetwork) } : {}),
          ...(callbackCurrency && callbackCurrency !== 'USD' ? { currency: callbackCurrency } : {}),
          ...(normalizedTxHash ? { txHash: normalizedTxHash } : (shouldClearLegacyTxHash ? { txHash: null } : {}))
        }
      })

      // Add amount to user totalDeposit and activate account if needed
      await tx.user.update({
        where: { id: deposit.userId },
        data: {
          balance: { increment: deposit.amount },
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
    
    // Check if user reached $500 and activate referral
    if (updatedUser.totalDeposit >= 500 && updatedUser.referredBy && !updatedUser.isActiveReferral) {
      await prisma.user.update({
        where: { id: updatedUser.id },
        data: { isActiveReferral: true }
      })
      
      // Notify referrer
      try {
        const { bot: botInstance } = await import('./index.js')
        await botInstance.api.sendMessage(
          updatedUser.referredBy,
          `🎉 Your referral has become active! They reached $500 deposit.\nYou will now earn 4% from their daily profits.`
        )
      } catch (err) {
        console.error('Failed to notify referrer:', err)
      }
      
      console.log(`✅ Referral activated: ${deposit.user.telegramId} for referrer ${updatedUser.referredBy}`)
    }
    
    // Calculate plan info for user based on totalDeposit
    const planInfo = calculateTariffPlan(updatedUser.totalDeposit)
    const progressBar = '█'.repeat(Math.floor(planInfo.progress / 10)) + '░'.repeat(10 - Math.floor(planInfo.progress / 10))
    
    const updatedDeposit = await prisma.deposit.findUnique({
      where: { id: deposit.id }
    })

    // Notify user about successful deposit
    try {
      const { bot: botInstance } = await import('./index.js')
      
      let userMessage = `✅ *Deposit Successful!*\n\n`
      const userCurrency = (updatedDeposit?.currency || deposit.currency).toUpperCase()
      const userNetwork = updatedDeposit?.network
      const userTxHash = updatedDeposit?.txHash
      userMessage += `💰 Amount: $${deposit.amount.toFixed(2)} ${userCurrency}\n`
      if (userNetwork) {
        userMessage += `🌐 Network: ${userNetwork}\n`
      }
      if (userTxHash) {
        userMessage += `🔗 TX Hash: ${userTxHash}\n`
      }
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
      const safeCurrency = ((updatedDeposit?.currency || deposit.currency) || '—').toString().replace(/_/g, '\\_').toUpperCase()
      const safeNetwork = ((updatedDeposit?.network) || '—').toString().replace(/_/g, '\\_')
      const safeTxHash = ((updatedDeposit?.txHash) || '—').toString().replace(/_/g, '\\_')
      
      await notifySupport(
        `💰 *New Deposit Received*\n\n` +
        `👤 User: @${escapedUsername} (ID: ${deposit.user.telegramId})\n` +
        `💵 Amount: $${deposit.amount.toFixed(2)}\n` +
        `💎 Crypto: ${safeCurrency}\n` +
        `🌐 Network: ${safeNetwork}\n` +
        `🔗 TX Hash: ${safeTxHash}\n` +
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

// Public: fetch (or create) a Telegram channel invite link for a marketing link.
// Used by landing pages to attribute channel joins to the correct mk_* link.
app.get('/api/marketing-links/:linkId/channel-invite', async (req, res) => {
  try {
    const { linkId } = req.params
    if (!linkId) return res.status(400).json({ error: 'linkId is required' })
    if (!/^mk_[a-zA-Z0-9_]+$/.test(linkId)) {
      return res.status(400).json({ error: 'Invalid linkId' })
    }

    const channelIdRaw = process.env.CHANNEL_ID
    if (!channelIdRaw) {
      return res.status(400).json({ error: 'CHANNEL_ID is not configured' })
    }
    const channelId = normalizeTelegramChatIdForApi(channelIdRaw)

    const link = await prisma.marketingLink.findUnique({ where: { linkId } })
    if (!link || !link.isActive) return res.status(404).json({ error: 'Link not found' })

    const existingInvite = (link as any).channelInviteLink
    if (existingInvite) {
      return res.json({ inviteLink: String(existingInvite) })
    }

    const { bot } = await import('./index.js')
    const invite = await bot.api.createChatInviteLink(channelId, { name: linkId })

    await prisma.marketingLink.update({
      where: { linkId },
      data: { channelInviteLink: invite.invite_link },
    })

    return res.json({ inviteLink: invite.invite_link })
  } catch (error) {
    console.error('Public channel invite link error:', error)
    return res.status(500).json({ error: 'Failed to load channel invite link' })
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

    // Include users attributed via channel joins (invite links), not only direct bot start payload.
    // This restores per-link visibility for channel funnels.
    const usersAll = await prisma.user.findMany({
      where: { isHidden: false },
      include: {
        deposits: { where: { status: 'COMPLETED' } },
        withdrawals: { where: { status: 'COMPLETED' } },
      },
    })

    const mkLinkIds = new Set(links.map(l => l.linkId))
    const linksByChannelInvite = new Map(
      links
        .filter(l => Boolean((l as any).channelInviteLink))
        .map(l => [normalizeInviteLink((l as any).channelInviteLink) || String((l as any).channelInviteLink), l] as const)
    )

    const extractAttributedLinkId = (user: any): string | null => {
      const raw = user?.utmParams
      if (typeof raw === 'string') {
        const directMk = raw.match(/mk_[a-zA-Z0-9_]+/)
        if (directMk && mkLinkIds.has(directMk[0])) return directMk[0]

        if (raw.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(raw)
            const candidate = String(parsed?.inviteLinkName || parsed?.inviteLink || '')
            const mk = candidate.match(/mk_[a-zA-Z0-9_]+/)
            if (mk && mkLinkIds.has(mk[0])) return mk[0]

            const inv = parsed?.inviteLink
            const key = normalizeInviteLink(inv)
            if (key) {
              const link = linksByChannelInvite.get(key)
              if (link) return link.linkId
            }
          } catch {
            // ignore
          }
        }
      }
      return null
    }

    const usersByLinkId = new Map<string, any[]>()
    for (const u of usersAll) {
      const linkId = extractAttributedLinkId(u)
      if (!linkId) continue
      const arr = usersByLinkId.get(linkId) || []
      arr.push(u)
      usersByLinkId.set(linkId, arr)
    }
    
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Calculate metrics for each link
    const enrichedLinks = await Promise.all(links.map(async (link) => {
      const users = usersByLinkId.get(link.linkId) || []
      
      const isChannelUser = (u: any) => String(u.marketingSource || '').toLowerCase() === 'channel'

      // Channel-only users (joined channel, did not open mini-app)
      const channelLeadsArr = users.filter(u => isChannelUser(u) && !u.ipAddress)
      const channelLeads = channelLeadsArr.length

      // Leads = users WITHOUT IP (only pressed /start in bot, didn't open mini-app), excluding channel-only
      const leads = users.filter(u => !u.ipAddress && !isChannelUser(u))
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
        channelLeads,
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
    const links = await prisma.marketingLink.findMany({ orderBy: { createdAt: 'desc' } })
    const users = await prisma.user.findMany({
      where: { isHidden: false },
      include: { deposits: true },
    })

    const linksByChannelInvite = new Map(
      links
        .filter(l => Boolean((l as any).channelInviteLink))
        .map(l => [normalizeInviteLink((l as any).channelInviteLink) || String((l as any).channelInviteLink), l] as const)
    )

    const statsBySource = new Map<string, {
      source: string
      users: number
      leads: number
      ftd: number
    }>()

    const ensure = (source: string) => {
      const key = source || 'Unknown'
      if (!statsBySource.has(key)) {
        statsBySource.set(key, { source: key, users: 0, leads: 0, ftd: 0 })
      }
      return statsBySource.get(key)!
    }

    const mkLinkIds = new Set(links.map(l => l.linkId))
    const extractMkFromChannelUtm = (rawUtm: unknown): string | null => {
      if (!rawUtm || typeof rawUtm !== 'string') return null
      const trimmed = rawUtm.trim()
      if (!trimmed.startsWith('{')) return null
      try {
        const parsed = JSON.parse(trimmed)
        const candidate = String(parsed?.inviteLinkName || parsed?.inviteLink || '')
        const match = candidate.match(/mk_[a-zA-Z0-9_]+/)
        const linkId = match ? match[0] : null
        if (linkId && mkLinkIds.has(linkId)) return linkId
      } catch {
        return null
      }
      return null
    }

    for (const user of users) {
      // Determine attribution source
      let source = (user.marketingSource || '').trim() || 'Unknown'

      // If user has mk_... stored directly in utmParams, attribute by that linkId (more precise)
      if (user.utmParams) {
        const directMk = user.utmParams.match(/mk_[a-zA-Z0-9_]+/)
        if (directMk && mkLinkIds.has(directMk[0])) {
          source = directMk[0]
        }
      }

      // Channel attribution via invite link name containing mk_...
      if (source.toLowerCase() === 'channel') {
        const ch = extractMkFromChannelUtm(user.utmParams)
        if (ch) source = ch
      }

      // Channel attribution via inviteLink URL match (marketingLink.channelInviteLink)
      if (source.toLowerCase() === 'channel') {
        const rawUtm = user.utmParams
        if (rawUtm && typeof rawUtm === 'string' && rawUtm.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(rawUtm)
            const inviteLink = parsed?.inviteLink
            if (inviteLink) {
              const key = normalizeInviteLink(inviteLink) || String(inviteLink)
              const link = linksByChannelInvite.get(key)
              if (link) source = link.linkId
            }
          } catch {
            // ignore
          }
        }
      }

      const stat = ensure(source)
      stat.users += 1

      const hasFtd = (user.deposits || []).some(d => d.status === 'COMPLETED' && d.amount > 0)
      if (hasFtd) stat.ftd += 1

      // Lead = user without completed deposit
      if (!hasFtd) stat.leads += 1
    }

    return res.json({ sources: Array.from(statsBySource.values()) })
  } catch (error) {
    console.error('Get marketing stats error:', error)
    return res.status(500).json({ error: 'Failed to load marketing stats' })
  }
})

// Create (or reuse) a Telegram channel invite link for a marketing link.
// Requires the bot to be an admin in the channel.
app.post('/api/admin/marketing-links/:linkId/channel-invite', requireAdminAuth, async (req, res) => {
  try {
    const { linkId } = req.params
    if (!linkId) return res.status(400).json({ error: 'linkId is required' })

    const channelIdRaw = process.env.CHANNEL_ID
    if (!channelIdRaw) {
      return res.status(400).json({ error: 'CHANNEL_ID is not configured' })
    }
    const channelId = normalizeTelegramChatIdForApi(channelIdRaw)

    const link = await prisma.marketingLink.findUnique({ where: { linkId } })
    if (!link) return res.status(404).json({ error: 'Link not found' })

    // If already generated, just return it
    const existingInvite = (link as any).channelInviteLink
    if (existingInvite) {
      return res.json({ inviteLink: String(existingInvite), link })
    }

    const { bot } = await import('./index.js')
    const invite = await bot.api.createChatInviteLink(channelId, { name: linkId })

    const updated = await prisma.marketingLink.update({
      where: { linkId },
      data: { channelInviteLink: invite.invite_link },
    })

    return res.json({ inviteLink: invite.invite_link, link: updated })
  } catch (error) {
    console.error('Create channel invite link error:', error)
    return res.status(500).json({ error: 'Failed to create channel invite link' })
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

// Delete user (for removing test accounts from CRM)
app.delete('/api/admin/users/:telegramId', requireAdminAuth, async (req, res) => {
  try {
    const { telegramId } = req.params
    if (!telegramId) return res.status(400).json({ error: 'telegramId is required' })

    const user = await prisma.user.findUnique({ where: { telegramId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const allowDeletePrivileged = String(process.env.CRM_ALLOW_DELETE_PRIVILEGED_USERS || '')
      .toLowerCase() === 'true'

    // Prevent accidental deletion of privileged accounts unless explicitly allowed.
    try {
      const { ADMIN_IDS } = await import('./index.js')
      if (Array.isArray(ADMIN_IDS) && ADMIN_IDS.includes(telegramId) && !allowDeletePrivileged) {
        return res.status(403).json({ error: 'Cannot delete admin account' })
      }
    } catch {
      // ignore
    }

    if ((user.isAdmin || ['admin', 'support'].includes(String(user.role))) && !allowDeletePrivileged) {
      return res.status(403).json({ error: 'Cannot delete privileged user' })
    }

    await prisma.$transaction([
      prisma.referral.deleteMany({
        where: {
          OR: [{ userId: user.id }, { referredUserId: user.id }],
        },
      }),
      prisma.notification.deleteMany({ where: { userId: user.id } }),
      prisma.withdrawal.deleteMany({ where: { userId: user.id } }),
      prisma.deposit.deleteMany({ where: { userId: user.id } }),
      prisma.dailyProfitUpdate.deleteMany({ where: { userId: user.id } }),
      prisma.aiAnalyticsRequestLog.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { telegramId } }),
    ])

    return res.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ error: 'Failed to delete user' })
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

export function startApiServer(bot?: Bot, supportBot?: Bot) {
  supportBotInstance = supportBot

  if (supportBotInstance && !supportBroadcastWorkerTimer) {
    supportBroadcastWorkerTimer = setInterval(processSupportBroadcastTick, 750)
  }

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

  if (supportBot) {
    app.post('/support-webhook', async (req, res) => {
      const clientIp = req.ip || req.headers['x-real-ip'] || req.headers['x-forwarded-for']
      console.log(`📥 Support webhook request received from ${clientIp}`)

      // Verify secret token (do NOT log secrets)
      const receivedHeader = req.headers['x-telegram-bot-api-secret-token']
      const receivedToken = typeof receivedHeader === 'string'
        ? receivedHeader
        : (Array.isArray(receivedHeader) ? receivedHeader[0] : undefined)

      if (!safeCompare(receivedToken, SUPPORT_WEBHOOK_SECRET_TOKEN)) {
        console.error('❌ Invalid support webhook secret token')
        return res.status(401).json({ error: 'Unauthorized' })
      }

      try {
        await supportBot.handleUpdate(req.body)
        res.sendStatus(200)
      } catch (error) {
        console.error('Error processing support webhook:', error)
        res.sendStatus(500)
      }
    })
    console.log('✅ Support webhook handler registered at /support-webhook')
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

  if (supportBroadcastWorkerTimer) {
    clearInterval(supportBroadcastWorkerTimer)
    supportBroadcastWorkerTimer = null
  }
}

export { app, prisma }
