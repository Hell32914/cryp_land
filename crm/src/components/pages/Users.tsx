import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import { useApiQuery } from '@/hooks/use-api-query'
import { fetchUsers, type UserRecord } from '@/lib/api'
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
import { useAuth } from '@/lib/auth'

export function Users() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)

  const { data, isLoading, isError } = useApiQuery(['users', debouncedSearch], (authToken) => fetchUsers(authToken, debouncedSearch), {
    enabled: Boolean(token),
  })

  const users = data?.users ?? []

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
                    <TableHead>{t('users.id')}</TableHead>
                    <TableHead>{t('users.userId')}</TableHead>
                    <TableHead>{t('users.username')}</TableHead>
                    <TableHead>{t('users.fullName')}</TableHead>
                    <TableHead>{t('users.country')}</TableHead>
                    <TableHead>{t('users.status')}</TableHead>
                    <TableHead className="text-right">{t('users.balance')}</TableHead>
                    <TableHead className="text-right">{t('users.totalDeposit')}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-muted-foreground">{user.id}</TableCell>
                      <TableCell className="font-mono">{user.telegramId}</TableCell>
                      <TableCell className="font-medium">{user.username || '—'}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${user.balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${user.totalDeposit.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          {t('users.viewDetails')}
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-mono font-medium">{selectedUser.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.userId')}</div>
                  <div className="font-mono font-medium">{selectedUser.telegramId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.username')}</div>
                  <div className="font-medium">{selectedUser.username || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.fullName')}</div>
                  <div className="font-medium">{selectedUser.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.country')}</div>
                  <div>{selectedUser.country}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.plan')}</div>
                  <div className="font-medium">{selectedUser.plan}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.status')}</div>
                  <Badge variant="outline" className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.balance')}</div>
                  <div className="font-mono font-medium">${selectedUser.balance.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Profit</div>
                  <div className="font-mono font-medium">${selectedUser.profit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.totalDeposit')}</div>
                  <div className="font-mono font-medium">${selectedUser.totalDeposit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Withdraw</div>
                  <div className="font-mono font-medium">${selectedUser.totalWithdraw.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">KYC Required</div>
                  <Badge variant="outline" className={selectedUser.kycRequired ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}>
                    {selectedUser.kycRequired ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Blocked</div>
                  <Badge variant="outline" className={selectedUser.isBlocked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}>
                    {selectedUser.isBlocked ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created At</div>
                  <div className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
