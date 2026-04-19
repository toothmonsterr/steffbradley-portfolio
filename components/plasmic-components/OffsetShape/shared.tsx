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
  const rand = mulberry32(seed);
  const pt = () => [
    (rand() * 2 - 1) * mag,
    (rand() * 2 - 1) * mag,
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

// Evaluates the "breathing" drift at time t (seconds) using three closed-loop waypoints.
function sampleBreathe(w: number[][], t: number): [number, number, number] {
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
  return [
    p0[0] + (p1[0] - p0[0]) * e,
    p0[1] + (p1[1] - p0[1]) * e,
    p0[2] + (p1[2] - p0[2]) * e,
  ];
}

/**
 * Shared RAF driver for offset-print layers.
 *
 * Maintains a time-based activity ramp (linear 0..1) that eases between the
 * misregistered + breathing state (0) and the snapped/registered state (1)
 * over `easeDuration` seconds. Shapes via smoothstep, writes imperative
 * transforms to each layer's motion values. Gives symmetric ease-in / ease-out
 * on both hover-enter and hover-leave.
 */
export function useOffsetActivity(
  hostRef: React.RefObject<HTMLElement | null>,
  opts: UseOffsetActivityOpts,
) {
  const {
    interaction, offsetX, offsetY, easeDuration, prefersReduced, layers,
    sizerX, sizerY, sizerRotate, sizerWobble,
  } = opts;

  const REG = 0.5;

  const hoveringRef = useRef(false);
  const activityRef = useRef(0);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const startTsRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // rest state: hover/always start at 0 (misregistered+breathing), inverse at 1 (snapped).
    const restActivity = interaction === 'inverse' ? 1 : 0;
    const hoverActivity = interaction === 'inverse' ? 0 : 1;
    activityRef.current = restActivity;

    const easeSec = Math.max(0.05, easeDuration);

    const writeTransforms = (now: number) => {
      const tSec = (now - startTsRef.current) / 1000;
      const a = smoothstep(activityRef.current);

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
      if (startTsRef.current === 0) startTsRef.current = now;
      const dt = lastTsRef.current === 0 ? 0 : Math.min(0.1, (now - lastTsRef.current) / 1000);
      lastTsRef.current = now;

      // In 'always' mode, target is always restActivity (no hover reaction).
      const target = interaction === 'always'
        ? restActivity
        : hoveringRef.current ? hoverActivity : restActivity;
      const delta = dt / easeSec;
      if (activityRef.current < target) {
        activityRef.current = Math.min(target, activityRef.current + delta);
      } else if (activityRef.current > target) {
        activityRef.current = Math.max(target, activityRef.current - delta);
      }

      writeTransforms(now);

      // Keep looping while breathing is visible (activity < 1) OR still settling.
      const breathingVisible = activityRef.current < 1;
      const stillSettling = activityRef.current !== target;
      const shouldContinue = breathingVisible || stillSettling;

      if (shouldContinue && !prefersReduced) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        lastTsRef.current = 0;
      }
    };

    const startLoop = () => {
      if (rafRef.current) return;
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    startTsRef.current = performance.now();
    writeTransforms(startTsRef.current);

    if (prefersReduced) return;

    if (interaction === 'always') {
      // Breathing loop only — no hover listeners.
      startLoop();
      return () => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      };
    }

    const onEnter = () => {
      hoveringRef.current = true;
      startLoop();
    };
    const onLeave = () => {
      hoveringRef.current = false;
      startLoop();
    };
    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);

    // Start the loop once to show the base breathing state.
    startLoop();

    return () => {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [
    hostRef, interaction, offsetX, offsetY, easeDuration, prefersReduced,
    layers, sizerX, sizerY, sizerRotate, sizerWobble,
  ]);
}

// Convenience: create the motion values + LayerSpec for one layer.
export function useLayerMotionValues(dxSign: number, dySign: number, wobble: number[][]): LayerSpec {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  return { dxSign, dySign, wobble, x, y, rotate };
}
