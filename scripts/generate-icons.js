#!/usr/bin/env node
// Generates PNG icons for PWA manifest using FIFA 2026 brand colors
// Red #E0001B → Purple #6B21A8 gradient circle with gold trophy accent
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function createIcon(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Brand colors
  // Red: #E0001B  → r=224, g=0, b=27
  // Purple: #6B21A8 → r=107, g=33, b=168
  // Gold: #FFC93C  → r=255, g=201, b=60
  // Lime: #B5E317  → r=181, g=227, b=23

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const rows = [];

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inCircle = dist <= r - 0.5;
      const inRing = dist > r - 0.5 && dist <= r + 0.5;

      let pr, pg, pb, pa;

      if (inCircle) {
        // Diagonal gradient: red (top-left) → purple (bottom-right)
        const t = Math.max(0, Math.min(1, (x + y) / (size * 2)));
        pr = lerp(224, 107, t);
        pg = lerp(0, 33, t);
        pb = lerp(27, 168, t);
        pa = 255;

        // Trophy cup area — draw a gold shape in center
        const relX = (x - cx) / r; // -1 to +1
        const relY = (y - cy) / r; // -1 to +1

        // Cup body: roughly -0.28 to +0.28 wide, -0.55 to +0.1 tall
        const inCupBody = (
          Math.abs(relX) < 0.28 &&
          relY > -0.55 && relY < 0.1
        );
        // Cup handles: small bumps on sides at the top of cup
        const inLeftHandle = (relX > -0.38 && relX < -0.28 && relY > -0.5 && relY < -0.1);
        const inRightHandle = (relX > 0.28 && relX < 0.38 && relY > -0.5 && relY < -0.1);
        // Stem: thin column below cup
        const inStem = (Math.abs(relX) < 0.08 && relY > 0.1 && relY < 0.35);
        // Base: horizontal bar at bottom
        const inBase = (Math.abs(relX) < 0.28 && relY > 0.35 && relY < 0.5);
        // Lime circles (accent dots on sides of cup, at mid height)
        const leftDotX = -0.5, leftDotY = -0.1;
        const rightDotX = 0.5, rightDotY = -0.1;
        const inLeftDot = Math.sqrt((relX - leftDotX) ** 2 + (relY - leftDotY) ** 2) < 0.09;
        const inRightDot = Math.sqrt((relX - rightDotX) ** 2 + (relY - rightDotY) ** 2) < 0.09;
        const inBottomDot = Math.sqrt(relX ** 2 + (relY - 0.65) ** 2) < 0.065;

        if (inLeftDot || inRightDot) {
          // Lime accent
          pr = 181; pg = 227; pb = 23; pa = 230;
        } else if (inBottomDot) {
          // Gold bottom dot
          pr = 255; pg = 201; pb = 60; pa = 200;
        } else if (inCupBody || inLeftHandle || inRightHandle || inStem || inBase) {
          // Gold trophy
          const goldT = (relY + 0.55) / 1.05; // 0 at top, 1 at bottom of trophy
          pr = lerp(255, 245, goldT);
          pg = lerp(210, 165, goldT);
          pb = lerp(60, 0, goldT);
          pa = 255;
        }
      } else if (inRing) {
        pr = 255; pg = 255; pb = 255; pa = Math.round((r + 0.5 - dist) * 180);
      } else {
        pr = 0; pg = 0; pb = 0; pa = 0;
      }

      const off = 1 + x * 4;
      row[off]     = pr;
      row[off + 1] = pg;
      row[off + 2] = pb;
      row[off + 3] = pa;
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const s of sizes) {
  const buf = createIcon(s);
  const outPath = path.join(outDir, `icon-${s}x${s}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✓ icon-${s}x${s}.png (${buf.length} bytes)`);
}

const appleBuf = createIcon(180);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), appleBuf);
console.log('✓ apple-touch-icon.png');

const favBuf = createIcon(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), favBuf);
console.log('✓ favicon.ico');

console.log('\nAll FIFA 2026 icons generated.');
