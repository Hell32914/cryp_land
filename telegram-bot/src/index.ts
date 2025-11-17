import { Bot, Context, InlineKeyboard, session, SessionFlavor } from 'grammy'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { startApiServer, stopApiServer } from './api.js'

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'KYC_REQUIRED' | 'BLOCKED'
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'

dotenv.config()

const prisma = new PrismaClient()
const bot = new Bot(process.env.BOT_TOKEN!)
const ADMIN_ID = process.env.ADMIN_ID!
const WEBAPP_URL = process.env.WEBAPP_URL!

interface SessionData {
  awaitingInput?: string
  targetUserId?: number
}

type MyContext = Context & SessionFlavor<SessionData>

bot.use(session({ initial: (): SessionData => ({}) }))

// ============= USER COMMANDS =============

bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id.toString()
  if (!telegramId) return

  let user = await prisma.user.findUnique({
    where: { telegramId }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name
      }
    })

    // Notify admin about new user
    await bot.api.sendMessage(
      ADMIN_ID,
      `🆕 New user registered:\n@${ctx.from?.username || 'no_username'}\nID: ${telegramId}`
    )
  }

  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open Syntrix', WEBAPP_URL)

  await ctx.reply(
    `👋 Welcome to Syntrix Bot!\n\n` +
    `Your account: ${user.status}\n` +
    `Balance: $${user.balance.toFixed(2)}\n` +
    `Plan: ${user.plan}\n\n` +
    `Click the button below to start trading:`,
    { reply_markup: keyboard }
  )
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

  let message = `💰 Your Balance: $${user.balance.toFixed(2)}\n\n`
  message += `📊 Status: ${user.status}\n`
  message += `📈 Plan: ${user.plan}\n`
  message += `💵 Total Deposited: $${user.totalDeposit.toFixed(2)}\n`
  message += `💸 Total Withdrawn: $${user.totalWithdraw.toFixed(2)}\n\n`

  if (user.deposits.length > 0) {
    message += `📥 Recent Deposits:\n`
    user.deposits.forEach(d => {
      message += `  $${d.amount} - ${d.status} (${d.createdAt.toLocaleDateString()})\n`
    })
  }

  await ctx.reply(message)
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

bot.callbackQuery(/^add_balance_(\d+)$/, async (ctx: MyContext) => {
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

  ctx.session.awaitingInput = 'add_balance'
  ctx.session.targetUserId = userId

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

bot.on('message:text', async (ctx: MyContext) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) return
  if (!ctx.session.awaitingInput) return

  if (ctx.session.awaitingInput === 'add_balance') {
    const amount = parseFloat(ctx.message?.text || '')
    const userId = ctx.session.targetUserId

    if (isNaN(amount) || !userId || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.')
      return
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
        totalDeposit: { increment: amount }
      }
    })

    // Create deposit record
    await prisma.deposit.create({
      data: {
        userId: user.id,
        amount,
        status: 'COMPLETED',
        currency: 'USDT'
      }
    })

    // Notify user
    const userMessage = `💰 *Balance Added!*\n\n+$${amount.toFixed(2)}\nNew balance: $${user.balance.toFixed(2)}`
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

    ctx.session.awaitingInput = undefined
    ctx.session.targetUserId = undefined
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
