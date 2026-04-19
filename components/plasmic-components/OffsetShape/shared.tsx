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

const LUMA_MATRIX = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0';

export function shapeFilterJSX(id: string, color: string) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feFlood floodColor={color} result="flood" />
      <feComposite in="flood" in2="SourceAlpha" operator="in" />
    </filter>
  );
}

export function imageFilterJSX(id: string, color: string, imageContrast: number) {
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
      if (a > 0.01 && a < 0.99) console.log('[offset] a=', a.toFixed(3), 'x0=', (layersRef.current[0]?.dxSign ?? '?'));

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

    const onEnter = () => { hoveringRef.current = true;  console.log('[offset] enter, activity=', activityRef.current); };
    const onLeave = () => { hoveringRef.current = false; console.log('[offset] leave, activity=', activityRef.current); };

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
