import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApiQuery } from '@/hooks/use-api-query'
import { useAuth } from '@/lib/auth'
import {
  fetchSupportChats,
  fetchSupportMessages,
  markSupportChatRead,
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
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function Support() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')

  const { data: chatsData, isLoading: isChatsLoading, isError: isChatsError } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportChats>>
  >(
    ['support-chats', search],
    (authToken) => fetchSupportChats(authToken, search),
    { enabled: Boolean(token) }
  )

  const chats = chatsData?.chats ?? []

  const selectedChat: SupportChatRecord | null = useMemo(() => {
    if (!selectedChatId) return null
    return chats.find((c) => c.chatId === selectedChatId) ?? null
  }, [chats, selectedChatId])

  const { data: messagesData, isLoading: isMessagesLoading } = useApiQuery<
    Awaited<ReturnType<typeof fetchSupportMessages>>
  >(
    ['support-messages', selectedChatId],
    (authToken) => fetchSupportMessages(authToken, selectedChatId!),
    { enabled: Boolean(token && selectedChatId) }
  )

  const messages: SupportMessageRecord[] = messagesData?.messages ?? []

  const markReadMutation = useMutation({
    mutationFn: (chatId: string) => markSupportChatRead(token!, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-chats'] })
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

  useEffect(() => {
    if (!selectedChatId) return
    const chat = chats.find((c) => c.chatId === selectedChatId)
    if (chat && chat.unreadCount > 0) {
      markReadMutation.mutate(selectedChatId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId])

  const handleSend = () => {
    if (!selectedChatId) return
    const trimmed = messageText.trim()
    if (!trimmed) return
    sendMessageMutation.mutate({ chatId: selectedChatId, text: trimmed })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('support.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('support.chats')}</CardTitle>
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
            ) : chats.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('support.noChats')}</div>
            ) : (
              <ScrollArea className="h-[520px]">
                <div className="space-y-2 pr-3">
                  {chats.map((chat) => {
                    const isActive = chat.chatId === selectedChatId
                    const title = chat.username
                      ? `@${chat.username}`
                      : [chat.firstName, chat.lastName].filter(Boolean).join(' ') || chat.telegramId

                    return (
                      <button
                        key={chat.chatId}
                        onClick={() => setSelectedChatId(chat.chatId)}
                        className={
                          'w-full text-left rounded-md border px-3 py-2 transition-colors ' +
                          (isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border'
                            : 'hover:bg-muted/50 border-border')
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium truncate">{title}</div>
                          {chat.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground">{chat.unreadCount}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {chat.lastMessageText || ''}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {t('support.telegramId')}: {chat.telegramId}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedChat
                ? `${t('support.chatWith')} ${selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramId}`
                : t('support.selectChat')}
            </CardTitle>
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
                          <div className="whitespace-pre-wrap break-words">{m.text}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {m.direction === 'OUT' ? t('support.admin') : t('support.user')} •{' '}
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="space-y-2">
                  <Textarea
                    placeholder={t('support.writeMessage')}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? t('support.sending') : t('support.send')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
