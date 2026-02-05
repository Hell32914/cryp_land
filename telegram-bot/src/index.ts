import { Bot, Context, InlineKeyboard, InputFile } from 'grammy'
import { prisma } from './db.js'
import * as dotenv from 'dotenv'
import { startApiServer, stopApiServer } from './api.js'
import { scheduleTradingCards, postTradingCard, rescheduleCards } from './tradingCardScheduler.js'
import { generateTradingCard, formatCardCaption, getLastTradingPostData } from './cardGenerator.js'
import { getCardSettings, updateCardSettings } from './cardSettings.js'
import { claimContactSupportBonus } from './contactSupportBonus.js'
import cron from 'node-cron'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'KYC_REQUIRED' | 'BLOCKED'
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'

dotenv.config()

export const bot = new Bot(process.env.BOT_TOKEN!)

// Optional: separate support bot (CRM Support inbox)
const SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN
export const supportBot = SUPPORT_BOT_TOKEN ? new Bot(SUPPORT_BOT_TOKEN) : null

// Parse admin IDs from comma-separated list in .env
const ADMIN_IDS_STRING = process.env.ADMIN_IDS || process.env.ADMIN_ID || ''
export const ADMIN_IDS = ADMIN_IDS_STRING.split(',').map(id => id.trim()).filter(id => id.length > 0)
export const ADMIN_ID = ADMIN_IDS[0] || '' // Legacy support

console.log(`🔐 ADMIN_IDS loaded: [${ADMIN_IDS.join(', ')}]`)

const WEBAPP_URL = process.env.WEBAPP_URL!
const LANDING_URL = 'https://syntrix.website'
const CHANNEL_ID = process.env.CHANNEL_ID || process.env.BOT_TOKEN!.split(':')[0]
const CHANNEL_ID_CONFIG = process.env.CHANNEL_ID
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME

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

function extractMkLinkId(value: unknown): string | null {
  if (!value) return null
  const s = typeof value === 'string' ? value : JSON.stringify(value)
  const m = s.match(/mk_[a-zA-Z0-9_]+/)
  return m ? m[0] : null
}

async function resolveMarketingLinkIdFromInvite(inviteLink: any): Promise<string | null> {
  // 1) Best case: invite link has a name equal to mk_...
  const mkFromName = extractMkLinkId(inviteLink?.name)
  if (mkFromName) return mkFromName

  // 2) Fallback: match invite URL against stored marketingLink.channelInviteLink
  const inviteUrl = inviteLink?.invite_link || inviteLink
  const normalizedInvite = normalizeInviteLink(inviteUrl)
  if (!normalizedInvite) return null

  try {
    const links = await prisma.marketingLink.findMany({
      where: { channelInviteLink: { not: null } },
      select: { linkId: true, channelInviteLink: true },
    })

    for (const l of links as any[]) {
      const normalizedStored = normalizeInviteLink(l.channelInviteLink)
      if (normalizedStored && normalizedStored === normalizedInvite) return String(l.linkId)
    }
  } catch {
    // ignore
  }

  return null
}

function isChannelChatId(chat: any): boolean {
  if (!chat) return false
  const chatIdStr = chat?.id === undefined || chat?.id === null ? '' : String(chat.id)
  const envIdStr = CHANNEL_ID_CONFIG ? String(CHANNEL_ID_CONFIG) : ''
  const chatUsername = String(chat?.username || '').replace(/^@/, '')
  const envUsername = String(CHANNEL_USERNAME || '').replace(/^@/, '')

  if (envIdStr) {
    if (chatIdStr === envIdStr) return true
    // Allow passing channel id without the "-100" prefix in env.
    // Telegram often represents channels/supergroups as -100xxxxxxxxxx.
    if (/^\d+$/.test(envIdStr) && chatIdStr === `-100${envIdStr}`) return true
  }

  if (envUsername && chatUsername && chatUsername.toLowerCase() === envUsername.toLowerCase()) {
    return true
  }

  // If no explicit channel is configured, accept any channel chat updates.
  if (!envIdStr && !envUsername) {
    return chat?.type === 'channel'
  }

  return false
}

function buildChannelUtmParams(inviteLink?: any): string {
  const payload: Record<string, any> = {
    channel: true,
    joinedAt: new Date().toISOString(),
  }

  if (inviteLink) {
    // Telegram Bot API: ChatInviteLink object
    payload.inviteLink = inviteLink.invite_link || inviteLink
    if (inviteLink.name) payload.inviteLinkName = inviteLink.name
    if (inviteLink.creator?.id) payload.inviteLinkCreatorId = String(inviteLink.creator.id)
  }

  return JSON.stringify(payload)
}

// Admin state management
const adminState = new Map<string, {
  awaitingInput?: string,
  targetUserId?: number,
  attempts?: number,
  lastAttempt?: number,
  broadcastMessage?: any,
  contactSupportBonusAmount?: number,
  csBonusAmount?: number,
  usersSearchQuery?: string,
  usersSearchPage?: number,
  currentUsersListPage?: number,
  arbitrageSearchQuery?: string,
  arbitrageSearchPage?: number,
  currentArbitrageUsersPage?: number,
  currentPendingWithdrawalsPage?: number,
  currentDepositsPage?: number,
  currentPendingDepositsPage?: number,
  currentWithdrawalsPage?: number,
}>()

// Arbitrage Trade admin flow is English-only by request.
const ARBITRAGE_TRADE_EN = {
  menu: '⚖️ Arbitrage Trade',
  title: '⚖️ Arbitrage Trade',
  searchTitle: '🔎 Search Users',
  searchPrompt:
    'Send a username or Telegram ID to search:\n' +
    '• `@username`\n' +
    '• `username`\n' +
    '• `123456789` (Telegram ID)\n\n' +
    '⚠️ Send /cancel to abort',
  enabled: '✅ Enabled',
  disabled: '🚫 Disabled',
  enableBtn: '✅ Enable',
  disableBtn: '🚫 Disable',
  backToList: '◀️ Back',
  backToAdmin: '◀️ Back to Admin',
} as const

// Middleware to check if user is blocked (blocks all bot interactions)
bot.use(async (ctx, next) => {
  const telegramId = ctx.from?.id.toString()
  if (!telegramId) return next()
  
  // Skip check for admins
  if (ADMIN_IDS.includes(telegramId)) return next()
  
  const user = await prisma.user.findUnique({
    where: { telegramId }
  })
  
  if (user?.isBlocked) {
    // Only respond to /start command with block message, ignore everything else
    if (ctx.message?.text === '/start') {
      await ctx.reply('⛔️ Your account has been blocked. Please contact support if you believe this is a mistake.')
    }
    return // Don't process any further
  }
  
  return next()
})

// ============= CHANNEL LEAD CAPTURE =============
// When a user joins the Telegram channel (even before they start the bot),
// create a lead record so it appears in CRM with source CHANNEL.
bot.on('chat_member', async (ctx) => {
  try {
    const update: any = (ctx as any).update
    const chatMemberUpdate = update?.chat_member
    if (!chatMemberUpdate) return

    const chatInfo = chatMemberUpdate.chat
    if (!isChannelChatId(chatInfo)) return

    const user = chatMemberUpdate.new_chat_member?.user
    if (!user?.id) return

    const oldStatus = chatMemberUpdate.old_chat_member?.status
    const newStatus = chatMemberUpdate.new_chat_member?.status
    const joinedStatuses = new Set(['member', 'restricted', 'administrator', 'creator'])
    const leftStatuses = new Set(['left', 'kicked'])

    // Only handle actual join transitions
    if (!joinedStatuses.has(newStatus)) return
    if (oldStatus && !leftStatuses.has(oldStatus)) return

    const telegramId = String(user.id)
    const resolvedLinkId = await resolveMarketingLinkIdFromInvite(chatMemberUpdate.invite_link)
    const utmParams = resolvedLinkId ? resolvedLinkId : buildChannelUtmParams(chatMemberUpdate.invite_link)

    const existing = await prisma.user.findUnique({ where: { telegramId } })
    if (!existing) {
      await prisma.user.create({
        data: {
          telegramId,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          marketingSource: 'Channel',
          utmParams,
        },
      })

      // Treat a successful channel join as a conversion for that marketing link.
      if (resolvedLinkId) {
        await prisma.marketingLink.update({
          where: { linkId: resolvedLinkId },
          data: { conversions: { increment: 1 } },
        }).catch(() => {})
      }
      return
    }

    const data: any = {
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    }
    if (!existing.marketingSource) data.marketingSource = 'Channel'
    // Prefer precise mk_* attribution when available.
    if (resolvedLinkId) {
      const cur = String(existing.utmParams || '').trim()
      const alreadyHasMk = Boolean(cur.match(/mk_[a-zA-Z0-9_]+/))
      if (!alreadyHasMk) data.utmParams = resolvedLinkId
    } else if (!existing.utmParams) {
      data.utmParams = utmParams
    }

    // Avoid unnecessary writes
    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { telegramId }, data })
    }
  } catch (error) {
    console.error('Channel lead capture (chat_member) error:', error)
  }
})

// Utility: get current chat id (for configuring REQUIRED_MEMBERSHIP_CHAT_ID)
bot.command('chatid', async (ctx) => {
  const chatId = ctx.chat?.id
  const chatType = ctx.chat?.type
  const chatTitle = (ctx.chat as any)?.title
  const chatUsername = (ctx.chat as any)?.username

  await ctx.reply(
    `Chat ID: ${chatId}\nType: ${chatType || 'unknown'}${chatTitle ? `\nTitle: ${chatTitle}` : ''}${chatUsername ? `\nUsername: @${chatUsername}` : ''}`
  )
})

// Alternative way to get chat_id when users can't write in the channel/group:
// forward any message from that chat to the bot in private.
bot.on('message', async (ctx, next) => {
  const msg: any = ctx.message
  if (!msg) return next()

  // New Bot API format
  const forwardOrigin = msg.forward_origin
  if (forwardOrigin?.type === 'channel' && forwardOrigin.chat?.id) {
    const chatId = forwardOrigin.chat.id
    const title = forwardOrigin.chat.title
    const username = forwardOrigin.chat.username
    await ctx.reply(
      `Chat ID: ${chatId}\nType: channel${title ? `\nTitle: ${title}` : ''}${username ? `\nUsername: @${username}` : ''}`
    )
    return
  }

  if (forwardOrigin?.type === 'chat' && forwardOrigin.chat?.id) {
    const chatId = forwardOrigin.chat.id
    const title = forwardOrigin.chat.title
    const username = forwardOrigin.chat.username
    await ctx.reply(
      `Chat ID: ${chatId}\nType: chat${title ? `\nTitle: ${title}` : ''}${username ? `\nUsername: @${username}` : ''}`
    )
    return
  }

  // Legacy fields
  const fwdChat = msg.forward_from_chat
  if (fwdChat?.id) {
    const chatId = fwdChat.id
    const title = fwdChat.title
    const username = fwdChat.username
    const type = fwdChat.type || 'unknown'
    await ctx.reply(
      `Chat ID: ${chatId}\nType: ${type}${title ? `\nTitle: ${title}` : ''}${username ? `\nUsername: @${username}` : ''}`
    )
    return
  }

  return next()
})

// If the channel uses join requests, we can capture the lead even earlier.
bot.on('chat_join_request', async (ctx) => {
  try {
    const update: any = (ctx as any).update
    const joinRequest = update?.chat_join_request
    if (!joinRequest) return

    const chatInfo = joinRequest.chat
    if (!isChannelChatId(chatInfo)) return

    const user = joinRequest.from
    if (!user?.id) return

    const telegramId = String(user.id)
    const resolvedLinkId = await resolveMarketingLinkIdFromInvite(joinRequest.invite_link)
    const utmParams = resolvedLinkId ? resolvedLinkId : buildChannelUtmParams(joinRequest.invite_link)

    const existing = await prisma.user.findUnique({ where: { telegramId } })
    if (!existing) {
      await prisma.user.create({
        data: {
          telegramId,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          marketingSource: 'Channel',
          utmParams,
        },
      })

      if (resolvedLinkId) {
        await prisma.marketingLink.update({
          where: { linkId: resolvedLinkId },
          data: { conversions: { increment: 1 } },
        }).catch(() => {})
      }
      return
    }

    const data: any = {
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    }
    if (!existing.marketingSource) data.marketingSource = 'Channel'
    if (resolvedLinkId) {
      const cur = String(existing.utmParams || '').trim()
      const alreadyHasMk = Boolean(cur.match(/mk_[a-zA-Z0-9_]+/))
      if (!alreadyHasMk) data.utmParams = resolvedLinkId
    } else if (!existing.utmParams) {
      data.utmParams = utmParams
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { telegramId }, data })
    }
  } catch (error) {
    console.error('Channel lead capture (chat_join_request) error:', error)
  }
})

// Helper to handle invalid input and update attempts
function handleInvalidInput(userId: string, state: any, attempts: number): void {
  adminState.set(userId, { ...state, attempts, lastAttempt: Date.now() })
}

// Helper to safely edit message text (handles "message is not modified" errors)
async function safeEditMessage(ctx: Context, text: string, options?: any): Promise<boolean> {
  try {
    await ctx.editMessageText(text, options)
    return true
  } catch (error: any) {
    // Ignore "message is not modified" errors (expected when content is identical)
    if (!error.message?.includes('message is not modified')) {
      console.error('Error editing message:', error)
    }
    return false
  }
}

// Helper to safely answer callback query (handles "query is too old" errors)
async function safeAnswerCallback(ctx: Context, text?: string): Promise<boolean> {
  try {
    await ctx.answerCallbackQuery(text)
    return true
  } catch (error: any) {
    // Ignore "query is too old" errors (expected when query expires)
    if (!error.message?.includes('query is too old')) {
      console.error('Error answering callback:', error)
    }
    return false
  }
}

// Send message to all admins
export async function notifyAdmins(message: string, options?: any) {
  const results = []
  for (const adminId of ADMIN_IDS) {
    try {
      await bot.api.sendMessage(adminId, message, options)
      results.push({ adminId, success: true })
    } catch (error) {
      console.error(`Failed to notify admin ${adminId}:`, error)
      results.push({ adminId, success: false })
    }
  }
  return results
}

// Send message to all admins except one
export async function notifyAdminsExcept(excludeAdminId: string, message: string, options?: any) {
  const results = []
  for (const adminId of ADMIN_IDS) {
    if (adminId === excludeAdminId) continue
    try {
      await bot.api.sendMessage(adminId, message, options)
      results.push({ adminId, success: true })
    } catch (error) {
      console.error(`Failed to notify admin ${adminId}:`, error)
      results.push({ adminId, success: false })
    }
  }
  return results
}

// Check if user is admin (super admin or database admin)
async function isAdmin(userId: string): Promise<boolean> {
  if (ADMIN_IDS.includes(userId)) return true
  
  const user = await prisma.user.findUnique({
    where: { telegramId: userId }
  })
  
  return user?.isAdmin || user?.role === 'admin' || false
}

// Check if user is support or higher
async function isSupport(userId: string): Promise<boolean> {
  if (ADMIN_IDS.includes(userId)) return true
  
  const user = await prisma.user.findUnique({
    where: { telegramId: userId }
  })
  
  return user?.isAdmin || user?.role === 'admin' || user?.role === 'support' || false
}

// Get user role
async function getUserRole(userId: string): Promise<string> {
  if (ADMIN_IDS.includes(userId)) return 'admin'
  
  const user = await prisma.user.findUnique({
    where: { telegramId: userId }
  })
  
  return user?.role || 'user'
}

// Format user display name for messages
function formatUserDisplay(user: { username?: string | null, phoneNumber?: string | null }): string {
  if (user.username) {
    return '@' + user.username.replace(/_/g, '\\_')
  } else if (user.phoneNumber) {
    return user.phoneNumber
  } else {
    return 'no\\_username'
  }
}

function formatAdminDisplay(admin: { username?: string | null } | undefined, adminId: string): string {
  if (admin?.username) {
    return '@' + admin.username.replace(/_/g, '\\_')
  }
  return adminId
}

// Send notification to support team (admins + supports)
export async function notifySupport(message: string, options?: any) {
  const results = []
  const notifiedIds = new Set<string>()
  
  console.log(`📢 notifySupport called, ADMIN_IDS: ${ADMIN_IDS.join(', ')}`)
  
  // Notify all env admins
  for (const adminId of ADMIN_IDS) {
    try {
      await bot.api.sendMessage(adminId, message, options)
      results.push({ userId: adminId, success: true })
      notifiedIds.add(adminId)
      console.log(`✅ Notified env admin: ${adminId}`)
    } catch (error) {
      console.error(`Failed to notify admin ${adminId}:`, error)
      results.push({ userId: adminId, success: false })
    }
  }
  
  // Find and notify all support/admin users in database (by role or isAdmin flag)
  const supportUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ['admin', 'support'] } },
        { isAdmin: true }
      ]
    }
  })
  
  console.log(`📋 Found ${supportUsers.length} support users in DB:`, supportUsers.map(u => ({ id: u.telegramId, username: u.username, role: u.role, isAdmin: u.isAdmin })))
  
  for (const user of supportUsers) {
    if (notifiedIds.has(user.telegramId)) {
      console.log(`⏭️ Skipping ${user.telegramId} (already notified)`)
      continue
    }
    
    try {
      await bot.api.sendMessage(user.telegramId, message, options)
      results.push({ userId: user.telegramId, success: true })
      notifiedIds.add(user.telegramId)
      console.log(`✅ Notified support user: ${user.telegramId} (@${user.username})`)
    } catch (error) {
      console.error(`Failed to notify support ${user.telegramId}:`, error)
      results.push({ userId: user.telegramId, success: false })
    }
  }
  
  console.log(`📢 notifySupport complete. Results:`, results)
  return results
}

// Tariff plans configuration
const TARIFF_PLANS = [
  { name: 'Bronze', minDeposit: 50, maxDeposit: 99, dailyPercent: 0.5 },
  { name: 'Silver', minDeposit: 100, maxDeposit: 499, dailyPercent: 1.0 },
  { name: 'Gold', minDeposit: 500, maxDeposit: 999, dailyPercent: 2.0 },
  { name: 'Platinum', minDeposit: 1000, maxDeposit: 4999, dailyPercent: 3.0 },
  { name: 'Diamond', minDeposit: 5000, maxDeposit: 19999, dailyPercent: 5.0 },
  { name: 'Black', minDeposit: 20000, maxDeposit: Infinity, dailyPercent: 7.0 }
]

const REFERRAL_ACTIVATION_DEPOSIT_USD = 500

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

// Create referral chain for user who reached referral activation deposit
async function createReferralChain(user: any) {
  if (!user.referredBy) return

  try {
    // Check if referral chain already exists
    const existingReferral = await prisma.referral.findFirst({
      where: { referredUserId: user.id }
    })

    if (existingReferral) {
      console.log(`Referral chain already exists for user ${user.telegramId}`)
      return
    }

    const referrer = await prisma.user.findUnique({
      where: { telegramId: user.referredBy }
    })

    if (referrer) {
      // Level 1: Direct referral
      await prisma.referral.create({
        data: {
          userId: referrer.id,
          referredUserId: user.id,
          referredUsername: user.username || `user_${user.telegramId}`,
          level: 1,
          earnings: 0
        }
      })

      console.log(`✅ Created Level 1 referral: ${referrer.telegramId} -> ${user.telegramId}`)

      // Notify referrer
      await bot.api.sendMessage(
        referrer.telegramId,
        `🎉 *Referral Activated!*\n\n👤 @${user.username || 'User'} reached $${REFERRAL_ACTIVATION_DEPOSIT_USD} deposit!\n💰 You now earn 4% of their daily profits.`,
        { parse_mode: 'Markdown' }
      ).catch(() => {})

      // Level 2: Referrer's referrer
      if (referrer.referredBy) {
        const level2Referrer = await prisma.user.findUnique({
          where: { telegramId: referrer.referredBy }
        })

        if (level2Referrer) {
          await prisma.referral.create({
            data: {
              userId: level2Referrer.id,
              referredUserId: user.id,
              referredUsername: user.username || `user_${user.telegramId}`,
              level: 2,
              earnings: 0
            }
          })

          console.log(`✅ Created Level 2 referral: ${level2Referrer.telegramId} -> ${user.telegramId}`)

          // Notify L2 referrer
          await bot.api.sendMessage(
            level2Referrer.telegramId,
            `🎉 *Level 2 Referral Activated!*\n\n👤 @${user.username || 'User'} (referred by @${referrer.username || 'User'}) reached $${REFERRAL_ACTIVATION_DEPOSIT_USD}!\n💰 You now earn 3% of their daily profits.`,
            { parse_mode: 'Markdown' }
          ).catch(() => {})

          // Level 3: Level 2's referrer
          if (level2Referrer.referredBy) {
            const level3Referrer = await prisma.user.findUnique({
              where: { telegramId: level2Referrer.referredBy }
            })

            if (level3Referrer) {
              await prisma.referral.create({
                data: {
                  userId: level3Referrer.id,
                  referredUserId: user.id,
                  referredUsername: user.username || `user_${user.telegramId}`,
                  level: 3,
                  earnings: 0
                }
              })

              console.log(`✅ Created Level 3 referral: ${level3Referrer.telegramId} -> ${user.telegramId}`)

              // Notify L3 referrer
              await bot.api.sendMessage(
                level3Referrer.telegramId,
                `🎉 *Level 3 Referral Activated!*\n\n👤 @${user.username || 'User'} reached $${REFERRAL_ACTIVATION_DEPOSIT_USD}!\n💰 You now earn 2% of their daily profits.`,
                { parse_mode: 'Markdown' }
              ).catch(() => {})
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error creating referral chain:', error)
  }
}

// Update user plan based on totalDeposit (working balance)
async function updateUserPlan(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const planInfo = calculateTariffPlan(user.totalDeposit)
  
  if (user.plan !== planInfo.currentPlan) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: planInfo.currentPlan }
    })
  }
  
  return planInfo
}

// ============= USER COMMANDS =============

bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id.toString()
  if (!telegramId) return

  // Parse referral code or marketing params from start parameter (for both new and existing users)
  const startPayload = ctx.match as string
  let referrerId: string | null = null
  let marketingSource: string | null = null
  let utmParams: string | null = null
  let linkId: string | null = null
  let preferredLanguage: string | null = null

  if (startPayload) {
    if (startPayload.startsWith('ref5')) {
      // Referral link: ref5<userId>
      referrerId = startPayload.slice(4)
    } else if (startPayload.startsWith('mk_')) {
      // Marketing link: mk_<linkId>
      linkId = startPayload

      // Track click in marketing link
      const marketingLink = await prisma.marketingLink.findUnique({
        where: { linkId }
      })

      if (marketingLink) {
        await prisma.marketingLink.update({
          where: { linkId },
          data: { clicks: { increment: 1 } }
        }).catch(() => {})

        marketingSource = marketingLink.source
        // Store the linkId in utmParams so we can match it later
        utmParams = linkId
        // Get language from marketing link
        preferredLanguage = marketingLink.language
      }
    } else if (startPayload === 'channel') {
      // Channel link: https://t.me/bot?start=channel
      marketingSource = 'Channel'
      utmParams = 'channel'
    } else {
      // Try to parse URL params: source=<name>&param1=value1&param2=value2
      try {
        const params = new URLSearchParams(startPayload)
        marketingSource = params.get('source')

        // Store all params as JSON
        const paramsObj: Record<string, string> = {}
        params.forEach((value, key) => {
          if (key !== 'source') {
            paramsObj[key] = value
          }
        })

        if (Object.keys(paramsObj).length > 0) {
          utmParams = JSON.stringify(paramsObj)
        }
      } catch (e) {
        console.log('Could not parse start payload as URL params:', startPayload)
      }
    }
  }

  // Check if user is blocked
  const existingUser = await prisma.user.findUnique({
    where: { telegramId }
  })
  
  if (existingUser?.isBlocked) {
    await ctx.reply('⛔️ Your account has been blocked. Please contact support if you believe this is a mistake.')
    return
  }

  let user = await prisma.user.findUnique({
    where: { telegramId }
  })

  // If an existing user came via a marketing link that forces language, apply it.
  // This helps when users re-open via a ref link after the very first registration.
  if (user && preferredLanguage && user.languageCode !== preferredLanguage) {
    user = await prisma.user.update({
      where: { telegramId },
      data: { languageCode: preferredLanguage }
    })
  }

  // If a channel lead later opens the bot via an mk_* link, keep Channel source
  // but store the precise mk_* attribution in utmParams.
  if (user && linkId) {
    const cur = String(user.utmParams || '').trim()
    const alreadyHasMk = Boolean(cur.match(/mk_[a-zA-Z0-9_]+/))
    if (!alreadyHasMk) {
      user = await prisma.user.update({
        where: { telegramId },
        data: {
          utmParams: linkId,
          marketingSource: user.marketingSource || 'Channel',
        },
      })
    }
  }

  // Update marketing source for existing users if they came via channel link and don't have a source yet
  if (user && marketingSource === 'Channel' && !user.marketingSource) {
    user = await prisma.user.update({
      where: { telegramId },
      data: { 
        marketingSource,
        utmParams 
      }
    })
  }

  // Mark that the user has entered the bot (CHANNEL status should end after this)
  if (user && !user.botStartedAt) {
    user = await prisma.user.update({
      where: { telegramId },
      data: { botStartedAt: new Date() },
    })
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
        botStartedAt: new Date(),
        phoneNumber: ctx.from?.username ? null : ctx.from?.id.toString(),
        languageCode: preferredLanguage || ctx.from?.language_code,
        referredBy: referrerId,
        marketingSource,
        utmParams
      }
    })

    // Track conversion for marketing link
    if (linkId) {
      await prisma.marketingLink.update({
        where: { linkId },
        data: { conversions: { increment: 1 } }
      }).catch(() => {}) // Ignore if link doesn't exist
    }

    // Notify admin about new user
    let notifyMessage = `🆕 New user registered:\n@${ctx.from?.username || 'no_username'}\nID: ${telegramId}`
    if (referrerId) notifyMessage += `\n👥 Referred by: ${referrerId}`
    if (marketingSource) notifyMessage += `\n📢 Source: ${marketingSource}`
    
    await bot.api.sendMessage(ADMIN_ID, notifyMessage)

    // Referral will be activated when user reaches $1000 deposit
  }

  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open Syntrix', WEBAPP_URL).row()
    .url('🌐 Visit Website', LANDING_URL)
    .url('💬 Support', 'https://t.me/syntrix_support_bot?start=activate')

  const welcomeMessage = 
    `*Welcome to SyntrixBot\\!*\n` +
    `*Profits are no longer random\\!*\n\n` +
    `⮕ Start your crypto trading journey with our automated bot\n` +
    `⮕ Earn up to 17% daily from your investments\n` +
    `⮕ Track your performance in real\\-time\n\n` +
    `🌐 Learn more: https://syntrix\\.website/\n\n` +
    `Click the button below to open the trading platform:`

  try {
    // Path to logo: go up from dist/ to telegram-bot root where logo.jpg is located
    const logoPath = path.join(__dirname, '..', 'logo.jpg')
    await ctx.replyWithPhoto(new InputFile(logoPath), {
      caption: welcomeMessage,
      reply_markup: keyboard,
      parse_mode: 'MarkdownV2'
    })
  } catch (error) {
    console.error('Failed to send logo:', error)
    // Fallback if photo fails
    await ctx.reply(welcomeMessage, {
      reply_markup: keyboard,
      parse_mode: 'MarkdownV2'
    })
  }
})

