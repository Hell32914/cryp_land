// Массовый захват всех PENDING PayPal депозитов
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const paypalPath = './dist/paypal.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔍 Finding all PENDING PayPal deposits...\n');
  
  const pendingDeposits = await prisma.deposit.findMany({
    where: {
      paymentMethod: 'PAYPAL',
      status: 'PENDING',
      txHash: {
        not: null
      }
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`Found ${pendingDeposits.length} PENDING deposits\n`);
  
  if (pendingDeposits.length === 0) {
    console.log('✅ No pending deposits to process');
    return;
  }
  
  const { capturePayPalOrder } = await import(paypalPath);
  
  let succeeded = 0;
  let failed = 0;
  let alreadyProcessed = 0;
  const errors = [];
  
  for (const deposit of pendingDeposits) {
    const orderId = deposit.txHash;
    
    console.log(`\n[${succeeded + failed + alreadyProcessed + 1}/${pendingDeposits.length}] Processing Order ID: ${orderId}`);
    console.log(`   User: @${deposit.user.username} (${deposit.user.telegramId})`);
    console.log(`   Amount: $${deposit.amount}`);
    console.log(`   Created: ${deposit.createdAt.toISOString()}`);
    
    try {
      // Try to capture the payment
      const capture = await capturePayPalOrder(orderId);
      
      console.log(`   PayPal Status: ${capture.status}`);
      
      if (capture.status === 'COMPLETED') {
        // Update database
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
        
        console.log(`   ✅ SUCCESS - Balance updated`);
        succeeded++;
        
        // Try to notify user
        try {
          const { bot } = await import('./dist/index.js');
          await bot.api.sendMessage(
            deposit.user.telegramId,
            `✅ *Deposit Successful!*\n\n` +
              `💰 Amount: $${deposit.amount.toFixed(2)} USD\n` +
              `💳 Your deposit has been credited to your account.\n\n` +
              `Thank you for your patience!`,
            { parse_mode: 'Markdown' }
          );
          console.log(`   📱 User notified`);
        } catch (err) {
          console.log(`   ⚠️  Could not notify user: ${err.message}`);
        }
        
      } else {
        console.log(`   ⚠️  Cannot capture - Status: ${capture.status}`);
        alreadyProcessed++;
      }
      
      // Rate limit: wait 500ms between requests
      await sleep(500);
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failed++;
      
      errors.push({
        orderId,
        user: deposit.user.username,
        amount: deposit.amount,
        error: error.message
      });
      
      // Wait longer after error
      await sleep(1000);
    }
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total processed: ${pendingDeposits.length}`);
  console.log(`✅ Successfully captured: ${succeeded}`);
  console.log(`⚠️  Already processed/expired: ${alreadyProcessed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Failed orders:');
    errors.forEach(err => {
      console.log(`   - ${err.orderId} (@${err.user}, $${err.amount}): ${err.error}`);
    });
  }
  
  console.log('\n✅ Batch capture complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
