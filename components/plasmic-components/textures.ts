// Pre-rendered grain tiles in public/textures, built by
// scripts/build-textures.mjs. These replace live feTurbulence filters: the
// noise is identical, but it is decoded once as an image instead of being
// recomputed per pixel every time the content under it repaints.

/** Tile edge in css px. Must match TILE in scripts/build-textures.mjs. */
export const TEXTURE_TILE = 256;
/** feTurbulence baseFrequency the tiles were rendered at. Must match BASE_FREQ. */
export const TEXTURE_BASE_FREQ = 0.5;

/**
 * Grain tile for a PaperTexture-style coverage (0–100). The old filter
 * thresholded through a 10-step table with Math.round(coverage / 10), so this
 * rounds the same way (65 → 70) and there is one tile per step of 10.
 * NoiseOverlay's "0 1" threshold is coverage 50.
 *
 * `variant` picks one of TILE_VARIANTS independently seeded sheets of noise.
 */
export function grainTileUrl(coverage: number, variant = 0): string {
  const c = Math.max(0, Math.min(100, Math.round(coverage / 10) * 10));
  return `/textures/grain-c${c}${variantSuffix(variant)}.png`;
}

/**
 * InkBleed fiber tile for a noiseThreshold (0–1). Rounds the way the old
 * table did — it counted the passing steps, Math.round((1 - threshold) * 10),
 * clamped to 1–9 — so every threshold picks the tile it used to render.
 */
export function fiberTileUrl(threshold: number, variant = 0): string {
  const ones = Math.max(1, Math.min(9, Math.round((1 - threshold) * 10)));
  return `/textures/fiber-t${100 - ones * 10}${variantSuffix(variant)}.png`;
}

/**
 * Each tile is rendered at four seeds (1, 8, 15, 22 — the seeds the offset
 * components gave layers 0–3). Inside an SVG filter this is how layers get
 * independent grain: a tile there has to sit at the origin, because an
 * feImage shifted by an offset is clipped to the filter region and can miss a
 * small element entirely. CSS masks have no such limit and use tileOffset.
 */
export const TILE_VARIANTS = 4;

function variantSuffix(variant: number): string {
  const v = Math.abs(Math.round(variant)) % TILE_VARIANTS;
  return v === 0 ? '' : `-v${v}`;
}

/** On-screen tile size in css px that reproduces a given baseFrequency. */
export function tileSizeForFrequency(freq: number): number {
  return (TEXTURE_TILE * TEXTURE_BASE_FREQ) / Math.max(0.001, freq);
}

/**
 * Stand-in for a turbulence seed: a different seed is a different sheet of
 * noise, which for a repeating tile is just a different offset into it. The
 * grain only correlates over a few px, so any two offsets more than that apart
 * scatter as independently as two seeds did.
 *
 * Offsets follow the R2 low-discrepancy sequence, so consecutive seeds — the
 * C/M/Y/K plates, or an OffsetImage's two layers — land far apart in both
 * axes rather than lining up. Seed 0 is offset 0.
 */
export function tileOffset(seed: number, size: number): [number, number] {
  const n = Math.abs(Math.round(seed)) % 997;
  return [((n * 0.7548776662) % 1) * size, ((n * 0.5698402910) % 1) * size];
}

/** tileOffset as a CSS mask-position. */
export function seedOffset(seed: number, size: number): string {
  const [x, y] = tileOffset(seed, size);
  return `${x.toFixed(1)}px ${y.toFixed(1)}px`;
}

/**
 * Spread onto every <feTile>. Per the SVG spec a primitive's region defaults
 * to the union of its inputs' regions, and feTile's only input is the single
 * tile image at the origin — so Firefox and Safari "tile" just that one cell
 * (Chrome is lenient and fills the filter region). On anything larger than a
 * tile, or with a filter region reaching past the element (InkBleed's halo),
 * the texture stops at the tile's edge. An explicit huge region makes it fill
 * the whole filter region everywhere; it is clipped to that region, so it
 * costs nothing extra.
 */
export const FE_TILE_FILL = { x: -100000, y: -100000, width: 200000, height: 200000 } as const;
