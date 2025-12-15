const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const ROOT_DIR = __dirname;
const ASSETS_DIR = path.join(ROOT_DIR, "assets");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");
const FONTS_DIR = path.join(ROOT_DIR, "fonts");

const FONTS = {
  400: { file: "BinanceNova-Regular.ttf", family: "BinanceNova-Regular" },
  500: { file: "BinanceNova-Medium.ttf", family: "BinanceNova-Medium" },
  600: { file: "BinanceNova-Semibold.ttf", family: "BinanceNova-Semibold" },
  700: { file: "BinanceNova-Bold.ttf", family: "BinanceNova-Bold" },
};

for (const w of Object.keys(FONTS)) {
  const { file, family } = FONTS[w];
  const fp = path.join(FONTS_DIR, file);
  if (!fs.existsSync(fp)) throw new Error(`Нет шрифта → ${fp}`);
  registerFont(fp, { family, style: "normal" });
}

const CARD_WIDTH = 768;
const CARD_HEIGHT = 1024;

const COLORS = {
  bg: "#000000",
  textPrimary: "#FFFFFF",
  textSecondary: "#8C93A0",
  green: "#00C48C",
  red: "#F6465D",
  yellow: "#F3BA2F",
  divider: "#15171D",
};

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function setFont(ctx, sizePx, weight = 400) {
  const w = FONTS[weight] ? weight : 400;
  const family = FONTS[w].family;
  ctx.font = `${sizePx}px "${family}"`;
}

