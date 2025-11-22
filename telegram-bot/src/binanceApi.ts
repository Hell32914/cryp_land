import axios from 'axios'

// Popular trading pairs for card generation
const TRADING_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT',
  'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'ETCUSDT',
  'XLMUSDT', 'FILUSDT', 'APTUSDT', 'NEARUSDT', 'ICPUSDT',
  'ALGOUSDT', 'VETUSDT', 'FTMUSDT', 'AAVEUSDT', 'SHIBUSDT',
  'TONUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT', 'SUIUSDT'
]

export interface BinancePrice {
  symbol: string
  price: string
}

/**
 * Get current price for a trading pair from Binance
 */
export async function getBinancePrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get<BinancePrice>(
      `https://api.binance.com/api/v3/ticker/price`,
      { params: { symbol }, timeout: 5000 }
    )
    return parseFloat(response.data.price)
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error)
    return null
  }
}

/**
 * Get a random trading pair from the list
 */
export function getRandomTradingPair(): string {
  return TRADING_PAIRS[Math.floor(Math.random() * TRADING_PAIRS.length)]
}

/**
 * Format trading pair for display (BTCUSDT -> BTC/USDT)
 */
export function formatTradingPair(symbol: string): string {
  return symbol.replace('USDT', '/USDT')
}

/**
 * Generate random trading data for card
 */
export async function generateTradingData() {
  const pair = getRandomTradingPair()
  const isLong = Math.random() < 0.67 // 67% Long, 33% Short
  // Generate profit with decimal part (e.g., 407.23%)
  const profitInteger = Math.floor(Math.random() * (567 - 13 + 1)) + 13
  const profitDecimal = Math.floor(Math.random() * 100) // 0-99
  const profit = parseFloat(`${profitInteger}.${profitDecimal.toString().padStart(2, '0')}`)
  const leverage = Math.floor(Math.random() * (84 - 5 + 1)) + 5
  
  // Try to get real price from Binance
  let currentPrice = await getBinancePrice(pair)
  
  // If Binance API fails, generate a reasonable price based on the pair
  if (!currentPrice) {
    currentPrice = generateFallbackPrice(pair)
  }
  
  // Calculate entry price based on profit percentage
  let entryPrice: number
  let lastPrice: number
  
  if (isLong) {
    // For Long: lastPrice > entryPrice
    entryPrice = currentPrice / (1 + profit / 100)
    lastPrice = currentPrice
  } else {
    // For Short: entryPrice > lastPrice
    entryPrice = currentPrice
    lastPrice = currentPrice / (1 + profit / 100)
  }
  
  return {
    pair: formatTradingPair(pair),
    position: isLong ? 'Long' : 'Short',
    profit: profit,
    leverage: leverage,
    entryPrice: parseFloat(entryPrice.toFixed(getPriceDecimals(entryPrice))),
    lastPrice: parseFloat(lastPrice.toFixed(getPriceDecimals(lastPrice)))
  }
}

/**
 * Generate fallback price when Binance API is unavailable
 */
function generateFallbackPrice(symbol: string): number {
  const priceRanges: { [key: string]: [number, number] } = {
    'BTCUSDT': [40000, 70000],
    'ETHUSDT': [2000, 4000],
    'BNBUSDT': [300, 600],
    'SOLUSDT': [50, 150],
    'XRPUSDT': [0.4, 0.8],
    'ADAUSDT': [0.3, 0.7],
    'DOGEUSDT': [0.05, 0.15],
    'SHIBUSDT': [0.00001, 0.00003],
    'TONUSDT': [2, 6],
  }
  
  const range = priceRanges[symbol] || [1, 100]
  return Math.random() * (range[1] - range[0]) + range[0]
}

/**
 * Get appropriate decimal places for price display
 * Always returns minimum 2 decimals to show variety in prices (0-99 in last digits)
 */
function getPriceDecimals(price: number): number {
  if (price >= 1000) return 2  // e.g., 50000.37 instead of 50000
  if (price >= 100) return 2    // e.g., 482.15
  if (price >= 10) return 3     // e.g., 45.827
  if (price >= 1) return 4      // e.g., 5.4213
  if (price >= 0.1) return 4
  if (price >= 0.01) return 5
  if (price >= 0.001) return 6
  if (price >= 0.0001) return 7
  return 8 // For very small prices like SHIB
}
