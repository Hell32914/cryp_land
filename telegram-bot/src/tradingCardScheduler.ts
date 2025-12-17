import cron, { ScheduledTask } from 'node-cron'
import { Bot, InputFile } from 'grammy'
import { generateTradingCard, formatCardCaption, getLastTradingPostData } from './cardGenerator.js'
import { getCardSettings } from './cardSettings.js'

// Current scheduled jobs
let scheduledJobs: ScheduledTask[] = []

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function getRetryAfterSeconds(error: any): number | null {
  // Grammy wraps Telegram API errors; `parameters.retry_after` is commonly present on 429.
  const retryAfter = error?.parameters?.retry_after ??
    error?.payload?.parameters?.retry_after ??
    error?.response?.parameters?.retry_after
  if (typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter
  return null
}

function getTelegramErrorCode(error: any): number | null {
  const code = error?.error_code ?? error?.payload?.error_code ?? error?.response?.error_code
  if (typeof code === 'number' && Number.isFinite(code)) return code
  return null
}

function isBlockedError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  const code = getTelegramErrorCode(error)
  return code === 403 || message.includes('bot was blocked') || message.includes('user is deactivated')
}

async function sendPhotoWithRetry(
  bot: Bot,
  chatId: number | string,
  photo: string | InputFile,
  options: { caption: string; parse_mode: 'Markdown' },
  maxAttempts = 4
): Promise<any> {
  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt++
    try {
      return await bot.api.sendPhoto(chatId, photo as any, options as any)
    } catch (error: any) {
      if (isBlockedError(error)) throw error

      const code = getTelegramErrorCode(error)
      const retryAfterSeconds = getRetryAfterSeconds(error)

      if (attempt >= maxAttempts) throw error

      // 429 / flood control: respect retry_after when available.
      if (code === 429 || retryAfterSeconds) {
        const waitMs = (retryAfterSeconds ?? Math.min(60, 2 ** attempt)) * 1000
        console.warn(`⏳ Flood control when sending to ${chatId}; waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt}/${maxAttempts})`)
        await sleep(waitMs + 250)
        continue
      }

      // Transient network-ish failures: small backoff.
      await sleep(Math.min(15_000, 750 * attempt))
    }
  }
}

/**
 * Schedule trading card posts throughout the day
 * Posts configurable times per day between configurable hours (Kyiv time UTC+2)
 */
export async function scheduleTradingCards(bot: Bot, channelId: string) {
  console.log('📊 Trading card scheduler initialized')
  
  const settings = await getCardSettings()
  console.log(`⚙️  Settings: ${settings.minPerDay}-${settings.maxPerDay} posts/day, ${settings.startTime}-${settings.endTime} Kyiv time`)
  
  // Schedule initial calculation of today's posts
  await scheduleRandomPosts(bot, channelId)
  
  // Reschedule at midnight Kyiv time (handles DST)
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Rescheduling trading cards for new day')
    await scheduleRandomPosts(bot, channelId)
  }, {
    timezone: 'Europe/Kyiv'
  })
}

/**
 * Reschedule all cards (call this after settings change)
 */
export async function rescheduleCards(bot: Bot, channelId: string) {
  // Cancel all existing jobs
  scheduledJobs.forEach(job => job.stop())
  scheduledJobs = []
  
  console.log('🔄 Rescheduling trading cards with new settings')
  await scheduleRandomPosts(bot, channelId)
}

/**
 * Schedule random posts for today
 */
async function scheduleRandomPosts(bot: Bot, channelId: string) {
  // Cancel all existing jobs
  scheduledJobs.forEach(job => job.stop())
  scheduledJobs = []
  
  const settings = await getCardSettings()
  
  // Random number of posts based on settings
  const postsCount = Math.floor(Math.random() * (settings.maxPerDay - settings.minPerDay + 1)) + settings.minPerDay
  console.log(`📅 Scheduling ${postsCount} trading card posts for today`)
  
  // Generate random times based on configured time range
  const times = await generateRandomTimes(postsCount)
  
  const now = new Date()
  
  times.forEach((time, index) => {
    const [hours, minutes] = time.split(':').map(Number)
    
    // Calculate target time - could be today or tomorrow
    let targetTime = new Date(now)
    targetTime.setUTCHours(hours, minutes, 0, 0)
    
    // If time already passed today, schedule for tomorrow
    if (targetTime.getTime() <= now.getTime()) {
      targetTime = new Date(targetTime.getTime() + 24 * 60 * 60 * 1000)
    }
    
    const delay = targetTime.getTime() - now.getTime()
    
    // Schedule the timeout
    const timeout = setTimeout(async () => {
      console.log(`📸 Generating trading card ${index + 1}/${postsCount}`)
      await postTradingCard(bot, channelId)
    }, delay)
    
    // Store timeout (we can't stop it with cron.schedule API, but can track it)
    // Note: setTimeout returns NodeJS.Timeout, not ScheduledTask, but we'll keep array name
    scheduledJobs.push({ stop: () => clearTimeout(timeout) } as any)
    
    console.log(`  ⏰ Post ${index + 1} scheduled for ${time} UTC (${toKyivTime(time)} Kyiv) - in ${Math.round(delay / 1000 / 60)} minutes`)
  })
  
  console.log(`✅ Scheduled ${scheduledJobs.length}/${postsCount} posts for today`)
}

