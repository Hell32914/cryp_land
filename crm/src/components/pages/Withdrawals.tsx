import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Funnel } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { useQuery } from '@tanstack/react-query'
import { fetchWithdrawals } from '@/lib/api'

export function Withdrawals() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const { data } = useQuery({
    queryKey: ['withdrawals', token],
    queryFn: () => fetchWithdrawals(token!),
    enabled: !!token,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })

  const withdrawals = data?.withdrawals || []

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    if (filterStatus !== 'all' && String(withdrawal.status).toLowerCase() !== filterStatus) return false
    if (filterDateFrom || filterDateTo) {
      const created = new Date(withdrawal.createdAt).getTime()
      const fromTs = filterDateFrom ? new Date(filterDateFrom).setHours(0, 0, 0, 0) : null
      const toTs = filterDateTo ? new Date(filterDateTo + 'T23:59:59').getTime() : null
      if (fromTs !== null && created < fromTs) return false
      if (toTs !== null && created > toTs) return false
    }
    return true
  })

  // Use server-side totals (excludes test accounts)
  const totals = useMemo(() => {
    return {
      totalAmount: data?.totalWithdrawnAmount ?? 0,
      totalCount: data?.totalWithdrawnCount ?? 0,
      processingAmount: data?.processingAmount ?? 0,
      processingCount: data?.processingCount ?? 0
    }
  }, [data?.totalWithdrawnAmount, data?.totalWithdrawnCount, data?.processingAmount, data?.processingCount])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'approved':
        return 'bg-teal-500/10 text-teal-500 border-teal-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'declined':
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t('withdrawals.title')}</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHelpOpen(true)}
            aria-label="Withdrawals help"
            className="h-8 w-8"
          >
            ?
          </Button>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Processing</p>
            <p className="text-xl font-bold text-blue-500">${totals.processingAmount.toFixed(2)} ({totals.processingCount})</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Withdrawn</p>
            <p className="text-2xl font-bold text-orange-500">${totals.totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Count</p>
            <p className="text-2xl font-bold">{totals.totalCount}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-end">
            <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)}>
              <Funnel size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Request ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">#{withdrawal.id}</TableCell>
                    <TableCell className="font-medium text-sm">{withdrawal.user.username || withdrawal.user.fullName}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-orange-500 text-sm">
                      ${withdrawal.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {withdrawal.currency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {withdrawal.network || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(withdrawal.status)}>
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(withdrawal.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="all">All</option>
                <option value="completed">completed</option>
                <option value="approved">approved</option>
                <option value="processing">processing</option>
                <option value="pending">pending</option>
                <option value="failed">failed</option>
                <option value="declined">declined</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date from</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date to</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilterStatus('all')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Withdrawals: table legend</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><span className="text-foreground">Request ID</span> — internal withdrawal request number.</div>
            <div><span className="text-foreground">User</span> — username or full name of the requester.</div>
            <div><span className="text-foreground">Amount</span> — withdrawal amount.</div>
            <div><span className="text-foreground">Currency</span> — asset being withdrawn.</div>
            <div><span className="text-foreground">Network</span> — blockchain network (e.g., TRC20, ERC20).</div>
            <div><span className="text-foreground">Status</span> — processing state of the withdrawal.</div>
            <div><span className="text-foreground">Date</span> — request creation time.</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
