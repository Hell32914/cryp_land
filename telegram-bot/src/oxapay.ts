import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const OXAPAY_API_KEY = process.env.OXAPAY_API_KEY || ''
const OXAPAY_PAYOUT_API_KEY = process.env.OXAPAY_PAYOUT_API_KEY || ''
const OXAPAY_BASE_URL = 'https://api.oxapay.com'

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

// Create payout (withdrawal)
export async function createPayout(params: CreatePayoutParams): Promise<CreatePayoutResponse> {
  if (!OXAPAY_PAYOUT_API_KEY || OXAPAY_PAYOUT_API_KEY === 'YOUR_OXAPAY_API_KEY_HERE') {
    throw new Error('OxaPay Payout API key is not configured. Please add OXAPAY_PAYOUT_API_KEY to .env file')
  }

  try {
    const response = await axios.post(
      'https://api.oxapay.com/v1/payout',
      {
        address: params.address,
        amount: params.amount,
        currency: params.currency.toUpperCase(), // Use uppercase as in docs
        network: (params.network || 'TRC20').toUpperCase(), // Use uppercase as in docs
        description: `Withdrawal ${params.amount} ${params.currency}`
      },
      {
        headers: {
          'payout_api_key': OXAPAY_PAYOUT_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.result === 100) {
      return {
        success: true,
        trackId: response.data.trackId,
        status: response.data.status,
        amount: response.data.amount
      }
    } else {
      throw new Error(response.data.message || 'Failed to create payout')
    }
  } catch (error: any) {
    console.error('OxaPay createPayout error:', error.response?.data || error.message)
    throw error
  }
}

// Check payment status
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
