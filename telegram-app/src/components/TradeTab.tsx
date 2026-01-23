import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type ExchangeIconProps = {
  name: string
  src: string
  fallbackText: string
  selected?: boolean
}

function ExchangeIcon({ name, src, fallbackText, selected }: ExchangeIconProps) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <span
        aria-hidden="true"
        className={
          'inline-flex h-7 w-7 items-center justify-center rounded-md overflow-hidden ' +
          (selected ? 'bg-primary/15' : 'bg-muted')
        }
      >
        <img
          src={src}
          alt={`${name} logo`}
          className="h-5 w-5 object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={
        'inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold ' +
        (selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')
      }
    >
      {fallbackText}
    </span>
  )
}

type TradeTabProps = {
  title?: string
}

export function TradeTab({ title }: TradeTabProps) {
  const exchanges = useMemo(
    () => [
      { id: 'binance', name: 'Binance', iconText: 'B', iconSrc: '/logo_trade/binance.jpg?v=20260123' },
      { id: 'bybit', name: 'Bybit', iconText: 'BY', iconSrc: '/logo_trade/bybit.jpg?v=20260123' },
      { id: 'okx', name: 'OKX', iconText: 'OKX', iconSrc: '/logo_trade/okx.jpg?v=20260123' },
      { id: 'coinbase', name: 'Coinbase', iconText: 'C', iconSrc: '/logo_trade/coinbase.jpg?v=20260123' },
      { id: 'kraken', name: 'Kraken', iconText: 'K', iconSrc: '/logo_trade/kraken.jpg?v=20260123' },
      { id: 'kucoin', name: 'KuCoin', iconText: 'KU', iconSrc: '/logo_trade/kucoin.jpg?v=20260123' },
      { id: 'bitget', name: 'Bitget', iconText: 'BG', iconSrc: '/logo_trade/bitget.jpg?v=20260123' },
      { id: 'gate', name: 'Gate.io', iconText: 'G', iconSrc: '/logo_trade/gateio.jpg?v=20260123' },
      { id: 'mexc', name: 'MEXC', iconText: 'MX', iconSrc: '/logo_trade/mexc.jpg?v=20260123' },
      { id: 'htx', name: 'HTX (Huobi)', iconText: 'HTX', iconSrc: '/logo_trade/htx.jpg?v=20260123' },
    ],
    []
  )

  const [selectedExchangeId, setSelectedExchangeId] = useState<string>(() => {
    const saved = localStorage.getItem('trade_selectedExchangeId')
    return saved ?? exchanges[0]?.id ?? 'binance'
  })

  const selectedExchange = exchanges.find((e) => e.id === selectedExchangeId)

  const assets = useMemo(
    () => [
      'BTC',
      'ETH',
      'USDT',
      'BNB',
      'SOL',
      'USDC',
      'XRP',
      'ADA',
      'AVAX',
      'DOGE',
      'DOT',
      'MATIC',
      'LTC',
      'TRX',
      'LINK',
      'SHIB',
      'DAI',
      'UNI',
      'WBTC',
      'BCH',
    ],
    []
  )

  const [selectedAssets, setSelectedAssets] = useState<string[]>(() => {
    const saved = localStorage.getItem('trade_selectedAssets')
    return saved ? JSON.parse(saved) : ['BTC', 'ETH', 'USDT']
  })

  const toggleAsset = (symbol: string) => {
    setSelectedAssets((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol)
      return [...prev, symbol]
    })
  }

  const priceCheckOptions = useMemo(
    () => [
      { id: '60s', label: '1x per minute', intervalMs: 60_000, note: 'Standard', paid: false },
      { id: '30s', label: '1x per 30 seconds', intervalMs: 30_000, note: 'Arbitrage', paid: true },
      { id: '10s', label: '1x per 10 seconds', intervalMs: 10_000, note: 'Advanced', paid: true },
      { id: '5s', label: '1x per 5 seconds', intervalMs: 5_000, note: 'Pro', paid: true },
      { id: '1s', label: '1x per 1 second', intervalMs: 1_000, note: 'Ultra', paid: true },
      { id: '0_5s', label: '1x per 0.5 seconds', intervalMs: 500, note: 'Max', paid: true },
    ],
    []
  )

  const [selectedPriceCheckId, setSelectedPriceCheckId] = useState<string>(() => {
    const saved = localStorage.getItem('trade_selectedPriceCheckId')
    return saved ?? '60s'
  })
  const selectedPriceCheck = priceCheckOptions.find((o) => o.id === selectedPriceCheckId)

  // Removed deposit section

  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>(() => {
    const saved = localStorage.getItem('trade_riskProfile')
    return (saved as 'conservative' | 'moderate' | 'aggressive') ?? 'moderate'
  })
  const riskProfiles = useMemo(
    () => [
      {
        id: 'conservative' as const,
        title: 'Conservative',
        spread: '0.5–1%',
        desc: 'Only large spreads',
      },
      {
        id: 'moderate' as const,
        title: 'Moderate',
        spread: '0.3–0.5%',
        desc: 'Balanced spread threshold',
      },
      {
        id: 'aggressive' as const,
        title: 'Aggressive',
        spread: '0.1–0.3%',
        desc: 'Low spreads, higher risk',
      },
    ],
    []
  )

  const [arbitrageType, setArbitrageType] = useState<'direct' | 'direct_triangular' | 'triangular_fast'>(() => {
    const saved = localStorage.getItem('trade_arbitrageType')
    return (saved as 'direct' | 'direct_triangular' | 'triangular_fast') ?? 'direct_triangular'
  })
  const arbitrageTypes = useMemo(
    () => [
      {
        id: 'direct' as const,
        title: 'Direct arbitrage',
        desc: 'Only direct arbitrage with large spread',
      },
      {
        id: 'direct_triangular' as const,
        title: 'Direct + Triangular',
        desc: 'Direct + triangular with normal spread',
      },
      {
        id: 'triangular_fast' as const,
        title: 'Triangular + frequent trades',
        desc: 'Triangular + small spread, frequent trades',
      },
    ],
    []
  )

  const [botRunning, setBotRunning] = useState(false)

  const canStart =
    selectedAssets.length > 0 &&
    Boolean(selectedExchangeId) &&
    Boolean(selectedPriceCheckId) &&
    Boolean(riskProfile) &&
    Boolean(arbitrageType)

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('trade_selectedExchangeId', selectedExchangeId)
  }, [selectedExchangeId])

  useEffect(() => {
    localStorage.setItem('trade_selectedAssets', JSON.stringify(selectedAssets))
  }, [selectedAssets])

  useEffect(() => {
    localStorage.setItem('trade_selectedPriceCheckId', selectedPriceCheckId)
  }, [selectedPriceCheckId])

  useEffect(() => {
    localStorage.setItem('trade_riskProfile', riskProfile)
  }, [riskProfile])

  useEffect(() => {
    localStorage.setItem('trade_arbitrageType', arbitrageType)
  }, [arbitrageType])

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title || 'Trade'}</h2>
        <p className="text-muted-foreground mt-2">
          This section is enabled by an admin and is currently in setup.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Exchange</div>
            <div className="text-xs text-muted-foreground mt-1">Choose the exchange for trade setup</div>
          </div>
          <div className="text-xs text-muted-foreground">Selected: {selectedExchange?.name ?? '—'}</div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {exchanges.map((exchange) => {
            const isSelected = exchange.id === selectedExchangeId
            return (
              <button
                key={exchange.id}
                type="button"
                onClick={() => setSelectedExchangeId(exchange.id)}
                className={
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ' +
                  (isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border/50 bg-background/30 hover:bg-background/50')
                }
              >
                <ExchangeIcon
                  name={exchange.name}
                  src={(exchange as any).iconSrc}
                  fallbackText={exchange.iconText}
                  selected={isSelected}
                />
                <span className="text-sm">{exchange.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Assets</div>
            <div className="text-xs text-muted-foreground mt-1">Select assets to include</div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Selected ({selectedAssets.length}): {selectedAssets.length ? selectedAssets.join(', ') : '—'}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {assets.map((symbol) => {
            const isSelected = selectedAssets.includes(symbol)
            return (
              <button
                key={symbol}
                type="button"
                onClick={() => toggleAsset(symbol)}
                className={
                  'rounded-full border px-3 py-1.5 text-sm transition-colors ' +
                  (isSelected
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border/50 bg-background/30 text-muted-foreground hover:bg-background/50 hover:text-foreground')
                }
              >
                {symbol}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Price check frequency</div>
            <div className="text-xs text-muted-foreground mt-1">
              More frequent checks = more data points for analysis. Faster options can be monetized.
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Selected: {selectedPriceCheck?.label ?? '—'}
            {selectedPriceCheck?.note ? ` (${selectedPriceCheck.note})` : ''}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {priceCheckOptions.map((opt) => {
            const isSelected = opt.id === selectedPriceCheckId
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedPriceCheckId(opt.id)}
                className={
                  'rounded-lg border px-3 py-2 text-left transition-colors ' +
                  (isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border/50 bg-background/30 hover:bg-background/50')
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div
                    className={
                      'text-[10px] rounded-full px-2 py-0.5 border ' +
                      (opt.paid
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200')
                    }
                  >
                    {opt.paid ? 'PAID' : 'FREE'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{opt.note}</div>
              </button>
            )
          })}
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Tip: Very fast intervals (1s / 0.5s) increase traffic and battery usage.
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Risk profile</div>
            <div className="text-xs text-muted-foreground mt-1">
              Smaller spread = higher risk (less cushion for fees and fast price moves).
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Selected: {riskProfiles.find((p) => p.id === riskProfile)?.title}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {riskProfiles.map((p) => {
            const isSelected = p.id === riskProfile
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setRiskProfile(p.id)}
                className={
                  'rounded-lg border px-3 py-2 text-left transition-colors ' +
                  (isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border/50 bg-background/30 hover:bg-background/50')
                }
              >
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-1">Spread: {p.spread}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Arbitrage type</div>
            <div className="text-xs text-muted-foreground mt-1">Choose the arbitrage execution mode.</div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Selected: {arbitrageTypes.find((t) => t.id === arbitrageType)?.title}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {arbitrageTypes.map((t) => {
            const isSelected = t.id === arbitrageType
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setArbitrageType(t.id)}
                className={
                  'rounded-lg border px-3 py-2 text-left transition-colors ' +
                  (isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border/50 bg-background/30 hover:bg-background/50')
                }
              >
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Bot control</div>
            <div className="text-xs text-muted-foreground mt-1">
              Status: {botRunning ? 'Running' : 'Stopped'}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={!canStart || botRunning} onClick={() => setBotRunning(true)}>
              Start
            </Button>
            <Button type="button" variant="destructive" disabled={!botRunning} onClick={() => setBotRunning(false)}>
              Disable
            </Button>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Config: {selectedExchange?.name ?? '—'} • {selectedAssets.length || 0} assets • {selectedPriceCheck?.label ?? '—'}
        </div>
      </div>
    </div>
  )
}
