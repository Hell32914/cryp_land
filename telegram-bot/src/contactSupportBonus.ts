import { prisma } from './db.js'

const DEFAULT_BONUS_AMOUNT = 25

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

  if (!contactSupportEnabled) {
    const err: any = new Error('Contact support bonus is disabled')
    err.statusCode = 400
    throw err
  }

  const now = new Date()

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
