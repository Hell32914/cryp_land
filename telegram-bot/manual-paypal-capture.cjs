// Скрипт для ручного захвата PayPal платежа
// Использование: node manual-paypal-capture.cjs <ORDER_ID>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import PayPal functions (need to load from compiled dist)
const paypalPath = './dist/paypal.js';

async function main() {
  const orderId = process.argv[2];
  
  if (!orderId) {
    console.error('❌ Usage: node manual-paypal-capture.cjs <ORDER_ID>');
    process.exit(1);
  }
  
  console.log(`🔍 Looking for deposit with order ID: ${orderId}\n`);
  
  // Find the deposit
  const deposit = await prisma.deposit.findFirst({
    where: {
      paymentMethod: 'PAYPAL',
      txHash: orderId
    },
    include: {
      user: true
    }
  });
  
  if (!deposit) {
    console.error(`❌ No deposit found with order ID: ${orderId}`);
    process.exit(1);
  }
  
  console.log('📋 Deposit found:');
  console.log(`   ID: ${deposit.id}`);
  console.log(`   User: @${deposit.user.username} (${deposit.user.telegramId})`);
  console.log(`   Amount: $${deposit.amount}`);
  console.log(`   Status: ${deposit.status}`);
  console.log(`   Created: ${deposit.createdAt}\n`);
  
  if (deposit.status === 'COMPLETED') {
    console.log('✅ Deposit already completed. No action needed.');
    return;
  }
  
  console.log('💳 Attempting to capture payment from PayPal...\n');
  
  try {
    const { capturePayPalOrder } = await import(paypalPath);
    const capture = await capturePayPalOrder(orderId);
    
    console.log('📨 PayPal Response:');
    console.log(`   Status: ${capture.status}`);
    console.log(`   Amount: $${capture.amountValue || 'N/A'}`);
    console.log(`   Currency: ${capture.currency || 'N/A'}`);
    console.log(`   Payer Email: ${capture.payerEmail || 'N/A'}\n`);
    
    if (capture.status !== 'COMPLETED') {
      console.error(`❌ Payment not completed. PayPal status: ${capture.status}`);
      console.error('   This payment cannot be captured automatically.');
      process.exit(1);
    }
    
    console.log('💾 Updating database...\n');
    
    // Update deposit and user balance
    await prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: deposit.id },
        data: { status: 'COMPLETED' }
      });
      
      await tx.user.update({
        where: { id: deposit.userId },
        data: {
          totalDeposit: { increment: deposit.amount },
          lifetimeDeposit: { increment: deposit.amount },
          status: deposit.user.status === 'INACTIVE' ? 'ACTIVE' : undefined
        }
      });
    });
    
    const updatedUser = await prisma.user.findUnique({ where: { id: deposit.userId } });
    
    console.log('✅ Database updated successfully!');
    console.log(`   User new total deposit: $${updatedUser.totalDeposit}\n`);
    
    // Try to notify user
    console.log('📱 Attempting to notify user...');
    try {
      const { bot } = await import(paypalPath.replace('paypal', 'index'));
      
      await bot.api.sendMessage(
        deposit.user.telegramId,
        `✅ *Deposit Successful!*\n\n` +
          `💰 Amount: $${deposit.amount.toFixed(2)} USD\n` +
          `💳 New Balance: $${updatedUser.totalDeposit.toFixed(2)}\n\n` +
          `Thank you for your deposit!`,
        { parse_mode: 'Markdown' }
      );
      
      console.log('✅ User notified successfully\n');
    } catch (err) {
      console.error('⚠️  Failed to notify user:', err.message);
      console.error('   You may need to notify them manually.\n');
    }
    
    console.log('🎉 Payment captured and processed successfully!');
    
  } catch (error) {
    console.error('❌ Error capturing payment:', error);
    
    if (error.response?.data) {
      console.error('\n📋 PayPal Error Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
