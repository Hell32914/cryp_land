const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncBalances() {
  // Найти всех пользователей где balance больше totalDeposit
  const users = await prisma.user.findMany({
    where: {
      balance: {
        gt: 0
      }
    }
  });

  console.log(`Found ${users.length} users with balance > 0`);

  for (const user of users) {
    if (user.balance > user.totalDeposit) {
      console.log(`User ${user.telegramId}: balance=${user.balance}, totalDeposit=${user.totalDeposit}`);
      console.log(`  -> Setting totalDeposit = ${user.balance}`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { totalDeposit: user.balance }
      });
    }
  }

  console.log('Done!');
}

syncBalances()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
