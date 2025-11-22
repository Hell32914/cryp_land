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

export const mockUsers: User[] = [
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

export const mockDeposits: Deposit[] = [
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

export const mockWithdrawals: Withdrawal[] = [
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

export const mockExpenses: Expense[] = [
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
