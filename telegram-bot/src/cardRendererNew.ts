import { createCanvas, loadImage, registerFont, type CanvasRenderingContext2D } from 'canvas'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CARD_WIDTH = 768
const CARD_HEIGHT = 1024

const ASSETS_DIR = path.join(__dirname, '..', 'assets')
const FONTS_DIR = path.join(__dirname, '..', 'fonts')
const BG_PATH_FALLBACK = path.join(__dirname, '..', 'card_logo3.png')

const COLORS = {
  bg: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#8C93A0',
  green: '#00C48C',
  red: '#F6465D',
  yellow: '#F3BA2F',
  divider: '#15171D'
} as const

type TextAlign = 'left' | 'right' | 'center' | 'start' | 'end'
type TextBaseline = 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom'

type FontWeightKey = 400 | 500 | 600 | 700

const FONTS: Record<FontWeightKey, { file: string; family: string }> = {
  400: { file: 'BinanceNova-Regular.ttf', family: 'BinanceNovaRegular' },
  500: { file: 'BinanceNova-Medium.ttf', family: 'BinanceNovaMedium' },
  600: { file: 'BinanceNova-Semibold.ttf', family: 'BinanceNovaSemibold' },
  700: { file: 'BinanceNova-Bold.ttf', family: 'BinanceNovaBold' }
}

let fontsRegistered = false

function ensureFontsRegistered() {
  if (fontsRegistered) return

  for (const w of Object.keys(FONTS) as unknown as FontWeightKey[]) {
    const { file, family } = FONTS[w]
    const fontPath = path.join(FONTS_DIR, file)

    if (!fs.existsSync(fontPath)) {
      // Fail loudly: without fonts, server output differs from design.
      throw new Error(`Trading card font missing: ${fontPath}`)
    }

    registerFont(fontPath, { family, style: 'normal' })
  }

  fontsRegistered = true
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  ctx.lineTo(x + rr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
  ctx.lineTo(x, y + rr)
  ctx.quadraticCurveTo(x, y, x + rr, y)
  ctx.closePath()
}

function setFont(ctx: CanvasRenderingContext2D, sizePx: number, weight: FontWeightKey = 400) {
  const chosenWeight = FONTS[weight] ? weight : 400
  const family = FONTS[chosenWeight].family
  // Use explicit per-weight families to avoid platform-specific font weight matching issues.
  ctx.font = `${sizePx}px "${family}"`
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options?: {
    size?: number
    weight?: FontWeightKey
    color?: string
    align?: TextAlign
    baseline?: TextBaseline
  }
) {
  const size = options?.size ?? 16
  const weight = options?.weight ?? 400
  const color = options?.color ?? COLORS.textPrimary
  const align = options?.align ?? 'left'
  const baseline = options?.baseline ?? 'top'

  setFont(ctx, size, weight)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(String(text ?? ''), x, y)
}

function drawImageCoverZoomOut(
  ctx: CanvasRenderingContext2D,
  img: any,
  x: number,
  y: number,
  w: number,
  h: number,
  zoomOut = 1,
  offsetX = 0,
  offsetY = 0
) {
  const arImg = img.width / img.height
  const arBox = w / h

  let sw: number
  let sh: number

  if (arImg > arBox) {
    sh = img.height
    sw = sh * arBox
  } else {
    sw = img.width
    sh = sw / arBox
  }

  const z = Math.max(0.5, Math.min(1, zoomOut))
  let sw2 = sw / z
  let sh2 = sh / z

  if (sw2 > img.width) {
    sw2 = img.width
    sh2 = sw2 / arBox
  }
  if (sh2 > img.height) {
    sh2 = img.height
    sw2 = sh2 * arBox
  }

  const sx = Math.round((img.width - sw2) / 2 + offsetX)
  const sy = Math.round((img.height - sh2) / 2 + offsetY)

  ctx.drawImage(img, sx, sy, Math.round(sw2), Math.round(sh2), x, y, w, h)
}

async function drawAvatarCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, imgPath: string) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  if (imgPath && fs.existsSync(imgPath)) {
    const img: any = await loadImage(imgPath)
    const d = r * 2

    const arS = img.width / img.height
    const arD = 1

    let sw: number
    let sh: number
    let sx: number
    let sy: number

    if (arS > arD) {
      sh = img.height
      sw = Math.round(sh * arD)
      sx = Math.round((img.width - sw) / 2)
      sy = 0
    } else {
      sw = img.width
      sh = Math.round(sw / arD)
      sx = 0
      sy = Math.round((img.height - sh) / 2)
    }

    ctx.drawImage(img, sx, sy, sw, sh, cx - r, cy - r, d, d)
  } else {
    ctx.fillStyle = '#24313F'
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }

  ctx.restore()
}

