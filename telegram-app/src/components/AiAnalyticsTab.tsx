import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
    howItWorks: string
    howItWorksTitle: string
    howItWorksIntro: string
    howItWorksParallelTitle: string
    howItWorksModels: string[]
    howItWorksHypothesesTitle: string
    howItWorksHypotheses: string[]
    howItWorksCompetitionTitle: string
    howItWorksCompetitionIntro: string
    howItWorksCompetitionBullets: string[]
    howItWorksCompetitionOutro: string
    howItWorksMetaTitle: string
    howItWorksMetaIntro: string
    howItWorksMetaBullets: string[]
    howItWorksMetaOutro: string
    howItWorksExecutionTitle: string
    howItWorksExecutionIntro: string
    howItWorksExecutionBullets: string[]
    howItWorksCta: string
    loading: string
    error: string
  }
}

type ChartPoint = { t: number; p: number }

type CombinedChartPoint = { t: number } & Partial<Record<AiModelId, number>>

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const buildSeries = (targetProfitPct: number, modelId: AiModelId): ChartPoint[] => {
  const points = 28
  const end = modelId === 'syntrix' ? clamp(targetProfitPct, 0, 50) : clamp(targetProfitPct, -25, 50)

  const data: ChartPoint[] = []
  let value = 0

  for (let i = 0; i < points; i++) {
    // Smooth-ish random walk that converges to `end`.
    const remaining = points - 1 - i
    const desiredStep = remaining > 0 ? (end - value) / remaining : 0
    const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.15
    value = value + desiredStep + jitter
    if (modelId === 'syntrix') value = Math.max(0, value)
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

  const updateTimerRef = useRef<number | null>(null)

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

  const fetchAnalyticsAll = async () => {
    if (!telegramUserId) return

    try {
      const res = await fetch(`${API_URL}/api/user/${telegramUserId}/ai-analytics`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          locale: window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || 'en',
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Request failed')
      }

      const data = await res.json()
      const nextItems = Array.isArray(data?.items) ? (data.items as AiAnalyticsItem[]) : []
      if (!nextItems.length) {
        throw new Error(strings.error)
      }

      setItemsById(() => {
        const next: Partial<Record<AiModelId, AiAnalyticsItem>> = {}
        nextItems.forEach((item) => {
          if (item?.modelId) next[item.modelId] = item
        })
        return next
      })
    } catch (e: any) {
      setError(e?.message || strings.error)
    }
  }

  const scheduleAllUpdates = () => {
    // Update exactly 2 times per hour (every 30 minutes)
    const remainder = Date.now() % UPDATE_INTERVAL_MS
    const delay = remainder === 0 ? UPDATE_INTERVAL_MS : UPDATE_INTERVAL_MS - remainder

    if (updateTimerRef.current) {
      window.clearTimeout(updateTimerRef.current)
    }

    updateTimerRef.current = window.setTimeout(async () => {
      await fetchAnalyticsAll()
      scheduleAllUpdates()
    }, delay)
  }

  const fetchAllNow = async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchAnalyticsAll()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load
    fetchAllNow()

    // Start schedule (single request for all models)
    scheduleAllUpdates()

    return () => {
      if (updateTimerRef.current) {
        window.clearTimeout(updateTimerRef.current)
      }
      updateTimerRef.current = null
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
        seriesById[modelId] = buildSeries(item.profitPct, modelId)
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

  const yDomain = useMemo((): [number, number] => {
    // Dynamic scaling so small % changes don't look flat.
    // Always include a small negative area to keep the "minus" region visible.
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY

    for (const row of combinedSeries) {
      for (const modelId of models) {
        const v = row[modelId]
        if (typeof v === 'number' && Number.isFinite(v)) {
          if (v < min) min = v
          if (v > max) max = v
        }
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return [-5, 15]
    }

    const range = Math.max(0.01, max - min)
    const pad = Math.max(0.8, range * 0.15)

    let lower = Math.min(min - pad, -5)
    let upper = Math.max(max + pad, 5)

    // Keep within sensible global bounds used by the demo generator.
    lower = clamp(lower, -25, 50)
    upper = clamp(upper, -25, 50)

    if (upper - lower < 6) {
      // Ensure some visual vertical space.
      const mid = (upper + lower) / 2
      lower = clamp(mid - 3, -25, 50)
      upper = clamp(mid + 3, -25, 50)
    }

    if (lower >= upper) {
      return [-5, 15]
    }

    return [Number(lower.toFixed(2)), Number(upper.toFixed(2))]
  }, [combinedSeries, models])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-bold">{strings.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
              >
                {strings.howItWorks}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] max-w-[520px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-primary">{strings.howItWorksTitle}</DialogTitle>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh] pr-3">
                <div className="space-y-4 pt-2">
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{strings.howItWorksIntro}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
                      <p className="text-sm font-bold text-accent mb-2">{strings.howItWorksParallelTitle}</p>
                      <ul className="space-y-2 text-sm text-foreground/90">
                        {strings.howItWorksModels.map((m) => (
                          <li key={m} className="flex items-start gap-2">
                            <span className="text-accent mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="text-sm font-semibold text-foreground mt-4">{strings.howItWorksHypothesesTitle}</p>
                      <ul className="space-y-2 text-sm text-foreground/90 mt-2">
                        {strings.howItWorksHypotheses.map((b) => (
                          <li key={b} className="flex items-start gap-2">
                            <span className="text-accent mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                      <p className="text-sm font-bold text-foreground mb-2">{strings.howItWorksCompetitionTitle}</p>
                      <p className="text-sm text-foreground/90">{strings.howItWorksCompetitionIntro}</p>
                      <ul className="space-y-2 text-sm text-foreground/90 mt-3">
                        {strings.howItWorksCompetitionBullets.map((b) => (
                          <li key={b} className="flex items-start gap-2">
                            <span className="text-foreground/80 mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-muted-foreground mt-3">{strings.howItWorksCompetitionOutro}</p>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <p className="text-sm font-bold text-primary mb-2">{strings.howItWorksMetaTitle}</p>
                      <p className="text-sm text-foreground/90">{strings.howItWorksMetaIntro}</p>
                      <ul className="space-y-2 text-sm text-foreground/90 mt-3">
                        {strings.howItWorksMetaBullets.map((b) => (
                          <li key={b} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-foreground/90 mt-3">{strings.howItWorksMetaOutro}</p>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <p className="text-sm font-bold text-foreground mb-2">{strings.howItWorksExecutionTitle}</p>
                      <p className="text-sm text-foreground/90">{strings.howItWorksExecutionIntro}</p>
                      <ul className="space-y-2 text-sm text-foreground/90 mt-3">
                        {strings.howItWorksExecutionBullets.map((b) => (
                          <li key={b} className="flex items-start gap-2">
                            <span className="text-foreground/80 mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <DialogClose asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3" type="button">
                      {strings.howItWorksCta}
                    </Button>
                  </DialogClose>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            className="text-foreground hover:text-accent"
            onClick={fetchAllNow}
            disabled={loading}
          >
            {strings.update}
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-220px)] flex flex-col gap-4">
        <div className="h-[300px] bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
          <div className="h-full p-3 flex flex-col gap-3">
            {orderedItems.length ? (
              <div className="max-h-[120px] overflow-auto pr-1">
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
                        {item.modelId === 'syntrix' ? '+' : item.profitPct >= 0 ? '+' : ''}
                        {item.modelId === 'syntrix' ? Math.max(0, item.profitPct) : item.profitPct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                {loading ? strings.loading : error || strings.error}
              </div>
            )}

            <ChartContainer
              className="flex-1 min-h-[160px] w-full aspect-auto"
              config={chartConfig}
            >
              <LineChart data={combinedSeries} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis hide domain={yDomain} />
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

        <div className="min-h-0 flex-1 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
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
