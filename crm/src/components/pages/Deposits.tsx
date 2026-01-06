import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, User } from '@phosphor-icons/react'
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
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null)
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
                {filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">#{deposit.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {getPaymentMethodLabel(deposit.paymentMethod)}
                    </TableCell>
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
                          : deposit.depStatus === 'failed'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
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
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent className="max-w-2xl">
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
    </div>
  )
}
