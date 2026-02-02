import { Component, type ReactNode, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Wallet, ArrowCircleDown, ArrowCircleUp, TrendUp, Calendar } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApiQuery } from '@/hooks/use-api-query'
import { fetchOverview, type OverviewResponse } from '@/lib/api'

type PeriodType = 'all' | 'today' | 'week' | 'month' | 'custom'
type DailyRow = { date: string; deposits: number; withdrawals: number; profit: number; traffic: number; spend: number }

class DashboardErrorBoundary extends Component<{ children: ReactNode; label?: string }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {this.props.label ? `${this.props.label} render error.` : 'Render error.'}
        </div>
      )
    }
    return this.props.children
  }
}

export function Dashboard() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<PeriodType>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [geoFilter, setGeoFilter] = useState('')
  const [streamFilter, setStreamFilter] = useState('')
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({})
  const [statsPage, setStatsPage] = useState(1)
  const compactTopScrollRef = useRef<HTMLDivElement>(null)
  const compactBottomScrollRef = useRef<HTMLDivElement>(null)
  const fullTopScrollRef = useRef<HTMLDivElement>(null)
  const fullBottomScrollRef = useRef<HTMLDivElement>(null)
  
  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    switch (period) {
      case 'all': {
        return { from: new Date(0).toISOString(), to: now.toISOString() }
      }
      case 'today': {
        return { from: today.toISOString(), to: now.toISOString() }
      }
      case 'week': {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { from: weekAgo.toISOString(), to: now.toISOString() }
      }
      case 'month': {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { from: monthAgo.toISOString(), to: now.toISOString() }
      }
      case 'custom': {
        if (customFrom && customTo) {
          return { from: new Date(customFrom).toISOString(), to: new Date(customTo + 'T23:59:59').toISOString() }
        }
        return { from: undefined, to: undefined }
      }
      default:
        return { from: undefined, to: undefined }
    }
  }
  
  const dateRange = getDateRange()
  const allTimeRange = useMemo(() => ({ from: new Date(0).toISOString(), to: new Date().toISOString() }), [])
  
  const { data, isLoading, isError, error } = useApiQuery<OverviewResponse>(
    ['overview', period, customFrom, customTo, geoFilter, streamFilter], 
    (token) => fetchOverview(token, dateRange.from, dateRange.to, geoFilter || undefined, streamFilter || undefined), 
    { staleTime: 10_000, refetchInterval: 10_000, refetchIntervalInBackground: true, refetchOnWindowFocus: true }
  )

  const { data: allTimeData, isLoading: isAllTimeLoading } = useApiQuery<OverviewResponse>(
    ['overview-all-time', geoFilter, streamFilter],
    (token) => fetchOverview(token, allTimeRange.from, allTimeRange.to, geoFilter || undefined, streamFilter || undefined, true),
    { staleTime: 30_000, refetchInterval: 30_000, refetchIntervalInBackground: true, refetchOnWindowFocus: false }
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

  const parseDateSafe = (value: string | number) => {
    if (typeof value === 'number') {
      const ms = value < 1_000_000_000_000 ? value * 1000 : value
      const d = new Date(ms)
      return Number.isNaN(d.getTime()) ? null : d
    }
    const trimmed = value.trim()
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed)
      const ms = num < 1_000_000_000_000 ? num * 1000 : num
      const d = new Date(ms)
      return Number.isNaN(d.getTime()) ? null : d
    }
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const formatDate = (value: string) => {
    const parsed = parseDateSafe(value)
    if (!parsed) return value
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(parsed)
  }

  // Use period-based values for all filters (depositsPeriod contains all time data when no filter)
  const depositsLabel = period === 'today' ? t('dashboard.depositsToday') : 
                        period === 'all' ? 'Total Deposits' : 'Deposits (Period)'
  const withdrawalsLabel = period === 'today' ? t('dashboard.withdrawalsToday') : 
                          period === 'all' ? 'Total Withdrawals' : 'Withdrawals (Period)'

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
      title: t('dashboard.totalBalanceNoAdmin'),
      value: data ? formatCurrency(data.kpis.totalBalanceNoAdmin) : '—',
      icon: Wallet,
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      title: depositsLabel,
      value: data ? formatCurrency(period === 'today' ? data.kpis.depositsToday : data.kpis.depositsPeriod) : '—',
      icon: ArrowCircleDown,
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: withdrawalsLabel,
      value: data ? formatCurrency(period === 'today' ? data.kpis.withdrawalsToday : data.kpis.withdrawalsPeriod) : '—',
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

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7 Days' },
    { key: 'month', label: '30 Days' },
    { key: 'custom', label: 'Custom' },
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

  const financialData = data?.financialData ?? []
  const geoData = data?.geoData ?? []
  const availableGeos = data?.filters?.geos ?? []
  const availableStreams = data?.filters?.streams ?? []

  const normalizeFinancialData = (rows: typeof financialData) => {
    const toNumber = (value: unknown) => {
      const num = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(num) ? num : 0
    }

    return rows.map((row) => ({
      ...row,
      deposits: toNumber((row as any).deposits),
      withdrawals: toNumber((row as any).withdrawals),
      profit: toNumber((row as any).profit),
      traffic: toNumber((row as any).traffic),
      spend: toNumber((row as any).spend),
    })).filter((row) => Boolean((row as any).date))
  }

  const chartData = useMemo(() => normalizeFinancialData(financialData), [financialData])
  const allTimeChartData = useMemo(() => normalizeFinancialData(allTimeData?.dailySummary ?? allTimeData?.financialData ?? []), [allTimeData])

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const allTimeRows = useMemo(() => {
    const rows = [...allTimeChartData]
    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return rows
  }, [allTimeChartData])

  const pageSize = 20
  const statsPageCount = Math.max(1, Math.ceil(allTimeRows.length / pageSize))
  const statsPageSafe = Math.min(statsPage, statsPageCount)
  const compactRows = allTimeRows.slice((statsPageSafe - 1) * pageSize, statsPageSafe * pageSize)

  const handleFullTopScroll = () => {
    if (!fullTopScrollRef.current || !fullBottomScrollRef.current) return
    fullBottomScrollRef.current.scrollLeft = fullTopScrollRef.current.scrollLeft
  }

  const handleFullBottomScroll = () => {
    if (!fullTopScrollRef.current || !fullBottomScrollRef.current) return
    fullTopScrollRef.current.scrollLeft = fullBottomScrollRef.current.scrollLeft
  }

  const handleCompactTopScroll = () => {
    if (!compactTopScrollRef.current || !compactBottomScrollRef.current) return
    compactBottomScrollRef.current.scrollLeft = compactTopScrollRef.current.scrollLeft
  }

  const handleCompactBottomScroll = () => {
    if (!compactTopScrollRef.current || !compactBottomScrollRef.current) return
    compactTopScrollRef.current.scrollLeft = compactBottomScrollRef.current.scrollLeft
  }

  const renderDailyTable = (rows: DailyRow[]) => {
    const totals = rows.reduce(
      (acc, row) => {
        acc.deposits += row.deposits
        acc.withdrawals += row.withdrawals
        acc.profit += row.profit
        acc.traffic += row.traffic
        acc.spend += row.spend
        return acc
      },
      { deposits: 0, withdrawals: 0, profit: 0, traffic: 0, spend: 0 }
    )

    return (
      <div className="rounded-md border border-border overflow-hidden min-w-[1200px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>{t('dashboard.date')}</TableHead>
              <TableHead className="text-right">{t('dashboard.deposits')}</TableHead>
              <TableHead className="text-right">{t('dashboard.withdrawals')}</TableHead>
              <TableHead className="text-right">{t('dashboard.profit')}</TableHead>
              <TableHead className="text-right">{t('dashboard.traffic')}</TableHead>
              <TableHead className="text-right">{t('dashboard.spend')}</TableHead>
              <TableHead className="text-right">{t('dashboard.netFlow')}</TableHead>
              <TableHead className="text-right">{t('dashboard.roi')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const netFlow = row.deposits - row.withdrawals
              const roi = row.spend > 0 ? ((row.profit - row.spend) / row.spend) * 100 : null
              return (
                <TableRow key={row.date}>
                  <TableCell className="font-medium">{formatDate(row.date)}</TableCell>
                  <TableCell className="text-right text-green-500">
                    {formatCurrency(row.deposits)}
                  </TableCell>
                  <TableCell className="text-right text-orange-500">
                    {formatCurrency(row.withdrawals)}
                  </TableCell>
                  <TableCell className="text-right text-cyan-500">
                    {formatCurrency(row.profit)}
                  </TableCell>
                  <TableCell className="text-right text-indigo-400">
                    {row.traffic.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-red-400">
                    {formatCurrency(row.spend)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(netFlow)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${roi === null ? 'text-muted-foreground' : roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {roi === null ? '—' : `${roi.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold text-green-500">
                {formatCurrency(totals.deposits)}
              </TableCell>
              <TableCell className="text-right font-semibold text-orange-500">
                {formatCurrency(totals.withdrawals)}
              </TableCell>
              <TableCell className="text-right font-semibold text-cyan-500">
                {formatCurrency(totals.profit)}
              </TableCell>
              <TableCell className="text-right font-semibold text-indigo-400">
                {totals.traffic.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-semibold text-red-400">
                {formatCurrency(totals.spend)}
              </TableCell>
              <TableCell
                className={`text-right font-semibold ${(totals.deposits - totals.withdrawals) >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {formatCurrency(totals.deposits - totals.withdrawals)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {totals.spend > 0 ? `${(((totals.profit - totals.spend) / totals.spend) * 100).toFixed(1)}%` : '—'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
        
        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar size={20} className="text-foreground" />
          {periodButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === btn.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-muted-foreground">{t('dashboard.filterGeo')}</div>
        <select
          value={geoFilter}
          onChange={(e) => setGeoFilter(e.target.value)}
          className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">{t('dashboard.filterAll')}</option>
          {availableGeos.map((geo) => (
            <option key={geo} value={geo}>{geo}</option>
          ))}
        </select>

        <div className="text-sm text-muted-foreground">{t('dashboard.filterStream')}</div>
        <select
          value={streamFilter}
          onChange={(e) => setStreamFilter(e.target.value)}
          className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">{t('dashboard.filterAll')}</option>
          {availableStreams.map((stream) => (
            <option key={stream} value={stream}>{stream}</option>
          ))}
        </select>
      </div>
      
      {/* Custom Date Range */}
      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30">
          <label className="text-sm text-muted-foreground">From:</label>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="date-input px-3 py-1.5 text-sm rounded-md bg-background border border-border"
          />
          <label className="text-sm text-muted-foreground">To:</label>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="date-input px-3 py-1.5 text-sm rounded-md bg-background border border-border"
          />
        </div>
      )}

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
            <p className="text-sm text-muted-foreground">
              {period === 'all' ? 'All Time' : 
               period === 'today' ? 'Today' :
               period === 'week' ? 'Last 7 Days' :
               period === 'month' ? 'Last 30 Days' :
               customFrom && customTo ? `${customFrom} - ${customTo}` : 'Select dates'}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { key: 'deposits', label: t('dashboard.deposits'), color: '#10b981' },
                { key: 'withdrawals', label: t('dashboard.withdrawals'), color: '#f59e0b' },
                { key: 'profit', label: t('dashboard.profit'), color: '#06b6d4' },
                { key: 'traffic', label: t('dashboard.traffic'), color: '#6366f1' },
                { key: 'spend', label: t('dashboard.spend'), color: '#ef4444' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleSeries(item.key)}
                  className={`px-2 py-1 rounded border border-border/60 ${hiddenSeries[item.key] ? 'opacity-40 line-through' : ''}`}
                  style={{ color: item.color }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <DashboardErrorBoundary label="Chart">
              {isLoading ? (
                <div className="h-[300px] w-full animate-pulse rounded-md bg-muted/50" />
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3142" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => {
                          const parsed = parseDateSafe(String(value))
                          return parsed
                            ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : String(value)
                        }}
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
                        formatter={(value: number, name: string) => {
                          const labelMap: Record<string, string> = {
                            deposits: t('dashboard.deposits'),
                            withdrawals: t('dashboard.withdrawals'),
                            profit: t('dashboard.profit'),
                          }
                          const label = labelMap[name] || name
                          return [`$${value.toLocaleString()}`, label]
                        }}
                      />
                      <Bar 
                        dataKey="deposits" 
                        fill="#10b981"
                        name={t('dashboard.deposits')}
                        hide={!!hiddenSeries.deposits}
                        barSize={14}
                        minPointSize={2}
                      />
                      <Bar 
                        dataKey="withdrawals" 
                        fill="#f59e0b"
                        name={t('dashboard.withdrawals')}
                        hide={!!hiddenSeries.withdrawals}
                        barSize={14}
                        minPointSize={2}
                      />
                      <Bar 
                        dataKey="profit" 
                        fill="#06b6d4"
                        name={t('dashboard.profit')}
                        hide={!!hiddenSeries.profit}
                        barSize={14}
                        minPointSize={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3142" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => {
                          const parsed = parseDateSafe(String(value))
                          return parsed
                            ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : String(value)
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#22252f', 
                          border: '1px solid #3f4456',
                          borderRadius: '8px',
                          color: '#f8f9fa'
                        }}
                        formatter={(value: number, name: string) => {
                          const labelMap: Record<string, string> = {
                            traffic: t('dashboard.traffic'),
                            spend: t('dashboard.spend'),
                          }
                          const label = labelMap[name] || name
                          if (name === 'traffic') return [value.toLocaleString(), label]
                          return [`$${value.toLocaleString()}`, label]
                        }}
                      />
                      <Bar
                        dataKey="spend"
                        yAxisId="left"
                        fill="#ef4444"
                        name={t('dashboard.spend')}
                        hide={!!hiddenSeries.spend}
                        barSize={14}
                        minPointSize={2}
                      />
                      <Bar
                        dataKey="traffic"
                        yAxisId="right"
                        fill="#6366f1"
                        name={t('dashboard.traffic')}
                        hide={!!hiddenSeries.traffic}
                        barSize={14}
                        minPointSize={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </DashboardErrorBoundary>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.userGeography')}</CardTitle>
            <p className="text-sm text-muted-foreground">Distribution by country</p>
          </CardHeader>
          <CardContent>
            <DashboardErrorBoundary label="Geo chart">
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
            </DashboardErrorBoundary>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="compact">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Daily Summary</CardTitle>
                <p className="text-sm text-muted-foreground">Aggregated by day for the full period</p>
              </div>
              <TabsList>
                <TabsTrigger value="compact">Compact</TabsTrigger>
                <TabsTrigger value="full">Full</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="compact">
              {isAllTimeLoading ? (
                <div className="h-[220px] w-full animate-pulse rounded-md bg-muted/50" />
              ) : !allTimeRows.length ? (
                <div className="text-center text-muted-foreground py-8">No daily data</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-border/60 disabled:opacity-50"
                      onClick={() => setStatsPage((p) => Math.max(1, p - 1))}
                      disabled={statsPageSafe <= 1}
                    >
                      ←
                    </button>
                    <span>
                      {statsPageSafe} / {statsPageCount}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-border/60 disabled:opacity-50"
                      onClick={() => setStatsPage((p) => Math.min(statsPageCount, p + 1))}
                      disabled={statsPageSafe >= statsPageCount}
                    >
                      →
                    </button>
                  </div>
                  <div
                    ref={compactTopScrollRef}
                    onScroll={handleCompactTopScroll}
                    className="h-3 overflow-x-auto"
                  >
                    <div className="min-w-[1200px]" />
                  </div>
                  <div
                    ref={compactBottomScrollRef}
                    onScroll={handleCompactBottomScroll}
                    className="overflow-x-auto"
                  >
                    {renderDailyTable(compactRows)}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="full">
              {isAllTimeLoading ? (
                <div className="h-[260px] w-full animate-pulse rounded-md bg-muted/50" />
              ) : !allTimeRows.length ? (
                <div className="text-center text-muted-foreground py-8">No daily data</div>
              ) : (
                <div className="space-y-2">
                  <div
                    ref={fullTopScrollRef}
                    onScroll={handleFullTopScroll}
                    className="h-3 overflow-x-auto"
                  >
                    <div className="min-w-[1200px]" />
                  </div>
                  <div
                    ref={fullBottomScrollRef}
                    onScroll={handleFullBottomScroll}
                    className="max-h-[60vh] overflow-auto"
                  >
                    <div className="min-w-[1200px]">
                      {renderDailyTable(allTimeRows)}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

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
