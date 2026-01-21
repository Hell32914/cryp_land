import { useMemo, useState } from 'react'

type TradeTabProps = {
  title?: string
}

export function TradeTab({ title }: TradeTabProps) {
  const exchanges = useMemo(
    () => [
      { id: 'binance', name: 'Binance', iconText: 'B' },
      { id: 'bybit', name: 'Bybit', iconText: 'BY' },
      { id: 'okx', name: 'OKX', iconText: 'OKX' },
      { id: 'coinbase', name: 'Coinbase', iconText: 'C' },
      { id: 'kraken', name: 'Kraken', iconText: 'K' },
      { id: 'kucoin', name: 'KuCoin', iconText: 'KU' },
      { id: 'bitget', name: 'Bitget', iconText: 'BG' },
      { id: 'gate', name: 'Gate.io', iconText: 'G' },
      { id: 'mexc', name: 'MEXC', iconText: 'MX' },
      { id: 'htx', name: 'HTX (Huobi)', iconText: 'HTX' },
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
                <span
                  aria-hidden="true"
                  className={
                    'inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold ' +
                    (isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')
                  }
                >
                  {exchange.iconText}
                </span>
                <span className="text-sm">{exchange.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
