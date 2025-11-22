import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendUp, Users, Wallet, ChartLine } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth'
import { fetchMarketingStats, type MarketingSource } from '@/lib/api'

export function RefLinks() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [sources, setSources] = useState<MarketingSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    if (!token) return
    
    try {
      const data = await fetchMarketingStats(token)
      setSources(data.sources)
    } catch (error) {
      console.error('Failed to load marketing stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalUsers = sources.reduce((sum, s) => sum + s.users, 0)
  const totalDeposits = sources.reduce((sum, s) => sum + s.deposits, 0)
  const totalRevenue = sources.reduce((sum, s) => sum + s.revenue, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('refLinks.title')}</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">From marketing campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ChartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeposits}</div>
            <p className="text-xs text-muted-foreground">Completed deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From marketing sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Sources Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No marketing data yet. Create links in <strong>Link Builder</strong>.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Deposits</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg per User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.source}>
                    <TableCell className="font-medium capitalize">{source.source}</TableCell>
                    <TableCell className="text-right">{source.users}</TableCell>
                    <TableCell className="text-right">{source.deposits}</TableCell>
                    <TableCell className="text-right">${source.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${(source.revenue / source.users).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
