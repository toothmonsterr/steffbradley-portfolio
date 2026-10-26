// Bakes the homepage hero: the animated GIF with PaperTexture's grain applied
// as real transparency, encoded as an animated lossy WebP.
//
//   node scripts/bake-hero.mjs
//
// On the page the GIF sat inside <PaperTexture coverage={65} step={1}>, which
// masked every frame with grain at runtime. Baking the same mask into the file
// removes that work entirely and shrinks the download (876 KB GIF).
//
// Requires the grain tiles from scripts/build-textures.mjs.

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'public/plasmic/toothmonster/images/toothcontactGif.gif');
const OUT = path.join(root, 'public/images/toothcontact-hero.webp');

// Hero as placed in Plasmic: 300 css px wide, PaperTexture coverage 65 (the old
// filter's table rounds that to the 70 tile) and step 1 (tile drawn at 256 css px).
const DISPLAY_WIDTH = 300;
const GRAIN_TILE = path.join(root, 'public/textures/grain-c70.png');
const TILE_CSS = 256;
// Never upscale: the source is already smaller than 2x the display width.
const MAX_WIDTH = 600;
// The GIF stores 0 ms delays, which browsers play at 100 ms. Write that out.
const FRAME_MS = 100;

const meta = await sharp(SRC, { animated: true }).metadata();
const frames = meta.pages ?? 1;
const srcW = meta.width;
const srcH = meta.pageHeight ?? meta.height;
const width = Math.min(MAX_WIDTH, srcW);
const height = Math.round((srcH * width) / srcW);

// Grain mask at the scale it had on screen: one css px of the 300 px-wide
// hero is width / DISPLAY_WIDTH image px.
const tilePx = Math.round((TILE_CSS * width) / DISPLAY_WIDTH);
const tile = await sharp(GRAIN_TILE).resize(tilePx, tilePx, { kernel: 'nearest' })
  .extractChannel('alpha').raw().toBuffer();
const mask = Buffer.alloc(width * height);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    mask[y * width + x] = tile[(y % tilePx) * tilePx + (x % tilePx)] >= 128 ? 255 : 0;
  }
}

const out = Buffer.alloc(width * height * 4 * frames);
for (let i = 0; i < frames; i++) {
  const frame = await sharp(SRC, { page: i })
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const base = i * width * height * 4;
  for (let p = 0; p < width * height; p++) {
    frame.copy(out, base + p * 4, p * 4, p * 4 + 3);
    out[base + p * 4 + 3] = Math.min(frame[p * 4 + 3], mask[p]);
  }
}

await fs.mkdir(path.dirname(OUT), { recursive: true });
await sharp(out, { raw: { width, height: height * frames, channels: 4, pageHeight: height } })
  .webp({
    quality: 70,
    alphaQuality: 100,
    effort: 6,
    loop: meta.loop ?? 0,
    delay: Array(frames).fill(FRAME_MS),
  })
  .toFile(OUT);

const before = (await fs.stat(SRC)).size;
const after = (await fs.stat(OUT)).size;
console.log(
  `${path.relative(root, OUT)}: ${width}x${height}, ${frames} frames, ` +
  `${(after / 1024).toFixed(0)} KB (GIF was ${(before / 1024).toFixed(0)} KB)`,
);
