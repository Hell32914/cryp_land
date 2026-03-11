const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Delete ALL users registered on March 5, 2026 (regardless of status).
 *
 * Usage:
 *   node delete-all-march5.cjs --dry    # dry-run (shows count, no deletions)
 *   node delete-all-march5.cjs          # actually deletes
 */

const DRY_RUN = process.argv.includes('--dry');

async function main() {
  const dayStart = new Date('2026-03-05T00:00:00.000Z');
  const dayEnd   = new Date('2026-03-06T00:00:00.000Z');

  const where = { createdAt: { gte: dayStart, lt: dayEnd } };

  const count = await prisma.user.count({ where });
  console.log(`Found ${count} users registered on 2026-03-05`);

  if (count === 0) {
    console.log('Nothing to delete.');
    return;
  }

  if (DRY_RUN) {
    console.log(`\n🔍 DRY RUN — ${count} users would be deleted. Remove --dry flag to execute.`);
    return;
  }

  // Get IDs for cascade deletion of related records
  const users = await prisma.user.findMany({ where, select: { id: true } });
  const userIds = users.map((u) => u.id);

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
  console.log(`\n✅ Deleted ${deletedUsers.count} users from March 5, 2026`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
