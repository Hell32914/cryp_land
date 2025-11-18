const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIP() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: '111111' }
    });
    
    console.log('\n=== User IP Info ===');
    console.log('Username:', user.username);
    console.log('IP Address:', user.ipAddress || 'Not set');
    console.log('Country:', user.country || 'Not set');
    console.log('Language:', user.languageCode || 'Not set');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkIP();
