export interface User {
  id: number
  userId: string
  username: string
  fullName: string
  country: string
  status: 'Paid' | 'FTD' | 'Lead'
  comments: string
  balance: number
  profitBalance: number
  totalDeposit: number
}

export interface Deposit {
  orderId: string
  userId: string
  username: string
  fullName: string
  amount: number
  country: string
  leadStatus: 'Paid' | 'FTD' | 'Withdrawn'
  subId: string
}

export interface Withdrawal {
  requestId: string
  user: string
  amount: number
  status: 'Pending' | 'Successful' | 'Declined'
  date: string
}

export interface Expense {
  id: number
  category: string
  comment: string
  amount: number
  date: string
}

export interface RefLink {
  id: number
  source: string
  subId: string
  clicks: number
  registrations: number
  deposits: number
  revenue: number
}

export interface GeoData {
  country: string
  userCount: number
  percentage: number
}

export interface FinancialData {
  date: string
  deposits: number
  withdrawals: number
  profit: number
}

const mockUsersData: User[] = [
  {
    id: 1,
    userId: 'TG1234567',
    username: 'john_trader',
    fullName: 'John Smith',
    country: 'United States',
    status: 'Paid',
    comments: 'Active trader',
    balance: 5420.50,
    profitBalance: 1230.00,
    totalDeposit: 10000,
  },
  {
    id: 2,
    userId: 'TG2345678',
    username: 'maria_garcia',
    fullName: 'Maria Garcia',
    country: 'Spain',
    status: 'FTD',
    comments: 'First deposit made',
    balance: 2150.00,
    profitBalance: 350.00,
    totalDeposit: 2500,
  },
  {
    id: 3,
    userId: 'TG3456789',
    username: 'alex_crypto',
    fullName: 'Alexander Petrov',
    country: 'Russia',
    status: 'Paid',
    comments: 'Regular deposits',
    balance: 8900.75,
    profitBalance: 2100.50,
    totalDeposit: 15000,
  },
  {
    id: 4,
    userId: 'TG4567890',
    username: 'emma_wilson',
    fullName: 'Emma Wilson',
    country: 'United Kingdom',
    status: 'Lead',
    comments: 'Registered, no deposit',
    balance: 0,
    profitBalance: 0,
    totalDeposit: 0,
  },
  {
    id: 5,
    userId: 'TG5678901',
    username: 'dmitry_k',
    fullName: 'Dmitry Kovalenko',
    country: 'Ukraine',
    status: 'Paid',
    comments: 'VIP client',
    balance: 12500.00,
    profitBalance: 3200.00,
    totalDeposit: 25000,
  },
]

const mockDepositsData: Deposit[] = [
  {
    orderId: 'ORD-001234',
    userId: 'TG1234567',
    username: 'john_trader',
    fullName: 'John Smith',
    amount: 1000,
    country: 'United States',
    leadStatus: 'Paid',
    subId: 'SUB-TG-001',
  },
  {
    orderId: 'ORD-001235',
    userId: 'TG2345678',
    username: 'maria_garcia',
    fullName: 'Maria Garcia',
    amount: 500,
    country: 'Spain',
    leadStatus: 'FTD',
    subId: 'SUB-TG-002',
  },
  {
    orderId: 'ORD-001236',
    userId: 'TG3456789',
    username: 'alex_crypto',
    fullName: 'Alexander Petrov',
    amount: 2500,
    country: 'Russia',
    leadStatus: 'Paid',
    subId: 'SUB-TG-003',
  },
  {
    orderId: 'ORD-001237',
    userId: 'TG5678901',
    username: 'dmitry_k',
    fullName: 'Dmitry Kovalenko',
    amount: 5000,
    country: 'Ukraine',
    leadStatus: 'Paid',
    subId: 'SUB-TG-004',
  },
]

const mockWithdrawalsData: Withdrawal[] = [
  {
    requestId: 'WD-001',
    user: 'john_trader',
    amount: 500,
    status: 'Successful',
    date: '2024-01-15T10:30:00Z',
  },
  {
    requestId: 'WD-002',
    user: 'alex_crypto',
    amount: 1200,
    status: 'Pending',
    date: '2024-01-16T14:20:00Z',
  },
  {
    requestId: 'WD-003',
    user: 'maria_garcia',
    amount: 300,
    status: 'Successful',
    date: '2024-01-16T16:45:00Z',
  },
  {
    requestId: 'WD-004',
    user: 'dmitry_k',
    amount: 2000,
    status: 'Declined',
    date: '2024-01-17T09:15:00Z',
  },
]

const mockExpensesData: Expense[] = [
  {
    id: 1,
    category: 'Marketing',
    comment: 'Facebook Ads campaign',
    amount: 1500,
    date: '2024-01-10',
  },
  {
    id: 2,
    category: 'Infrastructure',
    comment: 'Server hosting',
    amount: 250,
    date: '2024-01-12',
  },
  {
    id: 3,
    category: 'Support',
    comment: 'Customer service tools',
    amount: 100,
    date: '2024-01-14',
  },
  {
    id: 4,
    category: 'Development',
    comment: 'API integration',
    amount: 800,
    date: '2024-01-15',
  },
]

