const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding language field to MarketingLink...');
  
  // This will be handled by prisma migrate
  console.log('Run: npx prisma migrate dev --name add_language_to_marketing_link');
  console.log('Or on production: npx prisma db push');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
