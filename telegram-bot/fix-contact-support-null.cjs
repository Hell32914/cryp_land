const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Setting contactSupportSeen to false for all users...');
  
  const result = await prisma.user.updateMany({
    data: {
      contactSupportSeen: false
    }
  });
  
  console.log(`Updated ${result.count} users`);
  
  console.log('\nChecking specific user 503856039...');
  const user = await prisma.user.findUnique({
    where: { telegramId: '503856039' },
    select: {
      telegramId: true,
      username: true,
      contactSupportSeen: true
    }
  });
  
  if (user) {
    console.log('User found:', user);
  } else {
    console.log('User not found');
  }
  
  console.log('\nChecking all users contactSupportSeen status...');
  const allUsers = await prisma.user.findMany({
    select: {
      telegramId: true,
      username: true,
      contactSupportSeen: true
    },
    take: 5
  });
  
  console.log('First 5 users:', allUsers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
