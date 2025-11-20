// Add isActiveReferral field to User model
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Adding isActiveReferral field to all users...')
  
  // Get all users
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users`)
  
  // Update all users - set isActiveReferral = true if totalDeposit >= 1000
  for (const user of users) {
    const isActive = user.totalDeposit >= 1000
    await prisma.user.update({
      where: { id: user.id },
      data: { isActiveReferral: isActive }
    })
    
    if (isActive) {
      console.log(`✅ Activated referral for user ${user.telegramId} (deposit: $${user.totalDeposit})`)
    }
  }
  
  console.log('✅ Migration completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
