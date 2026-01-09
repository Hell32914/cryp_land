/*
Usage:
  node scripts/recompute-user-stats.cjs                 # dry-run (prints diffs)
  node scripts/recompute-user-stats.cjs --apply        # apply safe fixes
  node scripts/recompute-user-stats.cjs --only 8310964989  # only one user (telegramId or numeric userId)
  node scripts/recompute-user-stats.cjs --limit 1000   # limit users processed

What it fixes (safe, derivable from ledger):
  - user.lifetimeDeposit  = SUM(Deposit.amount) WHERE status='COMPLETED' AND currency!='PROFIT'
  - user.totalWithdraw    = SUM(Withdrawal.amount) WHERE status!='FAILED'

Notes:
  - It does NOT change user.totalDeposit or user.profit because those are not fully reconstructible
    from history (withdrawals deduct profit vs deposit but that split isn't stored).
*/

'use strict'

function parseArgs(argv) {
  const args = {
    apply: false,
    help: false,
    only: null,
    limit: null,
  }

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') args.help = true
    else if (a === '--apply') args.apply = true
    else if (a === '--only') args.only = argv[++i] ?? null
    else if (a === '--limit') {
      const v = argv[++i]
      args.limit = v ? Number(v) : null
    }
  }

  return args
}

function printHelp() {
  // Keep help text short to avoid leaking env values or DB info
  console.log('Recompute user stats (ledger-derived).')
  console.log('')
  console.log('Dry run:')
  console.log('  node scripts/recompute-user-stats.cjs')
  console.log('Apply changes:')
  console.log('  node scripts/recompute-user-stats.cjs --apply')
  console.log('Single user:')
  console.log('  node scripts/recompute-user-stats.cjs --only <telegramId|userId>')
  console.log('Limit users:')
  console.log('  node scripts/recompute-user-stats.cjs --limit 500')
}

async function main() {
  const { apply, help, only, limit } = parseArgs(process.argv)
  if (help) {
    printHelp()
    return
  }

  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const userWhere = {}

    if (only) {
      // If it's all digits, could be telegramId or numeric userId.
      // Try matching telegramId first; if no results, fall back to id.
      userWhere.OR = [{ telegramId: String(only) }]
      if (/^\d+$/.test(String(only))) {
        userWhere.OR.push({ id: Number(only) })
      }
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      ...(limit ? { take: limit } : {}),
      select: {
        id: true,
        telegramId: true,
        username: true,
        lifetimeDeposit: true,
        totalWithdraw: true,
      },
      orderBy: { id: 'asc' },
    })

    if (users.length === 0) {
      console.log('No users found for the given filter.')
      return
    }

    const userIds = users.map(u => u.id)

    // Aggregate deposits that count toward lifetimeDeposit (exclude PROFIT pseudo-deposits)
    const depositAgg = await prisma.deposit.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: 'COMPLETED',
        currency: { not: 'PROFIT' },
      },
      _sum: { amount: true },
    })

    // Aggregate withdrawals that count toward totalWithdraw (all non-failed withdrawals)
    const withdrawalAgg = await prisma.withdrawal.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: { not: 'FAILED' },
      },
      _sum: { amount: true },
    })

    const depositSumByUserId = new Map(depositAgg.map(r => [r.userId, r._sum.amount ?? 0]))
    const withdrawSumByUserId = new Map(withdrawalAgg.map(r => [r.userId, r._sum.amount ?? 0]))

    let changedCount = 0
    let inspectedCount = 0

    for (const u of users) {
      inspectedCount++
      const recomputedLifetimeDeposit = Number(depositSumByUserId.get(u.id) ?? 0)
      const recomputedTotalWithdraw = Number(withdrawSumByUserId.get(u.id) ?? 0)

      const lifetimeDiff = Number((recomputedLifetimeDeposit - (u.lifetimeDeposit ?? 0)).toFixed(2))
      const withdrawDiff = Number((recomputedTotalWithdraw - (u.totalWithdraw ?? 0)).toFixed(2))

      const needsLifetimeFix = Math.abs(lifetimeDiff) >= 0.01
      const needsWithdrawFix = Math.abs(withdrawDiff) >= 0.01

      if (!needsLifetimeFix && !needsWithdrawFix) continue

      changedCount++

      const tag = `@${u.username || u.telegramId}`
      console.log(`\nUser ${u.id} (${tag})`) 
      if (needsLifetimeFix) {
        console.log(`  lifetimeDeposit: ${Number(u.lifetimeDeposit ?? 0).toFixed(2)} -> ${recomputedLifetimeDeposit.toFixed(2)} (diff ${lifetimeDiff >= 0 ? '+' : ''}${lifetimeDiff.toFixed(2)})`)
      }
      if (needsWithdrawFix) {
        console.log(`  totalWithdraw:   ${Number(u.totalWithdraw ?? 0).toFixed(2)} -> ${recomputedTotalWithdraw.toFixed(2)} (diff ${withdrawDiff >= 0 ? '+' : ''}${withdrawDiff.toFixed(2)})`)
      }

      if (apply) {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            ...(needsLifetimeFix ? { lifetimeDeposit: recomputedLifetimeDeposit } : {}),
            ...(needsWithdrawFix ? { totalWithdraw: recomputedTotalWithdraw } : {}),
          },
        })
      }
    }

    console.log(`\nDone. Inspected: ${inspectedCount}. ${apply ? 'Updated' : 'Would update'}: ${changedCount}.`)
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

main().catch(err => {
  console.error('Failed:', err?.message || err)
  process.exitCode = 1
})