/**
 * Generate random times based on configured time range
 */
async function generateRandomTimes(count: number): Promise<string[]> {
  const times: number[] = []
  const settings = await getCardSettings()
  
  // Parse Kyiv times
  const [startH, startM] = settings.startTime.split(':').map(Number)
  const [endH, endM] = settings.endTime.split(':').map(Number)
  
  // Create date objects in Kyiv timezone to properly handle conversion
  const now = new Date()
  const kyivOffset = 2 // Kyiv is UTC+2 (winter) or UTC+3 (summer), but we'll use standard UTC+2
  
  // Convert Kyiv time to UTC by subtracting offset
  let startMinutesUTC = (startH - kyivOffset) * 60 + startM
  let endMinutesUTC = (endH - kyivOffset) * 60 + endM
  
  // Handle day wrap-around if UTC time goes negative or exceeds 24h
  if (startMinutesUTC < 0) startMinutesUTC += 24 * 60
  if (endMinutesUTC < 0) endMinutesUTC += 24 * 60
  if (startMinutesUTC >= 24 * 60) startMinutesUTC -= 24 * 60
  if (endMinutesUTC >= 24 * 60) endMinutesUTC -= 24 * 60
  
  // If end time is before start time (crosses midnight), split into two ranges
  const ranges = endMinutesUTC < startMinutesUTC 
    ? [[startMinutesUTC, 24 * 60 - 1], [0, endMinutesUTC]]
    : [[startMinutesUTC, endMinutesUTC]]
  
  // Generate random times across all ranges
  for (let i = 0; i < count; i++) {
    const range = ranges[Math.floor(Math.random() * ranges.length)]
    const randomMinutes = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
    times.push(randomMinutes % (24 * 60))
  }
  
  // Sort times chronologically
  times.sort((a, b) => a - b)
  
  // Convert to HH:MM format
  return times.map(minutes => {
    const hours = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  })
}

/**
 * Convert UTC time to Kyiv time for display
 */
function toKyivTime(utcTime: string): string {
  const [hours, minutes] = utcTime.split(':').map(Number)
  const kyivHours = (hours + 2) % 24
  return `${kyivHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Post a trading card to all registered users
 */
export async function postTradingCard(bot: Bot, channelId: string) {
  try {
    // Import shared Prisma instance
    const { prisma } = await import('./db.js')
    
    // Generate card image
    const imageBuffer = await generateTradingCard()
    
    // Get data for caption
    const cardData = await getLastTradingPostData()
    const caption = formatCardCaption(cardData)
    
    // Get all active users
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { telegramId: true }
    })

    console.log(`👥 Broadcasting trading card to ${users.length} active users`)
    
    // Send to all users
    let successCount = 0
    let skippedCount = 0
    let cachedFileId: string | null = null

    const perMessageDelayMs = parseInt(process.env.CARD_SEND_DELAY_MS || '55', 10)
    for (const user of users) {
      try {
        const photo = cachedFileId ? cachedFileId : new InputFile(imageBuffer)
        const result = await sendPhotoWithRetry(
          bot,
          user.telegramId,
          photo,
          {
            caption: caption,
            parse_mode: 'Markdown'
          }
        )

        if (!cachedFileId && result?.photo?.length) {
          cachedFileId = result.photo[result.photo.length - 1]?.file_id ?? null
        }
        successCount++

        if (perMessageDelayMs > 0) {
          await sleep(perMessageDelayMs)
        }
      } catch (error: any) {
        if (isBlockedError(error)) {
          skippedCount++
        } else {
          console.error(`Failed to send card to ${user.telegramId}:`, error?.message || error)
        }
      }
    }
    
    console.log(
      `✅ Trading card #${cardData.orderNumber} sent to ${successCount}/${users.length} users` +
      (skippedCount ? ` (skipped blocked/deactivated: ${skippedCount})` : '')
    )
  } catch (error) {
    console.error('❌ Failed to post trading card:', error)
  }
}
