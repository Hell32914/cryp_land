import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useAuth } from '@/lib/auth'
import { fetchBonusUsers, grantUserBonus, revokeUserBonus } from '@/lib/api'

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

export function BonusUsers() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasBonusOnly, setHasBonusOnly] = useState(false)
  const pageSize = 50

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bonus-users', token, page, search, hasBonusOnly],
    queryFn: () => fetchBonusUsers(token!, {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      hasBonus: hasBonusOnly ? true : undefined,
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

  const grantMutation = useMutation({
    mutationFn: (telegramId: string) => grantUserBonus(token!, telegramId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-users'] })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (telegramId: string) => revokeUserBonus(token!, telegramId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-users'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('bonus.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('bonus.subtitle')}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-sm text-muted-foreground">{t('bonus.total')}</div>
          <div className="text-2xl font-bold text-green-500">{totals.count}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-[240px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder={t('bonus.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={hasBonusOnly ? 'secondary' : 'outline'}
                onClick={() => {
                  setHasBonusOnly((v) => !v)
                  setPage(1)
                }}
              >
                {t('bonus.hasBonusFilter')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead className="hidden md:table-cell">Telegram ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="hidden md:table-cell">Full Name</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Granted At</TableHead>
                  <TableHead className="hidden lg:table-cell">Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      {t('bonus.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const hasBonus = (user.bonusTokens || 0) > 0
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-sm">#{user.id}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground hidden md:table-cell">
                          {user.telegramId}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{user.username || '—'}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{user.fullName}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-cyan-400 text-sm">
                          {(user.bonusTokens || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {user.contactSupportBonusGrantedAt ? new Date(user.contactSupportBonusGrantedAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">{user.country}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => grantMutation.mutate(user.telegramId)}
                              disabled={grantMutation.isPending}
                            >
                              {t('bonus.grant')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeMutation.mutate(user.telegramId)}
                              disabled={!hasBonus || revokeMutation.isPending}
                              className={!hasBonus ? 'opacity-50' : ''}
                            >
                              {t('bonus.revoke')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
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
    </div>
  )
}
