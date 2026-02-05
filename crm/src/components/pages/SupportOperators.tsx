import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { decodeJwtClaims, normalizeCrmRole } from '@/lib/jwt'
import { useApiQuery } from '@/hooks/use-api-query'
import {
  createCrmOperator,
  deleteCrmOperator,
  fetchCrmOperators,
  resetCrmOperatorPassword,
  fetchOperatorPresence,
  setCrmOperatorRole,
  toggleCrmOperator,
  type CrmOperatorRecord,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SupportOperators() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const me = useMemo(() => {
    const claims = decodeJwtClaims(token)
    const role = normalizeCrmRole(claims.role)
    return { username: claims.username, role }
  }, [token])
  const canManageOperators = me.role === 'superadmin' || me.role === 'admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'support' | 'tester'>('admin')

  const [resetId, setResetId] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  const { data: presenceData } = useApiQuery<Awaited<ReturnType<typeof fetchOperatorPresence>>>(
    ['operator-presence'],
    (authToken) => fetchOperatorPresence(authToken),
    {
      enabled: Boolean(token),
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const presenceMap = useMemo(() => {
    const map: Record<string, { online: boolean }> = {}
    for (const entry of presenceData?.operators ?? []) {
      map[entry.username] = { online: entry.online }
    }
    return map
  }, [presenceData])

  const { data, isLoading, isError } = useApiQuery<Awaited<ReturnType<typeof fetchCrmOperators>>>(
    ['crm-operators'],
    (authToken) => fetchCrmOperators(authToken),
    {
      enabled: Boolean(token),
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  )

  const operators = useMemo(() => (data as any)?.operators ?? [], [data]) as CrmOperatorRecord[]

  const createMutation = useMutation({
    mutationFn: (payload: { username: string; password: string; role: 'admin' | 'support' | 'tester' }) => createCrmOperator(token!, payload),
    onSuccess: async () => {
      setUsername('')
      setPassword('')
      setNewRole('admin')
      await queryClient.invalidateQueries({ queryKey: ['crm-operators'] })
      toast.success(t('supportOperators.created'))
    },
    onError: (e: any) => toast.error(e?.message || t('supportOperators.createFailed')),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'admin' | 'support' | 'tester' }) => setCrmOperatorRole(token!, id, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['crm-operators'] })
      toast.success(t('supportOperators.updated'))
    },
    onError: (e: any) => toast.error(e?.message || t('supportOperators.updateFailed')),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleCrmOperator(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['crm-operators'] })
      toast.success(t('supportOperators.updated'))
    },
    onError: (e: any) => toast.error(e?.message || t('supportOperators.updateFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCrmOperator(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['crm-operators'] })
      toast.success(t('supportOperators.deleted'))
    },
    onError: (e: any) => toast.error(e?.message || t('supportOperators.deleteFailed')),
  })

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => resetCrmOperatorPassword(token!, id, password),
    onSuccess: async () => {
      setResetId(null)
      setResetPassword('')
      await queryClient.invalidateQueries({ queryKey: ['crm-operators'] })
      toast.success(t('supportOperators.passwordReset'))
    },
    onError: (e: any) => toast.error(e?.message || t('supportOperators.resetFailed')),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('supportOperators.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">{t('supportOperators.description')}</div>

          <div className="text-xs text-muted-foreground">
            {t('common.you')}: <span className="font-medium">{me.username || '—'}</span> · {t('common.role')}:{' '}
            <span className="font-medium">{me.role || '—'}</span>
            {!canManageOperators ? (
              <div className="mt-1 text-destructive">
                {t('supportOperators.superadminOnly')}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_220px_auto] gap-2 items-end">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('supportOperators.username')}</div>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="operator1" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('supportOperators.password')}</div>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('supportOperators.role')}</div>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="tester">Tester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                const u = username.trim()
                const p = password
                if (!u || !p) return
                createMutation.mutate({ username: u, password: p, role: newRole })
              }}
              disabled={!token || !canManageOperators || createMutation.isPending || !username.trim() || !password}
            >
              {createMutation.isPending ? t('support.processing') : t('supportOperators.add')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('supportOperators.list')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
          ) : isError ? (
            <div className="text-sm text-destructive">
              {t('common.error')}
              {!canManageOperators ? (
                <div className="mt-1 text-xs text-muted-foreground">{t('supportOperators.superadminOnlyHint')}</div>
              ) : null}
            </div>
          ) : operators.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('supportOperators.empty')}</div>
          ) : (
            <div className="space-y-2">
              {operators.map((op) => (
                <div key={op.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{op.username}</div>
                        <Badge variant={op.isActive ? 'secondary' : 'destructive'}>
                          {op.isActive ? t('supportOperators.active') : t('supportOperators.disabled')}
                        </Badge>
                        {(() => {
                          const presence = presenceMap[op.username]
                          const online = presence?.online ?? false
                          return (
                            <Badge
                              variant="outline"
                              className={online ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted/30 text-muted-foreground border-border'}
                            >
                              {online ? t('common.online') : t('common.offline')}
                            </Badge>
                          )
                        })()}
                        {op.role ? (
                          <Badge variant="outline">{String(op.role).toUpperCase()}</Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('supportOperators.createdAt')}: {new Date(op.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canManageOperators ? (
                        <Select
                          value={(op.role as any) || 'admin'}
                          onValueChange={(v) => roleMutation.mutate({ id: op.id, role: v as any })}
                        >
                          <SelectTrigger className="h-9 w-[140px]" disabled={roleMutation.isPending}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="tester">Tester</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : null}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMutation.mutate(op.id)}
                        disabled={toggleMutation.isPending}
                      >
                        {t('supportOperators.toggle')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResetId(op.id)
                          setResetPassword('')
                        }}
                      >
                        {t('supportOperators.reset')}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!confirm(t('supportOperators.deleteConfirm'))) return
                          deleteMutation.mutate(op.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        {t('supportOperators.delete')}
                      </Button>
                    </div>
                  </div>

                  {resetId === op.id ? (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">{t('supportOperators.newPassword')}</div>
                        <Input
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const p = resetPassword
                            if (!p) return
                            resetMutation.mutate({ id: op.id, password: p })
                          }}
                          disabled={resetMutation.isPending || !resetPassword}
                        >
                          {resetMutation.isPending ? t('support.processing') : t('supportOperators.save')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResetId(null)
                            setResetPassword('')
                          }}
                        >
                          {t('supportOperators.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
