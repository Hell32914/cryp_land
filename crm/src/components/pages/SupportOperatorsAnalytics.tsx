import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'
import { useApiQuery } from '@/hooks/use-api-query'
import { fetchSupportChats, fetchSupportMessages, fetchSupportOperatorDeposits, type SupportChatRecord, type SupportMessageRecord } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'


type SupportAnalyticsRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'

type SupportOperatorsAnalyticsProps = {
  variant?: 'page' | 'embedded'
}

type OperatorStats = {
  operator: string
  chats: number
  totalMessages: number
  inboundMessages: number
  outboundMessages: number
  responseCount: number
  responseSumMs: number
  depositCount: number
  depositAmount: number
}

export function SupportOperatorsAnalytics({ variant = 'page' }: SupportOperatorsAnalyticsProps) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const isEmbedded = variant === 'embedded'
  const [range, setRange] = useState<SupportAnalyticsRange>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [rows, setRows] = useState<OperatorStats[]>([])
  const refreshKeyRef = useRef(0)

  const { data: chatsData } = useApiQuery<Awaited<ReturnType<typeof fetchSupportChats>>>(
    ['support-chats-operators'],
    (authToken) => fetchSupportChats(authToken, '', 1, 10000),
    {
      enabled: Boolean(token),
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
    }
  )

  const chats = chatsData?.chats ?? []

  const rangeOptions = useMemo(
    () => [
      { value: 'day' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.day') },
      { value: 'week' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.week') },
      { value: 'month' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.month') },
      { value: 'quarter' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.quarter') },
      { value: 'year' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.year') },
      { value: 'all' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.all') },
      { value: 'custom' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.custom') },
    ],
    [t]
  )

  const resolveRange = useCallback(
    (allChats: SupportChatRecord[]) => {
      const now = Date.now()
      const DAY_MS = 24 * 60 * 60 * 1000
      let fromTs = 0
      let toTs = now

      if (range === 'day') fromTs = now - DAY_MS
      if (range === 'week') fromTs = now - DAY_MS * 7
      if (range === 'month') fromTs = now - DAY_MS * 30
      if (range === 'quarter') fromTs = now - DAY_MS * 90
      if (range === 'year') fromTs = now - DAY_MS * 365
      if (range === 'all') {
        const earliest = allChats.reduce((min, chat) => {
          const raw = chat.startedAt || chat.createdAt
          const ts = raw ? new Date(raw).getTime() : 0
          if (!ts) return min
          if (!min || ts < min) return ts
          return min
        }, 0)
        fromTs = earliest
      }
      if (range === 'custom') {
        const customFromTs = customFrom ? new Date(customFrom).getTime() : 0
        const customToTs = customTo ? new Date(customTo).getTime() : 0
        if (customFromTs) fromTs = customFromTs
        if (customToTs) toTs = customToTs
      }

      if (!fromTs) fromTs = now - DAY_MS
      if (toTs < fromTs) [fromTs, toTs] = [toTs, fromTs]
      return { fromTs, toTs }
    },
    [customFrom, customTo, range]
  )

  const formatDuration = useCallback(
    (seconds: number | null) => {
      if (seconds === null || Number.isNaN(seconds)) return '—'
      const mins = Math.floor(seconds / 60)
      const secs = Math.round(seconds % 60)
      return `${mins}${t('support.minutesShort')} ${secs}${t('support.secondsShort')}`
    },
    [t]
  )

  const loadOperatorAnalytics = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    setTruncated(false)

    const runId = ++refreshKeyRef.current

    try {
      const { fromTs, toTs } = resolveRange(chats)
      const statsByOperator = new Map<string, OperatorStats>()

      const MAX_CHATS = 300
      const PAGE_LIMIT = range === 'all' ? 100 : 50
      const MAX_PAGES = range === 'all' ? 8 : 4
      let processedChats = 0
      let localTruncated = false

      const mapWithConcurrency = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) => {
        const results: R[] = []
        let index = 0
        const workers = Array.from({ length: limit }).map(async () => {
          while (index < items.length) {
            const current = items[index++]
            results.push(await fn(current))
          }
        })
        await Promise.all(workers)
        return results
      }

      const candidates = chats.filter((chat) => {
        const lastMessageTs = chat.lastMessageAt ? new Date(chat.lastMessageAt).getTime() : 0
        const startedTs = chat.startedAt ? new Date(chat.startedAt).getTime() : 0
        if (lastMessageTs && lastMessageTs >= fromTs) return true
        if (startedTs && startedTs >= fromTs) return true
        return false
      })

      const limitedChats = candidates.slice(0, MAX_CHATS)
      if (candidates.length > MAX_CHATS) localTruncated = true

      const CONCURRENCY = 6
      const perChatRows = await mapWithConcurrency(limitedChats, CONCURRENCY, async (chat) => {
        const operator = String(chat.acceptedBy || (chat as any).assignedAdminUsername || (chat as any).assignedTo || '').trim()
        if (!operator) return { operator: null, stats: null, truncated: false }

        let beforeId: number | undefined
        let pages = 0
        let hasMore = false
        const messages: SupportMessageRecord[] = []

        while (pages < MAX_PAGES) {
          const resp = await fetchSupportMessages(token, chat.chatId, {
            beforeId,
            limit: PAGE_LIMIT,
          })

          const batch = resp?.messages ?? []
          if (batch.length === 0) break

          messages.push(...batch)
          pages += 1
          hasMore = Boolean(resp?.hasMore)

          const oldest = batch[batch.length - 1]
          const oldestTs = oldest ? new Date(oldest.createdAt).getTime() : 0
          if (oldestTs && oldestTs < fromTs) break

          if (!resp?.nextBeforeId) break
          beforeId = resp.nextBeforeId
        }

        const localTruncated = pages >= MAX_PAGES && hasMore

        const inRange = messages.filter((msg) => {
          const ts = new Date(msg.createdAt).getTime()
          return ts >= fromTs && ts <= toTs
        })

        if (inRange.length === 0) return { operator, stats: null, truncated: localTruncated }

        const base: OperatorStats = {
          operator,
          chats: 1,
          totalMessages: inRange.length,
          inboundMessages: 0,
          outboundMessages: 0,
          responseCount: 0,
          responseSumMs: 0,
          depositCount: 0,
          depositAmount: 0,
        }

        const sorted = [...inRange].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )

        let pendingInboundTs: number | null = null

        for (const msg of sorted) {
          const ts = new Date(msg.createdAt).getTime()
          const dir = String(msg.direction).toUpperCase()

          if (dir === 'IN') {
            base.inboundMessages += 1
            pendingInboundTs = ts
            continue
          }

          base.outboundMessages += 1

          if (pendingInboundTs) {
            const diff = ts - pendingInboundTs
            if (diff >= 0) {
              base.responseSumMs += diff
              base.responseCount += 1
            }
            pendingInboundTs = null
          }
        }

        return { operator, stats: base, truncated: localTruncated }
      })

      for (const row of perChatRows) {
        if (row.truncated) localTruncated = true
        if (!row.stats || !row.operator) continue
        processedChats += 1
        const base = statsByOperator.get(row.operator) || {
          operator: row.operator,
          chats: 0,
          totalMessages: 0,
          inboundMessages: 0,
          outboundMessages: 0,
          responseCount: 0,
          responseSumMs: 0,
          depositCount: 0,
          depositAmount: 0,
        }
        base.chats += row.stats.chats
        base.totalMessages += row.stats.totalMessages
        base.inboundMessages += row.stats.inboundMessages
        base.outboundMessages += row.stats.outboundMessages
        base.responseCount += row.stats.responseCount
        base.responseSumMs += row.stats.responseSumMs
        statsByOperator.set(row.operator, base)
      }

      const depositsResp = await fetchSupportOperatorDeposits(token, fromTs, toTs)
      const depositsMap = new Map<string, { count: number; amount: number }>()
      for (const row of depositsResp.operators || []) {
        depositsMap.set(row.operator, { count: row.depositCount, amount: row.depositAmount })
      }

      for (const [operator, stats] of statsByOperator.entries()) {
        const dep = depositsMap.get(operator)
        if (dep) {
          stats.depositCount = dep.count
          stats.depositAmount = dep.amount
        }
      }

      for (const [operator, dep] of depositsMap.entries()) {
        if (!statsByOperator.has(operator)) {
          statsByOperator.set(operator, {
            operator,
            chats: 0,
            totalMessages: 0,
            inboundMessages: 0,
            outboundMessages: 0,
            responseCount: 0,
            responseSumMs: 0,
            depositCount: dep.count,
            depositAmount: dep.amount,
          })
        }
      }

      if (refreshKeyRef.current !== runId) return

      const rows = Array.from(statsByOperator.values()).sort((a, b) => b.chats - a.chats)
      setRows(rows)
      setTruncated(localTruncated)
    } catch (e: any) {
      if (refreshKeyRef.current !== runId) return
      setError(e?.message || t('common.error'))
    } finally {
      if (refreshKeyRef.current === runId) setLoading(false)
    }
  }, [chats, range, resolveRange, t, token])

  useEffect(() => {
    if (!token) return
    void loadOperatorAnalytics()
  }, [loadOperatorAnalytics, token])

  return (
    <div className={isEmbedded ? 'space-y-4' : 'space-y-6'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isEmbedded ? (
          <div className="text-lg font-semibold">{t('supportOperatorsAnalytics.title')}</div>
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight">{t('supportOperatorsAnalytics.title')}</h1>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={range} onValueChange={(v) => setRange(v as SupportAnalyticsRange)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('support.analytics.range')} />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {range === 'custom' ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="datetime-local"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full sm:w-[200px]"
                aria-label={t('support.analytics.customFrom')}
              />
              <Input
                type="datetime-local"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full sm:w-[200px]"
                aria-label={t('support.analytics.customTo')}
              />
            </div>
          ) : null}
          <Button variant="outline" onClick={loadOperatorAnalytics} className="w-full sm:w-auto">
            {t('support.analytics.refresh')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('supportOperatorsAnalytics.subtitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">{t('support.analytics.loading')}</div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('support.analytics.empty')}</div>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="whitespace-nowrap">{t('supportOperatorsAnalytics.columns.operator')}</TableHead>
                    <TableHead className="text-right whitespace-nowrap">{t('supportOperatorsAnalytics.columns.chats')}</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden md:table-cell">
                      {t('supportOperatorsAnalytics.columns.totalMessages')}
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden lg:table-cell">
                      {t('supportOperatorsAnalytics.columns.inbound')}
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden lg:table-cell">
                      {t('supportOperatorsAnalytics.columns.outbound')}
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">Deposits</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Deposits $</TableHead>
                    <TableHead className="text-right whitespace-nowrap">{t('supportOperatorsAnalytics.columns.avgResponse')}</TableHead>
                    <TableHead className="text-right whitespace-nowrap">{t('supportOperatorsAnalytics.columns.responseRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const avgResponse = row.responseCount > 0 ? Math.round(row.responseSumMs / row.responseCount / 1000) : null
                    const responseRate = row.inboundMessages > 0 ? Math.round((row.responseCount / row.inboundMessages) * 100) : null
                    return (
                      <TableRow key={row.operator} className="hover:bg-muted/30">
                        <TableCell className="font-medium whitespace-nowrap">{row.operator}</TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">{row.chats}</TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap hidden md:table-cell">
                          {row.totalMessages}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap hidden lg:table-cell">
                          {row.inboundMessages}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap hidden lg:table-cell">
                          {row.outboundMessages}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">{row.depositCount}</TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap hidden md:table-cell">
                          ${row.depositAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                          {formatDuration(avgResponse)}
                        </TableCell>
                        <TableCell className="text-right">
                          {responseRate !== null ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {responseRate}%
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {truncated ? (
            <div className="text-xs text-muted-foreground mt-2">{t('support.analytics.truncated')}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
