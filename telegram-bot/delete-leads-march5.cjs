const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Delete all users with computed lead status = 'lead' registered on March 5, 2026.
 *
 * Lead status logic (same as CRM):
 *   - 'channel' if marketingSource='channel' AND botStartedAt IS NULL AND status='INACTIVE'
 *   - 'user'    if country is known (not null / '' / 'Unknown')
 *   - 'lead'    otherwise
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node delete-leads-march5.cjs
 *   node delete-leads-march5.cjs          # uses .env DATABASE_URL
 *   node delete-leads-march5.cjs --dry    # dry-run (no deletions)
 */

const DRY_RUN = process.argv.includes('--dry');

async function main() {
  const dayStart = new Date('2026-03-05T00:00:00.000Z');
  const dayEnd   = new Date('2026-03-06T00:00:00.000Z');

  // Fetch all users created on March 5, 2026
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    select: {
      id: true,
      telegramId: true,
      username: true,
      country: true,
      marketingSource: true,
      botStartedAt: true,
      status: true,
      createdAt: true,
    },
  });

  console.log(`Found ${users.length} users registered on 2026-03-05`);

  // Filter to only 'lead' users using the same logic as the CRM
  const leadUsers = users.filter((user) => {
    const isChannel = String(user.marketingSource || '').toLowerCase() === 'channel';
    const hasStartedBot = Boolean(user.botStartedAt);
    const isInactive = String(user.status || '').toUpperCase() === 'INACTIVE';
    const isChannelOnly = isChannel && !hasStartedBot && isInactive;

    if (isChannelOnly) return false; // 'channel', not 'lead'

    const isKnownUser = Boolean(user.country && user.country !== 'Unknown');
    if (isKnownUser) return false; // 'user', not 'lead'

    return true; // 'lead'
  });

  console.log(`Of those, ${leadUsers.length} are leads`);

  if (leadUsers.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // Print the list
  console.log('\nLead users to delete:');
  console.log('─'.repeat(80));
  for (const u of leadUsers) {
    console.log(
      `  ID=${u.id}  tg=${u.telegramId}  @${u.username || '—'}  country=${u.country || 'null'}  status=${u.status}  registered=${u.createdAt.toISOString()}`
    );
  }
  console.log('─'.repeat(80));

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN — no records were deleted. Remove --dry flag to execute.');
    return;
  }

  const userIds = leadUsers.map((u) => u.id);

  // Delete related records first (foreign key constraints)
  const deletedNotifications = await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`  Deleted ${deletedNotifications.count} notifications`);

  const deletedDailyUpdates = await prisma.dailyProfitUpdate.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`  Deleted ${deletedDailyUpdates.count} daily updates`);

  const deletedReferrals = await prisma.referral.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`  Deleted ${deletedReferrals.count} referrals`);

  const deletedDeposits = await prisma.deposit.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`  Deleted ${deletedDeposits.count} deposits`);

  const deletedWithdrawals = await prisma.withdrawal.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`  Deleted ${deletedWithdrawals.count} withdrawals`);

  const deletedAiLogs = await prisma.aiAnalyticsRequestLog.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`  Deleted ${deletedAiLogs.count} AI analytics logs`);

  // Delete the users
  const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  console.log(`\n✅ Deleted ${deletedUsers.count} lead users from March 5, 2026`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
