/**
 * Diagnostic + Fix script for Link ID issue
 * 
 * 1. Checks if MarketingLink 'mk_tiktok_mmd8uczi' exists in DB
 * 2. Checks user 33419's utmParams value
 * 3. Fixes utmParams if missing
 * 
 * Usage:
 *   node fix-linkid-user.cjs --dry       # diagnose only
 *   node fix-linkid-user.cjs             # diagnose + fix
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DRY_RUN = process.argv.includes('--dry')
const TARGET_USER_ID = 33419
const TARGET_LINK_ID = 'mk_tiktok_mmd8uczi'

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (diagnose only)' : 'FIX MODE'}`)
  console.log('---')

  // 1. Check MarketingLink
  const ml = await prisma.marketingLink.findUnique({
    where: { linkId: TARGET_LINK_ID }
  })
  if (ml) {
    console.log(`✅ MarketingLink '${TARGET_LINK_ID}' EXISTS in DB:`)
    console.log(`   source: ${ml.source}, trafficerName: ${ml.trafficerName}, clicks: ${ml.clicks}, conversions: ${ml.conversions}`)
  } else {
    console.log(`❌ MarketingLink '${TARGET_LINK_ID}' NOT FOUND in DB!`)
    console.log(`   This means the bot couldn't match the link at registration time.`)
  }
  console.log('---')

  // 2. Check user
  const user = await prisma.user.findUnique({
    where: { id: TARGET_USER_ID },
    select: {
      id: true,
      telegramId: true,
      username: true,
      utmParams: true,
      marketingSource: true,
      createdAt: true,
    }
  })
  if (!user) {
    console.log(`❌ User ID ${TARGET_USER_ID} not found!`)
    return
  }
  console.log(`User #${user.id} (@${user.username}):`)
  console.log(`   telegramId: ${user.telegramId}`)
  console.log(`   utmParams: ${user.utmParams || 'NULL'}`)
  console.log(`   marketingSource: ${user.marketingSource || 'NULL'}`)
  console.log(`   createdAt: ${user.createdAt}`)
  console.log('---')

  // 3. Fix if needed
  if (user.utmParams && user.utmParams.includes(TARGET_LINK_ID)) {
    console.log('✅ utmParams already contains the link ID — no fix needed.')
    return
  }

  if (DRY_RUN) {
    console.log(`Would set utmParams = '${TARGET_LINK_ID}' for user #${TARGET_USER_ID}`)
    return
  }

  const updated = await prisma.user.update({
    where: { id: TARGET_USER_ID },
    data: { utmParams: TARGET_LINK_ID }
  })
  console.log(`✅ Fixed! utmParams set to '${updated.utmParams}' for user #${TARGET_USER_ID}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
