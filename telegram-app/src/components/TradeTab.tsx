type TradeTabProps = {
  title?: string
}

export function TradeTab({ title }: TradeTabProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title || 'Trade'}</h2>
      <p className="text-muted-foreground mt-2">
        This section is enabled by an admin and is currently in setup.
      </p>
    </div>
  )
}
