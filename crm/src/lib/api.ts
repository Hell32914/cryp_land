import { decodeJwtClaims, normalizeCrmRole } from '@/lib/jwt'

const API_BASE_URL = 'https://api.syntrix.website';

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const isTesterToken = (token?: string) => normalizeCrmRole(decodeJwtClaims(token).role) === 'tester'

function emitUnauthorized() {
  try {
    window.dispatchEvent(new Event('syntrix:unauthorized'))
  } catch {
    // ignore
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
  let data: any = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    if (response.status === 401) emitUnauthorized()
    const message = (data && data.error) || text || response.statusText || 'Request failed'
    throw new ApiError(message, response.status)
  }

  // If backend returned a non-JSON body on success, avoid crashing the app.
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
  let data: any = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    if (response.status === 401) emitUnauthorized()
    const message = (data && data.error) || text || response.statusText || 'Request failed'
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
  status?: string | null
  acceptedBy?: string | null
  acceptedAt?: string | null
  funnelStageId?: string | null
  archivedAt?: string | null
  isBlocked?: boolean | null
  blockedAt?: string | null
  blockedBy?: string | null
  lastInboundAt?: string | null
  lastOutboundAt?: string | null
  startedAt: string
  lastMessageAt: string | null
  lastMessageText: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface SupportBroadcastRecord {
  id: number
  adminUsername: string
  target: 'ALL' | 'STAGE'
  stageId: string | null
  text: string
  hasPhoto?: boolean
  photoFileName?: string | null
  photoMimeType?: string | null
  status: 'PENDING' | 'RUNNING' | 'CANCELLED' | 'COMPLETED' | 'FAILED'
  totalRecipients: number
  sentCount: number
  failedCount: number
  startedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  deletedAt?: string | null
  deletedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface SupportBroadcastsResponse {
  broadcasts: SupportBroadcastRecord[]
}

export interface CrmOperatorRecord {
  id: number
  username: string
  role?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CrmOperatorsResponse {
  operators: CrmOperatorRecord[]
}

export interface SupportMessageRecord {
  id: number
  supportChatId: number
  direction: 'IN' | 'OUT' | string
  kind?: 'TEXT' | 'PHOTO' | string
  text: string | null
  replyToId?: number | null
  replyTo?: {
    id: number
    direction: 'IN' | 'OUT' | string
    kind?: 'TEXT' | 'PHOTO' | string
    text: string | null
    fileId?: string | null
    adminUsername: string | null
    createdAt: string
  } | null
  fileId?: string | null
  adminUsername: string | null
  userSeenAt?: string | null
  userSeenTelegramId?: string | null
  createdAt: string
}

export interface SupportNoteRecord {
  id: number
  supportChatId: number
  text: string
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

export interface SupportNotesResponse {
  notes: SupportNoteRecord[]
}

const MOCK_NOW = new Date()
const isoDaysAgo = (days: number) => new Date(MOCK_NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

const MOCK_USERS: UserRecord[] = [
  {
    id: 1,
    telegramId: '10001',
    username: 'test_user',
    fullName: 'Test User',
    country: 'United States',
    status: 'ACTIVE',
    plan: 'VIP',
    balance: 1240,
    profit: 240,
    totalDeposit: 5200,
    totalWithdraw: 800,
    kycRequired: false,
    isBlocked: false,
    role: 'user',
    createdAt: isoDaysAgo(120),
    updatedAt: isoDaysAgo(1),
    botStartedAt: isoDaysAgo(119),
    comment: 'Test account for QA',
    currentProfit: 80,
    totalProfit: 240,
    remainingBalance: 960,
    referralCount: 3,
    referredBy: 'tester',
    withdrawalStatus: 'allowed',
    firstDepositAmount: 500,
    languageCode: 'en',
    marketingSource: 'telegram',
    utmParams: 'utm_source=telegram&utm_campaign=qa',
    trafficerName: 'QA Team',
    linkName: 'QA Link A',
    linkId: 'QA-001',
  },
  {
    id: 2,
    telegramId: '10002',
    username: 'demo_trader',
    fullName: 'Demo Trader',
    country: 'Canada',
    status: 'ACTIVE',
    plan: 'Standard',
    balance: 780,
    profit: 120,
    totalDeposit: 1800,
    totalWithdraw: 200,
    kycRequired: true,
    isBlocked: false,
    role: 'user',
    createdAt: isoDaysAgo(45),
    updatedAt: isoDaysAgo(2),
    botStartedAt: isoDaysAgo(44),
    comment: 'Demo profile',
    currentProfit: 40,
    totalProfit: 120,
    remainingBalance: 740,
    referralCount: 1,
    referredBy: 'qa_link',
    withdrawalStatus: 'verification',
    firstDepositAmount: 200,
    languageCode: 'en',
    marketingSource: 'instagram',
    utmParams: 'utm_source=instagram&utm_campaign=qa',
    trafficerName: 'QA Team',
    linkName: 'QA Link B',
    linkId: 'QA-002',
  },
  {
    id: 3,
    telegramId: '10003',
    username: 'sample_user',
    fullName: 'Sample User',
    country: 'Germany',
    status: 'PENDING',
    plan: 'Starter',
    balance: 320,
    profit: 24,
    totalDeposit: 600,
    totalWithdraw: 0,
    kycRequired: false,
    isBlocked: false,
    role: 'user',
    createdAt: isoDaysAgo(15),
    updatedAt: isoDaysAgo(1),
    botStartedAt: isoDaysAgo(14),
    comment: 'Sandbox record',
    currentProfit: 8,
    totalProfit: 24,
    remainingBalance: 312,
    referralCount: 0,
    referredBy: null,
    withdrawalStatus: 'allowed',
    firstDepositAmount: 150,
    languageCode: 'de',
    marketingSource: 'google',
    utmParams: 'utm_source=google&utm_campaign=qa',
    trafficerName: 'QA Team',
    linkName: 'QA Link C',
    linkId: 'QA-003',
  },
]

const MOCK_OVERVIEW: OverviewResponse = {
  kpis: {
    totalUsers: 1280,
    totalBalance: 240_000,
    depositsToday: 12_400,
    withdrawalsToday: 4_200,
    profitPeriod: 18_600,
    depositsPeriod: 86_000,
    withdrawalsPeriod: 32_500,
  },
  financialData: Array.from({ length: 7 }).map((_, idx) => ({
    date: isoDaysAgo(6 - idx),
    deposits: 8000 + idx * 1200,
    withdrawals: 3000 + idx * 700,
    profit: 2000 + idx * 400,
  })),
  geoData: [
    {
      country: 'United States',
      userCount: 520,
      percentage: 40.6,
      ftdCount: 120,
      conversionRate: 23.1,
      totalDeposits: 480,
      totalWithdrawals: 210,
      totalProfit: 68_000,
      topDepositors: [
        {
          telegramId: '10001',
          username: 'test_user',
          fullName: 'Test User',
          totalDeposit: 5200,
        },
      ],
    },
    {
      country: 'Canada',
      userCount: 240,
      percentage: 18.7,
      ftdCount: 60,
      conversionRate: 25,
      totalDeposits: 210,
      totalWithdrawals: 90,
      totalProfit: 28_000,
      topDepositors: [
        {
          telegramId: '10002',
          username: 'demo_trader',
          fullName: 'Demo Trader',
          totalDeposit: 1800,
        },
      ],
    },
    {
      country: 'Germany',
      userCount: 180,
      percentage: 14.1,
      ftdCount: 42,
      conversionRate: 23.3,
      totalDeposits: 140,
      totalWithdrawals: 55,
      totalProfit: 15_000,
      topDepositors: [
        {
          telegramId: '10003',
          username: 'sample_user',
          fullName: 'Sample User',
          totalDeposit: 600,
        },
      ],
    },
  ],
  generatedAt: MOCK_NOW.toISOString(),
  topUsers: [
    {
      telegramId: 10001,
      username: 'test_user',
      fullName: 'Test User',
      balance: 1240,
      totalDeposit: 5200,
    },
    {
      telegramId: 10002,
      username: 'demo_trader',
      fullName: 'Demo Trader',
      balance: 780,
      totalDeposit: 1800,
    },
  ],
  transactionStats: {
    totalDeposits: 186,
    depositsCount: 360,
    totalWithdrawals: 74,
    withdrawalsCount: 142,
    totalReinvest: 24,
    reinvestCount: 54,
  },
  period: {
    from: isoDaysAgo(30),
    to: MOCK_NOW.toISOString(),
  },
}

const MOCK_DEPOSITS: DepositRecord[] = [
  {
    id: 9001,
    status: 'COMPLETED',
    paymentMethod: 'PAYPAL',
    amount: 520,
    currency: 'USD',
    network: null,
    txHash: null,
    createdAt: isoDaysAgo(1),
    user: MOCK_USERS[0],
    depStatus: 'paid',
    leadStatus: 'FTD',
    trafficSource: 'telegram',
    referralLink: 'https://syntrix.website/?ref=QA-001',
    trafficerName: 'QA Team',
    linkName: 'QA Link A',
  },
  {
    id: 9002,
    status: 'PENDING',
    paymentMethod: 'OXAPAY',
    amount: 250,
    currency: 'USDT',
    network: 'TRC20',
    txHash: '0xqa0001',
    createdAt: isoDaysAgo(2),
    user: MOCK_USERS[1],
    depStatus: 'processing',
    leadStatus: 'active',
    trafficSource: 'instagram',
    referralLink: 'https://syntrix.website/?ref=QA-002',
    trafficerName: 'QA Team',
    linkName: 'QA Link B',
  },
  {
    id: 9003,
    status: 'FAILED',
    paymentMethod: 'OXAPAY',
    amount: 140,
    currency: 'USDT',
    network: 'ERC20',
    txHash: '0xqa0002',
    createdAt: isoDaysAgo(3),
    user: MOCK_USERS[2],
    depStatus: 'failed',
    leadStatus: 'reinvest',
    trafficSource: 'google',
    referralLink: 'https://syntrix.website/?ref=QA-003',
    trafficerName: 'QA Team',
    linkName: 'QA Link C',
  },
]

const MOCK_DEPOSITS_RESPONSE: DepositsResponse = {
  deposits: MOCK_DEPOSITS,
  count: MOCK_DEPOSITS.length,
  totalCount: MOCK_DEPOSITS.length,
  page: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
}

const MOCK_WITHDRAWALS: WithdrawalRecord[] = [
  {
    id: 7001,
    status: 'PROCESSING',
    amount: 320,
    currency: 'USDT',
    network: 'TRC20',
    address: 'TQATestAddress01',
    txHash: null,
    createdAt: isoDaysAgo(1),
    user: MOCK_USERS[0],
  },
  {
    id: 7002,
    status: 'COMPLETED',
    amount: 180,
    currency: 'BTC',
    network: 'BTC',
    address: 'bc1qtestaddress',
    txHash: '0xqa0003',
    createdAt: isoDaysAgo(4),
    user: MOCK_USERS[1],
  },
]

const MOCK_EXPENSES: ExpenseRecord[] = [
  {
    id: 3001,
    category: 'Marketing',
    comment: 'Test campaign spend',
    amount: 1200,
    createdAt: isoDaysAgo(5),
  },
  {
    id: 3002,
    category: 'Operations',
    comment: 'Sandbox hosting',
    amount: 450,
    createdAt: isoDaysAgo(2),
  },
]

const MOCK_EXPENSES_RESPONSE: ExpensesResponse = {
  expenses: MOCK_EXPENSES,
  totalAmount: MOCK_EXPENSES.reduce((sum, item) => sum + item.amount, 0),
}

const MOCK_MARKETING_LINKS: MarketingLink[] = [
  {
    linkId: 'QA-001',
    source: 'telegram',
    domain: 'syntrix.website',
    linkUrl: 'https://syntrix.website/?ref=QA-001',
    channelInviteLink: null,
    clicks: 1420,
    conversions: 64,
    conversionRate: '4.5%',
    isActive: true,
    createdAt: isoDaysAgo(20),
    trackingPixel: '<script>/* QA pixel */</script>',
    ownerName: 'QA Team',
    linkName: 'QA Link A',
    trafficerName: 'QA Team',
    stream: 'stream-a',
    geo: 'US',
    creative: 'banner-a',
    leadsToday: 8,
    leadsWeek: 42,
    totalLeads: 220,
    channelLeads: 34,
    usersToday: 3,
    usersWeek: 16,
    totalUsers: 86,
    ftdCount: 30,
    depositConversionRate: 35.0,
    totalDeposits: 110,
    totalDepositAmount: 18_600,
    totalWithdrawalAmount: 6_200,
    totalProfit: 12_400,
    trafficCost: 2100,
    cfpd: 70,
    roi: 45.2,
  },
  {
    linkId: 'QA-002',
    source: 'instagram',
    domain: 'trade.syntrix.website',
    linkUrl: 'https://trade.syntrix.website/?ref=QA-002',
    channelInviteLink: null,
    clicks: 980,
    conversions: 40,
    conversionRate: '4.1%',
    isActive: false,
    createdAt: isoDaysAgo(12),
    trackingPixel: null,
    ownerName: 'QA Team',
    linkName: 'QA Link B',
    trafficerName: 'QA Team',
    stream: 'stream-b',
    geo: 'CA',
    creative: 'banner-b',
    leadsToday: 4,
    leadsWeek: 18,
    totalLeads: 140,
    channelLeads: 22,
    usersToday: 2,
    usersWeek: 9,
    totalUsers: 54,
    ftdCount: 18,
    depositConversionRate: 28.5,
    totalDeposits: 68,
    totalDepositAmount: 9_400,
    totalWithdrawalAmount: 2_900,
    totalProfit: 6_100,
    trafficCost: 1200,
    cfpd: 66.7,
    roi: 28.4,
  },
]

const MOCK_MARKETING_STATS: MarketingStatsResponse = {
  sources: [
    { source: 'telegram', users: 86, deposits: 110, revenue: 12_400 },
    { source: 'instagram', users: 54, deposits: 68, revenue: 6_100 },
  ],
  links: MOCK_MARKETING_LINKS,
}

const MOCK_SUPPORT_CHATS: SupportChatRecord[] = [
  {
    id: 501,
    telegramId: '20001',
    chatId: '20001',
    username: 'qa_alex',
    firstName: 'Alex',
    lastName: 'Test',
    status: 'NEW',
    acceptedBy: null,
    acceptedAt: null,
    funnelStageId: 'primary',
    archivedAt: null,
    isBlocked: false,
    blockedAt: null,
    blockedBy: null,
    lastInboundAt: isoDaysAgo(1),
    lastOutboundAt: null,
    startedAt: isoDaysAgo(3),
    lastMessageAt: isoDaysAgo(1),
    lastMessageText: 'Hello, I need help with the demo flow.',
    unreadCount: 2,
    createdAt: isoDaysAgo(3),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: 502,
    telegramId: '20002',
    chatId: '20002',
    username: 'qa_nina',
    firstName: 'Nina',
    lastName: 'QA',
    status: 'ACCEPTED',
    acceptedBy: 'tester',
    acceptedAt: isoDaysAgo(2),
    funnelStageId: 'in-process',
    archivedAt: null,
    isBlocked: false,
    blockedAt: null,
    blockedBy: null,
    lastInboundAt: isoDaysAgo(2),
    lastOutboundAt: isoDaysAgo(2),
    startedAt: isoDaysAgo(6),
    lastMessageAt: isoDaysAgo(2),
    lastMessageText: 'Thanks, the issue is resolved.',
    unreadCount: 0,
    createdAt: isoDaysAgo(6),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: 503,
    telegramId: '20003',
    chatId: '20003',
    username: 'qa_bot',
    firstName: 'Sam',
    lastName: 'Tester',
    status: 'ARCHIVE',
    acceptedBy: 'tester',
    acceptedAt: isoDaysAgo(10),
    funnelStageId: 'deposit',
    archivedAt: isoDaysAgo(7),
    isBlocked: false,
    blockedAt: null,
    blockedBy: null,
    lastInboundAt: isoDaysAgo(7),
    lastOutboundAt: isoDaysAgo(7),
    startedAt: isoDaysAgo(12),
    lastMessageAt: isoDaysAgo(7),
    lastMessageText: 'Closing the chat now.',
    unreadCount: 0,
    createdAt: isoDaysAgo(12),
    updatedAt: isoDaysAgo(7),
  },
]

const MOCK_SUPPORT_MESSAGES: Record<string, SupportMessageRecord[]> = {
  '20001': [
    {
      id: 1001,
      supportChatId: 501,
      direction: 'IN',
      kind: 'TEXT',
      text: 'Hello, I need help with the demo flow.',
      adminUsername: null,
      createdAt: isoDaysAgo(1),
    },
    {
      id: 1002,
      supportChatId: 501,
      direction: 'OUT',
      kind: 'TEXT',
      text: 'Sure! Can you describe the step where it fails?',
      adminUsername: 'tester',
      createdAt: isoDaysAgo(1),
    },
  ],
  '20002': [
    {
      id: 1101,
      supportChatId: 502,
      direction: 'IN',
      kind: 'TEXT',
      text: 'I can’t see the button in the demo.',
      adminUsername: null,
      createdAt: isoDaysAgo(2),
    },
    {
      id: 1102,
      supportChatId: 502,
      direction: 'OUT',
      kind: 'TEXT',
      text: 'Please refresh and try again, it should be visible now.',
      adminUsername: 'tester',
      createdAt: isoDaysAgo(2),
    },
  ],
  '20003': [
    {
      id: 1201,
      supportChatId: 503,
      direction: 'IN',
      kind: 'TEXT',
      text: 'All good, thanks!',
      adminUsername: null,
      createdAt: isoDaysAgo(7),
    },
  ],
}

const MOCK_SUPPORT_NOTES: SupportNoteRecord[] = [
  {
    id: 9001,
    supportChatId: 501,
    text: 'QA note: user testing onboarding.',
    adminUsername: 'tester',
    createdAt: isoDaysAgo(1),
  },
]

const MOCK_SUPPORT_BROADCASTS: SupportBroadcastRecord[] = [
  {
    id: 4001,
    adminUsername: 'tester',
    target: 'ALL',
    stageId: null,
    text: 'Test broadcast message',
    status: 'COMPLETED',
    totalRecipients: 120,
    sentCount: 120,
    failedCount: 0,
    startedAt: isoDaysAgo(5),
    completedAt: isoDaysAgo(5),
    cancelledAt: null,
    createdAt: isoDaysAgo(6),
    updatedAt: isoDaysAgo(5),
  },
]

const MOCK_OPERATORS: CrmOperatorRecord[] = [
  {
    id: 1,
    username: 'admin',
    role: 'admin',
    isActive: true,
    createdAt: isoDaysAgo(90),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: 2,
    username: 'support_qa',
    role: 'support',
    isActive: true,
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(3),
  },
  {
    id: 3,
    username: 'tester_qa',
    role: 'tester',
    isActive: true,
    createdAt: isoDaysAgo(10),
    updatedAt: isoDaysAgo(1),
  },
]

export const adminLogin = async (username: string, password: string) =>
  request<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const fetchOverview = (token: string, from?: string, to?: string) => {
  if (isTesterToken(token)) return Promise.resolve(MOCK_OVERVIEW)
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return request<OverviewResponse>(`/api/admin/overview${query ? `?${query}` : ''}`, {}, token)
}

export const fetchUsers = (token: string, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', page?: number) => {
  if (isTesterToken(token)) {
    return Promise.resolve({
      users: MOCK_USERS,
      count: MOCK_USERS.length,
      totalCount: MOCK_USERS.length,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    } as UsersResponse)
  }
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
  if (isTesterToken(token)) return Promise.resolve(MOCK_DEPOSITS_RESPONSE)
  const params = new URLSearchParams()
  if (opts?.page) params.set('page', String(opts.page))
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.search) params.set('search', String(opts.search))
  const query = params.toString()
  return request<DepositsResponse>(`/api/admin/deposits${query ? `?${query}` : ''}`, {}, token)
}

export const fetchWithdrawals = (token: string) =>
  isTesterToken(token)
    ? Promise.resolve({ withdrawals: MOCK_WITHDRAWALS })
    : request<{ withdrawals: WithdrawalRecord[] }>('/api/admin/withdrawals', {}, token)

export const fetchExpenses = (token: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_EXPENSES_RESPONSE)
    : request<ExpensesResponse>('/api/admin/expenses', {}, token)

export const createExpense = (token: string, data: { category: string; comment: string; amount: number }) =>
  isTesterToken(token)
    ? Promise.resolve({
        id: Date.now(),
        category: data.category,
        comment: data.comment,
        amount: data.amount,
        createdAt: new Date().toISOString(),
      } as ExpenseRecord)
    : request<ExpenseRecord>(
        '/api/admin/expenses',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token,
      )

export const fetchReferrals = (token: string) =>
  isTesterToken(token)
    ? Promise.resolve({
        referrals: [
          {
            id: 1,
            level: 1,
            earnings: 120,
            createdAt: isoDaysAgo(10),
            referrer: MOCK_USERS[0],
            referredUser: MOCK_USERS[1],
          },
        ],
      } as ReferralsResponse)
    : request<ReferralsResponse>('/api/admin/referrals', {}, token)

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
  channelLeads?: number
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
  isTesterToken(token)
    ? Promise.resolve((() => {
        const newId = `QA-${Date.now()}`
        const domain = (data.domain || 'syntrix.website').trim()
        const linkUrl = `https://${domain.replace(/^https?:\/\//i, '')}/?ref=${newId}`
        const base = MOCK_MARKETING_LINKS[0]
        return {
          ...base,
          linkId: newId,
          source: data.source,
          domain,
          linkUrl,
          trackingPixel: data.trackingPixel ?? base.trackingPixel,
          trafficerName: data.trafficerName ?? base.trafficerName,
          stream: data.stream ?? base.stream,
          geo: data.geo ?? base.geo,
          creative: data.creative ?? base.creative,
          createdAt: new Date().toISOString(),
          isActive: true,
        } as MarketingLink
      })())
    : request<MarketingLink>('/api/admin/marketing-links', {
        method: 'POST',
        body: JSON.stringify(data),
      }, token)

export const fetchMarketingLinks = (token: string) =>
  isTesterToken(token)
    ? Promise.resolve({ links: MOCK_MARKETING_LINKS })
    : request<{ links: MarketingLink[] }>('/api/admin/marketing-links', {}, token)

export const fetchMarketingStats = (token: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_MARKETING_STATS)
    : request<MarketingStatsResponse>('/api/admin/marketing-stats', {}, token)

export const toggleMarketingLink = (token: string, linkId: string, isActive: boolean) =>
  isTesterToken(token)
    ? Promise.resolve({
        ...(MOCK_MARKETING_LINKS.find((l) => l.linkId === linkId) || MOCK_MARKETING_LINKS[0]),
        isActive,
      })
    : request<MarketingLink>(`/api/admin/marketing-links/${linkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }, token)

export const generateChannelInviteLink = (token: string, linkId: string) =>
  isTesterToken(token)
    ? Promise.resolve((() => {
        const inviteLink = 'https://t.me/+QAInviteLink'
        const link = (MOCK_MARKETING_LINKS.find((l) => l.linkId === linkId) || MOCK_MARKETING_LINKS[0])
        return { inviteLink, link: { ...link, channelInviteLink: inviteLink } }
      })())
    : request<{ inviteLink: string; link: MarketingLink }>(`/api/admin/marketing-links/${linkId}/channel-invite`, {
        method: 'POST',
      }, token)

export const deleteMarketingLink = (token: string, linkId: string) =>
  isTesterToken(token)
    ? Promise.resolve({ success: true })
    : request<{ success: boolean }>(`/api/admin/marketing-links/${linkId}`, {
        method: 'DELETE',
      }, token)

export const updateLinkTrafficCost = (token: string, linkId: string, trafficCost: number) =>
  isTesterToken(token)
    ? Promise.resolve({
        success: true,
        link: {
          ...(MOCK_MARKETING_LINKS.find((l) => l.linkId === linkId) || MOCK_MARKETING_LINKS[0]),
          trafficCost,
        },
      })
    : request<{ success: boolean; link: MarketingLink }>(`/api/admin/marketing-links/${linkId}/traffic-cost`, {
        method: 'PATCH',
        body: JSON.stringify({ trafficCost }),
      }, token)

export const updateUserRole = (token: string, telegramId: string, role: string) =>
  isTesterToken(token)
    ? Promise.resolve({
        ...(MOCK_USERS.find((u) => u.telegramId === telegramId) || MOCK_USERS[0]),
        role,
      })
    : request<UserRecord>(`/api/admin/users/${telegramId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }, token)

export const deleteUser = (token: string, telegramId: string) =>
  isTesterToken(token)
    ? Promise.resolve({ success: true })
    : request<{ success: boolean }>(`/api/admin/users/${telegramId}`, {
        method: 'DELETE',
      }, token)

export const activateContactSupport = (token: string, telegramId: string, bonusAmount: number, timerMinutes: number) =>
  isTesterToken(token)
    ? Promise.resolve({
        ...(MOCK_USERS.find((u) => u.telegramId === telegramId) || MOCK_USERS[0]),
      })
    : request<UserRecord>(`/api/admin/users/${telegramId}/contact-support`, {
        method: 'POST',
        body: JSON.stringify({ bonusAmount, timerMinutes }),
      }, token)

// Support inbox
export const fetchSupportChats = (token: string, search?: string, page?: number, limit?: number) => {
  if (isTesterToken(token)) {
    const term = (search || '').trim().toLowerCase()
    const filtered = term
      ? MOCK_SUPPORT_CHATS.filter((chat) =>
          [
            chat.chatId,
            chat.telegramId,
            chat.username,
            chat.firstName,
            chat.lastName,
            chat.lastMessageText,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term)
        )
      : MOCK_SUPPORT_CHATS

    const pageSize = limit || 50
    const currentPage = page || 1
    const start = (currentPage - 1) * pageSize
    const slice = filtered.slice(start, start + pageSize)
    return Promise.resolve({
      chats: slice,
      page: currentPage,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      totalCount: filtered.length,
      hasNextPage: start + pageSize < filtered.length,
      hasPrevPage: currentPage > 1,
    } as SupportChatsResponse)
  }
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  return request<SupportChatsResponse>(`/api/admin/support/chats${query ? `?${query}` : ''}`, {}, token)
}

export const fetchSupportMessages = (token: string, chatId: string, opts?: { beforeId?: number; limit?: number }) => {
  if (isTesterToken(token)) {
    const all = MOCK_SUPPORT_MESSAGES[chatId] || []
    const beforeId = opts?.beforeId
    const filtered = Number.isFinite(beforeId) ? all.filter((m) => m.id < (beforeId as number)) : all
    const limited = opts?.limit ? filtered.slice(0, opts.limit) : filtered
    const chat = MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || {
      id: 0,
      telegramId: chatId,
      chatId,
      username: null,
      firstName: null,
      lastName: null,
      status: 'NEW',
      acceptedBy: null,
      acceptedAt: null,
      funnelStageId: null,
      archivedAt: null,
      isBlocked: false,
      blockedAt: null,
      blockedBy: null,
      lastInboundAt: null,
      lastOutboundAt: null,
      startedAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessageText: null,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return Promise.resolve({
      chat,
      messages: limited,
      hasMore: false,
      nextBeforeId: null,
    } as SupportMessagesResponse)
  }
  const params = new URLSearchParams()
  if (opts?.beforeId) params.set('beforeId', String(opts.beforeId))
  if (opts?.limit) params.set('limit', String(opts.limit))
  const query = params.toString()
  return request<SupportMessagesResponse>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/messages${query ? `?${query}` : ''}`, {}, token)
}

export const markSupportChatRead = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0])
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/read`, { method: 'POST' }, token)

export const markSupportChatUnread = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0])
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/unread`, { method: 'POST' }, token)

export const acceptSupportChat = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0])
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/accept`, { method: 'POST' }, token)

export const archiveSupportChat = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0])
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/archive`, { method: 'POST' }, token)

export const unarchiveSupportChat = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0])
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/unarchive`, { method: 'POST' }, token)

