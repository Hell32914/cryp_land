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
const WEBAPP_URL = process.env.WEBAPP_URL!
const CHANNEL_ID = process.env.CHANNEL_ID || process.env.BOT_TOKEN!.split(':')[0]

// Admin state management
const adminState = new Map<string, { awaitingInput?: string, targetUserId?: number }>()

// Check if user is admin (super admin or database admin)
async function isAdmin(userId: string): Promise<boolean> {
  if (userId === ADMIN_ID) return true
  
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
    .webApp('🚀 Open Syntrix', WEBAPP_URL)

  const welcomeMessage = 
    `*Welcome to SyntrixBot\\!*\n\n` +
    `*\\[ Profits are no longer random \\]*\n\n` +
    `⮕ Start your crypto trading journey with our automated bot\n` +
    `⮕ Earn up to 17% daily from your investments\n` +
    `⮕ Track your performance in real\\-time\n\n` +
    `Click the button below to open the trading platform: 👇🏽`

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

  const keyboard = new InlineKeyboard()
    .text(`📊 Users (${usersCount})`, 'admin_users').row()
    .text(`📥 Deposits (${depositsCount})`, 'admin_deposits')
    .text(`📤 Withdrawals (${withdrawalsCount})`, 'admin_withdrawals').row()
    .text('📸 Generate Card', 'admin_generate_card')
    .text('⚙️ Card Settings', 'admin_card_settings').row()
    .text('👥 Manage Admins', 'admin_manage_admins').row()
    .text('🔄 Refresh', 'admin_menu')

  await ctx.reply(
    '🔐 *Admin Panel*\n\n' +
    `Total Users: ${usersCount}\n` +
    `Total Deposits: ${depositsCount}\n` +
    `Total Withdrawals: ${withdrawalsCount}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
})

// Manage Admins
bot.callbackQuery('admin_manage_admins', async (ctx) => {
  const userId = ctx.from?.id.toString()
  if (!userId || userId !== ADMIN_ID) {
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
  if (!userId || userId !== ADMIN_ID) {
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

  const keyboard = new InlineKeyboard()
    .text(`📊 Users (${usersCount})`, 'admin_users').row()
    .text(`📥 Deposits (${depositsCount})`, 'admin_deposits')
    .text(`📤 Withdrawals (${withdrawalsCount})`, 'admin_withdrawals').row()
    .text('📸 Generate Card', 'admin_generate_card')
    .text('⚙️ Card Settings', 'admin_card_settings').row()
    .text('🔄 Refresh', 'admin_menu')

  await ctx.editMessageText(
    '🔐 *Admin Panel*\n\n' +
    `Total Users: ${usersCount}\n` +
    `Total Deposits: ${depositsCount}\n` +
    `Total Withdrawals: ${withdrawalsCount}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await ctx.answerCallbackQuery('Refreshed')
})

bot.callbackQuery('admin_users', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
  if (ctx.from?.id.toString() !== ADMIN_ID) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    await ctx.answerCallbackQuery('User not found')
    return
  }

  adminState.set(ADMIN_ID, { awaitingInput: 'add_balance', targetUserId: userId })

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
    if (userId !== ADMIN_ID) {
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

  // Only super admin can do other operations
  if (userId !== ADMIN_ID) return

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

    adminState.delete(ADMIN_ID)
  }
})

bot.callbackQuery('admin_deposits', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
    const statusEmoji = withdrawal.status === 'COMPLETED' ? '✅' : withdrawal.status === 'PENDING' ? '⏳' : '❌'
    message += `${index + 1}. @${withdrawal.user.username || 'no_username'}\n`
    message += `   💵 $${withdrawal.amount.toFixed(2)} | ${statusEmoji} ${withdrawal.status}\n`
    message += `   📅 ${withdrawal.createdAt.toLocaleDateString()}\n\n`
  })

  const keyboard = new InlineKeyboard()
    .text('◀️ Back to Admin', 'admin_menu')

  await ctx.editMessageText(message, { reply_markup: keyboard, parse_mode: 'Markdown' })
  await ctx.answerCallbackQuery()
})

// Generate trading card (admin test)
bot.callbackQuery('admin_generate_card', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
  if (ctx.from?.id.toString() !== ADMIN_ID) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  await ctx.answerCallbackQuery('Send new values')
  await ctx.reply(
    'Send new card count range in format:\n`min-max`\n\nExample: `4-16`',
    { parse_mode: 'Markdown' }
  )
  
  adminState.set(ADMIN_ID, { awaitingInput: 'card_count' })
})

// Set time range
bot.callbackQuery('card_set_time', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  await ctx.answerCallbackQuery('Send new time range')
  await ctx.reply(
    'Send new time range in format:\n`HH:MM-HH:MM`\n\nExample: `07:49-22:30` (Kyiv time)',
    { parse_mode: 'Markdown' }
  )
  
  adminState.set(ADMIN_ID, { awaitingInput: 'card_time' })
})

