import { prisma } from './db.js'

const DEFAULT_BONUS_AMOUNT = 25
const DEFAULT_TIMER_MINUTES = 1440

export async function claimContactSupportBonus(telegramId: string) {
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
  const bonusAmount = settings?.contactSupportBonusAmount ?? DEFAULT_BONUS_AMOUNT
  const timerMinutes = settings?.contactSupportTimerMinutes ?? DEFAULT_TIMER_MINUTES

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
