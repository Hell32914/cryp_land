const API_BASE_URL = 'https://api.syntrix.website';

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

async function requestFormData<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
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
  depositsPeriod: number
  withdrawalsPeriod: number
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
  ftdCount: number
  conversionRate: number
  totalDeposits: number
  totalWithdrawals: number
  totalProfit: number
  topDepositors: Array<{
    telegramId: string
    username: string | null
    fullName: string
    totalDeposit: number
  }>
}

export interface OverviewResponse {
  kpis: KPIResponse
  financialData: FinancialPoint[]
  geoData: GeoEntry[]
  generatedAt: string
  topUsers: Array<{
    telegramId: number
    username: string | null
    fullName: string
    balance: number
    totalDeposit: number
  }>
  transactionStats: {
    totalDeposits: number
    depositsCount: number
    totalWithdrawals: number
    withdrawalsCount: number
    totalReinvest: number
    reinvestCount: number
  }
  period: {
    from: string
    to: string
  } | null
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
  botStartedAt?: string | null
  // New fields
  comment: string | null
  currentProfit: number
  totalProfit: number
  remainingBalance: number
  referralCount: number
  referredBy: string | null
  withdrawalStatus: 'allowed' | 'blocked' | 'verification'
  firstDepositAmount: number
  languageCode: string | null
  marketingSource: string | null
  utmParams: string | null
  // Marketing link info
  trafficerName: string | null
  linkName: string | null
  linkId: string | null
}