bot.command('cancel', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId) return

  const state = adminState.get(userId)
  if (state?.awaitingInput) {
    adminState.delete(userId)
    await ctx.reply('❌ Operation cancelled')
  } else {
    await ctx.reply('ℹ️ No active operation to cancel')
  }
})

// Test command to trigger daily profit manually (admin only)
bot.command('testdaily', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    await ctx.reply('⛔️ Access denied')
    return
  }

  await ctx.reply('⏳ Triggering daily profit accrual...')
  
  try {
    await accrueDailyProfit()
    await ctx.reply('✅ Daily profit accrued! Now triggering notifications...')
    
    await sendScheduledNotifications()
    await ctx.reply('✅ Notifications sent!')
  } catch (error: any) {
    await ctx.reply(`❌ Error: ${error.message}`)
  }
})

bot.command('admin', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await ctx.reply('⛔️ Access denied')
    return
  }

  const isAdminUser = await isAdmin(userId)
  const isSuperAdmin = ADMIN_IDS.includes(userId)

  const usersCount = await prisma.user.count()
  const completedDepositsCount = await prisma.deposit.count({ where: { status: 'COMPLETED' } })
  const pendingDepositsCount = await prisma.deposit.count({ where: { status: 'PENDING' } })
  const withdrawalsCount = await prisma.withdrawal.count()
  const pendingWithdrawalsCount = await prisma.withdrawal.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } })

  const keyboard = new InlineKeyboard()
    .text(`📊 Users (${usersCount})`, 'admin_users').row()
    .text(`📥 Deposits (${completedDepositsCount})`, 'admin_deposits')
    .text(`📤 Withdrawals (${withdrawalsCount})`, 'admin_withdrawals').row()
    .text(`⏳ Pending Deposits (${pendingDepositsCount})`, 'admin_pending_deposits')
    .text(`⏳ Pending Withdrawals (${pendingWithdrawalsCount})`, 'admin_pending_withdrawals').row()

  // Only admins can manage balance
  if (isAdminUser) {
    keyboard.text('💰 Manage Balance', 'admin_manage_balance').row()
  }

  // Only admins can manage per-user Trade tab access
  if (isAdminUser) {
    keyboard.text(ARBITRAGE_TRADE_EN.menu, 'admin_arbitrage').row()
  }

  // Only admins can generate cards
  if (isAdminUser) {
    keyboard.text('📸 Generate Card', 'admin_generate_card')
  }
  
  // Support can manage card settings
  keyboard.text('⚙️ Card Settings', 'admin_card_settings').row()

  // Only super admin can manage roles
  if (isSuperAdmin) {
    keyboard.text('👥 Manage Roles', 'admin_manage_admins').row()
  }

  keyboard.text('🔄 Refresh', 'admin_menu')

  const roleText = isSuperAdmin ? 'Super Admin' : isAdminUser ? 'Admin' : 'Support'

  await ctx.reply(
    `🔐 *${roleText} Panel*\n\n` +
    `Total Users: ${usersCount}\n` +
    `📥 Completed Deposits: ${completedDepositsCount}\n` +
    `⏳ Pending Deposits: ${pendingDepositsCount}\n` +
    `Total Withdrawals: ${withdrawalsCount}\n` +
    `⏳ Pending Withdrawals: ${pendingWithdrawalsCount}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
})

// Manage Roles (Admins & Support)
bot.callbackQuery('admin_manage_admins', async (ctx) => {
  const userId = ctx.from?.id.toString()
  console.log(`📋 admin_manage_admins called by userId: ${userId}, ADMIN_IDS: [${ADMIN_IDS.join(', ')}], includes: ${ADMIN_IDS.includes(userId || '')}`)
  
  if (!userId || !ADMIN_IDS.includes(userId)) {
    await safeAnswerCallback(ctx, 'Only super admin can manage roles')
    return
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'support'] } },
    select: { telegramId: true, username: true, firstName: true, role: true }
  })

  let message = '👥 Role Management\n\n'
  
  if (admins.length === 0) {
    message += 'No staff members yet\n'
  } else {
    const adminsList = admins.filter(u => u.role === 'admin')
    const supportList = admins.filter(u => u.role === 'support')
    
    if (adminsList.length > 0) {
      message += '🔐 Admins:\n'
      adminsList.forEach((admin, i) => {
        const name = admin.username ? `@${admin.username}` : (admin.firstName || admin.telegramId)
        message += `${i + 1}. ${name}\n`
      })
      message += '\n'
    }
    
    if (supportList.length > 0) {
      message += '🛡 Support:\n'
      supportList.forEach((support, i) => {
        const name = support.username ? `@${support.username}` : (support.firstName || support.telegramId)
        message += `${i + 1}. ${name}\n`
      })
      message += '\n'
    }
  }
  
  message += 'ℹ️ Use buttons below to manage'

  const keyboard = new InlineKeyboard()
    .text('➕ Add Admin', 'admin_add_admin')
    .text('➕ Add Support', 'admin_add_support').row()

  if (admins.length > 0) {
    keyboard.text('➖ Remove Staff', 'admin_remove_staff').row()
  }

  keyboard.text('🔙 Back', 'admin_menu')

  await safeEditMessage(ctx, message, {
    reply_markup: keyboard
  })
  await safeAnswerCallback(ctx)
})

// Add Admin
bot.callbackQuery('admin_add_admin', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    await safeAnswerCallback(ctx, 'Only super admin can add admins')
    return
  }

  adminState.set(userId, { awaitingInput: 'add_admin' })

  await safeEditMessage(ctx,
    '🆔 *Add New Admin*\n\n' +
    'Send me the Telegram ID of the user you want to make admin\\.\n' +
    'You can find their ID by forwarding their message to @userinfobot\n\n' +
    '⚠️ Send /cancel to abort',
    { parse_mode: 'MarkdownV2' }
  )
  await safeAnswerCallback(ctx)
})

// Add Support
bot.callbackQuery('admin_add_support', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    await safeAnswerCallback(ctx, 'Only super admin can add support')
    return
  }

  adminState.set(userId, { awaitingInput: 'add_support' })

  await safeEditMessage(ctx,
    '🆔 *Add New Support*\n\n' +
    'Send me the Telegram ID of the user you want to make support\\.\n' +
    'You can find their ID by forwarding their message to @userinfobot\n\n' +
    '⚠️ Send /cancel to abort',
    { parse_mode: 'MarkdownV2' }
  )
  await safeAnswerCallback(ctx)
})

// Remove Staff
bot.callbackQuery('admin_remove_staff', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    await safeAnswerCallback(ctx, 'Only super admin can remove staff')
    return
  }

  adminState.set(userId, { awaitingInput: 'remove_staff' })

  await safeEditMessage(ctx,
    '🆔 *Remove Staff Member*\n\n' +
    'Send me the Telegram ID of the user you want to remove from staff\\.\n\n' +
    '⚠️ Send /cancel to abort',
    { parse_mode: 'MarkdownV2' }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery('admin_menu', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const isAdminUser = await isAdmin(userId)
  const isSuperAdmin = ADMIN_IDS.includes(userId)

  const usersCount = await prisma.user.count()
  const completedDepositsCount = await prisma.deposit.count({ where: { status: 'COMPLETED' } })
  const pendingDepositsCount = await prisma.deposit.count({ where: { status: 'PENDING' } })
  const withdrawalsCount = await prisma.withdrawal.count()
  const pendingWithdrawalsCount = await prisma.withdrawal.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } })

  const keyboard = new InlineKeyboard()
    .text(`📊 Users (${usersCount})`, 'admin_users').row()
    .text(`📥 Deposits (${completedDepositsCount})`, 'admin_deposits')
    .text(`📤 Withdrawals (${withdrawalsCount})`, 'admin_withdrawals').row()
    .text(`⏳ Pending Deposits (${pendingDepositsCount})`, 'admin_pending_deposits')
    .text(`⏳ Pending Withdrawals (${pendingWithdrawalsCount})`, 'admin_pending_withdrawals').row()

  // Only admins can manage balance
  if (isAdminUser) {
    keyboard.text('💰 Manage Balance', 'admin_manage_balance').row()
  }

  // Only admins can manage per-user Trade tab access
  if (isAdminUser) {
    keyboard.text(ARBITRAGE_TRADE_EN.menu, 'admin_arbitrage').row()
  }

  // Only admins can generate cards
  if (isAdminUser) {
    keyboard.text('📸 Generate Card', 'admin_generate_card')
  }
  
  // Support can manage card settings
  keyboard.text('⚙️ Card Settings', 'admin_card_settings').row()

  // Only super admin can manage roles
  if (isSuperAdmin) {
    keyboard.text('👥 Manage Roles', 'admin_manage_admins').row()
  }

  // Only admins can broadcast messages
  if (isAdminUser) {
    keyboard.text('📢 Broadcast Message', 'admin_broadcast').row()
  }

  // Only admins can manage global contact support
  if (isAdminUser) {
    keyboard.text('📞 Global Contact Support', 'admin_global_contact_support').row()
  }

  // Only admins can activate accounts with tokens
  if (isAdminUser) {
    keyboard.text('✅ Activate Accounts with Tokens', 'admin_activate_token_accounts').row()
  }

  keyboard.text('🔄 Refresh', 'admin_menu')

  const roleText = isSuperAdmin ? 'Super Admin' : isAdminUser ? 'Admin' : 'Support'

  // Clear any pending input state when returning to main menu
  adminState.delete(userId)

  await safeEditMessage(ctx,
    `🔐 *${roleText} Panel*\n\n` +
    `Total Users: ${usersCount}\n` +
    `📥 Completed Deposits: ${completedDepositsCount}\n` +
    `⏳ Pending Deposits: ${pendingDepositsCount}\n` +
    `Total Withdrawals: ${withdrawalsCount}\n` +
    `⏳ Pending Withdrawals: ${pendingWithdrawalsCount}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx, 'Refreshed')
})

bot.callbackQuery(/^admin_users(?:_(\d+))?$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')
  
  // Save current page in state (preserve existing state but update page)
  const currentState = adminState.get(userId) || {}
  adminState.set(userId, { ...currentState, currentUsersListPage: page })
  const perPage = 10
  const skip = (page - 1) * perPage

  const totalUsers = await prisma.user.count({ where: { isHidden: false } })
  const totalPages = Math.ceil(totalUsers / perPage)

  const users = await prisma.user.findMany({
    where: { isHidden: false },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip
  })

  if (users.length === 0 && page === 1) {
    await safeEditMessage(ctx, '👥 No users yet')
    await safeAnswerCallback(ctx)
    return
  }

  let message = `👥 Users List (Page ${page}/${totalPages}, Total: ${totalUsers}):\n\n`
  
  users.forEach((user, index) => {
    const displayName = user.username 
      ? `@${user.username}` 
      : user.phoneNumber 
        ? `📱 ${user.phoneNumber}` 
        : 'no info'
    const num = skip + index + 1
    message += `${num}. ${displayName}\n`
    // Show ID only if we didn't show phone number
    if (!user.phoneNumber) {
      message += `   ID: ${user.telegramId}\n`
    }
    message += `   💰 $${user.totalDeposit.toFixed(2)} | ${user.status}\n\n`
  })

  const keyboard = new InlineKeyboard()
  users.forEach((user, index) => {
    const num = skip + index + 1
    if (index % 2 === 0) {
      keyboard.text(`${num}`, `manage_${user.id}_${page}`)
    } else {
      keyboard.text(`${num}`, `manage_${user.id}_${page}`).row()
    }
  })
  if (users.length % 2 === 1) keyboard.row()
  
  // Pagination buttons
  if (page > 1) {
    keyboard.text('◀️ Prev', `admin_users_${page - 1}`)
  }
  if (page < totalPages) {
    keyboard.text('Next ▶️', `admin_users_${page + 1}`)
  }
  if (page > 1 || page < totalPages) keyboard.row()

  keyboard.text('🔎 Search', 'admin_users_search').row()
  keyboard.text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: undefined })
  await safeAnswerCallback(ctx)
})

bot.callbackQuery('admin_users_search', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  // Reset previous search + pending input
  adminState.delete(userId)
  adminState.set(userId, { awaitingInput: 'search_users_username' })

  const keyboard = new InlineKeyboard()
    .text('◀️ Back to Users', 'admin_users').row()
    .text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(
    ctx,
    '🔎 Search Users\n\n' +
      'Send a username or Telegram ID to search:\n' +
      '• `@username`\n' +
      '• `username`\n' +
      '• `123456789` (Telegram ID)\n\n' +
      '⚠️ Send /cancel to abort',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery(/^admin_users_search_page_(\d+)$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')
  const state = adminState.get(userId)
  const searchQuery = state?.usersSearchQuery

  if (!searchQuery) {
    const keyboard = new InlineKeyboard()
      .text('🔎 Search', 'admin_users_search').row()
      .text('👥 All Users', 'admin_users').row()
      .text('◀️ Back to Admin', 'admin_menu')

    await safeEditMessage(ctx, '⚠️ Search expired. Please start a new search.', { reply_markup: keyboard })
    await safeAnswerCallback(ctx)
    return
  }

  const perPage = 10
  const skip = (page - 1) * perPage

  const isNumericQuery = /^\d+$/.test(searchQuery)
  const where = isNumericQuery
    ? {
        isHidden: false,
        telegramId: { contains: searchQuery },
      }
    : {
        isHidden: false,
        username: { contains: searchQuery, mode: 'insensitive' as const },
      }

  const totalUsers = await prisma.user.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalUsers / perPage))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const safeSkip = (safePage - 1) * perPage

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip: safeSkip,
  })

  let message = `🔎 Results for "${searchQuery}" (Page ${safePage}/${totalPages}, Total: ${totalUsers}):\n\n`

  if (users.length === 0) {
    message += 'No users found.'
  } else {
    users.forEach((user, index) => {
      const displayName = user.username
        ? `@${user.username}`
        : user.phoneNumber
          ? `📱 ${user.phoneNumber}`
          : 'no info'
      const num = safeSkip + index + 1
      message += `${num}. ${displayName}\n`
      if (!user.phoneNumber) {
        message += `   ID: ${user.telegramId}\n`
      }
      message += `   💰 $${user.totalDeposit.toFixed(2)} | ${user.status}\n\n`
    })
  }

  adminState.set(userId, { ...state, usersSearchQuery: searchQuery, usersSearchPage: safePage })

  const keyboard = new InlineKeyboard()
  users.forEach((user, index) => {
    const num = safeSkip + index + 1
    if (index % 2 === 0) {
      keyboard.text(`${num}`, `manage_${user.id}`)
    } else {
      keyboard.text(`${num}`, `manage_${user.id}`).row()
    }
  })
  if (users.length % 2 === 1) keyboard.row()

  if (safePage > 1) keyboard.text('◀️ Prev', `admin_users_search_page_${safePage - 1}`)
  if (safePage < totalPages) keyboard.text('Next ▶️', `admin_users_search_page_${safePage + 1}`)
  if (safePage > 1 || safePage < totalPages) keyboard.row()

  keyboard.text('🔎 New Search', 'admin_users_search')
    .text('👥 All Users', 'admin_users')
    .row()
    .text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: undefined })
  await safeAnswerCallback(ctx)
})

// ============= ADMIN: ARBITRAGE TRADE (per-user Trade tab) =============

