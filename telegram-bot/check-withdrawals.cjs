const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWithdrawals() {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n=== Recent Withdrawals ===');
    withdrawals.forEach((w, i) => {
      console.log(`\n#${i+1}:`);
      console.log('  ID:', w.id);
      console.log('  User:', w.user.username || w.user.telegramId);
      console.log('  Amount:', w.amount);
      console.log('  Status:', w.status);
      console.log('  Currency:', w.currency);
      console.log('  Network:', w.network);
      console.log('  Address:', w.address);
      console.log('  Created:', w.createdAt);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkWithdrawals();
