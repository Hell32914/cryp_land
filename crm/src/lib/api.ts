const rawApiUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_URL
const API_BASE_URL = (rawApiUrl && rawApiUrl.replace(/\/$/, '')) || 'http://localhost:3001'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {

  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = (data && data.error) || response.statusText || 'Request failed'
    throw new ApiError(message, response.status)
  }

  return (data ?? {}) as T
}

export interface KPIResponse {
  totalUsers: number
  totalBalance: number
  depositsToday: number
  withdrawalsToday: number
  profitPeriod: number
}

export interface FinancialPoint {
  date: string
  deposits: number
  withdrawals: number
  profit: number
}

export interface GeoEntry {
  country: string
  userCount: number
  percentage: number
}

export interface OverviewResponse {
  kpis: KPIResponse
  financialData: FinancialPoint[]
  geoData: GeoEntry[]
  generatedAt: string
}

export interface UserRecord {
  id: number
  telegramId: string
  username: string | null
  fullName: string
  country: string
  status: string
  plan: string
  balance: number
  profit: number
  totalDeposit: number
  totalWithdraw: number
  kycRequired: boolean
  isBlocked: boolean
  role: string
  createdAt: string
  updatedAt: string
}

export interface UsersResponse {
  users: UserRecord[]
  count: number
}

export interface DepositRecord {
  id: number
  status: string
  amount: number
  currency: string
  network?: string | null
  txHash?: string | null
  createdAt: string
  user: UserRecord
}

export interface WithdrawalRecord {
  id: number
  status: string
  amount: number
  currency: string
  network?: string | null
  address: string
  txHash?: string | null
  createdAt: string
  user: UserRecord
}

export interface ExpenseRecord {
  id: number
  category: string
  comment: string
  amount: number
  createdAt: string
}

export interface ExpensesResponse {
  expenses: ExpenseRecord[]
  totalAmount: number
}

export interface ReferralRecord {
  id: number
  level: number
  earnings: number
  createdAt: string
  referrer: UserRecord
  referredUser: UserRecord
}

export interface ReferralsResponse {
  referrals: ReferralRecord[]
}

export const adminLogin = async (username: string, password: string) =>
  request<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const fetchOverview = (token: string) =>
  request<OverviewResponse>('/api/admin/overview', {}, token)

export const fetchUsers = (token: string, search?: string) => {
  const params = new URLSearchParams()
  if (search) {
    params.set('search', search)
  }
  const query = params.toString()
  return request<UsersResponse>(`/api/admin/users${query ? `?${query}` : ''}`, {}, token)
}

export const fetchDeposits = (token: string) =>
  request<{ deposits: DepositRecord[] }>('/api/admin/deposits', {}, token)

export const fetchWithdrawals = (token: string) =>
  request<{ withdrawals: WithdrawalRecord[] }>('/api/admin/withdrawals', {}, token)

export const fetchExpenses = (token: string) =>
  request<ExpensesResponse>('/api/admin/expenses', {}, token)

export const createExpense = (token: string, data: { category: string; comment: string; amount: number }) =>
  request<ExpenseRecord>(
    '/api/admin/expenses',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  )

export const fetchReferrals = (token: string) =>
  request<ReferralsResponse>('/api/admin/referrals', {}, token)

// Marketing Links
export interface MarketingLink {
  linkId: string
  source: string
  clicks: number
  conversions: number
  conversionRate: string
  isActive: boolean
  createdAt: string
}

export interface MarketingSource {
  source: string
  users: number
  deposits: number
  revenue: number
}

export interface MarketingStatsResponse {
  sources: MarketingSource[]
  links: MarketingLink[]
}

export const createMarketingLink = (token: string, data: { source: string; utmParams?: Record<string, string> }) =>
  request<MarketingLink>('/api/admin/marketing-links', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token)

export const fetchMarketingLinks = (token: string) =>
  request<{ links: MarketingLink[] }>('/api/admin/marketing-links', {}, token)

export const fetchMarketingStats = (token: string) =>
  request<MarketingStatsResponse>('/api/admin/marketing-stats', {}, token)

export const toggleMarketingLink = (token: string, linkId: string, isActive: boolean) =>
  request<MarketingLink>(`/api/admin/marketing-links/${linkId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  }, token)

export const deleteMarketingLink = (token: string, linkId: string) =>
  request<{ success: boolean }>(`/api/admin/marketing-links/${linkId}`, {
    method: 'DELETE',
  }, token)

export const updateUserRole = (token: string, telegramId: string, role: string) =>
  request<UserRecord>(`/api/admin/users/${telegramId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token)