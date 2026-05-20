#!/usr/bin/env node
// Generates minimal valid PNG icons for PWA manifest
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

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const rows = [];

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inCircle = dist <= r - 1;
      const inRing = dist > r - 1 && dist <= r;

      let pr, pg, pb, pa;
      if (inCircle) {
        // Gradient: deep blue top-left to teal bottom-right
        const t = (x + y) / (size * 2);
        pr = Math.round(12 + t * (28 - 12));    // 0c → 1c
        pg = Math.round(142 + t * (22 - 142));  // 8e → 16 (kinda dark teal)
        pb = Math.round(249 + t * (132 - 249)); // f9 → 84
        pa = 255;

        // Draw a subtle "trophy" shape in center third
        const cx2 = Math.abs(dx) / (size / 6);
        const cy2 = Math.abs(dy) / (size / 6);
        if (cy2 < 1.4 && cx2 < 1.4) {
          // center badge highlight
          pr = Math.min(255, pr + 60);
          pg = Math.min(255, pg + 60);
          pb = Math.min(255, pb + 60);
        }
      } else if (inRing) {
        pr = 255; pg = 255; pb = 255; pa = 120;
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

// apple-touch-icon (180x180)
const appleBuf = createIcon(180);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), appleBuf);
console.log('✓ apple-touch-icon.png');

// favicon.ico — just a 32x32 PNG renamed (browsers accept PNG-based favicon)
const favBuf = createIcon(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), favBuf);
console.log('✓ favicon.ico');

console.log('\nAll icons generated.');
