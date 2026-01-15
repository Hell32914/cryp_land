import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiQuery } from '@/hooks/use-api-query'
import { useAuth } from '@/lib/auth'
import {
  fetchSupportChats,
  fetchSupportFileBlob,
  fetchSupportMessages,
  acceptSupportChat,
  archiveSupportChat,
  blockSupportChat,
  unblockSupportChat,
  unarchiveSupportChat,
  markSupportChatRead,
  sendSupportPhoto,
  sendSupportMessage,
  type SupportChatRecord,
  type SupportMessageRecord,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
import { PushPin, PushPinSlash, Bell } from '@phosphor-icons/react'
import {
  getPrimaryStageId,
  loadPinnedChatIds,
  loadSupportChatStageMap,
  loadSupportFunnelStages,
  savePinnedChatIds,
  saveSupportChatStageMap,
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

  const [fileUrlCache, setFileUrlCache] = useState<Record<string, string>>({})
  const [fileLoadError, setFileLoadError] = useState<Record<string, boolean>>({})

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
    // Load local settings for funnel labels and pinned chats.
    setFunnelStages(loadSupportFunnelStages(defaultStages))
    setChatStageMap(loadSupportChatStageMap())
    setPinnedChatIds(loadPinnedChatIds())
  }, [defaultStages])

  const primaryStageId = funnelStages.find((s) => s.id === getPrimaryStageId())?.id || getPrimaryStageId()

  const setChatStage = (chatId: string, stageId: string) => {
    setChatStageMap((prev) => {
      const next = { ...prev, [chatId]: stageId }
      saveSupportChatStageMap(next)
      return next
    })
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
    ['support-chats', search],
    (authToken) => fetchSupportChats(authToken, search),
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
    return chats.filter((chat) => getChatTab(chat) === activeTab)
  }, [activeTab, chats])

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

  const markReadMutation = useMutation({
    mutationFn: (chatId: string) => markSupportChatRead(token!, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-chats'] })
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (chatId: string) => acceptSupportChat(token!, chatId),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      setActiveTab('accepted')
      setSelectedChatId(updated.chatId)
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
      toast.success(t('support.sent'))
    },
    onError: (e: any) => {
      toast.error(e?.message || t('support.sendFailed'))
    },
  })

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
    if (selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') {
      toast.error(t('support.mustAcceptFirst'))
      return
    }
    const trimmed = messageText.trim()
    if (!trimmed) return
    sendMessageMutation.mutate({ chatId: selectedChatId, text: trimmed })
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('support.chats')}</CardTitle>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SupportChatsTab)}>
              <TabsList className="w-full">
                <TabsTrigger value="new" className="flex-1">
                  {t('support.tabs.new')}
                  {tabCounts.new > 0 ? <span className="ml-1 text-xs">({tabCounts.new})</span> : null}
                </TabsTrigger>
                <TabsTrigger value="accepted" className="flex-1">
                  {t('support.tabs.accepted')}
                  {tabCounts.accepted > 0 ? (
                    <span className="ml-1 text-xs">({tabCounts.accepted})</span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="archive" className="flex-1">
                  {t('support.tabs.archive')}
                  {tabCounts.archive > 0 ? <span className="ml-1 text-xs">({tabCounts.archive})</span> : null}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              placeholder={t('support.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {isChatsLoading ? (
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : isChatsError ? (
              <div className="text-sm text-destructive">{t('common.error')}</div>
            ) : sortedChats.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('support.noChats')}</div>
            ) : (
              <ScrollArea className="h-[520px]">
                <div className="space-y-2 pr-3">
                  <div className="grid grid-cols-[minmax(0,1fr),220px,120px] gap-3 px-3 text-xs text-muted-foreground">
                    <div />
                    <div className="truncate">{t('support.columns.funnelStatus')}</div>
                    <div className="truncate">{t('support.columns.responseTime')}</div>
                  </div>

                  {sortedChats.map((chat) => {
                    const isActive = chat.chatId === selectedChatId
                    const title = chat.username
                      ? `@${chat.username}`
                      : [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId

                    const pinned = pinnedSet.has(chat.chatId)

                    const stageId = chatStageMap[chat.chatId] || primaryStageId
                    const stageLabel = funnelStages.find((s) => s.id === stageId)?.label

                    const inboundTs = chat.lastInboundAt ? new Date(chat.lastInboundAt).getTime() : 0
                    const outboundTs = chat.lastOutboundAt ? new Date(chat.lastOutboundAt).getTime() : 0
                    const waiting = inboundTs > 0 && inboundTs > outboundTs
                    const waitingSeconds = waiting ? Math.max(1, Math.floor((nowTs - inboundTs) / 1000)) : 0
                    const showAlert = waiting && waitingSeconds >= RESPONSE_LIMIT_SECONDS

                    const fallbackChar = (chat.username?.[0] || chat.firstName?.[0] || chat.telegramId?.[0] || '?')
                      .toUpperCase()

                    return (
                      <div key={chat.chatId} className="grid grid-cols-[minmax(0,1fr),220px,120px] gap-3 items-center">
                        <button
                          onClick={() => setSelectedChatId(chat.chatId)}
                          className={
                            'w-full text-left rounded-md border px-3 py-2 transition-colors ' +
                            (isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border'
                              : 'hover:bg-muted/50 border-border')
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative group">
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
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {chat.lastMessageText || ''}
                              </div>
                            </div>
                          </div>
                        </button>

                        <Select
                          value={stageId}
                          onValueChange={(v) => setChatStage(chat.chatId, v)}
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

                        <div className="text-sm text-muted-foreground">
                          <div className={"flex items-center gap-2 " + (showAlert ? 'text-destructive' : '')}>
                            {showAlert ? <Bell size={16} weight="fill" /> : null}
                            <span>{formatDuration(waiting ? waitingSeconds : 0)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>
                {selectedChat
                  ? `${t('support.chatWith')} ${selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramId}`
                  : t('support.selectChat')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedChatId ? (
              <div className="text-sm text-muted-foreground">{t('support.selectChatHint')}</div>
            ) : (
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
                                <img
                                  src={fileUrlCache[m.fileId]}
                                  alt="support-photo"
                                  className="max-h-[280px] w-auto rounded border border-border"
                                />
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
                    </div>
                  )}
                </ScrollArea>

                {selectedChat ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
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

                    <div className="flex items-center gap-2">
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
                      <Input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                        disabled={
                          Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                          Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                        }
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!selectedChatId || !photoFile) return
                          sendPhotoMutation.mutate({ chatId: selectedChatId, file: photoFile, caption: photoCaption.trim() || undefined })
                        }}
                        disabled={
                          !photoFile ||
                          sendPhotoMutation.isPending ||
                          Boolean(selectedChat?.status && String(selectedChat.status).toUpperCase() !== 'ACCEPTED') ||
                          Boolean(selectedChat?.acceptedBy && myUsername && selectedChat.acceptedBy !== myUsername)
                        }
                      >
                        {sendPhotoMutation.isPending ? t('support.sending') : t('support.sendPhoto')}
                      </Button>
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
            )}
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
                  <div className="text-sm">
                    {selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramId}
                  </div>

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
                        Boolean(
                          selectedChat.acceptedBy &&
                            myUsername &&
                            selectedChat.acceptedBy !== myUsername
                        )
                      }
                    >
                      {blockMutation.isPending ? t('support.processing') : t('support.block')}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">{t('support.requestInfo')}</div>
                  <Select
                    value={chatStageMap[selectedChat.chatId] || primaryStageId}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
