import { useTranslation } from 'react-i18next'
import { Download, Calendar } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { fetchOverview } from '@/lib/api'
import { useAuth } from '@/lib/auth'

type PeriodType = 'all' | 'today' | 'week' | 'month' | 'custom'

export function GeoData() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [geoData, setGeoData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    switch (period) {
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

  useEffect(() => {
    const loadData = async () => {
      if (!token) return
      try {
        setLoading(true)
        const dateRange = getDateRange()
        const data = await fetchOverview(token, dateRange.from, dateRange.to)
        setGeoData(data.geoData)
      } catch (error) {
        console.error('Failed to load geo data:', error)
        toast.error('Failed to load geographical data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token, period, customFrom, customTo])

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7 Days' },
    { key: 'month', label: '30 Days' },
    { key: 'custom', label: 'Custom' },
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

  const handleCountryClick = (country: string) => {
    if (country.toLowerCase() === 'others') {
      toast.info('Country group "Others" cannot be expanded')
      return
    }
    window.dispatchEvent(new CustomEvent('crm:navigate', { detail: { page: 'users', usersCountry: country } }))
  }

  const exportCSV = () => {
    const headers = ['Country', 'User Count', 'Percentage', 'FTD Count', 'Conversion Rate (%)', 'Total Deposits', 'Total Withdrawals', 'Total Profit']
    const rows = geoData.map(d => [
      d.country, 
      d.userCount, 
      d.percentage,
      d.ftdCount || 0,
      d.conversionRate || 0,
      d.totalDeposits || 0,
      d.totalWithdrawals || 0,
      d.totalProfit || 0
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'geo-data.csv'
    a.click()
    
    toast.success('CSV exported successfully')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t('geo.title')}</h1>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('geo.title')}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={exportCSV}>
            <Download size={18} className="mr-2" />
            {t('geo.export')}
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Calendar size={20} className="text-muted-foreground/70" />
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
      
      {/* Custom Date Range */}
      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30">
          <label className="text-sm text-muted-foreground">From:</label>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md bg-white/90 border border-white/30 text-slate-900 placeholder:text-slate-400"
          />
          <label className="text-sm text-muted-foreground">To:</label>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md bg-white/90 border border-white/30 text-slate-900 placeholder:text-slate-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('geo.distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={geoData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ country, percentage }) => `${country} ${percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="userCount"
                >
                  {geoData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const country = geoData[index]?.country
                        if (country) {
                          handleCountryClick(country)
                        }
                      }}
                    />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('geo.country')} Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>{t('geo.country')}</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">FTD</TableHead>
                    <TableHead className="text-right">CR</TableHead>
                    <TableHead className="text-right">Deposits</TableHead>
                    <TableHead className="text-right">Withdrawals</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoData.map((geo, index) => (
                    <TableRow key={geo.country} className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleCountryClick(geo.country)}
                          className="flex items-center gap-2 text-left hover:underline"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{geo.country}</span>
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {geo.userCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {geo.percentage}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-yellow-400">
                        {geo.ftdCount || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-400">
                        {geo.conversionRate || 0}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-cyan-400">
                        ${(geo.totalDeposits || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-orange-400">
                        ${(geo.totalWithdrawals || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-purple-400">
                        ${(geo.totalProfit || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Depositors by Country */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Top Depositors by Country</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {geoData.filter((geo) => geo.country !== 'Others').map((geo, geoIndex) => (
            <Card key={geo.country}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[geoIndex % COLORS.length] }}
                  />
                  {geo.country}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total Deposits: <span className="text-cyan-400 font-mono">${geo.totalDeposits.toLocaleString()}</span>
                </p>
              </CardHeader>
              <CardContent>
                {geo.topDepositors && geo.topDepositors.length > 0 ? (
                  <div className="space-y-3">
                    {geo.topDepositors.map((user, index) => (
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
                            <div className="font-medium text-sm">
                              {user.username ? `@${user.username}` : user.fullName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              ID: {user.telegramId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400 text-sm">
                            ${user.totalDeposit.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No depositors</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  )
}
