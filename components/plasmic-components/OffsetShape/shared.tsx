import React, { useEffect, useRef } from 'react';
import { useMotionValue, type MotionValue } from 'motion/react';

// ---------------------------------------------------------------------------
// Helpers shared by OffsetShape / OffsetImage / OffsetCMYK
// ---------------------------------------------------------------------------

export function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns 3 waypoints [x, y, rotate] in ±mag, ±mag, ±0.3° — seeded so SSR === CSR.
export function buildWobble(seed: number, mag: number): number[][] {
  const safeMag = (typeof mag === 'number' && isFinite(mag)) ? mag : 1.2;
  const safeSeed = (typeof seed === 'number' && isFinite(seed)) ? seed : 1;
  const rand = mulberry32(safeSeed);
  const pt = () => [
    (rand() * 2 - 1) * safeMag,
    (rand() * 2 - 1) * safeMag,
    (rand() * 2 - 1) * 0.3,
  ];
  return [pt(), pt(), pt()];
}

// feFuncA table values for image-mode luminance → alpha with a contrast curve.
// Negative contrast inverts the curve: light areas get ink instead of dark areas.
export function invTable(contrast: number): string {
  const n = 9;
  const inverted = contrast < 0;
  const k = Math.max(0.1, Math.abs(contrast));
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const shaped = Math.pow(inverted ? t : 1 - t, 1 / k);
    values.push(Math.max(0, Math.min(1, shaped)));
  }
  return values.map((v) => v.toFixed(3)).join(' ');
}

// ---------------------------------------------------------------------------
// SVG filter JSX builders
// ---------------------------------------------------------------------------

export type TintMode = 'shape' | 'image';
export type TextureMode = 'none' | 'noise' | 'halftone';

const LUMA_MATRIX = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0';

// Standard screen angles (index = layer order: 0=C,1=M,2=Y,3=K / A,B,...)
const SCREEN_ANGLES = [15, 30, 45, 60];

