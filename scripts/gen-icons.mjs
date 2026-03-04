/**
 * Generates PWA icon PNGs without any external dependencies.
 * Uses a minimal hand-rolled PNG encoder (DEFLATE via zlib, built into Node).
 *
 * Outputs:
 *   public/pwa-192x192.png
 *   public/pwa-512x512.png
 *   public/apple-touch-icon.png  (180x180)
 *   public/favicon.ico           (simple 32x32 ICO wrapping a PNG)
 */

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public');
mkdirSync(OUT, { recursive: true });

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = [0x6a, 0xb4, 0xf5];   // #6ab4f5  blue
const FG        = [0xff, 0xff, 0xff];   // white
const RADIUS_F  = 0.22;                  // corner radius as fraction of size

// ── PNG encoder ───────────────────────────────────────────────────────────────

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBytes, data]);
  const crc  = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(pixels, size) {
  // pixels: Uint8Array of RGBA, row-major
  const IHDR_data = Buffer.alloc(13);
  IHDR_data.writeUInt32BE(size, 0);
  IHDR_data.writeUInt32BE(size, 4);
  IHDR_data[8]  = 8;   // bit depth
  IHDR_data[9]  = 2;   // color type: RGB  — we'll use RGBA so set to 6
  IHDR_data[9]  = 6;
  IHDR_data[10] = 0; IHDR_data[11] = 0; IHDR_data[12] = 0;

  // Build raw scanlines (filter byte 0 + RGBA)
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const pi = (y * size + x) * 4;
      const ri = y * (1 + size * 4) + 1 + x * 4;
      raw[ri]     = pixels[pi];
      raw[ri + 1] = pixels[pi + 1];
      raw[ri + 2] = pixels[pi + 2];
      raw[ri + 3] = pixels[pi + 3];
    }
  }

  const IDAT_data = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', IHDR_data),
    chunk('IDAT', IDAT_data),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Rasteriser ────────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

/** Smooth-step signed distance for a rounded rectangle, returns coverage 0..1 */
function rrectCoverage(px, py, size, radius) {
  const cx = size / 2, cy = size / 2;
  const rx = size / 2 - radius, ry = size / 2 - radius;
  const dx = Math.max(Math.abs(px - cx) - rx, 0);
  const dy = Math.max(Math.abs(py - cy) - ry, 0);
  const dist = Math.sqrt(dx * dx + dy * dy) - radius;
  // Anti-alias over 1.5px
  return Math.min(Math.max(-dist / 1.5 + 0.5, 0), 1);
}

/** Very simple bitmap font — 5×7 pixels for 'C' and '$' */
const GLYPHS = {
  // Each glyph: array of 7 rows, each row is a 5-bit bitmask (MSB = left)
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
};

function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const radius = Math.round(size * RADIUS_F);

  // Choose glyph — use 'C' for CashBook
  const glyph   = GLYPHS.C;
  const GSCALE  = Math.max(1, Math.floor(size / 24));   // scale factor for glyph pixels
  const GW      = 5 * GSCALE;
  const GH      = 7 * GSCALE;
  const gx0     = Math.round((size - GW) / 2);
  const gy0     = Math.round((size - GH) / 2);

  // Build glyph mask
  const glyphMask = new Float32Array(size * size);
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (!(glyph[row] & (1 << (4 - col)))) continue;
      for (let dy = 0; dy < GSCALE; dy++) {
        for (let dx = 0; dx < GSCALE; dx++) {
          const x = gx0 + col * GSCALE + dx;
          const y = gy0 + row * GSCALE + dy;
          if (x >= 0 && x < size && y >= 0 && y < size)
            glyphMask[y * size + x] = 1;
        }
      }
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bg  = rrectCoverage(x + 0.5, y + 0.5, size, radius);
      const fg  = glyphMask[y * size + x];

      // Composite: transparent → bg colour → glyph
      const alpha = bg;
      const r = lerp(BG[0], FG[0], fg);
      const g = lerp(BG[1], FG[1], fg);
      const b = lerp(BG[2], FG[2], fg);

      const i = (y * size + x) * 4;
      pixels[i]     = Math.round(r);
      pixels[i + 1] = Math.round(g);
      pixels[i + 2] = Math.round(b);
      pixels[i + 3] = Math.round(alpha * 255);
    }
  }

  return pixels;
}

// ── Generate files ────────────────────────────────────────────────────────────

function writePNG(filename, size) {
  const pixels = renderIcon(size);
  const png    = encodePNG(pixels, size);
  const dest   = join(OUT, filename);
  writeFileSync(dest, png);
  console.log(`  ✓  ${filename}  (${size}×${size})  ${png.length} bytes`);
  return png;
}

console.log('\nGenerating PWA icons…\n');

writePNG('pwa-192x192.png', 192);
writePNG('pwa-512x512.png', 512);
writePNG('apple-touch-icon.png', 180);

// favicon.ico — ICO container wrapping a 32×32 PNG
const png32 = (() => {
  const pixels = renderIcon(32);
  return encodePNG(pixels, 32);
})();

function writeICO(filename, pngData, size) {
  // ICO header (6 bytes) + directory entry (16 bytes) + PNG data
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);  // reserved
  header.writeUInt16LE(1, 2);  // type: icon
  header.writeUInt16LE(1, 4);  // count: 1 image

  const dir = Buffer.alloc(16);
  dir[0] = size >= 256 ? 0 : size;  // width
  dir[1] = size >= 256 ? 0 : size;  // height
  dir[2] = 0;   // color count
  dir[3] = 0;   // reserved
  dir.writeUInt16LE(1, 4);   // color planes
  dir.writeUInt16LE(32, 6);  // bits per pixel
  dir.writeUInt32LE(pngData.length, 8);  // size of image data
  dir.writeUInt32LE(6 + 16, 12);         // offset of image data

  const ico = Buffer.concat([header, dir, pngData]);
  writeFileSync(join(OUT, filename), ico);
  console.log(`  ✓  ${filename}  (${size}×${size})  ${ico.length} bytes`);
}

writeICO('favicon.ico', png32, 32);

console.log('\nAll icons written to public/\n');
