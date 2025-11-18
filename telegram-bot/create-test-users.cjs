const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create test user with different language codes
    const testUsers = [
      { telegramId: '111111', username: 'user_en', languageCode: 'en', balance: 100 },
      { telegramId: '222222', username: 'user_ru', languageCode: 'ru', balance: 200 },
      { telegramId: '333333', username: 'user_de', languageCode: 'de', balance: 300 },
      { telegramId: '444444', username: 'user_fr', languageCode: 'fr', balance: 400 }
    ];

    for (const userData of testUsers) {
      await prisma.user.upsert({
        where: { telegramId: userData.telegramId },
        update: userData,
        create: userData
      });
      console.log(`✅ Created/updated user: ${userData.username} (${userData.languageCode})`);
    }

    console.log('\n✅ Test users created successfully!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

createTestUser();
