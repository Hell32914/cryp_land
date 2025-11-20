import { createCanvas, loadImage as canvasLoadImage, CanvasRenderingContext2D, Image, registerFont } from 'canvas'
import QRCode from 'qrcode'
import { PrismaClient } from '@prisma/client'
import { generateTradingData } from './binanceApi.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

// Register Arial font with Cyrillic support from project fonts folder
try {
  const fontPath = path.join(__dirname, '..', 'fonts', 'arial.ttf')
  registerFont(fontPath, { family: 'Arial' })
} catch (error) {
  console.warn('Failed to register Arial font, using default:', error)
}

interface TradingCardData {
  botName: string
  botInitial: string
  avatarBackground: string
  avatarTextColor: string
  referralCode: string
  pair: string
  position: 'Long' | 'Short'
  profit: number
  leverage: number
  entryPrice: number
  lastPrice: number
  orderNumber: number
  timestamp: Date
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

/**
 * Generate a trading card image
 */
export async function generateTradingCard(data?: Partial<TradingCardData>): Promise<Buffer> {
  // Get or generate trading data
  let cardData: TradingCardData
  
  if (data) {
    const botName = data.botName || 'SyntrixBot'
    cardData = {
      botName,
      botInitial: data.botInitial || botName.charAt(0).toUpperCase() || 'S',
      avatarBackground: data.avatarBackground || '#F0B90B',
      avatarTextColor: data.avatarTextColor || '#0B0B0B',
      referralCode: data.referralCode || botName,
      pair: data.pair || 'BTC/USDT',
      position: (data.position || 'Long') as 'Long' | 'Short',
      profit: data.profit || 100,
      leverage: data.leverage || 10,
      entryPrice: data.entryPrice || 50000,
      lastPrice: data.lastPrice || 55000,
      orderNumber: data.orderNumber || await getNextOrderNumber(),
      timestamp: data.timestamp || new Date()
    }
  } else {
    const generatedData = await generateTradingData()
    cardData = {
      botName: 'SyntrixBot',
      botInitial: 'S',
      avatarBackground: '#F0B90B',
      avatarTextColor: '#0B0B0B',
      referralCode: 'SyntrixBot',
      ...generatedData,
      position: generatedData.position as 'Long' | 'Short',
      orderNumber: await getNextOrderNumber(),
      timestamp: new Date()
    }
  }
  
  // Save to database
  await prisma.tradingPost.create({
    data: {
      orderNumber: cardData.orderNumber,
      pair: cardData.pair,
      position: cardData.position,
      profit: cardData.profit,
      leverage: cardData.leverage,
      entryPrice: cardData.entryPrice,
      lastPrice: cardData.lastPrice,
      postedAt: cardData.timestamp
    }
  })
  
  // Create canvas (matching reference dimensions)
  const width = 768
  const height = 1024
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  // Draw background
  await drawBackground(ctx, width, height)
  
  const layout = {
    marginLeft: 47,
    avatarY: 75,
    pairY: 315,
    positionY: 383,
    profitY: 465,
    priceBlockY: 620,
    footerY: 900
  }
  
  // Draw header
  drawHeader(ctx, cardData, layout)
  
  // Draw pair name
  drawPairName(ctx, cardData.pair, layout, width)
  
  // Draw position and leverage
  drawPositionBadge(ctx, cardData.position, cardData.leverage, layout)
  
  // Draw profit
  drawProfit(ctx, cardData.profit, layout, width)
  
  // Draw prices
  drawPrices(ctx, cardData.entryPrice, cardData.lastPrice, layout)
  
  // Draw footer with QR code
  await drawFooter(ctx, width, cardData.referralCode, layout)
  
  return canvas.toBuffer('image/png')
}

/**
 * Get next order number (incremental)
 */
async function getNextOrderNumber(): Promise<number> {
  const lastPost = await prisma.tradingPost.findFirst({
    orderBy: { orderNumber: 'desc' }
  })
  
  return lastPost ? lastPost.orderNumber + 1 : 5295
}

/**
 * Load and draw background image
 */
async function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    // Load the original background image
    const backgroundPath = path.join(__dirname, '..', 'card_logo3.png')
    const background = await canvasLoadImage(backgroundPath)
    ctx.drawImage(background, 0, 0, width, height)
  } catch (error) {
    // Fallback to black background if image not found
    console.warn('Background image not found, using fallback:', error)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)
    
    // Draw basic geometric pattern as fallback
    const squares = [
      { x: width - 200, y: -100, size: 500, opacity: 0.15 },
      { x: width - 450, y: -50, size: 450, opacity: 0.12 },
      { x: width - 150, y: 200, size: 350, opacity: 0.08 }
    ]

    squares.forEach(square => {
      ctx.save()
      ctx.translate(square.x, square.y)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = `rgba(255, 255, 255, ${square.opacity})`
      ctx.fillRect(0, 0, square.size, square.size)
      ctx.restore()
    })
  }
}

/**
 * Draw header with avatar and bot info
 */
function drawHeader(ctx: CanvasRenderingContext2D, data: TradingCardData, layout: any) {
  // Background image already has avatar and SyntrixBot name
  // Draw timestamp below the SyntrixBot name
  ctx.fillStyle = '#ffffff'
  ctx.font = '28px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const timestamp = data.timestamp.toISOString().replace('T', ' ').substring(0, 19)
  ctx.fillText(timestamp, 127, 95)
}

