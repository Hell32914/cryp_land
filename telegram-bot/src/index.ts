import { Bot, Context, InlineKeyboard, InputFile } from 'grammy'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { startApiServer, stopApiServer } from './api.js'
import { scheduleTradingCards, postTradingCard, rescheduleCards } from './tradingCardScheduler.js'
import { generateTradingCard, formatCardCaption, getLastTradingPostData } from './cardGenerator.js'
import { getCardSettings, updateCardSettings } from './cardSettings.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'KYC_REQUIRED' | 'BLOCKED'
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'

dotenv.config()

const prisma = new PrismaClient()
export const bot = new Bot(process.env.BOT_TOKEN!)
export const ADMIN_ID = process.env.ADMIN_ID!
export const ADMIN_ID_2 = process.env.ADMIN_ID_2!
const WEBAPP_URL = process.env.WEBAPP_URL!
const LANDING_URL = 'https://authentic-commitment-production.up.railway.app/'
const CHANNEL_ID = process.env.CHANNEL_ID || process.env.BOT_TOKEN!.split(':')[0]

// Admin state management
const adminState = new Map<string, { awaitingInput?: string, targetUserId?: number }>()

// Check if user is admin (super admin or database admin)
async function isAdmin(userId: string): Promise<boolean> {
  if (userId === ADMIN_ID || userId === ADMIN_ID_2) return true
  
  const user = await prisma.user.findUnique({
    where: { telegramId: userId }
  })
  
  return user?.isAdmin || false
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

// Create referral chain for user who reached $1000 deposit
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
        `🎉 *Referral Activated!*\n\n👤 @${user.username || 'User'} reached $1000 deposit!\n💰 You now earn 4% of their daily profits.`,
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
            `🎉 *Level 2 Referral Activated!*\n\n👤 @${user.username || 'User'} (referred by @${referrer.username || 'User'}) reached $1000!\n💰 You now earn 3% of their daily profits.`,
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
                `🎉 *Level 3 Referral Activated!*\n\n👤 @${user.username || 'User'} reached $1000!\n💰 You now earn 2% of their daily profits.`,
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

// Update user plan based on balance
async function updateUserPlan(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const planInfo = calculateTariffPlan(user.balance)
  
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

  let user = await prisma.user.findUnique({
    where: { telegramId }
  })

  if (!user) {
    // Parse referral code from start parameter
    const startPayload = ctx.match as string
    let referrerId: string | null = null
    
    if (startPayload && startPayload.startsWith('ref5')) {
      referrerId = startPayload.slice(4) // Remove 'ref5' prefix
    }

    user = await prisma.user.create({
      data: {
        telegramId,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
        languageCode: ctx.from?.language_code,
        referredBy: referrerId
      }
    })

    // Notify admin about new user
    await bot.api.sendMessage(
      ADMIN_ID,
      `🆕 New user registered:\n@${ctx.from?.username || 'no_username'}\nID: ${telegramId}${referrerId ? `\n👥 Referred by: ${referrerId}` : ''}`
    )

    // Referral will be activated when user reaches $1000 deposit
  }

  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open Syntrix', WEBAPP_URL).row()
    .url('🌐 Visit Website', LANDING_URL)
    .url('💬 Support', 'https://t.me/SyntrixSupport')

  const welcomeMessage = 
    `*Welcome to SyntrixBot\\!*\n` +
    `*Profits are no longer random\\!*\n\n` +
    `⮕ Start your crypto trading journey with our automated bot\n` +
    `⮕ Earn up to 17% daily from your investments\n` +
    `⮕ Track your performance in real\\-time\n\n` +
    `🌐 Learn more: https://authentic\\-commitment\\-production\\.up\\.railway\\.app/\n\n` +
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

// Removed /balance command - all info now in mini app

// ============= ADMIN COMMANDS =============

bot.command('admin', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.reply('⛔️ Access denied')
    return
  }

  const usersCount = await prisma.user.count()
  const depositsCount = await prisma.deposit.count()
  const withdrawalsCount = await prisma.withdrawal.count()
  const pendingWithdrawalsCount = await prisma.withdrawal.count({ where: { status: 'PENDING' } })

  const keyboard = new InlineKeyboard()
    .text(`📊 Users (${usersCount})`, 'admin_users').row()
    .text(`📥 Deposits (${depositsCount})`, 'admin_deposits')
    .text(`📤 Withdrawals (${withdrawalsCount})`, 'admin_withdrawals').row()
    .text(`⏳ Pending (${pendingWithdrawalsCount})`, 'admin_pending_withdrawals')
    .text('💰 Manage Balance', 'admin_manage_balance').row()
    .text('📸 Generate Card', 'admin_generate_card')
    .text('⚙️ Card Settings', 'admin_card_settings').row()
    .text('👥 Manage Admins', 'admin_manage_admins').row()
    .text('🔄 Refresh', 'admin_menu')

  await ctx.reply(
    '🔐 *Admin Panel*\n\n' +
    `Total Users: ${usersCount}\n` +
    `Total Deposits: ${depositsCount}\n` +
    `Total Withdrawals: ${withdrawalsCount}\n` +
    `⏳ Pending Withdrawals: ${pendingWithdrawalsCount}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
})

// Manage Admins
bot.callbackQuery('admin_manage_admins', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || (userId !== ADMIN_ID && userId !== ADMIN_ID_2)) {
    await ctx.answerCallbackQuery('Only super admin can manage admins')
    return
  }

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { telegramId: true, username: true, firstName: true }
  })

  let message = '👥 *Admin Management*\n\n'
  message += '*Current Admins:*\n'
  if (admins.length === 0) {
    message += 'No additional admins\n'
  } else {
    admins.forEach((admin, i) => {
      message += `${i + 1}\\. @${admin.username || admin.firstName || admin.telegramId}\n`
    })
  }
  message += '\nℹ️ Use buttons below to manage'

  const keyboard = new InlineKeyboard()
    .text('➕ Add Admin', 'admin_add_admin').row()

  if (admins.length > 0) {
    keyboard.text('➖ Remove Admin', 'admin_remove_admin').row()
  }

  keyboard.text('🔙 Back', 'admin_menu')

  await ctx.editMessageText(message, {
    reply_markup: keyboard,
    parse_mode: 'MarkdownV2'
  })
  await ctx.answerCallbackQuery()
})

// Add Admin
bot.callbackQuery('admin_add_admin', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || (userId !== ADMIN_ID && userId !== ADMIN_ID_2)) {
    await ctx.answerCallbackQuery('Only super admin can add admins')
    return
  }

  adminState.set(userId, { awaitingInput: 'add_admin' })

  await ctx.editMessageText(
    '🆔 *Add New Admin*\n\n' +
    'Send me the Telegram ID of the user you want to make admin\\.\n' +
    'You can find their ID by forwarding their message to @userinfobot\n\n' +
    '⚠️ Send /cancel to abort',
    { parse_mode: 'MarkdownV2' }
  )
  await ctx.answerCallbackQuery()
})

bot.callbackQuery('admin_menu', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const usersCount = await prisma.user.count()
  const depositsCount = await prisma.deposit.count()
  const withdrawalsCount = await prisma.withdrawal.count()
  const pendingWithdrawalsCount = await prisma.withdrawal.count({ where: { status: 'PENDING' } })

  const keyboard = new InlineKeyboard()
    .text(`📊 Users (${usersCount})`, 'admin_users').row()
    .text(`📥 Deposits (${depositsCount})`, 'admin_deposits')
    .text(`📤 Withdrawals (${withdrawalsCount})`, 'admin_withdrawals').row()
    .text(`⏳ Pending (${pendingWithdrawalsCount})`, 'admin_pending_withdrawals')
    .text('💰 Manage Balance', 'admin_manage_balance').row()
    .text('📸 Generate Card', 'admin_generate_card')
    .text('⚙️ Card Settings', 'admin_card_settings').row()
    .text('👥 Manage Admins', 'admin_manage_admins').row()
    .text('🔄 Refresh', 'admin_menu')

  await ctx.editMessageText(
    '🔐 *Admin Panel*\n\n' +
    `Total Users: ${usersCount}\n` +
    `Total Deposits: ${depositsCount}\n` +
    `Total Withdrawals: ${withdrawalsCount}\n` +
    `⏳ Pending Withdrawals: ${pendingWithdrawalsCount}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await ctx.answerCallbackQuery('Refreshed')
})

bot.callbackQuery('admin_users', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  if (users.length === 0) {
    await ctx.editMessageText('👥 No users yet')
    await ctx.answerCallbackQuery()
    return
  }

  let message = '👥 Users List (10 latest):\n\n'
  
  users.forEach((user, index) => {
    message += `${index + 1}. @${user.username || 'no_username'}\n`
    message += `   ID: ${user.telegramId}\n`
    message += `   💰 $${user.balance.toFixed(2)} | ${user.status}\n\n`
  })

  const keyboard = new InlineKeyboard()
  users.forEach((user, index) => {
    if (index % 2 === 0) {
      keyboard.text(`${index + 1}`, `manage_${user.id}`)
    } else {
      keyboard.text(`${index + 1}`, `manage_${user.id}`).row()
    }
  })
  if (users.length % 2 === 1) keyboard.row()
  keyboard.text('◀️ Back to Admin', 'admin_menu')

  await ctx.editMessageText(message, { reply_markup: keyboard })
  await ctx.answerCallbackQuery()
})

