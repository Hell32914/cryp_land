import { generateTradingCard } from './dist/cardGenerator.js';
import fs from 'fs';

console.log('🧪 Testing card generation...');

try {
  const cardBuffer = await generateTradingCard({
    botName: 'SyntrixBot',
    pair: 'INJUSDT',
    position: 'Long',
    leverage: 63,
    profit: 121.00,
    entryPrice: 2.914,
    lastPrice: 6.44
  });
  
  fs.writeFileSync('test-card.png', cardBuffer);
  console.log('✅ Card generated successfully! Check test-card.png');
} catch (error) {
  console.error('❌ Error generating card:', error);
}

process.exit(0);
