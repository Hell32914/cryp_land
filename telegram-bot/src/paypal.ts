import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase() // live | sandbox

function getBaseUrl() {
  return PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
}

function assertConfigured() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET')
  }
}

let cachedToken: { accessToken: string; expiresAtMs: number } | null = null

async function getAccessToken(): Promise<string> {
  assertConfigured()

  const now = Date.now()
  if (cachedToken && cachedToken.expiresAtMs - now > 30_000) {
    return cachedToken.accessToken
  }

  const baseUrl = getBaseUrl()
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

  const r = await axios.post(
    `${baseUrl}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10_000,
    }
  )

  const accessToken = r.data?.access_token
  const expiresIn = Number(r.data?.expires_in || 0)
  if (!accessToken || !expiresIn) {
    throw new Error('PayPal auth failed: missing access_token')
  }

  cachedToken = {
    accessToken,
    expiresAtMs: now + expiresIn * 1000,
  }

  return accessToken
}

export type PayPalCreateOrderResult = {
  id: string
  approveUrl: string
}

export async function createPayPalOrder(params: {
  amount: number
  currency?: string
  returnUrl: string
  cancelUrl: string
  customId?: string
  description?: string
}): Promise<PayPalCreateOrderResult> {
  try {
    assertConfigured()

    const currency = (params.currency || 'USD').toUpperCase()
    
    // Validate amount
    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      throw new Error('Invalid amount: must be positive number')
    }
    
    // PayPal minimum amounts by currency
    const minAmounts: Record<string, number> = {
      'USD': 0.01,
      'EUR': 0.01,
      'GBP': 0.01,
      'CAD': 0.01,
      'AUD': 0.01
    }
    
    const minAmount = minAmounts[currency] || 1.00
    if (params.amount < minAmount) {
      throw new Error(`Amount too small: minimum ${minAmount} ${currency}`)
    }

    const token = await getAccessToken()
    const baseUrl = getBaseUrl()

    // Validate URLs
    if (!params.returnUrl || !params.returnUrl.startsWith('http')) {
      throw new Error(`Invalid return_url: ${params.returnUrl}`)
    }
    if (!params.cancelUrl || !params.cancelUrl.startsWith('http')) {
      throw new Error(`Invalid cancel_url: ${params.cancelUrl}`)
    }

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: params.amount.toFixed(2),
          },
          custom_id: params.customId,
          description: params.description || 'Syntrix Deposit',
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        brand_name: 'Syntrix',
        landing_page: 'LOGIN'
      },
    }

    console.log('PayPal Order Request:', JSON.stringify({
      env: PAYPAL_ENV,
      baseUrl,
      amount: params.amount,
      currency,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl
    }, null, 2))

    const r = await axios.post(`${baseUrl}/v2/checkout/orders`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    })

    const id = r.data?.id
    const approveUrl = (r.data?.links || []).find((l: any) => l?.rel === 'approve')?.href
    if (!id || !approveUrl) {
      throw new Error('PayPal order creation failed')
    }

    return { id, approveUrl }
  } catch (error: any) {
    // Log PayPal-specific error details
    if (error.response?.data) {
      const paypalError = error.response.data
      console.error('❌ PayPal createOrder Error:', {
        status: error.response.status,
        name: paypalError.name,
        message: paypalError.message,
        debug_id: paypalError.debug_id,
        details: JSON.stringify(paypalError.details, null, 2),
        'paypal-debug-id': error.response.headers?.['paypal-debug-id']
      })
      
      // Throw more descriptive error
      const errorDetails = paypalError.details?.[0]
      if (errorDetails) {
        throw new Error(`PayPal Error: ${errorDetails.issue || paypalError.message} - ${errorDetails.description || ''}`.trim())
      }
      throw new Error(`PayPal Error: ${paypalError.message || 'Unknown error'}`)
    }
    throw error
  }
}

export type PayPalCaptureResult = {
  id: string
  status: string
  payerEmail?: string
  amountValue?: number
  currency?: string
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  try {
    assertConfigured()
    if (!orderId) throw new Error('Missing orderId')

    const token = await getAccessToken()
    const baseUrl = getBaseUrl()

    const r = await axios.post(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    })

    const status = r.data?.status
    const payerEmail = r.data?.payer?.email_address

    // Attempt to read captured amount
    const pu = r.data?.purchase_units?.[0]
    const capture = pu?.payments?.captures?.[0]
    const amountValue = capture?.amount?.value ? Number(capture.amount.value) : undefined
    const currency = capture?.amount?.currency_code

    return {
      id: r.data?.id || orderId,
      status: status || 'UNKNOWN',
      payerEmail,
      amountValue,
      currency,
    }
  } catch (error: any) {
    // Log PayPal-specific error details
    if (error.response?.data) {
      const paypalError = error.response.data
      console.error('PayPal captureOrder Error:', {
        name: paypalError.name,
        message: paypalError.message,
        debug_id: paypalError.debug_id,
        details: paypalError.details,
        'paypal-debug-id': error.response.headers?.['paypal-debug-id']
      })
    }
    throw error
  }
}

export type PayPalPayoutResult = {
  batchId: string
  batchStatus?: string
}

export async function createPayPalPayout(params: {
  receiverEmail: string
  amount: number
  currency?: string
  note?: string
  senderItemId?: string
}): Promise<PayPalPayoutResult> {
  try {
    assertConfigured()

    const currency = (params.currency || 'USD').toUpperCase()
    if (!params.receiverEmail || !params.receiverEmail.includes('@')) {
      throw new Error('Invalid PayPal receiver email')
    }
    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      throw new Error('Invalid payout amount')
    }

    const token = await getAccessToken()
    const baseUrl = getBaseUrl()

    const body = {
      sender_batch_header: {
        sender_batch_id: params.senderItemId || `syntrix_${Date.now()}`,
        email_subject: 'Syntrix payout',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: params.amount.toFixed(2),
            currency,
          },
          receiver: params.receiverEmail,
          note: params.note || 'Withdrawal payout',
          sender_item_id: params.senderItemId || `item_${Date.now()}`,
        },
      ],
    }

    const r = await axios.post(`${baseUrl}/v1/payments/payouts`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    })

    const batchId = r.data?.batch_header?.payout_batch_id
    const batchStatus = r.data?.batch_header?.batch_status
    if (!batchId) {
      throw new Error('PayPal payout creation failed')
    }

    return { batchId, batchStatus }
  } catch (error: any) {
    // Log PayPal-specific error details
    if (error.response?.data) {
      const paypalError = error.response.data
      console.error('PayPal createPayout Error:', {
        name: paypalError.name,
        message: paypalError.message,
        debug_id: paypalError.debug_id,
        details: paypalError.details,
        'paypal-debug-id': error.response.headers?.['paypal-debug-id']
      })
    }
    throw error
  }
}