// Returns an inline SVG data URI sized exactly step×step, pre-rasterised with
// a rotated halftone dot centred in the cell. feTile in the filter repeats this
// tile so the visual frequency is exactly 1 dot per step×step px.
//
// Rotation at non-45° angles means the dot grid origin shifts — we compensate
// by filling a step×step viewport with a rotated *pattern* that has multiple
// dots so no cell ever clips at the edges. The canvas is sqrt(2)× oversize
// (covers the diagonal) so we can rotate without blank corners, then the SVG
// viewBox crops back to step×step.
// Generates a full w×h SVG with a rotated halftone dot grid.
// Used by feImage sized to the full filter region — no feTile needed.
export function buildHalftoneSVG(w: number, h: number, step: number, dotSizePct: number, angleDeg: number): string {
  const s    = Math.max(2, step);
  const r    = (Math.max(1, dotSizePct) / 100) * (s / 2);
  const rad  = (angleDeg * Math.PI) / 180;
  const cos  = Math.cos(rad);
  const sin  = Math.sin(rad);
  const diag = Math.ceil(Math.hypot(w, h));
  // Number of cells needed to cover the diagonal in each grid axis direction
  const n    = Math.ceil(diag / s) + 2;
  const cx   = w / 2;
  const cy   = h / 2;

  const circles: string[] = [];
  for (let gi = -n; gi <= n; gi++) {
    for (let gj = -n; gj <= n; gj++) {
      const px = cx + cos * gi * s - sin * gj * s;
      const py = cy + sin * gi * s + cos * gj * s;
      if (px + r < 0 || px - r > w || py + r < 0 || py - r > h) continue;
      circles.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${r.toFixed(2)}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g fill="black">${circles.join('')}</g></svg>`;
  if (typeof btoa !== 'undefined') return `data:image/svg+xml;base64,${btoa(svg)}`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Legacy alias used by the hover proximity builder (proximity SVG is already full-size).
export function rotatedDotScreenUri(step: number, dotSizePct: number, _angleDeg: number): string {
  const s = Math.max(2, Math.round(step));
  const r = (Math.max(1, dotSizePct) / 100) * (s / 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="black"/></svg>`;
  if (typeof btoa !== 'undefined') return `data:image/svg+xml;base64,${btoa(svg)}`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// contrast 0–100: maps to how many of 10 discrete steps pass (higher = more ink).
// e.g. contrast=50 → "0 0 0 0 0 1 1 1 1 1", contrast=80 → "0 0 1 1 1 1 1 1 1 1"
function noiseTableValues(contrast: number): string {
  const n = 10;
  const ones = Math.round(Math.max(1, Math.min(n - 1, (contrast / 100) * n)));
  return Array.from({ length: n }, (_, i) => (i >= n - ones ? 1 : 0)).join(' ');
}

export function shapeFilterJSX(
  id: string, color: string,
  texture: TextureMode = 'none',
  layerIndex = 0,
  step = 4, contrast = 60,
) {
  if (texture === 'halftone') {
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {/* href populated imperatively by useHalftoneScreen after mount */}
        <feImage href="" x="0%" y="0%" width="100%" height="100%" result="screen" preserveAspectRatio="none" />
        <feComposite in="screen" in2="SourceAlpha" operator="in" result="dots" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="dots" operator="in" />
      </filter>
    );
  }

  if (texture === 'noise') {
    const freq = (0.4 / Math.max(1, step)).toFixed(4);
    const tv = noiseTableValues(contrast);
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2"
                      seed={layerIndex * 7 + 1} stitchTiles="stitch" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
        <feComponentTransfer in="grey" result="grain">
          <feFuncR type="discrete" tableValues={tv} />
          <feFuncG type="discrete" tableValues={tv} />
          <feFuncB type="discrete" tableValues={tv} />
          <feFuncA type="discrete" tableValues={tv} />
        </feComponentTransfer>
        <feComposite in="grain" in2="SourceAlpha" operator="in" result="maskedGrain" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="maskedGrain" operator="in" />
      </filter>
    );
  }

  return (
    <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
      <feFlood floodColor={color} result="flood" />
      <feComposite in="flood" in2="SourceAlpha" operator="in" />
    </filter>
  );
}

export function imageFilterJSX(
  id: string, color: string, imageContrast: number,
  texture: TextureMode = 'none',
  layerIndex = 0,
  step = 4, contrast = 60,
) {
  // Luminance mask: dark areas of the image = more ink
  const lumaMask = (
    <>
      <feColorMatrix type="matrix" values={LUMA_MATRIX} result="luma" />
      <feComponentTransfer in="luma" result="lumaMasked">
        <feFuncA type="table" tableValues={invTable(imageContrast)} />
      </feComponentTransfer>
      <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="imageMask" />
    </>
  );

  if (texture === 'halftone') {
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {lumaMask}
        {/* href populated imperatively by useHalftoneScreen after mount */}
        <feImage href="" x="0%" y="0%" width="100%" height="100%" result="screen" preserveAspectRatio="none" />
        <feComposite in="screen" in2="imageMask" operator="in" result="dots" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="dots" operator="in" />
      </filter>
    );
  }

  if (texture === 'noise') {
    const freq = (0.4 / Math.max(1, step)).toFixed(4);
    const tv = noiseTableValues(contrast);
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {lumaMask}
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2"
                      seed={layerIndex * 7 + 1} stitchTiles="stitch" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
        <feComponentTransfer in="grey" result="grain">
          <feFuncR type="discrete" tableValues={tv} />
          <feFuncG type="discrete" tableValues={tv} />
          <feFuncB type="discrete" tableValues={tv} />
          <feFuncA type="discrete" tableValues={tv} />
        </feComponentTransfer>
        {/* Grain clipped by image luminance mask */}
        <feComposite in="grain" in2="imageMask" operator="in" result="maskedGrain" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="maskedGrain" operator="in" />
      </filter>
    );
  }

  // none
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={LUMA_MATRIX} result="luma" />
      <feComponentTransfer in="luma" result="lumaMasked">
        <feFuncA type="table" tableValues={invTable(imageContrast)} />
      </feComponentTransfer>
      <feComposite in="lumaMasked" in2="SourceAlpha" operator="in" result="masked" />
      <feFlood floodColor={color} result="flood" />
      <feComposite in="flood" in2="masked" operator="in" />
    </filter>
  );
}

// ---------------------------------------------------------------------------
// Activity ramp (shared RAF driver)
// ---------------------------------------------------------------------------

export type Interaction = 'hover' | 'always' | 'inverse' | 'click';

export interface LayerSpec {
  dxSign: number;
  dySign: number;
  wobble: number[][];
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
}