bot.callbackQuery(/^manage_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: {
      deposits: { take: 3, orderBy: { createdAt: 'desc' } },
      withdrawals: { take: 3, orderBy: { createdAt: 'desc' } }
    }
  })

  if (!user) {
    await ctx.answerCallbackQuery('User not found')
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
    .text('💰 Add Balance', `add_balance_${userId}`).row()
    .text('◀️ Back to Users', 'admin_users')

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

  await ctx.editMessageText(
    `👤 *User Details*\n\n` +
    `Username: @${user.username?.replace(/_/g, '\\_') || 'no\\_username'}\n` +
    `ID: \`${user.telegramId}\`\n` +
    `${getCountryFlag(user.languageCode)} Language: ${user.languageCode?.toUpperCase() || 'Unknown'}\n` +
    `${user.country ? `🌍 Country: ${user.country}` : ''}\n` +
    `${user.ipAddress ? `📡 IP: \`${user.ipAddress}\`` : ''}\n` +
    `Status: ${statusEmoji} ${user.status.replace(/_/g, '\\_')}\n\n` +
    `💰 Balance: $${user.balance.toFixed(2)}\n` +
    `📥 Total Deposited: $${user.totalDeposit.toFixed(2)}\n` +
    `📤 Total Withdrawn: $${user.totalWithdraw.toFixed(2)}\n\n` +
    `📅 Joined: ${user.createdAt.toLocaleDateString()}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await ctx.answerCallbackQuery()
})

