import { Card, CardContent } from "@/components/ui/card"
import { CurrencyBtc, CurrencyEth, Coin, ShieldCheck, ArrowsLeftRight, Crown } from "@phosphor-icons/react"

export function SupportedAssets() {
  const assets = [
    { icon: CurrencyBtc, name: 'BTC', color: '#F7931A' },
    { icon: CurrencyEth, name: 'ETH', color: '#627EEA' },
    { icon: Coin, name: 'USDT', color: '#26A17B' },
    { icon: Coin, name: 'BNB', color: '#F3BA2F' },
  ]

  const features = [
    {
      icon: Coin,
      title: 'Top 100 Cryptocurrencies',
      description: 'Trade the most popular and liquid cryptocurrencies on the market'
    },
    {
      icon: ArrowsLeftRight,
      title: 'Auto Convert',
      description: 'Automatically convert between currencies for optimal trading'
    },
    {
      icon: ShieldCheck,
      title: 'Stable Withdrawals',
      description: 'Secure and fast withdrawals to your wallet anytime'
    },
    {
      icon: Crown,
      title: 'VIP Mode',
      description: 'Exclusive features and priority support for premium members'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Supported Assets
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trade with confidence across multiple cryptocurrencies
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {assets.map((asset) => (
            <Card key={asset.name} className="hover:shadow-lg transition-all">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <asset.icon 
                  size={48} 
                  weight="fill" 
                  style={{ color: asset.color }}
                  className="mb-3"
                />
                <span className="font-semibold text-lg">{asset.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <feature.icon size={32} weight="duotone" className="mb-4 text-primary" />
                <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
