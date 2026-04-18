import React, { useEffect, useMemo, useRef } from 'react';
import styles from './GradientBlob.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { findHoverHost } from '@/hooks/findHoverHost';
import { colorOrDefault } from '@/hooks/colorDefault';

export interface GradientBlobProps {
  /** Up to 4 ink colors cycled through the blobs */
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  /** Number of blobs to draw */
  blobCount?: number;
  /** Blur radius in px */
  blurAmount?: number;
  /** Loop duration in seconds */
  loopDuration?: number;
  /** Speed multiplier */
  speed?: number;
  /** Random seed for blob layout — same seed = same layout */
  seed?: number;
  /** Max layer opacity (0–1) */
  maxOpacity?: number;
  /** CSS mix-blend-mode */
  blendMode?: 'normal' | 'multiply' | 'darken' | 'overlay' | 'screen' | 'soft-light' | 'color-burn';
  /** Hard edges — thresholds the blurred composite's alpha for a crisp "gooey" silhouette */
  hardEdges?: boolean;
  /** How crisp the hard edge is (only applies when hardEdges is on). Higher = sharper. */
  hardEdgesContrast?: number;
  className?: string;
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Blob {
  color: string;
  sizePct: number;         // blob diameter as % of container min-dim
  // Waypoints in 0..1 normalised to container size
  xs: number[];
  ys: number[];
  duration: number;        // seconds per loop
  phase: number;           // 0..1 starting phase inside its loop
}

function buildBlobs(colors: string[], count: number, seed: number, baseDuration: number): Blob[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const pts = 4;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let p = 0; p < pts; p++) {
      xs.push(rand());
      ys.push(rand());
    }
    // Close the loop so start == end for seamless looping
    xs.push(xs[0]);
    ys.push(ys[0]);
    return {
      color: colors[i % colors.length] ?? '#FF6A50',
      sizePct: 40 + rand() * 40,
      xs,
      ys,
      duration: baseDuration * (0.7 + rand() * 0.6),
      phase: rand(),
    };
  });
}

// Catmull-Rom-ish interpolation along the waypoint list (linear segments is fine
// for a soft blurred blob — the blur hides any faceting).
function sampleBlobPosition(blob: Blob, t: number): [number, number] {
  const segs = blob.xs.length - 1;        // number of segments
  const u = (t * segs) % segs;
  const i0 = Math.floor(u) % segs;
  const i1 = (i0 + 1) % (segs + 1);
  const localT = u - Math.floor(u);
  const x = blob.xs[i0] + (blob.xs[i1] - blob.xs[i0]) * localT;
  const y = blob.ys[i0] + (blob.ys[i1] - blob.ys[i0]) * localT;
  return [x, y];
}

export function GradientBlob({
  color1,
  color2,
  color3,
  color4,
  blobCount = 4,
  blurAmount = 60,
  loopDuration = 20,
  speed = 1,
  seed = 1,
  maxOpacity = 1,
  blendMode = 'normal',
  hardEdges = false,
  hardEdgesContrast = 18,
  className,
}: GradientBlobProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const prefersReduced = usePrefersReducedMotion();

  const colors = useMemo(
    () => [
      colorOrDefault(color1, '#FF6A50'),
      colorOrDefault(color2, '#DDEA44'),
      colorOrDefault(color3, '#CEBEE3'),
      colorOrDefault(color4, '#FFAB7B'),
    ],
    [color1, color2, color3, color4]
  );

  const effectiveDuration = Math.max(2, loopDuration / Math.max(0.1, speed));

  const blobs = useMemo(
    () => buildBlobs(colors, blobCount, seed, effectiveDuration),
    [colors, blobCount, seed, effectiveDuration]
  );

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const host = findHoverHost(root);
    if (!host) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Offscreen canvas for the unblurred raw blobs. We draw the blobs here first,
    // then blit the whole thing onto the visible canvas with blur (+ optional
    // contrast for the hard-edges "gooey" threshold). This way the contrast
    // operates on the COMPOSITE alpha, not each blob individually, which is
    // what produces the correct metaball silhouette.
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const syncOffscreen = () => {
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
    };
    syncOffscreen();

    const start = performance.now();
    const draw = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      if (offscreen.width !== w || offscreen.height !== h) syncOffscreen();

      // Draw raw, unblurred blobs to the offscreen canvas first.
      offCtx.clearRect(0, 0, w, h);
      offCtx.filter = 'none';

      const elapsed = prefersReduced ? 0 : (now - start) / 1000;
      const minDim = Math.min(w, h);
      for (const blob of blobs) {
        const t = prefersReduced ? blob.phase : ((elapsed / blob.duration) + blob.phase) % 1;
        const [nx, ny] = sampleBlobPosition(blob, t);
        const cx = nx * w;
        const cy = ny * h;
        const radius = (blob.sizePct / 100) * minDim * 0.5;
        offCtx.fillStyle = blob.color;
        offCtx.beginPath();
        offCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        offCtx.fill();
      }

      // Now composite onto the visible canvas with blur, and optionally a
      // contrast pass that thresholds the alpha ramp into a hard edge.
      ctx.clearRect(0, 0, w, h);
      const effectiveBlur = Math.min(blurAmount, Math.min(w, h) / 2);
      ctx.filter = hardEdges
        ? `blur(${effectiveBlur}px) contrast(${Math.max(2, hardEdgesContrast)})`
        : `blur(${effectiveBlur}px)`;
      ctx.drawImage(offscreen, 0, 0);

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [blobs, blurAmount, hardEdges, hardEdgesContrast, prefersReduced]);

  return (
    <div ref={rootRef} className={[styles.root, className ?? ''].filter(Boolean).join(' ')} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{
          opacity: maxOpacity,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      />
    </div>
  );
}