bot.callbackQuery(/^status_(\d+)_(\w+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

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

  await bot.api.sendMessage(user.telegramId, statusMessage)
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'STATUS_CHANGE',
      message: statusMessage
    }
  })

  await ctx.answerCallbackQuery(`✓ Status changed to ${newStatus}`)
  
  // Return to user management with updated info
  const keyboard = new InlineKeyboard()
    .text('✅ Activate', `status_${userId}_ACTIVE`)
    .text('⏸ Deactivate', `status_${userId}_INACTIVE`).row()
    .text('📋 KYC Required', `status_${userId}_KYC_REQUIRED`)
    .text('🚫 Block', `status_${userId}_BLOCKED`).row()
    .text('💰 Add Balance', `add_balance_${userId}`).row()
    .text('◀️ Back to Users', 'admin_users')

  await ctx.editMessageText(
    `👤 *User Details*\n\n` +
    `Username: @${user.username?.replace(/_/g, '\\_') || 'no\\_username'}\n` +
    `ID: \`${user.telegramId}\`\n` +
    `Status: ${statusEmoji} ${user.status.replace(/_/g, '\\_')}\n\n` +
    `💰 Balance: $${user.balance.toFixed(2)}\n` +
    `📥 Total Deposited: $${user.totalDeposit.toFixed(2)}\n` +
    `📤 Total Withdrawn: $${user.totalWithdraw.toFixed(2)}\n\n` +
    `✅ Status updated successfully!`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
})

bot.callbackQuery(/^add_balance_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    await ctx.answerCallbackQuery('User not found')
    return
  }

  adminState.set(adminId, { awaitingInput: 'add_balance', targetUserId: userId })

  const keyboard = new InlineKeyboard()
    .text('Cancel', `manage_${userId}`)

  await ctx.editMessageText(
    `💰 *Add Balance*\n\n` +
    `User: @${user.username?.replace(/_/g, '\\_') || 'no\\_username'}\n` +
    `Current Balance: $${user.balance.toFixed(2)}\n\n` +
    `Please reply with the amount to add (e.g., 100):`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await ctx.answerCallbackQuery()
})

bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId) return
  
  const state = adminState.get(userId)
  if (!state?.awaitingInput) return

  // Handle add admin
  if (state.awaitingInput === 'add_admin') {
    if (userId !== ADMIN_ID && userId !== ADMIN_ID_2) {
      await ctx.reply('⛔️ Only super admin can add admins')
      return
    }

    const targetId = ctx.message?.text?.trim()
    if (!targetId) {
      await ctx.reply('❌ Invalid Telegram ID')
      return
    }

    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { telegramId: targetId }
      })

      if (!user) {
        await ctx.reply(`❌ User with ID ${targetId} not found in database`)
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
        data: { isAdmin: true }
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

  if (state.awaitingInput === 'add_balance') {
    const amount = parseFloat(ctx.message?.text || '')
    const userId = state.targetUserId

    if (isNaN(amount) || !userId || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    // Get current user to check status
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    const newBalance = (currentUser?.balance || 0) + amount
    const newTotalDeposit = (currentUser?.totalDeposit || 0) + amount
    const shouldActivate = currentUser?.status === 'INACTIVE' && newBalance >= 10
    const shouldCreateReferral = currentUser && currentUser.totalDeposit < 1000 && newTotalDeposit >= 1000

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
        totalDeposit: { increment: amount },
        // Activate profile if balance >= $10 and currently inactive
        ...(shouldActivate && { status: 'ACTIVE' })
      }
    })

    // Create referral chain if user reached $1000 total deposit
    if (shouldCreateReferral) {
      await createReferralChain(user)
    }

    // Create deposit record
    await prisma.deposit.create({
      data: {
        userId: user.id,
        amount,
        status: 'COMPLETED',
        currency: 'USDT'
      }
    })

    // Update tariff plan based on new balance
    await updateUserPlan(user.id)
    const planInfo = calculateTariffPlan(user.balance)
    const progressBar = '█'.repeat(Math.floor(planInfo.progress / 10)) + '░'.repeat(10 - Math.floor(planInfo.progress / 10))

    // Notify user
    let userMessage = `💰 *Balance Added!*\n\n+$${amount.toFixed(2)}\nNew balance: $${user.balance.toFixed(2)}\n\n`
    
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
      `✅ *Balance Added Successfully*\n\n` +
      `User: @${user.username?.replace(/_/g, '\\_') || 'no\\_username'}\n` +
      `Amount: +$${amount.toFixed(2)}\n` +
      `New Balance: $${user.balance.toFixed(2)}`,
      { parse_mode: 'Markdown' }
    )

    const adminId = ctx.from?.id.toString()!
    adminState.delete(adminId)
  }

  // Handle search user for balance management
  if (state.awaitingInput === 'search_user_balance') {
    const searchQuery = ctx.message?.text?.trim()
    if (!searchQuery) {
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
        `Username: @${user.username?.replace(/_/g, '\\_') || 'no\\_username'}\n` +
        `Telegram ID: \`${user.telegramId}\`\n` +
        `Name: ${user.firstName || 'N/A'}\n\n` +
        `💰 Current Balance: $${user.balance.toFixed(2)}\n` +
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

      const newBalance = user.balance + amount
      
      if (newBalance < 0) {
        await ctx.reply(`❌ Cannot set balance below zero. Current: $${user.balance.toFixed(2)}, Change: $${amount.toFixed(2)}`)
        return
      }

      // Update balance
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          balance: { increment: amount },
          ...(amount > 0 && { totalDeposit: { increment: amount } })
        }
      })

      // Create transaction record if positive
      if (amount > 0) {
        await prisma.deposit.create({
          data: {
            userId: targetUserId,
            amount,
            status: 'COMPLETED',
            currency: 'USDT'
          }
        })
      }

      // Notify user
      await bot.api.sendMessage(
        user.telegramId,
        `💰 *Balance ${amount > 0 ? 'Added' : 'Deducted'}*\n\n` +
        `${amount > 0 ? '+' : ''}$${amount.toFixed(2)}\n` +
        `New balance: $${newBalance.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      await ctx.reply(
        `✅ *Balance Updated*\n\n` +
        `User: @${user.username || 'no_username'}\n` +
        `Change: ${amount > 0 ? '+' : ''}$${amount.toFixed(2)}\n` +
        `New Balance: $${newBalance.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error updating balance:', error)
      await ctx.reply('❌ Error updating balance. Please try again.')
    }
    return
  }

  // Handle set balance amount
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

      const oldBalance = user.balance

      // Set new balance
      await prisma.user.update({
        where: { id: targetUserId },
        data: { balance: amount }
      })

      // Notify user
      await bot.api.sendMessage(
        user.telegramId,
        `💰 *Balance Updated*\n\n` +
        `Old balance: $${oldBalance.toFixed(2)}\n` +
        `New balance: $${amount.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      await ctx.reply(
        `✅ *Balance Set*\n\n` +
        `User: @${user.username || 'no_username'}\n` +
        `Old Balance: $${oldBalance.toFixed(2)}\n` +
        `New Balance: $${amount.toFixed(2)}`,
        { parse_mode: 'Markdown' }
      )

      adminState.delete(userId)
    } catch (error) {
      console.error('Error setting balance:', error)
      await ctx.reply('❌ Error setting balance. Please try again.')
    }
    return
  }
})

bot.callbackQuery('admin_deposits', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const deposits = await prisma.deposit.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  if (deposits.length === 0) {
    const keyboard = new InlineKeyboard()
      .text('◀️ Back to Admin', 'admin_menu')
    await ctx.editMessageText('📥 No deposits yet', { reply_markup: keyboard })
    await ctx.answerCallbackQuery()
    return
  }

  let message = '📥 *Recent Deposits* (10 latest):\n\n'
  
  deposits.forEach((deposit, index) => {
    const statusEmoji = deposit.status === 'COMPLETED' ? '✅' : deposit.status === 'PENDING' ? '⏳' : '❌'
    message += `${index + 1}. @${deposit.user.username || 'no_username'}\n`
    message += `   💵 $${deposit.amount.toFixed(2)} | ${statusEmoji} ${deposit.status}\n`
    message += `   📅 ${deposit.createdAt.toLocaleDateString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
    .text('◀️ Back to Admin', 'admin_menu')

  await ctx.editMessageText(message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await ctx.answerCallbackQuery()
})

bot.callbackQuery('admin_withdrawals', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const withdrawals = await prisma.withdrawal.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  if (withdrawals.length === 0) {
    const keyboard = new InlineKeyboard()
      .text('◀️ Back to Admin', 'admin_menu')
    await ctx.editMessageText('📤 No withdrawals yet', { reply_markup: keyboard })
    await ctx.answerCallbackQuery()
    return
  }

  let message = '📤 *Recent Withdrawals* (10 latest):\n\n'
  
  withdrawals.forEach((withdrawal, index) => {
    const statusEmoji = 
      withdrawal.status === 'COMPLETED' ? '✅' : 
      withdrawal.status === 'PENDING' ? '⏳' : 
      withdrawal.status === 'PROCESSING' ? '🔄' : 
      '❌'
    message += `${index + 1}. @${withdrawal.user.username || 'no_username'}\n`
    message += `   💵 $${withdrawal.amount.toFixed(2)} | ${statusEmoji} ${withdrawal.status}\n`
    message += `   📅 ${withdrawal.createdAt.toLocaleDateString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
    .text('◀️ Back to Admin', 'admin_menu')

  await ctx.editMessageText(message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await ctx.answerCallbackQuery()
})

// Pending withdrawals
bot.callbackQuery('admin_pending_withdrawals', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const pendingWithdrawals = await prisma.withdrawal.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  if (pendingWithdrawals.length === 0) {
    const keyboard = new InlineKeyboard()
      .text('◀️ Back to Admin', 'admin_menu')
    await ctx.editMessageText('⏳ No pending withdrawals', { reply_markup: keyboard })
    await ctx.answerCallbackQuery()
    return
  }

  let message = '⏳ *Pending Withdrawals* (Requires Approval):\n\n'
  
  pendingWithdrawals.forEach((withdrawal, index) => {
    message += `${index + 1}. @${withdrawal.user.username || 'no_username'}\n`
    message += `   💵 $${withdrawal.amount.toFixed(2)} | 💎 ${withdrawal.currency}\n`
    message += `   🌐 ${withdrawal.network || 'TRC20'}\n`
    message += `   📍 \`${withdrawal.address.substring(0, 20)}...\`\n`
    message += `   🆔 ID: ${withdrawal.id}\n`
    message += `   📅 ${withdrawal.createdAt.toLocaleString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
  
  // Add approve/reject buttons for each withdrawal (max 5 to avoid message overflow)
  const displayCount = Math.min(pendingWithdrawals.length, 5)
  for (let i = 0; i < displayCount; i++) {
    const w = pendingWithdrawals[i]
    keyboard
      .text(`✅ #${i + 1}`, `approve_withdrawal_${w.id}`)
      .text(`❌ #${i + 1}`, `reject_withdrawal_${w.id}`)
      .row()
  }
  
  keyboard.text('◀️ Back to Admin', 'admin_menu')

  await ctx.editMessageText(message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await ctx.answerCallbackQuery()
})

// Manage balance - search user
bot.callbackQuery('admin_manage_balance', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  adminState.set(userId, { awaitingInput: 'search_user_balance' })

  const keyboard = new InlineKeyboard()
    .text('◀️ Cancel', 'admin_menu')

  await ctx.editMessageText(
    '💰 *Manage User Balance*\n\n' +
    'Send me the username or Telegram ID of the user:\n\n' +
    'Examples:\n' +
    '• `username` (without @)\n' +
    '• `123456789` (Telegram ID)\n\n' +
    '⚠️ Send /cancel to abort',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await ctx.answerCallbackQuery()
})

// Balance management callbacks
bot.callbackQuery(/^balance_add_(\d+)$/, async (ctx) => {
  const adminId = ctx.from?.id.toString()
  if (!adminId || !(await isAdmin(adminId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  adminState.set(adminId, { awaitingInput: 'balance_add_amount', targetUserId: userId })

  await ctx.answerCallbackQuery()
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
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  adminState.set(adminId, { awaitingInput: 'balance_set_amount', targetUserId: userId })

  await ctx.answerCallbackQuery()
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
    await ctx.answerCallbackQuery('Access denied')
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
      await ctx.answerCallbackQuery('❌ User not found')
      return
    }

    let message = `📜 *Transaction History*\n\n`
    message += `👤 @${user.username || 'no_username'}\n`
    message += `💰 Balance: $${user.balance.toFixed(2)}\n\n`

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

    await ctx.editMessageText(message, { reply_markup: keyboard, parse_mode: 'Markdown' })
    await ctx.answerCallbackQuery()
  } catch (error) {
    console.error('Error fetching history:', error)
    await ctx.answerCallbackQuery('❌ Error loading history')
  }
})

// Generate trading card (admin test)
bot.callbackQuery('admin_generate_card', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  await ctx.answerCallbackQuery('Generating card...')
  
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
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const settings = await getCardSettings()

  const keyboard = new InlineKeyboard()
    .text(`📊 Posts: ${settings.minPerDay}-${settings.maxPerDay}/day`, 'card_set_count').row()
    .text(`🕐 Time: ${settings.startTime}-${settings.endTime}`, 'card_set_time').row()
    .text('🔄 Reschedule Now', 'card_reschedule').row()
    .text('◀️ Back to Admin', 'admin_menu')

  await ctx.editMessageText(
    '⚙️ *Trading Card Settings*\n\n' +
    `📊 Posts per day: ${settings.minPerDay}-${settings.maxPerDay}\n` +
    `🕐 Time range: ${settings.startTime}-${settings.endTime} (Kyiv)\n\n` +
    'Tap to modify settings',
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await ctx.answerCallbackQuery()
})

// Set card count
bot.callbackQuery('card_set_count', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  await ctx.answerCallbackQuery('Send new values')
  await ctx.reply(
    'Send new card count range in format:\n`min-max`\n\nExample: `4-16`',
    { parse_mode: 'Markdown' }
  )
  
  adminState.set(userId, { awaitingInput: 'card_count' })
})

// Set time range
bot.callbackQuery('card_set_time', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  await ctx.answerCallbackQuery('Send new time range')
  await ctx.reply(
    'Send new time range in format:\n`HH:MM-HH:MM`\n\nExample: `07:49-22:30` (Kyiv time)',
    { parse_mode: 'Markdown' }
  )
  
  adminState.set(userId, { awaitingInput: 'card_time' })
})

// Reschedule cards immediately
bot.callbackQuery('card_reschedule', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  await ctx.answerCallbackQuery('Rescheduling...')
  
  try {
    await rescheduleCards(bot, CHANNEL_ID)
    await ctx.editMessageText(
      '✅ Cards rescheduled successfully!\n\nCheck console for new schedule.',
      { reply_markup: new InlineKeyboard().text('◀️ Back to Settings', 'admin_card_settings') }
    )
  } catch (error) {
    console.error('Failed to reschedule:', error)
    await ctx.reply('❌ Failed to reschedule cards. Check console.')
  }
})