export const blockSupportChat = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0])
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/block`, { method: 'POST' }, token)

export const unblockSupportChat = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0])
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/unblock`, { method: 'POST' }, token)

export const sendSupportMessage = (token: string, chatId: string, text: string, opts?: { replyToId?: number | null }) =>
  isTesterToken(token)
    ? Promise.resolve({
        id: Date.now(),
        supportChatId: (MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId)?.id ?? 0),
        direction: 'OUT',
        kind: 'TEXT',
        text,
        replyToId: opts?.replyToId ?? null,
        adminUsername: 'tester',
        createdAt: new Date().toISOString(),
      } as SupportMessageRecord)
    : request<SupportMessageRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, ...(opts?.replyToId ? { replyToId: opts.replyToId } : {}) }),
      }, token)

export const sendSupportPhoto = async (token: string, chatId: string, file: File, caption?: string, opts?: { replyToId?: number | null }) => {
  if (isTesterToken(token)) {
    return Promise.resolve({
      id: Date.now(),
      supportChatId: (MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId)?.id ?? 0),
      direction: 'OUT',
      kind: 'PHOTO',
      text: caption || null,
      replyToId: opts?.replyToId ?? null,
      fileId: 'mock-photo-id',
      adminUsername: 'tester',
      createdAt: new Date().toISOString(),
    } as SupportMessageRecord)
  }
  const form = new FormData()
  form.append('photo', file)
  if (caption) form.append('caption', caption)
  if (opts?.replyToId) form.append('replyToId', String(opts.replyToId))
  return requestFormData<SupportMessageRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/photos`, form, token)
}

export const deleteSupportMessage = (token: string, chatId: string, messageId: number) =>
  isTesterToken(token)
    ? Promise.resolve({ success: true })
    : request<{ success: boolean }>(
        `/api/admin/support/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(String(messageId))}`,
        { method: 'DELETE' },
        token,
      )

export const setSupportChatStage = (token: string, chatId: string, stageId: string) =>
  isTesterToken(token)
    ? Promise.resolve({
        ...(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId) || MOCK_SUPPORT_CHATS[0]),
        funnelStageId: stageId,
      })
    : request<SupportChatRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/stage`, {
        method: 'POST',
        body: JSON.stringify({ stageId: String(stageId || '').trim() }),
      }, token)