function drawText(ctx, text, x, y, options = {}) {
  const {
    size = 16,
    weight = 400,
    color = "#FFFFFF",
    align = "left",
    baseline = "top",
  } = options;

  setFont(ctx, size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(String(text ?? ""), x, y);
}

function drawImageCover(ctx, img, x, y, w, h, offsetX = 0, offsetY = 0) {
  const arImg = img.width / img.height;
  const arBox = w / h;

  let dw, dh, dx, dy;
  if (arImg > arBox) {
    dh = h;
    dw = Math.round(h * arImg);
    dx = x - Math.round((dw - w) / 2);
    dy = y;
  } else {
    dw = w;
    dh = Math.round(w / arImg);
    dx = x;
    dy = y - Math.round((dh - h) / 2);
  }

  ctx.drawImage(img, dx + offsetX, dy + offsetY, dw, dh);
}

function drawImageCoverZoomOut(ctx, img, x, y, w, h, zoomOut = 1, offsetX = 0, offsetY = 0) {
  const arImg = img.width / img.height;
  const arBox = w / h;

  let sw, sh;
  if (arImg > arBox) {
    sh = img.height;
    sw = sh * arBox;
  } else {
    sw = img.width;
    sh = sw / arBox;
  }

  const z = Math.max(0.5, Math.min(1, zoomOut));
  let sw2 = sw / z;
  let sh2 = sh / z;

  if (sw2 > img.width) {
    sw2 = img.width;
    sh2 = sw2 / arBox;
  }
  if (sh2 > img.height) {
    sh2 = img.height;
    sw2 = sh2 * arBox;
  }

  const sx = Math.round((img.width - sw2) / 2 + offsetX);
  const sy = Math.round((img.height - sh2) / 2 + offsetY);

  ctx.drawImage(img, sx, sy, Math.round(sw2), Math.round(sh2), x, y, w, h);
}

async function drawAvatarCircle(ctx, cx, cy, r, imgPath) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (imgPath && fs.existsSync(imgPath)) {
    const img = await loadImage(imgPath);

    const d = r * 2;
    const arS = img.width / img.height;
    const arD = 1;

    let sw, sh, sx, sy;
    if (arS > arD) {
      sh = img.height;
      sw = Math.round(sh * arD);
      sx = Math.round((img.width - sw) / 2);
      sy = 0;
    } else {
      sw = img.width;
      sh = Math.round(sw / arD);
      sx = 0;
      sy = Math.round((img.height - sh) / 2);
    }

    ctx.drawImage(img, sx, sy, sw, sh, cx - r, cy - r, d, d);
  } else {
    ctx.fillStyle = "#24313F";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  ctx.restore();
}

async function generateTradingCard({ userConfig, tradeData, filename } = {}) {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.antialias = "subpixel";

  const p = 40;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const bgPath = path.join(ASSETS_DIR, "card_logo3.png");
  if (fs.existsSync(bgPath)) {
    const bg = await loadImage(bgPath);
    ctx.save();

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "screen";

    const BG_ZOOM_OUT = 0.63;
    const BG_SRC_OFFSET_X = 0;
    const BG_SRC_OFFSET_Y = 0;

    drawImageCoverZoomOut(ctx, bg, 0, 0, CARD_WIDTH, CARD_HEIGHT, BG_ZOOM_OUT, BG_SRC_OFFSET_X, BG_SRC_OFFSET_Y);

    ctx.restore();
  }

  const avatarX = p + 36;
  const avatarY = p + 60;
  const avatarR = 40;

  const avatarPath = path.join(ASSETS_DIR, "avatar.jpg");
  await drawAvatarCircle(ctx, avatarX, avatarY, avatarR, avatarPath);

  const headerTextX = avatarX + avatarR + 30;
  let headerY = p + 14;

  drawText(ctx, userConfig?.username || "MatrixBot", headerTextX, headerY, {
    size: 38,
    weight: 600,
    color: COLORS.textPrimary,
  });

  headerY += 60;

  if (tradeData?.createdAt) {
    drawText(ctx, tradeData.createdAt, headerTextX, headerY, {
      size: 28,
      weight: 400,
      color: COLORS.textPrimary,
    });
  }

  let curY = p + 270;

  const LEFT_BLOCK_OFFSET_X = 8;

  drawText(ctx, `${tradeData?.symbol || ""} ${tradeData?.type || ""}`.trim(), p + LEFT_BLOCK_OFFSET_X, curY, {
    size: 38,
    weight: 600,
    color: COLORS.textPrimary,
  });

  curY += 55;

  const sideText = (tradeData?.side || "").toUpperCase() === "LONG" ? "Long" : "Short";
  const sideColor = sideText === "Long" ? COLORS.green : COLORS.red;

  const sideSize = 26;
  const sideWeight = 500;

  drawText(ctx, sideText, p + LEFT_BLOCK_OFFSET_X, curY, {
    size: sideSize,
    weight: sideWeight,
    color: sideColor,
  });

  setFont(ctx, sideSize, sideWeight);
  const sideW = ctx.measureText(sideText).width;

  const gapAfterSide = 12;
  const gapAfterBar = 18;

  const barX = p + LEFT_BLOCK_OFFSET_X + sideW + gapAfterSide;

  drawText(ctx, "|", barX, curY, {
    size: sideSize,
    weight: 400,
    color: COLORS.textSecondary,
  });

  drawText(ctx, `${tradeData?.leverage ?? ""}x`, barX + gapAfterBar, curY, {
    size: sideSize,
    weight: sideWeight,
    color: COLORS.textSecondary,
  });

  const roeY = curY + 50;
  const roeColor = tradeData?.roePositive ? COLORS.green : COLORS.red;

  const ROE_X = 40;

  const roeText = tradeData?.roePercent || "";
  const sign = roeText.startsWith("+") || roeText.startsWith("-") ? roeText[0] : "";
  const value = sign ? roeText.slice(1) : roeText;

  if (sign) {
    drawText(ctx, sign, ROE_X - 4, roeY + 3, {
      size: 90,
      weight: 400,
      color: roeColor,
      align: "left",
    });
  }

  drawText(ctx, value, ROE_X + 35, roeY, {
    size: 96,
    weight: 400,
    color: roeColor,
    align: "left",
  });

  const footerHeight = 170;
  const pricesY = CARD_HEIGHT - footerHeight - 170;

  drawText(ctx, "Entry Price", p, pricesY - 105, {
    size: 27,
    weight: 400,
    color: COLORS.textSecondary,
  });

  drawText(ctx, tradeData?.entryPrice || "", p, pricesY - 60, {
    size: 30,
    weight: 500,
    color: COLORS.textPrimary,
  });

  const rightBlockX = CARD_WIDTH / 2 + 20;

  drawText(ctx, "Last Price", rightBlockX, pricesY - 105, {
    size: 27,
    weight: 400,
    color: COLORS.textSecondary,
  });

  drawText(ctx, tradeData?.lastPrice || "", rightBlockX, pricesY - 60, {
    size: 30,
    weight: 500,
    color: COLORS.textPrimary,
  });

  const footerY = CARD_HEIGHT - footerHeight;

  ctx.fillStyle = COLORS.divider;
  ctx.fillRect(0, footerY, CARD_WIDTH, 1);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, footerY + 1, CARD_WIDTH, footerHeight - 1);

  const footerPadding = 32;
  const binanceX = p;
  const binanceY = footerY + footerPadding;

  const markPath = path.join(ASSETS_DIR, "binance_mark.png");
  let markW = 0;

  if (fs.existsSync(markPath)) {
    const mark = await loadImage(markPath);
    const size = 33;
    ctx.drawImage(mark, binanceX, binanceY - 1.3, size, size);
    markW = size + 8;
  }

  const textX = binanceX + markW;

  drawText(ctx, "BINANCE", textX, binanceY, {
    size: 26,
    weight: 600,
    color: COLORS.yellow,
  });

  drawText(ctx, "FUTURES", textX, binanceY + 30, {
    size: 32,
    weight: 700,
    color: COLORS.textPrimary,
  });

  if (userConfig?.referralCode) {
    drawText(ctx, `Referral Code ${userConfig.referralCode}`, textX, binanceY + 80, {
      size: 25,
      weight: 400,
      color: COLORS.textPrimary,
    });
  }

  const qrSize = 98;
  const qrBgPadding = 12;
  const qrCorner = 10;

  const qrX = CARD_WIDTH - p - qrSize;
  const qrY = footerY + (footerHeight - qrSize) / 2;

  const qrBgX = qrX - qrBgPadding;
  const qrBgY = qrY - qrBgPadding;
  const qrBgW = qrSize + qrBgPadding * 2;
  const qrBgH = qrSize + qrBgPadding * 2;

  ctx.fillStyle = "#FFFFFF";
  roundRectPath(ctx, qrBgX, qrBgY, qrBgW, qrBgH, qrCorner);
  ctx.fill();

  const qrBuffer = await QRCode.toBuffer(userConfig?.qrLink || "https://binance.com", {
    width: qrSize,
    margin: 0,
    color: { dark: "#000000", light: "#FFFFFFFF" },
  });

  const qrImg = await loadImage(qrBuffer);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  const buffer = canvas.toBuffer("image/png");
  const safeName =
    filename ||
    `${tradeData?.symbol || "SYMBOL"}_${tradeData?.side || "SIDE"}_${tradeData?.leverage || "X"}x`.replace(/[^\w]/g, "_");

  const outPath = path.join(OUTPUT_DIR, `${safeName}.png`);
  fs.writeFileSync(outPath, buffer);

  console.log("Карточка готова →", outPath);
  return buffer;
}

if (require.main === module) {
  generateTradingCard({
    userConfig: {
      username: "SyntrixBot",
      referralCode: "SyntrixBot",
      qrLink: "https://www.binance.com/en/futures",
    },
    tradeData: {
      symbol: "SUIUSDT",
      type: "Perpetual",
      side: "SHORT",
      leverage: 52,
      entryPrice: "1,599",
      lastPrice: "1,556",
      roePercent: "+139,84%",
      roePositive: true,
      createdAt: "2025-12-11 02:03:48",
    },
  }).catch((err) => console.error("Ошибка:", err));
}

module.exports = { generateTradingCard };