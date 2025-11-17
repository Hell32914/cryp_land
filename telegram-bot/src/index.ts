import { Bot, Context, InlineKeyboard } from 'grammy'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { startApiServer, stopApiServer } from './api.js'

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'KYC_REQUIRED' | 'BLOCKED'
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'

dotenv.config()

const prisma = new PrismaClient()
export const bot = new Bot(process.env.BOT_TOKEN!)
export const ADMIN_ID = process.env.ADMIN_ID!
const WEBAPP_URL = process.env.WEBAPP_URL!

// Admin state management
const adminState = new Map<string, { awaitingInput?: string, targetUserId?: number }>()

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

  // Update plan based on balance
  await updateUserPlan(user.id)
  const planInfo = calculateTariffPlan(user.balance)
  const progressBar = '█'.repeat(Math.floor(planInfo.progress / 10)) + '░'.repeat(10 - Math.floor(planInfo.progress / 10))

  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open Syntrix', WEBAPP_URL)

  let welcomeMessage = `👋 *Welcome to Syntrix Bot!*\n\n`
  welcomeMessage += `📊 Status: ${user.status.replace(/_/g, '\\_')}\n`
  welcomeMessage += `💰 Balance: $${user.balance.toFixed(2)}\n`
  welcomeMessage += `📈 Plan: ${planInfo.currentPlan} (${planInfo.dailyPercent}% daily)\n\n`
  
  if (planInfo.nextPlan) {
    welcomeMessage += `🎯 Progress to ${planInfo.nextPlan}:\n`
    welcomeMessage += `${progressBar} ${planInfo.progress.toFixed(0)}%\n`
    welcomeMessage += `💵 $${planInfo.leftUntilNext.toFixed(2)} left\n\n`
  } else {
    welcomeMessage += `🏆 Highest plan achieved!\n\n`
  }
  
  welcomeMessage += `Click the button below to start trading:`

  await ctx.reply(welcomeMessage, { 
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  })
})

bot.command('balance', async (ctx) => {
  const telegramId = ctx.from?.id.toString()
  if (!telegramId) return

  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      deposits: { orderBy: { createdAt: 'desc' }, take: 5 },
      withdrawals: { orderBy: { createdAt: 'desc' }, take: 5 }
    }
  })

  if (!user) {
    await ctx.reply('Please /start the bot first')
    return
  }

  // Update plan and get tariff info
  await updateUserPlan(user.id)
  const planInfo = calculateTariffPlan(user.balance)

  // Create progress bar
  const progressBar = '█'.repeat(Math.floor(planInfo.progress / 10)) + '░'.repeat(10 - Math.floor(planInfo.progress / 10))

  let message = `💰 *Your Balance:* $${user.balance.toFixed(2)}\n\n`
  message += `📊 *Status:* ${user.status.replace(/_/g, '\\_')}\n`
  message += `📈 *Current Plan:* ${planInfo.currentPlan} (${planInfo.dailyPercent}% daily)\n\n`
  
  if (planInfo.nextPlan) {
    message += `🎯 *Progress to ${planInfo.nextPlan}:*\n`
    message += `${progressBar} ${planInfo.progress.toFixed(0)}%\n`
    message += `💵 *$${planInfo.leftUntilNext.toFixed(2)} left until ${planInfo.nextPlan}*\n\n`
  } else {
    message += `🏆 *Congratulations! You have the highest plan!*\n\n`
  }

  message += `💵 Total Deposited: $${user.totalDeposit.toFixed(2)}\n`
  message += `💸 Total Withdrawn: $${user.totalWithdraw.toFixed(2)}\n\n`

  if (user.deposits.length > 0) {
    message += `📥 *Recent Deposits:*\n`
    user.deposits.forEach(d => {
      message += `  • $${d.amount} - ${d.status} (${d.createdAt.toLocaleDateString()})\n`
    })
  }

  await ctx.reply(message, { parse_mode: 'Markdown' })
})

// ============= ADMIN COMMANDS =============

bot.command('admin', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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
    .text('🔄 Refresh', 'admin_menu')

  await ctx.reply(
    '🔐 *Admin Panel*\n\n' +
    `Total Users: ${usersCount}\n` +
    `Total Deposits: ${depositsCount}\n` +
    `Total Withdrawals: ${withdrawalsCount}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
})

bot.callbackQuery('admin_menu', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
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

  await ctx.editMessageText(
    `👤 *User Details*\n\n` +
    `Username: @${user.username || 'no\\_username'}\n` +
    `ID: \`${user.telegramId}\`\n` +
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
    `Username: @${user.username || 'no\\_username'}\n` +
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
    `User: @${user.username || 'no_username'}\n` +
    `Current Balance: $${user.balance.toFixed(2)}\n\n` +
    `Please reply with the amount to add (e.g., 100):`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  )
  await ctx.answerCallbackQuery()
})

bot.on('message:text', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) return
  const state = adminState.get(ADMIN_ID)
  if (!state?.awaitingInput) return

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
      `User: @${user.username || 'no_username'}\n` +
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
  
  // Generate random timestamps throughout the day
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  
  for (let i = 0; i < numUpdates; i++) {
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

// Start bot and API server
console.log('🤖 Syntrix Bot starting...')
startApiServer()
console.log('✅ Starting Grammy bot...')
bot.start()
  .then(() => console.log('✅ Bot started successfully'))
  .catch((err) => {
    console.error('❌ Bot start error:', err)
    process.exit(1)
  })

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