// Handle text input for card settings (add to existing message handler or create new one)
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) return
  
  const state = adminState.get(userId)
  if (!state?.awaitingInput) return

  const input = ctx.message.text

  try {
    if (state.awaitingInput === 'card_count') {
      const match = input.match(/^(\d+)-(\d+)$/)
      if (!match) {
        await ctx.reply('❌ Invalid format. Use: min-max (e.g., 4-16)')
        return
      }

      const min = parseInt(match[1])
      const max = parseInt(match[2])

      if (min < 1 || max > 50 || min >= max) {
        await ctx.reply('❌ Invalid range. Min should be 1-50 and less than max.')
        return
      }

      await updateCardSettings({ minPerDay: min, maxPerDay: max })
      await ctx.reply(`✅ Updated! Cards per day: ${min}-${max}`)
      
      adminState.delete(userId)
    } else if (state.awaitingInput === 'card_time') {
      const match = input.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/)
      if (!match) {
        await ctx.reply('❌ Invalid format. Use: HH:MM-HH:MM (e.g., 07:49-22:30)')
        return
      }

      const startTime = `${match[1]}:${match[2]}`
      const endTime = `${match[3]}:${match[4]}`

      await updateCardSettings({ startTime, endTime })
      await ctx.reply(`✅ Updated! Time range: ${startTime}-${endTime} (Kyiv)`)
      
      adminState.delete(userId)
    }
  } catch (error) {
    console.error('Failed to update settings:', error)
    await ctx.reply('❌ Failed to update settings. Check console.')
  }
})

