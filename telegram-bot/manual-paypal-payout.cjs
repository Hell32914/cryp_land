// Ручная отправка PayPal вывода
// Использование: node manual-paypal-payout.cjs <WITHDRAWAL_ID>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const paypalPath = './dist/paypal.js';

async function main() {
  const withdrawalId = process.argv[2];
  
  if (!withdrawalId) {
    console.error('❌ Usage: node manual-paypal-payout.cjs <WITHDRAWAL_ID>');
    console.error('\nExample: node manual-paypal-payout.cjs 24');
    process.exit(1);
  }
  
  console.log(`🔍 Looking for withdrawal ID: ${withdrawalId}\n`);
  
  // Find the withdrawal
  const withdrawal = await prisma.withdrawal.findUnique({
    where: {
      id: parseInt(withdrawalId)
    },
    include: {
      user: true
    }
  });
  
  if (!withdrawal) {
    console.error(`❌ Withdrawal not found with ID: ${withdrawalId}`);
    process.exit(1);
  }
  
  console.log('📋 Withdrawal details:');
  console.log(`   ID: ${withdrawal.id}`);
  console.log(`   User: @${withdrawal.user.username} (${withdrawal.user.telegramId})`);
  console.log(`   Amount: $${withdrawal.amount}`);
  console.log(`   Status: ${withdrawal.status}`);
  console.log(`   PayPal Email: ${withdrawal.paypalEmail}`);
  console.log(`   Created: ${withdrawal.createdAt}`);
  console.log(`   Current txHash: ${withdrawal.txHash || 'N/A'}\n`);
  
  if (withdrawal.status === 'COMPLETED') {
    console.log('✅ Withdrawal already completed. No action needed.');
    return;
  }
  
  if (withdrawal.status === 'CANCELLED') {
    console.log('⚠️  Withdrawal is cancelled. Cannot process.');
    return;
  }
  
  if (!withdrawal.paypalEmail) {
    console.error('❌ No PayPal email specified for this withdrawal!');
    process.exit(1);
  }
  
  console.log('💳 Attempting to send payout via PayPal API...\n');
  
  try {
    const { createPayPalPayout } = await import(paypalPath);
    
    const payout = await createPayPalPayout({
      receiverEmail: withdrawal.paypalEmail,
      amount: withdrawal.amount,
      currency: 'USD',
      note: `Withdrawal #${withdrawal.id}`,
      senderItemId: `wd_${withdrawal.id}`
    });
    
    console.log('📨 PayPal Response:');
    console.log(`   Batch ID: ${payout.batchId}`);
    console.log(`   Status: ${payout.batchStatus || 'PENDING'}\n`);
    
    console.log('💾 Updating database...\n');
    
    // Update withdrawal status
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        txHash: payout.batchId,
        status: 'COMPLETED'
      }
    });
    
    console.log('✅ Withdrawal processed successfully!');
    console.log(`   Batch ID: ${payout.batchId}\n`);
    
    // Try to notify user
    console.log('📱 Attempting to notify user...');
    try {
      const { bot } = await import('./dist/index.js');
      
      await bot.api.sendMessage(
        withdrawal.user.telegramId,
        `✅ *Withdrawal Completed!*\n\n` +
          `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
          `💳 Method: PayPal\n` +
          `📧 Sent to: \`${withdrawal.paypalEmail}\`\n\n` +
          `🧾 Batch ID: ${payout.batchId}\n` +
          `✅ Funds should arrive in your PayPal account soon.`,
        { parse_mode: 'Markdown' }
      );
      
      console.log('✅ User notified successfully\n');
    } catch (err) {
      console.error('⚠️  Failed to notify user:', err.message);
      console.error('   Please notify them manually.\n');
    }
    
    console.log('🎉 Payout sent successfully!');
    console.log(`\n💡 Check PayPal dashboard to verify: https://www.paypal.com/payouts/`);
    
  } catch (error) {
    console.error('❌ Error sending payout:', error.message);
    
    if (error.response?.data) {
      console.error('\n📋 PayPal Error Details:');
      const paypalError = error.response.data;
      console.error(`   Name: ${paypalError.name}`);
      console.error(`   Message: ${paypalError.message}`);
      console.error(`   Debug ID: ${paypalError.debug_id}`);
      
      if (paypalError.details) {
        console.error('\n   Details:');
        paypalError.details.forEach(detail => {
          console.error(`   - ${detail.issue}: ${detail.description}`);
        });
      }
    }
    
    console.error('\n⚠️  Options:');
    console.error('   1. Fix the issue and run this script again');
    console.error('   2. Send payout manually via PayPal website');
    console.error('   3. Cancel withdrawal and refund user');
    
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
