const axios = require('axios')
require('dotenv').config()

const OXAPAY_API_KEY = process.env.OXAPAY_API_KEY
const OXAPAY_BASE_URL = 'https://api.oxapay.com'

async function testCreateInvoice() {
  console.log('🧪 Testing OxaPay Create Invoice...\n')

  try {
    const response = await axios.post(`${OXAPAY_BASE_URL}/merchants/request`, {
      merchant: OXAPAY_API_KEY,
      amount: 10,
      currency: 'USDT',
      callbackUrl: '',
      description: 'Test Deposit',
      lifeTime: 30,
      feePaidByPayer: 0,
      underPaidCover: 2,
      returnUrl: ''
    })

    console.log('✅ API Response Status:', response.status)
    console.log('✅ Result Code:', response.data.result)
    
    if (response.data.result === 100) {
      console.log('\n🎉 SUCCESS! Invoice created:')
      console.log('📌 Track ID:', response.data.trackId)
      console.log('💳 Pay Link:', response.data.payLink)
      console.log('📍 Address:', response.data.address)
      console.log('💰 Amount:', response.data.amount)
      console.log('\n✅ OxaPay API is working correctly!')
      return response.data
    } else {
      console.log('❌ Failed:', response.data.message)
      return null
    }
  } catch (error) {
    console.error('❌ Error testing OxaPay:', error.response?.data || error.message)
    return null
  }
}

async function testCheckStatus(trackId) {
  console.log('\n🧪 Testing Payment Status Check...\n')

  try {
    const response = await axios.post(`${OXAPAY_BASE_URL}/merchants/inquiry`, {
      merchant: OXAPAY_API_KEY,
      trackId
    })

    console.log('✅ Status Response:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error checking status:', error.response?.data || error.message)
    return null
  }
}

async function runTests() {
  console.log('🚀 Starting OxaPay API Tests\n')
  console.log('📋 API Key:', OXAPAY_API_KEY ? '✅ Configured' : '❌ Missing')
  console.log('=' .repeat(50))

  // Test 1: Create Invoice
  const invoice = await testCreateInvoice()

  // Test 2: Check Status (if invoice was created)
  if (invoice && invoice.trackId) {
    await testCheckStatus(invoice.trackId)
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Tests completed!')
}

runTests()
