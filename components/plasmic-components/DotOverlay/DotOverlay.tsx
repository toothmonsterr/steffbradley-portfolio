import React, { useEffect, useRef } from 'react';
import styles from './DotOverlay.module.css';
import { findHoverHost } from '@/hooks/findHoverHost';
import { colorOrDefault } from '@/hooks/colorDefault';
import { useAnimationTier } from '@/hooks/useAnimationTier';

export interface DotOverlayProps {
  /** First dot color (at cursor) */
  dotColorA?: string;
  /** Second dot color (far from cursor) */
  dotColorB?: string;
  /** Grid cell size in px */
  step?: number;
  /** Minimum dot radius as % of cell (0–100). Applies far from the cursor / at rest. */
  dotEdgeMin?: number;
  /** Maximum dot radius as % of cell (0–100). Applies at the cursor. */
  dotEdgeMax?: number;
  /** Radius in px over which dot size falls off from max → min */
  falloffRadius?: number;
  /**
   * Overall zoom. Multiplies `step` and `falloffRadius` in tandem so the whole
   * effect scales uniformly — 0.5 = tiny dense dots; 2 = chunky spread-out dots.
   */
  scale?: number;
  /** Max layer opacity (0–1) */
  maxOpacity?: number;
  /** CSS mix-blend-mode */
  blendMode?: 'normal' | 'multiply' | 'darken' | 'overlay' | 'screen' | 'soft-light' | 'color-burn';
  /**
   * When true, the blend mode only affects content within this component
   * (via `isolation: isolate`). When false (default), the dots blend with
   * whatever is behind the overlay on the page.
   */
  isolateBlend?: boolean;
  /** hover: activate on host hover. always: always on. never: hidden. */
  trigger?: 'hover' | 'always' | 'never';
  /** Ease-in / ease-out duration (seconds) for the cursor activity ramp */
  easeDuration?: number;
  className?: string;
}

function parseColor(str: string): [number, number, number] {
  const h6 = str.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (h6) return [parseInt(h6[1], 16), parseInt(h6[2], 16), parseInt(h6[3], 16)];
  const h3 = str.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (h3) return [parseInt(h3[1] + h3[1], 16), parseInt(h3[2] + h3[2], 16), parseInt(h3[3] + h3[3], 16)];
  const m = str.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  return [0, 0, 0];
}
function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

