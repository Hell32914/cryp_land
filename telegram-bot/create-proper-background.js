// Create a proper background with logo, avatar, and Binance branding
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const width = 768;
const height = 1024;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Base black background
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, width, height);

// Large diagonal squares in top-right corner
const squares = [
  { x: width - 200, y: -100, size: 500, opacity: 0.15 },
  { x: width - 450, y: -50, size: 450, opacity: 0.12 },
  { x: width - 150, y: 200, size: 350, opacity: 0.08 }
];

squares.forEach(square => {
  ctx.save();
  ctx.translate(square.x, square.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = `rgba(255, 255, 255, ${square.opacity})`;
  ctx.fillRect(0, 0, square.size, square.size);
  ctx.restore();
});

// Subtle vignette effect
const vignette = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
ctx.fillStyle = vignette;
ctx.fillRect(0, 0, width, height);

// Draw avatar circle
const avatarX = 47;
const avatarY = 55;
const avatarSize = 60;
const avatarRadius = avatarSize / 2;

ctx.fillStyle = '#F0B90B';
ctx.beginPath();
ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
ctx.fill();

// Draw avatar initial "S"
ctx.fillStyle = '#0B0B0B';
ctx.font = 'bold 32px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('S', avatarX + avatarRadius, avatarY + avatarRadius + 2);

// Draw bot name "SyntrixBot"
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 28px Arial';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';
ctx.fillText('SyntrixBot', avatarX + avatarSize + 20, avatarY + 5);

// Draw "Bot" label
ctx.fillStyle = '#999999';
ctx.font = '16px Arial';
ctx.fillText('Bot', avatarX + avatarSize + 20, avatarY + 40);

// Draw Binance Futures logo at bottom
const footerY = 900;
ctx.fillStyle = '#F0B90B';
ctx.font = 'bold 22px Arial';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';
ctx.fillText('◆ BINANCE', 47, footerY);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 22px Arial';
ctx.fillText('FUTURES', 157, footerY);

// Draw "Referral Code SyntrixBot" text
ctx.fillStyle = '#999999';
ctx.font = '16px Arial';
ctx.fillText('Referral Code SyntrixBot', 47, footerY + 35);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'card_logo3.png'), buffer);

console.log('✅ Background image created: card_logo3.png');