export interface UseOffsetActivityOpts {
  interaction: Interaction;
  offsetX: number;
  offsetY: number;
  easeDuration: number;
  prefersReduced: boolean;
  /** Minimum ms between rendered frames (0 = uncapped). Throttles the
   *  breathing wobble to ~30fps on touch, where it runs on a dozen-plus
   *  layers at once. */
  frameInterval?: number;
  /** Disables the continuous breathing wobble, leaving only the
   *  hover/click misregistration ease. Set for OffsetCMYK on touch: each
   *  wobble frame there re-renders four SVG filter chains for sub-pixel
   *  movement nobody can see. */
  staticWobble?: boolean;
  layers: LayerSpec[];
  sizerX?: MotionValue<number>;
  sizerY?: MotionValue<number>;
  sizerRotate?: MotionValue<number>;
  sizerWobble?: number[][];
}

function smoothstep(x: number) {
  return x * x * (3 - 2 * x);
}

function sampleBreathe(w: number[][], t: number): [number, number, number] {
  if (!w || w.length < 3 || !w[0] || !w[1] || !w[2]) return [0, 0, 0];
  const period = 3.2;
  const u = (t % period) / period;
  const segs = 3;
  const idx = u * segs;
  const i0 = Math.floor(idx) % segs;
  const i1 = (i0 + 1) % segs;
  const local = idx - Math.floor(idx);
  const e = smoothstep(local);
  const p0 = w[i0];
  const p1 = w[i1];
  if (!p0 || !p1) { console.error('[sampleBreathe] bad index i0=', i0, 'i1=', i1, 'u=', u, 't=', t, 'w=', JSON.stringify(w)); return [0,0,0]; }
  return [
    p0[0] + (p1[0] - p0[0]) * e,
    p0[1] + (p1[1] - p0[1]) * e,
    p0[2] + (p1[2] - p0[2]) * e,
  ];
}

const REG = 0.5;

/**
 * Shared RAF driver for offset-print layers.
 *
 * Scalar props (offsetX/Y, easeDuration, interaction, prefersReduced) are read
 * via optsRef so they update without restarting the loop. The layers array is
 * snapshotted at effect-mount time — LayerSpec objects are stable refs (via
 * useLayerMotionValues), so the snapshot always points to the live motion values
 * and wobble data even as renders update them in place.
 */
