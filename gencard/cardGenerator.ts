// cardGenerator.ts
import { createCanvas, loadImage, registerFont } from "canvas";
import * as fs from "fs";
import * as path from "path";
import QRCode from "qrcode";

const ROOT_DIR = __dirname;

// ---------- РЕГИСТРАЦИЯ ШРИФТОВ ----------

const FONTS_DIR = path.join(ROOT_DIR, "fonts");

registerFont(path.join(FONTS_DIR, "ProximaNova-Regular.ttf"), {
  family: "Proxima Nova",
  weight: "normal",
  style: "normal",
});

registerFont(path.join(FONTS_DIR, "ProximaNova-Bold.ttf"), {
  family: "Proxima Nova",
  weight: "bold",
  style: "normal",
});

// ---------- НАСТРОЙКИ КАРТОЧКИ ----------

const CARD_WIDTH = 768;
const CARD_HEIGHT = 1024;

const COLORS = {
  bg: "#000000",
  textPrimary: "#FFFFFF",
  textSecondary: "#8C93A0",
  green: "#2EBD85",
  red: "#F6465D",
  pillLongBg: "#06553C",
  pillShortBg: "#5C1B27",
};

const ASSETS_DIR = path.join(ROOT_DIR, "assets");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ---------- ТИПЫ ДАННЫХ ----------

export interface TradeCardUserConfig {
  username: string;
  referralCode: string;
  qrLink: string;
}

export interface TradeCardData {
  symbol: string;          // BTCUSDT
  type: string;            // Perpetual
  side: "LONG" | "Short" | "Short".toUpperCase() | "LONG".toUpperCase() | string;
  leverage: number;        // 50
  entryPrice: string;      // "0,419" или "65000.50" — выводим как есть
  lastPrice: string;       // то же
  roePercent: string;      // "+43,91%" или "-12,34%"
  roePositive: boolean;    // цвет
  createdAt: string;       // "2025-12-04 06:12:52"
}

export interface GenerateCardPayload {
  userConfig: TradeCardUserConfig;
  tradeData: TradeCardData;
  /**
   * Имя файла без расширения. Если не указано, соберём из symbol+side.
   */
  filename?: string;
}

// ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    font: string;
    color: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  }
) {
  ctx.font = options.font;
  ctx.fillStyle = options.color;
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = options.baseline ?? "top";
  ctx.fillText(text, x, y);
}

function getTextMetrics(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string
) {
  ctx.font = font;
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width,
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
  };
}

// ---------- ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ----------