export const DotOverlay = React.memo(function DotOverlay({
  dotColorA,
  dotColorB,
  step = 14,
  dotEdgeMin = 15,
  dotEdgeMax = 45,
  falloffRadius = 180,
  scale = 1,
  maxOpacity = 1,
  blendMode = 'normal',
  isolateBlend = false,
  trigger = 'hover',
  easeDuration = 0.45,
  className,
}: DotOverlayProps) {
  const resolvedColorA = colorOrDefault(dotColorA, '#FF6A50');
  const resolvedColorB = colorOrDefault(dotColorB, '#DDEA44');
  const effectiveStep = Math.max(2, step * Math.max(0.1, scale));
  const effectiveFalloff = Math.max(1, falloffRadius * Math.max(0.1, scale));

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(false);
  const rafRef = useRef(0);
  // Eased cursor position (lerped toward the true pointer so movement feels smooth)
  const curRef = useRef({ x: -9999, y: -9999 });
  const targetRef = useRef({ x: -9999, y: -9999 });
  // Linear activity ramp 0..1 (time-based). 1 = fully hovered, 0 = at rest.
  const activityRef = useRef(0);
  const hoveringRef = useRef(false);
  const { prefersReduced, isTouch } = useAnimationTier();

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || trigger === 'never') return;
    const host = findHoverHost(root);
    if (!host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colA = parseColor(resolvedColorA);
    const colB = parseColor(resolvedColorB);
    const minR = (Math.max(0, Math.min(100, dotEdgeMin)) / 100) * (effectiveStep / 2);
    const maxR = (Math.max(0, Math.min(100, dotEdgeMax)) / 100) * (effectiveStep / 2);

    // Smoothstep: symmetric ease-in and ease-out
    const smoothstep = (x: number) => x * x * (3 - 2 * x);

    // Sentinels to skip re-paint when nothing has changed since last frame.
    let lastActivity = -1;
    let lastCurX = NaN;
    let lastCurY = NaN;

    // Pure render — reads curRef + activityRef and paints one frame.
    const render = () => {
      const { width: w, height: h } = canvas;
      if (w === 0 || h === 0) return;

      const curActivity = activityRef.current;
      const curX = curRef.current.x;
      const curY = curRef.current.y;
      if (curActivity === lastActivity && curX === lastCurX && curY === lastCurY) return;
      lastActivity = curActivity;
      lastCurX = curX;
      lastCurY = curY;

      ctx.clearRect(0, 0, w, h);

      const a = smoothstep(activityRef.current);
      const { x: cx, y: cy } = curRef.current;
      const half = effectiveStep / 2;

      for (let gx = half; gx < w + half; gx += effectiveStep) {
        for (let gy = half; gy < h + half; gy += effectiveStep) {
          // Cursor-proximity factor (0..1). Only meaningful when we actually have
          // a cursor position — guarded by the sentinel below.
          let proximity = 0;
          if (cx > -100) {
            const dist = Math.hypot(gx - cx, gy - cy);
            proximity = Math.max(0, 1 - dist / effectiveFalloff);
          }
          // Blend proximity by activity: at activity=0 every dot is at min
          // (base state); at activity=1 the cursor's proximity fully drives
          // the dot size + color lerp.
          const t = proximity * a;
          const r = minR + (maxR - minR) * t;
          if (r < 0.3) continue;
          ctx.fillStyle = lerpColor(colA, colB, 1 - t);
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const resize = () => {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
      // Invalidate sentinels so the first frame after resize always repaints.
      lastActivity = -1;
      render();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Time-based activity ramp. Advances linearly over easeDuration seconds
    // toward target (1 hovered, 0 idle); the render shapes through smoothstep.
    // Cursor position is also eased each frame so the proximity spotlight moves
    // smoothly.
    let lastTickTs = 0;
    const easeSec = Math.max(0.05, easeDuration);

    const tick = (now: number) => {
      const dt = lastTickTs === 0 ? 0 : Math.min(0.1, (now - lastTickTs) / 1000);
      lastTickTs = now;

      // Activity toward target
      const target = hoveringRef.current ? 1 : 0;
      const delta = dt / easeSec;
      if (activityRef.current < target) {
        activityRef.current = Math.min(target, activityRef.current + delta);
      } else if (activityRef.current > target) {
        activityRef.current = Math.max(target, activityRef.current - delta);
      }

      // Cursor follow — frame-rate-independent exponential lerp.
      // 0.25 is the per-second "smoothing" base; pow normalises for dt.
      const lerpFactor = 1 - Math.pow(1 - 0.25, dt * 60);
      curRef.current.x += (targetRef.current.x - curRef.current.x) * lerpFactor;
      curRef.current.y += (targetRef.current.y - curRef.current.y) * lerpFactor;

      render();

      // Continue looping while hovered, or while activity is still settling,
      // or while cursor is still easing toward its target.
      const cursorSettling =
        Math.abs(targetRef.current.x - curRef.current.x) > 0.5 ||
        Math.abs(targetRef.current.y - curRef.current.y) > 0.5;
      const activitySettling = activityRef.current !== target;

      if (hoveringRef.current || activitySettling || cursorSettling) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        runningRef.current = false;
        lastTickTs = 0;
      }
    };

    const startLoop = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      lastTickTs = 0;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    // Under reduced motion, skip the cursor-follow spotlight entirely — dots
    // stay at their static base (min) size, with only a plain show/hide of
    // the canvas on hover (no proximity animation, no mousemove tracking).
    // No cursor on touch: the proximity spotlight can never render, so skip
    // the mousemove tracking and RAF entirely and show the static base grid.
    if (prefersReduced || isTouch) {
      if (trigger === 'hover') {
        const onEnterStatic = () => canvas.classList.add(styles.active);
        const onLeaveStatic = () => canvas.classList.remove(styles.active);
        host.addEventListener('mouseenter', onEnterStatic);
        host.addEventListener('mouseleave', onLeaveStatic);
        return () => {
          ro.disconnect();
          host.removeEventListener('mouseenter', onEnterStatic);
          host.removeEventListener('mouseleave', onLeaveStatic);
        };
      }
      canvas.classList.add(styles.active);
      render();
      return () => ro.disconnect();
    }

    // getBoundingClientRect() forces synchronous layout, so calling it on every
    // mousemove is a per-event layout thrash. Cache it and refresh only when
    // the geometry can actually have changed.
    let hostRect = host.getBoundingClientRect();
    const refreshRect = () => { hostRect = host.getBoundingClientRect(); };
    window.addEventListener('scroll', refreshRect, { passive: true });
    window.addEventListener('resize', refreshRect, { passive: true });

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX - hostRect.left, y: e.clientY - hostRect.top };
      startLoop();
    };
    const onEnter = (e: MouseEvent) => {
      refreshRect();
      const pos = { x: e.clientX - hostRect.left, y: e.clientY - hostRect.top };
      curRef.current = { ...pos };
      targetRef.current = { ...pos };
      hoveringRef.current = true;
      canvas.classList.add(styles.active);
      startLoop();
    };
    const onLeave = () => {
      hoveringRef.current = false;
      // Keep RAF running so activity can ease back to 0 smoothly.
      startLoop();
      // Fade the canvas out via CSS opacity; the loop naturally clears
      // itself as activity reaches 0 and proximity stops mattering.
      canvas.classList.remove(styles.active);
    };

    host.addEventListener('mousemove', onMove, { passive: true });
    if (trigger === 'hover') {
      host.addEventListener('mouseenter', onEnter);
      host.addEventListener('mouseleave', onLeave);
    } else if (trigger === 'always') {
      canvas.classList.add(styles.active);
      // "Always" means the canvas is visible — activity still ramps to 1 on
      // hover and back to 0 on leave, so the cursor-driven max-size behavior
      // still fades in and out. With no cursor, dots sit at min.
      render();
      host.addEventListener('mouseenter', onEnter);
      host.addEventListener('mouseleave', onLeave);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
      ro.disconnect();
      window.removeEventListener('scroll', refreshRect);
      window.removeEventListener('resize', refreshRect);
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
    };
  }, [
    resolvedColorA, resolvedColorB, effectiveStep, dotEdgeMin, dotEdgeMax,
    effectiveFalloff, trigger, easeDuration, prefersReduced, isTouch,
  ]);

  if (trigger === 'never') return null;

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
});
