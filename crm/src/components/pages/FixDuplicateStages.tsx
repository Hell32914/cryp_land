import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, RefreshCw } from '@phosphor-icons/react'
import {
  findDuplicateStages,
  fixDuplicateStages,
  reportDuplicateStages,
  type DuplicateStageInfo,
} from '@/lib/fix-duplicate-stages'
import { getPrimaryStageId, type SupportFunnelStage } from '@/lib/support-funnel'

export function FixDuplicateStages() {
  const { t } = useTranslation()
  
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

  const [duplicates, setDuplicates] = useState<DuplicateStageInfo[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [isFixed, setIsFixed] = useState(false)
  const [fixMessage, setFixMessage] = useState('')

  const checkForDuplicates = () => {
    setIsChecking(true)
    setIsFixed(false)
    setFixMessage('')
    
    // Небольшая задержка для UI эффекта
    setTimeout(() => {
      const found = findDuplicateStages(defaultStages)
      setDuplicates(found)
      setIsChecking(false)
    }, 300)
  }

  const handleFix = () => {
    const result = fixDuplicateStages(defaultStages)
    
    if (result.fixed) {
      setIsFixed(true)
      setFixMessage(result.message)
      setDuplicates([])
      
      // Перезагружаем страницу через 2 секунды, чтобы применить изменения
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      setFixMessage(result.message)
    }
  }

  const report = useMemo(() => {
    if (duplicates.length === 0) return null
    return reportDuplicateStages(defaultStages)
  }, [duplicates, defaultStages])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">
          Исправление дублирующихся колонок воронки
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Диагностика дублей</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Эта утилита находит и объединяет дублирующиеся колонки воронки. 
            Если после обновления у вас появились колонки с одинаковыми названиями, 
            эта утилита объединит чаты из этих колонок и удалит дубликаты.
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={checkForDuplicates} 
              disabled={isChecking}
              variant="outline"
            >
              {isChecking ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Проверить на дубли
                </>
              )}
            </Button>

            {duplicates.length > 0 && !isFixed && (
              <Button onClick={handleFix} variant="destructive">
                <AlertCircle size={16} className="mr-2" />
                Исправить дубликаты ({duplicates.length})
              </Button>
            )}
          </div>

          {isFixed && (
            <div className="rounded-lg border border-green-500 bg-green-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    Дубликаты успешно исправлены!
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {fixMessage}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Страница будет перезагружена через 2 секунды...
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isFixed && duplicates.length === 0 && !isChecking && fixMessage && (
            <div className="rounded-lg border border-blue-500 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  {fixMessage}
                </div>
              </div>
            </div>
          )}

          {!isFixed && duplicates.length > 0 && report && (
            <div className="rounded-lg border border-orange-500 bg-orange-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="font-semibold text-orange-700 dark:text-orange-400">
                    Найдены дублирующиеся колонки!
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                    {report}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {!isFixed && duplicates.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold">Подробная информация:</div>
              {duplicates.map((dup, idx) => (
                <div key={idx} className="rounded-lg border p-4 space-y-2">
                  <div className="font-semibold">
                    📋 {dup.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Канонический ID: <code className="bg-muted px-1 py-0.5 rounded">{dup.canonicalId}</code></div>
                    <div>Дублирующиеся ID: {dup.duplicateIds.map(id => (
                      <code key={id} className="bg-muted px-1 py-0.5 rounded mr-1">{id}</code>
                    ))}</div>
                    <div>Затронуто чатов: {dup.affectedChatIds.length}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Как это работает</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <strong>1. Поиск дублей:</strong> Система ищет колонки с одинаковыми нормализованными ID. 
            Например, "Deposit" и "deposit-123" будут считаться дублями, если их канонический ID совпадает.
          </div>
          <div>
            <strong>2. Объединение чатов:</strong> Все чаты из дублирующихся колонок автоматически 
            переносятся в одну колонку с каноническим ID.
          </div>
          <div>
            <strong>3. Удаление дублей:</strong> Дублирующиеся колонки удаляются из списка, 
            остается только одна колонка с каноническим ID.
          </div>
          <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-3">
            <strong>⚠️ Внимание:</strong> Это действие необратимо. Перед исправлением рекомендуется 
            сделать резервную копию данных localStorage (экспорт в настройках воронки).
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