export const mockRefLinks: RefLink[] = [
  {
    id: 1,
    source: 'Telegram Bot',
    subId: 'SUB-TG-001',
    clicks: 1250,
    registrations: 85,
    deposits: 42,
    revenue: 12500,
  },
  {
    id: 2,
    source: 'Instagram',
    subId: 'SUB-IG-001',
    clicks: 890,
    registrations: 62,
    deposits: 28,
    revenue: 8400,
  },
  {
    id: 3,
    source: 'Facebook',
    subId: 'SUB-FB-001',
    clicks: 2100,
    registrations: 145,
    deposits: 67,
    revenue: 18900,
  },
  {
    id: 4,
    source: 'YouTube',
    subId: 'SUB-YT-001',
    clicks: 3450,
    registrations: 210,
    deposits: 89,
    revenue: 24700,
  },
]

export const mockGeoData: GeoData[] = [
  { country: 'United States', userCount: 1250, percentage: 28.5 },
  { country: 'Russia', userCount: 980, percentage: 22.3 },
  { country: 'Ukraine', userCount: 675, percentage: 15.4 },
  { country: 'United Kingdom', userCount: 520, percentage: 11.8 },
  { country: 'Spain', userCount: 410, percentage: 9.3 },
  { country: 'Germany', userCount: 320, percentage: 7.3 },
  { country: 'Others', userCount: 235, percentage: 5.4 },
]

export const mockFinancialData: FinancialData[] = [
  { date: '2024-01-11', deposits: 12500, withdrawals: 4200, profit: 8300 },
  { date: '2024-01-12', deposits: 15800, withdrawals: 5100, profit: 10700 },
  { date: '2024-01-13', deposits: 11200, withdrawals: 3800, profit: 7400 },
  { date: '2024-01-14', deposits: 18500, withdrawals: 6200, profit: 12300 },
  { date: '2024-01-15', deposits: 21000, withdrawals: 7500, profit: 13500 },
  { date: '2024-01-16', deposits: 16800, withdrawals: 5800, profit: 11000 },
  { date: '2024-01-17', deposits: 19500, withdrawals: 6500, profit: 13000 },
]

export const mockKPIs = {
  totalUsers: 4390,
  totalBalance: 287650.50,
  depositsToday: 19500,
  withdrawalsToday: 6500,
  profitPeriod: 76200,
}

// API-compatible mock data exports
export const mockOverview = {
  kpis: mockKPIs,
  financialData: mockFinancialData,
  geoData: mockGeoData,
  generatedAt: new Date().toISOString(),
}

export const mockUsersResponse = {
  users: mockUsersData.map(user => ({
    id: user.id,
    telegramId: user.userId,
    username: user.username,
    fullName: user.fullName,
    country: user.country,
    status: user.status,
    plan: 'Standard',
    balance: user.balance,
    profit: user.profitBalance,
    totalDeposit: user.totalDeposit,
    totalWithdraw: 0,
    kycRequired: false,
    isBlocked: false,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  count: mockUsersData.length,
}

export const mockDepositsResponse = {
  deposits: mockDepositsData.map((dep, idx) => ({
    id: idx + 1,
    status: 'completed',
    amount: dep.amount,
    currency: 'USDT',
    network: 'TRC20',
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: mockUsersResponse.users.find(u => u.telegramId === dep.userId)!,
  })),
}

export const mockWithdrawalsResponse = {
  withdrawals: mockWithdrawalsData.map((wd, idx) => ({
    id: idx + 1,
    status: wd.status.toLowerCase(),
    amount: wd.amount,
    currency: 'USDT',
    network: 'TRC20',
    address: `T${Math.random().toString(36).slice(2, 35).toUpperCase()}`,
    txHash: wd.status === 'Successful' ? `0x${Math.random().toString(16).slice(2, 66)}` : null,
    createdAt: wd.date,
    user: mockUsersResponse.users.find(u => u.username === wd.user)!,
  })),
}

export const mockExpensesResponse = {
  expenses: mockExpensesData.map(exp => ({
    id: exp.id,
    category: exp.category,
    comment: exp.comment,
    amount: exp.amount,
    createdAt: new Date(exp.date).toISOString(),
  })),
  totalAmount: mockExpensesData.reduce((sum, exp) => sum + exp.amount, 0),
}

export const mockReferralsResponse = {
  referrals: [
    {
      id: 1,
      level: 1,
      earnings: 50,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      referrer: mockUsersResponse.users[0],
      referredUser: mockUsersResponse.users[1],
    },
    {
      id: 2,
      level: 1,
      earnings: 75,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      referrer: mockUsersResponse.users[0],
      referredUser: mockUsersResponse.users[3],
    },
    {
      id: 3,
      level: 2,
      earnings: 25,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      referrer: mockUsersResponse.users[1],
      referredUser: mockUsersResponse.users[2],
    },
  ],
}

// Named exports for API
export const mockUsers = mockUsersResponse
export const mockDeposits = mockDepositsResponse
export const mockWithdrawals = mockWithdrawalsResponse
export const mockExpenses = mockExpensesResponse
export const mockReferrals = mockReferralsResponse
