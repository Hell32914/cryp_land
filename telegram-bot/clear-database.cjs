const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    
    // Delete all data in correct order (respecting foreign keys)
    await prisma.notification.deleteMany({});
    console.log('✅ Cleared Notification');
    
    await prisma.dailyProfitUpdate.deleteMany({});
    console.log('✅ Cleared DailyProfitUpdate');
    
    await prisma.referral.deleteMany({});
    console.log('✅ Cleared Referral');
    
    await prisma.deposit.deleteMany({});
    console.log('✅ Cleared Deposit');
    
    await prisma.withdrawal.deleteMany({});
    console.log('✅ Cleared Withdrawal');
    
    await prisma.user.deleteMany({});
    console.log('✅ Cleared User');
    
    await prisma.marketingLink.deleteMany({});
    console.log('✅ Cleared MarketingLink');
    
    console.log('');
    console.log('✅ Database cleared successfully!');
    console.log('📊 All user data has been deleted.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
