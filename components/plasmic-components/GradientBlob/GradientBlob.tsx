import React, { useEffect, useMemo, useRef } from 'react';
import styles from './GradientBlob.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
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
  /**
   * When true (default), the blend mode only affects content within this
   * component (via `isolation: isolate`). When false, the blobs blend with
   * whatever is behind the component on the page.
   */
  isolateBlend?: boolean;
  /**
   * When the blobs animate:
   *   never  — static, one draw (cheapest)
   *   hover  — loops while the host is hovered; eases to a stop when the cursor leaves
   *   always — continuous loop
   */
  animate?: 'never' | 'hover' | 'always';
  /** Ease-in/ease-out duration (seconds) for start/stop in hover mode */
  easeDuration?: number;
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
  sizePct: number;
  xs: number[];
  ys: number[];
  duration: number;
  phase: number;
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

// Linear waypoint interpolation (blur hides any faceting).
function sampleBlobPosition(blob: Blob, t: number): [number, number] {
  const segs = blob.xs.length - 1;
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
  isolateBlend = true,
  animate = 'always',
  easeDuration = 0.8,
  className,
}: GradientBlobProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = root.offsetWidth;
      canvas.height = root.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      renderFrame();
    });
    ro.observe(root);

    // Offscreen canvas for raw unblurred blobs — composited onto visible canvas
    // with blur applied, so contrast/blur operate on the combined alpha.
    // Persisted in a ref so it survives effect re-runs (prop changes).
    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas');
    const offscreen = offscreenRef.current;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    const syncOffscreen = () => {
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
    };
    syncOffscreen();

    // ── Animation state ─────────────────────────────────────────────────
    // elapsed = virtual "playback time" for the blob loop. It only advances
    // when playbackRate > 0, which is what lets us preserve loop continuity
    // across hover pause/resume.
    let elapsed = 0;
    let playbackRate = animate === 'always' ? 1 : 0;
    let hovered = false;
    let inViewport = true;
    const easeSec = Math.max(0.05, easeDuration);
    let lastNow = performance.now();

    // Smoothstep for a gentle ease-in / ease-out as playbackRate
    // lerps toward its target (0 or 1).
    const smoothstep = (x: number) => x * x * (3 - 2 * x);

    const renderFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;
      if (offscreen.width !== w || offscreen.height !== h) syncOffscreen();

      offCtx.clearRect(0, 0, w, h);
      offCtx.filter = 'none';

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

      ctx.clearRect(0, 0, w, h);
      const effectiveBlur = Math.min(blurAmount, Math.min(w, h) / 2);
      ctx.filter = `blur(${effectiveBlur}px)`;
      ctx.drawImage(offscreen, 0, 0);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastNow) / 1000); // clamp big jumps (tab switches)
      lastNow = now;

      // Ease the playbackRate toward its target. In hover mode the target
      // depends on whether we're currently hovered; in always mode it's just 1.
      const target = animate === 'always' ? 1 : (hovered ? 1 : 0);
      // Approach target at a rate that covers 0→1 in ~easeSec seconds.
      const delta = dt / easeSec;
      if (playbackRate < target) {
        playbackRate = Math.min(target, playbackRate + delta);
      } else if (playbackRate > target) {
        playbackRate = Math.max(target, playbackRate - delta);
      }

      // Advance virtual elapsed time by the shaped rate (so the loop itself
      // accelerates/decelerates smoothly, preserving continuity).
      // Skip advancement while off-screen — the last rendered frame persists.
      if (!prefersReduced && inViewport) {
        elapsed += dt * smoothstep(playbackRate);
      }

      if (inViewport) renderFrame();

      // Keep looping while animating or still easing out
      if (playbackRate > 0 || target > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };

    const startLoop = () => {
      if (rafRef.current) return;
      lastNow = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    };

    // Initial render — shows at least one frame even in 'never' mode
    renderFrame();

    if (prefersReduced || animate === 'never') {
      return () => ro.disconnect();
    }

    // Pause the loop's virtual time while scrolled out of view — the last
    // rendered frame persists so there's nothing jarring when we return.
    const io = new IntersectionObserver((entries) => {
      inViewport = entries[0].isIntersecting;
      if (inViewport) startLoop();
    }, { threshold: 0 });
    io.observe(root);

    if (animate === 'always') {
      startLoop();
      return () => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        ro.disconnect();
        io.disconnect();
      };
    }

    // animate === 'hover'
    const onEnter = () => { hovered = true; startLoop(); };
    const onLeave = () => { hovered = false; startLoop(); };
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    return () => {
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      ro.disconnect();
      io.disconnect();
    };
  }, [blobs, blurAmount, animate, easeDuration, prefersReduced]);

  return (
    <div
      ref={rootRef}
      className={[styles.root, className ?? ''].filter(Boolean).join(' ')}
      aria-hidden="true"
      style={{ isolation: isolateBlend ? 'isolate' : 'auto' }}
    >
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