// Approve withdrawal
bot.callbackQuery(/^approve_withdrawal_(\d+)$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const withdrawalId = parseInt(ctx.match![1])
  
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) {
      await ctx.answerCallbackQuery('❌ Withdrawal not found')
      return
    }

    if (withdrawal.status === 'COMPLETED') {
      await ctx.answerCallbackQuery('✅ Already completed')
      return
    }

    if (withdrawal.status === 'FAILED') {
      await ctx.answerCallbackQuery('❌ Already rejected/failed')
      return
    }

    // If already PROCESSING, just mark as COMPLETED
    if (withdrawal.status === 'PROCESSING') {
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'COMPLETED' }
      })

      // Notify user
      await bot.api.sendMessage(
        withdrawal.user.telegramId,
        `✅ *Withdrawal Completed*\n\n` +
        `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
        `💎 Currency: ${withdrawal.currency}\n` +
        `🌐 Network: ${withdrawal.network}\n` +
        `📍 Address: \`${withdrawal.address}\`\n\n` +
        `✅ Transaction confirmed by admin.`,
        { parse_mode: 'Markdown' }
      )

      await ctx.editMessageText(
        ctx.callbackQuery.message!.text + '\n\n✅ *CONFIRMED AS COMPLETED*',
        { parse_mode: 'Markdown' }
      )
      await ctx.answerCallbackQuery('✅ Withdrawal marked as completed')
      return
    }

    // For PROCESSING status from withdrawals > $100: balance already deducted, just process via OxaPay
    if (withdrawal.status === 'PROCESSING' && !withdrawal.txHash) {
      console.log(`💸 Approving PROCESSING withdrawal ${withdrawal.id} for user ${withdrawal.user.telegramId}`)
      console.log(`ℹ️ Balance already deducted (reserved). Current balance: $${withdrawal.user.balance.toFixed(2)}`)
      
      // Try to process via OxaPay
      try {
        const { createPayout } = await import('./oxapay.js')
        
        const payout = await createPayout({
          address: withdrawal.address,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          network: withdrawal.network || 'TRC20'
        })

        // Update withdrawal with track ID, keep status as PROCESSING
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            txHash: payout.trackId
          }
        })

        console.log(`✅ OxaPay payout created: Track ID ${payout.trackId}`)

        // Notify user
        await bot.api.sendMessage(
          withdrawal.user.telegramId,
          `✅ *Withdrawal Approved*\n\n` +
          `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
          `💎 Currency: ${withdrawal.currency}\n` +
          `🌐 Network: ${withdrawal.network}\n` +
          `📍 Address: \`${withdrawal.address}\`\n\n` +
          `⏳ Processing... Track ID: ${payout.trackId}\n` +
          `💳 Current balance: $${withdrawal.user.balance.toFixed(2)}`,
          { parse_mode: 'Markdown' }
        )

        await ctx.editMessageText(
          ctx.callbackQuery.message!.text + '\n\n✅ *APPROVED & SENT TO OXAPAY*\n' +
          `🔗 Track ID: ${payout.trackId}`,
          { parse_mode: 'Markdown' }
        )
        await ctx.answerCallbackQuery('✅ Withdrawal approved and sent to OxaPay')

      } catch (error: any) {
        // If OxaPay fails, keep status as PROCESSING but mark for manual processing
        console.error('OxaPay payout error:', error.response?.data || error.message)
        console.log('⚠️ OxaPay failed - balance already deducted, manual processing required')
        
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            txHash: 'MANUAL_PROCESSING_REQUIRED'
          }
        })

        // Notify user
        await bot.api.sendMessage(
          withdrawal.user.telegramId,
          `✅ *Withdrawal Approved*\n\n` +
          `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
          `💎 Currency: ${withdrawal.currency}\n` +
          `🌐 Network: ${withdrawal.network}\n` +
          `📍 Address: \`${withdrawal.address}\`\n\n` +
          `⏳ Your withdrawal is being processed manually by admin.\n` +
          `💳 Current balance: $${withdrawal.user.balance.toFixed(2)}`,
          { parse_mode: 'Markdown' }
        )
        
        await ctx.answerCallbackQuery('✅ Approved - Manual processing required')
        await ctx.editMessageText(
          ctx.callbackQuery.message!.text + '\n\n✅ *APPROVED (Manual Processing Required)*\n' +
          `⚠️ OxaPay Error: ${error.message}\n` +
          `💳 Balance already deducted: $${withdrawal.amount.toFixed(2)}\n` +
          `⚡ Status: PROCESSING\n\n` +
          `🔴 ACTION REQUIRED: Process payout manually on OxaPay dashboard`,
          { parse_mode: 'Markdown' }
        )
      }
    } else if (withdrawal.status === 'PENDING') {
      // This should not happen with new logic, but handle legacy pending withdrawals
      await ctx.answerCallbackQuery('⚠️ Legacy PENDING withdrawal detected. Please reject and ask user to resubmit.')
      return
    }
  } catch (error) {
    console.error('Error approving withdrawal:', error)
    await ctx.answerCallbackQuery('❌ Error processing withdrawal')
  }
})