export interface UsersResponse {
  users: UserRecord[]
  count: number
  totalCount: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface DepositRecord {
  id: number
  status: string
  paymentMethod?: string
  amount: number
  currency: string
  network?: string | null
  txHash?: string | null
  createdAt: string
  user: UserRecord
  depStatus: 'processing' | 'paid' | 'failed'
  leadStatus: 'FTD' | 'withdraw' | 'reinvest' | 'active'
  trafficSource: string | null
  referralLink: string | null
  trafficerName: string | null
  linkName: string | null
}

export interface DepositsResponse {
  deposits: DepositRecord[]
  count: number
  totalCount: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
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

// ============= SUPPORT (CRM INBOX) =============
export interface SupportChatRecord {
  id: number
  telegramId: string
  chatId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  startedAt: string
  lastMessageAt: string | null
  lastMessageText: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface SupportMessageRecord {
  id: number
  supportChatId: number
  direction: 'IN' | 'OUT' | string
  kind?: 'TEXT' | 'PHOTO' | string
  text: string | null
  fileId?: string | null
  adminUsername: string | null
  createdAt: string
}

export interface SupportChatsResponse {
  chats: SupportChatRecord[]
  page: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface SupportMessagesResponse {
  chat: SupportChatRecord
  messages: SupportMessageRecord[]
  hasMore: boolean
  nextBeforeId: number | null
}

export const adminLogin = async (username: string, password: string) =>
  request<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const fetchOverview = (token: string, from?: string, to?: string) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return request<OverviewResponse>(`/api/admin/overview${query ? `?${query}` : ''}`, {}, token)
}

export const fetchUsers = (token: string, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', page?: number) => {
  const params = new URLSearchParams()
  if (search) {
    params.set('search', search)
  }
  if (sortBy) {
    params.set('sortBy', sortBy)
  }
  if (sortOrder) {
    params.set('sortOrder', sortOrder)
  }
  if (page) {
    params.set('page', String(page))
  }
  const query = params.toString()
  return request<UsersResponse>(`/api/admin/users${query ? `?${query}` : ''}`, {}, token)
}

export const fetchDeposits = (token: string, opts?: { page?: number; limit?: number; search?: string }) => {
  const params = new URLSearchParams()
  if (opts?.page) params.set('page', String(opts.page))
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.search) params.set('search', String(opts.search))
  const query = params.toString()
  return request<DepositsResponse>(`/api/admin/deposits${query ? `?${query}` : ''}`, {}, token)
}

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
  domain?: string
  linkUrl?: string
  channelInviteLink?: string | null
  clicks: number
  conversions: number
  conversionRate: string
  isActive: boolean
  createdAt: string
  trackingPixel?: string | null
  // Extended metrics
  ownerName?: string
  linkName?: string
  trafficerName?: string
  stream?: string
  geo?: string
  creative?: string
  leadsToday: number
  leadsWeek: number
  totalLeads: number
  usersToday: number
  usersWeek: number
  totalUsers: number
  ftdCount: number
  depositConversionRate: number
  totalDeposits: number
  totalDepositAmount: number
  totalWithdrawalAmount: number
  totalProfit: number
  trafficCost: number
  cfpd: number // Cost per First Deposit
  roi: number // Return on Investment %
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

export const createMarketingLink = (token: string, data: { 
  source: string
  utmParams?: Record<string, string>
  trafficerName?: string
  stream?: string
  geo?: string
  creative?: string
  language?: string
  domain?: string
  trackingPixel?: string
}) =>
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

export const generateChannelInviteLink = (token: string, linkId: string) =>
  request<{ inviteLink: string; link: MarketingLink }>(`/api/admin/marketing-links/${linkId}/channel-invite`, {
    method: 'POST',
  }, token)

export const deleteMarketingLink = (token: string, linkId: string) =>
  request<{ success: boolean }>(`/api/admin/marketing-links/${linkId}`, {
    method: 'DELETE',
  }, token)

export const updateLinkTrafficCost = (token: string, linkId: string, trafficCost: number) =>
  request<{ success: boolean; link: MarketingLink }>(`/api/admin/marketing-links/${linkId}/traffic-cost`, {
    method: 'PATCH',
    body: JSON.stringify({ trafficCost }),
  }, token)

export const updateUserRole = (token: string, telegramId: string, role: string) =>
  request<UserRecord>(`/api/admin/users/${telegramId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token)

export const deleteUser = (token: string, telegramId: string) =>
  request<{ success: boolean }>(`/api/admin/users/${telegramId}`, {
    method: 'DELETE',
  }, token)

export const activateContactSupport = (token: string, telegramId: string, bonusAmount: number, timerMinutes: number) =>
  request<UserRecord>(`/api/admin/users/${telegramId}/contact-support`, {
    method: 'POST',
    body: JSON.stringify({ bonusAmount, timerMinutes }),
  }, token)

// Support inbox
export const fetchSupportChats = (token: string, search?: string, page?: number, limit?: number) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  return request<SupportChatsResponse>(`/api/admin/support/chats${query ? `?${query}` : ''}`, {}, token)
}

export const fetchSupportMessages = (token: string, chatId: string, opts?: { beforeId?: number; limit?: number }) => {
  const params = new URLSearchParams()
  if (opts?.beforeId) params.set('beforeId', String(opts.beforeId))
  if (opts?.limit) params.set('limit', String(opts.limit))
  const query = params.toString()
  return request<SupportMessagesResponse>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/messages${query ? `?${query}` : ''}`, {}, token)
}

export const markSupportChatRead = (token: string, chatId: string) =>
  request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/read`, { method: 'POST' }, token)

export const sendSupportMessage = (token: string, chatId: string, text: string) =>
  request<SupportMessageRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  }, token)

export const sendSupportPhoto = async (token: string, chatId: string, file: File, caption?: string) => {
  const form = new FormData()
  form.append('photo', file)
  if (caption) form.append('caption', caption)
  return requestFormData<SupportMessageRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/photos`, form, token)
}

export const fetchSupportFileBlob = async (token: string, fileId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/support/files/${encodeURIComponent(fileId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    let message = response.statusText
    try {
      const data = text ? JSON.parse(text) : null
      message = (data && data.error) || message
    } catch {
      // ignore
    }
    throw new ApiError(message || 'Request failed', response.status)
  }

  return response.blob()
}