const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUpdates() {
  try {
    const updates = await prisma.dailyProfitUpdate.findMany({
      orderBy: { timestamp: 'asc' }
    });
    
    console.log('\n=== Daily Updates in Database ===');
    console.log('Total updates:', updates.length);
    
    if (updates.length > 0) {
      console.log('\nFirst update:');
      console.log('  Amount:', updates[0].amount);
      console.log('  Daily Total:', updates[0].dailyTotal);
      console.log('  Timestamp:', updates[0].timestamp);
      
      console.log('\nAll updates:');
      updates.forEach((u, i) => {
        console.log(`  #${i+1}: $${u.amount.toFixed(2)} at ${u.timestamp.toLocaleTimeString()}`);
      });
      
      const sum = updates.reduce((acc, u) => acc + u.amount, 0);
      console.log('\nSum of all amounts:', sum.toFixed(2));
      console.log('Daily Total from DB:', updates[0].dailyTotal.toFixed(2));
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkUpdates();
