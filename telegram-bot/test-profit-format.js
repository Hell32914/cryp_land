import { generateTradingCard } from './dist/cardGenerator.js';
import fs from 'fs';

console.log('🧪 Testing profit format with decimals...\n');

try {
  // Generate 5 cards to see variety in decimal values
  for (let i = 1; i <= 5; i++) {
    console.log(`📊 Generating card ${i}...`);
    
    const cardBuffer = await generateTradingCard();
    
    fs.writeFileSync(`test-card-${i}.png`, cardBuffer);
    console.log(`✅ Card ${i} generated successfully!`);
  }
  
  console.log('\n✅ All cards generated! Check test-card-1.png through test-card-5.png');
  console.log('📝 Verify that profit percentages show decimal values (e.g., 407.23%, not 407.00%)');
} catch (error) {
  console.error('❌ Error generating cards:', error);
}

process.exit(0);