export function useOffsetActivity(
  hostRef: React.RefObject<HTMLElement | null>,
  opts: UseOffsetActivityOpts,
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Stable ref to the layers array — never replaced after init.
  // Each LayerSpec inside is itself a stable ref (from useLayerMotionValues),
  // so wobble/dxSign/dySign and the motion values always reflect the latest render.
  const layersRef = useRef<LayerSpec[]>(opts.layers);

  const hoveringRef = useRef(false);
  const activityRef = useRef(0);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const { interaction } = optsRef.current;
    activityRef.current = interaction === 'inverse' ? 1 : 0;
    // click mode: hoveringRef acts as a toggle — true = active, false = rest
    const clickedRef = { current: false };
    // Virtual playback time for the breathing wobble — only advances while
    // in viewport, so pausing off-screen doesn't cause a phase jump on return.
    let elapsed = 0;
    let inViewport = true;

    // Returns true if it actually wrote a change. Motion values are cheap to
      const { offsetX, offsetY, prefersReduced, staticWobble, sizerX, sizerY, sizerRotate, sizerWobble } = optsRef.current;
      const noWobble = prefersReduced || staticWobble;
    // filter chains) forces the whole filter to re-render, so skipping
    // no-op writes is what keeps that component off the main thread.
    const EPS = 0.01;
    const writeTransforms = (tSec: number) => {
      const { offsetX, offsetY, prefersReduced, sizerX, sizerY, sizerRotate, sizerWobble } = optsRef.current;
      const layers = layersRef.current;
      const a = smoothstep(Math.max(0, Math.min(1, activityRef.current)));
      let changed = false;

      for (const layer of layers) {
        const [bx, by, br] = noWobble ? [0, 0, 0] : sampleBreathe(layer.wobble, tSec);
        const mx = layer.dxSign * offsetX + bx;
        const my = layer.dySign * offsetY + by;
        const rx = layer.dxSign * REG;
        const ry = layer.dySign * REG;
        const nx = mx + (rx - mx) * a;
        const ny = my + (ry - my) * a;
        const nr = br * (1 - a);
        if (Math.abs(nx - layer.x.get()) > EPS) { layer.x.set(nx); changed = true; }
        if (Math.abs(ny - layer.y.get()) > EPS) { layer.y.set(ny); changed = true; }
        if (Math.abs(nr - layer.rotate.get()) > EPS) { layer.rotate.set(nr); changed = true; }
      }

      if (sizerX && sizerY && sizerRotate && sizerWobble) {
        const [bx, by, br] = noWobble ? [0, 0, 0] : sampleBreathe(sizerWobble, tSec);
        const nx = bx * (1 - a);
        const ny = by * (1 - a);
        const nr = br * (1 - a);
        if (Math.abs(nx - sizerX.get()) > EPS) { sizerX.set(nx); changed = true; }
        if (Math.abs(ny - sizerY.get()) > EPS) { sizerY.set(ny); changed = true; }
        if (Math.abs(nr - sizerRotate.get()) > EPS) { sizerRotate.set(nr); changed = true; }
      }

      return changed;
    };

    const tick = (now: number) => {
      const { interaction: ia, easeDuration, prefersReduced, frameInterval = 0 } = optsRef.current;

      // Throttled tier: skip this frame's work but keep the loop alive so
      // easing still completes. dt is measured from the last *rendered* frame,
      // so the motion stays time-correct rather than running slow.
      if (frameInterval > 0 && lastTsRef.current !== 0 && now - lastTsRef.current < frameInterval) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const restActivity = ia === 'inverse' ? 1 : 0;
      const hoverActivity = ia === 'inverse' ? 0 : 1;
      const easeSec = Math.max(0.05, easeDuration);

      const dt = lastTsRef.current === 0 ? 0 : Math.min(0.1, (now - lastTsRef.current) / 1000);
      lastTsRef.current = now;

      const target = ia === 'always'
        ? restActivity
        : (ia === 'click' ? clickedRef.current : hoveringRef.current) ? hoverActivity : restActivity;

      const cur = activityRef.current;
      const delta = dt / easeSec;
      if (cur < target) {
        activityRef.current = Math.min(target, cur + delta);
      } else if (cur > target) {
        activityRef.current = Math.max(target, cur - delta);
      }

      const wobbleRunning = !prefersReduced && !optsRef.current.staticWobble;
      if (wobbleRunning) elapsed += dt;
      const changed = writeTransforms(elapsed);
      const settling = activityRef.current !== target;

      // Keep going while the wobble is animating, while the hover/click ease
      // is still settling, or while the last write actually moved something.
      // Otherwise idle out — with staticWobble there is nothing to animate at
      // rest, so the loop must not spin (each frame would re-render four SVG
      // filter chains on OffsetCMYK).
      if (inViewport && (wobbleRunning || settling || changed)) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        lastTsRef.current = 0;
      }
    };

    const startLoop = () => {
      if (rafRef.current || !inViewport) return;
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    writeTransforms(elapsed);
    startLoop();
    // Pause the RAF loop entirely while scrolled out of view — the last
    // written transforms persist, so there is nothing jarring on return.
    const io = new IntersectionObserver((entries) => {
      inViewport = entries[0].isIntersecting;
      // The dataset flag drives `will-change: transform` on the ink layers.
      // Promoting a dozen-plus composite layers for the whole page life is
      // real GPU memory pressure on a phone, so only hint while on screen.
      if (inViewport) {
        host.dataset.offsetActive = 'true';
        startLoop();
      } else {
        delete host.dataset.offsetActive;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    }, { threshold: 0 });
    io.observe(host);

    // startLoop is required here: the loop now idles out when nothing is
    // changing, so hover has to wake it rather than relying on it spinning.
    const onEnter = () => { hoveringRef.current = true; startLoop(); };
    const onLeave = () => { hoveringRef.current = false; startLoop(); };
    const onClick = () => { clickedRef.current = !clickedRef.current; startLoop(); };

    if (optsRef.current.interaction === 'click') {
      host.addEventListener('click', onClick);
      host.addEventListener('touchend', onClick, { passive: true });
    } else {
      host.addEventListener('mouseenter', onEnter);
      host.addEventListener('mouseleave', onLeave);
    }

    return () => {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
      host.removeEventListener('click', onClick);
      host.removeEventListener('touchend', onClick);
      io.disconnect();
      delete host.dataset.offsetActive;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      lastTsRef.current = 0;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef]);
}

