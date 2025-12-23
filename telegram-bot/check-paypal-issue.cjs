const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking PayPal deposits...\n');
  
  // Get recent PayPal deposits
  const recentDeposits = await prisma.deposit.findMany({
    where: {
      paymentMethod: 'PAYPAL'
    },
    include: {
      user: {
        select: {
          telegramId: true,
          username: true,
          totalDeposit: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  console.log('📊 Last 10 PayPal deposits:\n');
  
  if (recentDeposits.length === 0) {
    console.log('❌ No PayPal deposits found');
  } else {
    for (const deposit of recentDeposits) {
      console.log(`ID: ${deposit.id}`);
      console.log(`User: @${deposit.user.username} (${deposit.user.telegramId})`);
      console.log(`Amount: $${deposit.amount}`);
      console.log(`Status: ${deposit.status}`);
      console.log(`PayPal Order ID: ${deposit.txHash || 'N/A'}`);
      console.log(`Created: ${deposit.createdAt}`);
      console.log(`User Total Deposit: $${deposit.user.totalDeposit}`);
      console.log('---');
    }
  }

  // Check pending deposits
  const pendingDeposits = await prisma.deposit.findMany({
    where: {
      paymentMethod: 'PAYPAL',
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

  console.log(`\n⏳ Pending PayPal deposits: ${pendingDeposits.length}`);
  
  if (pendingDeposits.length > 0) {
    console.log('\n🔍 Details:');
    for (const deposit of pendingDeposits) {
      console.log(`- Order ID: ${deposit.txHash}`);
      console.log(`  User: @${deposit.user.username}`);
      console.log(`  Amount: $${deposit.amount}`);
      console.log(`  Created: ${deposit.createdAt}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
