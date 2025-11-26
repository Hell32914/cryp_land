const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    
    // Delete all data in correct order (respecting foreign keys)
    await prisma.dailyUpdate.deleteMany({});
    console.log('✅ Cleared DailyUpdate');
    
    await prisma.referral.deleteMany({});
    console.log('✅ Cleared Referral');
    
    await prisma.withdrawal.deleteMany({});
    console.log('✅ Cleared Withdrawal');
    
    await prisma.marketingLink.deleteMany({});
    console.log('✅ Cleared MarketingLink');
    
    await prisma.user.deleteMany({});
    console.log('✅ Cleared User');
    
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
