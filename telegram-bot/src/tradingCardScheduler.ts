import cron, { ScheduledTask } from 'node-cron'
import { Bot, InputFile } from 'grammy'
import { generateTradingCard, formatCardCaption, getLastTradingPostData } from './cardGenerator.js'
import { getCardSettings } from './cardSettings.js'

// Current scheduled jobs
let scheduledJobs: ScheduledTask[] = []

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
  
  // Reschedule at midnight Kyiv time (22:00 UTC)
  cron.schedule('0 22 * * *', async () => {
    console.log('🔄 Rescheduling trading cards for new day')
    await scheduleRandomPosts(bot, channelId)
  }, {
    timezone: 'UTC'
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
  const settings = await getCardSettings()
  
  // Random number of posts based on settings
  const postsCount = Math.floor(Math.random() * (settings.maxPerDay - settings.minPerDay + 1)) + settings.minPerDay
  console.log(`📅 Scheduling ${postsCount} trading card posts for today`)
  
  // Generate random times based on configured time range
  const times = await generateRandomTimes(postsCount)
  
  times.forEach((time, index) => {
    const [hours, minutes] = time.split(':').map(Number)
    
    // Schedule cron job for this specific time (UTC)
    const job = cron.schedule(`${minutes} ${hours} * * *`, async () => {
      console.log(`📸 Generating trading card ${index + 1}/${postsCount}`)
      await postTradingCard(bot, channelId)
    }, {
      timezone: 'UTC'
    })
    
    scheduledJobs.push(job)
    
    console.log(`  ⏰ Post ${index + 1} scheduled for ${time} UTC (${toKyivTime(time)} Kyiv)`)
  })
}

/**
 * Generate random times based on configured time range
 */
async function generateRandomTimes(count: number): Promise<string[]> {
  const times: number[] = []
  const settings = await getCardSettings()
  
  // Convert Kyiv time to UTC (subtract 2 hours)
  const [startH, startM] = settings.startTime.split(':').map(Number)
  const [endH, endM] = settings.endTime.split(':').map(Number)
  
  const startMinutes = (startH - 2) * 60 + startM
  const endMinutes = (endH - 2) * 60 + endM
  
  // Generate random times
  for (let i = 0; i < count; i++) {
    const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes + 1)) + startMinutes
    times.push(randomMinutes)
  }
  
  // Sort times chronologically
  times.sort((a, b) => a - b)
  
  // Convert to HH:MM format
  return times.map(minutes => {
    const hours = Math.floor(minutes / 60)
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
 * Post a trading card to the channel
 */
export async function postTradingCard(bot: Bot, channelId: string) {
  try {
    // Generate card image
    const imageBuffer = await generateTradingCard()
    
    // Get data for caption
    const cardData = await getLastTradingPostData()
    const caption = formatCardCaption(cardData)
    
    // Post to channel
    await bot.api.sendPhoto(channelId, new InputFile(imageBuffer), {
      caption: caption,
      parse_mode: 'Markdown'
    })
    
    console.log(`✅ Trading card #${cardData.orderNumber} posted successfully`)
  } catch (error) {
    console.error('❌ Failed to post trading card:', error)
  }
}
