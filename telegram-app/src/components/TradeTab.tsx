import { useMemo, useState } from 'react'

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
      { id: 'binance', name: 'Binance', iconText: 'B', iconSrc: '/logo_trade/binance.jpg' },
      { id: 'bybit', name: 'Bybit', iconText: 'BY', iconSrc: '/logo_trade/bybit.jpg' },
      { id: 'okx', name: 'OKX', iconText: 'OKX', iconSrc: '/logo_trade/okx.jpg' },
      { id: 'coinbase', name: 'Coinbase', iconText: 'C', iconSrc: '/logo_trade/coinbase.jpg' },
      { id: 'kraken', name: 'Kraken', iconText: 'K', iconSrc: '/logo_trade/kraken.jpg' },
      { id: 'kucoin', name: 'KuCoin', iconText: 'KU', iconSrc: '/logo_trade/kucoin.jpg' },
      { id: 'bitget', name: 'Bitget', iconText: 'BG', iconSrc: '/logo_trade/bitget.jpg' },
      { id: 'gate', name: 'Gate.io', iconText: 'G', iconSrc: '/logo_trade/gateio.jpg' },
      { id: 'mexc', name: 'MEXC', iconText: 'MX', iconSrc: '/logo_trade/mexc.jpg' },
      { id: 'htx', name: 'HTX (Huobi)', iconText: 'HTX', iconSrc: '/logo_trade/htx.jpg' },
    ],
    []
  )

  const [selectedExchangeId, setSelectedExchangeId] = useState<string>(exchanges[0]?.id ?? 'binance')

  const selectedExchange = exchanges.find((e) => e.id === selectedExchangeId)

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
    </div>
  )
}
