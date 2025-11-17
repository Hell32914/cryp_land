import axios from 'axios'

const OXAPAY_API_KEY = 'HB7C0E-DIYI2B-P97EK0-YHMVBS'
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
      return {
        success: true,
        trackId: response.data.trackId,
        payLink: response.data.payLink,
        qrCode: response.data.payLink, // OxaPay provides QR-ready link
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
  try {
    const response = await axios.post(`${OXAPAY_BASE_URL}/merchants/payout`, {
      merchant: OXAPAY_API_KEY,
      address: params.address,
      amount: params.amount,
      currency: params.currency,
      network: params.network || 'TRC20',
      callbackUrl: ''
    })

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
