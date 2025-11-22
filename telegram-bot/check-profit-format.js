import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLastCards() {
  console.log('🔍 Checking last 5 generated trading cards...\n');
  
  const cards = await prisma.tradingPost.findMany({
    orderBy: { orderNumber: 'desc' },
    take: 5
  });
  
  console.log('📊 Trading Cards:\n');
  cards.forEach((card) => {
    console.log(`Order #${card.orderNumber}`);
    console.log(`  Pair: ${card.pair}`);
    console.log(`  Position: ${card.position}`);
    console.log(`  Profit: ${card.profit}% (decimal part: ${(card.profit % 1).toFixed(2).substring(2)})`);
    console.log(`  Leverage: ${card.leverage}x`);
    console.log(`  Entry: ${card.entryPrice}, Last: ${card.lastPrice}`);
    console.log('');
  });
  
  // Check if all have non-zero decimal parts
  const hasDecimals = cards.every(card => card.profit % 1 !== 0);
  
  if (hasDecimals) {
    console.log('✅ SUCCESS! All cards have decimal values in profit percentage');
  } else {
    const withoutDecimals = cards.filter(card => card.profit % 1 === 0);
    console.log(`❌ ISSUE: ${withoutDecimals.length} cards have .00 decimals`);
  }
  
  await prisma.$disconnect();
}

checkLastCards().catch(console.error);
