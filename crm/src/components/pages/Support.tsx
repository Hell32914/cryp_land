import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiQuery } from '@/hooks/use-api-query'
import { useAuth } from '@/lib/auth'
import {
  fetchSupportChats,
  fetchSupportFileBlob,
  fetchSupportMessages,
  fetchSupportNotes,
  acceptSupportChat,
  addSupportNote,
  archiveSupportChat,
  blockSupportChat,
  unblockSupportChat,
  unarchiveSupportChat,
  markSupportChatRead,
  markSupportChatUnread,
  sendSupportPhoto,
  sendSupportMessage,
  setSupportChatStage,
  type SupportChatRecord,
  type SupportMessageRecord,
  type SupportNoteRecord,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PushPin, PushPinSlash, Bell, Paperclip, Plus, Minus, ArrowCounterClockwise } from '@phosphor-icons/react'
import {
  getPrimaryStageId,
  loadPinnedChatIds,
  loadSupportChatStageMap,
  loadSupportFunnelStages,
  savePinnedChatIds,
  saveSupportChatStageMap,
  subscribeSupportFunnelUpdates,
  type SupportFunnelStage,
} from '@/lib/support-funnel'

type SupportChatsTab = 'new' | 'accepted' | 'archive'

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

export function Support() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const myUsername = useMemo(() => getUsernameFromJwt(token), [token])

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<SupportChatsTab>('new')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const photoPickerRef = useRef<HTMLInputElement | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [shouldScrollMessagesToBottom, setShouldScrollMessagesToBottom] = useState(false)
  const [scrollBehavior, setScrollBehavior] = useState<ScrollBehavior>('auto')

  const scrollMessagesToBottom = (behavior: ScrollBehavior = 'auto') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' })
    })
  }

  const [noteText, setNoteText] = useState('')

  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [imageViewerSrc, setImageViewerSrc] = useState<string | null>(null)
  const [imageViewerZoom, setImageViewerZoom] = useState(1)

  const [fileUrlCache, setFileUrlCache] = useState<Record<string, string>>({})
  const [fileLoadError, setFileLoadError] = useState<Record<string, boolean>>({})

  const chatsListContainerRef = useRef<HTMLDivElement | null>(null)
  const chatsListViewportRef = useRef<HTMLElement | null>(null)
  const [isChatsListAtTop, setIsChatsListAtTop] = useState(true)
  const [hasNewChatsActivityAbove, setHasNewChatsActivityAbove] = useState(false)
  const [newChatsActivityCount, setNewChatsActivityCount] = useState(0)
  const prevChatMetaRef = useRef<Record<string, { lastMessageAt: string | null; unreadCount: number }>>({})

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

  const ensureNotificationPermission = async () => {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) {
      toast.error(t('support.notifications.notSupported'))
      return false
    }
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') {
      toast.error(t('support.notifications.permissionDenied'))
      return false
    }
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      toast.error(t('support.notifications.permissionDenied'))
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
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01)
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
      { id: 'spam', label: t('support.funnel.spam') },
    ],
    [t]
  )

  const [funnelStages, setFunnelStages] = useState<SupportFunnelStage[]>(defaultStages)
  const [chatStageMap, setChatStageMap] = useState<Record<string, string>>({})
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>([])

  useEffect(() => {
    const reloadAll = () => {
      // Load local settings for funnel labels and pinned chats.
      setFunnelStages(loadSupportFunnelStages(defaultStages))
      setChatStageMap(loadSupportChatStageMap())
      setPinnedChatIds(loadPinnedChatIds())
    }

    reloadAll()

    const unsubscribe = subscribeSupportFunnelUpdates((kind) => {
      if (kind === 'stages') setFunnelStages(loadSupportFunnelStages(defaultStages))
      if (kind === 'chatStageMap') setChatStageMap(loadSupportChatStageMap())
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
    setChatStageMap((prev) => {
      const next = { ...prev, [chatId]: stageId }
      saveSupportChatStageMap(next)
      return next
    })

    if (token) {
      setStageMutation.mutate({ chatId, stageId })
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

  const { data: chatsData, isLoading: isChatsLoading, isError: isChatsError } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportChats>>
  >(
    ['support-chats'],
    // Fetch a wider list and filter locally so we can search by local-only "tags" (funnel stage labels).
    // Backend enforces a max limit (currently 200).
    (authToken) => fetchSupportChats(authToken, '', 1, 200),
    {
      enabled: Boolean(token),
      // Auto-refresh list so new inbound messages show up without reload.
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const chats = chatsData?.chats ?? []

  const getChatTab = (chat: SupportChatRecord): SupportChatsTab => {
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

  const tabCounts = useMemo(() => {
    const counts: Record<SupportChatsTab, number> = { new: 0, accepted: 0, archive: 0 }
    for (const chat of chats) {
      counts[getChatTab(chat)]++
    }
    return counts
  }, [chats])

  const filteredChats = useMemo(() => {
    const raw = chats.filter((chat) => getChatTab(chat) === activeTab)
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
  }, [activeTab, chats, funnelStages, chatStageMap, primaryStageId, search])

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
        if (!ok) return

        try {
          const n = new Notification(t('support.notifications.newMessageTitle'), {
            body: `${title}: ${body}`,
            tag: `support-${chat.chatId}`,
            silent: true,
          })
          n.onclick = () => {
            try {
              window.focus()
              setSelectedChatId(chat.chatId)
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
  }, [chats, notificationSoundEnabled, notificationsEnabled, selectedChatId, t])

  const sortedChats = useMemo(() => {
    const toTs = (value: string | null) => (value ? new Date(value).getTime() : 0)
    return [...filteredChats].sort((a, b) => {
      const ap = pinnedSet.has(a.chatId) ? 1 : 0
      const bp = pinnedSet.has(b.chatId) ? 1 : 0
      if (ap !== bp) return bp - ap
      return toTs(b.lastMessageAt) - toTs(a.lastMessageAt)
    })
  }, [filteredChats, pinnedSet])

  const selectedChat: SupportChatRecord | null = useMemo(() => {
    if (!selectedChatId) return null
    return chats.find((c) => c.chatId === selectedChatId) ?? null
  }, [chats, selectedChatId])

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
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      setActiveTab('accepted')
      setSelectedChatId(updated.chatId)
      // Default funnel stage after accept: Primary contact
      setChatStage(updated.chatId, primaryStageId)
      toast.success(t('support.accepted'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.acceptFailed'))
    },
  })

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
      sendSupportMessage(token!, chatId, text),
    onSuccess: async () => {
      setMessageText('')
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
      sendSupportPhoto(token!, chatId, file, caption),
    onSuccess: async () => {
      setPhotoCaption('')
      setPhotoFile(null)
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
    setNoteText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (photoPickerRef.current) photoPickerRef.current.value = ''

    if (!selectedChatId) return
    setScrollBehavior('auto')
    setShouldScrollMessagesToBottom(true)
  }, [selectedChatId])

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
      </div>
      {!selectedChatId ? (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle>{t('support.chats')}</CardTitle>
              <Input
                className="md:max-w-sm"
                placeholder={t('support.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
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
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SupportChatsTab)}>
              <TabsList>
                <TabsTrigger value="new">
                  {t('support.tabs.new')}
                  {tabCounts.new > 0 ? <span className="ml-1 text-xs">({tabCounts.new})</span> : null}
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  {t('support.tabs.accepted')}
                  {tabCounts.accepted > 0 ? <span className="ml-1 text-xs">({tabCounts.accepted})</span> : null}
                </TabsTrigger>
                <TabsTrigger value="archive">
                  {t('support.tabs.archive')}
                  {tabCounts.archive > 0 ? <span className="ml-1 text-xs">({tabCounts.archive})</span> : null}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isChatsLoading ? (
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

                <div className="grid grid-cols-[44px_minmax(0,1fr)_240px_140px] gap-3 px-3 py-2 text-xs text-muted-foreground bg-muted/20">
                  <div />
                  <div className="truncate">{t('support.clientPanel')}</div>
                  <div className="truncate">{t('support.columns.funnelStatus')}</div>
                  <div className="truncate">{t('support.columns.responseTime')}</div>
                </div>

                <ScrollArea className="h-[640px]">
                  <div className="divide-y divide-border">
                    {sortedChats.map((chat) => {
                      const displayName = [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId
                      const nick = chat.username ? `@${chat.username}` : null
                      const title = displayName
                      const sub = nick || chat.telegramId

                      const pinned = pinnedSet.has(chat.chatId)

                      const stageId = chat.funnelStageId || chatStageMap[chat.chatId] || primaryStageId
                      const stageLabel = funnelStages.find((s) => s.id === stageId)?.label

                      const inboundTs = chat.lastInboundAt ? new Date(chat.lastInboundAt).getTime() : 0
                      const outboundTs = chat.lastOutboundAt ? new Date(chat.lastOutboundAt).getTime() : 0
                      const waiting = inboundTs > 0 && inboundTs > outboundTs
                      const waitingSeconds = waiting ? Math.max(1, Math.floor((nowTs - inboundTs) / 1000)) : 0
                      const showAlert = waiting && waitingSeconds >= RESPONSE_LIMIT_SECONDS

                      const fallbackChar = (chat.username?.[0] || chat.firstName?.[0] || chat.telegramId?.[0] || '?')
                        .toUpperCase()

                      return (
                        <div
                          key={chat.chatId}
                          className="grid grid-cols-[44px_minmax(0,1fr)_240px_140px] gap-3 px-3 py-2 items-center hover:bg-muted/30"
                        >
                          <input type="checkbox" disabled className="h-4 w-4 opacity-40" />

                          <button
                            onClick={() => setSelectedChatId(chat.chatId)}
                            className="min-w-0 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative group shrink-0">
                                <Avatar className="size-9">
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

                              <div className="min-w-0 flex-1">
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
                                <div className="text-xs text-muted-foreground truncate mt-1">{chat.lastMessageText || ''}</div>
                              </div>
                            </div>
                          </button>

                          <Select value={stageId} onValueChange={(v) => setChatStage(chat.chatId, v)}>
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

                          <div className={"text-sm text-muted-foreground flex items-center gap-2 " + (showAlert ? 'text-destructive' : '')}>
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
          <Card className="lg:col-span-1">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{t('support.chats')}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedChatId(null)}>
                  {t('support.backToList')}
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SupportChatsTab)}>
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
                  <div className="grid grid-cols-[minmax(0,1fr)_160px_90px] gap-3 px-3 py-2 text-xs text-muted-foreground bg-muted/20">
                    <div />
                    <div className="truncate">{t('support.columns.funnelStatus')}</div>
                    <div className="truncate">{t('support.columns.responseTime')}</div>
                  </div>
                  <ScrollArea className="h-[520px]">
                    <div className="divide-y divide-border">
                      {sortedChats.map((chat) => {
                        const isActive = chat.chatId === selectedChatId
                        const displayName = [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId
                        const nick = chat.username ? `@${chat.username}` : null
                        const title = displayName
                        const sub = nick || chat.telegramId

                        const pinned = pinnedSet.has(chat.chatId)
                        const stageId = chat.funnelStageId || chatStageMap[chat.chatId] || primaryStageId
                        const stageLabel = funnelStages.find((s) => s.id === stageId)?.label

                        const inboundTs = chat.lastInboundAt ? new Date(chat.lastInboundAt).getTime() : 0
                        const outboundTs = chat.lastOutboundAt ? new Date(chat.lastOutboundAt).getTime() : 0
                        const waiting = inboundTs > 0 && inboundTs > outboundTs
                        const waitingSeconds = waiting ? Math.max(1, Math.floor((nowTs - inboundTs) / 1000)) : 0
                        const showAlert = waiting && waitingSeconds >= RESPONSE_LIMIT_SECONDS

                        const fallbackChar = (chat.username?.[0] || chat.firstName?.[0] || chat.telegramId?.[0] || '?')
                          .toUpperCase()

                        return (
                          <div
                            key={chat.chatId}
                            className={
                              'grid grid-cols-[minmax(0,1fr)_160px_90px] gap-3 px-3 py-2 items-center transition-colors ' +
                              (isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-muted/30')
                            }
                          >
                            <button onClick={() => setSelectedChatId(chat.chatId)} className="min-w-0 text-left">
                              <div className="flex items-center gap-3">
                                <div className="relative group shrink-0">
                                  <Avatar className="size-9">
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

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium truncate">{title}</div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {chat.unreadCount > 0 ? (
                                        <Badge className={isActive ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground'}>
                                          {chat.unreadCount}
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className={"text-xs truncate " + (isActive ? 'text-sidebar-accent-foreground/70' : 'text-muted-foreground')}>
                                    {sub}
                                  </div>
                                  <div className={"text-xs truncate mt-1 " + (isActive ? 'text-sidebar-accent-foreground/70' : 'text-muted-foreground')}>
                                    {chat.lastMessageText || ''}
                                  </div>
                                </div>
                              </div>
                            </button>

                            <Select value={stageId} onValueChange={(v) => setChatStage(chat.chatId, v)}>
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

          <Card className="lg:col-span-1">
            <CardHeader>
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
                  <Select value={selectedChatId} onValueChange={(v) => setSelectedChatId(v)}>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-[420px] rounded-md border border-border p-3">
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
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {m.direction === 'OUT' ? t('support.admin') : t('support.user')} •{' '}
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {selectedChat ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
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

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => markUnreadMutation.mutate(selectedChat.chatId)}
                        disabled={markUnreadMutation.isPending}
                      >
                        {markUnreadMutation.isPending ? t('support.processing') : t('support.markUnread')}
                      </Button>

                      {String(selectedChat.status || '').toUpperCase() === 'ARCHIVE' ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => unarchiveMutation.mutate(selectedChat.chatId)}
                            disabled={unarchiveMutation.isPending}
                          >
                            {unarchiveMutation.isPending ? t('support.processing') : t('support.toNew')}
                          </Button>
                          <Button
                            onClick={() => acceptMutation.mutate(selectedChat.chatId)}
                            disabled={acceptMutation.isPending}
                          >
                            {acceptMutation.isPending ? t('support.processing') : t('support.accept')}
                          </Button>
                        </>
                      ) : String(selectedChat.status || '').toUpperCase() !== 'ACCEPTED' ? (
                        <Button
                          onClick={() => acceptMutation.mutate(selectedChat.chatId)}
                          disabled={acceptMutation.isPending}
                        >
                          {acceptMutation.isPending ? t('support.processing') : t('support.accept')}
                        </Button>
                      ) : null}

                      <Button
                        variant="destructive"
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

                <div className="space-y-2">
                  {selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername ? (
                    <div className="text-sm text-destructive">
                      {t('support.lockedByOther', { name: selectedChat.acceptedBy })}
                    </div>
                  ) : null}

                  <Textarea
                    placeholder={t('support.writeMessage')}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                    disabled={
                      Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                      Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                    }
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
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

          <Card className="lg:col-span-1">
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

                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{t('support.requestInfo')}</div>
                    <Select
                      value={selectedChat.funnelStageId || chatStageMap[selectedChat.chatId] || primaryStageId}
                      onValueChange={(v) => setChatStage(selectedChat.chatId, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('support.funnel.primary')} />
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
                            <div className="text-muted-foreground">
                              {(n.adminUsername || t('support.admin'))} • {new Date(n.createdAt).toLocaleString()}
                            </div>
                            <div className="whitespace-pre-wrap break-words">{n.text}</div>
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
