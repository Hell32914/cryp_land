const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Global Contact Support Settings ===');
  const settings = await prisma.globalSettings.findFirst();
  
  if (settings) {
    console.log('contactSupportEnabled:', settings.contactSupportEnabled);
    console.log('contactSupportBonusAmount:', settings.contactSupportBonusAmount);
    console.log('contactSupportTimerMinutes:', settings.contactSupportTimerMinutes);
    console.log('contactSupportActivatedAt:', settings.contactSupportActivatedAt);
    
    if (settings.contactSupportActivatedAt) {
      const activatedAt = new Date(settings.contactSupportActivatedAt).getTime();
      const now = Date.now();
      const timerDuration = settings.contactSupportTimerMinutes * 60 * 1000;
      const timeLeft = Math.max(0, timerDuration - (now - activatedAt));
      const timeLeftMinutes = Math.floor(timeLeft / 1000 / 60);
      
      console.log('\nTimer Status:');
      console.log('Time left (minutes):', timeLeftMinutes);
      console.log('Time left (hours):', Math.floor(timeLeftMinutes / 60));
      console.log('Is active:', timeLeft > 0);
    }
  } else {
    console.log('No settings found');
  }
  
  console.log('\n=== User Contact Support Status (first 5 users) ===');
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      telegramId: true,
      username: true,
      contactSupportSeen: true
    }
  });
  
  users.forEach(user => {
    console.log(`User ${user.telegramId} (@${user.username}): contactSupportSeen=${user.contactSupportSeen}`);
  });
  
  console.log('\n=== Total users with contactSupportSeen=false ===');
  const unseenCount = await prisma.user.count({
    where: { contactSupportSeen: false }
  });
  console.log('Users who should see modal:', unseenCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
