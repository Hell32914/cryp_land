import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, Funnel, User } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { fetchDeposits, type DepositRecord } from '@/lib/api'

export function Deposits() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 100
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterLeadStatus, setFilterLeadStatus] = useState('all')
  const [filterDepStatus, setFilterDepStatus] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { token } = useAuth()
  const { data } = useQuery({
    queryKey: ['deposits', token, page, search],
    queryFn: () => fetchDeposits(token!, { page, limit: pageSize, search: search.trim() || undefined }),
    enabled: !!token,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })

  const deposits = data?.deposits || []

  const normalizeDepStatus = (deposit: DepositRecord) => {
    if (deposit.depStatus !== 'processing') return deposit.depStatus
    const raw = String(deposit.status || '').toUpperCase()
    if (['COMPLETED', 'PAID', 'SUCCESS', 'SUCCEEDED'].includes(raw)) return 'paid'
    if (['FAILED', 'CANCELLED', 'CANCELED', 'REJECTED', 'EXPIRED'].includes(raw)) return 'failed'
    return 'processing'
  }

  const filteredDeposits = deposits.filter((deposit) => {
    const normalizedDepStatus = normalizeDepStatus(deposit)
    if (filterLeadStatus !== 'all' && deposit.leadStatus !== filterLeadStatus) return false
    if (filterDepStatus !== 'all' && normalizedDepStatus !== filterDepStatus) return false
    if (filterDateFrom || filterDateTo) {
      const created = new Date(deposit.createdAt).getTime()
      const fromTs = filterDateFrom ? new Date(filterDateFrom).setHours(0, 0, 0, 0) : null
      const toTs = filterDateTo ? new Date(filterDateTo + 'T23:59:59').getTime() : null
      if (fromTs !== null && created < fromTs) return false
      if (toTs !== null && created > toTs) return false
    }
    if (selectedUserId && String(deposit.user.telegramId) !== selectedUserId) return false
    return true
  })

  const latestDeposits = useMemo(() => {
    if (selectedUserId) return filteredDeposits
    const latestByUser = new Map<string, DepositRecord>()
    for (const deposit of filteredDeposits) {
      const key = String(deposit.user.telegramId)
      const existing = latestByUser.get(key)
      if (!existing) {
        latestByUser.set(key, deposit)
        continue
      }
      const currentTs = new Date(deposit.createdAt).getTime()
      const existingTs = new Date(existing.createdAt).getTime()
      if (currentTs > existingTs) {
        latestByUser.set(key, deposit)
      }
    }
    return Array.from(latestByUser.values())
  }, [filteredDeposits, selectedUserId])

  // Calculate totals
  const totals = useMemo(() => {
    const completedDeposits = latestDeposits.filter(d => d.status === 'COMPLETED')
    return {
      totalAmount: completedDeposits.reduce((sum, d) => sum + d.amount, 0),
      totalCount: completedDeposits.length
    }
  }, [latestDeposits])

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

  const getPaymentMethodLabel = (paymentMethod?: string) => {
    const pm = (paymentMethod || 'OXAPAY').toUpperCase()
    return pm === 'PAYPAL' ? 'PAYPAL' : 'CRYPTO'
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
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search deposits..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            {selectedUserId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedUserId(null)
                  setSearch('')
                  setPage(1)
                }}
              >
                Clear user filter
              </Button>
            ) : null}
            <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)}>
              <Funnel size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Dep Status</TableHead>
                  <TableHead>Lead Status</TableHead>
                  <TableHead>Trafficker</TableHead>
                  <TableHead>Link Name</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">#{deposit.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {getPaymentMethodLabel(deposit.paymentMethod)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{deposit.user.telegramId}</TableCell>
                    <TableCell className="font-medium text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          const userId = String(deposit.user.telegramId)
                          setSelectedUserId(userId)
                          setSearch(userId)
                          setPage(1)
                        }}
                        className="hover:underline text-left"
                      >
                        {deposit.user.username || 'N/A'}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{deposit.user.fullName}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-green-500 text-sm">
                      ${deposit.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">{deposit.user.country}</TableCell>
                    <TableCell>
                      {(() => {
                        const normalized = normalizeDepStatus(deposit)
                        return (
                          <Badge variant="outline" className={
                            normalized === 'paid'
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : normalized === 'failed'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }>
                            {normalized}
                          </Badge>
                        )
                      })()}
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
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedDeposit(deposit)}
                      >
                        <User size={16} className="mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{data?.page || page}</span> of{' '}
              <span className="font-medium text-foreground">{data?.totalPages || 1}</span>
              {typeof data?.totalCount === 'number' ? (
                <span> • Total: <span className="font-medium text-foreground">{data.totalCount}</span></span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!(data?.hasPrevPage) || page <= 1}
              >
                ◀ Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!(data?.hasNextPage)}
              >
                Next ▶
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-6">
              {/* Deposit Info */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xs text-green-400 font-medium mb-1">This Deposit</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-300">Order #{selectedDeposit.id}</span>
                  <span className="text-lg font-bold text-green-400">${selectedDeposit.amount.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(selectedDeposit.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Method: {getPaymentMethodLabel(selectedDeposit.paymentMethod)}
                </div>
              </div>

              {/* Main Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-mono font-medium">{selectedDeposit.user.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Telegram ID</div>
                  <div className="font-mono font-medium">{selectedDeposit.user.telegramId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-medium">{selectedDeposit.user.username ? `@${selectedDeposit.user.username}` : '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div className="font-medium">{selectedDeposit.user.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Country</div>
                  <div>{selectedDeposit.user.country}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant="outline" className={
                    selectedDeposit.user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    selectedDeposit.user.status === 'INACTIVE' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                    selectedDeposit.user.status === 'KYC_REQUIRED' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }>
                    {selectedDeposit.user.status}
                  </Badge>
                </div>
              </div>

              {/* Financial Info */}
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Financial Data</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="font-mono font-medium text-lg">${selectedDeposit.user.balance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Profit</div>
                    <div className="font-mono font-medium text-lg text-cyan-400">${selectedDeposit.user.profit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Deposits (Lifetime)</div>
                    <div className="font-mono font-medium text-green-400">${selectedDeposit.user.totalDeposit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                    <div className="font-mono font-medium text-orange-400">${selectedDeposit.user.totalWithdraw.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Marketing Info */}
              {(selectedDeposit.trafficerName || selectedDeposit.linkName) && (
                <div className="pt-4 border-t border-border">
                  <div className="text-sm font-medium mb-3">Marketing Data</div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDeposit.trafficerName && (
                      <div>
                        <div className="text-sm text-muted-foreground">Trafficker</div>
                        <div className="font-medium text-blue-400">{selectedDeposit.trafficerName}</div>
                      </div>
                    )}
                    {selectedDeposit.linkName && (
                      <div>
                        <div className="text-sm text-muted-foreground">Link Name</div>
                        <div className="font-medium text-purple-400">{selectedDeposit.linkName}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Info */}
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Security & Access</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Blocked</div>
                    <Badge variant="outline" className={selectedDeposit.user.isBlocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                      {selectedDeposit.user.isBlocked ? '✗ Yes' : '✓ No'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">KYC Required</div>
                    <Badge variant="outline" className={selectedDeposit.user.kycRequired ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                      {selectedDeposit.user.kycRequired ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Registration Date</div>
                    <div className="text-sm">{new Date(selectedDeposit.user.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Lead Status</label>
              <select
                value={filterLeadStatus}
                onChange={(e) => {
                  setFilterLeadStatus(e.target.value)
                  setPage(1)
                }}
                className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="all">All</option>
                <option value="FTD">FTD</option>
                <option value="withdraw">withdraw</option>
                <option value="reinvest">reinvest</option>
                <option value="active">active</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Dep Status</label>
              <select
                value={filterDepStatus}
                onChange={(e) => {
                  setFilterDepStatus(e.target.value)
                  setPage(1)
                }}
                className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="all">All</option>
                <option value="paid">paid</option>
                <option value="processing">processing</option>
                <option value="failed">failed</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date from</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value)
                  setPage(1)
                }}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date to</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value)
                  setPage(1)
                }}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilterLeadStatus('all')
                setFilterDepStatus('all')
                setFilterDateFrom('')
                setFilterDateTo('')
                setPage(1)
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
