import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { useApiQuery } from '@/hooks/use-api-query'
import {
  createSupportBroadcast,
  cancelSupportBroadcast,
  deleteSupportBroadcast,
  fetchSupportBroadcasts,
  fetchSupportChats,
  fetchDeposits,
  type SupportBroadcastRecord,
  type SupportChatRecord,
  type DepositRecord,
} from '@/lib/api'
import {
  getPrimaryStageId,
  loadSupportFunnelStages,
  type SupportFunnelStage,
} from '@/lib/support-funnel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Plus, ArrowSquareOut, Paperclip, X } from '@phosphor-icons/react'

type TargetKey = { kind: 'ALL' } | { kind: 'STAGE'; stageId: string }

const PENDING_DEPOSIT_STAGE_ID = '__deposit_processing__'

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

function formatWhen(ts: string | null | undefined) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

function shortText(text: string, max = 80) {
  const trimmed = (text || '').trim()
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max - 1) + '…'
}

function isPendingDeposit(deposit: DepositRecord) {
  const status = String(deposit.status || '').toUpperCase()
  const depStatus = String(deposit.depStatus || '').toLowerCase()
  return depStatus === 'processing' || status === 'PENDING' || status === 'PROCESSING'
}

export function SupportBroadcasts() {
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
  const [activeTab, setActiveTab] = useState<'new' | 'stats'>('new')
  const [target, setTarget] = useState<TargetKey>({ kind: 'ALL' })
  const [messageText, setMessageText] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setFunnelStages(loadSupportFunnelStages(defaultStages))
  }, [defaultStages])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const { data: chatsData } = useApiQuery<Awaited<ReturnType<typeof fetchSupportChats>>>(
    ['support-chats-broadcasts'],
    (authToken) => fetchSupportChats(authToken, undefined, 1, 10000),
    {
      enabled: Boolean(token),
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
    }
  )

  const { data: depositsData } = useApiQuery<Awaited<ReturnType<typeof fetchDeposits>>>(
    ['support-broadcasts-deposits'],
    (authToken) => fetchDeposits(authToken, { page: 1, limit: 1000 }),
    {
      enabled: Boolean(token),
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    }
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

  const acceptedChatsByMe = useMemo(() => {
    if (!myUsername) return [] as SupportChatRecord[]
    return chats.filter((c) => String(c.status || '').toUpperCase() === 'ACCEPTED' && c.acceptedBy === myUsername)
  }, [chats, myUsername])

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const st of funnelStages) map[st.id] = 0
    for (const chat of acceptedChatsByMe) {
      const stageId = chat.funnelStageId || getPrimaryStageId()
      map[stageId] = (map[stageId] || 0) + 1
    }
    return map
  }, [acceptedChatsByMe, funnelStages])

  const pendingDepositCount = useMemo(() => {
    if (!pendingDepositTelegramIds.size) return 0
    let count = 0
    for (const chat of acceptedChatsByMe) {
      if (pendingDepositTelegramIds.has(String(chat.telegramId))) count += 1
    }
    return count
  }, [acceptedChatsByMe, pendingDepositTelegramIds])

  const selectedCount = useMemo(() => {
    if (target.kind === 'ALL') return acceptedChatsByMe.length
    if (target.stageId === PENDING_DEPOSIT_STAGE_ID) return pendingDepositCount
    return stageCounts[target.stageId] || 0
  }, [acceptedChatsByMe.length, pendingDepositCount, stageCounts, target])

  const createMutation = useMutation({
    mutationFn: (payload: { target: 'ALL' | 'STAGE'; stageId?: string; text?: string; photoFile?: File | null }) =>
      createSupportBroadcast(token!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-broadcasts'] })
      toast.success(t('supportBroadcast.created'))
      setMessageText('')
      setPhotoFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setActiveTab('stats')
    },
    onError: (e: any) => toast.error(e?.message || t('supportBroadcast.createFailed')),
  })

  const { data: broadcastsData, isLoading: isBroadcastsLoading } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportBroadcasts>>
  >(['support-broadcasts'], (authToken) => fetchSupportBroadcasts(authToken), {
    enabled: Boolean(token),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelSupportBroadcast(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['support-broadcasts'] })
      toast.success(t('supportBroadcast.cancelled'))
    },
    onError: (e: any) => toast.error(e?.message || t('supportBroadcast.cancelFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSupportBroadcast(token!, id),
    onSuccess: async (resp) => {
      await queryClient.invalidateQueries({ queryKey: ['support-broadcasts'] })
      toast.success(
        t('supportBroadcast.deletedResult', {
          deleted: resp.deletedCount,
          failed: resp.deleteFailedCount,
          skipped: resp.skippedCount,
          total: resp.total,
        })
      )
    },
    onError: (e: any) => toast.error(e?.message || t('supportBroadcast.deleteFailed')),
  })

  const broadcastsMine = useMemo(() => {
    const all = broadcastsData?.broadcasts ?? []
    if (!myUsername) return all
    return all.filter((b) => b.adminUsername === myUsername)
  }, [broadcastsData?.broadcasts, myUsername])

  const send = () => {
    const text = messageText.trim()
    if (!text && !photoFile) return

    if (target.kind === 'ALL') {
      createMutation.mutate({ target: 'ALL', text, photoFile })
      return
    }

    createMutation.mutate({ target: 'STAGE', stageId: target.stageId, text, photoFile })
  }

  const segments = useMemo(() => {
    const base: Array<{ key: TargetKey; label: string; count: number }> = [
      { key: { kind: 'ALL' }, label: t('supportBroadcast.segments.all'), count: acceptedChatsByMe.length },
    ]

    const stageSegs = funnelStages.map((st) => ({
      key: { kind: 'STAGE', stageId: st.id } as TargetKey,
      label: st.label,
      count: stageCounts[st.id] || 0,
    }))

    const depositSeg = {
      key: { kind: 'STAGE', stageId: PENDING_DEPOSIT_STAGE_ID } as TargetKey,
      label: t('supportBoard.depositProcessing'),
      count: pendingDepositCount,
    }

    return [...base, ...stageSegs, depositSeg]
  }, [acceptedChatsByMe.length, funnelStages, pendingDepositCount, stageCounts, t])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t('supportBroadcast.title')}</h1>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => setActiveTab('new')}>
            <Plus size={18} />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setActiveTab('stats')}>
            <ArrowSquareOut size={18} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="new">{t('supportBroadcast.newMessage')}</TabsTrigger>
          <TabsTrigger value="stats">{t('supportBroadcast.statistics')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('supportBroadcast.segmentsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                <div className="p-2 space-y-1">
                  {segments.map((s, idx) => {
                    const isSelected =
                      (target.kind === 'ALL' && s.key.kind === 'ALL') ||
                      (target.kind === 'STAGE' && s.key.kind === 'STAGE' && s.key.stageId === target.stageId)

                    return (
                      <button
                        key={idx}
                        onClick={() => setTarget(s.key)}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                          isSelected
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <span className="truncate">{s.label}</span>
                        <Badge variant="secondary">{s.count}</Badge>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{t('supportBroadcast.composeTitle')}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {t('supportBroadcast.recipients')}: <span className="font-medium">{selectedCount}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('supportBroadcast.messagePlaceholder')}
                className="min-h-[240px]"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (!file) return
                  if (file.size > 10 * 1024 * 1024) {
                    toast.error(t('supportBroadcast.photoTooLarge'))
                    e.currentTarget.value = ''
                    return
                  }
                  setPhotoFile(file)
                }}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={18} />
                  <span className="ml-2">{t('supportBroadcast.attachPhoto')}</span>
                </Button>

                {photoFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                    {photoPreviewUrl ? (
                      <img
                        src={photoPreviewUrl}
                        alt="broadcast-preview"
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : null}
                    <div className="text-xs text-muted-foreground max-w-[180px] truncate">{photoFile.name}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setPhotoFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {t('supportBroadcast.noteCannotUndo')}
                </div>
                <Button
                  onClick={send}
                  disabled={!token || createMutation.isPending || (!messageText.trim() && !photoFile) || selectedCount === 0}
                >
                  {createMutation.isPending ? t('support.processing') : t('supportBroadcast.send')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('supportBroadcast.statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isBroadcastsLoading ? (
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : broadcastsMine.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('supportBroadcast.noBroadcasts')}</div>
            ) : (
              <div className="space-y-2">
                {broadcastsMine.map((b: SupportBroadcastRecord) => {
                  const canCancel = b.status === 'PENDING' || b.status === 'RUNNING'
                  const canDelete =
                    !canCancel &&
                    !b.deletedAt &&
                    (b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'FAILED')
                  const targetLabel =
                    b.target === 'ALL'
                      ? t('supportBroadcast.segments.all')
                      : b.stageId === PENDING_DEPOSIT_STAGE_ID
                        ? t('supportBoard.depositProcessing')
                        : funnelStages.find((s) => s.id === b.stageId)?.label || b.stageId || ''

                  return (
                    <div key={b.id} className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">#{b.id}</div>
                            <Badge variant="secondary">{b.status}</Badge>
                            <div className="text-xs text-muted-foreground">{formatWhen(b.createdAt)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {t('supportBroadcast.target')}: <span className="font-medium">{targetLabel}</span>
                          </div>
                          <div className="text-sm mt-2">
                            {b.text ? shortText(b.text) : (b.hasPhoto ? t('supportBroadcast.photoOnly') : '')}
                            {b.text && b.hasPhoto ? (
                              <span className="ml-2 text-xs text-muted-foreground">📷</span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {t('supportBroadcast.progress', {
                              sent: b.sentCount,
                              total: b.totalRecipients,
                              failed: b.failedCount,
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canCancel ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => cancelMutation.mutate(b.id)}
                              disabled={cancelMutation.isPending}
                            >
                              {t('supportBroadcast.cancel')}
                            </Button>
                          ) : null}

                          {canDelete ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const ok = window.confirm(t('supportBroadcast.deleteConfirm'))
                                if (!ok) return
                                deleteMutation.mutate(b.id)
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              {t('supportBroadcast.deleteForAll')}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
