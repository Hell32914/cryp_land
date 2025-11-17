const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateWithdrawal() {
  try {
    // Update withdrawal 6 to COMPLETED
    await prisma.withdrawal.update({
      where: { id: 6 },
      data: {
        status: 'COMPLETED',
        txHash: 'MANUAL_APPROVED'
      }
    });
    
    console.log('✅ Withdrawal #6 updated to COMPLETED');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

updateWithdrawal();
