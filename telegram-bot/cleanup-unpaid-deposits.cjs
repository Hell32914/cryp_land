// Очистка неоплаченных PayPal депозитов
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding unpaid PayPal deposits...\n');
  
  // Find old PENDING deposits (older than 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const oldPendingDeposits = await prisma.deposit.findMany({
    where: {
      paymentMethod: 'PAYPAL',
      status: 'PENDING',
      txHash: {
        not: null
      },
      createdAt: {
        lt: oneDayAgo
      }
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
  
  console.log(`Found ${oldPendingDeposits.length} old PENDING deposits (>24h)\n`);
  
  if (oldPendingDeposits.length === 0) {
    console.log('✅ No old deposits to clean up');
    return;
  }
  
  console.log('📋 These deposits will be marked as CANCELLED:\n');
  
  const groupByUser = {};
  oldPendingDeposits.forEach(d => {
    const username = d.user.username || 'null';
    if (!groupByUser[username]) {
      groupByUser[username] = [];
    }
    groupByUser[username].push(d);
  });
  
  Object.keys(groupByUser).forEach(username => {
    const deposits = groupByUser[username];
    console.log(`  @${username}:`);
    deposits.forEach(d => {
      console.log(`    - $${d.amount} (ID: ${d.id}, Created: ${d.createdAt.toISOString().split('T')[0]})`);
    });
  });
  
  console.log('\n⚠️  WARNING: This action will mark these deposits as CANCELLED');
  console.log('   They were likely not paid or the PayPal orders expired.\n');
  console.log('⏳ Starting in 5 seconds... (Ctrl+C to cancel)\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🗑️  Cancelling old deposits...\n');
  
  const result = await prisma.deposit.updateMany({
    where: {
      paymentMethod: 'PAYPAL',
      status: 'PENDING',
      txHash: {
        not: null
      },
      createdAt: {
        lt: oneDayAgo
      }
    },
    data: {
      status: 'CANCELLED'
    }
  });
  
  console.log(`✅ Cancelled ${result.count} deposits`);
  console.log('\n📊 Summary by user:');
  
  Object.keys(groupByUser).forEach(username => {
    const deposits = groupByUser[username];
    const total = deposits.reduce((sum, d) => sum + d.amount, 0);
    console.log(`  @${username}: ${deposits.length} deposits, $${total.toFixed(2)} total`);
  });
  
  console.log('\n✅ Cleanup complete!');
  console.log('\n⚠️  NOTE: These users did NOT lose money - they never paid!');
  console.log('   If someone claims they paid, check PayPal transaction history manually.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