// Reschedule cards immediately
bot.callbackQuery('card_reschedule', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
  if (ctx.from?.id.toString() !== ADMIN_ID) return
  
  const state = adminState.get(ADMIN_ID)
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
      
      adminState.delete(ADMIN_ID)
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
      
      adminState.delete(ADMIN_ID)
    }
  } catch (error) {
    console.error('Failed to update settings:', error)
    await ctx.reply('❌ Failed to update settings. Check console.')
  }
})

// Approve withdrawal
bot.callbackQuery(/^approve_withdrawal_(\d+)$/, async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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

    if (withdrawal.status !== 'PENDING') {
      await ctx.answerCallbackQuery(`❌ Withdrawal already ${withdrawal.status}`)
      return
    }

    // Try to process via OxaPay
    try {
      const { createPayout } = await import('./oxapay.js')
      
      const payout = await createPayout({
        address: withdrawal.address,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        network: withdrawal.network || 'TRC20'
      })

      // Update withdrawal status
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PROCESSING',
          txHash: payout.trackId
        }
      })

      // Note: Balance already deducted when withdrawal was created (amount > $100)

      // Notify user
      await bot.api.sendMessage(
        withdrawal.user.telegramId,
        `✅ *Withdrawal Approved*\n\n` +
        `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
        `💎 Currency: ${withdrawal.currency}\n` +
        `🌐 Network: ${withdrawal.network}\n` +
        `📍 Address: \`${withdrawal.address}\`\n\n` +
        `⏳ Processing... Track ID: ${payout.trackId}`,
        { parse_mode: 'Markdown' }
      )

      await ctx.editMessageText(
        ctx.callbackQuery.message!.text + '\n\n✅ *APPROVED & PROCESSED*\n' +
        `🔗 Track ID: ${payout.trackId}`,
        { parse_mode: 'Markdown' }
      )
      await ctx.answerCallbackQuery('✅ Withdrawal approved and processing')

    } catch (error: any) {
      // If OxaPay fails, mark as COMPLETED (admin approved manually)
      console.error('OxaPay payout error:', error.response?.data || error.message)
      
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'COMPLETED',
          txHash: 'MANUAL_PROCESSING'
        }
      })

      // Note: Balance already deducted when withdrawal was created (amount > $100)

      // Notify user
      await bot.api.sendMessage(
        withdrawal.user.telegramId,
        `✅ *Withdrawal Approved*\n\n` +
        `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
        `💎 Currency: ${withdrawal.currency}\n` +
        `🌐 Network: ${withdrawal.network}\n` +
        `📍 Address: \`${withdrawal.address}\`\n\n` +
        `⏳ Your withdrawal is being processed manually by admin.`,
        { parse_mode: 'Markdown' }
      )
      
      await ctx.answerCallbackQuery('✅ Approved for manual processing')
      await ctx.editMessageText(
        ctx.callbackQuery.message!.text + '\n\n✅ *APPROVED (Manual Processing)*\n' +
        `OxaPay Error: ${error.message}\n` +
        `Status: Marked as COMPLETED.\n` +
        `Please process the payout manually.`,
        { parse_mode: 'Markdown' }
      )
    }
  } catch (error) {
    console.error('Error approving withdrawal:', error)
    await ctx.answerCallbackQuery('❌ Error processing withdrawal')
  }
})

// Reject withdrawal
bot.callbackQuery(/^reject_withdrawal_(\d+)$/, async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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

    if (withdrawal.status !== 'PENDING') {
      await ctx.answerCallbackQuery(`❌ Withdrawal already ${withdrawal.status}`)
      return
    }

    // Update withdrawal status to failed (rejected by admin)
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'FAILED' }
    })

    // Return the amount back to user balance
    await prisma.user.update({
      where: { id: withdrawal.userId },
      data: {
        balance: { increment: withdrawal.amount },
        totalWithdraw: { decrement: withdrawal.amount }
      }
    })

    // Notify user
    await bot.api.sendMessage(
      withdrawal.user.telegramId,
      `❌ *Withdrawal Rejected*\n\n` +
      `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
      `💎 Currency: ${withdrawal.currency}\n\n` +
      `💳 Your balance has been restored. Please contact support for more information.`,
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
  
  // Generate random timestamps from NOW until end of day (not from start of day)
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  
  // If there's not enough time left today (less than 1 hour), extend to next day
  const timeUntilEndOfDay = endOfDay.getTime() - now.getTime()
  const minimumTimeWindow = 60 * 60 * 1000 // 1 hour in milliseconds
  
  let endTime: Date
  if (timeUntilEndOfDay < minimumTimeWindow) {
    // Extend to next day at 23:59
    endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59)
  } else {
    endTime = endOfDay
  }
  
  for (let i = 0; i < numUpdates; i++) {
    // Generate timestamps from current time onwards
    const randomTime = now.getTime() + Math.random() * (endTime.getTime() - now.getTime())
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
      
      // Create new daily updates
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
      if (user.referredBy) {
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

// Run daily profit accrual every 24 hours
setInterval(accrueDailyProfit, 24 * 60 * 60 * 1000)

// Also run on startup (for testing)
setTimeout(() => {
  console.log('🔄 Running initial profit accrual...')
  accrueDailyProfit()
}, 5000)

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
