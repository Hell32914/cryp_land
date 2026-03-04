import { useEffect, useMemo, useState } from 'react'
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
import { fetchTradeUsers, setUserTradeArbitrageTypeLimit, setUserTradeAssetsLimit, setUserTradeExchangeLimit } from '@/lib/api'

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

export function TradeUsers() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [draftExchangeLimits, setDraftExchangeLimits] = useState<Record<string, string>>({})
  const [draftAssetLimits, setDraftAssetLimits] = useState<Record<string, string>>({})
  const [draftArbitrageTypeLimits, setDraftArbitrageTypeLimits] = useState<Record<string, string>>({})
  const pageSize = 50

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trade-users', token, page, search],
    queryFn: () => fetchTradeUsers(token!, {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
    }),
    enabled: !!token,
    refetchInterval: 15000,
  })

  const users = data?.users ?? []

  useEffect(() => {
    setDraftExchangeLimits((prev) => {
      const next = { ...prev }
      for (const user of users) {
        if (typeof next[user.telegramId] === 'undefined') {
          next[user.telegramId] = String(Math.max(1, Number(user.tradeExchangesLimit || 1)))
        }
      }
      return next
    })

    setDraftAssetLimits((prev) => {
      const next = { ...prev }
      for (const user of users) {
        if (typeof next[user.telegramId] === 'undefined') {
          next[user.telegramId] = String(Math.max(1, Number(user.tradeAssetsLimit || 2)))
        }
      }
      return next
    })

    setDraftArbitrageTypeLimits((prev) => {
      const next = { ...prev }
      for (const user of users) {
        if (typeof next[user.telegramId] === 'undefined') {
          next[user.telegramId] = String(Math.max(1, Number(user.tradeArbitrageTypeLimit || 1)))
        }
      }
      return next
    })
  }, [users])

  const totals = useMemo(() => {
    return {
      count: data?.totalCount ?? users.length,
    }
  }, [data?.totalCount, users.length])

  const setExchangeLimitMutation = useMutation({
    mutationFn: ({ telegramId, limit }: { telegramId: string; limit: number }) => setUserTradeExchangeLimit(token!, telegramId, limit),
    onSuccess: (_, vars) => {
      setDraftExchangeLimits((prev) => ({ ...prev, [vars.telegramId]: String(vars.limit) }))
      queryClient.invalidateQueries({ queryKey: ['trade-users'] })
    },
  })

  const setAssetLimitMutation = useMutation({
    mutationFn: ({ telegramId, assetsLimit }: { telegramId: string; assetsLimit: number }) =>
      setUserTradeAssetsLimit(token!, telegramId, assetsLimit),
    onSuccess: (_, vars) => {
      setDraftAssetLimits((prev) => ({ ...prev, [vars.telegramId]: String(vars.assetsLimit) }))
      queryClient.invalidateQueries({ queryKey: ['trade-users'] })
    },
  })

  const setArbitrageTypeLimitMutation = useMutation({
    mutationFn: ({ telegramId, arbitrageTypeLimit }: { telegramId: string; arbitrageTypeLimit: number }) =>
      setUserTradeArbitrageTypeLimit(token!, telegramId, arbitrageTypeLimit),
    onSuccess: (_, vars) => {
      setDraftArbitrageTypeLimits((prev) => ({ ...prev, [vars.telegramId]: String(vars.arbitrageTypeLimit) }))
      queryClient.invalidateQueries({ queryKey: ['trade-users'] })
    },
  })

  const submitExchangeLimit = (telegramId: string, fallbackCurrent: number) => {
    const raw = Number(draftExchangeLimits[telegramId])
    const normalized = Math.max(1, Number.isFinite(raw) ? Math.floor(raw) : fallbackCurrent)
    setExchangeLimitMutation.mutate({ telegramId, limit: normalized })
  }

  const submitAssetLimit = (telegramId: string, fallbackCurrent: number) => {
    const raw = Number(draftAssetLimits[telegramId])
    const normalized = Math.max(1, Number.isFinite(raw) ? Math.floor(raw) : fallbackCurrent)
    setAssetLimitMutation.mutate({ telegramId, assetsLimit: normalized })
  }

  const stepExchangeLimit = (telegramId: string, current: number, delta: number) => {
    const next = Math.max(1, current + delta)
    setDraftExchangeLimits((prev) => ({ ...prev, [telegramId]: String(next) }))
    setExchangeLimitMutation.mutate({ telegramId, limit: next })
  }

  const stepAssetLimit = (telegramId: string, current: number, delta: number) => {
    const next = Math.max(1, current + delta)
    setDraftAssetLimits((prev) => ({ ...prev, [telegramId]: String(next) }))
    setAssetLimitMutation.mutate({ telegramId, assetsLimit: next })
  }

  const submitArbitrageTypeLimit = (telegramId: string, fallbackCurrent: number) => {
    const raw = Number(draftArbitrageTypeLimits[telegramId])
    const normalized = Math.max(1, Number.isFinite(raw) ? Math.floor(raw) : fallbackCurrent)
    setArbitrageTypeLimitMutation.mutate({ telegramId, arbitrageTypeLimit: normalized })
  }

  const stepArbitrageTypeLimit = (telegramId: string, current: number, delta: number) => {
    const next = Math.max(1, current + delta)
    setDraftArbitrageTypeLimits((prev) => ({ ...prev, [telegramId]: String(next) }))
    setArbitrageTypeLimitMutation.mutate({ telegramId, arbitrageTypeLimit: next })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('trade.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('trade.subtitle')}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-sm text-muted-foreground">{t('trade.total')}</div>
          <div className="text-2xl font-bold text-cyan-400">{totals.count}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-[240px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder={t('trade.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table className="min-w-[1320px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead className="hidden md:table-cell">Telegram ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="hidden md:table-cell">Full Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">{t('trade.exchangesLimit')}</TableHead>
                  <TableHead className="text-right">{t('trade.assetsLimit')}</TableHead>
                  <TableHead className="text-right">{t('trade.arbitrageTypeLimit')}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(8)].map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan={10}>
                        <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-destructive">
                      {t('common.error')}
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-muted-foreground">
                      {t('trade.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const currentExchangeLimit = Math.max(1, Number(user.tradeExchangesLimit || 1))
                    const draftExchangeValue = draftExchangeLimits[user.telegramId] ?? String(currentExchangeLimit)
                    const draftExchangeNumeric = Number(draftExchangeValue)
                    const normalizedExchangeDraft = Math.max(
                      1,
                      Number.isFinite(draftExchangeNumeric) ? Math.floor(draftExchangeNumeric) : currentExchangeLimit,
                    )
                    const isExchangeDirty = normalizedExchangeDraft !== currentExchangeLimit

                    const currentAssetsLimit = Math.max(1, Number(user.tradeAssetsLimit || 2))
                    const draftAssetValue = draftAssetLimits[user.telegramId] ?? String(currentAssetsLimit)
                    const draftAssetNumeric = Number(draftAssetValue)
                    const normalizedAssetDraft = Math.max(
                      1,
                      Number.isFinite(draftAssetNumeric) ? Math.floor(draftAssetNumeric) : currentAssetsLimit,
                    )
                    const isAssetDirty = normalizedAssetDraft !== currentAssetsLimit

                    const currentArbitrageTypeLimit = Math.max(1, Number(user.tradeArbitrageTypeLimit || 1))
                    const draftArbitrageTypeValue = draftArbitrageTypeLimits[user.telegramId] ?? String(currentArbitrageTypeLimit)
                    const draftArbitrageTypeNumeric = Number(draftArbitrageTypeValue)
                    const normalizedArbitrageTypeDraft = Math.max(
                      1,
                      Number.isFinite(draftArbitrageTypeNumeric) ? Math.floor(draftArbitrageTypeNumeric) : currentArbitrageTypeLimit,
                    )
                    const isArbitrageTypeDirty = normalizedArbitrageTypeDraft !== currentArbitrageTypeLimit
                    const isMutationPending =
                      setExchangeLimitMutation.isPending ||
                      setAssetLimitMutation.isPending ||
                      setArbitrageTypeLimitMutation.isPending

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-sm">#{user.id}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground hidden md:table-cell">
                          {user.telegramId}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{user.username || '—'}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{user.fullName}</TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">{user.country}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-cyan-400 text-sm">
                          {currentExchangeLimit}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-violet-400 text-sm">
                          {currentAssetsLimit}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-amber-400 text-sm">
                          {currentArbitrageTypeLimit}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground min-w-16 text-right">EX</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => stepExchangeLimit(user.telegramId, currentExchangeLimit, -1)}
                                disabled={isMutationPending || currentExchangeLimit <= 1}
                              >
                                -1
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => stepExchangeLimit(user.telegramId, currentExchangeLimit, 1)}
                                disabled={isMutationPending}
                              >
                                +1
                              </Button>
                              <Input
                                value={draftExchangeValue}
                                onChange={(e) => setDraftExchangeLimits((prev) => ({ ...prev, [user.telegramId]: e.target.value }))}
                                className="w-16 text-right"
                                inputMode="numeric"
                              />
                              <Button
                                size="sm"
                                onClick={() => submitExchangeLimit(user.telegramId, currentExchangeLimit)}
                                disabled={isMutationPending || !isExchangeDirty}
                              >
                                {t('trade.save')}
                              </Button>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground min-w-16 text-right">AS</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => stepAssetLimit(user.telegramId, currentAssetsLimit, -1)}
                                disabled={isMutationPending || currentAssetsLimit <= 1}
                              >
                                -1
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => stepAssetLimit(user.telegramId, currentAssetsLimit, 1)}
                                disabled={isMutationPending}
                              >
                                +1
                              </Button>
                              <Input
                                value={draftAssetValue}
                                onChange={(e) => setDraftAssetLimits((prev) => ({ ...prev, [user.telegramId]: e.target.value }))}
                                className="w-16 text-right"
                                inputMode="numeric"
                              />
                              <Button
                                size="sm"
                                onClick={() => submitAssetLimit(user.telegramId, currentAssetsLimit)}
                                disabled={isMutationPending || !isAssetDirty}
                              >
                                {t('trade.save')}
                              </Button>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground min-w-16 text-right">AR</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => stepArbitrageTypeLimit(user.telegramId, currentArbitrageTypeLimit, -1)}
                                disabled={isMutationPending || currentArbitrageTypeLimit <= 1}
                              >
                                -1
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => stepArbitrageTypeLimit(user.telegramId, currentArbitrageTypeLimit, 1)}
                                disabled={isMutationPending}
                              >
                                +1
                              </Button>
                              <Input
                                value={draftArbitrageTypeValue}
                                onChange={(e) =>
                                  setDraftArbitrageTypeLimits((prev) => ({
                                    ...prev,
                                    [user.telegramId]: e.target.value,
                                  }))
                                }
                                className="w-16 text-right"
                                inputMode="numeric"
                              />
                              <Button
                                size="sm"
                                onClick={() => submitArbitrageTypeLimit(user.telegramId, currentArbitrageTypeLimit)}
                                disabled={isMutationPending || !isArbitrageTypeDirty}
                              >
                                {t('trade.save')}
                              </Button>
                            </div>
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
