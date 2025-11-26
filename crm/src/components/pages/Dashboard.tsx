import { useTranslation } from 'react-i18next'
import { Users, Wallet, ArrowCircleDown, ArrowCircleUp, TrendUp } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useApiQuery } from '@/hooks/use-api-query'
import { fetchOverview, type OverviewResponse } from '@/lib/api'

export function Dashboard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, error } = useApiQuery<OverviewResponse>(['overview'], fetchOverview, {
    staleTime: 60_000,
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

  const kpiCards = [
    {
      title: t('dashboard.totalUsers'),
      value: data ? data.kpis.totalUsers.toLocaleString() : '—',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: t('dashboard.totalBalance'),
      value: data ? formatCurrency(data.kpis.totalBalance) : '—',
      icon: Wallet,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: t('dashboard.depositsToday'),
      value: data ? formatCurrency(data.kpis.depositsToday) : '—',
      icon: ArrowCircleDown,
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: t('dashboard.withdrawalsToday'),
      value: data ? formatCurrency(data.kpis.withdrawalsToday) : '—',
      icon: ArrowCircleUp,
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      title: t('dashboard.profitPeriod'),
      value: data ? formatCurrency(data.kpis.profitPeriod) : '—',
      icon: TrendUp,
      gradient: 'from-cyan-500 to-cyan-600',
    },
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

  const financialData = data?.financialData ?? []
  const geoData = data?.geoData ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${kpi.gradient} opacity-10 rounded-full -mr-8 -mt-8`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.gradient}`}>
                  <Icon size={20} weight="bold" className="text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <span className="inline-flex h-6 w-20 animate-pulse rounded bg-muted" /> : kpi.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message || t('common.error')}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.financialDynamics')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('dashboard.last7Days')}</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse rounded-md bg-muted/50" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3142" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#22252f', 
                    border: '1px solid #3f4456',
                    borderRadius: '8px',
                    color: '#f8f9fa'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend 
                  wrapperStyle={{ color: '#9ca3af' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="deposits" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name={t('dashboard.deposits')}
                />
                <Line 
                  type="monotone" 
                  dataKey="withdrawals" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name={t('dashboard.withdrawals')}
                />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 4 }}
                    name={t('dashboard.profit')}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.userGeography')}</CardTitle>
            <p className="text-sm text-muted-foreground">Distribution by country</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse rounded-md bg-muted/50" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={geoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="userCount"
                    label={({ country, percentage }) => `${country}: ${percentage}%`}
                    labelLine={false}
                  >
                    {geoData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#22252f', 
                      border: '1px solid #3f4456',
                      borderRadius: '8px',
                      color: '#f8f9fa'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toLocaleString()} users (${props.payload.percentage}%)`,
                      props.payload.country
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users Block */}
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Balance</CardTitle>
            <p className="text-sm text-muted-foreground">Highest balance holders</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 w-full animate-pulse rounded-md bg-muted/50" />
                ))}
              </div>
            ) : data?.topUsers && data.topUsers.length > 0 ? (
              <div className="space-y-3">
                {data.topUsers.map((user, index) => (
                  <div
                    key={user.telegramId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-600/20 text-orange-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.username ? `@${user.username}` : user.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {user.telegramId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-500">
                        {formatCurrency(user.balance)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total: {formatCurrency(user.totalDeposit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No users yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Statistics Block */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Statistics</CardTitle>
            <p className="text-sm text-muted-foreground">Deposits, Reinvest & Withdrawals</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse rounded-md bg-muted/50" />
            ) : data?.transactionStats ? (
              <div className="space-y-6">
                {/* Deposits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="font-medium">Deposits</span>
                    </div>
                    <span className="font-bold text-green-500">
                      {formatCurrency(data.transactionStats.totalDeposits)}
                    </span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(data.transactionStats.totalDeposits / (data.transactionStats.totalDeposits + data.transactionStats.totalWithdrawals + data.transactionStats.totalReinvest)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.transactionStats.depositsCount} transactions
                  </div>
                </div>

                {/* Reinvest */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium">Reinvest</span>
                    </div>
                    <span className="font-bold text-blue-500">
                      {formatCurrency(data.transactionStats.totalReinvest)}
                    </span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(data.transactionStats.totalReinvest / (data.transactionStats.totalDeposits + data.transactionStats.totalWithdrawals + data.transactionStats.totalReinvest)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.transactionStats.reinvestCount} transactions
                  </div>
                </div>

                {/* Withdrawals */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="font-medium">Withdrawals</span>
                    </div>
                    <span className="font-bold text-orange-500">
                      {formatCurrency(data.transactionStats.totalWithdrawals)}
                    </span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(data.transactionStats.totalWithdrawals / (data.transactionStats.totalDeposits + data.transactionStats.totalWithdrawals + data.transactionStats.totalReinvest)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.transactionStats.withdrawalsCount} transactions
                  </div>
                </div>

                {/* Summary */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Flow</span>
                    <span className={`font-bold ${
                      (data.transactionStats.totalDeposits + data.transactionStats.totalReinvest - data.transactionStats.totalWithdrawals) >= 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {formatCurrency(data.transactionStats.totalDeposits + data.transactionStats.totalReinvest - data.transactionStats.totalWithdrawals)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No transaction data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
