import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth'
import { useQuery } from '@tanstack/react-query'
import { fetchDeposits } from '@/lib/api'

export function Deposits() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { token } = useAuth()
  const { data } = useQuery({
    queryKey: ['deposits', token],
    queryFn: () => fetchDeposits(token!),
    enabled: !!token,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })

  const deposits = data?.deposits || []

  const filteredDeposits = deposits.filter(deposit =>
    deposit.user.username?.toLowerCase().includes(search.toLowerCase()) ||
    deposit.id.toString().includes(search)
  )

  // Calculate totals
  const totals = useMemo(() => {
    const completedDeposits = filteredDeposits.filter(d => d.status === 'COMPLETED')
    return {
      totalAmount: completedDeposits.reduce((sum, d) => sum + d.amount, 0),
      totalCount: completedDeposits.length
    }
  }, [filteredDeposits])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('deposits.title')}</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Deposits</p>
            <p className="text-2xl font-bold text-green-500">${totals.totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Count</p>
            <p className="text-2xl font-bold">{totals.totalCount}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search deposits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Order ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Dep Status</TableHead>
                  <TableHead>Lead Status</TableHead>
                  <TableHead>Trafficker</TableHead>
                  <TableHead>Link Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">#{deposit.id}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{deposit.user.telegramId}</TableCell>
                    <TableCell className="font-medium text-sm">{deposit.user.username || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{deposit.user.fullName}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-green-500 text-sm">
                      ${deposit.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">{deposit.user.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        deposit.depStatus === 'paid' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }>
                        {deposit.depStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        deposit.leadStatus === 'FTD' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        deposit.leadStatus === 'withdraw' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        deposit.leadStatus === 'reinvest' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-green-500/10 text-green-400 border-green-500/20'
                      }>
                        {deposit.leadStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-blue-400">
                      {deposit.trafficerName || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-purple-400 max-w-[150px] truncate" title={deposit.linkName || ''}>
                      {deposit.linkName || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