export async function generateTradingCard(
  payload: GenerateCardPayload
): Promise<Buffer> {
  const { userConfig, tradeData } = payload;

  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  // Фон: либо картинка (binance pattern), либо просто чёрный
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const bgPath = path.join(ASSETS_DIR, "card_logo3.png");
  if (fs.existsSync(bgPath)) {
    const bgImage = await loadImage(bgPath);
    ctx.drawImage(bgImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  const padding = 40;

  // ---------- HEADER ----------

  const usernameFont = 'bold 32px "Proxima Nova"';
  const datetimeFont = 'normal 22px "Proxima Nova"';

  let x = padding;
  let y = padding;

  // Username
  drawText(ctx, userConfig.username || "SyntrixBot", x, y, {
    font: usernameFont,
    color: COLORS.textPrimary,
  });

  const usernameMetrics = getTextMetrics(ctx, userConfig.username, usernameFont);
  const usernameHeight =
    usernameMetrics.actualBoundingBoxAscent +
    usernameMetrics.actualBoundingBoxDescent;

  // Дата/время справа
  const datetimeText = tradeData.createdAt || "";
  if (datetimeText) {
    const dtMetrics = getTextMetrics(ctx, datetimeText, datetimeFont);
    drawText(ctx, datetimeText, CARD_WIDTH - padding, y, {
      font: datetimeFont,
      color: COLORS.textSecondary,
      align: "right",
    });
    y += Math.max(usernameHeight, dtMetrics.actualBoundingBoxAscent + dtMetrics.actualBoundingBoxDescent) + 32;
  } else {
    y += usernameHeight + 32;
  }

  // ---------- SYMBOL + TYPE / SIDE / LEVERAGE ----------

  const symbolFont = 'bold 36px "Proxima Nova"';
  const typeFont = 'normal 24px "Proxima Nova"';
  const metaFont = 'normal 24px "Proxima Nova"';

  // Symbol + Perpetual
  drawText(ctx, `${tradeData.symbol} ${tradeData.type}`, x, y, {
    font: symbolFont,
    color: COLORS.textPrimary,
  });

  const symbolMetrics = getTextMetrics(
    ctx,
    `${tradeData.symbol} ${tradeData.type}`,
    symbolFont
  );

  y += symbolMetrics.actualBoundingBoxAscent +
    symbolMetrics.actualBoundingBoxDescent +
    16;

  // Side + leverage слева
  const sideText =
    tradeData.side.toUpperCase() === "LONG" ? "Long" : "Short";
  const leverageText = `${tradeData.leverage}x`;

  const sideColor =
    tradeData.side.toUpperCase() === "LONG" ? COLORS.green : COLORS.red;

  drawText(ctx, sideText, x, y, {
    font: metaFont,
    color: sideColor,
  });

  const sideMetrics = getTextMetrics(ctx, sideText, metaFont);
  const sideWidth = sideMetrics.width;

  drawText(ctx, leverageText, x + sideWidth + 16, y, {
    font: metaFont,
    color: COLORS.textSecondary,
  });

  const metaHeight =
    sideMetrics.actualBoundingBoxAscent + sideMetrics.actualBoundingBoxDescent;

  y += metaHeight + 40;

  // ---------- MAIN ROE ----------

  const roeFont = 'bold 80px "Proxima Nova"';
  const roeColor = tradeData.roePositive ? COLORS.green : COLORS.red;

  const roeText = tradeData.roePercent;
  const roeMetrics = getTextMetrics(ctx, roeText, roeFont);
  const roeWidth = roeMetrics.width;

  drawText(ctx, roeText, CARD_WIDTH / 2, y, {
    font: roeFont,
    color: roeColor,
    align: "center",
  });

  y +=
    roeMetrics.actualBoundingBoxAscent +
    roeMetrics.actualBoundingBoxDescent +
    40;

  // ---------- ENTRY / LAST PRICES ----------

  const labelFont = 'normal 22px "Proxima Nova"';
  const valueFont = 'bold 26px "Proxima Nova"';

  const leftBlockX = padding;
  const rightBlockX = CARD_WIDTH / 2 + 32;
  const pricesY = y;

  // Entry Price
  drawText(ctx, "Entry Price", leftBlockX, pricesY, {
    font: labelFont,
    color: COLORS.textSecondary,
  });
  const entryLabelMetrics = getTextMetrics(ctx, "Entry Price", labelFont);

  drawText(
    ctx,
    tradeData.entryPrice,
    leftBlockX,
    pricesY +
      entryLabelMetrics.actualBoundingBoxAscent +
      entryLabelMetrics.actualBoundingBoxDescent +
      8,
    {
      font: valueFont,
      color: COLORS.textPrimary,
    }
  );

  // Last Price
  drawText(ctx, "Last Price", rightBlockX, pricesY, {
    font: labelFont,
    color: COLORS.textSecondary,
  });
  const lastLabelMetrics = getTextMetrics(ctx, "Last Price", labelFont);

  drawText(
    ctx,
    tradeData.lastPrice,
    rightBlockX,
    pricesY +
      lastLabelMetrics.actualBoundingBoxAscent +
      lastLabelMetrics.actualBoundingBoxDescent +
      8,
    {
      font: valueFont,
      color: COLORS.textPrimary,
    }
  );

  // ---------- FOOTER: LOGO + REFERRAL + QR ----------

  const footerMarginBottom = 40;
  const qrSize = 150;

  const qrX = CARD_WIDTH - padding - qrSize;
  const qrY = CARD_HEIGHT - footerMarginBottom - qrSize;

  const qrBuffer = await QRCode.toBuffer(userConfig.qrLink || "https://binance.com", {
    width: qrSize,
    margin: 0,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  const qrImage = await loadImage(qrBuffer);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // Binance Futures + Referral Code
  const footerTextFont = 'normal 20px "Proxima Nova"';

  const footerTop = CARD_HEIGHT - footerMarginBottom - qrSize + 12;

  drawText(ctx, "BINANCE", padding, footerTop, {
    font: footerTextFont,
    color: "#F3BA2F",
  });

  drawText(ctx, "FUTURES", padding, footerTop + 26, {
    font: footerTextFont,
    color: COLORS.textPrimary,
  });

  if (userConfig.referralCode) {
    drawText(
      ctx,
      `Referral Code ${userConfig.referralCode}`,
      padding,
      footerTop + 26 + 28,
      {
        font: footerTextFont,
        color: COLORS.textSecondary,
      }
    );
  }

  // ---------- ВЫХОД ----------

  const buffer = canvas.toBuffer("image/png");
  const filename =
    payload.filename ||
    `${tradeData.symbol}_${tradeData.side}_${tradeData.leverage}x`.replace(
      /[^\w\-]+/g,
      "_"
    );

  const outPath = path.join(OUTPUT_DIR, `${filename}.png`);
  fs.writeFileSync(outPath, buffer);

  console.log(`Card saved: ${outPath}`);

  return buffer;
}

// Пример ручного запуска
if (require.main === module) {
  (async () => {
    const buf = await generateTradingCard({
      userConfig: {
        username: "SyntrixBot",
        referralCode: "SyntrixBot",
        qrLink: "https://binance.com",
      },
      tradeData: {
        symbol: "ICPUSDT",
        type: "Perpetual",
        side: "LONG",
        leverage: 74,
        entryPrice: "2,0852",
        lastPrice: "4,081",
        roePercent: "+95,71%",
        roePositive: true,
        createdAt: "2025-11-22 20:17:04",
      },
    });

    console.log("Buffer size:", buf.length);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
