import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiQuery } from '@/hooks/use-api-query'
import { useAuth } from '@/lib/auth'
import { fetchSupportChats, acceptSupportChat, type SupportChatRecord } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPrimaryStageId,
  loadSupportChatStageMap,
  loadSupportFunnelStages,
  saveSupportChatStageMap,
  type SupportFunnelStage,
} from '@/lib/support-funnel'

type ColumnId = 'unaccepted' | string

type DragPayload = {
  chatId: string
  from: ColumnId
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

export function SupportFunnelBoard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()

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

  useEffect(() => {
    setFunnelStages(loadSupportFunnelStages(defaultStages))
    setChatStageMap(loadSupportChatStageMap())
  }, [defaultStages])

  const primaryStageId = funnelStages.find((s) => s.id === getPrimaryStageId())?.id || getPrimaryStageId()

  const { data: chatsData, isLoading: isChatsLoading, isError: isChatsError } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportChats>>
  >(['support-chats-board'], (authToken) => fetchSupportChats(authToken), {
    enabled: Boolean(token),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  const chats = chatsData?.chats ?? []

  const acceptMutation = useMutation({
    mutationFn: (chatId: string) => acceptSupportChat(token!, chatId),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['support-chats'] })
      await queryClient.invalidateQueries({ queryKey: ['support-chats-board'] })
      // Default stage after accept.
      setStage(updated.chatId, primaryStageId)
      toast.success(t('support.accepted'))
    },
    onError: (e: any) => toast.error(e?.message || t('support.acceptFailed')),
  })

  const setStage = (chatId: string, stageId: string) => {
    setChatStageMap((prev) => {
      const next = { ...prev, [chatId]: stageId }
      saveSupportChatStageMap(next)
      return next
    })
  }

  const getColumnIdForChat = (chat: SupportChatRecord): ColumnId => {
    const status = String(chat.status || '').toUpperCase()
    if (status === 'ARCHIVE') return 'archived'
    if (status !== 'ACCEPTED') return 'unaccepted'
    return chatStageMap[chat.chatId] || primaryStageId
  }

  const columns = useMemo(() => {
    const base = [{ id: 'unaccepted', title: t('supportBoard.unaccepted') } as const]
    const stageColumns = funnelStages.map((s) => ({ id: s.id, title: s.label }))
    return [...base, ...stageColumns]
  }, [funnelStages, t])

  const columnChats = useMemo(() => {
    const map: Record<string, SupportChatRecord[]> = {}
    for (const col of columns) map[col.id] = []

    for (const chat of chats) {
      const status = String(chat.status || '').toUpperCase()
      if (status === 'ARCHIVE') continue

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
  }, [chats, columns, chatStageMap, primaryStageId])

  const handleDrop = async (payload: DragPayload, to: ColumnId) => {
    if (!payload?.chatId) return
    if (to === 'unaccepted') return

    const chat = chats.find((c) => c.chatId === payload.chatId)
    if (!chat) return

    const status = String(chat.status || '').toUpperCase()

    // Dragging from unaccepted into a funnel stage implicitly accepts.
    if (status !== 'ACCEPTED') {
      acceptMutation.mutate(payload.chatId)
      setStage(payload.chatId, to)
      return
    }

    setStage(payload.chatId, to)
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

      <div className="flex gap-4 overflow-x-auto pb-2">
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

                    return (
                      <div
                        key={chat.chatId}
                        draggable
                        onDragStart={(e) => {
                          const payload: DragPayload = { chatId: chat.chatId, from: getColumnIdForChat(chat) }
                          e.dataTransfer.setData('application/json', JSON.stringify(payload))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className="rounded-md border border-border bg-background p-3 shadow-sm hover:bg-muted/30 cursor-grab active:cursor-grabbing"
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
