import { useEffect, useMemo, useState } from 'react'
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

  const [items, setItems] = useState<AiAnalyticsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modelToColor = useMemo(() => {
    return {
      syntrix: 'hsl(var(--primary))',
      modelA: 'hsl(var(--accent))',
      modelB: 'hsl(var(--muted-foreground))',
      modelC: 'hsl(var(--foreground))',
      modelD: 'hsl(var(--muted-foreground))',
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

  const fetchAnalytics = async () => {
    if (!telegramUserId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/user/${telegramUserId}/ai-analytics`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          // Keep request minimal; server can ignore fields.
          locale: window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || 'en',
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Request failed')
      }

      const data = await res.json()
      const nextItems = Array.isArray(data?.items) ? (data.items as AiAnalyticsItem[]) : []
      setItems(nextItems)
    } catch (e: any) {
      setError(e?.message || strings.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Generate on first open.
    if (!items.length) {
      fetchAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  const charts = useMemo(() => {
    return items.map((item) => {
      const series = buildSeries(item.profitPct)
      return { item, series }
    })
  }, [items])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground font-bold">{strings.title}</h2>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
            {strings.simulated}
          </Badge>
        </div>
        <Button
          variant="ghost"
          className="text-foreground hover:text-accent"
          onClick={fetchAnalytics}
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
                    <div className="text-xs text-muted-foreground">
                      {item.signal} • {item.confidencePct}% • {item.profitPct >= 0 ? '+' : ''}{item.profitPct}%
                    </div>
                  </div>

                  <ChartContainer
                    className="h-[140px] w-full"
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
                        stroke="var(--color-p)"
                        strokeWidth={2}
                        dot={false}
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
              {items.map((item) => (
                <div key={`msg-${item.modelId}`} className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">{item.displayName || modelToLabel[item.modelId]}</div>
                    <div className="text-xs text-muted-foreground">{item.signal} • {item.confidencePct}%</div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{item.message}</p>
                </div>
              ))}

              {!items.length && (
                <div className="p-4 text-sm text-muted-foreground">
                  {loading ? strings.loading : error || strings.error}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {error && items.length ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : null}
    </div>
  )
}
