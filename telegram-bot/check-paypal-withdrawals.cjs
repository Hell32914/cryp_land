const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking PayPal withdrawals...\n');
  
  // Get recent PayPal withdrawals
  const recentWithdrawals = await prisma.withdrawal.findMany({
    where: {
      method: 'PAYPAL'
    },
    include: {
      user: {
        select: {
          telegramId: true,
          username: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  console.log(`📊 Last 20 PayPal withdrawals:\n`);
  
  if (recentWithdrawals.length === 0) {
    console.log('❌ No PayPal withdrawals found');
  } else {
    for (const withdrawal of recentWithdrawals) {
      console.log(`ID: ${withdrawal.id}`);
      console.log(`User: @${withdrawal.user.username} (${withdrawal.user.telegramId})`);
      console.log(`Amount: $${withdrawal.amount}`);
      console.log(`Status: ${withdrawal.status}`);
      console.log(`PayPal Email: ${withdrawal.paypalEmail || 'N/A'}`);
      console.log(`Created: ${withdrawal.createdAt}`);
      console.log(`Transaction Hash: ${withdrawal.txHash || 'N/A'}`);
      console.log('---');
    }
  }

  // Check pending withdrawals
  const pendingWithdrawals = await prisma.withdrawal.findMany({
    where: {
      method: 'PAYPAL',
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          telegramId: true,
          username: true
        }
      }
    }
  });

  console.log(`\n⏳ Pending PayPal withdrawals: ${pendingWithdrawals.length}\n`);
  
  if (pendingWithdrawals.length > 0) {
    console.log('🔍 Details:');
    for (const withdrawal of pendingWithdrawals) {
      console.log(`- ID: ${withdrawal.id}`);
      console.log(`  User: @${withdrawal.user.username} (${withdrawal.user.telegramId})`);
      console.log(`  Amount: $${withdrawal.amount}`);
      console.log(`  PayPal Email: ${withdrawal.paypalEmail}`);
      console.log(`  Created: ${withdrawal.createdAt}`);
      console.log(`  Batch ID: ${withdrawal.txHash || 'Not sent to PayPal yet'}`);
      console.log('');
    }
  }

  // Check all statuses
  const statusCounts = await prisma.withdrawal.groupBy({
    by: ['status', 'method'],
    where: {
      method: 'PAYPAL'
    },
    _count: true
  });

  console.log('\n📊 Withdrawal status summary:');
  statusCounts.forEach(stat => {
    console.log(`  ${stat.status}: ${stat._count}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
