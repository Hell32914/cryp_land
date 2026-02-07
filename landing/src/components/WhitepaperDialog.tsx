import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function WhitepaperDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="cursor-pointer">Whitepaper</span>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">SYNTRIX BOT WHITEPAPER (ENG)</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
            <p className="text-sm">SyntrixBot is a next-generation trading algorithm bot, built on <strong>Smart Money Concepts (SMC)</strong>, liquidity analysis, order book analysis, and institutional risk management strategies. The bot guarantees <strong>stable profits without risks</strong>, eliminating the possibility of losing your deposit.</p>
            
            <p className="text-sm"><strong>SyntrixBot can also be used as a wallet with passive income:</strong></p>
            <ul className="text-sm">
              <li>Assets are <strong>never locked</strong>, fully accessible at any time</li>
              <li><strong>Withdrawal speed:</strong> processed by the bot in up to 3 seconds, plus network transaction time</li>
              <li><strong>Secure storage and transparency:</strong> blockchain-level verification of transactions</li>
            </ul>
            
            <p className="text-sm"><em>SyntrixBot combines <strong>bank-level reliability, scalper-level speed, and blockchain transparency</strong>.</em></p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">2. Problems in Traditional Trading</h2>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Traditional trading challenges:</h3>
            <ul className="text-sm">
              <li>Requires <strong>years of market experience</strong> to generate stable income</li>
              <li>Requires <strong>24/7 monitoring</strong> to avoid missed opportunities</li>
              <li><strong>Emotions</strong> often lead to poor decisions</li>
              <li>Mistakes can result in <strong>capital loss</strong></li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">SyntrixBot solutions:</h3>
            <ul className="text-sm">
              <li>Fully <strong>automated passive income</strong></li>
              <li>Strategies are <strong>backtested for 5–10 years</strong>, win-rate above 90%</li>
              <li>Strict <strong>risk management</strong>: maximum 1% risk per trade</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Example calculation:</h3>
            <ul className="text-sm">
              <li>Bot capital: <strong>$1,000,000</strong></li>
              <li>Risk per trade: <strong>$10,000 (1%)</strong></li>
              <li>Risk/Reward ratio: <strong>1:5</strong></li>
              <li>Maximum consecutive losses: <strong>2</strong></li>
              <li>Maximum consecutive wins: up to <strong>17</strong></li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">3. Security and Liquidity Pool</h2>
            <p className="text-sm">SyntrixBot provides investor protection through a <strong>three-level security system</strong>:</p>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">1. 50% of profits — client payouts</h3>
            <h3 className="text-lg font-semibold mt-4 mb-2">2. 25% of profits — liquidity reserve pool</h3>
            <h3 className="text-lg font-semibold mt-4 mb-2">3. 25% of profits — team and development</h3>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">4. Supported Currencies</h2>
            <ul className="text-sm">
              <li>Supports all major cryptocurrencies: <strong>USDT, USDC, ETH, Solana, Bitcoin</strong></li>
              <li>Withdrawals available only in USDT or USDC</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">5. Referral Program</h2>
            <ul className="text-sm">
              <li>Three-level program: <strong>4% / 3% / 2%</strong> from referral earnings</li>
              <li>Total passive income from three levels: <strong>9%</strong></li>
              <li>Referrals activate when they reach <strong>$1000 deposit</strong></li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">6. Pricing Plans</h2>
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Plan</th>
                    <th className="border border-border px-3 py-2 text-left">Deposit Range</th>
                    <th className="border border-border px-3 py-2 text-left">Daily Income</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-border px-3 py-2"><strong>Bronze</strong></td><td className="border border-border px-3 py-2">$50–$100</td><td className="border border-border px-3 py-2"><strong>0.30%</strong></td></tr>
                  <tr><td className="border border-border px-3 py-2"><strong>Silver</strong></td><td className="border border-border px-3 py-2">$100–$500</td><td className="border border-border px-3 py-2"><strong>0.50%</strong></td></tr>
                  <tr><td className="border border-border px-3 py-2"><strong>Gold</strong></td><td className="border border-border px-3 py-2">$500–$1000</td><td className="border border-border px-3 py-2"><strong>0.80%</strong></td></tr>
                  <tr><td className="border border-border px-3 py-2"><strong>Platinum</strong></td><td className="border border-border px-3 py-2">$1000–$5000</td><td className="border border-border px-3 py-2"><strong>1.00%</strong></td></tr>
                  <tr><td className="border border-border px-3 py-2"><strong>Diamond</strong></td><td className="border border-border px-3 py-2">$5000–$20000</td><td className="border border-border px-3 py-2"><strong>1.30%</strong></td></tr>
                  <tr><td className="border border-border px-3 py-2"><strong>Black</strong></td><td className="border border-border px-3 py-2">$20000+</td><td className="border border-border px-3 py-2"><strong>1.70%</strong></td></tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-sm mt-3"><em>Full whitepaper available in the bot.</em></p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