// ---------------------------------------------------------------------------
// Halftone proximity effect
// ---------------------------------------------------------------------------

// Builds a full-element SVG where each dot's radius is sized by its distance
// from the (lerped) cursor. Mirrors the radial formula from CursorShadow:
//   t = 1 - dist/radius  (1 at cursor, 0 at edge of proximity zone)
//   dotPct = base + (hover - base) * sqrt(t)   ← sqrt gives smooth falloff
function buildProximityHalftoneSVG(
  w: number, h: number, step: number,
  baseDotSize: number, hoverDotSize: number,
  cursorX: number, cursorY: number,
  radius: number, feather: number,
): string {
  const half    = step / 2;
  const baseR   = (Math.max(1, baseDotSize) / 100) * half;
  const baseStr = baseR.toFixed(2);   // pre-formatted for the common case
  const parts: string[] = [];

  for (let gy = 0; gy * step <= h; gy++) {
    for (let gx = 0; gx * step <= w; gx++) {
      const px = gx * step + half;
      const py = gy * step + half;
      // AABB fast-reject: if either axis alone exceeds radius the dot is
      // guaranteed outside the circle, so skip the more expensive hypot.
      const dxAbs = Math.abs(px - cursorX);
      const dyAbs = Math.abs(py - cursorY);
      if (dxAbs > radius || dyAbs > radius) {
        parts.push(`<circle cx="${px}" cy="${py}" r="${baseStr}"/>`);
      } else {
        const dist    = Math.hypot(dxAbs, dyAbs);
        const t       = Math.max(0, 1 - dist / radius);
        const dotPct  = baseDotSize + (hoverDotSize - baseDotSize) * Math.pow(t, feather);
        const r       = (Math.max(1, dotPct) / 100) * half;
        parts.push(`<circle cx="${px}" cy="${py}" r="${r.toFixed(2)}"/>`);
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g fill="black">${parts.join('')}</g></svg>`;
  if (typeof btoa !== 'undefined') return `data:image/svg+xml;base64,${btoa(svg)}`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Drives per-dot halftone sizing based on cursor proximity.
 * Each dot's radius is computed from its distance to the cursor, so the effect
 * follows the cursor spatially rather than scaling the whole pattern uniformly.
 *
 * Generates a full-element SVG each frame and sets it as the feImage source
 * (sized to the element, so feTile shows it exactly once with no repeat seam).
 *
 * filterIds: IDs of the <filter> elements whose <feImage> to update.
 * Pass an empty array to disable.
 */
export function useHalftoneProximity(
  hostRef: React.RefObject<HTMLElement | null>,
  filterIds: string[],
  opts: {
    step: number;
    baseDotSize: number;
    hoverDotSize: number;
    /** px radius over which the effect ramps (default 150) */
    proximityRadius?: number;
    /** Falloff curve exponent — 0.5 = wide soft halo, 1 = linear, 2+ = tight concentrated spot (default 0.5) */
    feather?: number;
    prefersReduced?: boolean;
  },
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // target = raw mouse position, cur = lerped position (mirrors CursorShadow).
  const targetRef = useRef({ x: -9999, y: -9999 });
  const curRef    = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(0);
  const filterIdsRef = useRef(filterIds);
  filterIdsRef.current = filterIds;
  // Track last rendered state so we skip regeneration when nothing changed.
  const prevRef = useRef({ x: NaN, y: NaN, w: 0, h: 0 });

  useEffect(() => {
    if (!filterIds.length) return;
    // No cursor on touch-only devices — skip entirely so mobile pays nothing.
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;
    // Reduced motion — skip the mousemove listener and RAF loop entirely
    // rather than running them forever with the cursor parked off-canvas.
    if (opts.prefersReduced) return;

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Rebuilding a few thousand <circle>s and base64-encoding them is by far
    // the most expensive per-frame work in the project — never do it for an
    // element that isn't on screen.
    let inViewport = true;

    const tick = () => {
      const host = hostRef.current;
      const { step, baseDotSize, hoverDotSize, proximityRadius = 150, feather = 0.5 } = optsRef.current;
      const ids = filterIdsRef.current;

      // Don't burn a full SVG build before the mouse has been seen at all.
      if (targetRef.current.x === -9999) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Lerp cursor toward target (same 0.13 factor as CursorShadow).
      curRef.current.x += (targetRef.current.x - curRef.current.x) * 0.13;
      curRef.current.y += (targetRef.current.y - curRef.current.y) * 0.13;

      if (inViewport && host && ids.length) {
        const rect = host.getBoundingClientRect();
        const w = Math.ceil(rect.width);
        const h = Math.ceil(rect.height);
        // Cursor in element-local coordinates.
        const localX = curRef.current.x - rect.left;
        const localY = curRef.current.y - rect.top;

        const prev = prevRef.current;
        const moved = Math.abs(localX - prev.x) > 0.3 || Math.abs(localY - prev.y) > 0.3;
        const resized = w !== prev.w || h !== prev.h;

        if ((moved || resized) && w > 0 && h > 0) {
          prevRef.current = { x: localX, y: localY, w, h };
          const uri = buildProximityHalftoneSVG(w, h, step, baseDotSize, hoverDotSize, localX, localY, proximityRadius, feather);
          for (const id of ids) {
            const feImage = document.getElementById(id)?.querySelector('feImage');
            if (feImage) {
              feImage.setAttribute('href', uri);
              feImage.setAttribute('width', String(w));
              feImage.setAttribute('height', String(h));
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    startLoop();

    // Pause entirely while scrolled out of view. The last built SVG persists,
    // and the cursor is re-sampled on the next frame, so there's nothing
    // jarring on return.
    const io = new IntersectionObserver((entries) => {
      inViewport = entries[0].isIntersecting;
      if (inViewport) startLoop();
      else stopLoop();
    }, { threshold: 0 });
    if (hostRef.current) io.observe(hostRef.current);

    return () => {
      window.removeEventListener('mousemove', onMove);
      io.disconnect();
      stopLoop();
    };
  // Re-mount only when enabled/disabled state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef, filterIds.length, opts.prefersReduced]);
}

/**
 * Populates the feImage href for halftone filters with a full-size rotated dot
 * grid SVG, measured from the host element. Re-runs on resize.
 *
 * filterIds: array of filter element IDs whose first <feImage> to populate.
 * Each entry maps to one layer angle via SCREEN_ANGLES[index].
 */
export function useHalftoneScreen(
  hostRef: React.RefObject<HTMLElement | null>,
  filterIds: string[],
  opts: { step: number; contrast: number; prefersReduced?: boolean },
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const filterIdsRef = useRef(filterIds);
  filterIdsRef.current = filterIds;
  const updateRef = useRef<() => void>(() => undefined);

  // Mount/resize effect — sets up ResizeObserver once
  useEffect(() => {
    if (!filterIds.length) return;

    const update = () => {
      const host = hostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      if (w === 0 || h === 0) return;
      const { step, contrast } = optsRef.current;
      for (let i = 0; i < filterIdsRef.current.length; i++) {
        const id = filterIdsRef.current[i];
        const angle = SCREEN_ANGLES[i % SCREEN_ANGLES.length];
        const uri = buildHalftoneSVG(w, h, step, contrast, angle);
        const feImage = document.getElementById(id)?.querySelector('feImage');
        if (feImage) {
          feImage.setAttribute('href', uri);
          feImage.setAttribute('width', String(w));
          feImage.setAttribute('height', String(h));
          feImage.setAttribute('x', '0');
          feImage.setAttribute('y', '0');
        }
      }
    };

    updateRef.current = update;
    update();
    let debounceTimer = 0;
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(update, 150);
    };
    const ro = new ResizeObserver(debouncedUpdate);
    if (hostRef.current) ro.observe(hostRef.current);
    return () => { ro.disconnect(); clearTimeout(debounceTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef, filterIds.length]);

  // Re-render screen when step or contrast change without remounting the observer
  useEffect(() => {
    updateRef.current();
  }, [opts.step, opts.contrast]);
}

// Convenience: create the motion values + LayerSpec for one layer.
// useRef keeps the object identity stable across renders.
export function useLayerMotionValues(dxSign: number, dySign: number, wobble: number[][]): LayerSpec {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const specRef = useRef<LayerSpec>({ dxSign, dySign, wobble, x, y, rotate });
  specRef.current.dxSign = dxSign;
  specRef.current.dySign = dySign;
  specRef.current.wobble = wobble;
  return specRef.current;
}
