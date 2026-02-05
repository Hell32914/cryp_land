import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiQuery } from '@/hooks/use-api-query'
import { useAuth } from '@/lib/auth'
import { useIsMobile } from '@/hooks/use-mobile'
import { SupportOperatorsAnalytics } from '@/components/pages/SupportOperatorsAnalytics'
import { decodeJwtClaims, normalizeCrmRole } from '@/lib/jwt'
import {
  fetchSupportChats,
  fetchSupportFileBlob,
  fetchSupportMessages,
  fetchSupportNotes,
  fetchSupportChatAvatar,
  acceptSupportChat,
  assignSupportChats,
  addSupportNote,
  updateSupportNote,
  deleteSupportNote,
  archiveSupportChat,
  blockSupportChat,
  unblockSupportChat,
  unarchiveSupportChat,
  markSupportChatRead,
  markSupportChatUnread,
  sendSupportPhoto,
  sendSupportMessage,
  deleteSupportMessage,
  setSupportChatStage,
  fetchCrmOperators,
  fetchUsers,
  fetchDeposits,
  fetchWithdrawals,
  type SupportChatRecord,
  type SupportMessageRecord,
  type SupportNoteRecord,
  type CrmOperatorRecord,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  PushPin,
  PushPinSlash,
  Bell,
  Paperclip,
  Plus,
  Minus,
  ArrowCounterClockwise,
  ArrowLeft,
  PencilSimple,
  TrashSimple,
  ArrowBendUpLeft,
  X,
} from '@phosphor-icons/react'
import {
  canonicalizeStageId,
  getPrimaryStageId,
  loadPinnedChatIds,
  loadSupportChatStageMap,
  loadSupportFunnelStages,
  loadSupportStageAliases,
  saveSupportFunnelStages,
  savePinnedChatIds,
  saveSupportChatStageMap,
  subscribeSupportFunnelUpdates,
  type SupportFunnelStage,
} from '@/lib/support-funnel'

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

  const words = v
    .replace(/[_\s]+/g, '-')
    .split('-')
    .filter(Boolean)

  if (!words.length) return v
  return words
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
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

const LEGACY_PENDING_DEPOSIT_ID = 'pending-deposit'

type SupportListTab = 'new' | 'accepted' | 'archive'
type SupportChatsTab = SupportListTab | 'analytics'
type SupportAnalyticsRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'
type SupportAnalyticsTab = 'overview' | 'operators'

type SupportMode = 'inbox' | 'analytics'

interface SupportProps {
  mode?: SupportMode
  analyticsTab?: SupportAnalyticsTab
}

