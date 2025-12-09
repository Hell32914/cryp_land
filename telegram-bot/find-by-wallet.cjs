const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findUsersByWallet(walletAddress) {
  try {
    console.log(`\n🔍 Searching for withdrawals to wallet: ${walletAddress}\n`)

    // Find all withdrawals to this address
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        address: {
          contains: walletAddress
        }
      },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            totalDeposit: true,
            profit: true,
            referralEarnings: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (withdrawals.length === 0) {
      console.log('❌ No withdrawals found for this wallet address\n')
      return
    }

    console.log(`✅ Found ${withdrawals.length} withdrawal(s):\n`)
    console.log('━'.repeat(80))

    // Group by user
    const userMap = new Map()
    
    withdrawals.forEach(w => {
      const userId = w.user.telegramId
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: w.user,
          withdrawals: []
        })
      }
      userMap.get(userId).withdrawals.push(w)
    })

    // Display results
    let userIndex = 1
    for (const [telegramId, data] of userMap) {
      const user = data.user
      const userWithdrawals = data.withdrawals
      
      console.log(`\n${userIndex}. 👤 USER INFORMATION`)
      console.log(`   Telegram ID: ${user.telegramId}`)
      console.log(`   Username: @${user.username || 'no_username'}`)
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name')
      console.log(`   Registered: ${user.createdAt.toLocaleString()}`)
      console.log(`   Total Deposit: $${user.totalDeposit.toFixed(2)}`)
      console.log(`   Profit: $${user.profit.toFixed(2)}`)
      console.log(`   Referral Earnings: $${user.referralEarnings.toFixed(2)}`)
      
      const totalBalance = user.totalDeposit + user.profit + user.referralEarnings
      console.log(`   Current Balance: $${totalBalance.toFixed(2)}`)
      
      console.log(`\n   💸 WITHDRAWALS TO THIS WALLET (${userWithdrawals.length}):`)
      
      let totalWithdrawn = 0
      userWithdrawals.forEach((w, idx) => {
        console.log(`   ${idx + 1}. ID: ${w.id}`)
        console.log(`      Amount: $${w.amount.toFixed(2)} ${w.currency}`)
        console.log(`      Network: ${w.network || 'N/A'}`)
        console.log(`      Address: ${w.address}`)
        console.log(`      Status: ${w.status}`)
        console.log(`      TX Hash: ${w.txHash || 'N/A'}`)
        console.log(`      Created: ${w.createdAt.toLocaleString()}`)
        console.log(`      Updated: ${w.updatedAt.toLocaleString()}`)
        
        if (w.status === 'COMPLETED' || w.status === 'APPROVED') {
          totalWithdrawn += w.amount
        }
        
        if (idx < userWithdrawals.length - 1) {
          console.log(`      ` + '─'.repeat(40))
        }
      })
      
      console.log(`\n   📊 Total withdrawn to this wallet: $${totalWithdrawn.toFixed(2)}`)
      console.log('\n' + '━'.repeat(80))
      
      userIndex++
    }

    // Summary
    const totalUsers = userMap.size
    const totalWithdrawals = withdrawals.length
    const totalAmount = withdrawals.reduce((sum, w) => {
      if (w.status === 'COMPLETED' || w.status === 'APPROVED') {
        return sum + w.amount
      }
      return sum
    }, 0)

    console.log(`\n📈 SUMMARY:`)
    console.log(`   Total unique users: ${totalUsers}`)
    console.log(`   Total withdrawals: ${totalWithdrawals}`)
    console.log(`   Total amount withdrawn: $${totalAmount.toFixed(2)}`)
    console.log('')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get wallet address from command line
const walletAddress = process.argv[2]

if (!walletAddress) {
  console.log('\n❌ Usage: node find-by-wallet.cjs <wallet_address>')
  console.log('   Example: node find-by-wallet.cjs TXYz9kN...')
  console.log('   Tip: You can use partial address for search\n')
  process.exit(1)
}

findUsersByWallet(walletAddress)