export const createSupportBroadcast = (
  token: string,
  payload: { target: 'ALL' | 'STAGE'; stageId?: string; text?: string; photoFile?: File | null }
) => {
  if (isTesterToken(token)) {
    return Promise.resolve({
      id: Date.now(),
      adminUsername: 'tester',
      target: payload.target,
      stageId: payload.stageId || null,
      text: payload.text || '',
      hasPhoto: Boolean(payload.photoFile),
      status: 'COMPLETED',
      totalRecipients: 120,
      sentCount: 120,
      failedCount: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as SupportBroadcastRecord)
  }
  if (payload.photoFile) {
    const form = new FormData()
    form.append('target', payload.target)
    if (payload.stageId) form.append('stageId', payload.stageId)
    if (payload.text) form.append('text', payload.text)
    form.append('photo', payload.photoFile)
    return requestFormData<SupportBroadcastRecord>(`/api/admin/support/broadcasts`, form, token)
  }

  return request<SupportBroadcastRecord>(
    `/api/admin/support/broadcasts`,
    {
      method: 'POST',
      body: JSON.stringify({
        target: payload.target,
        stageId: payload.stageId,
        text: payload.text,
      }),
    },
    token,
  )
}

export const fetchSupportBroadcasts = (token: string) =>
  isTesterToken(token)
    ? Promise.resolve({ broadcasts: MOCK_SUPPORT_BROADCASTS })
    : request<SupportBroadcastsResponse>(`/api/admin/support/broadcasts`, {}, token)

export const cancelSupportBroadcast = (token: string, id: number) =>
  isTesterToken(token)
    ? Promise.resolve({ ...(MOCK_SUPPORT_BROADCASTS[0] || ({} as SupportBroadcastRecord)), status: 'CANCELLED' })
    : request<SupportBroadcastRecord>(`/api/admin/support/broadcasts/${id}/cancel`, { method: 'POST' }, token)

export const deleteSupportBroadcast = (token: string, id: number) =>
  isTesterToken(token)
    ? Promise.resolve({ success: true, deletedCount: 1, deleteFailedCount: 0, skippedCount: 0, total: 1 })
    : request<{ success: boolean; deletedCount: number; deleteFailedCount: number; skippedCount: number; total: number }>(
        `/api/admin/support/broadcasts/${id}/delete`,
        { method: 'POST' },
        token,
      )

// CRM operators (superadmin only)
export const fetchCrmOperators = (token: string) =>
  isTesterToken(token)
    ? Promise.resolve({ operators: MOCK_OPERATORS })
    : request<CrmOperatorsResponse>(`/api/admin/operators`, {}, token)

export const createCrmOperator = (token: string, payload: { username: string; password: string; role?: 'admin' | 'support' | 'tester' }) =>
  isTesterToken(token)
    ? Promise.resolve({
        id: Date.now(),
        username: payload.username,
        role: payload.role || 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CrmOperatorRecord)
    : request<CrmOperatorRecord>(`/api/admin/operators`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token)

export const setCrmOperatorRole = (token: string, id: number, role: 'admin' | 'support' | 'tester') =>
  isTesterToken(token)
    ? Promise.resolve({
        ...(MOCK_OPERATORS.find((op) => op.id === id) || MOCK_OPERATORS[0]),
        role,
        updatedAt: new Date().toISOString(),
      })
    : request<CrmOperatorRecord>(`/api/admin/operators/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }, token)

export const resetCrmOperatorPassword = (token: string, id: number, password: string) =>
  isTesterToken(token)
    ? Promise.resolve(MOCK_OPERATORS.find((op) => op.id === id) || MOCK_OPERATORS[0])
    : request<CrmOperatorRecord>(`/api/admin/operators/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }, token)

export const toggleCrmOperator = (token: string, id: number) =>
  isTesterToken(token)
    ? Promise.resolve({
        ...(MOCK_OPERATORS.find((op) => op.id === id) || MOCK_OPERATORS[0]),
        isActive: !(MOCK_OPERATORS.find((op) => op.id === id)?.isActive ?? true),
        updatedAt: new Date().toISOString(),
      })
    : request<CrmOperatorRecord>(`/api/admin/operators/${id}/toggle`, { method: 'POST' }, token)

export const deleteCrmOperator = (token: string, id: number) =>
  isTesterToken(token)
    ? Promise.resolve({ success: true })
    : request<{ success: boolean }>(`/api/admin/operators/${id}`, { method: 'DELETE' }, token)

export const fetchSupportFileBlob = async (token: string, fileId: string) => {
  if (isTesterToken(token)) {
    return new Blob(['mock'], { type: 'text/plain' })
  }
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

export const fetchSupportNotes = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve({ notes: MOCK_SUPPORT_NOTES.filter((n) => String(n.supportChatId) === String(MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId)?.id ?? n.supportChatId)) })
    : request<SupportNotesResponse>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/notes`, {}, token)

export const fetchSupportChatAvatar = (token: string, chatId: string) =>
  isTesterToken(token)
    ? Promise.resolve({ fileId: null })
    : request<{ fileId: string | null }>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/avatar`, {}, token)

export const addSupportNote = (token: string, chatId: string, text: string) =>
  isTesterToken(token)
    ? Promise.resolve({
        id: Date.now(),
        supportChatId: MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId)?.id ?? 0,
        text,
        adminUsername: 'tester',
        createdAt: new Date().toISOString(),
      } as SupportNoteRecord)
    : request<SupportNoteRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }, token)

export const updateSupportNote = (token: string, chatId: string, noteId: number, text: string) =>
  isTesterToken(token)
    ? Promise.resolve({
        id: noteId,
        supportChatId: MOCK_SUPPORT_CHATS.find((c) => c.chatId === chatId)?.id ?? 0,
        text,
        adminUsername: 'tester',
        createdAt: new Date().toISOString(),
      } as SupportNoteRecord)
    : request<SupportNoteRecord>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/notes/${noteId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ text }),
        },
        token,
      )

export const deleteSupportNote = (token: string, chatId: string, noteId: number) =>
  isTesterToken(token)
    ? Promise.resolve({ success: true })
    : request<{ success: boolean }>(`/api/admin/support/chats/${encodeURIComponent(chatId)}/notes/${noteId}`,
        { method: 'DELETE' },
        token,
      )