import React, { useEffect, useMemo, useRef } from 'react';
import styles from './GradientBlob.module.css';
import { useAnimationTier } from '@/hooks/useAnimationTier';
import { colorOrDefault } from '@/hooks/colorDefault';

// The output is a heavy Gaussian blur, so full-resolution pixels are wasted —
// nothing above this frequency survives the filter. Halving each axis is
// visually indistinguishable and quarters the fill cost per frame.
const RENDER_SCALE = 0.5;

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

// Canvas2D `filter` is unsupported on iOS Safari before 18.2 (and desktop
// Safari before 18). Assigning it there is a silent no-op — no throw — so the
// blobs would composite unblurred as hard-edged circles. Probe once by writing
// a filter and reading it back: only a browser that implements the property
// echoes it.
let canvasFilterSupport: boolean | null = null;
function supportsCanvasFilter(): boolean {
  if (canvasFilterSupport !== null) return canvasFilterSupport;
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return (canvasFilterSupport = false);
  probe.filter = 'blur(2px)';
  canvasFilterSupport = probe.filter === 'blur(2px)';
  return canvasFilterSupport;
}

/**
 * Gaussian-ish blur for browsers without Canvas2D `filter`.
 *
 * Repeatedly halves the source into a scratch canvas and scales it back up.
 * Bilinear sampling on each pass is a box blur, and stacked box blurs converge
 * on a Gaussian — enough for an out-of-focus colour wash. Cost is a fraction of
 * a real blur because the intermediate is tiny.
 */
function downsampleBlur(
  dest: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  scratch: HTMLCanvasElement,
  radius: number
) {
  const w = source.width;
  const h = source.height;
  // Each halving contributes ~2px of apparent radius at full size; solve for
  // the shrink factor that lands near the requested radius, floored so the
  // intermediate never collapses to nothing.
  const shrink = Math.max(0.02, Math.min(0.5, 2 / Math.max(1, radius)));
  const sw = Math.max(1, Math.round(w * shrink));
  const sh = Math.max(1, Math.round(h * shrink));

  if (scratch.width !== sw || scratch.height !== sh) {
    scratch.width = sw;
    scratch.height = sh;
  }
  const sCtx = scratch.getContext('2d');
  if (!sCtx) return;

  sCtx.clearRect(0, 0, sw, sh);
  sCtx.imageSmoothingEnabled = true;
  sCtx.imageSmoothingQuality = 'high';
  sCtx.drawImage(source, 0, 0, sw, sh);

  dest.imageSmoothingEnabled = true;
  dest.imageSmoothingQuality = 'high';
  // Two upscale passes soften the residual blockiness of a single stretch.
  dest.globalAlpha = 1;
  dest.drawImage(scratch, 0, 0, sw, sh, 0, 0, w, h);
  dest.globalAlpha = 0.5;
  dest.drawImage(scratch, 0, 0, sw, sh, -1, -1, w + 2, h + 2);
  dest.globalAlpha = 1;
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
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const { prefersReduced, isTouch } = useAnimationTier();

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

    // Backing store is deliberately smaller than the CSS box; the canvas is
    // stretched back to 100% by CSS. Blur radius is scaled to match below so
    // the result is identical.
    const resize = () => {
      canvas.width = Math.max(1, Math.round(root.offsetWidth * RENDER_SCALE));
      canvas.height = Math.max(1, Math.round(root.offsetHeight * RENDER_SCALE));
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

    // Only allocated on browsers that need the manual blur path.
    const hasCanvasFilter = supportsCanvasFilter();
    if (!hasCanvasFilter && !scratchRef.current) {
      scratchRef.current = document.createElement('canvas');
    }
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
      const scaledBlur = blurAmount * RENDER_SCALE;
      const effectiveBlur = Math.min(scaledBlur, Math.min(w, h) / 2);
      if (hasCanvasFilter) {
        ctx.filter = `blur(${effectiveBlur}px)`;
        ctx.drawImage(offscreen, 0, 0);
      } else if (scratchRef.current) {
        ctx.filter = 'none';
        downsampleBlur(ctx, offscreen, scratchRef.current, effectiveBlur);
      }
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

    // A full-canvas Gaussian blur every frame is the most expensive op in the
    // project. On touch the blobs stay as a static gradient wash — and 'hover'
    // could never start the loop there anyway.
    if (prefersReduced || isTouch || animate === 'never') {
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
  }, [blobs, blurAmount, animate, easeDuration, prefersReduced, isTouch]);

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
