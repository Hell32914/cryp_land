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

  const [itemsById, setItemsById] = useState<Partial<Record<AiModelId, AiAnalyticsItem>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timersRef = useRef<Partial<Record<AiModelId, number>>>({})

  const modelToColor = useMemo(() => {
    return {
      syntrix: 'var(--primary)',
      modelA: 'var(--accent)',
      modelB: 'var(--muted-foreground)',
      modelC: 'var(--foreground)',
      modelD: 'var(--muted-foreground)',
    } satisfies Record<AiModelId, string>
  }, [])

  const modelToLabel = useMemo(() => {
    const map: Record<AiModelId, string> = {
      syntrix: 'Syntrix AI',
      modelA: 'Model A',
      modelB: 'Model B',
      modelC: 'Model C',
      modelD: 'Model D',
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

  const randomMs = (minMs: number, maxMs: number) => Math.floor(minMs + Math.random() * (maxMs - minMs + 1))

  const scheduleModelUpdates = (modelId: AiModelId) => {
    // Independent schedules: each model updates a different number of times per day.
    // (min/max in minutes)
    const ranges: Record<AiModelId, { min: number; max: number }> = {
      syntrix: { min: 25, max: 90 },
      modelA: { min: 45, max: 180 },
      modelB: { min: 60, max: 240 },
      modelC: { min: 90, max: 360 },
      modelD: { min: 55, max: 300 },
    }

    const { min, max } = ranges[modelId]
    const delay = randomMs(min * 60_000, max * 60_000)

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

  const charts = useMemo(() => {
    return orderedItems.map((item) => {
      const series = buildSeries(item.profitPct)
      return { item, series }
    })
  }, [orderedItems])

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
          <ScrollArea className="h-full p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {charts.map(({ item, series }) => (
                <div key={item.modelId} className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-foreground">{item.displayName || modelToLabel[item.modelId]}</div>
                    <div className="text-sm font-semibold text-primary">
                      {item.profitPct >= 0 ? '+' : ''}{item.profitPct}%
                    </div>
                  </div>

                  <ChartContainer
                    className="h-[140px] w-full aspect-auto"
                    config={{
                      p: { label: 'P/L', color: modelToColor[item.modelId] },
                    }}
                  >
                    <LineChart data={series} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="t" hide />
                      <YAxis dataKey="p" hide domain={['dataMin', 'dataMax']} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Line
                        type="monotone"
                        dataKey="p"
                        stroke={modelToColor[item.modelId]}
                        strokeWidth={3}
                        strokeLinecap="round"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              ))}

              {!charts.length && (
                <div className="col-span-full p-4 text-sm text-muted-foreground">
                  {loading ? strings.loading : error || strings.error}
                </div>
              )}
            </div>
          </ScrollArea>
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
