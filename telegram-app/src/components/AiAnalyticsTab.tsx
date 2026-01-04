import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

type AiModelId = 'syntrix' | 'modelA' | 'modelB' | 'modelC' | 'modelD'

type AiAnalyticsItem = {
  modelId: AiModelId
  displayName: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidencePct: number
  profitPct: number
  message: string
}

type Props = {
  telegramUserId: string
  authToken: string | null
  getAuthHeaders: () => Record<string, string>
  apiUrl?: string
  strings: {
    title: string
    simulated: string
    update: string
    loading: string
    error: string
  }
}

type ChartPoint = { t: number; p: number }

type CombinedChartPoint = { t: number } & Partial<Record<AiModelId, number>>

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const buildSeries = (targetProfitPct: number): ChartPoint[] => {
  const points = 28
  const end = clamp(targetProfitPct, -25, 50)

  const data: ChartPoint[] = []
  let value = 0

  for (let i = 0; i < points; i++) {
    // Smooth-ish random walk that converges to `end`.
    const remaining = points - 1 - i
    const desiredStep = remaining > 0 ? (end - value) / remaining : 0
    const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.15
    value = value + desiredStep + jitter
    data.push({ t: i + 1, p: Number(value.toFixed(2)) })
  }

  return data
}

export function AiAnalyticsTab({ telegramUserId, authToken, getAuthHeaders, apiUrl, strings }: Props) {
  const API_URL = apiUrl || (import.meta.env.VITE_API_URL || 'https://api.syntrix.website')

  // 2 updates per hour
  const UPDATE_INTERVAL_MS = 30 * 60_000

  const [itemsById, setItemsById] = useState<Partial<Record<AiModelId, AiAnalyticsItem>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timersRef = useRef<Partial<Record<AiModelId, number>>>({})

  const modelToColor = useMemo(() => {
    return {
      syntrix: 'var(--primary)',
      modelA: 'var(--accent)',
      modelB: 'var(--secondary)',
      modelC: 'var(--foreground)',
      modelD: 'var(--muted-foreground)',
    } satisfies Record<AiModelId, string>
  }, [])

  const modelToLabel = useMemo(() => {
    const map: Record<AiModelId, string> = {
      syntrix: 'Syntrix AI',
      modelA: 'DEEPSEEK CHAT V3.1',
      modelB: 'CLAUDE SONNET 4.5',
      modelC: 'QWEN3 MAX',
      modelD: 'GEMINI 2.5 PRO',
    }
    return map
  }, [])

  const models: AiModelId[] = useMemo(() => ['syntrix', 'modelA', 'modelB', 'modelC', 'modelD'], [])

  const fetchAnalyticsModel = async (modelId: AiModelId) => {
    if (!telegramUserId) return

    try {
      const res = await fetch(`${API_URL}/api/user/${telegramUserId}/ai-analytics`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          locale: window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || 'en',
          modelId,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Request failed')
      }

      const data = await res.json()
      const nextItems = Array.isArray(data?.items) ? (data.items as AiAnalyticsItem[]) : []
      const item = nextItems.find((i) => i?.modelId === modelId) || nextItems[0]
      if (item) {
        setItemsById((prev) => ({ ...prev, [modelId]: item }))
      }
    } catch (e: any) {
      setError(e?.message || strings.error)
    }
  }

  const scheduleModelUpdates = (modelId: AiModelId) => {
    // Update exactly 2 times per hour (every 30 minutes)
    const remainder = Date.now() % UPDATE_INTERVAL_MS
    const delay = remainder === 0 ? UPDATE_INTERVAL_MS : UPDATE_INTERVAL_MS - remainder

    const existing = timersRef.current[modelId]
    if (existing) {
      window.clearTimeout(existing)
    }

    timersRef.current[modelId] = window.setTimeout(async () => {
      await fetchAnalyticsModel(modelId)
      scheduleModelUpdates(modelId)
    }, delay)
  }

  const fetchAllNow = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all(models.map((m) => fetchAnalyticsModel(m)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load
    fetchAllNow()

    // Start independent schedules
    models.forEach((m) => scheduleModelUpdates(m))

    return () => {
      const timers = timersRef.current
      Object.values(timers).forEach((id) => {
        if (id) window.clearTimeout(id)
      })
      timersRef.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  const orderedItems = useMemo(() => {
    return models
      .map((m) => itemsById[m])
      .filter(Boolean) as AiAnalyticsItem[]
  }, [itemsById, models])

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    models.forEach((modelId) => {
      config[modelId] = {
        label: modelToLabel[modelId],
        color: modelToColor[modelId],
      }
    })
    return config
  }, [models, modelToColor, modelToLabel])

  const combinedSeries = useMemo((): CombinedChartPoint[] => {
    const points = 28
    const seriesById: Partial<Record<AiModelId, ChartPoint[]>> = {}

    models.forEach((modelId) => {
      const item = itemsById[modelId]
      if (item) {
        seriesById[modelId] = buildSeries(item.profitPct)
      }
    })

    const data: CombinedChartPoint[] = []
    for (let i = 0; i < points; i++) {
      const row: CombinedChartPoint = { t: i + 1 }
      models.forEach((modelId) => {
        const series = seriesById[modelId]
        row[modelId] = series ? series[i]?.p : undefined
      })
      data.push(row)
    }
    return data
  }, [itemsById, models])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-bold">{strings.title}</h2>
        </div>
        <Button
          variant="ghost"
          className="text-foreground hover:text-accent"
          onClick={fetchAllNow}
          disabled={loading}
        >
          {strings.update}
        </Button>
      </div>

      <div className="h-[calc(100vh-220px)] grid grid-rows-2 gap-4">
        <div className="min-h-0 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
          <div className="h-full p-3 space-y-3">
            {orderedItems.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {orderedItems.map((item) => (
                  <div key={`legend-${item.modelId}`} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: modelToColor[item.modelId] }}
                      />
                      <span className="text-xs font-semibold text-foreground truncate">{item.displayName || modelToLabel[item.modelId]}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary shrink-0">
                      {item.profitPct >= 0 ? '+' : ''}{item.profitPct}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                {loading ? strings.loading : error || strings.error}
              </div>
            )}

            <ChartContainer
              className="h-[220px] w-full aspect-auto"
              config={chartConfig}
            >
              <LineChart data={combinedSeries} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                {models.map((modelId) => (
                  <Line
                    key={modelId}
                    type="monotone"
                    dataKey={modelId}
                    stroke={modelToColor[modelId]}
                    strokeWidth={3}
                    strokeLinecap="round"
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        <div className="min-h-0 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
          <ScrollArea className="h-full p-3">
            <div className="space-y-3">
              {orderedItems.map((item) => (
                <div key={`msg-${item.modelId}`} className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">{item.displayName || modelToLabel[item.modelId]}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-border/50 bg-background/50 text-muted-foreground">
                        {item.signal}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.confidencePct}%</span>
                      <span className="text-xs text-primary">
                        {item.profitPct >= 0 ? '+' : ''}{item.profitPct}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{item.message}</p>
                </div>
              ))}

              {!orderedItems.length && (
                <div className="p-4 text-sm text-muted-foreground">
                  {loading ? strings.loading : error || strings.error}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {error && orderedItems.length ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : null}
    </div>
  )
}
