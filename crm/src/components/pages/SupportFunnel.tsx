import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash, ArrowUp, ArrowDown, Plus } from '@phosphor-icons/react'
import {
  ensurePrimaryStage,
  getPrimaryStageId,
  loadSupportFunnelStages,
  saveSupportFunnelStages,
  type SupportFunnelStage,
} from '@/lib/support-funnel'

function slugId(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || `stage-${Date.now()}`
}

export function SupportFunnel() {
  const { t } = useTranslation()

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

  const [stages, setStages] = useState<SupportFunnelStage[]>(() =>
    ensurePrimaryStage(defaultStages, t('support.funnel.primary'))
  )
  const [newStageName, setNewStageName] = useState('')

  useEffect(() => {
    setStages(loadSupportFunnelStages(defaultStages))
  }, [defaultStages])

  const persist = (next: SupportFunnelStage[]) => {
    const normalized = ensurePrimaryStage(next, t('support.funnel.primary'))
    setStages(normalized)
    saveSupportFunnelStages(normalized)
  }

  const move = (index: number, dir: -1 | 1) => {
    const nextIndex = index + dir
    if (nextIndex < 0 || nextIndex >= stages.length) return
    // Do not move primary stage away from the top.
    if (stages[index].id === getPrimaryStageId() || stages[nextIndex].id === getPrimaryStageId()) return

    const next = [...stages]
    const tmp = next[index]
    next[index] = next[nextIndex]
    next[nextIndex] = tmp
    persist(next)
  }

  const updateLabel = (id: string, label: string) => {
    if (id === getPrimaryStageId()) return
    persist(stages.map((s) => (s.id === id ? { ...s, label } : s)))
  }

  const remove = (id: string) => {
    if (id === getPrimaryStageId()) return
    persist(stages.filter((s) => s.id !== id))
  }

  const add = () => {
    const name = newStageName.trim()
    if (!name) return
    const id = slugId(name)
    if (stages.some((s) => s.id === id)) {
      persist([...stages, { id: `${id}-${Date.now()}`, label: name }])
    } else {
      persist([...stages, { id, label: name }])
    }
    setNewStageName('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('support.funnel.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('support.funnel.subtitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">{t('support.funnel.hint')}</div>

          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                <div className="flex-1">
                  <Input
                    value={stage.label}
                    onChange={(e) => updateLabel(stage.id, e.target.value)}
                    disabled={stage.id === getPrimaryStageId()}
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => move(idx, -1)}
                  disabled={stage.id === getPrimaryStageId()}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => move(idx, 1)}
                  disabled={stage.id === getPrimaryStageId()}
                >
                  <ArrowDown size={16} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(stage.id)}
                  disabled={stage.id === getPrimaryStageId()}
                >
                  <Trash size={16} />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder={t('support.funnel.newPlaceholder')}
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
            />
            <Button onClick={add} disabled={!newStageName.trim()}>
              <Plus size={16} className="mr-2" />
              {t('support.funnel.add')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
