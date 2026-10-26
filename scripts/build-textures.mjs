// Pre-renders the grain textures that NoiseOverlay, PaperTexture and InkBleed
// used to compute live with feTurbulence.
//
//   node scripts/build-textures.mjs
//
// Each tile is the exact filter chain the components used (fractal noise,
// alpha thresholded through the same discrete table), rendered by Chrome so
// the noise is identical to what the browser produced before. stitchTiles
// makes every tile seamless, so the components can repeat it as a mask.
//
// Tiles are TILE css px square, rendered at 2x so the grain stays crisp on
// high-density screens, at base frequency BASE_FREQ. A component that wants
// frequency f shows the tile at TILE * BASE_FREQ / f css px.
//
// Output:
//   public/textures/grain-c{0..100 step 10}.png  NoiseOverlay / PaperTexture
//     (the filter only ever had ten threshold levels, so steps of 10 are
//     every distinct grain it could produce)
//   public/textures/fiber-t{10..90 step 10}.png  InkBleed paper fiber
//
// Each tile also comes in four seeds (…-v1, -v2, -v3 beside the plain
// file, which is v0). Seeds are 1, 8, 15, 22: the seeds the offset components
// gave their ink layers (layerIndex * 7 + 1), so each C/M/Y/K plate or
// OffsetImage layer gets its own independent grain, exactly as before. Inside
// an SVG filter a tile can only be anchored at the origin (a shifted feImage
// is clipped to the filter region and can vanish on small elements), so a
// different sheet of noise has to be a different file.
//
// Uses system Chrome through Playwright, and sharp to reduce each tile to a
// two-colour palette PNG (black + transparent).

import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Must match the constants in components/plasmic-components/textures.ts
const TILE = 256;
const BASE_FREQ = 0.5;
const SCALE = 2;
const SEEDS = [1, 8, 15, 22];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'textures');

// PaperTexture's grainTable. NoiseOverlay's "0 1" table is coverage 50.
function grainTable(coverage) {
  const n = 10;
  const ones = Math.round(Math.max(0, Math.min(n, (coverage / 100) * n)));
  return Array.from({ length: n }, (_, i) => (i >= n - ones ? 1 : 0)).join(' ');
}

// InkBleed's table: threshold 0 = dense fiber, 1 = sparse.
function fiberTable(threshold) {
  const n = 10;
  const ones = Math.max(1, Math.min(n - 1, Math.round((1 - threshold) * n)));
  return Array.from({ length: n }, (_, i) => (i >= n - ones ? 1 : 0)).join(' ');
}

// Grain: 2-octave fractal noise, alpha channel thresholded (NoiseOverlay and
// PaperTexture both threshold the turbulence's own alpha).
const grainFilter = (table, seed) => `
  <feTurbulence type="fractalNoise" baseFrequency="${BASE_FREQ}" numOctaves="2"
                seed="${seed}" stitchTiles="stitch" result="noise"/>
  <feComponentTransfer in="noise" result="grain">
    <feFuncA type="discrete" tableValues="${table}"/>
  </feComponentTransfer>`;

// Fiber: 3-octave fractal noise, luminance into alpha, then thresholded —
// InkBleed's chain.
const fiberFilter = (table, seed) => `
  <feTurbulence type="fractalNoise" baseFrequency="${BASE_FREQ}" numOctaves="3"
                seed="${seed}" stitchTiles="stitch" result="noise"/>
  <feColorMatrix type="matrix" in="noise" result="noiseAlpha"
                 values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0"/>
  <feComponentTransfer in="noiseAlpha" result="grain">
    <feFuncA type="discrete" tableValues="${table}"/>
  </feComponentTransfer>`;

const pageFor = (chain) => `<!doctype html><html><body style="margin:0;background:transparent">
<svg width="${TILE}" height="${TILE}" style="display:block">
  <filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    ${chain}
    <feFlood flood-color="#000" result="ink"/>
    <feComposite in="ink" in2="grain" operator="in"/>
  </filter>
  <rect width="${TILE}" height="${TILE}" filter="url(#f)"/>
</svg></body></html>`;

async function renderTile(page, chain, file) {
  await page.setContent(pageFor(chain));
  const png = await page.locator('svg').screenshot({ omitBackground: true });
  // Hard binary alpha: anything the filter left partly covered at the edge of
  // a device pixel is snapped, matching the discrete table's intent.
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const on = data[i + 3] >= 128;
    data[i] = data[i + 1] = data[i + 2] = 0;
    data[i + 3] = on ? 255 : 0;
  }
  await sharp(data, { raw: info })
    .png({ palette: true, colours: 2, compressionLevel: 9, effort: 10 })
    .toFile(path.join(outDir, file));
  const { size } = await fs.stat(path.join(outDir, file));
  return size;
}

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ deviceScaleFactor: SCALE });

let total = 0;
const suffix = (v) => (v === 0 ? "" : `-v${v}`);
for (const [v, seed] of SEEDS.entries()) {
  for (let c = 0; c <= 100; c += 10) {
    total += await renderTile(page, grainFilter(grainTable(c), seed), `grain-c${c}${suffix(v)}.png`);
  }
  for (let t = 10; t <= 90; t += 10) {
    total += await renderTile(page, fiberFilter(fiberTable(t / 100), seed), `fiber-t${t}${suffix(v)}.png`);
  }
}
await browser.close();
console.log(`Wrote textures to ${path.relative(root, outDir)} (${(total / 1024).toFixed(1)} KB total)`);
