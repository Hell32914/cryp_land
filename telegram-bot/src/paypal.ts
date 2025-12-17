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
  assertConfigured()

  const currency = (params.currency || 'USD').toUpperCase()
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error('Invalid amount')
  }

  const token = await getAccessToken()
  const baseUrl = getBaseUrl()

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
    },
  }

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
}

export type PayPalCaptureResult = {
  id: string
  status: string
  payerEmail?: string
  amountValue?: number
  currency?: string
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
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
}
