import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const OXAPAY_API_KEY = process.env.OXAPAY_API_KEY || ''
const OXAPAY_PAYOUT_API_KEY = process.env.OXAPAY_PAYOUT_API_KEY || ''
const OXAPAY_BASE_URL = 'https://api.oxapay.com'

// Withdrawal limits: Track recent payouts to prevent duplicates
interface WithdrawalLimit {
  address: string
  amount: number
  currency: string
  timestamp: number
}

const recentWithdrawals: WithdrawalLimit[] = []
const WITHDRAWAL_COOLDOWN_MS = 60000 // 1 minute cooldown
const MAX_DAILY_AMOUNT_USD = 10000 // $10k daily limit per address

export interface CreateInvoiceParams {
  amount: number
  currency: string // BTC, ETH, USDT, etc.
  callbackUrl?: string
  description?: string
}

export interface CreateInvoiceResponse {
  success: boolean
  trackId: string
  payLink: string
  qrCode: string
  address: string
  amount: number
}

export interface CreatePayoutParams {
  address: string
  amount: number
  currency: string
  network?: string // TRC20, ERC20, BEP20, etc.
}

export interface CreatePayoutResponse {
  success: boolean
  trackId: string
  status: string
  amount: number
}

// Create payment invoice (deposit)
export async function createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
  if (!OXAPAY_API_KEY || OXAPAY_API_KEY === 'YOUR_OXAPAY_API_KEY_HERE') {
    throw new Error('OxaPay API key is not configured. Please add OXAPAY_API_KEY to .env file')
  }

  try {
    const response = await axios.post(`${OXAPAY_BASE_URL}/merchants/request`, {
      merchant: OXAPAY_API_KEY,
      amount: params.amount,
      currency: params.currency,
      callbackUrl: params.callbackUrl || '',
      description: params.description || 'Syntrix Deposit',
      lifeTime: 30, // 30 minutes
      feePaidByPayer: 0,
      underPaidCover: 2,
      returnUrl: ''
    })

    if (response.data.result === 100) {
      // Generate QR code image URL using QR Server API
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(response.data.payLink)}`
      
      return {
        success: true,
        trackId: response.data.trackId,
        payLink: response.data.payLink,
        qrCode: qrCodeUrl,
        address: response.data.address,
        amount: response.data.amount
      }
    } else {
      throw new Error(response.data.message || 'Failed to create invoice')
    }
  } catch (error: any) {
    console.error('OxaPay createInvoice error:', error.response?.data || error.message)
    throw error
  }
}

// Helper: Check if withdrawal exceeds limits
function checkWithdrawalLimits(address: string, amount: number, currency: string): string | null {
  const now = Date.now()
  
  // Clean up old entries (older than 24 hours)
  const dayAgo = now - 24 * 60 * 60 * 1000
  const activeWithdrawals = recentWithdrawals.filter(w => w.timestamp > dayAgo)
  recentWithdrawals.length = 0
  recentWithdrawals.push(...activeWithdrawals)

  // Check for duplicate (same address, amount, currency within cooldown)
  const duplicate = recentWithdrawals.find(
    w => w.address === address &&
         w.amount === amount &&
         w.currency.toUpperCase() === currency.toUpperCase() &&
         (now - w.timestamp) < WITHDRAWAL_COOLDOWN_MS
  )
  
  if (duplicate) {
    const remainingSeconds = Math.ceil((WITHDRAWAL_COOLDOWN_MS - (now - duplicate.timestamp)) / 1000)
    return `⚠️ Duplicate withdrawal detected. Please wait ${remainingSeconds}s before retrying the same withdrawal.`
  }

  // Check daily limit for same address (USD equivalent)
  const dailyTotal = recentWithdrawals
    .filter(w => w.address === address && (now - w.timestamp) < 24 * 60 * 60 * 1000)
    .reduce((sum, w) => sum + w.amount, 0)
  
  if (dailyTotal + amount > MAX_DAILY_AMOUNT_USD) {
    return `⚠️ Daily withdrawal limit exceeded for this address. Limit: $${MAX_DAILY_AMOUNT_USD}, current: $${dailyTotal.toFixed(2)}, requested: $${amount.toFixed(2)}`
  }

  return null // No limit violations
}

// Create payout (withdrawal)
export async function createPayout(params: CreatePayoutParams): Promise<CreatePayoutResponse> {
  if (!OXAPAY_PAYOUT_API_KEY || OXAPAY_PAYOUT_API_KEY === 'YOUR_OXAPAY_API_KEY_HERE') {
    throw new Error('OxaPay Payout API key is not configured. Please add OXAPAY_PAYOUT_API_KEY to .env file')
  }

  // Check withdrawal limits BEFORE processing
  const limitError = checkWithdrawalLimits(params.address, params.amount, params.currency)
  if (limitError) {
    throw new Error(limitError)
  }

  try {
    // Record this withdrawal attempt
    recentWithdrawals.push({
      address: params.address,
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      timestamp: Date.now()
    })
    console.log('📤 Sending payout request:', {
      address: params.address,
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      network: (params.network || 'TRC20').toUpperCase()
    })

    // Determine callback URL from environment or use default
    const callbackUrl = process.env.WEBHOOK_URL 
      ? `${process.env.WEBHOOK_URL.startsWith('http') ? process.env.WEBHOOK_URL : `https://${process.env.WEBHOOK_URL}`}/api/oxapay-callback`
      : 'https://api.syntrix.website/api/oxapay-callback'

    const response = await axios.post(
      'https://api.oxapay.com/v1/payout',
      {
        address: params.address,
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        network: (params.network || 'TRC20').toUpperCase(),
        description: `Withdrawal ${params.amount} ${params.currency}`,
        callbackUrl: callbackUrl
      },
      {
        headers: {
          'payout_api_key': OXAPAY_PAYOUT_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log(`📞 Payout callback URL set to: ${callbackUrl}`)

    console.log('📥 OxaPay payout response:', JSON.stringify(response.data, null, 2))

    // Handle both response formats: {result: 100, trackId} and {status: 200, data: {track_id}}
    const trackId = response.data.trackId || response.data.data?.track_id || response.data.track_id
    const status = response.data.status || response.data.data?.status
    const amount = response.data.amount || response.data.data?.amount || params.amount

    // Check if response indicates success (status 200 or result 100)
    const isSuccess = response.data.status === 200 || response.data.result === 100

    if (isSuccess && trackId) {
      console.log(`✅ Payout successful with trackId: ${trackId}`)
      return {
        success: true,
        trackId: trackId,
        status: status || 'processing',
        amount: amount
      }
    }
    
    // If no trackId but status 200, still might be processing
    if (response.data.status === 200 || response.data.result === 100) {
      console.warn('⚠️ Success status but no trackId found:', response.data)
      if (trackId) {
        return {
          success: true,
          trackId: trackId,
          status: 'processing',
          amount: amount
        }
      }
    }
    
    console.error('❌ OxaPay returned unexpected response:', response.data)
    throw new Error(response.data.message || response.data.error || 'Failed to create payout')
  } catch (error: any) {
    console.error('❌ OxaPay createPayout error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })

    // If response contains trackId, payout might still be processing
    if (error.response?.data?.trackId) {
      console.log('⚠️ Error occurred but trackId found:', error.response.data.trackId)
      return {
        success: true,
        trackId: error.response.data.trackId,
        status: 'PROCESSING',
        amount: error.response.data.amount || params.amount
      }
    }

    // Check for specific OxaPay errors
    const errorKey = error.response?.data?.error?.key
    if (errorKey === 'amount_exceeds_balance') {
      throw new Error('Payment provider has insufficient funds. Please contact support.')
    }

    throw new Error(error.response?.data?.message || error.message || 'Failed to create payout')
  }
}

// Check payment status (for deposits)
export async function checkPaymentStatus(trackId: string): Promise<any> {
  try {
    const response = await axios.post(`${OXAPAY_BASE_URL}/merchants/inquiry`, {
      merchant: OXAPAY_API_KEY,
      trackId
    })

    return response.data
  } catch (error: any) {
    console.error('OxaPay checkPaymentStatus error:', error.response?.data || error.message)
    throw error
  }
}

// Check payout status (for withdrawals)
export async function checkPayoutStatus(trackId: string): Promise<any> {
  if (!OXAPAY_PAYOUT_API_KEY || OXAPAY_PAYOUT_API_KEY === 'YOUR_OXAPAY_API_KEY_HERE') {
    throw new Error('OxaPay Payout API key is not configured')
  }

  try {
    console.log('🔍 Checking payout status for trackId:', trackId)
    
    const response = await axios.get(
      `https://api.oxapay.com/v1/payout/inquiry/${trackId}`,
      {
        headers: {
          'payout_api_key': OXAPAY_PAYOUT_API_KEY
        }
      }
    )

    console.log('📥 OxaPay payout status response:', JSON.stringify(response.data, null, 2))

    return response.data
  } catch (error: any) {
    console.error('❌ OxaPay checkPayoutStatus error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    throw error
  }
}

export async function getPayoutBalance(): Promise<any> {
  if (!OXAPAY_PAYOUT_API_KEY) {
    throw new Error('OxaPay Payout API key is not configured')
  }

  try {
    const response = await axios.post(
      'https://api.oxapay.com/api/balance',
      {
        key: OXAPAY_PAYOUT_API_KEY
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  } catch (error: any) {
    throw error
  }
}

export async function directPayout(params: CreatePayoutParams): Promise<boolean> {
  if (!OXAPAY_PAYOUT_API_KEY) throw new Error('API key not configured')
  const r = await axios.post('https://api.oxapay.com/v1/payout', {
    address: params.address,
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    network: (params.network || 'TRC20').toUpperCase(),
    description: ''
  }, { headers: { 'payout_api_key': OXAPAY_PAYOUT_API_KEY, 'Content-Type': 'application/json' } })
  return r.data.status === 200 || r.data.result === 100
}