// Activate all accounts that have Syntrix bonus tokens but are INACTIVE
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function activateAccountsWithToken() {
  try {
    console.log('🔍 Searching for INACTIVE accounts with bonus tokens...\n')
    
    // Find all INACTIVE users with bonusTokens > 0
    const inactiveUsersWithTokens = await prisma.user.findMany({
      where: {
        status: 'INACTIVE',
        bonusTokens: { gt: 0 }
      },
      select: {
        id: true,
        telegramId: true,
        username: true,
        bonusTokens: true,
        status: true,
        contactSupportSeen: true,
        createdAt: true
      }
    })

    if (inactiveUsersWithTokens.length === 0) {
      console.log('✅ No INACTIVE accounts with bonus tokens found. All good!')
      return
    }

    console.log(`📊 Found ${inactiveUsersWithTokens.length} INACTIVE accounts with bonus tokens:\n`)
    
    inactiveUsersWithTokens.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`)
      console.log(`   Telegram ID: ${user.telegramId}`)
      console.log(`   Username: @${user.username || 'N/A'}`)
      console.log(`   Bonus Tokens: $${user.bonusTokens.toFixed(2)}`)
      console.log(`   Contact Support Seen: ${user.contactSupportSeen ? 'Yes' : 'No'}`)
      console.log(`   Created At: ${user.createdAt.toISOString()}`)
      console.log('')
    })

    // Ask for confirmation
    console.log(`\n⚠️  About to activate ${inactiveUsersWithTokens.length} accounts...\n`)
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
    
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Activate all accounts
    const result = await prisma.user.updateMany({
      where: {
        status: 'INACTIVE',
        bonusTokens: { gt: 0 }
      },
      data: {
        status: 'ACTIVE'
      }
    })

    console.log(`✅ Successfully activated ${result.count} accounts!\n`)
    
    // Show updated stats
    console.log('📊 Final statistics:')
    const totalActive = await prisma.user.count({ where: { status: 'ACTIVE' } })
    const totalInactive = await prisma.user.count({ where: { status: 'INACTIVE' } })
    const totalWithTokens = await prisma.user.count({ where: { bonusTokens: { gt: 0 } } })
    
    console.log(`   Total ACTIVE accounts: ${totalActive}`)
    console.log(`   Total INACTIVE accounts: ${totalInactive}`)
    console.log(`   Total accounts with bonus tokens: ${totalWithTokens}`)
    
  } catch (error) {
    console.error('❌ Error activating accounts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

console.log('═══════════════════════════════════════════════════════')
console.log('  ACTIVATE ACCOUNTS WITH SYNTRIX TOKENS')
console.log('═══════════════════════════════════════════════════════\n')

activateAccountsWithToken()
  .catch(console.error)
