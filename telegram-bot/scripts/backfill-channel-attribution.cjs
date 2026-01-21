/*
Backfill channel attribution for existing leads.

Goal:
- For users whose marketingSource is Channel and whose utmParams contains stored invite metadata,
  derive the mk_* linkId and update utmParams to that mk_* linkId.

Why:
- Old data may have utmParams like JSON {inviteLinkName, inviteLink} or just "channel".
  Without mk_* in utmParams, CRM shows Link Name = CHANNEL and per-link stats are empty.

Usage:
- Dry run (no writes):
  node scripts/backfill-channel-attribution.cjs --dry-run

- Apply changes:
  node scripts/backfill-channel-attribution.cjs

Options:
- --limit=5000
- --dry-run
- --verbose

Notes:
- If a user has utmParams = "channel" and no JSON invite info, attribution cannot be recovered.
*/

function parseArgs(argv) {
  const out = { dryRun: false, verbose: false, limit: 0, dotenvPath: null, databaseUrl: null }
  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '--dryrun') out.dryRun = true
    if (arg === '--verbose') out.verbose = true
    if (arg.startsWith('--limit=')) {
      const n = Number.parseInt(arg.slice('--limit='.length), 10)
      if (Number.isFinite(n) && n > 0) out.limit = n
    }
    if (arg.startsWith('--dotenv=')) {
      out.dotenvPath = arg.slice('--dotenv='.length).trim() || null
    }
    if (arg.startsWith('--database-url=')) {
      out.databaseUrl = arg.slice('--database-url='.length).trim() || null
    }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))

const dotenv = require('dotenv')
if (args.dotenvPath) {
  dotenv.config({ path: args.dotenvPath })
} else {
  dotenv.config()
}
if (args.databaseUrl) {
  process.env.DATABASE_URL = args.databaseUrl
}

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

function normalizeInviteLink(value) {
  if (typeof value !== 'string') return null
  let v = value.trim()
  if (!v) return null
  v = v.replace(/^https?:\/\//i, '')
  v = v.replace(/^www\./i, '')
  v = v.replace(/^t\.me\//i, '')
  v = v.replace(/^telegram\.me\//i, '')
  v = v.replace(/\/+$/g, '')
  return v || null
}

function extractMkLinkId(value) {
  if (!value) return null
  const s = typeof value === 'string' ? value : JSON.stringify(value)
  const m = s.match(/mk_[a-zA-Z0-9_]+/)
  return m ? m[0] : null
}

function tryParseJson(raw) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

async function main() {
  const links = await prisma.marketingLink.findMany({
    select: { linkId: true, channelInviteLink: true },
  })

  const mkLinkIds = new Set(links.map((l) => String(l.linkId)))

  const linksByInvite = new Map()
  for (const l of links) {
    if (!l.channelInviteLink) continue
    const key = normalizeInviteLink(String(l.channelInviteLink))
    if (!key) continue
    linksByInvite.set(key, String(l.linkId))
  }

  const where = {
    isHidden: false,
    marketingSource: { not: null },
  }

  // We don't have case-insensitive equals in Prisma for all providers,
  // so filter in JS by lowercasing.
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      telegramId: true,
      marketingSource: true,
      utmParams: true,
      botStartedAt: true,
      createdAt: true,
      username: true,
    },
    orderBy: { createdAt: 'desc' },
    take: args.limit || undefined,
  })

  let scanned = 0
  let candidates = 0
  let updated = 0
  let unchanged = 0
  let notRecoverable = 0

  for (const u of users) {
    scanned += 1
    const ms = String(u.marketingSource || '').toLowerCase()
    if (ms !== 'channel') continue

    const rawUtm = u.utmParams
    const cur = String(rawUtm || '').trim()

    // Already attributed to mk_...
    const directMk = extractMkLinkId(cur)
    if (directMk && mkLinkIds.has(directMk)) {
      unchanged += 1
      continue
    }

    const parsed = tryParseJson(cur)
    if (!parsed) {
      // Nothing to recover.
      notRecoverable += 1
      continue
    }

    const mkFromName = extractMkLinkId(parsed.inviteLinkName)
    const mkFromAny = mkFromName || extractMkLinkId(parsed.inviteLink)

    let resolved = null
    if (mkFromAny && mkLinkIds.has(mkFromAny)) {
      resolved = mkFromAny
    } else {
      const inv = parsed.inviteLink
      const key = normalizeInviteLink(typeof inv === 'string' ? inv : '')
      if (key && linksByInvite.has(key)) {
        resolved = linksByInvite.get(key)
      }
    }

    if (!resolved) {
      notRecoverable += 1
      continue
    }

    candidates += 1

    if (args.verbose) {
      console.log(
        `[candidate] userId=${u.id} tg=${u.telegramId} utm=${cur.slice(0, 120)}... -> ${resolved}`
      )
    }

    if (args.dryRun) {
      updated += 1
      continue
    }

    await prisma.user.update({
      where: { id: u.id },
      data: { utmParams: resolved },
    })

    updated += 1
  }

  console.log('--- backfill-channel-attribution ---')
  if (args.dotenvPath) console.log(`dotenv: ${args.dotenvPath}`)
  console.log(`dryRun: ${args.dryRun}`)
  console.log(`scanned: ${scanned}`)
  console.log(`candidates(found attribution): ${candidates}`)
  console.log(`updated: ${updated}`)
  console.log(`already-attributed: ${unchanged}`)
  console.log(`not-recoverable(no invite info): ${notRecoverable}`)
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await prisma.$disconnect()
    } catch {
      // ignore
    }
  })
