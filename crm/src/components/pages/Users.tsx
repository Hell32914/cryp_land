import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import { useApiQuery } from '@/hooks/use-api-query'
import { fetchUsers, updateUserRole, type UserRecord } from '@/lib/api'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function Users() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, isError } = useApiQuery(
    ['users', debouncedSearch, sortBy, sortOrder], 
    (authToken) => fetchUsers(authToken, debouncedSearch, sortBy, sortOrder), 
    {
      enabled: Boolean(token),
    }
  )

  const users = data?.users ?? []

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const updateRoleMutation = useMutation({
    mutationFn: ({ telegramId, role }: { telegramId: string; role: string }) =>
      updateUserRole(token!, telegramId, role),
    onSuccess: () => {
      toast.success('Role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    },
    onError: () => {
      toast.error('Failed to update role')
    },
  })

  const handleRoleChange = (role: string) => {
    if (selectedUser) {
      updateRoleMutation.mutate({ telegramId: selectedUser.telegramId, role })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'INACTIVE':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'KYC_REQUIRED':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'BLOCKED':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('users.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder={t('users.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Funnel size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                {isLoading ? (
                  <div className="space-y-2 p-6">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="h-10 w-full animate-pulse rounded bg-muted/50" />
                    ))}
                  </div>
                ) : isError ? (
                  <div className="p-6 text-sm text-destructive">{t('common.error')}</div>
                ) : (
                  <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('id')}
                    >
                      ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('username')}
                    >
                      Username {sortBy === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('country')}
                    >
                      Country {sortBy === 'country' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 text-right"
                      onClick={() => handleSort('balance')}
                    >
                      Balance {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 text-right"
                      onClick={() => handleSort('profit')}
                    >
                      Current Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Total Profit</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 text-right"
                      onClick={() => handleSort('totalDeposit')}
                    >
                      FTD {sortBy === 'totalDeposit' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 text-right"
                      onClick={() => handleSort('totalWithdraw')}
                    >
                      Withdrawals {sortBy === 'totalWithdraw' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-center">Referrals</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('createdAt')}
                    >
                      Registered {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                      <TableCell className="font-mono text-xs">{user.telegramId}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {user.username ? `@${user.username}` : user.fullName}
                      </TableCell>
                      <TableCell className="text-sm">{user.country}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${user.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-cyan-400">
                        ${user.currentProfit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-400">
                        ${user.totalProfit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${user.firstDepositAmount > 0 ? user.firstDepositAmount.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${user.totalWithdraw.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                          {user.referralCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('users.userDetails')}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Comment Section */}
              {selectedUser.comment && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs text-blue-400 font-medium mb-1">Comment</div>
                  <div className="text-sm text-blue-300">{selectedUser.comment}</div>
                </div>
              )}

              {/* Main Info */}
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

              {/* Financial Info */}
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
                    <Badge variant="outline" className={
                      selectedUser.withdrawalStatus === 'allowed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      selectedUser.withdrawalStatus === 'blocked' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }>
                      {selectedUser.withdrawalStatus === 'allowed' ? '✓ Allowed' :
                       selectedUser.withdrawalStatus === 'blocked' ? '✗ Blocked' :
                       '⏳ Verification'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Referral Info */}
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

              {/* Marketing Info */}
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

              {/* Security Info */}
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Security & Access</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Blocked in Bot</div>
                    <Badge variant="outline" className={selectedUser.isBlocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                      {selectedUser.isBlocked ? '✗ Yes' : '✓ No'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">KYC Required</div>
                    <Badge variant="outline" className={selectedUser.kycRequired ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                      {selectedUser.kycRequired ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-3">
                  <div className="text-sm font-medium">User Role</div>
                  <Select value={selectedUser.role || 'user'} onValueChange={handleRoleChange} disabled={updateRoleMutation.isPending}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Support: Can view users, manage cards, approve/reject withdrawals ≥ $100
                    <br />
                    Admin: Full access to all features
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
