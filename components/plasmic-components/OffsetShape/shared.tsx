import { useEffect, useRef } from 'react';
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
export function invTable(contrast: number): string {
  const n = 9;
  const k = Math.max(0.1, contrast);
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const shaped = Math.pow(1 - t, 1 / k);
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
export function rotatedDotScreenUri(step: number, dotSizePct: number, _angleDeg: number): string {
  const s = Math.max(2, Math.round(step));
  // dotSizePct can exceed 100 — dots larger than the cell overlap neighbours,
  // simulating heavy/flooded ink. No upper clamp; lower bound keeps r > 0.
  const r = (Math.max(1, dotSizePct) / 100) * (s / 2);
  // A single s×s tile with a centred circle on a transparent background.
  // feTile repeats this pixel-perfectly with no seams, producing clean dots.
  // (Screen-angle rotation is omitted: rotating the tile breaks seamless tiling
  // because the rotated grid's period no longer matches the s×s tile size.)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="black"/></svg>`;
  if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
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
    const angle = SCREEN_ANGLES[layerIndex % SCREEN_ANGLES.length];
    const s = Math.max(2, Math.round(step));
    const uri = rotatedDotScreenUri(s, contrast, angle);
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feImage href={uri} x="0" y="0" width={s} height={s} result="screen" preserveAspectRatio="none" />
        <feTile in="screen" result="tiled" />
        <feComposite in="tiled" in2="SourceAlpha" operator="in" result="dots" />
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
    <filter id={id} colorInterpolationFilters="sRGB">
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
    const angle = SCREEN_ANGLES[layerIndex % SCREEN_ANGLES.length];
    const s = Math.max(2, Math.round(step));
    const screenUri = rotatedDotScreenUri(s, contrast, angle);
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {lumaMask}
        <feImage href={screenUri} x="0" y="0" width={s} height={s} result="screen" preserveAspectRatio="none" />
        <feTile in="screen" result="tiled" />
        {/* Dots clipped by image luminance mask */}
        <feComposite in="tiled" in2="imageMask" operator="in" result="dots" />
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

export type Interaction = 'hover' | 'always' | 'inverse';

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
  const startTsRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const { interaction } = optsRef.current;
    activityRef.current = interaction === 'inverse' ? 1 : 0;
    startTsRef.current = performance.now();

    const writeTransforms = (now: number) => {
      const { offsetX, offsetY, prefersReduced, sizerX, sizerY, sizerRotate, sizerWobble } = optsRef.current;
      const layers = layersRef.current;
      // Clamp to >= 0 — can go negative under React Strict Mode double-invoke
      // when startTsRef is reset by the second mount after the first RAF fired.
      const tSec = Math.max(0, (now - startTsRef.current) / 1000);
      const a = smoothstep(Math.max(0, Math.min(1, activityRef.current)));

      for (const layer of layers) {
        const [bx, by, br] = prefersReduced ? [0, 0, 0] : sampleBreathe(layer.wobble, tSec);
        const mx = layer.dxSign * offsetX + bx;
        const my = layer.dySign * offsetY + by;
        const rx = layer.dxSign * REG;
        const ry = layer.dySign * REG;
        layer.x.set(mx + (rx - mx) * a);
        layer.y.set(my + (ry - my) * a);
        layer.rotate.set(br * (1 - a));
      }

      if (sizerX && sizerY && sizerRotate && sizerWobble) {
        const [bx, by, br] = prefersReduced ? [0, 0, 0] : sampleBreathe(sizerWobble, tSec);
        sizerX.set(bx * (1 - a));
        sizerY.set(by * (1 - a));
        sizerRotate.set(br * (1 - a));
      }
    };

    const tick = (now: number) => {
      const { interaction: ia, easeDuration, prefersReduced } = optsRef.current;
      const restActivity = ia === 'inverse' ? 1 : 0;
      const hoverActivity = ia === 'inverse' ? 0 : 1;
      const easeSec = Math.max(0.05, easeDuration);

      const dt = lastTsRef.current === 0 ? 0 : Math.min(0.1, (now - lastTsRef.current) / 1000);
      lastTsRef.current = now;

      const target = ia === 'always'
        ? restActivity
        : hoveringRef.current ? hoverActivity : restActivity;

      const cur = activityRef.current;
      const delta = dt / easeSec;
      if (cur < target) {
        activityRef.current = Math.min(target, cur + delta);
      } else if (cur > target) {
        activityRef.current = Math.max(target, cur - delta);
      }

      writeTransforms(now);

      if (!prefersReduced) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };

    const startLoop = () => {
      if (rafRef.current) return;
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    writeTransforms(startTsRef.current);
    startLoop();

    const onEnter = () => { hoveringRef.current = true; };
    const onLeave = () => { hoveringRef.current = false; };

    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);

    return () => {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
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

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      const host = hostRef.current;
      const { step, baseDotSize, hoverDotSize, proximityRadius = 150, feather = 0.5, prefersReduced } = optsRef.current;
      const ids = filterIdsRef.current;

      // Don't burn a full SVG build before the mouse has been seen at all.
      if (targetRef.current.x === -9999) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Lerp cursor toward target (same 0.13 factor as CursorShadow).
      curRef.current.x += (targetRef.current.x - curRef.current.x) * 0.13;
      curRef.current.y += (targetRef.current.y - curRef.current.y) * 0.13;

      if (host && ids.length) {
        const rect = host.getBoundingClientRect();
        const w = Math.ceil(rect.width);
        const h = Math.ceil(rect.height);
        // Cursor in element-local coordinates.
        const localX = prefersReduced ? -9999 : curRef.current.x - rect.left;
        const localY = prefersReduced ? -9999 : curRef.current.y - rect.top;

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

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  // Re-mount only when enabled/disabled state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef, filterIds.length]);
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
