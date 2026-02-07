import { motion } from "framer-motion"

export function Whitepaper() {
  return (
    <section id="whitepaper" className="py-20 lg:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="prose prose-invert max-w-none"
        >
          <h1 className="text-4xl font-bold mb-2">SYNTRIX BOT WHITEPAPER (ENG)</h1>
          
          <h1 className="text-3xl font-bold mt-12 mb-6">SyntrixBot WhitePaper</h1>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>SyntrixBot is a next-generation trading algorithm bot, built on <strong>Smart Money Concepts (SMC)</strong>, liquidity analysis, order book analysis, and institutional risk management strategies. The bot guarantees <strong>stable profits without risks</strong>, eliminating the possibility of losing your deposit.</p>
          
          <p><strong>SyntrixBot can also be used as a wallet with passive income:</strong></p>
          <ul>
            <li>Assets are <strong>never locked</strong>, fully accessible at any time</li>
            <li><strong>Withdrawal speed:</strong> processed by the bot in up to 3 seconds, plus network transaction time</li>
            <li><strong>Secure storage and transparency:</strong> blockchain-level verification of transactions</li>
          </ul>
          
          <p><em>SyntrixBot combines <strong>bank-level reliability, scalper-level speed, and blockchain transparency</strong>.</em></p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Problems in Traditional Trading</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Traditional trading challenges:</h3>
          <ul>
            <li>Requires <strong>years of market experience</strong> to generate stable income</li>
            <li>Requires <strong>24/7 monitoring</strong> to avoid missed opportunities</li>
            <li><strong>Emotions</strong> often lead to poor decisions</li>
            <li>Mistakes can result in <strong>capital loss</strong></li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">SyntrixBot solutions:</h3>
          <ul>
            <li>Fully <strong>automated passive income</strong></li>
            <li>Strategies are <strong>backtested for 5–10 years</strong>, win-rate above 90%</li>
            <li>Strict <strong>risk management</strong>: maximum 1% risk per trade</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Example calculation:</h3>
          <ul>
            <li>Bot capital: <strong>$1,000,000</strong></li>
            <li>Risk per trade: <strong>$10,000 (1%)</strong></li>
            <li>Risk/Reward ratio: <strong>1:5</strong></li>
            <li>A $10,000 loss is covered by the next profitable trade of $50,000</li>
            <li>Maximum consecutive losses: <strong>2</strong></li>
            <li>Maximum consecutive wins: up to <strong>17</strong></li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Trading specifics:</h3>
          <ul>
            <li>Trades only cryptocurrency pairs</li>
            <li>Trade duration: 30–60 minutes</li>
            <li>Trades per day: 17–30</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Security and Liquidity Pool</h2>
          <p>SyntrixBot provides investor protection through a <strong>three-level security system</strong>:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">1. 50% of profits — client payouts</h3>
          <ul>
            <li>Half of daily profits are distributed to investors</li>
            <li>Investors receive their guaranteed percentage regardless of individual trade outcomes</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2. 25% of profits — liquidity reserve pool</h3>
          <ul>
            <li>Funds stored in an <strong>encrypted wallet</strong>, inaccessible to the team</li>
            <li>Current reserve pool exceeds investments: <strong>$53M vs $48M</strong></li>
            <li>Covers all obligations to investors in case of unforeseen events</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3. 25% of profits — team and development</h3>
          <ul>
            <li>25% of net profit after all investor payouts is retained</li>
            <li>Funds are allocated to:
              <ul>
                <li>Salaries and dividends</li>
                <li>Bot development and ecosystem growth</li>
              </ul>
            </li>
            <li>Creates a <strong>win-win scenario</strong> for both investors and the team</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Who Developed SyntrixBot</h2>
          <p>SyntrixBot is developed by a team of <strong>40+ specialists</strong>, including developers, cybersecurity experts, and support staff. The core leadership consists of former employees of major market-making firms and crypto exchanges such as <strong>Binance, OKX, and MEX</strong>.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Market makers are professionals managing exchange liquidity:</h3>
          <ul>
            <li>Create and balance orders to match supply and demand</li>
            <li>Maintain order book depth and trading stability</li>
            <li>Develop internal protocols and ensure platform security</li>
          </ul>
          
          <p>SyntrixBot leverages <strong>5–10 years of experience</strong> in trading, IT, and cybersecurity. The compact team (~50 people) includes C-level experts who built the infrastructure for major exchanges.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Registration and Jurisdiction</h2>
          <p>SyntrixBot is registered in Dubai as <strong>SyntrixBot Algo Systems LLC</strong>.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Reasons for Dubai registration:</h3>
          <ul>
            <li>Zero taxation for cryptocurrency businesses</li>
            <li>High security and legal stability</li>
          </ul>
          
          <p>Approximately <strong>80% of the team</strong> is based in Dubai, the rest work remotely worldwide.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Operating Period and Open Beta</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Closed beta</h3>
          <p>6 years, generating stable profits for the team and private partners</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Open beta</h3>
          <p>9+ months, allowing ordinary users with small capital to participate and earn</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Supported Currencies</h2>
          <ul>
            <li>Supports all major cryptocurrencies: <strong>USDT, USDC, ETH, Solana, Bitcoin</strong></li>
            <li>Deposits are automatically converted to USDT for internal trading</li>
            <li>Profit is credited in stablecoins, protecting against market volatility</li>
            <li>Withdrawals available only in USDT or USDC</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Withdrawal Processing Time</h2>
          <p><strong>Bot processing:</strong> 3 seconds</p>
          <p><strong>Network time:</strong></p>
          <ul>
            <li>USDT BEP20 — up to 20 seconds</li>
            <li>Ethereum — slightly longer</li>
          </ul>
          <p><strong>Total withdrawal: under 1 minute</strong></p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Risk of Losing Funds</h2>
          <ul>
            <li>Maximum risk per trade: <strong>1% of deposit</strong></li>
            <li>25% of profits retained in liquidity reserve to protect against "black swan" events</li>
            <li>Client funds are encrypted and inaccessible to the team</li>
            <li>Multi-layered security implemented by experts from Binance and other exchanges</li>
            <li>Even during consecutive losing trades, investor capital is protected</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Liquidity Reserve Pool</h2>
          <ul>
            <li>25% of profits are set aside daily</li>
            <li>Pool exceeds current investments: <strong>$53M vs $48M</strong></li>
            <li>Ensures instant payouts to clients even under adverse conditions</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Trading Strategies</h2>
          <p><strong>SyntrixBot uses:</strong></p>
          <ul>
            <li>Smart Money Concepts (SMC)</li>
            <li>ICT strategies</li>
            <li>Liquidity and order book analysis</li>
            <li>Elliott Wave analysis</li>
            <li>Combined technical analysis</li>
          </ul>
          <p>Strategies are continuously monitored, improved, or excluded if performance drops.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Trade Frequency and Win Rate</h2>
          <p><strong>Trade duration:</strong> 30–60 minutes</p>
          <p><strong>Average trades:</strong> ~1 per hour</p>
          <p><strong>Win rate:</strong> 90%+</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Risk of Consecutive Losses</h2>
          <ul>
            <li>Maximum consecutive losses: <strong>2 stop-losses</strong></li>
            <li>After 3 consecutive losing trades, bot halts trading and reviews strategies</li>
            <li>Liquidity reserve ensures clients still receive profits even during short-term drawdowns</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Market Volatility</h2>
          <ul>
            <li>Volatility accelerates trades and increases profitability</li>
            <li>Crypto markets are ideal for scalping and short-term trades</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">15. Using SyntrixBot as a Wallet</h2>
          <ul>
            <li>Deposit and withdrawal: <strong>under 1 minute</strong></li>
            <li>Funds available at any time</li>
            <li>Passive daily income according to chosen plan</li>
            <li>Full security and accessibility of assets</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">16. Risk Per Trade</h2>
          <p><strong>Risk Management:</strong></p>
          <ul>
            <li>Always 1% risk per trade</li>
            <li>Minimum Risk/Reward: 1:5</li>
          </ul>
          <p><strong>Profit Potential:</strong></p>
          <ul>
            <li>Potential profit per trade: 5–17%</li>
            <li>Win rate: 90%+</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">17. Referral Program</h2>
          <ul>
            <li>Three-level program: <strong>4% / 3% / 2%</strong> from referral earnings</li>
            <li>Total passive income from three levels: <strong>9%</strong></li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">18. Pricing Plans</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-2">Plan</th>
                  <th className="border border-border px-4 py-2">Deposit Range</th>
                  <th className="border border-border px-4 py-2">Daily Income</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-border px-4 py-2"><strong>Bronze</strong></td><td className="border border-border px-4 py-2">$10–$100</td><td className="border border-border px-4 py-2"><strong>0.30%</strong></td></tr>
                <tr><td className="border border-border px-4 py-2"><strong>Silver</strong></td><td className="border border-border px-4 py-2">$100–$500</td><td className="border border-border px-4 py-2"><strong>0.50%</strong></td></tr>
                <tr><td className="border border-border px-4 py-2"><strong>Gold</strong></td><td className="border border-border px-4 py-2">$500–$1000</td><td className="border border-border px-4 py-2"><strong>0.80%</strong></td></tr>
                <tr><td className="border border-border px-4 py-2"><strong>Platinum</strong></td><td className="border border-border px-4 py-2">$1000–$5000</td><td className="border border-border px-4 py-2"><strong>1.00%</strong></td></tr>
                <tr><td className="border border-border px-4 py-2"><strong>Diamond</strong></td><td className="border border-border px-4 py-2">$5000–$20000</td><td className="border border-border px-4 py-2"><strong>1.30%</strong></td></tr>
                <tr><td className="border border-border px-4 py-2"><strong>Black</strong></td><td className="border border-border px-4 py-2">$20000+</td><td className="border border-border px-4 py-2"><strong>1.70%</strong></td></tr>
              </tbody>
            </table>
          </div>
          
          <p className="mt-4"><strong>Custom plans:</strong> deposits &gt; $35,000 (13–17%+ daily profit)</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">19. Additional Questions</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">General Information:</h3>
          <ul>
            <li><strong>Closing a deposit:</strong> Investor can withdraw all funds; deposit closes; bot stops generating profit</li>
            <li><strong>Fees:</strong> Only network transaction fees apply</li>
            <li><strong>Exchanges:</strong> Binance and Bybit, trades via bot API; connecting personal API is prohibited</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Security system:</h3>
          <ul>
            <li>Encryption on Telegram and server side</li>
            <li>Examples: <strong>AES-256, RSA-4096, SHA-512</strong> hashing</li>
            <li>DDoS protection, global backup servers, multi-level authentication</li>
            <li>Bot failure: Liquidity reserve automatically returns all investments and profits</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Legal &amp; Compliance:</h3>
          <ul>
            <li><strong>License:</strong> SyntrixBot Algo Systems LLC, Dubai; licensed for algorithmic crypto trading bots</li>
            <li><strong>Not a financial pyramid:</strong> Fully transparent transactions, guaranteed percentages, trackable trades</li>
            <li><strong>Difference from staking and mining:</strong> Funds are never locked, passive income, no mining or electricity fees</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Telegram security:</h3>
          <ol>
            <li>Enable 2FA</li>
            <li>Use a registered SIM card</li>
            <li>Set secret question/answer during registration — allows account recovery if phone/SIM is lost</li>
          </ol>
        </motion.div>
      </div>
    </section>
  )
}
