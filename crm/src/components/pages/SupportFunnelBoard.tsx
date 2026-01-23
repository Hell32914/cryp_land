import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiQuery } from '@/hooks/use-api-query'
import { useAuth } from '@/lib/auth'
import {
  fetchSupportChats,
  acceptSupportChat,
  setSupportChatStage,
  fetchDeposits,
  type SupportChatRecord,
  type DepositRecord,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  canonicalizeStageId,
  getPrimaryStageId,
  loadSupportChatStageMap,
  loadSupportFunnelStages,
  loadSupportStageAliases,
  saveSupportFunnelStages,
  saveSupportChatStageMap,
  subscribeSupportFunnelUpdates,
  type SupportFunnelStage,
} from '@/lib/support-funnel'

const UNKNOWN_STAGE_ID = '__unknown_stage__'
const PENDING_DEPOSIT_STAGE_ID = '__deposit_processing__'

function prettifyStageId(id: string): string {
  const v = String(id || '').trim()
  if (!v) return ''

  const known: Record<string, string> = {
    primary: 'Primary contact',
    'in-process': 'In process',
    'first-touch': 'First touch',
    deposit: 'Deposit',
    'not-active-1': 'Not active 1',
    'not-active-2': 'Not active 2',
    'not-active-3': 'Not active 3',
    'never-answer': 'Never answer',
    'not-interesting': 'Not interesting',
    troll: 'Troll',
    spam: 'Spam',
  }

  if (known[v]) return known[v]

  // Generic: kebab/snake -> Title Case.
  const words = v
    .replace(/[_\s]+/g, '-')
    .split('-')
    .filter(Boolean)

  if (!words.length) return v
  return words
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

type ColumnId = 'unaccepted' | string

type DragPayload = {
  chatId: string
  from: ColumnId
}

function getUsernameFromJwt(token?: string | null): string | null {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const json = window.atob(padded)
    const data = JSON.parse(json)
    return typeof data?.username === 'string' ? data.username : null
  } catch {
    return null
  }
}

function getFallbackChar(chat: SupportChatRecord) {
  return (chat.username?.[0] || chat.firstName?.[0] || chat.telegramId?.[0] || '?').toUpperCase()
}