/**
 * Draw trading pair name (centered)
 */
function drawPairName(ctx: CanvasRenderingContext2D, pair: string, layout: any, width: number) {
  // Draw pair name without slash
  const pairWithoutSlash = pair.replace('/', '')
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 40px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`${pairWithoutSlash} Perpetual`, layout.marginLeft, layout.pairY)
}

/**
 * Draw position badge (Long/Short + leverage)
 */
function drawPositionBadge(ctx: CanvasRenderingContext2D, position: string, leverage: number, layout: any) {
  const x = layout.marginLeft
  const y = layout.positionY
  const isLong = position === 'Long'
  const accentColor = isLong ? '#0ecb81' : '#f6465d'

  ctx.font = 'bold 26px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = accentColor
  const posText = position
  const textWidth = ctx.measureText(posText).width
  ctx.fillText(posText, x, y)

  ctx.fillStyle = '#666666'
  ctx.fillText('|', x + textWidth + 12, y)

  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${leverage}x`, x + textWidth + 32, y)
}

/**
 * Draw profit percentage (centered, large)
 */
function drawProfit(ctx: CanvasRenderingContext2D, profit: number, layout: any, width: number) {
  const formattedProfit = `${profit >= 0 ? '+' : ''}${formatPercent(profit)}%`
  ctx.fillStyle = profit >= 0 ? '#0ecb81' : '#f6465d'
  ctx.font = 'bold 95px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(formattedProfit, width / 2 - 140, layout.profitY)
}

/**
 * Draw entry and last prices
 */
function drawPrices(
  ctx: CanvasRenderingContext2D,
  entryPrice: number,
  lastPrice: number,
  layout: any
) {
  const baseY = layout.priceBlockY
  const labelColor = '#999999'
  const valueColor = '#ffffff'
  const labelFont = '18px Arial'
  const valueFont = 'bold 34px Arial'
  const entryX = layout.marginLeft
  const lastPriceX = 390

  // Entry Price
  ctx.fillStyle = labelColor
  ctx.font = labelFont
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('Entry Price', entryX, baseY)

  ctx.fillStyle = valueColor
  ctx.font = valueFont
  ctx.fillText(formatPrice(entryPrice), entryX, baseY + 32)

  // Last Price
  ctx.fillStyle = labelColor
  ctx.font = labelFont
  ctx.fillText('Last Price', lastPriceX, baseY)

  ctx.fillStyle = valueColor
  ctx.font = valueFont
  ctx.fillText(formatPrice(lastPrice), lastPriceX, baseY + 32)
}

/**
 * Draw footer with Binance logo and QR code
 */
async function drawFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  referralCode: string,
  layout: any
) {
  const footerY = layout.footerY
  const leftMargin = layout.marginLeft

  // Background image already has Binance logo and referral code text
  // Only draw QR code
  
  // Draw QR code (raised higher with rounded corners)
  const qrSize = 130
  const qrX = width - qrSize - 50
  const qrY = footerY - 40
  const cornerRadius = 12

  try {
    const qrDataUrl = await QRCode.toDataURL('https://www.binance.com', {
      width: qrSize,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // White background for QR with rounded corners
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, cornerRadius)
    ctx.fill()

    // Clip to rounded rectangle for QR code
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, cornerRadius)
    ctx.clip()

    const img = await loadImage(qrDataUrl)
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize)
    
    ctx.restore()
  } catch (error) {
    console.error('Failed to generate QR code:', error)
  }
}

function formatPercent(value: number) {
  // Format with comma as decimal separator
  return percentFormatter.format(value).replace('.', ',')
}

function formatPrice(value: number) {
  // Determine how many decimal places we need based on the value
  let decimals: number
  
  if (value >= 1) {
    // For prices >= 1, use up to 2 decimals
    decimals = 2
  } else if (value >= 0.01) {
    // For prices 0.01-0.99, use up to 4 decimals
    decimals = 4
  } else if (value >= 0.0001) {
    // For prices 0.0001-0.0099, use up to 6 decimals
    decimals = 6
  } else {
    // For very small prices (like SHIB), use up to 8 decimals
    decimals = 8
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })
  
  // Format with comma as decimal separator
  return formatter.format(value).replace('.', ',')
}

/**
 * Load image from data URL
 */
async function loadImage(dataUrl: string): Promise<Image> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Format trading card caption for Telegram
 */
export function formatCardCaption(data: {
  orderNumber: number
  pair: string
  timestamp: Date
}): string {
  const time = data.timestamp.toTimeString().split(' ')[0] // HH:MM:SS
  
  return `✅ Syntrix Bot has executed order #${data.orderNumber}
Exchange: binance
Trading pair: ${data.pair}
Order execution time: ${time}`
}

/**
 * Get last posted trading card data for caption
 */
export async function getLastTradingPostData() {
  const lastPost = await prisma.tradingPost.findFirst({
    orderBy: { orderNumber: 'desc' }
  })
  
  if (!lastPost) {
    throw new Error('No trading posts found')
  }
  
  return {
    orderNumber: lastPost.orderNumber,
    pair: lastPost.pair,
    timestamp: lastPost.postedAt
  }
}