export function Support({ mode = 'inbox', analyticsTab: initialAnalyticsTab = 'overview' }: SupportProps) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()

  const FUNNEL_RETURN_KEY = 'crm.support.funnelReturn'
  const [canReturnToFunnel, setCanReturnToFunnel] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem(FUNNEL_RETURN_KEY))
    } catch {
      return false
    }
  })

  const { username: myUsername, role: rawRole } = useMemo(() => decodeJwtClaims(token), [token])
  const myRole = useMemo(() => normalizeCrmRole(rawRole), [rawRole])
  const isAdmin = myRole === 'admin' || myRole === 'superadmin'

  const [search, setSearch] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<SupportChatsTab>('new')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(() => new Set())
  const [assignOperator, setAssignOperator] = useState('')
  const [analyticsRange, setAnalyticsRange] = useState<SupportAnalyticsRange>('week')
  const [analyticsTab, setAnalyticsTab] = useState<SupportAnalyticsTab>(initialAnalyticsTab)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<{
    fromTs: number
    toTs: number
    days: number
    totalMessages: number
    inboundMessages: number
    outboundMessages: number
    totalInquiries: number
    avgResponseSeconds: number | null
    responseCount: number
    activeChats: number
    avgMessagesPerChat: number | null
    responseRate: number | null
  } | null>(null)
  const [analyticsTruncated, setAnalyticsTruncated] = useState(false)
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0)
  const [messageText, setMessageText] = useState('')
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const photoPickerRef = useRef<HTMLInputElement | null>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const RESPONSE_MUTE_KEY = 'crm.support.responseMute.v1'
  const [responseMutedMap, setResponseMutedMap] = useState<Record<string, string>>(() => {
    try {
      const raw = window.localStorage.getItem(RESPONSE_MUTE_KEY)
      return raw ? (JSON.parse(raw) as Record<string, string>) : {}
    } catch {
      return {}
    }
  })

  const [avatarUrlByChatId, setAvatarUrlByChatId] = useState<Record<string, string>>({})
  const avatarUrlByChatIdRef = useRef<Record<string, string>>({})
  useEffect(() => {
    avatarUrlByChatIdRef.current = avatarUrlByChatId
  }, [avatarUrlByChatId])
  const avatarFileIdByChatIdRef = useRef<Record<string, string | null>>({})
  const avatarLoadingRef = useRef<Record<string, boolean>>({})

  const [fileUrlCache, setFileUrlCache] = useState<Record<string, string>>({})
  const [fileLoadError, setFileLoadError] = useState<Record<string, boolean>>({})

  const chatsListContainerRef = useRef<HTMLDivElement | null>(null)
  const chatsListViewportRef = useRef<HTMLElement | null>(null)
  const [isChatsListAtTop, setIsChatsListAtTop] = useState(true)
  const [hasNewChatsActivityAbove, setHasNewChatsActivityAbove] = useState(false)
  const [newChatsActivityCount, setNewChatsActivityCount] = useState(0)
  const prevChatMetaRef = useRef<Record<string, { lastMessageAt: string | null; unreadCount: number }>>({})

  const [noteText, setNoteText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  const [imageViewerSrc, setImageViewerSrc] = useState('')
  const [imageViewerZoom, setImageViewerZoom] = useState(1)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  const chatsSnapshotRef = useRef<SupportChatRecord[]>([])
  const analyticsRunRef = useRef(0)

  const [replyTo, setReplyTo] = useState<SupportMessageRecord | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [shouldScrollMessagesToBottom, setShouldScrollMessagesToBottom] = useState(false)
  const [scrollBehavior, setScrollBehavior] = useState<ScrollBehavior>('auto')

  const MESSAGES_PANE_HEIGHT_KEY = 'crm.support.ui.messagesPaneHeight.v1'
  const MIN_MESSAGES_PANE_HEIGHT = 240
  const MAX_MESSAGES_PANE_HEIGHT = 900
  const [messagesPaneHeight, setMessagesPaneHeight] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(MESSAGES_PANE_HEIGHT_KEY)
      const parsed = raw ? Number.parseInt(raw, 10) : NaN
      const base = Number.isFinite(parsed) ? parsed : 420
      return Math.max(MIN_MESSAGES_PANE_HEIGHT, Math.min(MAX_MESSAGES_PANE_HEIGHT, base))
    } catch {
      return 420
    }
  })
  const messagesPaneHeightRef = useRef(messagesPaneHeight)
  useEffect(() => {
    messagesPaneHeightRef.current = messagesPaneHeight
  }, [messagesPaneHeight])

  const beginResizeMessagesPane = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()

    const startY = e.clientY
    const startHeight = messagesPaneHeightRef.current

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY
      const next = Math.max(MIN_MESSAGES_PANE_HEIGHT, Math.min(MAX_MESSAGES_PANE_HEIGHT, startHeight + dy))
      setMessagesPaneHeight(next)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      try {
        window.localStorage.setItem(MESSAGES_PANE_HEIGHT_KEY, String(messagesPaneHeightRef.current))
      } catch {
        // ignore
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const persistResponseMuted = (next: Record<string, string>) => {
    try {
      window.localStorage.setItem(RESPONSE_MUTE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const NOTIFY_ENABLED_KEY = 'crm.support.notifications.enabled'
  const NOTIFY_SOUND_KEY = 'crm.support.notifications.sound'
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(NOTIFY_ENABLED_KEY) === '1'
    } catch {
      return false
    }
  })
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(NOTIFY_SOUND_KEY) === '1'
    } catch {
      return false
    }
  })

  const notifiedOnceRef = useRef(false)
  const prevNotifyMetaRef = useRef<Record<string, { lastInboundAt: string | null; unreadCount: number }>>({})
  const lastNotifyAtRef = useRef<Record<string, number>>({})
  const audioCtxRef = useRef<AudioContext | null>(null)

  const persistNotificationSettings = (enabled: boolean, soundEnabled: boolean) => {
    try {
      window.localStorage.setItem(NOTIFY_ENABLED_KEY, enabled ? '1' : '0')
      window.localStorage.setItem(NOTIFY_SOUND_KEY, soundEnabled ? '1' : '0')
    } catch {
      // ignore
    }
  }

  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false)
    persistNotificationSettings(false, notificationSoundEnabled)
  }, [notificationSoundEnabled])

  const ensureNotificationPermission = async () => {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) {
      toast.error(t('support.notifications.notSupported'))
      return false
    }

    // Most browsers require a secure context (HTTPS) for notifications.
    if (!window.isSecureContext) {
      toast.error(t('support.notifications.secureContextRequired'), {
        description: t('support.notifications.secureContextHelp'),
      })
      return false
    }

    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') {
      toast.error(t('support.notifications.permissionDenied'), {
        description: t('support.notifications.permissionDeniedHelp'),
      })
      return false
    }

    let perm: NotificationPermission = 'denied'
    try {
      perm = await Notification.requestPermission()
    } catch {
      perm = 'denied'
    }
    if (perm !== 'granted') {
      toast.error(t('support.notifications.permissionDenied'), {
        description: t('support.notifications.permissionDeniedHelp'),
      })
      return false
    }
    return true
  }

  const primeAudio = async () => {
    try {
      if (typeof window === 'undefined') return
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
      if (!Ctx) return
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume()
      }
    } catch {
      // ignore
    }
  }

  const playChime = () => {
    try {
      const ctx = audioCtxRef.current
      if (!ctx) return
      const now = ctx.currentTime

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
      gain.connect(ctx.destination)

      const makeTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)
        osc.connect(gain)
        osc.start(start)
        osc.stop(start + dur)
      }

      // Short, mellow 2-note chime (C5 -> E5)
      makeTone(523.25, now, 0.11)
      makeTone(659.25, now + 0.09, 0.12)
    } catch {
      // ignore
    }
  }

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
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>([])

  useEffect(() => {
    const reloadAll = () => {
      // Load local settings for funnel labels and pinned chats.
      setFunnelStages(loadSupportFunnelStages(defaultStages))
      setChatStageMap(loadSupportChatStageMap())
      setStageAliases(loadSupportStageAliases())
      setPinnedChatIds(loadPinnedChatIds())
    }

    reloadAll()

    const unsubscribe = subscribeSupportFunnelUpdates((kind) => {
      if (kind === 'stages') setFunnelStages(loadSupportFunnelStages(defaultStages))
      if (kind === 'chatStageMap') setChatStageMap(loadSupportChatStageMap())
      if (kind === 'stageAliases') setStageAliases(loadSupportStageAliases())
      if (kind === 'pinnedChatIds') setPinnedChatIds(loadPinnedChatIds())
    })

    return unsubscribe
  }, [defaultStages])

  const primaryStageId = funnelStages.find((s) => s.id === getPrimaryStageId())?.id || getPrimaryStageId()

  const setStageMutation = useMutation({
    mutationFn: ({ chatId, stageId }: { chatId: string; stageId: string }) => setSupportChatStage(token!, chatId, stageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      await queryClient.invalidateQueries({ queryKey: ['support-chats-board'] })
    },
    onError: (e: any) => toast.error(e?.message || t('common.error')),
  })

  const setChatStage = (chatId: string, stageId: string) => {
    const sid = canonicalizeStageId(stageId) || stageId
    setChatStageMap((prev) => {
      const next = { ...prev, [chatId]: sid }
      saveSupportChatStageMap(next)
      return next
    })

    if (token) {
      setStageMutation.mutate({ chatId, stageId: sid })
    }
  }

  const togglePinned = (chatId: string) => {
    setPinnedChatIds((prev) => {
      const set = new Set(prev)
      if (set.has(chatId)) set.delete(chatId)
      else set.add(chatId)
      const next = Array.from(set)
      savePinnedChatIds(next)
      return next
    })
  }

  const pinnedSet = useMemo(() => new Set(pinnedChatIds), [pinnedChatIds])

  const [nowTs, setNowTs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const RESPONSE_LIMIT_SECONDS = 5 * 60

  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds))
    const days = Math.floor(s / 86400)
    const hours = Math.floor((s % 86400) / 3600)
    const minutes = Math.floor((s % 3600) / 60)
    const secs = s % 60

    const pad = (v: number) => String(v).padStart(2, '0')
    const base = hours > 0 || days > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`
    return days > 0 ? `${days}d ${base}` : base
  }

  const formatDate = (ts: number) => {
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(ts))
    } catch {
      return new Date(ts).toLocaleDateString()
    }
  }

  const analyticsRangeOptions = useMemo(
    () => [
      { value: 'day' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.day') },
      { value: 'week' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.week') },
      { value: 'month' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.month') },
      { value: 'quarter' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.quarter') },
      { value: 'year' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.year') },
      { value: 'all' as SupportAnalyticsRange, label: t('support.analytics.rangeOptions.all') },
    ],
    [t]
  )

  const handleTabChange = (value: string) => {
    const next = value as SupportChatsTab
    setActiveTab(next)
    if (next === 'analytics') {
      setSelectedChatId(null)
    }
  }

  const refreshAnalytics = () => setAnalyticsRefreshKey((prev) => prev + 1)

  useEffect(() => {
    if (mode === 'analytics') {
      setActiveTab('analytics')
      setSelectedChatId(null)
      setAnalyticsTab(initialAnalyticsTab)
    }
  }, [initialAnalyticsTab, mode])

  const { data: chatsData, isLoading: isChatsLoading, isError: isChatsError } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportChats>>
  >(
    ['support-chats'],
    // Fetch a wider list and filter locally so we can search by local-only "tags" (funnel stage labels).
    // Backend enforces a max limit (currently 10000).
    (authToken) => fetchSupportChats(authToken, '', 1, 10000),
    {
      enabled: Boolean(token),
      // Auto-refresh list so new inbound messages show up without reload.
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const chats = chatsData?.chats ?? []

  const { data: operatorsData } = useApiQuery<Awaited<ReturnType<typeof fetchCrmOperators>>>(
    ['crm-operators-support-assign'],
    (authToken) => fetchCrmOperators(authToken),
    {
      enabled: Boolean(token) && isAdmin,
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const assignOperators = useMemo(() => {
    const list = (operatorsData as any)?.operators ?? []
    return (list as CrmOperatorRecord[])
      .filter((op) => op.isActive)
      .map((op) => op.username)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [operatorsData])

  useEffect(() => {
    if (!isAdmin) return
    setSelectedChatIds((prev) => {
      if (prev.size === 0) return prev
      const available = new Set(chats.map((c) => c.chatId))
      const next = new Set<string>()
      for (const id of prev) {
        if (available.has(id)) next.add(id)
      }
      return next
    })
  }, [chats, isAdmin])

  const operatorOptions = useMemo(() => {
    const set = new Set<string>()
    for (const chat of chats) {
      if (chat.acceptedBy) set.add(String(chat.acceptedBy))
      const assigned = (chat as any).assignedAdminUsername || (chat as any).assignedTo
      if (assigned) set.add(String(assigned))
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b))
  }, [chats])

  // Self-heal: if local funnel config was reset/cleared, but DB contains stage IDs,
  // auto-add those missing stages so chats keep their lanes.
  useEffect(() => {
    if (!Array.isArray(chats) || chats.length === 0) return

    const existing = new Set(funnelStages.map((s) => s.id))
    const missingIds: string[] = []
    for (const c of chats) {
      const id = normalizeStageId(c?.funnelStageId, stageAliases)
      if (!id) continue
      if (id === LEGACY_PENDING_DEPOSIT_ID) continue
      if (existing.has(id)) continue
      missingIds.push(id)
      existing.add(id)
    }

    if (!missingIds.length) return

    setFunnelStages((prev) => {
      const next = [...prev, ...missingIds.map((id) => ({ id, label: prettifyStageId(id) || id }))]
      saveSupportFunnelStages(next)
      return next
    })
  }, [chats, funnelStages, stageAliases])

  const getChatTab = (chat: SupportChatRecord): SupportListTab => {
    const anyChat = chat as any
    const status = String(anyChat?.status ?? '').toUpperCase()

    // Prefer explicit backend statuses if available.
    if (
      status === 'ARCHIVE' ||
      status === 'ARCHIVED' ||
      status === 'CLOSED' ||
      status === 'DONE' ||
      Boolean(anyChat?.archivedAt) ||
      Boolean(anyChat?.closedAt) ||
      anyChat?.isArchived === true
    ) {
      return 'archive'
    }

    if (
      status === 'ACCEPTED' ||
      status === 'TAKEN' ||
      status === 'IN_PROGRESS' ||
      status === 'ASSIGNED' ||
      Boolean(anyChat?.acceptedAt) ||
      Boolean(anyChat?.assignedAdminUsername) ||
      Boolean(anyChat?.assignedTo) ||
      anyChat?.isAccepted === true
    ) {
      return 'accepted'
    }

    // Fallback: unaccepted/unarchived chats are treated as "new".
    return 'new'
  }

  const openChat = (chatId: string, behavior: 'open' | 'toggle' = 'open') => {
    const chat = chats.find((c) => c.chatId === chatId)
    if (chat) {
      setActiveTab(getChatTab(chat))
    }

    if (behavior === 'toggle') {
      setSelectedChatId((prev) => (prev === chatId ? null : chatId))
      return
    }

    setSelectedChatId(chatId)
  }

  useEffect(() => {
    const tryOpen = (rawId: string | null) => {
      if (!rawId) return
      const byChatId = chats.find((c) => c.chatId === rawId)
      const byTelegramId = byChatId ? null : chats.find((c) => c.telegramId === rawId)
      const resolved = byChatId?.chatId || byTelegramId?.chatId
      if (!resolved) return
      openChat(resolved, 'open')
      try {
        sessionStorage.removeItem('crm.support.openChatId')
      } catch {
        // ignore
      }
    }

    // 1) If we came from another page (e.g., Funnel) store-based deep open.
    try {
      const stored = sessionStorage.getItem('crm.support.openChatId')
      if (stored) tryOpen(stored)
    } catch {
      // ignore
    }

    // 2) If we are already on Support, react to navigation events.
    const onOpenEvent = (ev: Event) => {
      const ce = ev as CustomEvent<any>
      const chatId = ce?.detail?.chatId
      if (typeof chatId === 'string' && chatId) tryOpen(chatId)
    }
    window.addEventListener('crm:support.openChat', onOpenEvent)
    return () => window.removeEventListener('crm:support.openChat', onOpenEvent)
  }, [chats])

  const ensureChatAvatarLoaded = async (chatId: string) => {
    if (!token) return
    if (Object.prototype.hasOwnProperty.call(avatarUrlByChatIdRef.current, chatId)) return
    if (avatarLoadingRef.current[chatId]) return
    avatarLoadingRef.current[chatId] = true

    try {
      let fileId = avatarFileIdByChatIdRef.current[chatId]
      if (fileId === undefined) {
        const resp = await fetchSupportChatAvatar(token, chatId)
        fileId = resp?.fileId ?? null
        avatarFileIdByChatIdRef.current[chatId] = fileId
      }

      if (!fileId) {
        setAvatarUrlByChatId((prev) => ({ ...prev, [chatId]: '' }))
        return
      }

      const cached = fileUrlCache[fileId]
      if (cached) {
        setAvatarUrlByChatId((prev) => ({ ...prev, [chatId]: cached }))
        return
      }

      const blob = await fetchSupportFileBlob(token, fileId)
      const url = URL.createObjectURL(blob)
      setFileUrlCache((prev) => ({ ...prev, [fileId]: url }))
      setAvatarUrlByChatId((prev) => ({ ...prev, [chatId]: url }))
    } catch {
      setAvatarUrlByChatId((prev) => ({ ...prev, [chatId]: '' }))
    } finally {
      avatarLoadingRef.current[chatId] = false
    }
  }

  const tabCounts = useMemo(() => {
    const counts: Record<SupportListTab, number> = { new: 0, accepted: 0, archive: 0 }
    for (const chat of chats) {
      counts[getChatTab(chat)]++
    }
    return counts
  }, [chats])

  const filteredChats = useMemo(() => {
    if (activeTab === 'analytics') return []
    let raw = chats.filter((chat) => getChatTab(chat) === activeTab)

    if (operatorFilter !== 'all') {
      raw = raw.filter((chat) => {
        const assigned = chat.acceptedBy || (chat as any).assignedAdminUsername || (chat as any).assignedTo
        if (operatorFilter === 'unassigned') return !assigned
        if (operatorFilter === 'mine') return Boolean(myUsername) && String(assigned) === String(myUsername)
        return String(assigned || '') === operatorFilter
      })
    }
    const q = search.trim().toLowerCase()
    if (!q) return raw

    const terms = q.split(/\s+/).filter(Boolean)
    if (terms.length === 0) return raw

    return raw.filter((chat) => {
      const stageId = chat.funnelStageId || chatStageMap[chat.chatId] || primaryStageId
      const stageLabel = funnelStages.find((s) => s.id === stageId)?.label || ''

      const displayName = [chat.firstName, chat.lastName].filter(Boolean).join(' ')
      const username = chat.username ? `@${chat.username}` : ''

      const haystack = [
        chat.chatId,
        chat.telegramId,
        chat.username,
        username,
        chat.firstName,
        chat.lastName,
        displayName,
        stageId,
        stageLabel,
        chat.lastMessageText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return terms.every((term) => haystack.includes(term))
    })
  }, [activeTab, chats, funnelStages, chatStageMap, primaryStageId, search, operatorFilter, myUsername])

  useEffect(() => {
    chatsSnapshotRef.current = chats
  }, [chats])

  const loadSupportAnalytics = useCallback(
    async (range: SupportAnalyticsRange) => {
      if (!token) return

      const runId = ++analyticsRunRef.current
      setAnalyticsLoading(true)
      setAnalyticsError(null)
      setAnalyticsTruncated(false)

      const chatsSnapshot = chatsSnapshotRef.current
      const now = Date.now()
      const DAY_MS = 24 * 60 * 60 * 1000

      const getChatStartedTs = (chat: SupportChatRecord) => {
        const raw = chat.startedAt || chat.createdAt
        const ts = raw ? new Date(raw).getTime() : 0
        return Number.isFinite(ts) ? ts : 0
      }

      const resolveRange = () => {
        let fromTs = 0
        if (range === 'day') fromTs = now - DAY_MS
        if (range === 'week') fromTs = now - DAY_MS * 7
        if (range === 'month') fromTs = now - DAY_MS * 30
        if (range === 'quarter') fromTs = now - DAY_MS * 90
        if (range === 'year') fromTs = now - DAY_MS * 365
        if (range === 'all') {
          const earliest = chatsSnapshot.reduce((min, chat) => {
            const ts = getChatStartedTs(chat)
            if (!ts) return min
            if (!min || ts < min) return ts
            return min
          }, 0)
          fromTs = earliest
        }
        if (!fromTs) fromTs = now - DAY_MS
        const days = Math.max(1, Math.ceil((now - fromTs) / DAY_MS))
        return { fromTs, toTs: now, days }
      }

      try {
        const { fromTs, toTs, days } = resolveRange()

        let totalMessages = 0
        let inboundMessages = 0
        let outboundMessages = 0
        let totalInquiries = 0
        let responseSumMs = 0
        let responseCount = 0
        let activeChats = 0
        let truncated = false

        totalInquiries = chatsSnapshot.filter((chat) => {
          const ts = getChatStartedTs(chat)
          return ts >= fromTs && ts <= toTs
        }).length

        const getChatActivityTs = (chat: SupportChatRecord) => {
          const lastMessageTs = chat.lastMessageAt ? new Date(chat.lastMessageAt).getTime() : 0
          const startedTs = getChatStartedTs(chat)
          return Math.max(lastMessageTs, startedTs)
        }

        const candidateChats = chatsSnapshot.filter((chat) => {
          const lastMessageTs = chat.lastMessageAt ? new Date(chat.lastMessageAt).getTime() : 0
          const startedTs = getChatStartedTs(chat)
          if (lastMessageTs && lastMessageTs >= fromTs) return true
          if (startedTs && startedTs >= fromTs) return true
          return false
        })

        const sortedCandidates = [...candidateChats].sort((a, b) => getChatActivityTs(b) - getChatActivityTs(a))
        const MAX_CHATS = range === 'all' ? 400 : range === 'year' ? 600 : 800
        const chatsToScan = sortedCandidates.slice(0, MAX_CHATS)
        if (sortedCandidates.length > MAX_CHATS) truncated = true

        const PAGE_LIMIT = range === 'all' ? 100 : range === 'year' ? 80 : 50
        const MAX_PAGES = range === 'all' ? 8 : range === 'year' ? 6 : 4

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

        const CONCURRENCY = 6
        const perChatStats = await mapWithConcurrency(chatsToScan, CONCURRENCY, async (chat) => {
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

          if (inRange.length === 0) {
            return { active: false, total: 0, inbound: 0, outbound: 0, responseSumMs: 0, responseCount: 0, truncated: localTruncated }
          }

          let localInbound = 0
          let localOutbound = 0
          let localResponseSumMs = 0
          let localResponseCount = 0
          let pendingInboundTs: number | null = null

          for (const msg of inRange) {
            const dir = String(msg.direction).toUpperCase()
            if (dir === 'IN') {
              localInbound += 1
              pendingInboundTs = new Date(msg.createdAt).getTime()
              continue
            }

            localOutbound += 1

            if (pendingInboundTs) {
              const diff = new Date(msg.createdAt).getTime() - pendingInboundTs
              if (diff >= 0) {
                localResponseSumMs += diff
                localResponseCount += 1
              }
              pendingInboundTs = null
            }
          }

          return {
            active: true,
            total: inRange.length,
            inbound: localInbound,
            outbound: localOutbound,
            responseSumMs: localResponseSumMs,
            responseCount: localResponseCount,
            truncated: localTruncated,
          }
        })

        for (const row of perChatStats) {
          if (row.truncated) truncated = true
          if (!row.active) continue
          activeChats += 1
          totalMessages += row.total
          inboundMessages += row.inbound
          outboundMessages += row.outbound
          responseSumMs += row.responseSumMs
          responseCount += row.responseCount
        }

        if (analyticsRunRef.current !== runId) return

        const avgMessagesPerChat = activeChats > 0 ? totalMessages / activeChats : null
        const responseRate = inboundMessages > 0 ? responseCount / inboundMessages : null

        setAnalyticsData({
          fromTs,
          toTs,
          days,
          totalMessages,
          inboundMessages,
          outboundMessages,
          totalInquiries,
          avgResponseSeconds: responseCount ? Math.round(responseSumMs / responseCount / 1000) : null,
          responseCount,
          activeChats,
          avgMessagesPerChat,
          responseRate,
        })
        setAnalyticsTruncated(truncated)
      } catch (e: any) {
        if (analyticsRunRef.current !== runId) return
        setAnalyticsError(e?.message || t('common.error'))
      } finally {
        if (analyticsRunRef.current === runId) setAnalyticsLoading(false)
      }
    },
    [t, token]
  )

  useEffect(() => {
    if (activeTab !== 'analytics' || analyticsTab !== 'overview' || !token) return
    void loadSupportAnalytics(analyticsRange)
  }, [activeTab, analyticsRange, analyticsRefreshKey, analyticsTab, loadSupportAnalytics, token])

  // Track chat-list scroll position so we can notify about new activity when scrolled down.
  useEffect(() => {
    const root = chatsListContainerRef.current
    if (!root) return
    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    chatsListViewportRef.current = viewport
    if (!viewport) return

    const onScroll = () => {
      const atTop = viewport.scrollTop <= 8
      setIsChatsListAtTop(atTop)
      if (atTop) {
        setHasNewChatsActivityAbove(false)
        setNewChatsActivityCount(0)
      }
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [])

  // Detect new incoming activity and show a jump-to-top indicator when list is scrolled.
  useEffect(() => {
    const prev = prevChatMetaRef.current
    let activityCount = 0

    for (const chat of filteredChats) {
      const prevMeta = prev[chat.chatId]
      const lastMessageAt = chat.lastMessageAt || null
      const unreadCount = chat.unreadCount || 0
      if (prevMeta) {
        const unreadIncreased = unreadCount > prevMeta.unreadCount
        const lastMessageChanged = lastMessageAt && lastMessageAt !== prevMeta.lastMessageAt
        if (unreadIncreased || lastMessageChanged) activityCount++
      }
    }

    // Update snapshot for current tab.
    const next: Record<string, { lastMessageAt: string | null; unreadCount: number }> = {}
    for (const chat of filteredChats) {
      next[chat.chatId] = { lastMessageAt: chat.lastMessageAt || null, unreadCount: chat.unreadCount || 0 }
    }
    prevChatMetaRef.current = next

    if (activityCount > 0 && !isChatsListAtTop) {
      setHasNewChatsActivityAbove(true)
      setNewChatsActivityCount((c) => c + activityCount)
    }
  }, [filteredChats, isChatsListAtTop])

  // Desktop/browser notifications for new inbound messages.
  useEffect(() => {
    if (!notificationsEnabled) return

    const prev = prevNotifyMetaRef.current
    const next: Record<string, { lastInboundAt: string | null; unreadCount: number }> = {}
    const now = Date.now()

    let anyEvent = false

    for (const chat of chats) {
      const lastInboundAt = chat.lastInboundAt || null
      const unreadCount = chat.unreadCount || 0
      next[chat.chatId] = { lastInboundAt, unreadCount }

      const prevMeta = prev[chat.chatId]
      if (!prevMeta) continue

      const inboundChanged = lastInboundAt && lastInboundAt !== prevMeta.lastInboundAt
      const unreadIncreased = unreadCount > prevMeta.unreadCount
      if (!inboundChanged && !unreadIncreased) continue

      // Skip if this chat is open and window is focused.
      if (chat.chatId === selectedChatId && document.visibilityState === 'visible') continue

      // Throttle per chat to avoid annoyance.
      const lastNotifyAt = lastNotifyAtRef.current[chat.chatId] || 0
      if (now - lastNotifyAt < 20000) continue

      anyEvent = true
      lastNotifyAtRef.current[chat.chatId] = now

      const displayName = [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId
      const nick = chat.username ? `@${chat.username}` : null
      const title = nick || displayName

      const body = chat.lastMessageText ? chat.lastMessageText : t('support.notifications.newMessageBody')

      ;(async () => {
        const ok = await ensureNotificationPermission()
        if (!ok) {
          // Avoid repeated toasts if permission is blocked or context is insecure.
          if (!window.isSecureContext || Notification.permission === 'denied') {
            disableNotifications()
          }
          return
        }

        try {
          const n = new Notification(t('support.notifications.newMessageTitle'), {
            body: `${title}: ${body}`,
            tag: `support-${chat.chatId}`,
            silent: true,
          })
          n.onclick = () => {
            try {
              window.focus()
              openChat(chat.chatId, 'open')
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }

        if (notificationSoundEnabled && document.visibilityState !== 'visible') {
          await primeAudio()
          playChime()
        }
      })()
    }

    prevNotifyMetaRef.current = next

    // Avoid firing on first load when we don't yet have a baseline.
    if (!notifiedOnceRef.current) {
      notifiedOnceRef.current = true
      return
    }

    // If multiple events happened at once, also show an in-app toast.
    if (anyEvent) {
      toast.message(t('support.notifications.toast'))
    }
  }, [chats, disableNotifications, notificationSoundEnabled, notificationsEnabled, selectedChatId, t])

  const sortedChats = useMemo(() => {
    const toTs = (value: string | null) => (value ? new Date(value).getTime() : 0)
    return [...filteredChats].sort((a, b) => {
      const ap = pinnedSet.has(a.chatId) ? 1 : 0
      const bp = pinnedSet.has(b.chatId) ? 1 : 0
      if (ap !== bp) return bp - ap
      return toTs(b.lastMessageAt) - toTs(a.lastMessageAt)
    })
  }, [filteredChats, pinnedSet])

  const isResponseMuted = useCallback(
    (chat: SupportChatRecord) => {
      const key = responseMutedMap[chat.chatId]
      if (!key) return false
      const inboundKey = chat.lastInboundAt ? String(chat.lastInboundAt) : 'none'
      return key === inboundKey
    },
    [responseMutedMap]
  )

  useEffect(() => {
    if (chats.length === 0) return
    const validIds = new Set(chats.map((c) => c.chatId))
    let changed = false
    const next = { ...responseMutedMap }
    for (const [chatId, stored] of Object.entries(responseMutedMap)) {
      if (!validIds.has(chatId)) {
        delete next[chatId]
        changed = true
        continue
      }
      const chat = chats.find((c) => c.chatId === chatId)
      if (!chat) continue
      const inboundKey = chat.lastInboundAt ? String(chat.lastInboundAt) : 'none'
      if (stored !== inboundKey) {
        delete next[chatId]
        changed = true
      }
    }
    if (changed) {
      setResponseMutedMap(next)
      persistResponseMuted(next)
    }
  }, [chats, responseMutedMap])

  useEffect(() => {
    if (!token) return
    const ids: string[] = []
    if (selectedChatId) ids.push(selectedChatId)
    for (const chat of sortedChats.slice(0, 12)) ids.push(chat.chatId)
    const unique = Array.from(new Set(ids))
    unique.forEach((id) => {
      void ensureChatAvatarLoaded(id)
    })
  }, [activeTab, selectedChatId, sortedChats, token])

  const selectedChat: SupportChatRecord | null = useMemo(() => {
    if (!selectedChatId) return null
    return chats.find((c) => c.chatId === selectedChatId) ?? null
  }, [chats, selectedChatId])

  const selectedTelegramId = selectedChat?.telegramId ? String(selectedChat.telegramId) : null

  const { data: selectedUserData } = useApiQuery<Awaited<ReturnType<typeof fetchUsers>>>(
    ['support-user', selectedTelegramId],
    (authToken) => fetchUsers(authToken, { search: selectedTelegramId!, page: 1, limit: 20 }),
    {
      enabled: Boolean(token && selectedTelegramId),
      refetchOnWindowFocus: true,
    }
  )

  const selectedUser = useMemo(() => {
    if (!selectedTelegramId) return null
    const list = selectedUserData?.users ?? []
    return list.find((u) => String(u.telegramId) === selectedTelegramId) ?? list[0] ?? null
  }, [selectedTelegramId, selectedUserData])

  const { data: depositsData } = useApiQuery<Awaited<ReturnType<typeof fetchDeposits>>>(
    ['support-deposits', selectedTelegramId],
    (authToken) => fetchDeposits(authToken, { page: 1, limit: 500, search: selectedTelegramId! }),
    {
      enabled: Boolean(token && selectedTelegramId),
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const { data: withdrawalsData } = useApiQuery<Awaited<ReturnType<typeof fetchWithdrawals>>>(
    ['support-withdrawals', selectedTelegramId],
    (authToken) => fetchWithdrawals(authToken),
    {
      enabled: Boolean(token && selectedTelegramId),
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const depositCount = useMemo(() => {
    if (!selectedTelegramId) return 0
    return (depositsData?.deposits ?? []).filter((d) => String(d.user?.telegramId) === selectedTelegramId).length
  }, [depositsData, selectedTelegramId])

  const withdrawalCount = useMemo(() => {
    if (!selectedTelegramId) return 0
    return (withdrawalsData?.withdrawals ?? []).filter((w) => String(w.user?.telegramId) === selectedTelegramId).length
  }, [selectedTelegramId, withdrawalsData])

  const leadVisibleDeposit = useMemo(() => {
    if (!selectedUser) return null
    const value = selectedUser.remainingBalance ?? selectedUser.balance
    return Number.isFinite(value) ? value : null
  }, [selectedUser])

  const selectedChatLastInboundTs = useMemo(() => {
    if (!selectedChat?.lastInboundAt) return 0
    return new Date(selectedChat.lastInboundAt).getTime()
  }, [selectedChat?.lastInboundAt])

  useEffect(() => {
    if (!selectedChatId) return
    const chat = chats.find((c) => c.chatId === selectedChatId)
    if (!chat) {
      setSelectedChatId(null)
      return
    }
    if (getChatTab(chat) !== activeTab) {
      setSelectedChatId(null)
    }
  }, [activeTab, chats, selectedChatId])

  const { data: messagesData, isLoading: isMessagesLoading } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportMessages>>
  >(
    ['support-messages', selectedChatId],
    (authToken) => fetchSupportMessages(authToken, selectedChatId!),
    {
      enabled: Boolean(token && selectedChatId),
      // Auto-refresh open chat.
      refetchInterval: 3000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const messages: SupportMessageRecord[] = messagesData?.messages ?? []

  const { data: notesData } = useApiQuery<Awaited<ReturnType<typeof fetchSupportNotes>>>(
    ['support-notes', selectedChatId],
    (authToken) => fetchSupportNotes(authToken, selectedChatId!),
    {
      enabled: Boolean(token && selectedChatId),
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const notesRaw: SupportNoteRecord[] = (notesData as any)?.notes ?? []
  const notes = useMemo(() => {
    return [...notesRaw].sort((a, b) => {
      const at = new Date(a.createdAt).getTime()
      const bt = new Date(b.createdAt).getTime()
      return bt - at
    })
  }, [notesRaw])

  const markReadMutation = useMutation({
    mutationFn: (chatId: string) => markSupportChatRead(token!, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-chats'] })
    },
  })

  const markUnreadMutation = useMutation({
    mutationFn: (chatId: string) => markSupportChatUnread(token!, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      toast.success(t('support.markedUnread'))
      setSelectedChatId(null)
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.markUnreadFailed'))
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (chatId: string) => acceptSupportChat(token!, chatId),
    onMutate: (chatId: string) => {
      const chat = chats.find((c) => c.chatId === chatId)
      const wasNew = chat ? getChatTab(chat) === 'new' : activeTab === 'new'
      const hadStage = Boolean(chat?.funnelStageId || chatStageMap[chatId])
      const isSelected = selectedChatId === chatId
      return { wasNew, hadStage, isSelected }
    },
    onSuccess: async (updated, chatId, ctx) => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      // If the accepted chat is currently open, keep it open and move to Accepted.
      if (ctx?.isSelected) {
        setActiveTab('accepted')
        setSelectedChatId(updated.chatId)
      } else if (ctx?.wasNew) {
        // If accepted from the New list without opening, keep list focus.
        setActiveTab('new')
        setSelectedChatId(null)
      } else {
        setActiveTab('accepted')
        setSelectedChatId(updated.chatId)
      }
      // If accepted from "New" chats, default funnel stage to Primary contact.
      if (ctx?.wasNew && !ctx?.hadStage) {
        setChatStage(updated.chatId, primaryStageId)
      }
      toast.success(t('support.accepted'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.acceptFailed'))
    },
  })

  const assignMutation = useMutation({
    mutationFn: (payload: { chatIds: string[]; operator: string }) => assignSupportChats(token!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      setSelectedChatIds(new Set())
      toast.success('Назначено')
    },
    onError: (e: any) => {
      toast.error(e?.message || t('common.error'))
    },
  })

  const toggleChatSelection = useCallback(
    (chatId: string) => {
      if (!isAdmin) return
      setSelectedChatIds((prev) => {
        const next = new Set(prev)
        if (next.has(chatId)) {
          next.delete(chatId)
        } else {
          next.add(chatId)
        }
        return next
      })
    },
    [isAdmin]
  )

  const clearChatSelection = useCallback(() => {
    setSelectedChatIds(new Set())
  }, [])

  const archiveMutation = useMutation({
    mutationFn: (chatId: string) => archiveSupportChat(token!, chatId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      setSelectedChatId(null)
      setMessageText('')
      setPhotoCaption('')
      setPhotoFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setActiveTab('archive')
      toast.success(t('support.archived'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.archiveFailed'))
    },
  })

  const unarchiveMutation = useMutation({
    mutationFn: (chatId: string) => unarchiveSupportChat(token!, chatId),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      setActiveTab('new')
      setSelectedChatId(updated.chatId)
      toast.success(t('support.restored'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.restoreFailed'))
    },
  })

  const blockMutation = useMutation({
    mutationFn: (chatId: string) => blockSupportChat(token!, chatId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      toast.success(t('support.userBlocked'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.blockFailed'))
    },
  })

  const unblockMutation = useMutation({
    mutationFn: (chatId: string) => unblockSupportChat(token!, chatId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      toast.success(t('support.userUnblocked'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.unblockFailed'))
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, text }: { chatId: string; text: string }) =>
      sendSupportMessage(token!, chatId, text, { replyToId: replyTo?.id || null }),
    onSuccess: async () => {
      setMessageText('')
      setReplyTo(null)
      await queryClient.invalidateQueries({ queryKey: ['support-messages'] })
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      setScrollBehavior('smooth')
      setShouldScrollMessagesToBottom(true)
      scrollMessagesToBottom('smooth')
      toast.success(t('support.sent'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.sendFailed'))
    },
  })

  const sendPhotoMutation = useMutation({
    mutationFn: ({ chatId, file, caption }: { chatId: string; file: File; caption?: string }) =>
      sendSupportPhoto(token!, chatId, file, caption, { replyToId: replyTo?.id || null }),
    onSuccess: async () => {
      setPhotoCaption('')
      setPhotoFile(null)
      setReplyTo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await queryClient.invalidateQueries({ queryKey: ['support-messages'] })
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      setScrollBehavior('smooth')
      setShouldScrollMessagesToBottom(true)
      scrollMessagesToBottom('smooth')
      toast.success(t('support.sent'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.sendFailed'))
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: ({ chatId, text }: { chatId: string; text: string }) => addSupportNote(token!, chatId, text),
    onSuccess: async () => {
      setNoteText('')
      await queryClient.invalidateQueries({ queryKey: ['support-notes'] })
      toast.success(t('support.noteAdded'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.noteAddFailed'))
    },
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ chatId, noteId, text }: { chatId: string; noteId: number; text: string }) =>
      updateSupportNote(token!, chatId, noteId, text),
    onSuccess: async () => {
      setEditingNoteId(null)
      setEditingNoteText('')
      await queryClient.invalidateQueries({ queryKey: ['support-notes'] })
      toast.success(t('support.noteUpdated'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.noteUpdateFailed'))
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: ({ chatId, noteId }: { chatId: string; noteId: number }) => deleteSupportNote(token!, chatId, noteId),
    onSuccess: async () => {
      setEditingNoteId(null)
      setEditingNoteText('')
      await queryClient.invalidateQueries({ queryKey: ['support-notes'] })
      toast.success(t('support.noteDeleted'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.noteDeleteFailed'))
    },
  })

  const deleteMessageMutation = useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: number }) => deleteSupportMessage(token!, chatId, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-messages'] })
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      toast.success(t('support.messageDeleted'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.messageDeleteFailed'))
    },
  })

  const canDeleteSupportMessage = (m: SupportMessageRecord) => {
    if (m.direction !== 'OUT') return false
    if (!m.adminUsername) return false
    if (isAdmin) return true
    return Boolean(myUsername) && m.adminUsername === myUsername
  }

  const openImageViewer = (src: string) => {
    setImageViewerSrc(src)
    setImageViewerZoom(1)
    setImageViewerOpen(true)
  }

  useEffect(() => {
    if (!selectedChatId) return
    const chat = chats.find((c) => c.chatId === selectedChatId)
    if (chat && chat.unreadCount > 0) {
      markReadMutation.mutate(selectedChatId)
    }
    // Mark as read again if unread increases due to polling.
  }, [chats, selectedChatId])

  const handleSend = () => {
    if (!selectedChatId) return
    if (sendMessageMutation.isPending) return
    if (selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') {
      toast.error(t('support.mustAcceptFirst'))
      return
    }
    const trimmed = messageText.trim()
    if (!trimmed) return
    sendMessageMutation.mutate({ chatId: selectedChatId, text: trimmed })
  }

  // Reset drafts + scroll to bottom when switching/opening a chat.
  useEffect(() => {
    setMessageText('')
    setPhotoCaption('')
    setPhotoFile(null)
    setReplyTo(null)
    setNoteText('')
    setEditingNoteId(null)
    setEditingNoteText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (photoPickerRef.current) photoPickerRef.current.value = ''

    if (!selectedChatId) return
    setScrollBehavior('auto')
    setShouldScrollMessagesToBottom(true)
  }, [selectedChatId])

  useEffect(() => {
    if (!replyTo) return
    // If message list refreshed and the replied message is gone, drop the reply state.
    if (!messages.some((m) => m.id === replyTo.id)) {
      setReplyTo(null)
    }
  }, [messages, replyTo])

  const replyPreviewText = (m: SupportMessageRecord | null) => {
    if (!m) return ''
    if (m.kind === 'PHOTO') return m.text ? m.text : `[${t('support.photo')}]`
    return (m.text || '').trim() || '—'
  }

  const replyPreviewAuthor = (m: SupportMessageRecord | null) => {
    if (!m) return ''
    if (m.direction === 'OUT') return m.adminUsername || t('support.admin')
    return t('support.user')
  }

  // Perform deferred scroll after messages render.
  useEffect(() => {
    if (!shouldScrollMessagesToBottom) return
    scrollMessagesToBottom(scrollBehavior)
    setShouldScrollMessagesToBottom(false)
  }, [messages.length, scrollBehavior, shouldScrollMessagesToBottom, selectedChatId])

  // Fetch blobs for photo messages (auth required, so cannot use <img src> directly)
  useEffect(() => {
    let cancelled = false
    if (!token) return

    const fileIds = messages
      .filter((m) => m.kind === 'PHOTO')
      .map((m) => m.fileId)
      .filter((id): id is string => Boolean(id))
      .filter((id) => !fileUrlCache[id] && !fileLoadError[id])

    if (fileIds.length === 0) return

    ;(async () => {
      for (const id of fileIds) {
        try {
          setFileLoadError((prev) => {
            if (prev[id]) return prev
            return { ...prev, [id]: false }
          })
          const blob = await fetchSupportFileBlob(token, id)
          if (cancelled) return
          const url = URL.createObjectURL(blob)
          setFileUrlCache((prev) => ({ ...prev, [id]: url }))
        } catch {
          if (cancelled) return
          setFileLoadError((prev) => ({ ...prev, [id]: true }))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [messages, token, fileUrlCache])

  useEffect(() => {
    return () => {
      // Cleanup object URLs
      Object.values(fileUrlCache).forEach((url) => {
        try {
          URL.revokeObjectURL(url)
        } catch {
          // ignore
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('support.title')}</h1>
        {canReturnToFunnel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCanReturnToFunnel(false)
              window.dispatchEvent(new CustomEvent('crm:navigate', { detail: { page: 'support-funnel' } }))
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            {t('support.backToFunnel')}
          </Button>
        ) : null}
      </div>
      {!selectedChatId ? (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle>
                {activeTab === 'analytics' ? t('support.analytics.title') : t('support.chats')}
              </CardTitle>
              {activeTab !== 'analytics' ? (
                <Input
                  className="md:max-w-sm"
                  placeholder={t('support.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              ) : null}
            </div>

            {activeTab !== 'analytics' ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t('supportBoard.operatorFilter')}</Label>
                  <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                    <SelectTrigger className="h-8 w-[200px]">
                      <SelectValue placeholder={t('supportBoard.operatorFilter')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('supportBoard.operatorAll')}</SelectItem>
                      <SelectItem value="mine">{t('supportBoard.operatorMe')}</SelectItem>
                      <SelectItem value="unassigned">{t('supportBoard.operatorUnassigned')}</SelectItem>
                      {operatorOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const ok = await ensureNotificationPermission()
                        if (!ok) {
                          setNotificationsEnabled(false)
                          persistNotificationSettings(false, notificationSoundEnabled)
                          return
                        }
                      }
                      setNotificationsEnabled(checked)
                      persistNotificationSettings(checked, notificationSoundEnabled)
                    }}
                  />
                  <Label className="text-xs text-muted-foreground">{t('support.notifications.enable')}</Label>
                </div>

                <div className={"flex items-center gap-2 " + (!notificationsEnabled ? 'opacity-50' : '')}>
                  <Switch
                    checked={notificationSoundEnabled}
                    disabled={!notificationsEnabled}
                    onCheckedChange={async (checked) => {
                      setNotificationSoundEnabled(checked)
                      persistNotificationSettings(notificationsEnabled, checked)
                      if (checked) await primeAudio()
                    }}
                  />
                  <Label className="text-xs text-muted-foreground">{t('support.notifications.sound')}</Label>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const ok = await ensureNotificationPermission()
                    if (!ok) return
                    await primeAudio()
                    playChime()
                    try {
                      new Notification(t('support.notifications.testTitle'), {
                        body: t('support.notifications.testBody'),
                        tag: 'support-test',
                        silent: true,
                      })
                    } catch {
                      // ignore
                    }
                  }}
                >
                  {t('support.notifications.test')}
                </Button>

                {isAdmin ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={assignOperator} onValueChange={setAssignOperator}>
                      <SelectTrigger className="h-8 w-[180px]">
                        <SelectValue placeholder="Оператор" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignOperators.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const ids = sortedChats.map((c) => c.chatId)
                        setSelectedChatIds(new Set(ids))
                      }}
                    >
                      Выбрать все чаты
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={
                        !assignOperator ||
                        selectedChatIds.size === 0 ||
                        assignMutation.isPending
                      }
                      onClick={() => {
                        if (!assignOperator || selectedChatIds.size === 0) return
                        assignMutation.mutate({
                          chatIds: Array.from(selectedChatIds),
                          operator: assignOperator,
                        })
                      }}
                    >
                      Назначить
                    </Button>
                    {selectedChatIds.size > 0 ? (
                      <Button type="button" variant="ghost" size="sm" onClick={clearChatSelection}>
                        <X size={14} className="mr-1" />
                        {selectedChatIds.size}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {mode === 'inbox' ? (
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full flex-nowrap justify-start overflow-x-auto">
                  <TabsTrigger value="new" className="flex-1 min-w-[120px] whitespace-nowrap">
                    {t('support.tabs.new')}
                    {tabCounts.new > 0 ? <span className="ml-1 text-xs">({tabCounts.new})</span> : null}
                  </TabsTrigger>
                  <TabsTrigger value="accepted" className="flex-1 min-w-[140px] whitespace-nowrap">
                    {t('support.tabs.accepted')}
                    {tabCounts.accepted > 0 ? <span className="ml-1 text-xs">({tabCounts.accepted})</span> : null}
                  </TabsTrigger>
                  <TabsTrigger value="archive" className="flex-1 min-w-[120px] whitespace-nowrap">
                    {t('support.tabs.archive')}
                    {tabCounts.archive > 0 ? <span className="ml-1 text-xs">({tabCounts.archive})</span> : null}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}
          </CardHeader>
          <CardContent>
            {activeTab === 'analytics' ? (
              <div className="space-y-4">
                <Tabs value={analyticsTab} onValueChange={(value) => setAnalyticsTab(value as SupportAnalyticsTab)}>
                  <TabsList className="w-full flex-nowrap justify-start overflow-x-auto">
                    <TabsTrigger value="overview" className="flex-1 min-w-[160px] whitespace-nowrap">
                      {t('support.analytics.title')}
                    </TabsTrigger>
                    <TabsTrigger value="operators" className="flex-1 min-w-[180px] whitespace-nowrap">
                      {t('supportOperatorsAnalytics.title')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {analyticsTab === 'overview' ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="text-sm text-muted-foreground">{t('support.analytics.range')}</div>
                      <Select
                        value={analyticsRange}
                        onValueChange={(value) => {
                          setAnalyticsRange(value as SupportAnalyticsRange)
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder={t('support.analytics.range')} />
                        </SelectTrigger>
                        <SelectContent>
                          {analyticsRangeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="secondary" size="sm" onClick={refreshAnalytics} className="w-full sm:w-auto">
                        {t('support.analytics.refresh')}
                      </Button>
                      {analyticsData ? (
                        <Badge variant="secondary">
                          {analyticsData.fromTs
                            ? `${formatDate(analyticsData.fromTs)} — ${formatDate(analyticsData.toTs)}`
                            : t('support.analytics.rangeOptions.all')}
                        </Badge>
                      ) : null}
                    </div>

                    {analyticsLoading ? (
                      <div className="text-sm text-muted-foreground">{t('support.analytics.loading')}</div>
                    ) : analyticsError ? (
                      <div className="text-sm text-destructive">{analyticsError}</div>
                    ) : !analyticsData ? (
                      <div className="text-sm text-muted-foreground">{t('support.analytics.empty')}</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.averageResponseTime')}</div>
                            <div className="text-2xl font-semibold">
                              {analyticsData.avgResponseSeconds !== null
                                ? formatDuration(analyticsData.avgResponseSeconds)
                                : '—'}
                            </div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.messagesPerDay')}</div>
                            <div className="text-2xl font-semibold">
                              {(analyticsData.totalMessages / analyticsData.days).toFixed(1)}
                            </div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.inquiriesPerDay')}</div>
                            <div className="text-2xl font-semibold">
                              {(analyticsData.totalInquiries / analyticsData.days).toFixed(1)}
                            </div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.totalMessages')}</div>
                            <div className="text-2xl font-semibold">{analyticsData.totalMessages}</div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.inboundMessages')}</div>
                            <div className="text-2xl font-semibold">{analyticsData.inboundMessages}</div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.outboundMessages')}</div>
                            <div className="text-2xl font-semibold">{analyticsData.outboundMessages}</div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.totalInquiries')}</div>
                            <div className="text-2xl font-semibold">{analyticsData.totalInquiries}</div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.responsesCount')}</div>
                            <div className="text-2xl font-semibold">{analyticsData.responseCount}</div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.activeChats')}</div>
                            <div className="text-2xl font-semibold">{analyticsData.activeChats}</div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.avgMessagesPerChat')}</div>
                            <div className="text-2xl font-semibold">
                              {analyticsData.avgMessagesPerChat !== null
                                ? analyticsData.avgMessagesPerChat.toFixed(1)
                                : '—'}
                            </div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.responseRate')}</div>
                            <div className="text-2xl font-semibold">
                              {analyticsData.responseRate !== null
                                ? `${Math.round(analyticsData.responseRate * 100)}%`
                                : '—'}
                            </div>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <div className="text-xs text-muted-foreground">{t('support.analytics.avgResponsesPerDay')}</div>
                            <div className="text-2xl font-semibold">
                              {(analyticsData.responseCount / analyticsData.days).toFixed(1)}
                            </div>
                          </div>
                        </div>

                        {analyticsTruncated ? (
                          <div className="text-xs text-muted-foreground">{t('support.analytics.truncated')}</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <SupportOperatorsAnalytics variant="embedded" />
                )}
              </div>
            ) : isChatsLoading ? (
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : isChatsError ? (
              <div className="text-sm text-destructive">{t('common.error')}</div>
            ) : sortedChats.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('support.noChats')}</div>
            ) : (
              <div ref={chatsListContainerRef} className="relative rounded-md border border-border overflow-hidden">
                {hasNewChatsActivityAbove && !isChatsListAtTop ? (
                  <div className="absolute top-2 left-2 right-2 z-10">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full justify-between"
                      onClick={() => {
                        const viewport = chatsListViewportRef.current
                        if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' })
                        setHasNewChatsActivityAbove(false)
                        setNewChatsActivityCount(0)
                      }}
                    >
                      <span className="truncate">{t('support.newMessages')}</span>
                      {newChatsActivityCount > 0 ? <Badge variant="secondary">{newChatsActivityCount}</Badge> : null}
                    </Button>
                  </div>
                ) : null}

                <div className="hidden sm:grid grid-cols-[44px_minmax(0,1fr)_240px_140px] gap-3 px-3 py-2 text-xs text-muted-foreground bg-muted/20">
                  <div />
                  <div className="truncate">{t('support.clientPanel')}</div>
                  <div className="truncate">{t('support.columns.funnelStatus')}</div>
                  <div className="truncate">{t('support.columns.responseTime')}</div>
                </div>

                <ScrollArea className="h-[60vh] sm:h-[640px]">
                  <div className="divide-y divide-border">
                    {sortedChats.map((chat) => {
                      const displayName = [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId
                      const nick = chat.username ? `@${chat.username}` : null
                      const title = displayName
                      const sub = nick || chat.telegramId

                      const pinned = pinnedSet.has(chat.chatId)

                      const rawStageId = chat.funnelStageId || chatStageMap[chat.chatId] || primaryStageId
                      const normalizedStageId = canonicalizeStageId(rawStageId) || rawStageId
                      const stageId = funnelStages.some((s) => s.id === normalizedStageId) ? normalizedStageId : primaryStageId
                      const stageLabel = funnelStages.find((s) => s.id === stageId)?.label

                      const stageLockedByOther =
                        !isAdmin &&
                        Boolean(myUsername) &&
                        Boolean(chat.acceptedBy) &&
                        chat.acceptedBy !== myUsername

                      const muted = isResponseMuted(chat)
                      const inboundTs = chat.lastInboundAt ? new Date(chat.lastInboundAt).getTime() : 0
                      const outboundTs = chat.lastOutboundAt ? new Date(chat.lastOutboundAt).getTime() : 0
                      const waiting = !muted && inboundTs > 0 && inboundTs > outboundTs
                      const waitingSeconds = waiting ? Math.max(1, Math.floor((nowTs - inboundTs) / 1000)) : 0
                      const showAlert = waiting && waitingSeconds >= RESPONSE_LIMIT_SECONDS

                      const fallbackChar = (chat.username?.[0] || chat.firstName?.[0] || chat.telegramId?.[0] || '?')
                        .toUpperCase()

                      return (
                        <div
                          key={chat.chatId}
                          className={
                            "grid grid-cols-[44px_minmax(0,1fr)] sm:grid-cols-[44px_minmax(0,1fr)_240px_140px] gap-3 px-3 py-2 items-center hover:bg-muted/30 " +
                            (selectedChatIds.has(chat.chatId) ? 'bg-muted/20' : '')
                          }
                        >
                          <input
                            type="checkbox"
                            className={
                              'h-4 w-4 rounded border-border ' +
                              (isAdmin ? 'cursor-pointer' : 'opacity-40')
                            }
                            checked={selectedChatIds.has(chat.chatId)}
                            disabled={!isAdmin}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            onChange={() => toggleChatSelection(chat.chatId)}
                          />

                          <button
                            onClick={() => openChat(chat.chatId, selectedChatId ? 'toggle' : 'open')}
                            onMouseEnter={() => void ensureChatAvatarLoaded(chat.chatId)}
                            className="min-w-0 text-left w-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative group shrink-0">
                                <Avatar className="size-9">
                                  {avatarUrlByChatId[chat.chatId] ? <AvatarImage src={avatarUrlByChatId[chat.chatId]} /> : null}
                                  <AvatarFallback className="text-xs">{fallbackChar}</AvatarFallback>
                                </Avatar>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    togglePinned(chat.chatId)
                                  }}
                                  className={
                                    'absolute -right-1 -bottom-1 rounded-full border border-border bg-background p-1 shadow ' +
                                    (pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
                                  }
                                  aria-label={pinned ? 'unpin' : 'pin'}
                                >
                                  {pinned ? <PushPinSlash size={14} /> : <PushPin size={14} />}
                                </button>
                              </div>

                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-medium truncate">{title}</div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {pinned ? <PushPin size={16} weight="fill" className="opacity-80" /> : null}
                                    {chat.unreadCount > 0 ? (
                                      <Badge className="bg-primary text-primary-foreground">{chat.unreadCount}</Badge>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">{sub}</div>
                                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {t('support.acceptedBy')} {chat.acceptedBy ? chat.acceptedBy : t('support.notAccepted')}
                                </div>
                                <div className="text-xs text-muted-foreground truncate mt-1">{chat.lastMessageText || ''}</div>
                              </div>
                            </div>
                          </button>

                          <div className="min-w-0 w-full space-y-1 relative z-10 self-start pt-0.5 col-span-2 sm:col-span-1">
                            <Select
                              value={stageId}
                              onValueChange={(v) => setChatStage(chat.chatId, v)}
                              disabled={stageLockedByOther}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={stageLabel || t('support.funnel.primary')} />
                              </SelectTrigger>
                              <SelectContent>
                                {funnelStages.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <button
                              type="button"
                              className="w-full text-left text-[11px] text-muted-foreground truncate hover:underline"
                              title={chat.telegramId}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openChat(chat.chatId, 'toggle')
                              }}
                            >
                              {chat.telegramId}{chat.username ? ` • @${chat.username}` : ''}
                            </button>
                          </div>

                          <div className={"col-span-2 sm:col-span-1 text-sm text-muted-foreground flex items-center gap-2 " + (showAlert ? 'text-destructive' : '')}>
                            {showAlert ? <Bell size={16} weight="fill" /> : null}
                            <span>{formatDuration(waiting ? waitingSeconds : 0)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_360px] gap-6">
          <Card className={isMobile && selectedChatId ? 'hidden' : 'lg:col-span-1'}>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{t('support.chats')}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedChatId(null)}>
                  {t('support.backToList')}
                </Button>
              </div>

              {mode === 'inbox' ? (
                <>
                  <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="w-full">
                      <TabsTrigger value="new" className="flex-1">
                        {t('support.tabs.new')}
                        {tabCounts.new > 0 ? <span className="ml-1 text-xs">({tabCounts.new})</span> : null}
                      </TabsTrigger>
                      <TabsTrigger value="accepted" className="flex-1">
                        {t('support.tabs.accepted')}
                        {tabCounts.accepted > 0 ? <span className="ml-1 text-xs">({tabCounts.accepted})</span> : null}
                      </TabsTrigger>
                      <TabsTrigger value="archive" className="flex-1">
                        {t('support.tabs.archive')}
                        {tabCounts.archive > 0 ? <span className="ml-1 text-xs">({tabCounts.archive})</span> : null}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Input placeholder={t('support.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                </>
              ) : null}
            </CardHeader>
            <CardContent>
              {isChatsLoading ? (
                <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
              ) : isChatsError ? (
                <div className="text-sm text-destructive">{t('common.error')}</div>
              ) : sortedChats.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t('support.noChats')}</div>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-3 px-3 py-2 text-xs text-muted-foreground bg-muted/20">
                    <div />
                    <div className="truncate">{t('support.columns.responseTime')}</div>
                  </div>
                  <ScrollArea className="h-[520px]">
                    <div className="divide-y divide-border">
                      {sortedChats.map((chat) => {
                        const isActive = chat.chatId === selectedChatId
                        const tag = chat.username ? `@${chat.username}` : null
                        const display = `${chat.telegramId}${tag ? ` • ${tag}` : ''}`

                        const pinned = pinnedSet.has(chat.chatId)

                        const muted = isResponseMuted(chat)
                        const inboundTs = chat.lastInboundAt ? new Date(chat.lastInboundAt).getTime() : 0
                        const outboundTs = chat.lastOutboundAt ? new Date(chat.lastOutboundAt).getTime() : 0
                        const waiting = !muted && inboundTs > 0 && inboundTs > outboundTs
                        const waitingSeconds = waiting ? Math.max(1, Math.floor((nowTs - inboundTs) / 1000)) : 0
                        const showAlert = waiting && waitingSeconds >= RESPONSE_LIMIT_SECONDS

                        const fallbackChar = (chat.username?.[0] || chat.firstName?.[0] || chat.telegramId?.[0] || '?')
                          .toUpperCase()

                        return (
                          <div
                            key={chat.chatId}
                            className={
                              'grid grid-cols-[minmax(0,1fr)_90px] gap-3 px-3 py-2 items-center transition-colors ' +
                              (isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-muted/30')
                            }
                          >
                            <button
                              onClick={() => openChat(chat.chatId, 'toggle')}
                              onMouseEnter={() => void ensureChatAvatarLoaded(chat.chatId)}
                              className="min-w-0 text-left w-full"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative group shrink-0">
                                  <Avatar className="size-9">
                                    {avatarUrlByChatId[chat.chatId] ? <AvatarImage src={avatarUrlByChatId[chat.chatId]} /> : null}
                                    <AvatarFallback className="text-xs">{fallbackChar}</AvatarFallback>
                                  </Avatar>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      togglePinned(chat.chatId)
                                    }}
                                    className={
                                      'absolute -right-1 -bottom-1 rounded-full border border-border bg-background p-1 shadow ' +
                                      (pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
                                    }
                                    aria-label={pinned ? 'unpin' : 'pin'}
                                  >
                                    {pinned ? <PushPinSlash size={14} /> : <PushPin size={14} />}
                                  </button>
                                </div>

                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <div className="font-medium truncate">{display}</div>
                                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    {t('support.acceptedBy')} {chat.acceptedBy ? chat.acceptedBy : t('support.notAccepted')}
                                  </div>
                                </div>
                              </div>
                            </button>

                            <div className={"text-xs flex items-center gap-2 " + (showAlert ? 'text-destructive' : (isActive ? 'text-sidebar-accent-foreground/70' : 'text-muted-foreground'))}>
                              {showAlert ? <Bell size={14} weight="fill" /> : null}
                              <span>{formatDuration(waiting ? waitingSeconds : 0)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={isMobile && !selectedChatId ? 'hidden' : 'lg:col-span-1'}>
            <CardHeader>
              {isMobile ? (
                <div className="flex items-center gap-2 pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedChatId(null)}
                    disabled={!selectedChatId}
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <div className="min-w-0 text-sm font-semibold truncate">
                    {selectedChat
                      ? `${t('support.chatWith')} ${selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramId}`
                      : t('support.selectChat')}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <CardTitle>
                  {selectedChat ? (
                    <button
                      type="button"
                      onClick={() => setSelectedChatId(null)}
                      className="min-w-0 text-left hover:underline"
                      title={t('support.backToList')}
                    >
                      {`${t('support.chatWith')} ${selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramId}`}
                    </button>
                  ) : (
                    t('support.selectChat')
                  )}
                </CardTitle>

                {selectedChatId && sortedChats.length > 1 ? (
                  <Select value={selectedChatId} onValueChange={(v) => openChat(v, 'open')}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder={t('support.chats')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedChats.map((chat) => {
                        const displayName = [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId
                        const label = chat.username ? `@${chat.username}` : displayName
                        return (
                          <SelectItem key={chat.chatId} value={chat.chatId}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
              {selectedChat ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={isResponseMuted(selectedChat) ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const chatId = selectedChat.chatId
                      const inboundKey = selectedChat.lastInboundAt ? String(selectedChat.lastInboundAt) : 'none'
                      setResponseMutedMap((prev) => {
                        const next = { ...prev }
                        if (next[chatId]) {
                          delete next[chatId]
                        } else {
                          next[chatId] = inboundKey
                        }
                        persistResponseMuted(next)
                        return next
                      })
                    }}
                  >
                    {isResponseMuted(selectedChat) ? t('support.responseNeeded') : t('support.responseNotNeeded')}
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className={isMobile ? 'flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pb-24' : 'flex flex-col gap-4 md:block'}>
              <div className="flex flex-col gap-4 md:block">
                <div className="rounded-md border border-border overflow-hidden">
                  <ScrollArea
                    className="p-3"
                    style={{ height: isMobile ? '42vh' : messagesPaneHeight }}
                  >
                    {isMessagesLoading ? (
                      <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
                    ) : messages.length === 0 ? (
                      <div className="text-sm text-muted-foreground">{t('support.noMessages')}</div>
                    ) : (
                      <div className="space-y-3 pr-3">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className={
                              'max-w-[85%] rounded-md px-3 py-2 text-sm border ' +
                              (m.direction === 'OUT'
                                ? 'ml-auto bg-primary/10 border-primary/20'
                                : 'mr-auto bg-muted/40 border-border')
                            }
                          >
                          {m.replyTo ? (
                            <div className="mb-2 rounded border border-border/60 bg-background/40 px-2 py-1 text-xs">
                              <div className="text-muted-foreground truncate">
                                {t('support.replyToLabel', {
                                  name: m.replyTo.direction === 'OUT' ? (m.replyTo.adminUsername || t('support.admin')) : t('support.user'),
                                })}
                              </div>
                              <div className="truncate">
                                {m.replyTo.kind === 'PHOTO'
                                  ? (m.replyTo.text ? m.replyTo.text : `[${t('support.photo')}]`)
                                  : (m.replyTo.text ?? '')}
                              </div>
                            </div>
                          ) : null}

                          {m.kind === 'PHOTO' && m.fileId ? (
                            <div className="space-y-2">
                              {fileUrlCache[m.fileId] ? (
                                <button
                                  type="button"
                                  className="block"
                                  onClick={() => {
                                    const fileId = m.fileId
                                    if (!fileId) return
                                    const src = fileUrlCache[fileId]
                                    if (!src) return
                                    openImageViewer(src)
                                  }}
                                >
                                  <img
                                    src={fileUrlCache[m.fileId]}
                                    alt="support-photo"
                                    className="max-h-[280px] w-auto rounded border border-border cursor-zoom-in"
                                  />
                                </button>
                              ) : fileLoadError[m.fileId] ? (
                                <div className="text-xs text-muted-foreground">
                                  {t('support.photoLoadFailed')}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">{t('support.photoLoading')}</div>
                              )}

                              {m.text ? (
                                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap break-words">{m.text ?? ''}</div>
                          )}
                          <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>
                              {m.direction === 'OUT' ? t('support.admin') : t('support.user')} •{' '}
                              {new Date(m.createdAt).toLocaleString()}
                            </span>

                            {m.direction === 'OUT' ? (
                              <span title={t('support.userSeenHint')}>
                                •{' '}
                                {(m as any).userSeenAt
                                  ? t('support.userSeen')
                                  : (selectedChatLastInboundTs > new Date(m.createdAt).getTime()
                                    ? t('support.userSeen')
                                    : t('support.userNotSeen'))}
                              </span>
                            ) : null}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title={t('support.reply')}
                              disabled={!selectedChatId}
                              onClick={() => {
                                setReplyTo(m)
                                requestAnimationFrame(() => {
                                  messageTextareaRef.current?.focus()
                                })
                              }}
                            >
                              <ArrowBendUpLeft size={14} />
                            </Button>

                            {canDeleteSupportMessage(m) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title={t('support.deleteMessage')}
                                disabled={deleteMessageMutation.isPending || !selectedChatId}
                                onClick={() => {
                                  if (!selectedChatId) return
                                  const ok = window.confirm(t('support.deleteMessageConfirm'))
                                  if (!ok) return
                                  deleteMessageMutation.mutate({ chatId: selectedChatId, messageId: m.id })
                                }}
                              >
                                <TrashSimple size={14} />
                              </Button>
                            ) : null}
                          </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    title="Drag to resize"
                    onPointerDown={beginResizeMessagesPane}
                    onDoubleClick={() => {
                      messagesPaneHeightRef.current = 420
                      setMessagesPaneHeight(420)
                      try {
                        window.localStorage.setItem(MESSAGES_PANE_HEIGHT_KEY, '420')
                      } catch {
                        // ignore
                      }
                    }}
                    className={
                      'h-2 cursor-row-resize bg-muted/20 hover:bg-muted/40 active:bg-muted/60 ' +
                      (isMobile ? 'hidden' : '')
                    }
                    style={{ touchAction: 'none' }}
                  />
                </div>

                {selectedChat ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedChatId(null)}
                        className="block text-sm font-medium truncate hover:underline"
                        title={t('support.backToList')}
                      >
                        {selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramId}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {selectedChat.status && String(selectedChat.status).toUpperCase() === 'ACCEPTED' ? (
                          <>
                            {t('support.acceptedBy')}{' '}
                            <span className="text-foreground">{selectedChat.acceptedBy || '—'}</span>
                          </>
                        ) : (
                          <span>{t('support.notAccepted')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="w-full md:w-auto"
                        onClick={() => markUnreadMutation.mutate(selectedChat.chatId)}
                        disabled={markUnreadMutation.isPending}
                      >
                        {markUnreadMutation.isPending ? t('support.processing') : t('support.markUnread')}
                      </Button>

                      {String(selectedChat.status || '').toUpperCase() === 'ARCHIVE' ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full md:w-auto"
                            onClick={() => unarchiveMutation.mutate(selectedChat.chatId)}
                            disabled={unarchiveMutation.isPending}
                          >
                            {unarchiveMutation.isPending ? t('support.processing') : t('support.toNew')}
                          </Button>
                          <Button
                            className="w-full md:w-auto"
                            onClick={() => acceptMutation.mutate(selectedChat.chatId)}
                            disabled={acceptMutation.isPending}
                          >
                            {acceptMutation.isPending ? t('support.processing') : t('support.accept')}
                          </Button>
                        </>
                      ) : String(selectedChat.status || '').toUpperCase() !== 'ACCEPTED' ? (
                        <Button
                          className="w-full md:w-auto"
                          onClick={() => acceptMutation.mutate(selectedChat.chatId)}
                          disabled={acceptMutation.isPending}
                        >
                          {acceptMutation.isPending ? t('support.processing') : t('support.accept')}
                        </Button>
                      ) : null}

                      <Button
                        variant="destructive"
                        className="w-full md:w-auto"
                        onClick={() => archiveMutation.mutate(selectedChat.chatId)}
                        disabled={
                          archiveMutation.isPending ||
                          String(selectedChat.status || '').toUpperCase() === 'ARCHIVE' ||
                          Boolean(
                            selectedChat.acceptedBy &&
                              myUsername &&
                              selectedChat.acceptedBy !== myUsername
                          )
                        }
                      >
                        {archiveMutation.isPending ? t('support.processing') : t('support.toArchive')}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2 md:static md:pt-0 sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-2 py-3 -mx-2">
                  {selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername ? (
                    <div className="text-sm text-destructive">
                      {t('support.lockedByOther', { name: selectedChat.acceptedBy })}
                    </div>
                  ) : null}

                  <Textarea
                    ref={messageTextareaRef}
                    placeholder={t('support.writeMessage')}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={isMobile ? 3 : 4}
                    disabled={
                      Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                      Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                    }
                  />

                  {replyTo ? (
                    <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {t('support.replyingTo', { name: replyPreviewAuthor(replyTo) })}
                        </div>
                        <div className="text-sm truncate">{replyPreviewText(replyTo)}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={t('support.cancelReply')}
                        onClick={() => setReplyTo(null)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:items-start">
                    <div className="md:col-span-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={photoPickerRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          if (!file || !selectedChatId) return
                          setPhotoFile(file)
                          sendPhotoMutation.mutate({
                            chatId: selectedChatId,
                            file,
                            caption: photoCaption.trim() || undefined,
                          })
                        }}
                        disabled={
                          Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                          Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                        }
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => photoPickerRef.current?.click()}
                        disabled={
                          sendPhotoMutation.isPending ||
                          Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                          Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                        }
                      >
                        <Paperclip size={18} />
                        <span>{t('support.attachPhoto')}</span>
                      </Button>
                    </div>
                    <div className="md:col-span-1 flex justify-end gap-2">
                      <Button
                        className="w-full md:w-auto"
                        onClick={handleSend}
                        disabled={
                          !messageText.trim() ||
                          sendMessageMutation.isPending ||
                          Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                          Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                        }
                      >
                        {sendMessageMutation.isPending ? t('support.sending') : t('support.send')}
                      </Button>
                    </div>
                  </div>
                  <Input
                    placeholder={t('support.photoCaption')}
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    disabled={
                      Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                      Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isMobile ? 'hidden' : 'lg:col-span-1'}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{t('support.clientPanel')}</CardTitle>
                {selectedChat?.isBlocked ? <Badge variant="destructive">{t('support.blocked')}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedChat ? (
                <div className="text-sm text-muted-foreground">{t('support.selectChatHint')}</div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const rawStageId = selectedChat.funnelStageId || chatStageMap[selectedChat.chatId] || primaryStageId

                    const normalizedRaw = canonicalizeStageId(rawStageId) || primaryStageId
                    let resolved = normalizedRaw
                    const seen = new Set<string>()
                    while (stageAliases[resolved] && !seen.has(resolved)) {
                      seen.add(resolved)
                      resolved = canonicalizeStageId(stageAliases[resolved]) || stageAliases[resolved]
                    }

                    const stageId = funnelStages.some((s) => s.id === resolved) ? resolved : primaryStageId
                    const stageLabel = funnelStages.find((s) => s.id === stageId)?.label

                    const stageLockedByOther =
                      !isAdmin &&
                      Boolean(myUsername) &&
                      Boolean(selectedChat.acceptedBy) &&
                      selectedChat.acceptedBy !== myUsername
                    return (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">{t('support.columns.funnelStatus')}</div>
                        <Select
                          value={stageId}
                          onValueChange={(v) => setChatStage(selectedChat.chatId, v)}
                          disabled={stageLockedByOther}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={stageLabel || t('support.funnel.primary')} />
                          </SelectTrigger>
                          <SelectContent>
                            {funnelStages.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })()}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChatId(null)}
                      className="min-w-0 text-sm font-medium truncate hover:underline"
                      title={t('support.backToList')}
                    >
                      {selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramId}
                    </button>

                    {selectedChat.isBlocked ? (
                      <Button
                        variant="outline"
                        onClick={() => unblockMutation.mutate(selectedChat.chatId)}
                        disabled={unblockMutation.isPending}
                      >
                        {unblockMutation.isPending ? t('support.processing') : t('support.unblock')}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={() => blockMutation.mutate(selectedChat.chatId)}
                        disabled={
                          blockMutation.isPending ||
                          Boolean(selectedChat.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                        }
                      >
                        {blockMutation.isPending ? t('support.processing') : t('support.block')}
                      </Button>
                    )}
                  </div>

                  <div className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-2">{t('support.clientStats.title')}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">{t('support.clientStats.depositsCount')}</div>
                        <div className="text-lg font-semibold text-green-400">
                          {selectedTelegramId ? depositCount : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t('support.clientStats.withdrawalsCount')}</div>
                        <div className="text-lg font-semibold text-orange-400">
                          {selectedTelegramId ? withdrawalCount : '—'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">{t('support.clientStats.visibleDeposit')}</div>
                        <div className="text-lg font-mono font-semibold text-cyan-400">
                          {leadVisibleDeposit == null ? '—' : `$${leadVisibleDeposit.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{t('support.notes')}</div>
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={4}
                      placeholder={t('support.notesPlaceholder')}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          if (!selectedChat) return
                          const text = noteText.trim()
                          if (!text) return
                          addNoteMutation.mutate({ chatId: selectedChat.chatId, text })
                        }}
                        disabled={!noteText.trim() || addNoteMutation.isPending}
                      >
                        {addNoteMutation.isPending ? t('support.processing') : t('support.addNote')}
                      </Button>
                    </div>

                    {notes.length === 0 ? (
                      <div className="text-xs text-muted-foreground">{t('support.noNotes')}</div>
                    ) : (
                      <div className="max-h-[240px] overflow-auto rounded-md border border-border p-2 space-y-2">
                        {notes.map((n) => (
                          <div key={n.id} className="text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 text-muted-foreground">
                                {(n.adminUsername || t('support.admin'))} • {new Date(n.createdAt).toLocaleString()}
                              </div>

                              {selectedChat ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title={t('support.editNote')}
                                    onClick={() => {
                                      setEditingNoteId(n.id)
                                      setEditingNoteText(n.text || '')
                                    }}
                                    disabled={updateNoteMutation.isPending || deleteNoteMutation.isPending}
                                  >
                                    <PencilSimple size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title={t('support.deleteNote')}
                                    onClick={() => {
                                      if (!window.confirm(t('support.deleteNoteConfirm'))) return
                                      deleteNoteMutation.mutate({ chatId: selectedChat.chatId, noteId: n.id })
                                    }}
                                    disabled={updateNoteMutation.isPending || deleteNoteMutation.isPending}
                                  >
                                    <TrashSimple size={16} />
                                  </Button>
                                </div>
                              ) : null}
                            </div>

                            {editingNoteId === n.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  rows={4}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingNoteId(null)
                                      setEditingNoteText('')
                                    }}
                                    disabled={updateNoteMutation.isPending}
                                  >
                                    {t('support.cancelEdit')}
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      if (!selectedChat) return
                                      const text = editingNoteText.trim()
                                      if (!text) return
                                      updateNoteMutation.mutate({ chatId: selectedChat.chatId, noteId: n.id, text })
                                    }}
                                    disabled={!editingNoteText.trim() || updateNoteMutation.isPending}
                                  >
                                    {updateNoteMutation.isPending ? t('support.processing') : t('support.saveNote')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap break-words">{n.text}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="sm:max-w-5xl p-4">
          <DialogHeader>
            <DialogTitle>{t('support.photo')}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">{Math.round(imageViewerZoom * 100)}%</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageViewerZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
              >
                <Minus size={16} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageViewerZoom((z) => Math.min(5, Math.round((z + 0.25) * 100) / 100))}
              >
                <Plus size={16} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageViewerZoom(1)}
              >
                <ArrowCounterClockwise size={16} />
              </Button>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-auto rounded-md border border-border bg-muted/10">
            {imageViewerSrc ? (
              <div className="p-3">
                <img
                  src={imageViewerSrc}
                  alt="support-photo-large"
                  style={{ transform: `scale(${imageViewerZoom})`, transformOrigin: 'top left' }}
                  className="select-none"
                />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