// Reject withdrawal
bot.callbackQuery(/^reject_withdrawal_(\d+)$/, async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || !(await isAdmin(userId))) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const withdrawalId = parseInt(ctx.match![1])
  
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) {
      await ctx.answerCallbackQuery('❌ Withdrawal not found')
      return
    }

    if (withdrawal.status === 'COMPLETED') {
      await ctx.answerCallbackQuery('❌ Cannot reject completed withdrawal')
      return
    }

    if (withdrawal.status === 'FAILED') {
      await ctx.answerCallbackQuery('ℹ️ Already rejected')
      return
    }

    // Get current user balance
    const currentUser = await prisma.user.findUnique({ where: { id: withdrawal.userId } })
    if (!currentUser) {
      await ctx.answerCallbackQuery('❌ User not found')
      return
    }

    // Update withdrawal status to failed (rejected by admin)
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'FAILED' }
    })

    // For PROCESSING status: balance WAS deducted (reserved), so we need to refund it
    // For PENDING status (legacy): balance was NOT deducted yet, so no need to refund
    let refundMessage = ''
    if (withdrawal.status === 'PROCESSING') {
      // Refund the balance
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          balance: { increment: withdrawal.amount },
          totalWithdraw: { decrement: withdrawal.amount }
        }
      })
      const newBalance = currentUser.balance + withdrawal.amount
      refundMessage = `✅ Funds returned to your account\n💳 New balance: $${newBalance.toFixed(2)}`
      console.log(`💰 Refunded $${withdrawal.amount.toFixed(2)} to user ${withdrawal.user.telegramId}. New balance: $${newBalance.toFixed(2)}`)
    } else {
      refundMessage = `💳 Current balance: $${currentUser.balance.toFixed(2)} (unchanged)`
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

    await ctx.editMessageText(
      ctx.callbackQuery.message!.text + '\n\n❌ *REJECTED* (Balance restored)',
      { parse_mode: 'Markdown' }
    )
    await ctx.answerCallbackQuery('❌ Withdrawal rejected, balance restored')
  } catch (error) {
    console.error('Error rejecting withdrawal:', error)
    await ctx.answerCallbackQuery('❌ Error rejecting withdrawal')
  }
})

// Generate random profit updates throughout the day
function generateDailyUpdates(totalProfit: number): { amount: number, timestamp: Date }[] {
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
  
  // Generate random timestamps throughout the CURRENT day (00:00 to 23:59)
  // This ensures updates are spread evenly across 24 hours
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  
  // If we're past 22:00, generate for next day instead
  if (now.getHours() >= 22) {
    startOfDay.setDate(startOfDay.getDate() + 1)
    endOfDay.setDate(endOfDay.getDate() + 1)
  }
  
  for (let i = 0; i < numUpdates; i++) {
    // Generate timestamps spread throughout the day
    const randomTime = startOfDay.getTime() + Math.random() * (endOfDay.getTime() - startOfDay.getTime())
    const timestamp = new Date(randomTime)
    const amount = totalProfit * normalizedPercentages[i]
    
    updates.push({ amount, timestamp })
  }
  
  // Sort by timestamp
  updates.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  return updates
}