bot.callbackQuery(/^admin_arbitrage(?:_(\d+))?$/, async (ctx) => {
  const adminTelegramId = ctx.from?.id.toString()
  if (!adminTelegramId || !(await isAdmin(adminTelegramId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')

  const perPage = 10
  const skip = (page - 1) * perPage

  const totalUsers = await prisma.user.count({ where: { isHidden: false } })
  const totalPages = Math.max(1, Math.ceil(totalUsers / perPage))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const safeSkip = (safePage - 1) * perPage

  // Save current page in state
  const currentState = adminState.get(adminTelegramId) || {}
  adminState.set(adminTelegramId, { ...currentState, currentArbitrageUsersPage: safePage })

  const users = await prisma.user.findMany({
    where: { isHidden: false },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip: safeSkip,
  })

  let message = `${ARBITRAGE_TRADE_EN.title}\n\n`
  message += `👥 Users (Page ${safePage}/${totalPages}, Total: ${totalUsers}):\n\n`

  if (users.length === 0) {
    message += 'No users found.'
  } else {
    users.forEach((user, index) => {
      const displayName = user.username
        ? `@${user.username}`
        : user.phoneNumber
          ? `📱 ${user.phoneNumber}`
          : 'no info'

      const num = safeSkip + index + 1
      const stateLabel = (user as any).arbitrageTradeEnabled ? ARBITRAGE_TRADE_EN.enabled : ARBITRAGE_TRADE_EN.disabled
      message += `${num}. ${displayName} — ${stateLabel}\n`
      if (!user.phoneNumber) {
        message += `   ID: ${user.telegramId}\n`
      }
    })
  }

  const keyboard = new InlineKeyboard()

  users.forEach((user, index) => {
    const num = safeSkip + index + 1
    if (index % 2 === 0) {
      keyboard.text(`${num}`, `arbitrage_manage_${user.id}_${safePage}`)
    } else {
      keyboard.text(`${num}`, `arbitrage_manage_${user.id}_${safePage}`).row()
    }
  })
  if (users.length % 2 === 1) keyboard.row()

  if (safePage > 1) keyboard.text('◀️ Prev', `admin_arbitrage_${safePage - 1}`)
  if (safePage < totalPages) keyboard.text('Next ▶️', `admin_arbitrage_${safePage + 1}`)
  if (safePage > 1 || safePage < totalPages) keyboard.row()

  keyboard.text('🔎 Search', 'admin_arbitrage_search').row()
  keyboard.text(ARBITRAGE_TRADE_EN.backToAdmin, 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: undefined })
  await safeAnswerCallback(ctx)
})

bot.callbackQuery('admin_arbitrage_search', async (ctx) => {
  const adminTelegramId = ctx.from?.id.toString()
  if (!adminTelegramId || !(await isAdmin(adminTelegramId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  // Reset previous arbitrage search + set pending input (preserve other admin state)
  const existingState = adminState.get(adminTelegramId) || {}
  adminState.set(adminTelegramId, {
    ...existingState,
    awaitingInput: 'arbitrage_search_users',
    arbitrageSearchQuery: undefined,
    arbitrageSearchPage: undefined,
  })

  const keyboard = new InlineKeyboard()
    .text(ARBITRAGE_TRADE_EN.backToList, 'admin_arbitrage')
    .row()
    .text(ARBITRAGE_TRADE_EN.backToAdmin, 'admin_menu')

  await safeEditMessage(
    ctx,
    `${ARBITRAGE_TRADE_EN.searchTitle}\n\n${ARBITRAGE_TRADE_EN.searchPrompt}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery(/^admin_arbitrage_search_page_(\d+)$/, async (ctx) => {
  const adminTelegramId = ctx.from?.id.toString()
  if (!adminTelegramId || !(await isAdmin(adminTelegramId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')
  const state = adminState.get(adminTelegramId)
  const searchQuery = state?.arbitrageSearchQuery

  if (!searchQuery) {
    const keyboard = new InlineKeyboard()
      .text('🔎 Search', 'admin_arbitrage_search').row()
      .text('👥 All Users', 'admin_arbitrage').row()
      .text(ARBITRAGE_TRADE_EN.backToAdmin, 'admin_menu')

    await safeEditMessage(ctx, '⚠️ Search expired. Please start a new search.', { reply_markup: keyboard })
    await safeAnswerCallback(ctx)
    return
  }

  const perPage = 10
  const isNumericQuery = /^\d+$/.test(searchQuery)
  const where = isNumericQuery
    ? {
        isHidden: false,
        telegramId: { contains: searchQuery },
      }
    : {
        isHidden: false,
        username: { contains: searchQuery, mode: 'insensitive' as const },
      }

  const totalUsers = await prisma.user.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalUsers / perPage))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const skip = (safePage - 1) * perPage

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip,
  })

  let message = `${ARBITRAGE_TRADE_EN.title}\n\n`
  message += `🔎 Results for "${searchQuery}" (Page ${safePage}/${totalPages}, Total: ${totalUsers}):\n\n`

  if (users.length === 0) {
    message += 'No users found.'
  } else {
    users.forEach((user, index) => {
      const displayName = user.username
        ? `@${user.username}`
        : user.phoneNumber
          ? `📱 ${user.phoneNumber}`
          : 'no info'
      const num = skip + index + 1
      const stateLabel = (user as any).arbitrageTradeEnabled ? ARBITRAGE_TRADE_EN.enabled : ARBITRAGE_TRADE_EN.disabled
      message += `${num}. ${displayName} — ${stateLabel}\n`
      if (!user.phoneNumber) {
        message += `   ID: ${user.telegramId}\n`
      }
    })
  }

  adminState.set(adminTelegramId, { ...state, arbitrageSearchQuery: searchQuery, arbitrageSearchPage: safePage })

  const keyboard = new InlineKeyboard()
  users.forEach((user, index) => {
    const num = skip + index + 1
    if (index % 2 === 0) {
      keyboard.text(`${num}`, `arbitrage_manage_${user.id}`)
    } else {
      keyboard.text(`${num}`, `arbitrage_manage_${user.id}`).row()
    }
  })
  if (users.length % 2 === 1) keyboard.row()

  if (safePage > 1) keyboard.text('◀️ Prev', `admin_arbitrage_search_page_${safePage - 1}`)
  if (safePage < totalPages) keyboard.text('Next ▶️', `admin_arbitrage_search_page_${safePage + 1}`)
  if (safePage > 1 || safePage < totalPages) keyboard.row()

  keyboard.text('🔎 New Search', 'admin_arbitrage_search')
    .text('👥 All Users', 'admin_arbitrage')
    .row()
    .text(ARBITRAGE_TRADE_EN.backToAdmin, 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: undefined })
  await safeAnswerCallback(ctx)
})

bot.callbackQuery(/^arbitrage_manage_(\d+)(?:_(\d+))?$/, async (ctx) => {
  const adminTelegramId = ctx.from?.id.toString()
  if (!adminTelegramId || !(await isAdmin(adminTelegramId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const fromPage = ctx.match![2] ? parseInt(ctx.match![2]) : undefined

  if (fromPage) {
    const currentState = adminState.get(adminTelegramId) || {}
    adminState.set(adminTelegramId, { ...currentState, currentArbitrageUsersPage: fromPage })
  }

  const user = (await prisma.user.findUnique({
    where: { id: userId },
  })) as any

  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  const enabled = Boolean(user?.arbitrageTradeEnabled)
  const stateLabel = enabled ? ARBITRAGE_TRADE_EN.enabled : ARBITRAGE_TRADE_EN.disabled

  const displayName = user.username
    ? `@${user.username}`
    : user.firstName
      ? user.firstName
      : user.phoneNumber
        ? `📱 ${user.phoneNumber}`
        : user.telegramId

  const keyboard = new InlineKeyboard()
    .text(ARBITRAGE_TRADE_EN.enableBtn, `arbitrage_toggle_${userId}_on`)
    .text(ARBITRAGE_TRADE_EN.disableBtn, `arbitrage_toggle_${userId}_off`)
    .row()

  const backState = adminState.get(adminTelegramId)
  if (backState?.arbitrageSearchQuery) {
    const backPage = backState.arbitrageSearchPage || 1
    keyboard.text(ARBITRAGE_TRADE_EN.backToList, `admin_arbitrage_search_page_${backPage}`)
  } else {
    const savedPage = backState?.currentArbitrageUsersPage || 1
    keyboard.text(ARBITRAGE_TRADE_EN.backToList, `admin_arbitrage_${savedPage}`)
  }
  keyboard.row().text(ARBITRAGE_TRADE_EN.backToAdmin, 'admin_menu')

  await safeEditMessage(
    ctx,
    `${ARBITRAGE_TRADE_EN.title}\n\n` +
      `👤 User: ${displayName}\n` +
      `ID: ${user.telegramId}\n` +
      `Trade tab: ${stateLabel}`,
    { reply_markup: keyboard, parse_mode: undefined }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery(/^arbitrage_toggle_(\d+)_(on|off)$/, async (ctx) => {
  const adminTelegramId = ctx.from?.id.toString()
  if (!adminTelegramId || !(await isAdmin(adminTelegramId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const mode = ctx.match![2]
  const enabled = mode === 'on'

  await (prisma.user.update as any)({
    where: { id: userId },
    data: { arbitrageTradeEnabled: enabled },
  })

  const user = (await prisma.user.findUnique({
    where: { id: userId },
  })) as any

  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  const stateLabel = user?.arbitrageTradeEnabled ? ARBITRAGE_TRADE_EN.enabled : ARBITRAGE_TRADE_EN.disabled
  const displayName = user.username
    ? `@${user.username}`
    : user.firstName
      ? user.firstName
      : user.phoneNumber
        ? `📱 ${user.phoneNumber}`
        : user.telegramId

  const keyboard = new InlineKeyboard()
    .text(ARBITRAGE_TRADE_EN.enableBtn, `arbitrage_toggle_${userId}_on`)
    .text(ARBITRAGE_TRADE_EN.disableBtn, `arbitrage_toggle_${userId}_off`)
    .row()

  const backState = adminState.get(adminTelegramId)
  if (backState?.arbitrageSearchQuery) {
    const backPage = backState.arbitrageSearchPage || 1
    keyboard.text(ARBITRAGE_TRADE_EN.backToList, `admin_arbitrage_search_page_${backPage}`)
  } else {
    const savedPage = backState?.currentArbitrageUsersPage || 1
    keyboard.text(ARBITRAGE_TRADE_EN.backToList, `admin_arbitrage_${savedPage}`)
  }
  keyboard.row().text(ARBITRAGE_TRADE_EN.backToAdmin, 'admin_menu')

  await safeEditMessage(
    ctx,
    `${ARBITRAGE_TRADE_EN.title}\n\n` +
      `👤 User: ${displayName}\n` +
      `ID: ${user.telegramId}\n` +
      `Trade tab: ${stateLabel}`,
    { reply_markup: keyboard, parse_mode: undefined }
  )

  await safeAnswerCallback(ctx, stateLabel)
})

// View user from deposit list
bot.callbackQuery(/^view_deposit_user_(\d+)(?:_(\d+))?$/, async (ctx) => {
  const visitorId = ctx.from?.id.toString()
  if (!visitorId || !(await isSupport(visitorId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const isAdminUser = await isAdmin(visitorId)
  const userId = parseInt(ctx.match![1])
  const fromPage = ctx.match![2] ? parseInt(ctx.match![2]) : undefined
  
  // Save the page we came from
  if (fromPage) {
    const currentState = adminState.get(visitorId) || {}
    adminState.set(visitorId, { ...currentState, currentDepositsPage: fromPage })
  }
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: {
      deposits: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } },
      withdrawals: { orderBy: { createdAt: 'desc' } }
    }
  })

  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  let statusEmoji = '⚪️'
  if (user.status === 'ACTIVE') statusEmoji = '✅'
  if (user.status === 'INACTIVE') statusEmoji = '⏸'
  if (user.status === 'KYC_REQUIRED') statusEmoji = '📋'
  if (user.status === 'BLOCKED') statusEmoji = '🚫'

  const totalDeposits = user.deposits.reduce((sum, d) => sum + d.amount, 0)
  const totalWithdrawals = user.withdrawals.filter(w => w.status === 'COMPLETED').reduce((sum, w) => sum + w.amount, 0)

  await safeEditMessage(ctx, 
    `👤 *User Details*\n\n` +
    `Username: ${formatUserDisplay(user)}\n` +
    `ID: \`${user.telegramId}\`\n` +
    `Status: ${statusEmoji} ${user.status.replace(/_/g, '\\_')}\n\n` +
    `💼 *Financial Summary:*\n` +
    `📥 Total Deposits: $${totalDeposits.toFixed(2)} (${user.deposits.length} txs)\n` +
    `💰 Working Balance: $${user.totalDeposit.toFixed(2)}\n` +
    `📈 Current Profit: $${user.profit.toFixed(2)}\n` +
    `💎 Referral Earnings: $${user.referralEarnings.toFixed(2)}\n` +
    `🎁 Bonus Tokens: $${(user.bonusTokens || 0).toFixed(2)}\n` +
    `📤 Total Withdrawals: $${totalWithdrawals.toFixed(2)} (${user.withdrawals.filter(w => w.status === 'COMPLETED').length} txs)\n` +
    `💸 Lifetime Deposits: $${(user.lifetimeDeposit || 0).toFixed(2)}\n\n` +
    `📊 *Account Info:*\n` +
    `${user.country ? `🌍 Country: ${user.country}\n` : ''}` +
    `${user.ipAddress ? `📡 IP: \`${user.ipAddress}\`\n` : ''}` +
    `📅 Joined: ${user.createdAt.toLocaleDateString()}`,
    { 
      reply_markup: (() => {
        const backState = adminState.get(visitorId)
        const savedPage = backState?.currentDepositsPage || 1
        return new InlineKeyboard().text('◀️ Back to Deposits', `admin_deposits_${savedPage}`)
      })(),
      parse_mode: 'Markdown'
    }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery(/^manage_(\d+)(?:_(\d+))?$/, async (ctx) => {
  const visitorId = ctx.from?.id.toString()
  if (!visitorId || !(await isSupport(visitorId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const isAdminUser = await isAdmin(visitorId)
  const isSupportUser = await isSupport(visitorId)
  const userId = parseInt(ctx.match![1])
  const fromPage = ctx.match![2] ? parseInt(ctx.match![2]) : undefined
  
  // Save the page we came from
  if (fromPage) {
    const currentState = adminState.get(visitorId) || {}
    adminState.set(visitorId, { ...currentState, currentUsersListPage: fromPage })
  }
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: {
      deposits: { take: 3, orderBy: { createdAt: 'desc' } },
      withdrawals: { take: 3, orderBy: { createdAt: 'desc' } }
    }
  })

  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  let statusEmoji = '⚪️'
  if (user.status === 'ACTIVE') statusEmoji = '✅'
  if (user.status === 'INACTIVE') statusEmoji = '⏸'
  if (user.status === 'KYC_REQUIRED') statusEmoji = '📋'
  if (user.status === 'BLOCKED') statusEmoji = '🚫'

  const keyboard = new InlineKeyboard()
    .text('✅ Activate', `status_${userId}_ACTIVE`)
    .text('⏸ Deactivate', `status_${userId}_INACTIVE`).row()
    .text('📋 KYC Required', `status_${userId}_KYC_REQUIRED`)
    .text('🚫 Block', `status_${userId}_BLOCKED`).row()
  
  // Only show balance buttons to admins
  if (isAdminUser) {
    keyboard.text('💰 Add Balance', `add_balance_${userId}`)
      .text('💸 Withdraw Balance', `withdraw_balance_${userId}`).row()
    keyboard.text('📈 Add Profit', `add_profit_${userId}`).row()
  }
  
  // Support can manage bonus tokens
  if (isSupportUser) {
    keyboard.text('🎁 Add Bonus Token', `add_bonus_${userId}`)
      .text('🗑 Remove Bonus Token', `remove_bonus_${userId}`).row()
  }
  
  const backState = adminState.get(visitorId)
  if (backState?.usersSearchQuery) {
    const backPage = backState.usersSearchPage || 1
    keyboard.text('◀️ Back to Search', `admin_users_search_page_${backPage}`)
  } else {
    // Return to saved page or default to page 1
    const savedPage = backState?.currentUsersListPage || 1
    keyboard.text('◀️ Back to Users', `admin_users_${savedPage}`)
  }

  // Get country flag from language code
  const getCountryFlag = (langCode: string | null) => {
    if (!langCode) return '🌍'
    const countryFlags: Record<string, string> = {
      'ru': '🇷🇺', 'en': '🇺🇸', 'uk': '🇺🇦', 'de': '🇩🇪', 'fr': '🇫🇷',
      'es': '🇪🇸', 'it': '🇮🇹', 'pt': '🇵🇹', 'pl': '🇵🇱', 'tr': '🇹🇷',
      'ar': '🇸🇦', 'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷', 'hi': '🇮🇳',
      'id': '🇮🇩', 'vi': '🇻🇳', 'th': '🇹🇭', 'fa': '🇮🇷', 'he': '🇮🇱'
    }
    return countryFlags[langCode] || '🌍'
  }

  const lifetimeDeposited = user.lifetimeDeposit || 0
  const currentAccBalance = user.totalDeposit + user.profit + user.referralEarnings
  const tariffProfit = (user.totalDeposit + user.profit) + user.totalWithdraw - lifetimeDeposited

  await safeEditMessage(ctx, 
    `👤 *User Details*\n\n` +
    `Username: ${formatUserDisplay(user)}\n` +
    `ID: \`${user.telegramId}\`\n` +
    `${getCountryFlag(user.languageCode)} Language: ${user.languageCode?.toUpperCase() || 'Unknown'}\n` +
    `${user.country ? `🌍 Country: ${user.country}` : ''}\n` +
    `${user.ipAddress ? `📡 IP: \`${user.ipAddress}\`` : ''}\n` +
    `Status: ${statusEmoji} ${user.status.replace(/_/g, '\\_')}\n\n` +
    `📊 *All Time Balance:* $${(lifetimeDeposited + user.profit + user.referralEarnings - user.totalWithdraw).toFixed(2)}\n` +
    `💰 *Current Acc Balance:* $${currentAccBalance.toFixed(2)}\n\n` +
    `📥 Total Deposited: $${lifetimeDeposited.toFixed(2)}\n` +
    `📈 Client Profit: $${tariffProfit.toFixed(2)}\n` +
    `🎁 Bonus Tokens: $${(user.bonusTokens || 0).toFixed(2)}\n` +
    `📤 Withdrawn: $${user.totalWithdraw.toFixed(2)}\n\n` +
    `📅 Joined: ${user.createdAt.toLocaleDateString()}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery(/^status_(\d+)_(\w+)$/, async (ctx) => {
  const visitorId = ctx.from?.id.toString()
  if (!visitorId || !(await isSupport(visitorId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const isAdminUser = await isAdmin(visitorId)
  const isSupportUser = await isSupport(visitorId)
  const userId = parseInt(ctx.match![1])
  const newStatus = ctx.match![2] as UserStatus

  const user = await prisma.user.update({
    where: { id: userId },
    data: { 
      status: newStatus,
      kycRequired: newStatus === 'KYC_REQUIRED',
      isBlocked: newStatus === 'BLOCKED'
    }
  })

  // Notify user
  let statusMessage = ''
  let statusEmoji = '⚪️'
  switch (newStatus) {
    case 'ACTIVE':
      statusMessage = '✅ Your account has been activated! You can now use all features.'
      statusEmoji = '✅'
      break
    case 'INACTIVE':
      statusMessage = '⏸ Your account has been deactivated. Contact support for details.'
      statusEmoji = '⏸'
      break
    case 'KYC_REQUIRED':
      statusMessage = '📋 KYC verification required. Please contact support to verify your identity.'
      statusEmoji = '📋'
      break
    case 'BLOCKED':
      statusMessage = '🚫 Your account has been blocked. Contact support for details.'
      statusEmoji = '🚫'
      break
  }

  try {
    await bot.api.sendMessage(user.telegramId, statusMessage)
  } catch (error) {
    console.error(`Failed to notify user ${user.telegramId} about status change:`, error)
  }
  
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'STATUS_CHANGE',
      message: statusMessage
    }
  })

  await safeAnswerCallback(ctx, `✓ Status changed to ${newStatus}`)
  
  // Return to user management with updated info
  const keyboard = new InlineKeyboard()
    .text('✅ Activate', `status_${userId}_ACTIVE`)
    .text('⏸ Deactivate', `status_${userId}_INACTIVE`).row()
    .text('📋 KYC Required', `status_${userId}_KYC_REQUIRED`)
    .text('🚫 Block', `status_${userId}_BLOCKED`).row()
  
  // Only show balance buttons to admins
  if (isAdminUser) {
    keyboard.text('💰 Add Balance', `add_balance_${userId}`)
      .text('💸 Withdraw Balance', `withdraw_balance_${userId}`).row()
    keyboard.text('📈 Add Profit', `add_profit_${userId}`).row()
  }
  
  // Support can manage bonus tokens
  if (isSupportUser) {
    keyboard.text('🎁 Add Bonus Token', `add_bonus_${userId}`)
      .text('🗑 Remove Bonus Token', `remove_bonus_${userId}`).row()
  }
  
  // Return to saved page or default to page 1
  const backState = adminState.get(visitorId)
  const savedPage = backState?.currentUsersListPage || 1
  keyboard.text('◀️ Back to Users', `admin_users_${savedPage}`)

  let displayName = ''
  if (user.username) {
    displayName = `@${user.username.replace(/_/g, '\\_')}`
  } else if (user.phoneNumber) {
    displayName = user.phoneNumber
  } else {
    displayName = 'no\\_username'
  }

  const lifetimeDeposited = user.lifetimeDeposit || 0
  const currentAccBalance = user.totalDeposit + user.profit + user.referralEarnings
  const tariffProfit = (user.totalDeposit + user.profit) + user.totalWithdraw - lifetimeDeposited

  await safeEditMessage(ctx, 
    `👤 *User Details*\n\n` +
    `User: ${displayName}\n` +
    `ID: \`${user.telegramId}\`\n` +
    `Status: ${statusEmoji} ${user.status.replace(/_/g, '\\_')}\n\n` +
    `📊 *All Time Balance:* $${(lifetimeDeposited + user.profit + user.referralEarnings - user.totalWithdraw).toFixed(2)}\n` +
    `💰 *Current Acc Balance:* $${currentAccBalance.toFixed(2)}\n\n` +
    `📥 Total Deposited: $${lifetimeDeposited.toFixed(2)}\n` +
    `📈 Client Profit: $${tariffProfit.toFixed(2)}\n` +
    `📤 Withdrawn: $${user.totalWithdraw.toFixed(2)}\n\n` +
    `✅ Status updated successfully!`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
})

bot.callbackQuery(/^add_balance_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  adminState.set(adminId, { awaitingInput: 'add_balance', targetUserId: userId })

  const keyboard = new InlineKeyboard()
    .text('Cancel', `manage_${userId}`)

  await safeEditMessage(ctx, 
    `💰 *Add Balance*\n\n` +
    `User: ${formatUserDisplay(user)}\n` +
    `Current Deposit: $${user.totalDeposit.toFixed(2)}\n\n` +
    `Please reply with the amount to add (e.g., 100):`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Withdraw balance from user (admin)
bot.callbackQuery(/^withdraw_balance_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  adminState.set(adminId, { awaitingInput: 'withdraw_balance', targetUserId: userId })

  const keyboard = new InlineKeyboard()
    .text('Cancel', `manage_${userId}`)

  await safeEditMessage(ctx, 
    `💸 *Withdraw Balance*\n\n` +
    `User: ${formatUserDisplay(user)}\n` +
    `Current Deposit: $${user.totalDeposit.toFixed(2)}\n\n` +
    `Please reply with the amount to withdraw (e.g., 50):`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Add profit to user (admin)
bot.callbackQuery(/^add_profit_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  adminState.set(adminId, { awaitingInput: 'add_profit', targetUserId: userId })

  const keyboard = new InlineKeyboard()
    .text('Cancel', `manage_${userId}`)

  await safeEditMessage(ctx, 
    `📈 *Add Profit*\n\n` +
    `User: ${formatUserDisplay(user)}\n` +
    `Current Profit: $${user.profit.toFixed(2)}\n` +
    `Total Balance: $${(user.totalDeposit + user.profit + user.referralEarnings).toFixed(2)}\n\n` +
    `Please reply with the profit amount to add (e.g., 25.50):`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Add bonus tokens to user (admin/support)
bot.callbackQuery(/^add_bonus_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isSupport(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  adminState.set(adminId, { awaitingInput: 'add_bonus', targetUserId: userId })

  const keyboard = new InlineKeyboard()
    .text('Cancel', `manage_${userId}`)

  await safeEditMessage(ctx, 
    `🎁 *Add Syntrix Token*\n\n` +
    `User: ${formatUserDisplay(user)}\n` +
    `Current Syntrix Token: $${user.bonusTokens.toFixed(2)}\n\n` +
    `Please reply with the amount to add (e.g., 25):`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Remove bonus tokens from user (admin/support)
bot.callbackQuery(/^remove_bonus_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isSupport(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  adminState.set(adminId, { awaitingInput: 'remove_bonus', targetUserId: userId })

  const keyboard = new InlineKeyboard()
    .text('Cancel', `manage_${userId}`)

  await safeEditMessage(ctx, 
    `🗑 *Remove Syntrix Token*\n\n` +
    `User: ${formatUserDisplay(user)}\n` +
    `Current Syntrix Token: $${user.bonusTokens.toFixed(2)}\n\n` +
    `Please reply with the amount to remove (e.g., 10):`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Contact Support activation (admin)


bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId) return
  
  const text = ctx.message?.text?.trim()
  
  // Check for commands first - they should not be processed as text input
  if (text?.startsWith('/')) {
    return // Let command handlers process this
  }
  
  const state = adminState.get(userId)
  if (!state?.awaitingInput) return

  // Check for timeout (5 minutes)
  const now = Date.now()
  if (state.lastAttempt && (now - state.lastAttempt) > 5 * 60 * 1000) {
    adminState.delete(userId)
    await ctx.reply('⏱ Input timeout. Please start again.')
    return
  }

  // Update attempts counter
  const attempts = (state.attempts || 0) + 1
  if (attempts > 5) {
    adminState.delete(userId)
    await ctx.reply('❌ Too many invalid attempts. Operation cancelled.\nUse /admin to start again.')
    return
  }

  // Handle contact support bonus amount input
  if (state.awaitingInput === 'cs_bonus_amount') {
    if (!(await isAdmin(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const bonusAmount = parseFloat(text)
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      adminState.set(userId, { awaitingInput: 'cs_bonus_amount', attempts })
      await ctx.reply('❌ Invalid amount. Please enter a valid number greater than 0.')
      return
    }

    adminState.set(userId, { 
      awaitingInput: 'cs_timer',
      csBonusAmount: bonusAmount
    })

    const keyboard = new InlineKeyboard()
      .text('❌ Cancel', 'admin_global_contact_support')

    await ctx.reply(
      `✅ Bonus amount set to $${bonusAmount}\n\n` +
      `Step 2: Enter timer duration in minutes\n\n` +
      `Example: 4320 (for 3 days)`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    )
    return
  }

  // Handle contact support timer input
  if (state.awaitingInput === 'cs_timer') {
    if (!(await isAdmin(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const timerMinutes = parseInt(text)
    if (isNaN(timerMinutes) || timerMinutes <= 0) {
      adminState.set(userId, { 
        awaitingInput: 'cs_timer',
        csBonusAmount: state.csBonusAmount,
        attempts 
      })
      await ctx.reply('❌ Invalid timer. Please enter a valid number of minutes.')
      return
    }

    const bonusAmount = state.csBonusAmount

    try {
      let settings = await prisma.globalSettings.findFirst()
      
      if (settings) {
        settings = await prisma.globalSettings.update({
          where: { id: settings.id },
          data: {
            contactSupportEnabled: true,
            contactSupportBonusAmount: bonusAmount,
            contactSupportTimerMinutes: timerMinutes,
            contactSupportActivatedAt: new Date()
          }
        })
      } else {
        settings = await prisma.globalSettings.create({
          data: {
            contactSupportEnabled: true,
            contactSupportBonusAmount: bonusAmount,
            contactSupportTimerMinutes: timerMinutes,
            contactSupportActivatedAt: new Date()
          }
        })
      }

      // Reset contactSupportSeen for all users so they see the modal
      await prisma.user.updateMany({
        data: {
          contactSupportSeen: false
        }
      })

      adminState.delete(userId)

      const days = Math.floor(timerMinutes / 1440)
      const hours = Math.floor((timerMinutes % 1440) / 60)
      const minutes = timerMinutes % 60

      let durationText = ''
      if (days > 0) durationText += `${days}d `
      if (hours > 0) durationText += `${hours}h `
      if (minutes > 0) durationText += `${minutes}m`

      await ctx.reply(
        `✅ *Contact Support Configured & Activated!*\n\n` +
        `💰 Bonus: $${bonusAmount}\n` +
        `⏱ Timer: ${durationText.trim()}\n\n` +
        `The modal will be shown to all users on next app launch.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('◀️ Back', 'admin_global_contact_support')
        }
      )
    } catch (error) {
      console.error('Configure contact support error:', error)
      await ctx.reply('❌ Failed to configure contact support')
      adminState.delete(userId)
    }
    return
  }

  // Handle broadcast message
  if (state.awaitingInput === 'broadcast_message') {
    if (!(await isAdmin(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    adminState.delete(userId)

    const keyboard = new InlineKeyboard()
      .text('✅ Confirm', `broadcast_confirm`)
      .text('❌ Cancel', 'admin_menu')

    // Store message for confirmation
    adminState.set(userId, { 
      awaitingInput: 'broadcast_confirm',
      broadcastMessage: ctx.message
    })

    // Send preview with header
    await ctx.reply(
      '📢 *Broadcast Preview*\n\n' +
      'Your message will look like this:\n' +
      '━━━━━━━━━━━━━━━',
      { parse_mode: 'Markdown' }
    )

    // Copy the actual message to show exact preview with formatting and media
    await bot.api.copyMessage(
      ctx.chat.id,
      ctx.message.chat.id,
      ctx.message.message_id
    )

    // Send confirmation request
    await ctx.reply(
      '━━━━━━━━━━━━━━━\n\n' +
      '⚠️ This will be sent to ALL users!\n' +
      'Confirm broadcast?',
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    )
    return
  }

  // Handle add admin
  if (state.awaitingInput === 'add_admin') {
    if (!ADMIN_IDS.includes(userId)) {
      await ctx.reply('⛔️ Only super admin can add admins')
      return
    }

    const targetId = ctx.message?.text?.trim()
    if (!targetId || targetId.startsWith('/')) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Invalid Telegram ID\nSend /cancel to abort.')
      return
    }

    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { telegramId: targetId }
      })

      if (!user) {
        handleInvalidInput(userId, state, attempts)
        await ctx.reply(`❌ User with ID ${targetId} not found in database\nSend /cancel to abort.`)
        return
      }

      if (user.isAdmin) {
        await ctx.reply(`⚠️ User @${user.username || targetId} is already an admin`)
        adminState.delete(userId)
        return
      }

      // Make user admin
      await prisma.user.update({
        where: { telegramId: targetId },
        data: { 
          isAdmin: true,
          role: 'admin'
        }
      })

      await ctx.reply(
        `✅ Successfully added @${user.username || targetId} as admin\n\n` +
        `They now have access to admin commands.`
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error adding admin:', error)
      await ctx.reply('❌ Failed to add admin. Please try again.')
    }
    return
  }

  // Handle add support
  if (state.awaitingInput === 'add_support') {
    if (!ADMIN_IDS.includes(userId)) {
      await ctx.reply('⛔️ Only super admin can add support')
      return
    }

    const targetId = ctx.message?.text?.trim()
    if (!targetId || targetId.startsWith('/')) {
      await ctx.reply('❌ Invalid Telegram ID')
      return
    }

    try {
      let user = await prisma.user.findUnique({
        where: { telegramId: targetId }
      })

      if (!user) {
        await ctx.reply(`❌ User with ID ${targetId} not found in database`)
        return
      }

      if (user.role === 'support' || user.role === 'admin') {
        await ctx.reply(`⚠️ User @${user.username || targetId} already has staff role: ${user.role}`)
        adminState.delete(userId)
        return
      }

      await prisma.user.update({
        where: { telegramId: targetId },
        data: { role: 'support' }
      })

      await ctx.reply(
        `✅ Successfully added @${user.username || targetId} as support\n\n` +
        `They now have access to:\n` +
        `• View users database\n` +
        `• Manage trading cards\n` +
        `• Approve/reject withdrawals ≥ $100\n` +
        `• Receive deposit/withdrawal notifications`
      )

      // Notify the user
      try {
        await bot.api.sendMessage(
          targetId,
          `🎉 *You've been promoted to Support!*\n\n` +
          `You now have access to support commands.\n` +
          `Use /admin to access the support panel.`,
          { parse_mode: 'Markdown' }
        )
      } catch (err) {
        console.log('Could not notify user about support role')
      }

      adminState.delete(userId)
    } catch (error) {
      console.error('Error adding support:', error)
      await ctx.reply('❌ Failed to add support. Please try again.')
    }
    return
  }

  // Handle remove staff
  if (state.awaitingInput === 'remove_staff') {
    if (!ADMIN_IDS.includes(userId)) {
      await ctx.reply('⛔️ Only super admin can remove staff')
      return
    }

    const targetId = ctx.message?.text?.trim()
    if (!targetId || targetId.startsWith('/')) {
      await ctx.reply('❌ Invalid Telegram ID')
      return
    }

    try {
      let user = await prisma.user.findUnique({
        where: { telegramId: targetId }
      })

      if (!user) {
        await ctx.reply(`❌ User with ID ${targetId} not found in database`)
        return
      }

      if (user.role !== 'admin' && user.role !== 'support' && !user.isAdmin) {
        await ctx.reply(`⚠️ User @${user.username || targetId} is not a staff member`)
        adminState.delete(userId)
        return
      }

      await prisma.user.update({
        where: { telegramId: targetId },
        data: { 
          role: 'user',
          isAdmin: false
        }
      })

      await ctx.reply(
        `✅ Successfully removed @${user.username || targetId} from staff\n\n` +
        `They now have regular user access.`
      )

      // Notify the user
      try {
        await bot.api.sendMessage(
          targetId,
          `ℹ️ *Your staff role has been removed*\n\n` +
          `You now have regular user access.`,
          { parse_mode: 'Markdown' }
        )
      } catch (err) {
        console.log('Could not notify user about role removal')
      }

      adminState.delete(userId)
    } catch (error) {
      console.error('Error removing staff:', error)
      await ctx.reply('❌ Failed to remove staff. Please try again.')
    }
    return
  }

  if (state.awaitingInput === 'add_balance') {
    const amount = parseFloat(ctx.message?.text || '')
    const userId = state.targetUserId

    if (isNaN(amount) || !userId || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    // Get current user to check status
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    const newTotalDeposit = (currentUser?.totalDeposit || 0) + amount
    const shouldActivate = currentUser?.status === 'INACTIVE' && newTotalDeposit >= 10
    const shouldActivateReferral =
      !!currentUser &&
      !!currentUser.referredBy &&
      !currentUser.isActiveReferral &&
      currentUser.totalDeposit < REFERRAL_ACTIVATION_DEPOSIT_USD &&
      newTotalDeposit >= REFERRAL_ACTIVATION_DEPOSIT_USD

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        totalDeposit: { increment: amount },
        lifetimeDeposit: { increment: amount },
        // Activate profile if totalDeposit >= $10 and currently inactive
        ...(shouldActivate && { status: 'ACTIVE' }),
        ...(shouldActivateReferral && { isActiveReferral: true })
      }
    })

    // Create referral chain if user reached referral activation deposit
    if (shouldActivateReferral) {
      await createReferralChain(user)
    }

    // Create deposit record (mark as admin credit)
    await prisma.deposit.create({
      data: {
        userId: user.id,
        amount,
        status: 'COMPLETED',
        currency: 'USDT',
        paymentMethod: 'ADMIN',
      }
    })

    // Update tariff plan based on new totalDeposit
    await updateUserPlan(user.id)
    const planInfo = calculateTariffPlan(user.totalDeposit)
    const progressBar = '█'.repeat(Math.floor(planInfo.progress / 10)) + '░'.repeat(10 - Math.floor(planInfo.progress / 10))

    // Notify user
    let userMessage = `💰 *Deposit Added!*\n\n+$${amount.toFixed(2)}\nNew deposit: $${user.totalDeposit.toFixed(2)}\n\n`
    
    // Add activation message if account was just activated
    if (shouldActivate) {
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
    
    await bot.api.sendMessage(user.telegramId, userMessage, { parse_mode: 'Markdown' })
    
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        message: userMessage
      }
    })

    // Confirm to admin
    await ctx.reply(
      `✅ *Deposit Added Successfully*\n\n` +
      `User: ${formatUserDisplay(user)}\n` +
      `Amount: +$${amount.toFixed(2)}\n` +
      `New Deposit: $${user.totalDeposit.toFixed(2)}`,
      { parse_mode: 'Markdown' }
    )

    const adminId = ctx.from?.id.toString()!
    adminState.delete(adminId)
  }

  // Handle withdraw balance (admin)
  if (state.awaitingInput === 'withdraw_balance') {
    const amount = parseFloat(ctx.message?.text || '')
    const targetUserId = state.targetUserId

    if (isNaN(amount) || !targetUserId || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    try {
      const currentUser = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!currentUser) {
        await ctx.reply('❌ User not found')
        adminState.delete(userId)
        return
      }

      if (amount > currentUser.totalDeposit) {
        await ctx.reply(`❌ Insufficient deposit. User has only $${currentUser.totalDeposit.toFixed(2)}`)
        return
      }

      const newDeposit = currentUser.totalDeposit - amount

      // Update totalDeposit (это рабочий баланс для снятия/пополнения)
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          totalDeposit: { decrement: amount }
        }
      })

      // Update tariff plan based on new balance
      await updateUserPlan(user.id)

      // Confirm to admin
      await ctx.reply(
        `✅ *Balance Withdrawn Successfully*\n\n` +
        `User: ${formatUserDisplay(user)}\n` +
        `Amount: -$${amount.toFixed(2)}\n` +
        `Previous Deposit: $${currentUser.totalDeposit.toFixed(2)}\n` +
        `New Deposit: $${user.totalDeposit.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error withdrawing balance:', error)
      await ctx.reply('❌ Failed to withdraw balance. Please try again.')
    }
    return
  }

  // Handle add profit (admin)
  if (state.awaitingInput === 'add_profit') {
    const amount = parseFloat(ctx.message?.text || '')
    const targetUserId = state.targetUserId

    if (isNaN(amount) || !targetUserId || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    try {
      const currentUser = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!currentUser) {
        await ctx.reply('❌ User not found')
        adminState.delete(userId)
        return
      }

      // Update user profit
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          profit: { increment: amount }
        }
      })

      // Create deposit record with type indicator in currency field
      await prisma.deposit.create({
        data: {
          userId: user.id,
          amount,
          status: 'COMPLETED',
          currency: 'PROFIT' // Special currency type for manual profit additions
        }
      })

      const totalBalance = user.totalDeposit + user.profit + user.referralEarnings

      // Notify user
      const userMessage = `📈 *Profit Added!*\n\n` +
        `+$${amount.toFixed(2)} profit\n` +
        `New Profit: $${user.profit.toFixed(2)}\n` +
        `Total Balance: $${totalBalance.toFixed(2)}\n\n` +
        `🎉 Your earnings have been increased!`

      await bot.api.sendMessage(user.telegramId, userMessage, { parse_mode: 'Markdown' })
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'PROFIT',
          message: userMessage
        }
      })

      // Confirm to admin
      await ctx.reply(
        `✅ *Profit Added Successfully*\n\n` +
        `User: ${formatUserDisplay(user)}\n` +
        `Amount: +$${amount.toFixed(2)}\n` +
        `Previous Profit: $${currentUser.profit.toFixed(2)}\n` +
        `New Profit: $${user.profit.toFixed(2)}\n` +
        `Total Balance: $${totalBalance.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error adding profit:', error)
      await ctx.reply('❌ Failed to add profit. Please try again.')
    }
    return
  }

  // Handle add bonus tokens (admin)
  if (state.awaitingInput === 'add_bonus') {
    const amount = parseFloat(ctx.message?.text || '')
    const targetUserId = state.targetUserId

    console.log('[Add Bonus] Parsed amount:', amount, 'Text:', ctx.message?.text, 'Target user ID:', targetUserId)

    if (isNaN(amount) || !targetUserId || amount <= 0) {
      console.log('[Add Bonus] Validation failed - amount:', amount, 'targetUserId:', targetUserId)
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    try {
      const currentUser = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!currentUser) {
        console.log('[Add Bonus] User not found:', targetUserId)
        await ctx.reply('❌ User not found')
        adminState.delete(userId)
        return
      }

      console.log('[Add Bonus] Updating user bonus tokens:', { userId: targetUserId, currentBonus: currentUser.bonusTokens, currentStatus: currentUser.status, addAmount: amount })

      // Check if user was inactive before
      const wasInactive = currentUser.status === 'INACTIVE'
      console.log('[Add Bonus] Was inactive check:', wasInactive, 'Current status:', currentUser.status)
      
      // Always activate account when adding Syntrix token (if not already active)
      const updateData: any = {
        bonusTokens: { increment: amount }
      }
      
      // Activate if user is INACTIVE
      if (currentUser.status === 'INACTIVE') {
        updateData.status = 'ACTIVE'
        console.log('[Add Bonus] ✅ Activating INACTIVE account → ACTIVE')
      }
      
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: updateData
      })

      console.log('[Add Bonus] ✅ Successfully updated. New bonus:', user.bonusTokens, 'New Status:', user.status, 'Was inactive:', wasInactive)

      // Generate profit updates if user has bonus tokens and was reactivated or didn't have updates yet
      if (user.bonusTokens > 0) {
        const now = new Date()
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)
        const endOfToday = new Date(startOfToday)
        endOfToday.setHours(23, 59, 59, 999)
        
        // Check if user already has profit updates for today
        const existingUpdates = await prisma.dailyProfitUpdate.findFirst({
          where: {
            userId: user.id,
            timestamp: {
              gte: startOfToday,
              lte: endOfToday
            }
          }
        })
        
        // Generate new profit schedule if no updates exist for today
        if (!existingUpdates) {
          const planInfo = calculateTariffPlan(user.totalDeposit)
          const dailyProfit = (user.totalDeposit * planInfo.dailyPercent) / 100
          const bonusProfit = ((user.bonusTokens || 0) * 0.1) / 100
          const totalDailyProfit = dailyProfit + bonusProfit
          
          if (totalDailyProfit > 0) {
            // Update last profit update timestamp
            await prisma.user.update({
              where: { id: user.id },
              data: { lastProfitUpdate: startOfToday }
            })
            
            const scheduleStart = now.getTime() > startOfToday.getTime() ? now : startOfToday
            const depositUpdates = dailyProfit > 0 ? generateDailyUpdates(dailyProfit, scheduleStart, endOfToday) : []
            
            // Create token accrual
            const tokenUpdates: { amount: number, timestamp: Date }[] = []
            if (bonusProfit >= 0.01) {
              const startTime = scheduleStart.getTime()
              const endTime = endOfToday.getTime()
              const rangeMs = Math.max(1, endTime - startTime)
              const randomOffset = Math.random() * rangeMs
              tokenUpdates.push({ amount: bonusProfit, timestamp: new Date(startTime + randomOffset) })
            }
            
            const updates = [...depositUpdates, ...tokenUpdates].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            
            // Create daily updates
            for (const update of updates) {
              const isTokenUpdate = tokenUpdates.includes(update)
              await prisma.dailyProfitUpdate.create({
                data: {
                  userId: user.id,
                  amount: update.amount,
                  source: isTokenUpdate ? 'TOKEN' : 'DEPOSIT',
                  timestamp: update.timestamp,
                  dailyTotal: totalDailyProfit
                }
              })
            }
            
            console.log(`[Add Bonus] Generated ${updates.length} profit updates for today`)
          }
        }
      }
      
      // Send trading card to user if they were inactive
      console.log('[Add Bonus] Checking if should send card. wasInactive:', wasInactive)
      if (wasInactive) {
        try {
          console.log('[Add Bonus] 📸 Generating trading card for reactivated user...')
          const imageBuffer = await generateTradingCard()
          const cardData = await getLastTradingPostData()
          const caption = formatCardCaption(cardData)
          
          console.log('[Add Bonus] 📤 Sending trading card to user', user.telegramId)
          await bot.api.sendPhoto(
            user.telegramId,
            new InputFile(imageBuffer),
            {
              caption: caption,
              parse_mode: 'Markdown'
            }
          )
          
          console.log(`[Add Bonus] ✅ Successfully sent trading card to reactivated user ${user.telegramId}`)
        } catch (cardError) {
          console.error('[Add Bonus] ❌ Failed to send trading card:', cardError)
        }
      } else {
        console.log('[Add Bonus] ℹ️ Not sending card - user was not inactive')
      }

      // Notify user (best-effort; don't fail the admin flow if user blocked the bot)
      const statusInfo = wasInactive ? '\n✅ *Account Activated!*\n' : ''
      const userMessage = `🎁 *Syntrix Token Added!*\n\n` +
        statusInfo +
        `+$${amount.toFixed(2)} Syntrix Token\n` +
        `New Balance: $${user.bonusTokens.toFixed(2)}\n\n` +
        `💡 *How it works:*\n` +
        `• Added to your Total Balance\n` +
        `• Can be reinvested\n` +
        `• Earns 0.1% daily profit\n` +
        `• Cannot be withdrawn as cash`

      let notifyIssue: string | null = null
      try {
        await bot.api.sendMessage(user.telegramId, userMessage, { parse_mode: 'Markdown' })

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'BONUS',
            message: userMessage
          }
        })
      } catch (notifyError) {
        console.error('[Add Bonus] User notify failed:', notifyError)
        notifyIssue = '⚠️ User notification failed (user may have blocked the bot).'
      }

      // Confirm to admin
      const activationInfo = wasInactive ? `\n✅ Account Activated: INACTIVE → ACTIVE\n` : ''
      await ctx.reply(
        `✅ *Bonus Tokens Added Successfully*\n\n` +
        `User: ${formatUserDisplay(user)}\n` +
        `Amount: +$${amount.toFixed(2)}\n` +
        `Previous Bonus: $${currentUser.bonusTokens.toFixed(2)}\n` +
        `New Bonus: $${user.bonusTokens.toFixed(2)}` +
        activationInfo +
        (notifyIssue ? `\n${notifyIssue}` : ''),
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('[Add Bonus] Error adding bonus tokens:', error)
      console.error('[Add Bonus] Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      })
      await ctx.reply('❌ Failed to add bonus tokens. Please try again.')
    }
    return
  }

  // Handle remove bonus tokens (admin)
  if (state.awaitingInput === 'remove_bonus') {
    const amount = parseFloat(ctx.message?.text || '')
    const targetUserId = state.targetUserId

    if (isNaN(amount) || !targetUserId || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    try {
      const currentUser = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!currentUser) {
        await ctx.reply('❌ User not found')
        adminState.delete(userId)
        return
      }

      if (currentUser.bonusTokens < amount) {
        await ctx.reply(`❌ User only has $${currentUser.bonusTokens.toFixed(2)} bonus tokens.`)
        return
      }

      // Update user bonus tokens
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          bonusTokens: { decrement: amount }
        }
      })

      // Notify user
      const userMessage = `🗑 *Bonus Tokens Removed*\n\n` +
        `-$${amount.toFixed(2)} bonus tokens\n` +
        `Remaining Bonus Tokens: $${user.bonusTokens.toFixed(2)}`

      await bot.api.sendMessage(user.telegramId, userMessage, { parse_mode: 'Markdown' })
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'BONUS',
          message: userMessage
        }
      })

      // Confirm to admin
      await ctx.reply(
        `✅ *Bonus Tokens Removed Successfully*\n\n` +
        `User: ${formatUserDisplay(user)}\n` +
        `Amount: -$${amount.toFixed(2)}\n` +
        `Previous Bonus: $${currentUser.bonusTokens.toFixed(2)}\n` +
        `New Bonus: $${user.bonusTokens.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error removing bonus tokens:', error)
      await ctx.reply('❌ Failed to remove bonus tokens. Please try again.')
    }
    return
  }



  // Handle card settings
  if (state.awaitingInput === 'card_count') {
    const match = ctx.message?.text?.match(/^(\d+)-(\d+)$/)
    if (!match) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Invalid format. Use: min-max (e.g., 4-16)\nSend /cancel to abort.')
      return
    }

    const min = parseInt(match[1])
    const max = parseInt(match[2])

    if (min < 1 || max > 50 || min >= max) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Invalid range. Min should be 1-50 and less than max.\nSend /cancel to abort.')
      return
    }

    try {
      await updateCardSettings({ minPerDay: min, maxPerDay: max })
      await ctx.reply(`✅ Updated! Cards per day: ${min}-${max}`)
      adminState.delete(userId)
    } catch (error) {
      console.error('Failed to update settings:', error)
      await ctx.reply('❌ Failed to update settings. Check console.')
    }
    return
  }

  if (state.awaitingInput === 'card_time') {
    const match = ctx.message?.text?.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/)
    if (!match) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Invalid format. Use: HH:MM-HH:MM (e.g., 07:49-22:30)\nSend /cancel to abort.')
      return
    }

    const startTime = `${match[1]}:${match[2]}`
    const endTime = `${match[3]}:${match[4]}`

    try {
      await updateCardSettings({ startTime, endTime })
      await ctx.reply(`✅ Updated! Time range: ${startTime}-${endTime} (Kyiv)`)
      adminState.delete(userId)
    } catch (error) {
      console.error('Failed to update settings:', error)
      await ctx.reply('❌ Failed to update settings. Check console.')
    }
    return
  }

  // Handle search user for balance management
  if (state.awaitingInput === 'search_user_balance') {
    const searchQuery = ctx.message?.text?.trim()
    if (!searchQuery || searchQuery.startsWith('/')) {
      await ctx.reply('❌ Please provide a username or Telegram ID')
      return
    }

    try {
      // Try to find user by username or telegramId
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: searchQuery },
            { telegramId: searchQuery }
          ]
        }
      })

      if (!user) {
        await ctx.reply(`❌ User not found: ${searchQuery}\n\nTry again or send /cancel`)
        return
      }

      // Show user info and balance management options
      const keyboard = new InlineKeyboard()
        .text('💰 Add Balance', `balance_add_${user.id}`)
        .text('✏️ Set Balance', `balance_set_${user.id}`).row()
        .text('📜 View History', `balance_history_${user.id}`).row()
        .text('◀️ Back', 'admin_manage_balance')

      await ctx.reply(
        `👤 *User Found*\n\n` +
        `Username: ${formatUserDisplay(user)}\n` +
        `Telegram ID: \`${user.telegramId}\`\n` +
        `Name: ${user.firstName || 'N/A'}\n\n` +
        `📥 Total Deposited: $${user.totalDeposit.toFixed(2)}\n` +
        `📤 Total Withdrawn: $${user.totalWithdraw.toFixed(2)}\n` +
        `📊 Plan: ${user.plan}\n` +
        `Status: ${user.status}`,
        { reply_markup: keyboard, parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error searching user:', error)
      await ctx.reply('❌ Error searching user. Please try again.')
    }
    return
  }

  // Handle search users for Arbitrage Trade (enable Trade tab)
  if (state.awaitingInput === 'arbitrage_search_users') {
    if (!(await isAdmin(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const raw = ctx.message?.text?.trim()
    if (!raw || raw.startsWith('/')) {
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)')
      return
    }

    const query = raw.replace(/^@+/, '').trim()
    if (!query) {
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)')
      return
    }

    const perPage = 10
    const page = 1
    const skip = 0

    try {
      const isNumericQuery = /^\d+$/.test(query)
      const where = isNumericQuery
        ? {
            isHidden: false,
            telegramId: { contains: query },
          }
        : {
            isHidden: false,
            username: { contains: query, mode: 'insensitive' as const },
          }

      const totalUsers = await prisma.user.count({ where })
      const totalPages = Math.max(1, Math.ceil(totalUsers / perPage))

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: perPage,
        skip,
      })

      let message = `${ARBITRAGE_TRADE_EN.title}\n\n`
      message += `🔎 Results for "${query}" (Page ${page}/${totalPages}, Total: ${totalUsers}):\n\n`

      if (users.length === 0) {
        message += 'No users found.'
      } else {
        users.forEach((user, index) => {
          const displayName = user.username
            ? `@${user.username}`
            : user.phoneNumber
              ? `📱 ${user.phoneNumber}`
              : 'no info'
          const num = skip + index + 1
          const stateLabel = (user as any).arbitrageTradeEnabled ? ARBITRAGE_TRADE_EN.enabled : ARBITRAGE_TRADE_EN.disabled
          message += `${num}. ${displayName} — ${stateLabel}\n`
          if (!user.phoneNumber) {
            message += `   ID: ${user.telegramId}\n`
          }
        })
      }

      // Persist query for pagination and back-navigation
      adminState.set(userId, {
        ...state,
        awaitingInput: undefined,
        arbitrageSearchQuery: query,
        arbitrageSearchPage: 1,
      })

      const keyboard = new InlineKeyboard()
      users.forEach((user, index) => {
        const num = skip + index + 1
        if (index % 2 === 0) {
          keyboard.text(`${num}`, `arbitrage_manage_${user.id}`)
        } else {
          keyboard.text(`${num}`, `arbitrage_manage_${user.id}`).row()
        }
      })
      if (users.length % 2 === 1) keyboard.row()

      if (page < totalPages) {
        keyboard.text('Next ▶️', `admin_arbitrage_search_page_${page + 1}`).row()
      }

      keyboard.text('🔎 New Search', 'admin_arbitrage_search')
        .text('👥 All Users', 'admin_arbitrage')
        .row()
        .text(ARBITRAGE_TRADE_EN.backToAdmin, 'admin_menu')

      await ctx.reply(message, { reply_markup: keyboard, parse_mode: undefined })
      return
    } catch (error) {
      console.error('Error searching users (arbitrage):', error)
      await ctx.reply('❌ Error searching users. Please try again.')
      return
    }
  }

  // Handle search users by username (admin users list)
  if (state.awaitingInput === 'search_users_username') {
    if (!(await isSupport(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const raw = ctx.message?.text?.trim()
    if (!raw || raw.startsWith('/')) {
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)')
      return
    }

    const query = raw.replace(/^@+/, '').trim()
    if (!query) {
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)')
      return
    }

    const perPage = 10
    const page = 1
    const skip = 0

    try {
      const isNumericQuery = /^\d+$/.test(query)
      const where = isNumericQuery
        ? {
            isHidden: false,
            telegramId: { contains: query },
          }
        : {
            isHidden: false,
            username: { contains: query, mode: 'insensitive' as const },
          }

      const totalUsers = await prisma.user.count({ where })
      const totalPages = Math.max(1, Math.ceil(totalUsers / perPage))

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: perPage,
        skip,
      })

      let message = `🔎 Results for "${query}" (Page ${page}/${totalPages}, Total: ${totalUsers}):\n\n`

      if (users.length === 0) {
        message += 'No users found.'
      } else {
        users.forEach((user, index) => {
          const displayName = user.username
            ? `@${user.username}`
            : user.phoneNumber
              ? `📱 ${user.phoneNumber}`
              : 'no info'
          const num = skip + index + 1
          message += `${num}. ${displayName}\n`
          if (!user.phoneNumber) {
            message += `   ID: ${user.telegramId}\n`
          }
          message += `   💰 $${user.totalDeposit.toFixed(2)} | ${user.status}\n\n`
        })
      }

      // Persist query for pagination and back-navigation
      adminState.set(userId, { usersSearchQuery: query, usersSearchPage: 1 })

      const keyboard = new InlineKeyboard()
      users.forEach((user, index) => {
        const num = skip + index + 1
        if (index % 2 === 0) {
          keyboard.text(`${num}`, `manage_${user.id}`)
        } else {
          keyboard.text(`${num}`, `manage_${user.id}`).row()
        }
      })
      if (users.length % 2 === 1) keyboard.row()

      if (page < totalPages) {
        keyboard.text('Next ▶️', `admin_users_search_page_${page + 1}`).row()
      }

      keyboard.text('🔎 New Search', 'admin_users_search')
        .text('👥 All Users', 'admin_users')
        .row()
        .text('◀️ Back to Admin', 'admin_menu')

      await ctx.reply(message, { reply_markup: keyboard, parse_mode: undefined })
      return
    } catch (error) {
      console.error('Error searching users:', error)
      await ctx.reply('❌ Error searching users. Please try again.')
      return
    }
  }

  // Handle search user by @username or Telegram ID (pending deposits)
  if (state.awaitingInput === 'search_pending_deposits_user') {
    if (!(await isSupport(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const raw = ctx.message?.text?.trim()
    if (!raw || raw.startsWith('/')) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    const query = raw.replace(/^@+/, '').trim()
    if (!query) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    try {
      const isNumericQuery = /^\d+$/.test(query)
      const user = await prisma.user.findFirst({
        where: isNumericQuery
          ? { telegramId: query }
          : { username: { equals: query, mode: 'insensitive' as const } },
      })

      if (!user) {
        handleInvalidInput(userId, state, attempts)
        await ctx.reply(`❌ User not found: ${raw}\n\nTry again or send /cancel`)
        return
      }

      const totalPending = await prisma.deposit.count({ where: { status: 'PENDING', userId: user.id } })
      const deposits = await prisma.deposit.findMany({
        where: { status: 'PENDING', userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const backPage = state.currentPendingDepositsPage || 1
      const username = (user.username || 'no_username').replace(/_/g, '\\_')

      let message = `👤 *User:* @${username}\n`
      message += `🆔 \`${user.telegramId}\`\n\n`
      message += `⏳ *Pending Deposits:* ${totalPending}`
      if (totalPending > 10) message += ` (showing last 10)`
      message += `\n\n`

      if (deposits.length === 0) {
        message += 'No pending deposits for this user.'
      } else {
        deposits.forEach((d, idx) => {
          message += `${idx + 1}. 💵 $${d.amount.toFixed(2)} | 📅 ${d.createdAt.toLocaleString()}\n`
        })
      }

      const keyboard = new InlineKeyboard()
        .text('👤 View User', `view_pending_deposit_user_${user.id}_${backPage}`).row()
        .text('🔎 New Search', 'admin_pending_deposits_search').row()
        .text('◀️ Back', `admin_pending_deposits_${backPage}`)

      await ctx.reply(message, { reply_markup: keyboard, parse_mode: 'Markdown' })

      adminState.set(userId, { ...state, awaitingInput: undefined, attempts: 0, lastAttempt: undefined })
      return
    } catch (error) {
      console.error('Error searching pending deposits user:', error)
      await ctx.reply('❌ Error searching user. Please try again.')
      return
    }
  }

  // Handle search user by @username or Telegram ID (pending withdrawals)
  if (state.awaitingInput === 'search_pending_withdrawals_user') {
    if (!(await isSupport(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const raw = ctx.message?.text?.trim()
    if (!raw || raw.startsWith('/')) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    const query = raw.replace(/^@+/, '').trim()
    if (!query) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    try {
      const isNumericQuery = /^\d+$/.test(query)
      const user = await prisma.user.findFirst({
        where: isNumericQuery
          ? { telegramId: query }
          : { username: { equals: query, mode: 'insensitive' as const } },
      })

      if (!user) {
        handleInvalidInput(userId, state, attempts)
        await ctx.reply(`❌ User not found: ${raw}\n\nTry again or send /cancel`)
        return
      }

      const totalPending = await prisma.withdrawal.count({
        where: { userId: user.id, status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] } },
      })
      const withdrawals = await prisma.withdrawal.findMany({
        where: { userId: user.id, status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const backPage = state.currentPendingWithdrawalsPage || 1
      const username = (user.username || 'no_username').replace(/_/g, '\\_')

      let message = `👤 *User:* @${username}\n`
      message += `🆔 \`${user.telegramId}\`\n\n`
      message += `⏳ *Pending Withdrawals:* ${totalPending}`
      if (totalPending > 10) message += ` (showing last 10)`
      message += `\n\n`

      if (withdrawals.length === 0) {
        message += 'No pending withdrawals for this user.'
      } else {
        withdrawals.forEach((w, idx) => {
          let statusEmoji = '⏳'
          if (w.status === 'PROCESSING') statusEmoji = '🔄'
          if (w.status === 'APPROVED') statusEmoji = '✅'
          message += `${idx + 1}. ${statusEmoji} $${w.amount.toFixed(2)} | ${w.currency} | ${w.status}\n`
        })
      }

      const keyboard = new InlineKeyboard()
      const displayCount = Math.min(withdrawals.length, 5)
      for (let i = 0; i < displayCount; i++) {
        const w = withdrawals[i]
        if (w.status === 'APPROVED') {
          keyboard.text(`✅ Complete #${i + 1}`, `complete_withdrawal_${w.id}`).row()
        } else {
          keyboard
            .text(`✅ #${i + 1}`, `approve_withdrawal_${w.id}_${backPage}`)
            .text(`❌ #${i + 1}`, `reject_withdrawal_${w.id}_${backPage}`)
            .row()
        }
      }

      keyboard
        .text('🔎 New Search', 'admin_pending_withdrawals_search').row()
        .text('◀️ Back', `admin_pending_withdrawals_${backPage}`)

      await ctx.reply(message, { reply_markup: keyboard, parse_mode: 'Markdown' })

      adminState.set(userId, { ...state, awaitingInput: undefined, attempts: 0, lastAttempt: undefined })
      return
    } catch (error) {
      console.error('Error searching pending withdrawals user:', error)
      await ctx.reply('❌ Error searching user. Please try again.')
      return
    }
  }

  // Handle search user by @username or Telegram ID (completed deposits)
  if (state.awaitingInput === 'search_deposits_user') {
    if (!(await isSupport(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const raw = ctx.message?.text?.trim()
    if (!raw || raw.startsWith('/')) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    const query = raw.replace(/^@+/, '').trim()
    if (!query) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    try {
      const isNumericQuery = /^\d+$/.test(query)
      const user = await prisma.user.findFirst({
        where: isNumericQuery
          ? { telegramId: query }
          : { username: { equals: query, mode: 'insensitive' as const } },
      })

      if (!user) {
        handleInvalidInput(userId, state, attempts)
        await ctx.reply(`❌ User not found: ${raw}\n\nTry again or send /cancel`)
        return
      }

      const totalCompleted = await prisma.deposit.count({ where: { status: 'COMPLETED', userId: user.id } })
      const deposits = await prisma.deposit.findMany({
        where: { status: 'COMPLETED', userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const backPage = state.currentDepositsPage || 1
      const username = (user.username || 'no_username').replace(/_/g, '\\_')

      let message = `👤 *User:* @${username}\n`
      message += `🆔 \`${user.telegramId}\`\n\n`
      message += `✅ *Completed Deposits:* ${totalCompleted}`
      if (totalCompleted > 10) message += ` (showing last 10)`
      message += `\n\n`

      if (deposits.length === 0) {
        message += 'No completed deposits for this user.'
      } else {
        deposits.forEach((d, idx) => {
          message += `${idx + 1}. 💵 $${d.amount.toFixed(2)} | 📅 ${d.createdAt.toLocaleString()}\n`
        })
      }

      const keyboard = new InlineKeyboard()
        .text('👤 View User', `view_deposit_user_${user.id}_${backPage}`).row()
        .text('🔎 New Search', 'admin_deposits_search').row()
        .text('◀️ Back', `admin_deposits_${backPage}`)

      await ctx.reply(message, { reply_markup: keyboard, parse_mode: 'Markdown' })
      adminState.set(userId, { ...state, awaitingInput: undefined, attempts: 0, lastAttempt: undefined })
      return
    } catch (error) {
      console.error('Error searching deposits user:', error)
      await ctx.reply('❌ Error searching user. Please try again.')
      return
    }
  }

  // Handle search user by @username or Telegram ID (withdrawals)
  if (state.awaitingInput === 'search_withdrawals_user') {
    if (!(await isSupport(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    const raw = ctx.message?.text?.trim()
    if (!raw || raw.startsWith('/')) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    const query = raw.replace(/^@+/, '').trim()
    if (!query) {
      handleInvalidInput(userId, state, attempts)
      await ctx.reply('❌ Please provide a username (@username) or Telegram ID (123456789)\nSend /cancel to abort.')
      return
    }

    try {
      const isNumericQuery = /^\d+$/.test(query)
      const user = await prisma.user.findFirst({
        where: isNumericQuery
          ? { telegramId: query }
          : { username: { equals: query, mode: 'insensitive' as const } },
      })

      if (!user) {
        handleInvalidInput(userId, state, attempts)
        await ctx.reply(`❌ User not found: ${raw}\n\nTry again or send /cancel`)
        return
      }

      const total = await prisma.withdrawal.count({ where: { userId: user.id } })
      const withdrawals = await prisma.withdrawal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const backPage = state.currentWithdrawalsPage || 1
      const username = (user.username || 'no_username').replace(/_/g, '\\_')

      let message = `👤 *User:* @${username}\n`
      message += `🆔 \`${user.telegramId}\`\n\n`
      message += `📤 *Withdrawals:* ${total}`
      if (total > 10) message += ` (showing last 10)`
      message += `\n\n`

      if (withdrawals.length === 0) {
        message += 'No withdrawals for this user.'
      } else {
        withdrawals.forEach((w, idx) => {
          const statusEmoji =
            w.status === 'COMPLETED' ? '✅' :
            w.status === 'PENDING' ? '⏳' :
            w.status === 'PROCESSING' ? '🔄' :
            '❌'
          message += `${idx + 1}. ${statusEmoji} $${w.amount.toFixed(2)} | ${w.currency} | ${w.status}\n`
        })
      }

      const keyboard = new InlineKeyboard()
        .text('🔎 New Search', 'admin_withdrawals_search').row()
        .text('◀️ Back', `admin_withdrawals_${backPage}`)

      await ctx.reply(message, { reply_markup: keyboard, parse_mode: 'Markdown' })
      adminState.set(userId, { ...state, awaitingInput: undefined, attempts: 0, lastAttempt: undefined })
      return
    } catch (error) {
      console.error('Error searching withdrawals user:', error)
      await ctx.reply('❌ Error searching user. Please try again.')
      return
    }
  }

  // Handle add balance amount
  if (state.awaitingInput === 'balance_add_amount') {
    const amount = parseFloat(ctx.message?.text || '')
    const targetUserId = state.targetUserId

    if (isNaN(amount) || !targetUserId) {
      await ctx.reply('❌ Invalid amount. Please enter a number.')
      return
    }

    if (amount === 0) {
      await ctx.reply('❌ Amount cannot be zero.')
      return
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!user) {
        await ctx.reply('❌ User not found')
        adminState.delete(userId)
        return
      }

      const newDeposit = user.totalDeposit + amount
      
      if (newDeposit < 0) {
        await ctx.reply(`❌ Cannot set deposit below zero. Current: $${user.totalDeposit.toFixed(2)}, Change: $${amount.toFixed(2)}`)
        return
      }

      // Update totalDeposit
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          totalDeposit: { increment: amount },
          ...(amount > 0 && { lifetimeDeposit: { increment: amount } })
        }
      })

      // Create transaction record if positive
      if (amount > 0) {
        await prisma.deposit.create({
          data: {
            userId: targetUserId,
            amount,
            status: 'COMPLETED',
            currency: 'USDT',
            paymentMethod: 'ADMIN',
          }
        })
      }

      // Notify user
      await bot.api.sendMessage(
        user.telegramId,
        `💰 *Deposit ${amount > 0 ? 'Added' : 'Deducted'}*\n\n` +
        `${amount > 0 ? '+' : ''}$${amount.toFixed(2)}\n` +
        `New deposit: $${newDeposit.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      await ctx.reply(
        `✅ *Deposit Updated*\n\n` +
        `User: @${user.username || 'no_username'}\n` +
        `Change: ${amount > 0 ? '+' : ''}$${amount.toFixed(2)}\n` +
        `New Deposit: $${newDeposit.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error updating balance:', error)
      await ctx.reply('❌ Error updating balance. Please try again.')
    }
    return
  }

  // Handle set deposit amount
  if (state.awaitingInput === 'balance_set_amount') {
    const amount = parseFloat(ctx.message?.text || '')
    const targetUserId = state.targetUserId

    if (isNaN(amount) || !targetUserId || amount < 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!user) {
        await ctx.reply('❌ User not found')
        adminState.delete(userId)
        return
      }

      const oldDeposit = user.totalDeposit
      const delta = amount - oldDeposit

      // Set new totalDeposit
      await prisma.user.update({
        where: { id: targetUserId },
        data: { totalDeposit: amount }
      })

      if (delta > 0) {
        await prisma.deposit.create({
          data: {
            userId: targetUserId,
            amount: delta,
            status: 'COMPLETED',
            currency: 'USDT',
            paymentMethod: 'ADMIN',
          }
        })
      }

      // Notify user
      await bot.api.sendMessage(
        user.telegramId,
        `💰 *Deposit Updated*\n\n` +
        `Old deposit: $${oldDeposit.toFixed(2)}\n` +
        `New deposit: $${amount.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      await ctx.reply(
        `✅ *Deposit Set*\n\n` +
        `User: @${user.username || 'no_username'}\n` +
        `Old Deposit: $${oldDeposit.toFixed(2)}\n` +
        `New Deposit: $${amount.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error setting deposit:', error)
      await ctx.reply('❌ Error setting deposit. Please try again.')
    }
    return
  }
})

// Handle photo/video/document messages for broadcast
bot.on('message:photo', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId) return

  const state = adminState.get(userId)
  if (!state) return

  // Handle broadcast message with photo
  if (state.awaitingInput === 'broadcast_message') {
    if (!(await isAdmin(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    adminState.delete(userId)

    const keyboard = new InlineKeyboard()
      .text('✅ Confirm', `broadcast_confirm`)
      .text('❌ Cancel', 'admin_menu')

    // Store message for confirmation
    adminState.set(userId, { 
      awaitingInput: 'broadcast_confirm',
      broadcastMessage: ctx.message
    })

    // Send preview with header
    await ctx.reply(
      '📢 *Broadcast Preview*\n\n' +
      'Your message will look like this:\n' +
      '━━━━━━━━━━━━━━━',
      { parse_mode: 'Markdown' }
    )

    // Copy the actual message to show exact preview with formatting and media
    await bot.api.copyMessage(
      ctx.chat.id,
      ctx.message.chat.id,
      ctx.message.message_id
    )

    // Send confirmation request
    await ctx.reply(
      '━━━━━━━━━━━━━━━\n\n' +
      '⚠️ This will be sent to ALL users!\n' +
      'Confirm broadcast?',
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    )
    return
  }
})

bot.on('message:video', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId) return

  const state = adminState.get(userId)
  if (!state) return

  // Handle broadcast message with video
  if (state.awaitingInput === 'broadcast_message') {
    if (!(await isAdmin(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    adminState.delete(userId)

    const keyboard = new InlineKeyboard()
      .text('✅ Confirm', `broadcast_confirm`)
      .text('❌ Cancel', 'admin_menu')

    // Store message for confirmation
    adminState.set(userId, { 
      awaitingInput: 'broadcast_confirm',
      broadcastMessage: ctx.message
    })

    // Send preview with header
    await ctx.reply(
      '📢 *Broadcast Preview*\n\n' +
      'Your message will look like this:\n' +
      '━━━━━━━━━━━━━━━',
      { parse_mode: 'Markdown' }
    )

    // Copy the actual message to show exact preview with formatting and media
    await bot.api.copyMessage(
      ctx.chat.id,
      ctx.message.chat.id,
      ctx.message.message_id
    )

    // Send confirmation request
    await ctx.reply(
      '━━━━━━━━━━━━━━━\n\n' +
      '⚠️ This will be sent to ALL users!\n' +
      'Confirm broadcast?',
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    )
    return
  }
})

bot.on('message:document', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId) return

  const state = adminState.get(userId)
  if (!state) return

  // Handle broadcast message with document
  if (state.awaitingInput === 'broadcast_message') {
    if (!(await isAdmin(userId))) {
      await ctx.reply('⛔️ Access denied')
      return
    }

    adminState.delete(userId)

    const keyboard = new InlineKeyboard()
      .text('✅ Confirm', `broadcast_confirm`)
      .text('❌ Cancel', 'admin_menu')

    // Store message for confirmation
    adminState.set(userId, { 
      awaitingInput: 'broadcast_confirm',
      broadcastMessage: ctx.message
    })

    // Send preview with header
    await ctx.reply(
      '📢 *Broadcast Preview*\n\n' +
      'Your message will look like this:\n' +
      '━━━━━━━━━━━━━━━',
      { parse_mode: 'Markdown' }
    )

    // Copy the actual message to show exact preview with formatting and media
    await bot.api.copyMessage(
      ctx.chat.id,
      ctx.message.chat.id,
      ctx.message.message_id
    )

    // Send confirmation request
    await ctx.reply(
      '━━━━━━━━━━━━━━━\n\n' +
      '⚠️ This will be sent to ALL users!\n' +
      'Confirm broadcast?',
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    )
    return
  }
})

bot.callbackQuery(/^admin_deposits(?:_(\d+))?$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')
  
  // Save current page in state (preserve existing state but update page)
  const currentState = adminState.get(userId) || {}
  adminState.set(userId, { ...currentState, currentDepositsPage: page })
  
  const perPage = 10
  const skip = (page - 1) * perPage

  const totalDeposits = await prisma.deposit.count({ where: { status: 'COMPLETED' } })
  const totalPages = Math.ceil(totalDeposits / perPage)

  const deposits = await prisma.deposit.findMany({
    where: { status: 'COMPLETED' },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip
  })

  if (deposits.length === 0 && page === 1) {
    const keyboard = new InlineKeyboard()
      .text('◀️ Back to Admin', 'admin_menu')
    await safeEditMessage(ctx, '📥 No completed deposits yet', { reply_markup: keyboard })
    await safeAnswerCallback(ctx)
    return
  }

  let message = `📥 *Completed Deposits* (Page ${page}/${totalPages}, Total: ${totalDeposits}):\n\n`
  
  deposits.forEach((deposit, index) => {
    const statusEmoji = deposit.status === 'COMPLETED' ? '✅' : deposit.status === 'PENDING' ? '⏳' : '❌'
    const username = (deposit.user.username || 'no_username').replace(/_/g, '\\_')
    const num = skip + index + 1
    message += `${num}. @${username}\n`
    message += `   💵 $${deposit.amount.toFixed(2)} | ${statusEmoji} ${deposit.status}\n`
    message += `   🆔 ${deposit.user.telegramId} | 📅 ${deposit.createdAt.toLocaleDateString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
  deposits.forEach((deposit, index) => {
    const num = skip + index + 1
    if (index % 2 === 0) {
      keyboard.text(`👤 ${num}`, `view_deposit_user_${deposit.user.id}_${page}`)
    } else {
      keyboard.text(`👤 ${num}`, `view_deposit_user_${deposit.user.id}_${page}`).row()
    }
  })
  if (deposits.length % 2 === 1) keyboard.row()
  
  if (page > 1) {
    keyboard.text('◀️ Prev', `admin_deposits_${page - 1}`)
  }
  if (page < totalPages) {
    keyboard.text('Next ▶️', `admin_deposits_${page + 1}`)
  }
  if (page > 1 || page < totalPages) keyboard.row()

  keyboard.text('🔎 Search (@/ID)', 'admin_deposits_search').row()
  
  keyboard.text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await safeAnswerCallback(ctx)
})

// Completed Deposits: search by @username or Telegram ID
bot.callbackQuery('admin_deposits_search', async (ctx) => {
  const staffId = ctx.from?.id.toString()
  if (!staffId || !(await isSupport(staffId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const currentState = adminState.get(staffId) || {}
  adminState.set(staffId, { ...currentState, awaitingInput: 'search_deposits_user' })

  const savedPage = currentState.currentDepositsPage || 1
  const keyboard = new InlineKeyboard()
    .text('◀️ Back', `admin_deposits_${savedPage}`).row()
    .text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(
    ctx,
    '🔎 Search Completed Deposits\n\n' +
      'Send a username or Telegram ID to search:\n' +
      '• `@username`\n' +
      '• `username`\n' +
      '• `123456789` (Telegram ID)\n\n' +
      '⚠️ Send /cancel to abort',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Pending Deposits
bot.callbackQuery(/^admin_pending_deposits(?:_(\d+))?$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')
  
  // Save current page in state (preserve existing state but update page)
  const currentState = adminState.get(userId) || {}
  adminState.set(userId, { ...currentState, currentPendingDepositsPage: page })
  
  const perPage = 10
  const skip = (page - 1) * perPage

  const totalPending = await prisma.deposit.count({ where: { status: 'PENDING' } })
  const totalPages = Math.ceil(totalPending / perPage)

  const pendingDeposits = await prisma.deposit.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip
  })

  if (pendingDeposits.length === 0 && page === 1) {
    const keyboard = new InlineKeyboard()
      .text('◀️ Back to Admin', 'admin_menu')
    await safeEditMessage(ctx, '⏳ No pending deposits', { reply_markup: keyboard })
    await safeAnswerCallback(ctx)
    return
  }

  let message = `⏳ *Pending Deposits* (Page ${page}/${totalPages}, Total: ${totalPending}):\n\n`
  
  pendingDeposits.forEach((deposit, index) => {
    const username = (deposit.user.username || 'no_username').replace(/_/g, '\\_')
    const num = skip + index + 1
    message += `${num}. @${username}\n`
    message += `   💵 $${deposit.amount.toFixed(2)} | ⏳ PENDING\n`
    message += `   🆔 ${deposit.user.telegramId} | 📅 ${deposit.createdAt.toLocaleDateString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
  pendingDeposits.forEach((deposit, index) => {
    const num = skip + index + 1
    if (index % 2 === 0) {
      keyboard.text(`👤 ${num}`, `view_pending_deposit_user_${deposit.user.id}_${page}`)
    } else {
      keyboard.text(`👤 ${num}`, `view_pending_deposit_user_${deposit.user.id}_${page}`).row()
    }
  })
  if (pendingDeposits.length % 2 === 1) keyboard.row()
  
  if (page > 1) {
    keyboard.text('◀️ Prev', `admin_pending_deposits_${page - 1}`)
  }
  if (page < totalPages) {
    keyboard.text('Next ▶️', `admin_pending_deposits_${page + 1}`)
  }
  if (page > 1 || page < totalPages) keyboard.row()

  keyboard.text('🔎 Search (@/ID)', 'admin_pending_deposits_search').row()
  
  keyboard.text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await safeAnswerCallback(ctx)
})

// Pending Deposits: search by @username or Telegram ID
bot.callbackQuery('admin_pending_deposits_search', async (ctx) => {
  const staffId = ctx.from?.id.toString()
  if (!staffId || !(await isSupport(staffId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const currentState = adminState.get(staffId) || {}
  adminState.set(staffId, { ...currentState, awaitingInput: 'search_pending_deposits_user' })

  const savedPage = currentState.currentPendingDepositsPage || 1
  const keyboard = new InlineKeyboard()
    .text('◀️ Back', `admin_pending_deposits_${savedPage}`).row()
    .text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(
    ctx,
    '🔎 Search Pending Deposits\n\n' +
      'Send a username or Telegram ID to search:\n' +
      '• `@username`\n' +
      '• `username`\n' +
      '• `123456789` (Telegram ID)\n\n' +
      '⚠️ Send /cancel to abort',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery(/^admin_withdrawals(?:_(\d+))?$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')
  
  // Save current page in state (preserve existing state but update page)
  const currentState = adminState.get(userId) || {}
  adminState.set(userId, { ...currentState, currentWithdrawalsPage: page })
  
  const perPage = 10
  const skip = (page - 1) * perPage

  const totalWithdrawals = await prisma.withdrawal.count()
  const totalPages = Math.ceil(totalWithdrawals / perPage)

  const withdrawals = await prisma.withdrawal.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip
  })

  if (withdrawals.length === 0 && page === 1) {
    const keyboard = new InlineKeyboard()
      .text('◀️ Back to Admin', 'admin_menu')
    await safeEditMessage(ctx, '📤 No withdrawals yet', { reply_markup: keyboard })
    await safeAnswerCallback(ctx)
    return
  }

  let message = `📤 *Recent Withdrawals* (Page ${page}/${totalPages}, Total: ${totalWithdrawals}):\n\n`
  
  withdrawals.forEach((withdrawal, index) => {
    const statusEmoji = 
      withdrawal.status === 'COMPLETED' ? '✅' : 
      withdrawal.status === 'PENDING' ? '⏳' : 
      withdrawal.status === 'PROCESSING' ? '🔄' : 
      '❌'
    const username = (withdrawal.user.username || 'no_username').replace(/_/g, '\\_')
    const num = skip + index + 1
    message += `${num}. @${username}\n`
    message += `   💵 $${withdrawal.amount.toFixed(2)} | ${statusEmoji} ${withdrawal.status}\n`
    message += `   📅 ${withdrawal.createdAt.toLocaleDateString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
  
  if (page > 1) {
    keyboard.text('◀️ Prev', `admin_withdrawals_${page - 1}`)
  }
  if (page < totalPages) {
    keyboard.text('Next ▶️', `admin_withdrawals_${page + 1}`)
  }
  if (page > 1 || page < totalPages) keyboard.row()

  keyboard.text('🔎 Search (@/ID)', 'admin_withdrawals_search').row()
  
  keyboard.text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await safeAnswerCallback(ctx)
})

// Withdrawals: search by @username or Telegram ID
bot.callbackQuery('admin_withdrawals_search', async (ctx) => {
  const staffId = ctx.from?.id.toString()
  if (!staffId || !(await isSupport(staffId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const currentState = adminState.get(staffId) || {}
  adminState.set(staffId, { ...currentState, awaitingInput: 'search_withdrawals_user' })

  const savedPage = currentState.currentWithdrawalsPage || 1
  const keyboard = new InlineKeyboard()
    .text('◀️ Back', `admin_withdrawals_${savedPage}`).row()
    .text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(
    ctx,
    '🔎 Search Withdrawals\n\n' +
      'Send a username or Telegram ID to search:\n' +
      '• `@username`\n' +
      '• `username`\n' +
      '• `123456789` (Telegram ID)\n\n' +
      '⚠️ Send /cancel to abort',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Pending withdrawals (includes PENDING and PROCESSING)
bot.callbackQuery(/^admin_pending_withdrawals(?:_(\d+))?$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const page = parseInt(ctx.match?.[1] || '1')
  
  // Save current page in state (preserve existing state but update page)
  const currentState = adminState.get(userId) || {}
  adminState.set(userId, { ...currentState, currentPendingWithdrawalsPage: page })
  
  const perPage = 10
  const skip = (page - 1) * perPage

  const totalPending = await prisma.withdrawal.count({ where: { status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] } } })
  const totalPages = Math.ceil(totalPending / perPage)

  const pendingWithdrawals = await prisma.withdrawal.findMany({
    where: { status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] } },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip
  })

  if (pendingWithdrawals.length === 0 && page === 1) {
    const keyboard = new InlineKeyboard()
      .text('◀️ Back to Admin', 'admin_menu')
    await safeEditMessage(ctx, '⏳ No pending withdrawals', { reply_markup: keyboard })
    await safeAnswerCallback(ctx)
    return
  }

  let message = `⏳ *Pending Withdrawals* (Page ${page}/${totalPages}, Total: ${totalPending}):\n\n`
  
  pendingWithdrawals.forEach((withdrawal, index) => {
    const username = (withdrawal.user.username || 'no_username').replace(/_/g, '\\_')
    let statusEmoji = '⏳'
    if (withdrawal.status === 'PROCESSING') statusEmoji = '🔄'
    if (withdrawal.status === 'APPROVED') statusEmoji = '✅'
    
    const num = skip + index + 1
    message += `${num}. @${username} ${statusEmoji}\n`
    message += `   💵 $${withdrawal.amount.toFixed(2)} | 💎 ${withdrawal.currency}\n`
    message += `   🌐 ${withdrawal.network || 'TRC20'}\n`
    message += `   📍 \`${withdrawal.address.substring(0, 20)}...\`\n`
    message += `   🆔 ID: ${withdrawal.id} | Status: ${withdrawal.status}\n`
    message += `   📅 ${withdrawal.createdAt.toLocaleString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
  
  // Add approve/reject/complete buttons for each withdrawal (max 5 to avoid message overflow)
  const displayCount = Math.min(pendingWithdrawals.length, 5)
  for (let i = 0; i < displayCount; i++) {
    const w = pendingWithdrawals[i]
    if (w.status === 'APPROVED') {
      // For approved withdrawals, show only "Mark as Completed" button
      keyboard
        .text(`✅ Complete #${skip + i + 1}`, `complete_withdrawal_${w.id}`)
        .row()
    } else {
      // For pending/processing withdrawals, show approve/reject buttons
      keyboard
        .text(`✅ #${skip + i + 1}`, `approve_withdrawal_${w.id}_${page}`)
        .text(`❌ #${skip + i + 1}`, `reject_withdrawal_${w.id}_${page}`)
        .row()
    }
  }
  
  if (page > 1) {
    keyboard.text('◀️ Prev', `admin_pending_withdrawals_${page - 1}`)
  }
  if (page < totalPages) {
    keyboard.text('Next ▶️', `admin_pending_withdrawals_${page + 1}`)
  }
  if (page > 1 || page < totalPages) keyboard.row()

  keyboard.text('🔎 Search (@/ID)', 'admin_pending_withdrawals_search').row()
  
  keyboard.text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await safeAnswerCallback(ctx)
})

// Pending Withdrawals: search by @username or Telegram ID
bot.callbackQuery('admin_pending_withdrawals_search', async (ctx) => {
  const staffId = ctx.from?.id.toString()
  if (!staffId || !(await isSupport(staffId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const currentState = adminState.get(staffId) || {}
  adminState.set(staffId, { ...currentState, awaitingInput: 'search_pending_withdrawals_user' })

  const savedPage = currentState.currentPendingWithdrawalsPage || 1
  const keyboard = new InlineKeyboard()
    .text('◀️ Back', `admin_pending_withdrawals_${savedPage}`).row()
    .text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(
    ctx,
    '🔎 Search Pending Withdrawals\n\n' +
      'Send a username or Telegram ID to search:\n' +
      '• `@username`\n' +
      '• `username`\n' +
      '• `123456789` (Telegram ID)\n\n' +
      '⚠️ Send /cancel to abort',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// View user from pending deposits list
bot.callbackQuery(/^view_pending_deposit_user_(\d+)(?:_(\d+))?$/, async (ctx) => {
  const visitorId = ctx.from?.id.toString()
  if (!visitorId || !(await isSupport(visitorId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const fromPage = ctx.match![2] ? parseInt(ctx.match![2]) : undefined

  if (fromPage) {
    const currentState = adminState.get(visitorId) || {}
    adminState.set(visitorId, { ...currentState, currentPendingDepositsPage: fromPage })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      deposits: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } },
      withdrawals: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!user) {
    await safeAnswerCallback(ctx, 'User not found')
    return
  }

  let statusEmoji = '⚪️'
  if (user.status === 'ACTIVE') statusEmoji = '✅'
  if (user.status === 'INACTIVE') statusEmoji = '⏸'
  if (user.status === 'KYC_REQUIRED') statusEmoji = '📋'
  if (user.status === 'BLOCKED') statusEmoji = '🚫'

  const totalDeposits = user.deposits.reduce((sum, d) => sum + d.amount, 0)
  const totalWithdrawals = user.withdrawals.filter(w => w.status === 'COMPLETED').reduce((sum, w) => sum + w.amount, 0)

  await safeEditMessage(
    ctx,
    `👤 *User Details*\n\n` +
      `Username: ${formatUserDisplay(user)}\n` +
      `ID: \`${user.telegramId}\`\n` +
      `Status: ${statusEmoji} ${user.status.replace(/_/g, '\\_')}\n\n` +
      `💼 *Financial Summary:*\n` +
      `📥 Total Deposits: $${totalDeposits.toFixed(2)} (${user.deposits.length} txs)\n` +
      `💰 Working Balance: $${user.totalDeposit.toFixed(2)}\n` +
      `📈 Current Profit: $${user.profit.toFixed(2)}\n` +
      `💎 Referral Earnings: $${user.referralEarnings.toFixed(2)}\n` +
      `🎁 Bonus Tokens: $${(user.bonusTokens || 0).toFixed(2)}\n` +
      `📤 Total Withdrawals: $${totalWithdrawals.toFixed(2)} (${user.withdrawals.filter(w => w.status === 'COMPLETED').length} txs)\n` +
      `💸 Lifetime Deposits: $${(user.lifetimeDeposit || 0).toFixed(2)}\n\n` +
      `📊 *Account Info:*\n` +
      `${user.country ? `🌍 Country: ${user.country}\n` : ''}` +
      `${user.ipAddress ? `📡 IP: \`${user.ipAddress}\`\n` : ''}` +
      `📅 Joined: ${user.createdAt.toLocaleDateString()}`,
    {
      reply_markup: (() => {
        const backState = adminState.get(visitorId)
        const savedPage = backState?.currentPendingDepositsPage || 1
        return new InlineKeyboard().text('◀️ Back to Pending Deposits', `admin_pending_deposits_${savedPage}`)
      })(),
      parse_mode: 'Markdown',
    }
  )
  await safeAnswerCallback(ctx)
})

// Manage balance - search user
bot.callbackQuery('admin_manage_balance', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  // Clear any pending input state
  adminState.delete(userId)

  adminState.set(userId, { awaitingInput: 'search_user_balance' })

  const keyboard = new InlineKeyboard()
    .text('◀️ Cancel', 'admin_menu')

  await safeEditMessage(ctx, 
    '💰 *Manage User Balance*\n\n' +
    'Send me the username or Telegram ID of the user:\n\n' +
    'Examples:\n' +
    '• `username` (without @)\n' +
    '• `123456789` (Telegram ID)\n\n' +
    '⚠️ Send /cancel to abort',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Balance management callbacks
bot.callbackQuery(/^balance_add_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  adminState.set(adminId, { awaitingInput: 'balance_add_amount', targetUserId: userId })

  await safeAnswerCallback(ctx)
  await ctx.reply(
    '💰 *Add Balance*\n\n' +
    'Enter the amount to add (positive) or subtract (negative):\n\n' +
    'Examples:\n' +
    '• `100` (add $100)\n' +
    '• `-50` (subtract $50)\n\n' +
    '⚠️ Send /cancel to abort',
    { parse_mode: 'Markdown' }
  )
})

bot.callbackQuery(/^balance_set_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  adminState.set(adminId, { awaitingInput: 'balance_set_amount', targetUserId: userId })

  await safeAnswerCallback(ctx)
  await ctx.reply(
    '✏️ *Set Balance*\n\n' +
    'Enter the new balance amount:\n\n' +
    'Example: `500`\n\n' +
    '⚠️ Send /cancel to abort',
    { parse_mode: 'Markdown' }
  )
})

bot.callbackQuery(/^balance_history_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        deposits: { orderBy: { createdAt: 'desc' }, take: 10 },
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    })

    if (!user) {
      await safeAnswerCallback(ctx, '❌ User not found')
      return
    }

    let message = `📜 *Transaction History*\n\n`
    const username = (user.username || 'no_username').replace(/_/g, '\\_')
    message += `👤 @${username}\n`
    message += `📥 Total Deposited: $${(user.lifetimeDeposit || user.totalDeposit).toFixed(2)}\n\n`

    if (user.deposits.length > 0) {
      message += `*Recent Deposits:*\n`
      user.deposits.forEach((d, i) => {
        message += `${i + 1}. $${d.amount.toFixed(2)} | ${d.status}\n`
        message += `   📅 ${d.createdAt.toLocaleDateString()}\n`
      })
      message += `\n`
    }

    if (user.withdrawals.length > 0) {
      message += `*Recent Withdrawals:*\n`
      user.withdrawals.forEach((w, i) => {
        message += `${i + 1}. $${w.amount.toFixed(2)} | ${w.status}\n`
        message += `   📅 ${w.createdAt.toLocaleDateString()}\n`
      })
    }

    if (user.deposits.length === 0 && user.withdrawals.length === 0) {
      message += `ℹ️ No transactions yet`
    }

    const keyboard = new InlineKeyboard()
      .text('◀️ Back', 'admin_manage_balance')

    await safeEditMessage(ctx, message, { reply_markup: keyboard, parse_mode: 'Markdown' })
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Error fetching history:', error)
    await safeAnswerCallback(ctx, '❌ Error loading history')
  }
})

// Generate trading card (admin test)
bot.callbackQuery('admin_generate_card', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  await safeAnswerCallback(ctx, 'Generating card...')
  
  try {
    // Generate card image
    const imageBuffer = await generateTradingCard()
    
    // Get data for caption
    const cardData = await getLastTradingPostData()
    const caption = formatCardCaption(cardData)
    
    // Send to admin only (for testing)
    await ctx.replyWithPhoto(new InputFile(imageBuffer), {
      caption: caption
    })
  } catch (error) {
    console.error('Failed to generate card:', error)
    await ctx.reply('❌ Failed to generate trading card. Check console for details.')
  }
})

// Card settings menu
bot.callbackQuery('admin_card_settings', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  // Clear any pending input state
  adminState.delete(userId)

  const settings = await getCardSettings()

  const keyboard = new InlineKeyboard()
    .text(`📊 Posts: ${settings.minPerDay}-${settings.maxPerDay}/day`, 'card_set_count').row()
    .text(`🕐 Time: ${settings.startTime}-${settings.endTime}`, 'card_set_time').row()
    .text('🔄 Reschedule Now', 'card_reschedule').row()
    .text('◀️ Back to Admin', 'admin_menu')

  await safeEditMessage(ctx, 
    '⚙️ *Trading Card Settings*\n\n' +
    `📊 Posts per day: ${settings.minPerDay}-${settings.maxPerDay}\n` +
    `🕐 Time range: ${settings.startTime}-${settings.endTime} (Kyiv)\n\n` +
    'Tap to modify settings',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

// Set card count
bot.callbackQuery('card_set_count', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  await safeAnswerCallback(ctx, 'Send new values')
  await ctx.reply(
    'Send new card count range in format:\n`min-max`\n\nExample: `4-16`',
    { parse_mode: 'Markdown' }
  )
  
  adminState.set(userId, { awaitingInput: 'card_count' })
})

// Set time range
bot.callbackQuery('card_set_time', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  await safeAnswerCallback(ctx, 'Send new time range')
  await ctx.reply(
    'Send new time range in format:\n`HH:MM-HH:MM`\n\nExample: `07:49-22:30` (Kyiv time)',
    { parse_mode: 'Markdown' }
  )
  
  adminState.set(userId, { awaitingInput: 'card_time' })
})

// Reschedule cards immediately
bot.callbackQuery('card_reschedule', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  await safeAnswerCallback(ctx, 'Rescheduling...')
  
  try {
    await rescheduleCards(bot, CHANNEL_ID)
    await safeEditMessage(ctx, 
      '✅ Cards rescheduled successfully!\n\nCheck console for new schedule.',
      { reply_markup: new InlineKeyboard().text('◀️ Back to Settings', 'admin_card_settings') }
    )
  } catch (error) {
    console.error('Failed to reschedule:', error)
    await ctx.reply('❌ Failed to reschedule cards. Check console.')
  }
})

// Handle text input for card settings (add to existing message handler or create new one)
// Card settings handlers moved to first bot.on('message:text')

// ===== BROADCAST MESSAGE HANDLERS =====
bot.callbackQuery('admin_broadcast', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  adminState.set(adminId, { awaitingInput: 'broadcast_message' })

  const keyboard = new InlineKeyboard()
    .text('◀️ Cancel', 'admin_menu')

  await safeEditMessage(ctx,
    '📢 *Broadcast Message*\n\n' +
    'Send me the message you want to broadcast to all users.\n\n' +
    'You can send:\n' +
    '• Text message (with formatting: **bold**, _italic_, `code`)\n' +
    '• Photo with caption\n' +
    '• Video with caption\n' +
    '• Document\n\n' +
    '✨ All formatting and media will be preserved!\n' +
    '⚠️ The message will be sent to ALL users!\n\n' +
    'Send /cancel to abort.',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery('broadcast_confirm', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const state = adminState.get(adminId) as any
  if (!state?.broadcastMessage) {
    await safeAnswerCallback(ctx, 'Message not found')
    return
  }

  await safeAnswerCallback(ctx, 'Starting broadcast...')
  adminState.delete(adminId)

  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        isBlocked: false,
        isHidden: false
      },
      select: {
        telegramId: true,
        username: true
      }
    })

    await ctx.editMessageText(
      `📢 *Broadcasting...*\n\n` +
      `Total users: ${users.length}\n` +
      `Please wait...`,
      { parse_mode: 'Markdown' }
    )

    let sent = 0
    let failed = 0
    const broadcastMessage = state.broadcastMessage

    // Send in batches to avoid hitting rate limits
    for (const user of users) {
      try {
        // Forward the original message
        await bot.api.copyMessage(
          user.telegramId,
          broadcastMessage.chat.id,
          broadcastMessage.message_id
        )
        sent++
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error: any) {
        console.error(`Failed to send to ${user.telegramId}:`, error.message)
        failed++
      }
    }

    await ctx.editMessageText(
      `✅ *Broadcast Complete!*\n\n` +
      `✅ Sent: ${sent}\n` +
      `❌ Failed: ${failed}\n` +
      `📊 Total: ${users.length}`,
      { 
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('◀️ Back to Admin', 'admin_menu')
      }
    )
  } catch (error) {
    console.error('Broadcast error:', error)
    await ctx.reply('❌ Failed to broadcast message')
  }
})

// ===== GLOBAL CONTACT SUPPORT HANDLERS =====
bot.callbackQuery('admin_global_contact_support', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  try {
    let settings = await prisma.globalSettings.findFirst()
    
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          contactSupportEnabled: false,
          contactSupportBonusAmount: 0,
          contactSupportTimerMinutes: 0
        }
      })
    }

    const statusEmoji = settings.contactSupportEnabled ? '✅' : '❌'
    const statusText = settings.contactSupportEnabled ? 'Enabled' : 'Disabled'
    
    let timeLeftText = ''
    if (settings.contactSupportEnabled && settings.contactSupportActivatedAt) {
      const activatedAt = new Date(settings.contactSupportActivatedAt).getTime()
      const now = Date.now()
      const timerDuration = settings.contactSupportTimerMinutes * 60 * 1000
      const timeLeft = Math.max(0, timerDuration - (now - activatedAt))
      
      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000))
        const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
        timeLeftText = `\n⏱ Time left: ${days}d ${hours}h ${minutes}m`
      } else {
        timeLeftText = `\n⏱ Timer expired`
      }
    }

    const keyboard = new InlineKeyboard()
      .text('⚙️ Configure Settings', 'cs_configure').row()
      .text('👥 Show to Active Users', 'cs_show_active').row()
      .text('❌ Disable Globally', 'cs_disable').row()
      .text('◀️ Back to Admin', 'admin_menu')

    await safeEditMessage(ctx,
      `📞 *Global Contact Support*\n\n` +
      `Status: ${statusEmoji} ${statusText}\n` +
      `Bonus Amount: $${settings.contactSupportBonusAmount}\n` +
      `Timer: ${settings.contactSupportTimerMinutes} minutes${timeLeftText}`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    )
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Global contact support error:', error)
    await ctx.reply('❌ Failed to load settings')
  }
})

bot.callbackQuery('cs_configure', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  adminState.set(adminId, { awaitingInput: 'cs_bonus_amount' })

  const keyboard = new InlineKeyboard()
    .text('❌ Cancel', 'admin_global_contact_support')

  await safeEditMessage(ctx,
    '📞 *Configure Contact Support*\n\n' +
    'Step 1: Enter bonus amount (in $)\n\n' +
    'Example: 50',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await safeAnswerCallback(ctx)
})

bot.callbackQuery('cs_show_active', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  try {
    // Reset contactSupportSeen for all users
    const result = await prisma.user.updateMany({
      data: {
        contactSupportSeen: false
      }
    })

    await safeEditMessage(ctx,
      `✅ *Contact Support Activated*\n\n` +
      `The modal will be shown to all ${result.count} users on next app launch.`,
      { 
        reply_markup: new InlineKeyboard().text('◀️ Back', 'admin_global_contact_support'),
        parse_mode: 'Markdown'
      }
    )
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Show to active error:', error)
    await ctx.reply('❌ Failed to activate for users')
  }
})

bot.callbackQuery('cs_disable', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  try {
    let settings = await prisma.globalSettings.findFirst()
    
    if (settings) {
      await prisma.globalSettings.update({
        where: { id: settings.id },
        data: {
          contactSupportEnabled: false
        }
      })
    }

    await safeEditMessage(ctx,
      `✅ *Contact Support Disabled*\n\n` +
      `The modal will no longer be shown to users.`,
      { 
        reply_markup: new InlineKeyboard().text('◀️ Back', 'admin_global_contact_support'),
        parse_mode: 'Markdown'
      }
    )
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Disable contact support error:', error)
    await ctx.reply('❌ Failed to disable')
  }
})

// Activate accounts with bonus tokens
bot.callbackQuery('admin_activate_token_accounts', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  try {
    // Find all INACTIVE users with bonusTokens > 0
    const inactiveUsersWithTokens = await prisma.user.findMany({
      where: {
        status: 'INACTIVE',
        bonusTokens: { gt: 0 }
      },
      select: {
        id: true,
        telegramId: true,
        username: true,
        bonusTokens: true
      }
    })

    if (inactiveUsersWithTokens.length === 0) {
      await safeEditMessage(ctx,
        `✅ *No Accounts to Activate*\n\n` +
        `All accounts with bonus tokens are already active.`,
        { 
          reply_markup: new InlineKeyboard().text('◀️ Back to Admin', 'admin_menu'),
          parse_mode: 'Markdown'
        }
      )
      await safeAnswerCallback(ctx)
      return
    }

    // Show confirmation
    const usersList = inactiveUsersWithTokens.slice(0, 5).map((u, i) => 
      `${i + 1}. @${u.username || u.telegramId} ($${u.bonusTokens.toFixed(2)})`
    ).join('\n')
    
    const moreText = inactiveUsersWithTokens.length > 5 
      ? `\n...and ${inactiveUsersWithTokens.length - 5} more` 
      : ''

    const keyboard = new InlineKeyboard()
      .text('✅ Yes, Activate All', 'confirm_activate_token_accounts')
      .text('❌ Cancel', 'admin_menu')

    await safeEditMessage(ctx,
      `⚠️ *Activate Accounts with Tokens*\n\n` +
      `Found ${inactiveUsersWithTokens.length} INACTIVE accounts with bonus tokens:\n\n` +
      usersList + moreText + '\n\n' +
      `Do you want to activate all of them?`,
      { 
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      }
    )
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Activate token accounts error:', error)
    await ctx.reply('❌ Failed to check accounts')
  }
})

bot.callbackQuery('confirm_activate_token_accounts', async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  try {
    // Activate all INACTIVE accounts with bonusTokens > 0
    const result = await prisma.user.updateMany({
      where: {
        status: 'INACTIVE',
        bonusTokens: { gt: 0 }
      },
      data: {
        status: 'ACTIVE'
      }
    })

    await safeEditMessage(ctx,
      `✅ *Accounts Activated*\n\n` +
      `Successfully activated ${result.count} accounts with bonus tokens.`,
      { 
        reply_markup: new InlineKeyboard().text('◀️ Back to Admin', 'admin_menu'),
        parse_mode: 'Markdown'
      }
    )
    await safeAnswerCallback(ctx, 'Activated!')
  } catch (error) {
    console.error('Confirm activate error:', error)
    await ctx.reply('❌ Failed to activate accounts')
  }
})

// Approve withdrawal
bot.callbackQuery(/^approve_withdrawal_(\d+)(?:_(\d+))?$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isSupport(adminId))) {
    await safeAnswerCallback(ctx)
    await ctx.reply('⛔ Access denied')
    return
  }

  const withdrawalId = parseInt(ctx.match![1])
  const fromPage = ctx.match![2] ? parseInt(ctx.match![2]) : undefined
  
  // Save the page we came from
  if (fromPage) {
    const currentState = adminState.get(adminId) || {}
    adminState.set(adminId, { ...currentState, currentPendingWithdrawalsPage: fromPage })
  }
  
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) {
      await safeAnswerCallback(ctx)
      await ctx.reply('❌ Withdrawal not found')
      return
    }

    if (withdrawal.status === 'COMPLETED') {
      await safeAnswerCallback(ctx)
      await ctx.reply('✅ Already completed')
      return
    }

    if (withdrawal.status === 'FAILED') {
      await safeAnswerCallback(ctx)
      await ctx.reply('❌ Already rejected/failed')
      return
    }

    // If PROCESSING and already has txHash, just mark as COMPLETED (already sent to OxaPay)
    if (withdrawal.status === 'PROCESSING' && withdrawal.txHash && withdrawal.txHash !== 'MANUAL_PROCESSING_REQUIRED') {
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'COMPLETED' }
      })

      // Notify user
      await bot.api.sendMessage(
        withdrawal.user.telegramId,
        `✅ *Withdrawal Completed*\n\n` +
        `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
        `💳 Method: ${(withdrawal as any).paymentMethod || 'OXAPAY'}\n` +
        `💎 Currency: ${withdrawal.currency}\n` +
        `🌐 Network: ${withdrawal.network}\n` +
        `📍 Address: \`${withdrawal.address}\`\n\n` +
        `✅ Transaction confirmed by admin.`,
        { parse_mode: 'Markdown' }
      )

      await safeEditMessage(ctx, 
        ctx.callbackQuery.message!.text + '\n\n✅ *CONFIRMED AS COMPLETED*',
        { parse_mode: 'Markdown' }
      )
      await safeAnswerCallback(ctx)
      return
    }

    // For PROCESSING status without txHash: balance already deducted, need to process via OxaPay
    if (withdrawal.status === 'PROCESSING' && (!withdrawal.txHash || withdrawal.txHash === 'MANUAL_PROCESSING_REQUIRED')) {
      console.log(`💸 Approving PROCESSING withdrawal ${withdrawal.id} for user ${withdrawal.user.telegramId}`)
      console.log(`ℹ️ Balance already deducted (reserved). Current balance: $${withdrawal.user.balance.toFixed(2)}`)
      
      const paymentMethod = String((withdrawal as any).paymentMethod || 'OXAPAY').toUpperCase()

      // Refresh user balances for accurate "remaining" values
      const currentUser = await prisma.user.findUnique({ where: { id: withdrawal.userId } })
      const currentTotalDeposit = currentUser?.totalDeposit ?? (withdrawal.user as any).totalDeposit ?? 0
      const currentProfit = currentUser?.profit ?? (withdrawal.user as any).profit ?? 0
      const currentAvailable = currentTotalDeposit + (currentProfit || 0)

      // PayPal payout - MANUAL PROCESSING ONLY
      if (paymentMethod === 'PAYPAL') {
        const receiverEmail = (withdrawal as any).paypalEmail || withdrawal.address
        
        // Approve = mark as APPROVED and wait for manual transfer; completion is a separate step
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'APPROVED',
            txHash: 'AWAITING_MANUAL_TRANSFER'
          }
        })

        // Notify user that withdrawal was approved
        try {
          await bot.api.sendMessage(
            withdrawal.user.telegramId,
            `✅ *Withdrawal Approved*\n\n` +
              `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
              `💳 Method: PAYPAL\n` +
              `📧 PayPal: \`${receiverEmail}\`\n\n` +
              `💳 Remaining deposit: $${Number(currentTotalDeposit).toFixed(2)}\n` +
              `📈 Remaining profit: $${Number(currentProfit || 0).toFixed(2)}\n` +
              `💰 Available total: $${Number(currentAvailable).toFixed(2)}\n\n` +
              `ℹ️ Approved by admin. Transfer will be processed manually.`,
            { parse_mode: 'Markdown' }
          )
        } catch (err) {
          console.error('Failed to notify user about withdrawal approval (PayPal):', err)
        }

        const approvalNotice =
          `✅ *Withdrawal Approved*\n\n` +
          `🆔 ID: ${withdrawal.id}\n` +
          `👤 User: ${formatUserDisplay(withdrawal.user)} (ID: ${withdrawal.user.telegramId})\n` +
          `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
          `💳 Method: ${paymentMethod}\n` +
          `📧 PayPal: \`${receiverEmail}\`\n\n` +
          `👮 Approved by: ${formatAdminDisplay(ctx.from, adminId)}`

        await notifyAdminsExcept(adminId, approvalNotice, { parse_mode: 'Markdown' })

        const backState = adminState.get(adminId)
        const savedPage = backState?.currentPendingWithdrawalsPage || 1
        const backKeyboard = new InlineKeyboard()
          .text('◀️ Back', `admin_pending_withdrawals_${savedPage}`)

        await safeEditMessage(
          ctx,
          ctx.callbackQuery.message!.text + '\n\n✅ *APPROVED*\n' +
            `💳 Amount: $${withdrawal.amount.toFixed(2)}\n` +
            `📧 PayPal: ${receiverEmail}\n` +
            `ℹ️ Manual transfer required (use "Complete" after transfer).`,
          { parse_mode: 'Markdown', reply_markup: backKeyboard }
        )
        await safeAnswerCallback(ctx)
        return
      }

      // OxaPay/Crypto payout - MANUAL PROCESSING ONLY
      // Approve = mark as APPROVED and wait for manual transfer; completion is a separate step
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          txHash: 'AWAITING_MANUAL_TRANSFER'
        }
      })

      console.log(`✅ Withdrawal ${withdrawalId} approved and marked APPROVED (awaiting manual transfer)`) 

      // Notify user
      try {
        await bot.api.sendMessage(
          withdrawal.user.telegramId,
          `✅ *Withdrawal Approved*\n\n` +
          `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
          `💎 Currency: ${withdrawal.currency}\n` +
          `🌐 Network: ${withdrawal.network}\n` +
          `📍 Address: \`${withdrawal.address}\`\n\n` +
          `💳 Remaining deposit: $${Number(currentTotalDeposit).toFixed(2)}\n` +
          `📈 Remaining profit: $${Number(currentProfit || 0).toFixed(2)}\n` +
          `💰 Available total: $${Number(currentAvailable).toFixed(2)}\n\n` +
          `ℹ️ Approved by admin. Transfer will be processed manually.`,
          { parse_mode: 'Markdown' }
        )
      } catch (err) {
        console.error('Failed to notify user about withdrawal approval (Crypto):', err)
      }

      const approvalNotice =
        `✅ *Withdrawal Approved*\n\n` +
        `🆔 ID: ${withdrawal.id}\n` +
        `👤 User: ${formatUserDisplay(withdrawal.user)} (ID: ${withdrawal.user.telegramId})\n` +
        `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
        `💳 Method: ${paymentMethod}\n` +
        `💎 Currency: ${withdrawal.currency}\n` +
        `🌐 Network: ${withdrawal.network}\n` +
        `📍 Address: \`${withdrawal.address}\`\n\n` +
        `👮 Approved by: ${formatAdminDisplay(ctx.from, adminId)}`

      await notifyAdminsExcept(adminId, approvalNotice, { parse_mode: 'Markdown' })
      
      const backState = adminState.get(adminId)
      const savedPage = backState?.currentPendingWithdrawalsPage || 1
      const backKeyboard = new InlineKeyboard()
        .text('◀️ Back', `admin_pending_withdrawals_${savedPage}`)
      
      await safeEditMessage(ctx, 
        ctx.callbackQuery.message!.text + '\n\n✅ *APPROVED*\n' +
        `💳 Amount: $${withdrawal.amount.toFixed(2)}\n` +
        `💎 ${withdrawal.currency} (${withdrawal.network})\n` +
        `📍 Address: \`${withdrawal.address}\`\n` +
        `ℹ️ Manual transfer required (use "Complete" after transfer).`,
        { parse_mode: 'Markdown', reply_markup: backKeyboard }
      )
      await safeAnswerCallback(ctx)
    } else if (withdrawal.status === 'PENDING') {
      // This should not happen with new logic, but handle legacy pending withdrawals
      await safeAnswerCallback(ctx)
      await ctx.reply('⚠️ Legacy PENDING withdrawal detected. Please reject and ask user to resubmit.')
      return
    }
  } catch (error) {
    console.error('Error approving withdrawal:', error)
    await safeAnswerCallback(ctx)
    await ctx.reply('❌ Error processing withdrawal')
  }
})

// Reject withdrawal
bot.callbackQuery(/^reject_withdrawal_(\d+)(?:_(\d+))?$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx)
    await ctx.reply('⛔ Access denied')
    return
  }

  const withdrawalId = parseInt(ctx.match![1])
  const fromPage = ctx.match![2] ? parseInt(ctx.match![2]) : undefined
  
  // Save the page we came from
  if (fromPage) {
    const currentState = adminState.get(userId) || {}
    adminState.set(userId, { ...currentState, currentPendingWithdrawalsPage: fromPage })
  }
  
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) {
      await safeAnswerCallback(ctx)
      await ctx.reply('❌ Withdrawal not found')
      return
    }

    if (withdrawal.status === 'COMPLETED') {
      await safeAnswerCallback(ctx)
      await ctx.reply('❌ Cannot reject completed withdrawal')
      return
    }

    if (withdrawal.status === 'FAILED') {
      await safeAnswerCallback(ctx)
      await ctx.reply('ℹ️ Already rejected')
      return
    }

    // Get current user balance
    const currentUser = await prisma.user.findUnique({ where: { id: withdrawal.userId } })
    if (!currentUser) {
      await safeAnswerCallback(ctx)
      await ctx.reply('❌ User not found')
      return
    }

    // Update withdrawal status to failed (rejected by admin)
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'FAILED' }
    })

    // Funds are reserved for PROCESSING/APPROVED withdrawals.
    // Refund the exact buckets using stored reservation breakdown.
    let refundMessage = ''
    if (withdrawal.status === 'PROCESSING' || withdrawal.status === 'APPROVED') {
      const reservedDeposit = Number((withdrawal as any).reservedDeposit || 0)
      const reservedProfit = Number((withdrawal as any).reservedProfit || 0)

      // Backward-compatibility: if older records don't have reservation fields, refund everything to deposit.
      const shouldFallback = reservedDeposit <= 0 && reservedProfit <= 0
      const refundDeposit = shouldFallback ? withdrawal.amount : reservedDeposit
      const refundProfit = shouldFallback ? 0 : reservedProfit

      const updatedUser = await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          totalDeposit: { increment: refundDeposit },
          // Keep legacy balance mirrored with totalDeposit.
          balance: { increment: refundDeposit },
          ...(refundProfit > 0 ? { profit: { increment: refundProfit } } : {}),
        }
      })

      // Recompute plan after restoring funds
      try {
        await updateUserPlan(updatedUser.id)
      } catch (e) {
        console.error('Failed to update user plan after withdrawal refund:', e)
      }

      refundMessage = `✅ Funds returned to your account\n💳 New deposit: $${updatedUser.totalDeposit.toFixed(2)}`
      console.log(`💰 Refunded withdrawal ${withdrawal.id} to user ${withdrawal.user.telegramId}. New deposit: $${updatedUser.totalDeposit.toFixed(2)}`)
    } else {
      refundMessage = `💳 Current deposit: $${currentUser.totalDeposit.toFixed(2)} (unchanged)`
      console.log(`ℹ️ No refund needed for PENDING withdrawal ${withdrawal.id}`)
    }

    // Notify user
    await bot.api.sendMessage(
      withdrawal.user.telegramId,
      `❌ *Withdrawal Rejected*\n\n` +
      `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
      `💎 Currency: ${withdrawal.currency}\n\n` +
      `${refundMessage}\n\n` +
      `ℹ️ Please contact support if you have questions.`,
      { parse_mode: 'Markdown' }
    )

    const backState = adminState.get(userId)
    const savedPage = backState?.currentPendingWithdrawalsPage || 1
    const backKeyboard = new InlineKeyboard()
      .text('◀️ Back to Pending Withdrawals', `admin_pending_withdrawals_${savedPage}`)

    await safeEditMessage(ctx, 
      ctx.callbackQuery.message!.text + '\n\n❌ *REJECTED* (Balance restored)',
      { parse_mode: 'Markdown', reply_markup: backKeyboard }
    )
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Error rejecting withdrawal:', error)
    await safeAnswerCallback(ctx)
    await ctx.reply('❌ Error rejecting withdrawal')
  }
})

// Mark withdrawal as completed (after manual transfer by admin)
bot.callbackQuery(/^complete_withdrawal_(\d+)$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx)
    await ctx.reply('⛔ Access denied')
    return
  }

  const withdrawalId = parseInt(ctx.match![1])
  
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) {
      await safeAnswerCallback(ctx)
      await ctx.reply('❌ Withdrawal not found')
      return
    }

    if (withdrawal.status === 'COMPLETED') {
      await safeAnswerCallback(ctx)
      await ctx.reply('ℹ️ Already marked as completed')
      return
    }

    if (withdrawal.status === 'FAILED') {
      await safeAnswerCallback(ctx)
      await ctx.reply('❌ Cannot complete rejected withdrawal')
      return
    }

    // Mark withdrawal as COMPLETED once and increment user's lifetime withdrawals once.
    const newTxHash = withdrawal.txHash === 'AWAITING_MANUAL_TRANSFER' ? 'MANUAL_TRANSFER_COMPLETED' : withdrawal.txHash

    await prisma.$transaction(async (tx) => {
      const marked = await tx.withdrawal.updateMany({
        where: { id: withdrawalId, status: { notIn: ['COMPLETED', 'FAILED'] } },
        data: {
          status: 'COMPLETED',
          txHash: newTxHash,
        },
      })

      if (marked.count === 1) {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { totalWithdraw: { increment: withdrawal.amount } },
        })
      }
    })

    console.log(`✅ Withdrawal ${withdrawalId} marked as COMPLETED by admin ${userId}`)

    const paymentMethod = String((withdrawal as any).paymentMethod || 'OXAPAY').toUpperCase()

    // Notify user about completed withdrawal
    if (paymentMethod === 'PAYPAL') {
      const receiverEmail = (withdrawal as any).paypalEmail || withdrawal.address
      await bot.api.sendMessage(
        withdrawal.user.telegramId,
        `✅ *Withdrawal Completed!*\n\n` +
          `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
          `💳 Method: PayPal\n` +
          `📧 Sent to: \`${receiverEmail}\`\n\n` +
          `✅ Funds have been transferred to your PayPal account.\n` +
          `💳 Check your PayPal balance.`,
        { parse_mode: 'Markdown' }
      )
    } else {
      await bot.api.sendMessage(
        withdrawal.user.telegramId,
        `✅ *Withdrawal Completed!*\n\n` +
          `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
          `💎 Currency: ${withdrawal.currency}\n` +
          `🌐 Network: ${withdrawal.network}\n` +
          `📍 Address: \`${withdrawal.address}\`\n\n` +
          `✅ Funds have been sent to your wallet address.`,
        { parse_mode: 'Markdown' }
      )
    }

    const backState = adminState.get(userId)
    const savedPage = backState?.currentPendingWithdrawalsPage || 1
    const backKeyboard = new InlineKeyboard()
      .text('◀️ Back to Pending Withdrawals', `admin_pending_withdrawals_${savedPage}`)

    await safeEditMessage(
      ctx,
      ctx.callbackQuery.message!.text + '\n\n✅ *COMPLETED*\n' +
        `✅ Marked as completed by admin\n` +
        `📅 ${new Date().toLocaleString()}`,
      { parse_mode: 'Markdown', reply_markup: backKeyboard }
    )
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Error completing withdrawal:', error)
    await safeAnswerCallback(ctx)
    await ctx.reply('❌ Error marking withdrawal as completed')
  }
})

// Show withdrawal details
bot.callbackQuery(/^withdrawal_details_(\d+)$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isSupport(userId))) {
    await safeAnswerCallback(ctx, 'Access denied')
    return
  }

  const withdrawalId = parseInt(ctx.match![1])
  
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) {
      await safeAnswerCallback(ctx, '❌ Withdrawal not found')
      return
    }

    const user = withdrawal.user
    const username = (user.username || 'no_username').replace(/_/g, '\\_')
    
    // Risk indicators
    const riskFlags = []
    if (withdrawal.isVpnProxy) riskFlags.push('🔴 VPN/Proxy detected')
    if (withdrawal.ipChanged) riskFlags.push('⚠️ IP changed since registration')
    if (withdrawal.percentOfBalance && withdrawal.percentOfBalance > 90) riskFlags.push('⚠️ Withdrawing >90% of balance')
    if (withdrawal.hoursSinceLastDeposit && withdrawal.hoursSinceLastDeposit < 1) riskFlags.push('⚠️ Withdrawal <1h after deposit')
    if (withdrawal.accountAge && withdrawal.accountAge < 1) riskFlags.push('⚠️ New account (<24h)')
    
    const riskLevel = riskFlags.length === 0 ? '🟢 Low Risk' : 
                      riskFlags.length <= 2 ? '🟡 Medium Risk' : '🔴 High Risk'

    const detailsMessage = `📊 *Withdrawal Details #${withdrawal.id}*\n\n` +
      `👤 *User Info:*\n` +
      `• Username: @${username}\n` +
      `• Telegram ID: ${user.telegramId}\n` +
      `• Account age: ${withdrawal.accountAge || 'N/A'} days\n` +
      `• Previous withdrawals: ${withdrawal.previousWithdrawals || 0}\n\n` +
      
      `🌍 *Location & Device:*\n` +
      `• IP: \`${withdrawal.ipAddress || 'N/A'}\`\n` +
      `• Country: ${withdrawal.country || 'N/A'}\n` +
      `• City: ${withdrawal.city || 'N/A'}\n` +
      `• ISP: ${withdrawal.isp || 'N/A'}\n` +
      `• Timezone: ${withdrawal.timezone || 'N/A'}\n` +
      `• Language: ${withdrawal.language || 'N/A'}\n` +
      `• VPN/Proxy: ${withdrawal.isVpnProxy ? 'Yes ⚠️' : 'No ✅'}\n` +
      `• IP changed: ${withdrawal.ipChanged ? 'Yes ⚠️' : 'No ✅'}\n\n` +
      
      `💻 *Technical:*\n` +
      `• User Agent: ${withdrawal.userAgent ? withdrawal.userAgent.substring(0, 60) + '...' : 'N/A'}\n` +
      `• Screen: ${withdrawal.screenResolution || 'N/A'}\n` +
      `• Fingerprint: ${withdrawal.deviceFingerprint ? withdrawal.deviceFingerprint.substring(0, 20) + '...' : 'N/A'}\n` +
      `• Referrer: ${withdrawal.referrer || 'N/A'}\n\n` +
      
      `💰 *Transaction Stats:*\n` +
      `• Amount: $${withdrawal.amount.toFixed(2)}\n` +
      `• % of balance: ${withdrawal.percentOfBalance?.toFixed(1) || 'N/A'}%\n` +
      `• Deposit/Withdraw ratio: ${withdrawal.depositToWithdrawRatio?.toFixed(2) || 'N/A'}\n` +
      `• Hours since last deposit: ${withdrawal.hoursSinceLastDeposit?.toFixed(1) || 'N/A'}\n\n` +
      
      `🎯 *Risk Assessment:*\n` +
      `${riskLevel}\n` +
      (riskFlags.length > 0 ? riskFlags.join('\n') : '✅ No risk flags detected')

    await ctx.reply(detailsMessage, { parse_mode: 'Markdown' })
    await safeAnswerCallback(ctx)
  } catch (error) {
    console.error('Error showing withdrawal details:', error)
    await safeAnswerCallback(ctx, '❌ Error loading details')
  }
})

const getLocalDateKey = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Generate random profit updates throughout a given time range
function generateDailyUpdates(totalProfit: number, rangeStart: Date, rangeEnd: Date): { amount: number, timestamp: Date }[] {
  const updates: { amount: number, timestamp: Date }[] = []
  const numUpdates = Math.floor(Math.random() * 8) + 4 // 4-11 updates
  
  // Generate random percentages that sum to 1
  const percentages: number[] = []
  let sum = 0
  for (let i = 0; i < numUpdates; i++) {
    const rand = Math.random()
    percentages.push(rand)
    sum += rand
  }
  
  // Normalize percentages
  const normalizedPercentages = percentages.map(p => p / sum)
  
  const startTime = rangeStart.getTime()
  const endTime = rangeEnd.getTime()
  const rangeMs = Math.max(1, endTime - startTime)
  
  for (let i = 0; i < numUpdates; i++) {
    const randomOffset = Math.random() * rangeMs
    const timestamp = new Date(startTime + randomOffset)
    let amount = totalProfit * normalizedPercentages[i]
    
    // Minimum $0.01 per update
    if (amount < 0.01) amount = 0.01
    
    updates.push({ amount, timestamp })
  }
  
  // Sort by timestamp (oldest first)
  updates.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  return updates
}

// Check if profit accrual should run (time-based, not interval-based)
async function checkAndRunProfitAccrual() {
  try {
    // Get the most recent profit update timestamp from any user
    const mostRecentUpdate = await prisma.user.findFirst({
      where: {
        lastProfitUpdate: { not: null }
      },
      orderBy: {
        lastProfitUpdate: 'desc'
      },
      select: {
        lastProfitUpdate: true
      }
    })

    const now = new Date()
    const lastAccrual = mostRecentUpdate?.lastProfitUpdate
    const todayKey = getLocalDateKey(now)
    const lastKey = lastAccrual ? getLocalDateKey(lastAccrual) : null

    // Run once per calendar day
    if (!lastKey || lastKey !== todayKey) {
      console.log(`⏰ Time to generate today's profit schedule (last: ${lastAccrual ? lastAccrual.toISOString() : 'never'})`)
      await accrueDailyProfit()
    }
  } catch (error) {
    console.error('❌ Error checking profit accrual schedule:', error)
  }
}

// Daily profit accrual function
async function accrueDailyProfit() {
  try {
    console.log(`🔄 Starting daily profit accrual at ${new Date().toISOString()}`)

    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfToday.getDate() + 1)
    const endOfToday = new Date(startOfTomorrow.getTime() - 1)
    
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { totalDeposit: { gt: 0 } },
          { bonusTokens: { gt: 0 } }
        ],
        // Exclude users with KYC required or blocked
        kycRequired: false,
        isBlocked: false
      }
    })

    for (const user of users) {
      const planInfo = calculateTariffPlan(user.totalDeposit)
      const dailyProfit = (user.totalDeposit * planInfo.dailyPercent) / 100
      
      // Syntrix Token earns daily profit at a fixed rate (0.1%)
      const bonusProfit = ((user.bonusTokens || 0) * 0.1) / 100
      const totalDailyProfit = dailyProfit + bonusProfit

      if (totalDailyProfit <= 0) {
        continue
      }

      // Mark that today's schedule has been generated
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastProfitUpdate: startOfToday
        }
      })

      // Generate random daily updates for today (00:00–23:59). If generated late, don't backfill past times.
      const scheduleStart = now.getTime() > startOfToday.getTime() ? now : startOfToday
      const depositUpdates = dailyProfit > 0 ? generateDailyUpdates(dailyProfit, scheduleStart, endOfToday) : []

      // Create exactly one token accrual per day (clear labeling, avoids spam)
      const tokenUpdates: { amount: number, timestamp: Date }[] = []
      if (bonusProfit >= 0.01) {
        const startTime = scheduleStart.getTime()
        const endTime = endOfToday.getTime()
        const rangeMs = Math.max(1, endTime - startTime)
        const randomOffset = Math.random() * rangeMs
        tokenUpdates.push({ amount: bonusProfit, timestamp: new Date(startTime + randomOffset) })
      }

      const updates = [...depositUpdates, ...tokenUpdates].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      // Delete only today's updates for this user (preserve history)
      await prisma.dailyProfitUpdate.deleteMany({
        where: {
          userId: user.id,
          timestamp: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      })
      
      // Create new daily updates (notifications will be sent by scheduler)
      for (const update of updates) {
        const isTokenUpdate = tokenUpdates.includes(update)
        await prisma.dailyProfitUpdate.create({
          data: {
            userId: user.id,
            amount: update.amount,
            source: isTokenUpdate ? 'TOKEN' : 'DEPOSIT',
            timestamp: update.timestamp,
            dailyTotal: totalDailyProfit
          }
        })
      }

      const bonusInfo = bonusProfit > 0 ? ` + $${bonusProfit.toFixed(4)} token` : ''
      console.log(`💰 Accrued $${totalDailyProfit.toFixed(4)} profit to user ${user.telegramId} (${planInfo.currentPlan} - ${planInfo.dailyPercent}%${bonusInfo}) - ${updates.length} updates`)

      // Distribute referral earnings (3-level cascade: 4%, 3%, 2%)
      // Only if user is active referral (totalDeposit >= activation deposit)
      if (user.referredBy && user.isActiveReferral) {
        try {
          // Level 1: Direct referrer gets 4%
          const level1Referrer = await prisma.user.findUnique({
            where: { telegramId: user.referredBy }
          })

          if (level1Referrer) {
            const level1Earnings = dailyProfit * 0.04
            await prisma.user.update({
              where: { id: level1Referrer.id },
              data: {
                referralEarnings: level1Referrer.referralEarnings + level1Earnings
              }
            })

            // Update referral record
            await prisma.referral.updateMany({
              where: {
                userId: level1Referrer.id,
                referredUserId: user.id,
                level: 1
              },
              data: {
                earnings: { increment: level1Earnings }
              }
            })

            console.log(`  └─ 💎 L1: $${level1Earnings.toFixed(2)} to ${level1Referrer.telegramId}`)

            // Level 2: Referrer's referrer gets 3%
            if (level1Referrer.referredBy) {
              const level2Referrer = await prisma.user.findUnique({
                where: { telegramId: level1Referrer.referredBy }
              })

              if (level2Referrer) {
                const level2Earnings = dailyProfit * 0.03
                await prisma.user.update({
                  where: { id: level2Referrer.id },
                  data: {
                    referralEarnings: level2Referrer.referralEarnings + level2Earnings
                  }
                })

                await prisma.referral.updateMany({
                  where: {
                    userId: level2Referrer.id,
                    referredUserId: user.id,
                    level: 2
                  },
                  data: {
                    earnings: { increment: level2Earnings }
                  }
                })

                console.log(`  └─ 💎 L2: $${level2Earnings.toFixed(2)} to ${level2Referrer.telegramId}`)

                // Level 3: Level 2's referrer gets 2%
                if (level2Referrer.referredBy) {
                  const level3Referrer = await prisma.user.findUnique({
                    where: { telegramId: level2Referrer.referredBy }
                  })

                  if (level3Referrer) {
                    const level3Earnings = dailyProfit * 0.02
                    await prisma.user.update({
                      where: { id: level3Referrer.id },
                      data: {
                        referralEarnings: level3Referrer.referralEarnings + level3Earnings
                      }
                    })

                    await prisma.referral.updateMany({
                      where: {
                        userId: level3Referrer.id,
                        referredUserId: user.id,
                        level: 3
                      },
                      data: {
                        earnings: { increment: level3Earnings }
                      }
                    })

                    console.log(`  └─ 💎 L3: $${level3Earnings.toFixed(2)} to ${level3Referrer.telegramId}`)
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`  └─ ❌ Error distributing referral earnings for user ${user.telegramId}:`, error)
        }
      }
    }

    console.log(`✅ Daily profit accrual completed for ${users.length} users`)
  } catch (error) {
    console.error('❌ Error accruing daily profit:', error)
  }
}

// Function to check and send scheduled profit notifications
async function sendScheduledNotifications() {
  try {
    const now = new Date()
    
    // Find all updates that should be sent now (timestamp passed, not yet notified)
    const pendingUpdates = await prisma.dailyProfitUpdate.findMany({
      where: {
        timestamp: {
          lte: now
        },
        notified: false
      },
      include: {
        user: true
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: 50 // Send max 50 notifications at a time
    })

    let successCount = 0
    
    for (const update of pendingUpdates) {
      try {
        // Apply profit accrual and mark update as notified first.
        // This ensures profit keeps accumulating even if Telegram delivery fails.
        await prisma.$transaction([
          prisma.user.update({
            where: { id: update.userId },
            data: {
              profit: { increment: update.amount }
            }
          }),
          prisma.dailyProfitUpdate.update({
            where: { id: update.id },
            data: { notified: true }
          })
        ])

        // Best-effort Telegram notification
        try {
          if (update.source === 'TOKEN') {
            await bot.api.sendMessage(
              update.user.telegramId,
              `🎁 *Syntrix Token Income*\n\n` +
              `✅ Token accrual: $${update.amount.toFixed(2)}\n` +
              `📌 0.1% daily`,
              { parse_mode: 'Markdown' }
            )
          } else {
            const planInfo = calculateTariffPlan(update.user.totalDeposit)
            await bot.api.sendMessage(
              update.user.telegramId,
              `💰 *Daily Profit Update*\n\n` +
              `✅ Profit accrued: $${update.amount.toFixed(2)}\n` +
              `📊 Plan: ${planInfo.currentPlan} (${planInfo.dailyPercent}%)`,
              { parse_mode: 'Markdown' }
            )
          }
          console.log(`📤 Sent profit notification to user ${update.user.telegramId}: $${update.amount.toFixed(2)}`)
        } catch (err) {
          console.error(`Failed to send notification to user ${update.user.telegramId}:`, err)
        }
        
        successCount++
        
        // Add small delay between messages to avoid rate limits
        if (successCount < pendingUpdates.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (err) {
        console.error(`Failed to send notification to user ${update.user.telegramId}:`, err)
      }
    }
    
    if (successCount > 0) {
      console.log(`✅ Sent ${successCount} scheduled profit notifications`)
    }
  } catch (error) {
    console.error('❌ Error sending scheduled notifications:', error)
  }
}

// Function to check and update withdrawal statuses
async function checkPendingWithdrawals() {
  const enabled = String(process.env.WITHDRAWAL_STATUS_CHECKER_ENABLED || '').toLowerCase() === 'true'
  if (!enabled) {
    return
  }
  try {
    // Find all PROCESSING withdrawals with trackId
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        status: 'PROCESSING',
        txHash: { not: null }
      },
      include: {
        user: true
      }
    })

    if (pendingWithdrawals.length === 0) {
      return
    }

    console.log(`🔍 Checking ${pendingWithdrawals.length} pending withdrawals...`)

    for (const withdrawal of pendingWithdrawals) {
      try {
        const { checkPayoutStatus } = await import('./oxapay.js')
        const status = await checkPayoutStatus(withdrawal.txHash!)

        console.log(`📊 Withdrawal ${withdrawal.id} status:`, status)

        // OxaPay payout statuses:
        // - Pending: Still processing
        // - Sending: Being sent to blockchain
        // - Paid: Successfully completed
        // - Expired: Failed/Expired
        // - Canceled: Canceled

        if (status.result === 100) {
          const payoutStatus = status.status?.toLowerCase()

          if (payoutStatus === 'paid' || payoutStatus === 'confirmed') {
            // Withdrawal completed successfully (idempotent)
            const completed = await prisma.$transaction(async (tx) => {
              const marked = await tx.withdrawal.updateMany({
                where: { id: withdrawal.id, status: { notIn: ['COMPLETED', 'FAILED'] } },
                data: { status: 'COMPLETED' },
              })

              if (marked.count === 1) {
                await tx.user.update({
                  where: { id: withdrawal.userId },
                  data: { totalWithdraw: { increment: withdrawal.amount } },
                })
                return true
              }

              return false
            })

            // Notify user only once
            if (completed) {
              try {
                await bot.api.sendMessage(
                  withdrawal.user.telegramId,
                  `✅ *Withdrawal Completed*\n\n` +
                  `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
                  `💎 Currency: ${withdrawal.currency}\n` +
                  `🌐 Network: ${withdrawal.network}\n` +
                  `📍 Address: \`${withdrawal.address}\`\n\n` +
                  `✅ Your withdrawal has been successfully processed!`,
                  { parse_mode: 'Markdown' }
                )
              } catch (err) {
                console.error('Failed to notify user:', err)
              }
            }

            console.log(`✅ Withdrawal ${withdrawal.id} marked as COMPLETED`)
          } else if (payoutStatus === 'expired' || payoutStatus === 'canceled' || payoutStatus === 'failed') {
            // Withdrawal failed - refund user
            const refundedUser = await prisma.$transaction(async (tx) => {
              const marked = await tx.withdrawal.updateMany({
                where: { id: withdrawal.id, status: { notIn: ['COMPLETED', 'FAILED'] } },
                data: { status: 'FAILED' },
              })

              if (marked.count !== 1) return null

              const reservedDeposit = Number((withdrawal as any).reservedDeposit || 0)
              const reservedProfit = Number((withdrawal as any).reservedProfit || 0)

              const shouldFallback = reservedDeposit <= 0 && reservedProfit <= 0
              const refundDeposit = shouldFallback ? withdrawal.amount : reservedDeposit
              const refundProfit = shouldFallback ? 0 : reservedProfit

              const updatedUser = await tx.user.update({
                where: { id: withdrawal.userId },
                data: {
                  totalDeposit: { increment: refundDeposit },
                  balance: { increment: refundDeposit },
                  ...(refundProfit > 0 ? { profit: { increment: refundProfit } } : {}),
                },
              })

              return updatedUser
            })

            if (refundedUser) {
              try {
                await updateUserPlan(refundedUser.id)
              } catch (e) {
                console.error('Failed to update user plan after withdrawal refund:', e)
              }
            }

            // Notify user (only if we actually refunded)
            if (refundedUser) {
              try {
                await bot.api.sendMessage(
                  withdrawal.user.telegramId,
                  `❌ *Withdrawal Failed*\n\n` +
                  `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
                  `💎 Currency: ${withdrawal.currency}\n\n` +
                  `⚠️ The withdrawal could not be processed.\n` +
                  `💳 Your deposit has been refunded: $${refundedUser.totalDeposit.toFixed(2)}`,
                  { parse_mode: 'Markdown' }
                )
              } catch (err) {
                console.error('Failed to notify user:', err)
              }
            }

            console.log(`❌ Withdrawal ${withdrawal.id} FAILED and refunded`)
          }
          // If status is 'pending' or 'sending', keep as PROCESSING
        }
      } catch (error: any) {
        console.error(`Failed to check withdrawal ${withdrawal.id}:`, error.message)
      }
    }
  } catch (error) {
    console.error('❌ Error checking pending withdrawals:', error)
  }
}

function startWithdrawalStatusChecker() {
  const enabled = String(process.env.WITHDRAWAL_STATUS_CHECKER_ENABLED || '').toLowerCase() === 'true'
  if (!enabled) {
    console.log('ℹ️ Withdrawal status checker disabled (WITHDRAWAL_STATUS_CHECKER_ENABLED!=true)')
    return
  }

  console.log('🔄 Starting withdrawal status checker (every 5 minutes)...')
  checkPendingWithdrawals()
  setInterval(checkPendingWithdrawals, 5 * 60 * 1000)
}

async function refreshTelegramUserProfiles() {
  const enabled = String(process.env.TELEGRAM_PROFILE_SYNC_DAILY || 'true').toLowerCase() !== 'false'
  if (!enabled) return

  const syncAll = String(process.env.TELEGRAM_PROFILE_SYNC_ALL || '').toLowerCase() === 'true'
  const batchSize = Math.min(Math.max(Number(process.env.TELEGRAM_PROFILE_SYNC_BATCH || 200) || 200, 20), 1000)
  const delayMs = Math.min(Math.max(Number(process.env.TELEGRAM_PROFILE_SYNC_DELAY_MS || 75) || 75, 0), 5000)

  console.log(`🔄 Telegram profile sync started (syncAll=${syncAll}, batchSize=${batchSize})`)

  let lastId = 0
  let scanned = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  while (true) {
    const whereClause: any = {
      id: { gt: lastId },
    }

    if (!syncAll) {
      whereClause.OR = [
        { username: null },
        { username: '' },
        { username: 'no_username' },
      ]
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { id: 'asc' },
      take: batchSize,
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    })

    if (users.length === 0) break

    for (const user of users) {
      lastId = user.id
      scanned++

      const chatId = Number(user.telegramId)
      if (!Number.isFinite(chatId)) {
        skipped++
        continue
      }

      try {
        const chat: any = await bot.api.getChat(chatId)

        const newUsername = chat?.username ? String(chat.username) : null
        const newFirstName = chat?.first_name ? String(chat.first_name) : null
        const newLastName = chat?.last_name ? String(chat.last_name) : null

        const data: any = {}
        if (newUsername && newUsername !== user.username) data.username = newUsername
        if (newFirstName && newFirstName !== user.firstName) data.firstName = newFirstName
        if (newLastName && newLastName !== user.lastName) data.lastName = newLastName

        if (Object.keys(data).length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data,
          })
          updated++
        }
      } catch (err: any) {
        failed++
        const msg = err?.message || String(err)
        // Common cases: user blocked bot / chat not found / insufficient rights
        console.log(`⚠️ Telegram profile sync failed for userId=${user.id} tg=${user.telegramId}: ${msg}`)
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  console.log(`✅ Telegram profile sync done. scanned=${scanned}, updated=${updated}, skipped=${skipped}, failed=${failed}`)
}

function startTelegramProfileSyncScheduler() {
  const enabled = String(process.env.TELEGRAM_PROFILE_SYNC_DAILY || 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.log('ℹ️ Telegram profile sync scheduler disabled (TELEGRAM_PROFILE_SYNC_DAILY=false)')
    return
  }

  const cronExpr = String(process.env.TELEGRAM_PROFILE_SYNC_CRON || '0 4 * * *')
  const tz = String(process.env.TELEGRAM_PROFILE_SYNC_TZ || 'Europe/Kyiv')

  cron.schedule(cronExpr, async () => {
    try {
      await refreshTelegramUserProfiles()
    } catch (e) {
      console.error('❌ Telegram profile sync job error:', e)
    }
  }, { timezone: tz })

  console.log(`⏰ Telegram profile sync scheduled: '${cronExpr}' (${tz})`)
}

// Check if profit accrual should run every hour (more reliable than 24h interval)
setInterval(checkAndRunProfitAccrual, 60 * 60 * 1000)

// Check for scheduled notifications every minute
setInterval(sendScheduledNotifications, 60 * 1000)

// Check pending withdrawals every 5 minutes (opt-in)
startWithdrawalStatusChecker()

// Run profit check on startup (will run if needed)
setTimeout(() => {
  console.log('🔄 Running initial profit accrual check...')
  checkAndRunProfitAccrual()
}, 5000)

// Start notification scheduler
setTimeout(async () => {
  console.log('🔄 Starting notification scheduler...')
  sendScheduledNotifications()
}, 10000)

// Start withdrawal status checker
setTimeout(() => {
  startWithdrawalStatusChecker()
}, 15000)

// Start daily Telegram profile sync
setTimeout(() => {
  startTelegramProfileSyncScheduler()
}, 20000)

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err)
})

// Initialize database before starting
async function initDatabase() {
  try {
    console.log('🔄 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test if tables exist by trying a simple query
    try {
      await prisma.user.count()
      console.log('✅ Database tables verified')
    } catch (error: any) {
      if (error.code === 'P2021') {
        console.log('⚠️  Database tables not found. Auto-creating...')
        
        // Try to push database schema automatically
        const { execSync } = await import('child_process')
        try {
          execSync('npx prisma db push --accept-data-loss --skip-generate', { 
            stdio: 'inherit' 
          })
          console.log('✅ Database tables created successfully')
          
          // Verify again
          await prisma.user.count()
          console.log('✅ Database verification passed')
        } catch (pushError) {
          console.error('❌ Failed to create database tables:', pushError)
          throw pushError
        }
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

// Add error handler for Grammy errors
bot.catch((err) => {
  const ctx = err.ctx
  const error = err.error
  
  // Ignore these common non-critical errors
  if (error instanceof Error && (error.message.includes('query is too old') || 
      error.message.includes('message is not modified') ||
      error.message.includes('query ID is invalid'))) {
    // Silently ignore - these are expected when users interact with old buttons
    return
  }
  
  console.error(`Error handling update ${ctx.update.update_id}:`, error)
})

// Start bot and API server
async function startBot() {
  try {
    console.log('🤖 Syntrix Bot starting...')
    
    // Initialize database first
    await initDatabase()
    
    // Initialize bot (required for handleUpdate)
    await bot.init()

    if (supportBot) {
      await supportBot.init()
    }
    
    // Set webhook URL with secret token for security
    const webhookUrl = process.env.WEBHOOK_URL || 'https://syntrix-bot.onrender.com'
    const fullWebhookUrl = webhookUrl.startsWith('http') ? webhookUrl : `https://${webhookUrl}`
    const { WEBHOOK_SECRET_TOKEN, SUPPORT_WEBHOOK_SECRET_TOKEN } = await import('./api.js')
    console.log(`🔗 Setting webhook to: ${fullWebhookUrl}/webhook`)
    await bot.api.setWebhook(`${fullWebhookUrl}/webhook`, {
      secret_token: WEBHOOK_SECRET_TOKEN,
      // Explicitly request channel join updates so CHANNEL leads show up in CRM
      // even before a user starts the bot.
      allowed_updates: ['message', 'callback_query', 'chat_member', 'chat_join_request', 'my_chat_member'],
    })
    console.log('✅ Webhook set successfully with secret token')

    if (supportBot) {
      console.log(`🔗 Setting SUPPORT webhook to: ${fullWebhookUrl}/support-webhook`)
      await supportBot.api.setWebhook(`${fullWebhookUrl}/support-webhook`, {
        secret_token: SUPPORT_WEBHOOK_SECRET_TOKEN,
        allowed_updates: ['message', 'callback_query', 'chat_member', 'my_chat_member'],
      })
      console.log('✅ Support webhook set successfully with secret token')
    } else {
      console.warn('⚠️ SUPPORT_BOT_TOKEN is not set; support bot is disabled')
    }
    
    // Start API server (includes webhook handler)
    startApiServer(bot, supportBot ?? undefined)
    
    console.log('✅ Bot started successfully')
    // Initialize trading card scheduler
    await scheduleTradingCards(bot, CHANNEL_ID)
    
    // Start payout status checker to automatically update blockchain hashes
    const { startPayoutStatusChecker } = await import('./payoutStatusChecker.js')
    startPayoutStatusChecker()
  } catch (err) {
    console.error('❌ Bot start error:', err)
    process.exit(1)
  }
}

// Run the bot
startBot()

// Graceful shutdown
process.once('SIGINT', async () => {
  console.log('🛑 Bot stopping (SIGINT)...')
  await bot.stop()
  if (supportBot) await supportBot.stop()
  stopApiServer()
  await prisma.$disconnect()
  process.exit(0)
})
process.once('SIGTERM', async () => {
  console.log('🛑 Bot stopping (SIGTERM)...')
  await bot.stop()
  if (supportBot) await supportBot.stop()
  stopApiServer()
  await prisma.$disconnect()
  process.exit(0)
})

// ============= SUPPORT BOT HANDLERS =============
if (supportBot) {
  supportBot.command('start', async (ctx) => {
    const from = ctx.from
    const chatId = String(ctx.chat?.id)
    if (!from?.id || !chatId) return

    const telegramId = String(from.id)

    const existingUserBefore = await prisma.user.findUnique({ where: { telegramId } })
    const hadBonusBefore = Boolean(existingUserBefore?.contactSupportSeen)

    // Ensure the main User record exists (so we can activate + grant bonus tokens)
    await prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
        status: 'INACTIVE',
      },
      update: {
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
      },
    })

    const now = new Date()
    await prisma.supportChat.upsert({
      where: { telegramId },
      create: {
        telegramId,
        chatId,
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
        status: 'NEW',
        startedAt: now,
        lastMessageAt: now,
        lastInboundAt: now,
        lastMessageText: '/start',
      },
      update: {
        chatId,
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
        lastMessageAt: now,
        lastInboundAt: now,
        lastMessageText: '/start',
      },
    } as any)

    // Claim activation bonus (best-effort). This also activates INACTIVE users.
    let bonusGranted = false
    try {
      await claimContactSupportBonus(telegramId)
      bonusGranted = !hadBonusBefore
    } catch (err) {
      // Don't block support chat if bonus is unavailable/expired/already claimed.
      console.warn('Support bot /start: bonus claim skipped:', (err as any)?.message || err)
    }

    await ctx.reply(
      bonusGranted
        ? '✅ Support bot activated!\n\nYour account has been activated and you received 25 Syntrix tokens.\n\nNow you can write your message here and our team will reply.'
        : '✅ Support bot activated!\n\nNow you can write your message here and our team will reply.'
    )
  })

  supportBot.on('message:text', async (ctx) => {
    const from = ctx.from
    const chatId = String(ctx.chat?.id)
    const text = ctx.message?.text
    if (!from?.id || !chatId || !text) return
    if (text === '/start') return

    const telegramMessageId = (ctx.message as any)?.message_id

    const telegramId = String(from.id)

    const existing = (await prisma.supportChat.findUnique({ where: { telegramId } })) as any
    if (existing?.isBlocked) return
    const now = new Date()

    const createData: any = {
      telegramId,
      chatId,
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
      status: 'NEW',
      startedAt: now,
      lastMessageAt: now,
      lastInboundAt: now,
      lastMessageText: text.slice(0, 500),
      unreadCount: 1,
    }

    const updateData: any = {
      chatId,
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
      status: existing?.status === 'ARCHIVE' ? 'NEW' : (existing?.status || 'NEW'),
      acceptedBy: existing?.status === 'ARCHIVE' ? null : undefined,
      acceptedAt: existing?.status === 'ARCHIVE' ? null : undefined,
      archivedAt: existing?.status === 'ARCHIVE' ? null : undefined,
      lastMessageAt: now,
      lastInboundAt: now,
      lastMessageText: text.slice(0, 500),
      unreadCount: { increment: 1 },
    }

    const chat = await prisma.supportChat.upsert({
      where: { telegramId },
      create: createData,
      update: updateData,
    } as any)

    await prisma.supportMessage.create({
      data: {
        supportChatId: chat.id,
        direction: 'IN',
        kind: 'TEXT',
        text,
        telegramMessageId: Number.isFinite(Number(telegramMessageId)) ? Number(telegramMessageId) : null,
        createdAt: now,
      } as any,
    })
  })

  supportBot.on('message:photo', async (ctx) => {
    const from = ctx.from
    const chatId = String(ctx.chat?.id)
    const photos = (ctx.message as any)?.photo as Array<{ file_id: string; file_unique_id: string }> | undefined
    if (!from?.id || !chatId || !photos?.length) return

    const telegramId = String(from.id)
    const largest = photos[photos.length - 1]
    const caption = (ctx.message as any)?.caption as string | undefined
    const telegramMessageId = (ctx.message as any)?.message_id

    const existing = (await prisma.supportChat.findUnique({ where: { telegramId } })) as any
    if (existing?.isBlocked) return
    const now = new Date()

    const createData: any = {
      telegramId,
      chatId,
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
      status: 'NEW',
      startedAt: now,
      lastMessageAt: now,
      lastInboundAt: now,
      lastMessageText: caption ? caption.slice(0, 500) : '[Photo]',
      unreadCount: 1,
    }

    const updateData: any = {
      chatId,
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
      status: existing?.status === 'ARCHIVE' ? 'NEW' : (existing?.status || 'NEW'),
      acceptedBy: existing?.status === 'ARCHIVE' ? null : undefined,
      acceptedAt: existing?.status === 'ARCHIVE' ? null : undefined,
      archivedAt: existing?.status === 'ARCHIVE' ? null : undefined,
      lastMessageAt: now,
      lastInboundAt: now,
      lastMessageText: caption ? caption.slice(0, 500) : '[Photo]',
      unreadCount: { increment: 1 },
    }

    const chat = await prisma.supportChat.upsert({
      where: { telegramId },
      create: createData,
      update: updateData,
    } as any)

    await prisma.supportMessage.create({
      data: {
        supportChatId: chat.id,
        direction: 'IN',
        kind: 'PHOTO',
        text: caption || null,
        telegramMessageId: Number.isFinite(Number(telegramMessageId)) ? Number(telegramMessageId) : null,
        fileId: largest.file_id,
        fileUniqueId: largest.file_unique_id,
        createdAt: now,
      } as any,
    })
  })

  supportBot.catch((err) => {
    console.error('Support bot error:', err.error)
  })
}
