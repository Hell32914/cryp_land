const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking for users with NULL contactSupportSeen...');
  
  const usersWithNull = await prisma.user.count({
    where: {
      contactSupportSeen: null
    }
  });
  
  console.log(`Found ${usersWithNull} users with NULL contactSupportSeen`);
  
  if (usersWithNull > 0) {
    console.log('Setting contactSupportSeen to false for all users with NULL...');
    const result = await prisma.user.updateMany({
      where: {
        contactSupportSeen: null
      },
      data: {
        contactSupportSeen: false
      }
    });
    console.log(`Updated ${result.count} users`);
  }
  
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
