const axios = require('axios')

async function testDepositAPI() {
  console.log('🧪 Testing Full Deposit Flow via API\n')
  console.log('=' .repeat(50))

  const API_URL = 'http://localhost:3001'
  const TELEGRAM_ID = '503856039'

  try {
    // Test 1: Create Deposit
    console.log('1️⃣ Creating deposit invoice...')
    const depositResponse = await axios.post(
      `${API_URL}/api/user/${TELEGRAM_ID}/create-deposit`,
      {
        amount: 10,
        currency: 'USDT'
      }
    )

    console.log('\n✅ Deposit Created:')
    console.log('   Track ID:', depositResponse.data.trackId)
    console.log('   Pay Link:', depositResponse.data.payLink)
    console.log('   QR Code:', depositResponse.data.qrCode)
    console.log('   Address:', depositResponse.data.address)
    console.log('   Amount:', depositResponse.data.amount)
    console.log('   Deposit ID:', depositResponse.data.depositId)

    // Test 2: Get User Profile (check deposit record)
    console.log('\n2️⃣ Checking user profile...')
    const profileResponse = await axios.get(`${API_URL}/api/user/${TELEGRAM_ID}`)
    
    console.log('\n✅ User Profile:')
    console.log('   Balance:', profileResponse.data.balance)
    console.log('   Total Deposit:', profileResponse.data.totalDeposit)
    console.log('   Total Profit:', profileResponse.data.profit)

    // Test 3: Get Transactions
    console.log('\n3️⃣ Checking transactions...')
    const transactionsResponse = await axios.get(`${API_URL}/api/user/${TELEGRAM_ID}/transactions`)
    
    const deposits = transactionsResponse.data.transactions.filter(t => t.type === 'deposit')
    console.log('\n✅ Recent Deposits:')
    deposits.slice(0, 3).forEach((dep, i) => {
      console.log(`   ${i + 1}. $${dep.amount} - ${dep.status} (${new Date(dep.createdAt).toLocaleString()})`)
    })

    console.log('\n' + '='.repeat(50))
    console.log('✅ Full deposit flow test completed!')
    console.log('\n📝 Next steps to complete payment:')
    console.log('   1. Open payment link:', depositResponse.data.payLink)
    console.log('   2. Send USDT to the provided address')
    console.log('   3. Wait for confirmation (status will change to COMPLETED)')

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  API server is not running!')
      console.log('   Please start the bot first:')
      console.log('   cd d:\\my_repo\\cryp_land\\telegram-bot')
      console.log('   node dist/index.js')
    }
  }
}

testDepositAPI()