// Daily profit accrual function
async function accrueDailyProfit() {
  try {
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        balance: { gt: 0 }
      }
    })

    for (const user of users) {
      const planInfo = calculateTariffPlan(user.balance)
      const dailyProfit = (user.balance * planInfo.dailyPercent) / 100

      await prisma.user.update({
        where: { id: user.id },
        data: {
          profit: user.profit + dailyProfit,
          lastProfitUpdate: new Date()
        }
      })

      // Generate random daily updates
      const updates = generateDailyUpdates(dailyProfit)
      
      // Delete old daily updates for this user
      await prisma.dailyProfitUpdate.deleteMany({
        where: { userId: user.id }
      })
      
      // Create new daily updates (notifications will be sent by scheduler)
      for (const update of updates) {
        await prisma.dailyProfitUpdate.create({
          data: {
            userId: user.id,
            amount: update.amount,
            timestamp: update.timestamp,
            dailyTotal: dailyProfit
          }
        })
      }

      console.log(`💰 Accrued $${dailyProfit.toFixed(2)} profit to user ${user.telegramId} (${planInfo.currentPlan} - ${planInfo.dailyPercent}%) - ${updates.length} updates`)

      // Distribute referral earnings (3-level cascade: 4%, 3%, 2%)
      // Only if user is active referral (totalDeposit >= $1000)
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
      }
    })

    for (const update of pendingUpdates) {
      try {
        const planInfo = calculateTariffPlan(update.user.balance)
        
        await bot.api.sendMessage(
          update.user.telegramId,
          `💰 *Daily Profit Update*\n\n` +
          `✅ Profit accrued: $${update.amount.toFixed(2)}\n` +
          `📊 Plan: ${planInfo.currentPlan} (${planInfo.dailyPercent}%)\n` +
          `💎 Total daily: $${update.dailyTotal.toFixed(2)}`,
          { parse_mode: 'Markdown' }
        )
        
        console.log(`📤 Sent profit notification to user ${update.user.telegramId}: $${update.amount.toFixed(2)}`)
        
        // Mark as notified
        await prisma.dailyProfitUpdate.update({
          where: { id: update.id },
          data: { notified: true }
        })
      } catch (err) {
        console.error(`Failed to send notification to user ${update.user.telegramId}:`, err)
      }
    }
    
    if (pendingUpdates.length > 0) {
      console.log(`✅ Sent ${pendingUpdates.length} scheduled profit notifications`)
    }
  } catch (error) {
    console.error('❌ Error sending scheduled notifications:', error)
  }
}

// Function to check and update withdrawal statuses
async function checkPendingWithdrawals() {
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
            // Withdrawal completed successfully
            await prisma.withdrawal.update({
              where: { id: withdrawal.id },
              data: { status: 'COMPLETED' }
            })

            // Notify user
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

            console.log(`✅ Withdrawal ${withdrawal.id} marked as COMPLETED`)
          } else if (payoutStatus === 'expired' || payoutStatus === 'canceled' || payoutStatus === 'failed') {
            // Withdrawal failed - refund user
            await prisma.withdrawal.update({
              where: { id: withdrawal.id },
              data: { status: 'FAILED' }
            })

            // Refund balance
            await prisma.user.update({
              where: { id: withdrawal.userId },
              data: {
                balance: { increment: withdrawal.amount },
                totalWithdraw: { decrement: withdrawal.amount }
              }
            })

            // Notify user
            try {
              await bot.api.sendMessage(
                withdrawal.user.telegramId,
                `❌ *Withdrawal Failed*\n\n` +
                `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
                `💎 Currency: ${withdrawal.currency}\n\n` +
                `⚠️ The withdrawal could not be processed.\n` +
                `💳 Your balance has been refunded: $${(withdrawal.user.balance + withdrawal.amount).toFixed(2)}`,
                { parse_mode: 'Markdown' }
              )
            } catch (err) {
              console.error('Failed to notify user:', err)
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

// Run daily profit accrual every 24 hours
setInterval(accrueDailyProfit, 24 * 60 * 60 * 1000)

// Check for scheduled notifications every minute
setInterval(sendScheduledNotifications, 60 * 1000)

// Check pending withdrawals every 5 minutes
setInterval(checkPendingWithdrawals, 5 * 60 * 1000)

// Also run on startup (for testing)
setTimeout(() => {
  console.log('🔄 Running initial profit accrual...')
  accrueDailyProfit()
}, 5000)

// Start notification scheduler
setTimeout(() => {
  console.log('🔄 Starting notification scheduler...')
  sendScheduledNotifications()
}, 10000)

// Start withdrawal status checker
setTimeout(() => {
  console.log('🔄 Starting withdrawal status checker...')
  checkPendingWithdrawals()
}, 15000)

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

// Start bot and API server
async function startBot() {
  try {
    console.log('🤖 Syntrix Bot starting...')
    
    // Initialize database first
    await initDatabase()
    
    // Set webhook URL
    const webhookUrl = process.env.WEBHOOK_URL || 'https://syntrix-bot.onrender.com'
    const fullWebhookUrl = webhookUrl.startsWith('http') ? webhookUrl : `https://${webhookUrl}`
    console.log(`🔗 Setting webhook to: ${fullWebhookUrl}/webhook`)
    await bot.api.setWebhook(`${fullWebhookUrl}/webhook`)
    console.log('✅ Webhook set successfully')
    
    // Start API server (includes webhook handler)
    startApiServer(bot)
    
    console.log('✅ Bot started successfully')
    // Initialize trading card scheduler
    await scheduleTradingCards(bot, CHANNEL_ID)
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
  stopApiServer()
  await prisma.$disconnect()
  process.exit(0)
})
process.once('SIGTERM', async () => {
  console.log('🛑 Bot stopping (SIGTERM)...')
  await bot.stop()
  stopApiServer()
  await prisma.$disconnect()
  process.exit(0)
})
