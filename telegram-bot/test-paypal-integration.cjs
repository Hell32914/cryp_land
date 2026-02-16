/**
 * PayPal Integration Diagnostic Tool
 * 
 * Р—Р°РїСѓСЃС‚РёС‚Рµ СЌС‚РѕС‚ С„Р°Р№Р» РЅР° СЃРµСЂРІРµСЂРµ РґР»СЏ РґРёР°РіРЅРѕСЃС‚РёРєРё РїСЂРѕР±Р»РµРј СЃ PayPal:
 * node test-paypal-integration.cjs
 */

require('dotenv').config()
const axios = require('axios')

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase()

function getBaseUrl() {
  return PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
}

console.log('\nрџ”Ќ PayPal Integration Diagnostic\n')
console.log('=' .repeat(50))

// Step 1: Check environment variables
console.log('\nрџ“‹ Step 1: Environment Variables')
console.log('-'.repeat(50))
console.log('PAYPAL_ENV:', PAYPAL_ENV)
console.log('PAYPAL_CLIENT_ID:', PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.slice(0, 10)}...${PAYPAL_CLIENT_ID.slice(-5)}` : 'вќЊ NOT SET')
console.log('PAYPAL_CLIENT_SECRET:', PAYPAL_CLIENT_SECRET ? `${PAYPAL_CLIENT_SECRET.slice(0, 5)}...${PAYPAL_CLIENT_SECRET.slice(-3)}` : 'вќЊ NOT SET')
console.log('API URL:', getBaseUrl())
console.log('PAYPAL_RETURN_URL:', process.env.PAYPAL_RETURN_URL || 'вќЊ NOT SET')
console.log('PAYPAL_CANCEL_URL:', process.env.PAYPAL_CANCEL_URL || 'вќЊ NOT SET')

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('\nвќЊ ERROR: PayPal credentials are not configured!')
  console.log('\nPlease set the following in your .env file:')
  console.log('  PAYPAL_CLIENT_ID=your_client_id')
  console.log('  PAYPAL_CLIENT_SECRET=your_client_secret')
  process.exit(1)
}

// Step 2: Test authentication
async function testAuthentication() {
  console.log('\nрџ”ђ Step 2: Testing Authentication')
  console.log('-'.repeat(50))
  
  try {
    const baseUrl = getBaseUrl()
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
    
    const response = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    )
    
    const accessToken = response.data?.access_token
    const expiresIn = response.data?.expires_in
    
    if (accessToken) {
      console.log('вњ… Authentication successful!')
      console.log('Access Token:', `${accessToken.slice(0, 10)}...${accessToken.slice(-10)}`)
      console.log('Expires in:', expiresIn, 'seconds')
      return accessToken
    } else {
      console.error('вќЊ Authentication failed: No access token received')
      return null
    }
  } catch (error) {
    console.error('вќЊ Authentication failed!')
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('Error:', error.message)
    }
    return null
  }
}

// Step 3: Test order creation
async function testOrderCreation(accessToken) {
  console.log('\nрџ’і Step 3: Testing Order Creation')
  console.log('-'.repeat(50))
  
  try {
    const baseUrl = getBaseUrl()
    const returnUrl = process.env.PAYPAL_RETURN_URL || process.env.TELEGRAM_APP_URL || 'https://website.syntrix.uno'
    const cancelUrl = process.env.PAYPAL_CANCEL_URL || returnUrl
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: '10.00',
          },
          custom_id: 'test_order_' + Date.now(),
          description: 'Test Syntrix Deposit',
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        brand_name: 'Syntrix',
        landing_page: 'LOGIN'
      },
    }
    
    console.log('Request data:')
    console.log(JSON.stringify(orderData, null, 2))
    
    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )
    
    const orderId = response.data?.id
    const approveUrl = response.data?.links?.find(l => l.rel === 'approve')?.href
    
    if (orderId && approveUrl) {
      console.log('вњ… Order creation successful!')
      console.log('Order ID:', orderId)
      console.log('Approve URL:', approveUrl)
      console.log('\nв„№пёЏ  You can test the payment flow by opening this URL in browser:')
      console.log(approveUrl)
      return true
    } else {
      console.error('вќЊ Order creation failed: Missing order ID or approve URL')
      return false
    }
  } catch (error) {
    console.error('вќЊ Order creation failed!')
    
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Status Text:', error.response.statusText)
      
      if (error.response.data) {
        const paypalError = error.response.data
        console.error('\nPayPal Error Details:')
        console.error('Name:', paypalError.name)
        console.error('Message:', paypalError.message)
        console.error('Debug ID:', paypalError.debug_id)
        
        if (paypalError.details && paypalError.details.length > 0) {
          console.error('\nDetailed Issues:')
          paypalError.details.forEach((detail, index) => {
            console.error(`  ${index + 1}. ${detail.issue || 'Unknown'}`)
            console.error(`     Location: ${detail.field || detail.location || 'N/A'}`)
            console.error(`     Description: ${detail.description || 'No description'}`)
          })
        }
        
        // Common error solutions
        console.error('\nрџ’Ў Common Solutions:')
        if (error.response.status === 422) {
          console.error('  - Verify your PayPal account is a Business Account')
          console.error('  - Ensure your Business Account is fully verified')
          console.error('  - Check that payment receiving is enabled')
          console.error('  - Verify return_url and cancel_url are valid HTTPS URLs')
          console.error('  - For sandbox: use sandbox test accounts')
          console.error('  - Try switching between sandbox/live environments')
        } else if (error.response.status === 401) {
          console.error('  - Check your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET')
          console.error('  - Verify you are using the correct environment (sandbox vs live)')
        }
      }
    } else {
      console.error('Error:', error.message)
    }
    
    return false
  }
}

// Run all tests
async function runDiagnostics() {
  try {
    const accessToken = await testAuthentication()
    
    if (!accessToken) {
      console.log('\nвќЊ Cannot proceed without valid authentication')
      process.exit(1)
    }
    
    const orderCreated = await testOrderCreation(accessToken)
    
    console.log('\n' + '='.repeat(50))
    console.log('рџ“Љ Diagnostic Summary')
    console.log('='.repeat(50))
    
    if (orderCreated) {
      console.log('вњ… All tests passed! PayPal integration is working.')
      console.log('\nв„№пёЏ  If users still experience errors:')
      console.log('  1. Check server logs for detailed error messages')
      console.log('  2. Verify PAYPAL_RETURN_URL points to your Telegram Mini App')
      console.log('  3. Ensure users are completing payment on PayPal page')
      console.log('  4. For sandbox: ensure test accounts have sufficient balance')
    } else {
      console.log('вќЊ Tests failed. Please review errors above and:')
      console.log('  1. Verify your PayPal Business Account is fully set up')
      console.log('  2. Check all environment variables are correct')
      console.log('  3. Review PayPal account settings and restrictions')
      console.log('  4. Contact PayPal support if issues persist')
    }
    
    console.log('\nрџ“љ Resources:')
    console.log('  - PayPal Developer Dashboard: https://developer.paypal.com/dashboard/')
    console.log('  - API Status: https://www.paypal-status.com/')
    console.log('  - Documentation: https://developer.paypal.com/docs/api/orders/v2/')
    console.log('')
  } catch (error) {
    console.error('\nвќЊ Unexpected error:', error.message)
    process.exit(1)
  }
}

// Run diagnostics
runDiagnostics()