function getDisplayName(chat: SupportChatRecord) {
  return chat.username ? `@${chat.username}` : [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId
}

function formatWhen(ts?: string | null) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

function isPendingDeposit(deposit: DepositRecord) {
  const status = String(deposit.status || '').toUpperCase()
  const depStatus = String(deposit.depStatus || '').toLowerCase()
  return depStatus === 'processing' || status === 'PENDING' || status === 'PROCESSING'
}

function normalizeStageId(value: string | null | undefined, aliases: Record<string, string>): string | null {
  const base = canonicalizeStageId(value)
  if (!base) return null

  let cur = base
  const seen = new Set<string>()
  while (aliases[cur] && !seen.has(cur)) {
    seen.add(cur)
    cur = canonicalizeStageId(aliases[cur]) || aliases[cur]
  }
  return cur
}

export function SupportFunnelBoard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const myUsername = useMemo(() => getUsernameFromJwt(token), [token])

  const defaultStages = useMemo<SupportFunnelStage[]>(
    () => [
      { id: getPrimaryStageId(), label: t('support.funnel.primary'), locked: true },
      { id: 'secondary', label: t('support.funnel.secondary') },
      { id: 'decision', label: t('support.funnel.decision') },
      { id: 'success', label: t('support.funnel.success') },
      { id: 'fail', label: t('support.funnel.fail') },
      { id: 'not-active-2', label: t('support.funnel.notActive2') },
      { id: 'not-active-3', label: t('support.funnel.notActive3') },
      { id: 'never-answer', label: t('support.funnel.neverAnswer') },
      { id: 'not-interesting', label: t('support.funnel.notInteresting') },
      { id: 'troll', label: t('support.funnel.troll') },
      { id: 'spam', label: t('support.funnel.spam') },
    ],
    [t]
  )

  const [funnelStages, setFunnelStages] = useState<SupportFunnelStage[]>(defaultStages)
  const [chatStageMap, setChatStageMap] = useState<Record<string, string>>({})
  const [stageAliases, setStageAliases] = useState<Record<string, string>>({})

  const [search, setSearch] = useState('')
  const [operatorFilter, setOperatorFilter] = useState<string>('all')

  const columnsScrollRef = useRef<HTMLDivElement | null>(null)
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const [columnsScrollWidth, setColumnsScrollWidth] = useState(0)
  const [columnsClientWidth, setColumnsClientWidth] = useState(0)
  const isSyncingScrollRef = useRef(false)
  const lastMeasuredRef = useRef<{ scrollWidth: number; clientWidth: number }>({ scrollWidth: 0, clientWidth: 0 })

  useEffect(() => {
    const reloadAll = () => {
      setFunnelStages(loadSupportFunnelStages(defaultStages))
      setChatStageMap(loadSupportChatStageMap())
      setStageAliases(loadSupportStageAliases())
    }

    reloadAll()

    const unsubscribe = subscribeSupportFunnelUpdates((kind) => {
      if (kind === 'stages') setFunnelStages(loadSupportFunnelStages(defaultStages))
      if (kind === 'chatStageMap') setChatStageMap(loadSupportChatStageMap())
      if (kind === 'stageAliases') setStageAliases(loadSupportStageAliases())
    })

    return unsubscribe
  }, [defaultStages])

  const primaryStageId = funnelStages.find((s) => s.id === getPrimaryStageId())?.id || getPrimaryStageId()

  const knownStageIds = useMemo(() => new Set(funnelStages.map((s) => s.id)), [funnelStages])

  const { data: chatsData, isLoading: isChatsLoading, isError: isChatsError } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportChats>>
  >(['support-chats-board'], (authToken) => fetchSupportChats(authToken, undefined, 1, 1000), {
    enabled: Boolean(token),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  const { data: depositsData } = useApiQuery<Awaited<ReturnType<typeof fetchDeposits>>>(
    ['support-pending-deposits'],
    (authToken) => fetchDeposits(authToken, { page: 1, limit: 1000 }),
    {
      enabled: Boolean(token),
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    },
  )

  const chats = chatsData?.chats ?? []

  const pendingDepositTelegramIds = useMemo(() => {
    const set = new Set<string>()
    for (const deposit of depositsData?.deposits ?? []) {
      if (!deposit?.user?.telegramId) continue
      if (!isPendingDeposit(deposit)) continue
      set.add(String(deposit.user.telegramId))
    }
    return set
  }, [depositsData])

  // Self-heal: if local funnel config was reset/cleared, but DB contains stage IDs,
  // auto-add those missing stages so chats don't collapse into Primary/Unknown.
  useEffect(() => {
    if (!chats.length) return
    const existing = new Set(funnelStages.map((s) => s.id))
    const missingIds: string[] = []

    for (const c of chats) {
      const id = normalizeStageId(c.funnelStageId, stageAliases)
      if (!id) continue
      if (id === UNKNOWN_STAGE_ID) continue
      if (existing.has(id)) continue
      missingIds.push(id)
      existing.add(id)
    }

    if (!missingIds.length) return

    setFunnelStages((prev) => {
      const next = [...prev, ...missingIds.map((id) => ({ id, label: prettifyStageId(id) || id }))]
      // Persist so it survives reloads.
      saveSupportFunnelStages(next)
      return next
    })
  }, [chats, funnelStages, stageAliases])

  const operatorOptions = useMemo(() => {
    const set = new Set<string>()
    for (const chat of chats) {
      if (chat.acceptedBy) set.add(chat.acceptedBy)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [chats])

  const setStageMutation = useMutation({
    mutationFn: ({ chatId, stageId }: { chatId: string; stageId: string }) => setSupportChatStage(token!, chatId, stageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      await queryClient.invalidateQueries({ queryKey: ['support-chats-board'] })
    },
    onError: (e: any) => toast.error(e?.message || t('common.error')),
  })

  const acceptMutation = useMutation({
    mutationFn: ({ chatId }: { chatId: string; stageId?: string; prevStageId?: string }) =>
      acceptSupportChat(token!, chatId),
    onSuccess: async (updated, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      await queryClient.invalidateQueries({ queryKey: ['support-chats-board'] })
      // Default stage after accept: keep dropped stage if provided.
      const stageId = vars?.stageId || chatStageMap[updated.chatId] || primaryStageId
      setStage(updated.chatId, stageId)
      // Persist stage after acceptance.
      setStageMutation.mutate({ chatId: updated.chatId, stageId })
      toast.success(t('support.accepted'))
    },
    onError: (e: any, vars) => {
      // Rollback stage map for optimistic drop.
      if (vars?.chatId) {
        setChatStageMap((prev) => {
          const next = { ...prev }
          if (vars.prevStageId) next[vars.chatId] = vars.prevStageId
          else delete next[vars.chatId]
          saveSupportChatStageMap(next)
          return next
        })
      }
      toast.error(e?.message || t('support.acceptFailed'))
    },
  })

  const setStage = (chatId: string, stageId: string) => {
    setChatStageMap((prev) => {
      const next = { ...prev, [chatId]: stageId }
      saveSupportChatStageMap(next)
      return next
    })
  }

  const openChat = (chatId: string) => {
    window.dispatchEvent(new CustomEvent('crm:navigate', { detail: { page: 'support', supportChatId: chatId } }))
  }

  const getColumnIdForChat = (chat: SupportChatRecord): ColumnId => {
    const status = String(chat.status || '').toUpperCase()
    if (status === 'ARCHIVE') return 'archived'
    if (status !== 'ACCEPTED') return 'unaccepted'

    if (pendingDepositTelegramIds.has(String(chat.telegramId))) return PENDING_DEPOSIT_STAGE_ID

    const resolvedStageId =
      normalizeStageId(chat.funnelStageId, stageAliases) ||
      normalizeStageId(chatStageMap[chat.chatId], stageAliases) ||
      primaryStageId

    // If DB has a stage that isn't present in this browser's local funnel config,
    // keep the chat visible instead of dropping it from the board.
    return knownStageIds.has(resolvedStageId) ? resolvedStageId : UNKNOWN_STAGE_ID
  }

  const columns = useMemo(() => {
    const base = [{ id: 'unaccepted', title: t('supportBoard.unaccepted') } as const]
    const stageColumns = funnelStages.map((s) => ({ id: s.id, title: s.label }))
    const unknown = [{ id: UNKNOWN_STAGE_ID, title: t('supportBoard.unknownStage') }]
    const depositProcessing = [{ id: PENDING_DEPOSIT_STAGE_ID, title: t('supportBoard.depositProcessing') }]
    return [...base, ...stageColumns, ...unknown, ...depositProcessing]
  }, [funnelStages, t])

  const searchTerm = useMemo(() => {
    const raw = search.trim().toLowerCase()
    if (!raw) return ''
    return raw.startsWith('@') ? raw.slice(1) : raw
  }, [search])

  const columnChats = useMemo(() => {
    const map: Record<string, SupportChatRecord[]> = {}
    for (const col of columns) map[col.id] = []

    for (const chat of chats) {
      const status = String(chat.status || '').toUpperCase()
      if (status === 'ARCHIVE') continue

      // Search filter (tag/id/nick)
      if (searchTerm) {
        const hay = [
          chat.telegramId,
          chat.chatId,
          chat.username || '',
          chat.firstName || '',
          chat.lastName || '',
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(searchTerm)) continue
      }

      // Operator filter
      if (operatorFilter !== 'all') {
        if (operatorFilter === 'unassigned' && chat.acceptedBy) continue
        if (operatorFilter === 'me' && (!myUsername || chat.acceptedBy !== myUsername)) continue
        if (operatorFilter.startsWith('op:') && chat.acceptedBy !== operatorFilter.slice(3)) continue
      }

      const col = getColumnIdForChat(chat)
      if (col in map) map[col].push(chat)
    }

    // Sort: newest first
    for (const col of Object.keys(map)) {
      map[col].sort((a, b) => {
        const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return bt - at
      })
    }

    return map
  }, [chats, columns, chatStageMap, primaryStageId, operatorFilter, myUsername, searchTerm, stageAliases, pendingDepositTelegramIds])

  // Keep a top horizontal scrollbar synced with the columns scroller.
  // Use layout-timed measurement + a few re-measures so the scrollbar is correct
  // even when navigating between pages (and layout/fonts settle after mount).
  useLayoutEffect(() => {
    const el = columnsScrollRef.current
    if (!el) return

    const update = () => {
      const scrollWidth = el.scrollWidth
      const clientWidth = el.clientWidth
      const prev = lastMeasuredRef.current
      if (prev.scrollWidth !== scrollWidth) setColumnsScrollWidth(scrollWidth)
      if (prev.clientWidth !== clientWidth) setColumnsClientWidth(clientWidth)
      if (prev.scrollWidth !== scrollWidth || prev.clientWidth !== clientWidth) {
        lastMeasuredRef.current = { scrollWidth, clientWidth }
      }
    }

    const scheduleUpdate = () => {
      update()
      // A few deferred re-measures helps when layout stabilizes asynchronously.
      requestAnimationFrame(update)
      requestAnimationFrame(() => requestAnimationFrame(update))
      window.setTimeout(update, 0)
      window.setTimeout(update, 120)
      window.setTimeout(update, 400)
    }

    scheduleUpdate()

    const onWindowResize = () => update()
    window.addEventListener('resize', onWindowResize)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') scheduleUpdate()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => update()) : null
    ro?.observe(el)

    // scrollWidth can change without resizing the container (content changes),
    // so also observe DOM mutations.
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => scheduleUpdate()) : null
    mo?.observe(el, { childList: true, subtree: true })

    const fontsReady: Promise<unknown> | null = (document as any)?.fonts?.ready || null
    fontsReady?.then(() => scheduleUpdate()).catch(() => {})

    return () => {
      window.removeEventListener('resize', onWindowResize)
      document.removeEventListener('visibilitychange', onVisibility)
      ro?.disconnect()
      mo?.disconnect()
    }
  }, [columns.length])

  const hasHorizontalOverflow = columnsScrollWidth > columnsClientWidth + 2

  const syncScroll = (source: 'top' | 'columns') => {
    const top = topScrollRef.current
    const columnsEl = columnsScrollRef.current
    if (!top || !columnsEl) return
    if (isSyncingScrollRef.current) return

    isSyncingScrollRef.current = true
    try {
      if (source === 'top') {
        columnsEl.scrollLeft = top.scrollLeft
      } else {
        top.scrollLeft = columnsEl.scrollLeft
      }
    } finally {
      // Release sync flag on next frame to avoid oscillation.
      requestAnimationFrame(() => {
        isSyncingScrollRef.current = false
      })
    }
  }

  const handleDrop = async (payload: DragPayload, to: ColumnId) => {
    if (!payload?.chatId) return
    if (to === 'unaccepted') return
    if (to === UNKNOWN_STAGE_ID) return
    if (to === PENDING_DEPOSIT_STAGE_ID) return

    const chat = chats.find((c) => c.chatId === payload.chatId)
    if (!chat) return

    if (chat.acceptedBy && myUsername && chat.acceptedBy !== myUsername) {
      toast.error(t('support.lockedByOther', { name: chat.acceptedBy }))
      return
    }

    const status = String(chat.status || '').toUpperCase()

    const prevStageId = chatStageMap[payload.chatId]

    // Dragging from unaccepted into a funnel stage implicitly accepts.
    if (status !== 'ACCEPTED') {
      setStage(payload.chatId, to)
      acceptMutation.mutate({ chatId: payload.chatId, stageId: to, prevStageId })
      return
    }

    setStage(payload.chatId, to)
    setStageMutation.mutate({ chatId: payload.chatId, stageId: to })
  }

  if (isChatsLoading) {
    return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
  }

  if (isChatsError) {
    return <div className="text-sm text-destructive">{t('common.error')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('supportBoard.title')}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px] max-w-[420px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('supportBoard.searchPlaceholder')}
          />
        </div>
        <div className="min-w-[240px]">
          <Select value={operatorFilter} onValueChange={setOperatorFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('supportBoard.operatorFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('supportBoard.operatorAll')}</SelectItem>
              {myUsername ? <SelectItem value="me">{t('supportBoard.operatorMe')}</SelectItem> : null}
              <SelectItem value="unassigned">{t('supportBoard.operatorUnassigned')}</SelectItem>
              {operatorOptions.map((name) => (
                <SelectItem key={name} value={`op:${name}`}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        ref={topScrollRef}
        onScroll={() => syncScroll('top')}
        className={
          'w-full overflow-x-auto overflow-y-hidden rounded-md border border-border bg-muted/20 ' +
          // On Windows the scrollbar height + borders can exceed h-5, so keep it taller.
          'h-7 ' +
          (hasHorizontalOverflow ? '' : 'opacity-0 pointer-events-none')
        }
        aria-label="Horizontal scroll"
      >
        <div style={{ width: columnsScrollWidth, height: 1 }} />
      </div>

      <div ref={columnsScrollRef} onScroll={() => syncScroll('columns')} className="w-full flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => {
          const items = columnChats[col.id] || []

          return (
            <Card key={col.id} className="min-w-[320px] max-w-[360px] flex-shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold truncate">{col.title}</CardTitle>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
              </CardHeader>

              <CardContent
                className="space-y-3 min-h-[520px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  try {
                    const raw = e.dataTransfer.getData('application/json')
                    const payload = JSON.parse(raw) as DragPayload
                    handleDrop(payload, col.id)
                  } catch {
                    // ignore
                  }
                }}
              >
                {items.length === 0 ? (
                  <div className="text-xs text-muted-foreground">{t('supportBoard.empty')}</div>
                ) : (
                  items.map((chat) => {
                    const name = getDisplayName(chat)
                    const when = formatWhen(chat.lastMessageAt)
                    const fallbackChar = getFallbackChar(chat)

                    const canDrag = !chat.acceptedBy || (myUsername ? chat.acceptedBy === myUsername : false)

                    return (
                      <div
                        key={chat.chatId}
                        draggable={canDrag}
                        onClick={() => openChat(chat.chatId)}
                        onDragStart={(e) => {
                          if (!canDrag) {
                            e.preventDefault()
                            toast.error(t('support.lockedByOther', { name: chat.acceptedBy }))
                            return
                          }
                          const payload: DragPayload = { chatId: chat.chatId, from: getColumnIdForChat(chat) }
                          e.dataTransfer.setData('application/json', JSON.stringify(payload))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className={
                          canDrag
                            ? 'rounded-md border border-border bg-background p-3 shadow-sm hover:bg-muted/30 cursor-pointer'
                            : 'rounded-md border border-border bg-background p-3 shadow-sm opacity-70 cursor-not-allowed'
                        }
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="text-xs">{fallbackChar}</AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{name}</div>
                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                  {chat.lastMessageText || ''}
                                </div>
                              </div>
                              {chat.unreadCount > 0 ? (
                                <Badge className="bg-primary text-primary-foreground">{chat.unreadCount}</Badge>
                              ) : null}
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                              <div className="truncate">{when}</div>
                              {chat.acceptedBy ? (
                                <div className="truncate">{chat.acceptedBy}</div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
