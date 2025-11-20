// Create background with ONLY graphics, NO TEXT
import { createCanvas } from 'canvas';
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

// Save the image (graphics only, no text)
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'card_logo3.png'), buffer);

console.log('✅ Background image created: card_logo3.png (graphics only)');
