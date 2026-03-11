/**
 * Diagnostic script for channel Link ID issue
 * 
 * Checks:
 * 1. Does the MarketingLink exist?
 * 2. Does it have a channelInviteLink stored?
 * 3. What invite_link name was used?
 * 4. Current user's utmParams
 * 
 * Usage:
 *   node diagnose-channel-linkid.cjs [linkId] [userId]
 *   node diagnose-channel-linkid.cjs mk_reddit_mmm8kutr 33423
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TARGET_LINK_ID = process.argv[2] || 'mk_reddit_mmm8kutr'
const TARGET_USER_ID = process.argv[3] ? parseInt(process.argv[3], 10) : null

async function main() {
  console.log('=== MarketingLink Diagnostic ===')
  console.log()

  // 1. Check MarketingLink
  const ml = await prisma.marketingLink.findUnique({ where: { linkId: TARGET_LINK_ID } })
  if (ml) {
    console.log(`✅ MarketingLink '${TARGET_LINK_ID}':`)
    console.log(`   source: ${ml.source}`)
    console.log(`   trafficerName: ${ml.trafficerName || 'NULL'}`)
    console.log(`   channelInviteLink: ${ml.channelInviteLink || 'NULL'}`)
    console.log(`   clicks: ${ml.clicks}, conversions: ${ml.conversions}`)
    console.log(`   isActive: ${ml.isActive}`)
    console.log(`   language: ${ml.language || 'NULL'}`)
    console.log(`   domain: ${ml.domain || 'NULL'}`)
  } else {
    console.log(`❌ MarketingLink '${TARGET_LINK_ID}' NOT FOUND`)
  }
  console.log()

  // 2. List all MarketingLinks with channelInviteLink
  const allWithInvite = await prisma.marketingLink.findMany({
    where: { channelInviteLink: { not: null } },
    select: { linkId: true, channelInviteLink: true, source: true }
  })
  console.log(`=== All MarketingLinks with channelInviteLink (${allWithInvite.length}): ===`)
  for (const l of allWithInvite) {
    console.log(`   ${l.linkId} → ${l.channelInviteLink}`)
  }
  console.log()

  // 3. Check specific user
  if (TARGET_USER_ID) {
    const user = await prisma.user.findUnique({
      where: { id: TARGET_USER_ID },
      select: { id: true, telegramId: true, username: true, utmParams: true, marketingSource: true, createdAt: true }
    })
    if (user) {
      console.log(`=== User #${user.id} (@${user.username}): ===`)
      console.log(`   utmParams: ${user.utmParams || 'NULL'}`)
      console.log(`   marketingSource: ${user.marketingSource || 'NULL'}`)
      console.log(`   createdAt: ${user.createdAt}`)
    } else {
      console.log(`❌ User #${TARGET_USER_ID} not found`)
    }
  }

  // 4. Check recent users with 'Channel' source to see their utmParams
  console.log()
  console.log('=== Last 10 Channel users: ===')
  const channelUsers = await prisma.user.findMany({
    where: { marketingSource: 'Channel' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, username: true, utmParams: true, createdAt: true }
  })
  for (const u of channelUsers) {
    const utm = u.utmParams || 'NULL'
    const short = utm.length > 80 ? utm.substring(0, 80) + '...' : utm
    console.log(`   #${u.id} @${u.username || '?'} utmParams=${short} (${u.createdAt.toISOString().split('T')[0]})`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
