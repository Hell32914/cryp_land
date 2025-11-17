import { Bot, Context, InlineKeyboard, session, SessionFlavor } from 'grammy'
import { PrismaClient, UserStatus, TransactionStatus } from '@prisma/client'
import * as dotenv from 'dotenv'

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

  const keyboard = new InlineKeyboard()
    .text('📊 All Users', 'admin_users').row()
    .text('💰 Add Balance', 'admin_add_balance').row()
    .text('📥 Deposits', 'admin_deposits').row()
    .text('📤 Withdrawals', 'admin_withdrawals')

  await ctx.reply('🔐 Admin Panel', { reply_markup: keyboard })
})

bot.callbackQuery('admin_users', async (ctx) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  let message = '👥 Users List:\n\n'
  
  for (const user of users) {
    message += `━━━━━━━━━━━━━━━\n`
    message += `👤 @${user.username || 'no_username'}\n`
    message += `🆔 ID: ${user.telegramId}\n`
    message += `📊 Status: ${user.status}\n`
    message += `💰 Balance: $${user.balance.toFixed(2)}\n`
    message += `📥 Deposit: $${user.totalDeposit.toFixed(2)}\n`
    message += `📤 Withdraw: $${user.totalWithdraw.toFixed(2)}\n`
    
    if (user.kycRequired) message += `⚠️ KYC Required\n`
    if (user.isBlocked) message += `🚫 BLOCKED\n`
    
    const keyboard = new InlineKeyboard()
      .text('✏️ Manage', `manage_${user.id}`)
    
    await ctx.reply(message, { reply_markup: keyboard })
    message = ''
  }

  if (message === '') {
    await ctx.answerCallbackQuery('Users list sent')
  }
})

bot.callbackQuery(/^manage_(\d+)$/, async (ctx) => {
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

  const keyboard = new InlineKeyboard()
    .text('✅ Activate', `status_${userId}_ACTIVE`)
    .text('⏸ Deactivate', `status_${userId}_INACTIVE`).row()
    .text('📋 KYC Required', `status_${userId}_KYC_REQUIRED`)
    .text('🚫 Block', `status_${userId}_BLOCKED`).row()
    .text('💰 Add Balance', `add_balance_${userId}`)
    .text('◀️ Back', 'admin_users')

  await ctx.editMessageText(
    `Managing: @${user.username}\n` +
    `Status: ${user.status}\n` +
    `Balance: $${user.balance}`,
    { reply_markup: keyboard }
  )
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
  switch (newStatus) {
    case 'ACTIVE':
      statusMessage = '✅ Your account has been activated!'
      break
    case 'INACTIVE':
      statusMessage = '⏸ Your account has been deactivated'
      break
    case 'KYC_REQUIRED':
      statusMessage = '📋 KYC verification required. Please contact support.'
      break
    case 'BLOCKED':
      statusMessage = '🚫 Your account has been blocked. Contact support for details.'
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

  await ctx.answerCallbackQuery(`Status changed to ${newStatus}`)
  await ctx.editMessageReplyMarkup({
    reply_markup: new InlineKeyboard()
      .text('✅ Done', 'admin_users')
  })
})

bot.callbackQuery(/^add_balance_(\d+)$/, async (ctx: MyContext) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) {
    await ctx.answerCallbackQuery('Access denied')
    return
  }

  const userId = parseInt(ctx.match![1])
  ctx.session.awaitingInput = 'add_balance'
  ctx.session.targetUserId = userId

  await ctx.reply('Enter amount to add (e.g., 100):')
  await ctx.answerCallbackQuery()
})

bot.on('message:text', async (ctx: MyContext) => {
  if (ctx.from?.id.toString() !== ADMIN_ID) return
  if (!ctx.session.awaitingInput) return

  if (ctx.session.awaitingInput === 'add_balance') {
    const amount = parseFloat(ctx.message.text)
    const userId = ctx.session.targetUserId

    if (isNaN(amount) || !userId) {
      await ctx.reply('Invalid amount')
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
    const message = `💰 Balance added!\n\n+$${amount.toFixed(2)}\nNew balance: $${user.balance.toFixed(2)}`
    await bot.api.sendMessage(user.telegramId, message)
    
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        message
      }
    })

    // Notify admin
    await bot.api.sendMessage(
      ADMIN_ID,
      `✅ Added $${amount} to @${user.username}\nNew balance: $${user.balance}`
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

  let message = '📥 Recent Deposits:\n\n'
  
  for (const deposit of deposits) {
    message += `━━━━━━━━━━━━━━━\n`
    message += `@${deposit.user.username || 'no_username'}\n`
    message += `💵 $${deposit.amount}\n`
    message += `📊 ${deposit.status}\n`
    message += `📅 ${deposit.createdAt.toLocaleString()}\n`
  }

  await ctx.editMessageText(message || 'No deposits yet')
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

  let message = '📤 Recent Withdrawals:\n\n'
  
  for (const withdrawal of withdrawals) {
    message += `━━━━━━━━━━━━━━━\n`
    message += `@${withdrawal.user.username || 'no_username'}\n`
    message += `💵 $${withdrawal.amount}\n`
    message += `📊 ${withdrawal.status}\n`
    message += `📅 ${withdrawal.createdAt.toLocaleString()}\n`
    
    if (withdrawal.status === 'PENDING') {
      const keyboard = new InlineKeyboard()
        .text('✅ Approve', `approve_withdrawal_${withdrawal.id}`)
        .text('❌ Reject', `reject_withdrawal_${withdrawal.id}`)
      
      await ctx.reply(
        `⏳ Pending withdrawal:\n@${withdrawal.user.username}\n$${withdrawal.amount}`,
        { reply_markup: keyboard }
      )
    }
  }

  await ctx.editMessageText(message || 'No withdrawals yet')
  await ctx.answerCallbackQuery()
})

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err)
})

// Start bot
console.log('🤖 Syntrix Bot starting...')
bot.start()

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('Bot stopping...')
  bot.stop()
  prisma.$disconnect()
})
process.once('SIGTERM', () => {
  console.log('Bot stopping...')
  bot.stop()
  prisma.$disconnect()
})
