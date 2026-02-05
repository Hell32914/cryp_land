import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, User } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth'
import { fetchDepositUsers, type UserRecord } from '@/lib/api'

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase?.()) {
    case 'ACTIVE':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'INACTIVE':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'PENDING':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    case 'BLOCKED':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-muted/50 text-muted-foreground border-muted'
  }
}

export function DepositUsers() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const pageSize = 50

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deposit-users', token, page, search, dateFrom, dateTo],
    queryFn: () => fetchDepositUsers(token!, {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
    enabled: !!token,
    refetchInterval: 15000,
  })

  const users = data?.users ?? []

  const totals = useMemo(() => {
    return {
      count: data?.totalCount ?? users.length,
    }
  }, [data?.totalCount, users.length])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('depositUsers.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('depositUsers.subtitle')}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-sm text-muted-foreground">{t('depositUsers.total')}</div>
          <div className="text-2xl font-bold text-green-500">{totals.count}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-[240px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder={t('depositUsers.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="w-[160px]"
                aria-label={t('users.dateFrom')}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-[160px]"
                aria-label={t('users.dateTo')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                }}
                disabled={!dateFrom && !dateTo}
              >
                {t('users.reset')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead className="hidden md:table-cell">Telegram ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="hidden md:table-cell">Full Name</TableHead>
                  <TableHead className="text-right">Total Deposit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="hidden lg:table-cell">Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(8)].map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan={9}>
                        <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-destructive">
                      {t('common.error')}
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground">
                      {t('depositUsers.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell className="font-mono text-sm">#{user.id}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground hidden md:table-cell">
                        {user.telegramId}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{user.username || '—'}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{user.fullName}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-green-500 text-sm">
                        ${user.totalDeposit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-cyan-400 text-sm">
                        ${user.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{user.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost">
                          <User size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data?.totalPages && data.totalPages > 1 ? (
            <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{data.page}</span> of{' '}
                <span className="font-medium text-foreground">{data.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.hasPrevPage || page <= 1}
                >
                  ◀ Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.hasNextPage}
                >
                  Next ▶
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('users.userDetails')}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {selectedUser.comment && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs text-blue-400 font-medium mb-1">Comment</div>
                  <div className="text-sm text-blue-300">{selectedUser.comment}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-mono font-medium">{selectedUser.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Telegram ID</div>
                  <div className="font-mono font-medium">{selectedUser.telegramId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-medium">{selectedUser.username || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div className="font-medium">{selectedUser.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Country</div>
                  <div>{selectedUser.country}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Language</div>
                  <div>{selectedUser.languageCode?.toUpperCase() || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant="outline" className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Registration Date</div>
                  <div className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Financial Data</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="font-mono font-medium text-lg">${selectedUser.balance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Profit</div>
                    <div className="font-mono font-medium text-lg text-cyan-400">${selectedUser.currentProfit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Profit (Lifetime)</div>
                    <div className="font-mono font-medium text-green-400">${selectedUser.totalProfit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Remaining Balance</div>
                    <div className="font-mono font-medium">${selectedUser.remainingBalance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Deposits</div>
                    <div className="font-mono font-medium">${selectedUser.totalDeposit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">First Deposit (FTD)</div>
                    <div className="font-mono font-medium text-yellow-400">
                      ${selectedUser.firstDepositAmount > 0 ? selectedUser.firstDepositAmount.toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                    <div className="font-mono font-medium">${selectedUser.totalWithdraw.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Withdrawal Status</div>
                    <Badge
                      variant="outline"
                      className={
                        selectedUser.withdrawalStatus === 'allowed'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : selectedUser.withdrawalStatus === 'blocked'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }
                    >
                      {selectedUser.withdrawalStatus === 'allowed'
                        ? '✓ Allowed'
                        : selectedUser.withdrawalStatus === 'blocked'
                          ? '✗ Blocked'
                          : '⏳ Verification'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Referral Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Referrals Count</div>
                    <div className="font-medium text-purple-400">{selectedUser.referralCount} users</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Referred By</div>
                    <div className="font-medium">{selectedUser.referredBy || '—'}</div>
                  </div>
                </div>
              </div>

              {(selectedUser.marketingSource || selectedUser.utmParams) && (
                <div className="pt-4 border-t border-border">
                  <div className="text-sm font-medium mb-3">Marketing Data</div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.marketingSource && (
                      <div>
                        <div className="text-sm text-muted-foreground">Traffic Source</div>
                        <div className="font-medium">{selectedUser.marketingSource}</div>
                      </div>
                    )}
                    {selectedUser.utmParams && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">UTM Parameters</div>
                        <div className="text-xs font-mono bg-muted/30 p-2 rounded mt-1">{selectedUser.utmParams}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Security & Access</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Blocked in Bot</div>
                    <Badge
                      variant="outline"
                      className={
                        selectedUser.isBlocked
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }
                    >
                      {selectedUser.isBlocked ? '✗ Yes' : '✓ No'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">KYC Required</div>
                    <Badge
                      variant="outline"
                      className={
                        selectedUser.kycRequired
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }
                    >
                      {selectedUser.kycRequired ? 'Yes' : 'No'}
                    </Badge>
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
