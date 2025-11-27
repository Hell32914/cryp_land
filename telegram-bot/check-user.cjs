const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { telegramId: '503856039' }
  });
  
  if (user) {
    console.log('=== User 503856039 ===');
    console.log('balance:', user.balance);
    console.log('totalDeposit:', user.totalDeposit);
    console.log('profit:', user.profit);
    console.log('referralEarnings:', user.referralEarnings);
    console.log('Total Balance should be:', user.totalDeposit + user.profit + user.referralEarnings);
  } else {
    console.log('User not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