export interface TradeCardUserConfig {
  username: string
  referralCode: string
  qrLink: string
}

export interface TradeCardData {
  symbol: string
  type: string
  side: 'LONG' | 'SHORT' | string
  leverage: number
  entryPrice: string
  lastPrice: string
  roePercent: string
  roePositive: boolean
  createdAt: string
}

export interface RenderNewCardPayload {
  userConfig: TradeCardUserConfig
  tradeData: TradeCardData
}

export async function renderTradingCardNewDesign(payload: RenderNewCardPayload): Promise<Buffer> {
  ensureFontsRegistered()

  const { userConfig, tradeData } = payload

  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT)
  const ctx = canvas.getContext('2d')

  ;(ctx as any).antialias = 'subpixel'

  const p = 40

  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // Background (prefer assets/card_logo3.png, fallback to legacy telegram-bot/card_logo3.png)
  const bgPath = path.join(ASSETS_DIR, 'card_logo3.png')
  const bgToUse = fs.existsSync(bgPath) ? bgPath : BG_PATH_FALLBACK

  if (fs.existsSync(bgToUse)) {
    const bg: any = await loadImage(bgToUse)
    ctx.save()

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'screen'

    const BG_ZOOM_OUT = 0.63
    drawImageCoverZoomOut(ctx, bg, 0, 0, CARD_WIDTH, CARD_HEIGHT, BG_ZOOM_OUT, 0, 0)

    ctx.restore()
  }

  // Header avatar + name + timestamp
  const avatarX = p + 36
  const avatarY = p + 60
  const avatarR = 40

  const avatarPath = path.join(ASSETS_DIR, 'avatar.jpg')
  await drawAvatarCircle(ctx, avatarX, avatarY, avatarR, avatarPath)

  const headerTextX = avatarX + avatarR + 30
  let headerY = p + 14

  drawText(ctx, userConfig.username || 'SyntrixBot', headerTextX, headerY, {
    size: 38,
    weight: 600,
    color: COLORS.textPrimary
  })

  headerY += 60

  if (tradeData.createdAt) {
    drawText(ctx, tradeData.createdAt, headerTextX, headerY, {
      size: 28,
      weight: 400,
      color: COLORS.textPrimary
    })
  }

  // Left block (symbol / side / leverage)
  let curY = p + 270
  const LEFT_BLOCK_OFFSET_X = 8

  drawText(ctx, `${tradeData.symbol} ${tradeData.type}`.trim(), p + LEFT_BLOCK_OFFSET_X, curY, {
    size: 38,
    weight: 600,
    color: COLORS.textPrimary
  })

  curY += 55

  const sideText = tradeData.side.toUpperCase() === 'LONG' ? 'Long' : 'Short'
  const sideColor = sideText === 'Long' ? COLORS.green : COLORS.red

  const sideSize = 26
  const sideWeight: FontWeightKey = 500

  drawText(ctx, sideText, p + LEFT_BLOCK_OFFSET_X, curY, {
    size: sideSize,
    weight: sideWeight,
    color: sideColor
  })

  setFont(ctx, sideSize, sideWeight)
  const sideW = ctx.measureText(sideText).width

  const gapAfterSide = 12
  const gapAfterBar = 18

  const barX = p + LEFT_BLOCK_OFFSET_X + sideW + gapAfterSide

  drawText(ctx, '|', barX, curY, {
    size: sideSize,
    weight: 400,
    color: COLORS.textSecondary
  })

  drawText(ctx, `${tradeData.leverage}x`, barX + gapAfterBar, curY, {
    size: sideSize,
    weight: sideWeight,
    color: COLORS.textSecondary
  })

  // ROE (profit)
  const roeY = curY + 50
  const roeColor = tradeData.roePositive ? COLORS.green : COLORS.red

  const ROE_X = 40

  const roeText = tradeData.roePercent || ''
  const sign = roeText.startsWith('+') || roeText.startsWith('-') ? roeText[0] : ''
  const value = sign ? roeText.slice(1) : roeText

  if (sign) {
    drawText(ctx, sign, ROE_X - 4, roeY + 3, {
      size: 90,
      weight: 500,
      color: roeColor,
      align: 'left'
    })
  }

  drawText(ctx, value, ROE_X + 35, roeY, {
    size: 96,
    weight: 500,
    color: roeColor,
    align: 'left'
  })

  // Prices
  const footerHeight = 170
  const pricesY = CARD_HEIGHT - footerHeight - 170

  drawText(ctx, 'Entry Price', p, pricesY - 105, {
    size: 27,
    weight: 400,
    color: COLORS.textSecondary
  })

  drawText(ctx, tradeData.entryPrice || '', p, pricesY - 60, {
    size: 30,
    weight: 500,
    color: COLORS.textPrimary
  })

  const rightBlockX = CARD_WIDTH / 2 + 20

  drawText(ctx, 'Last Price', rightBlockX, pricesY - 105, {
    size: 27,
    weight: 400,
    color: COLORS.textSecondary
  })

  drawText(ctx, tradeData.lastPrice || '', rightBlockX, pricesY - 60, {
    size: 30,
    weight: 500,
    color: COLORS.textPrimary
  })

  // Footer
  const footerY = CARD_HEIGHT - footerHeight

  ctx.fillStyle = COLORS.divider
  ctx.fillRect(0, footerY, CARD_WIDTH, 1)

  ctx.fillStyle = '#000'
  ctx.fillRect(0, footerY + 1, CARD_WIDTH, footerHeight - 1)

  const footerPadding = 32
  const binanceX = p
  const binanceY = footerY + footerPadding

  const markPath = path.join(ASSETS_DIR, 'binance_mark.png')
  let markW = 0

  if (fs.existsSync(markPath)) {
    const mark: any = await loadImage(markPath)
    const size = 42
    ctx.drawImage(mark, binanceX, binanceY - 1.3, size, size)
    markW = size + 8
  }

  const textX = binanceX + markW

  drawText(ctx, 'BINANCE', textX, binanceY, {
    size: 26,
    weight: 600,
    color: COLORS.yellow
  })

  drawText(ctx, 'FUTURES', textX, binanceY + 30, {
    size: 32,
    weight: 700,
    color: COLORS.textPrimary
  })

  if (userConfig.referralCode) {
    drawText(ctx, `Referral Code ${userConfig.referralCode}`, textX, binanceY + 80, {
      size: 25,
      weight: 400,
      color: COLORS.textPrimary
    })
  }

  const qrSize = 98
  const qrBgPadding = 12
  const qrCorner = 10

  const qrX = CARD_WIDTH - p - qrSize
  const qrY = footerY + (footerHeight - qrSize) / 2

  const qrBgX = qrX - qrBgPadding
  const qrBgY = qrY - qrBgPadding
  const qrBgW = qrSize + qrBgPadding * 2
  const qrBgH = qrSize + qrBgPadding * 2

  ctx.fillStyle = '#FFFFFF'
  roundRectPath(ctx, qrBgX, qrBgY, qrBgW, qrBgH, qrCorner)
  ctx.fill()

  const qrBuffer = await QRCode.toBuffer(userConfig.qrLink || 'https://binance.com', {
    width: qrSize,
    margin: 0,
    color: { dark: '#000000', light: '#FFFFFFFF' }
  })

  const qrImg: any = await loadImage(qrBuffer)
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

  return canvas.toBuffer('image/png')
}
