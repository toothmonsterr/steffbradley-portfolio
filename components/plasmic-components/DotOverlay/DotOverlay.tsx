import React, { useEffect, useRef } from 'react';
import styles from './DotOverlay.module.css';
import { findHoverHost } from '@/hooks/findHoverHost';
import { colorOrDefault } from '@/hooks/colorDefault';

export interface DotOverlayProps {
  /** First dot color (at cursor) */
  dotColorA?: string;
  /** Second dot color (far from cursor) */
  dotColorB?: string;
  /** Grid cell size in px */
  step?: number;
  /** Minimum dot radius as % of cell (0–100). Applies far from the cursor. */
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
  /** hover: activate on host hover. always: always on. never: hidden. */
  trigger?: 'hover' | 'always' | 'never';
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

export function DotOverlay({
  dotColorA,
  dotColorB,
  step = 14,
  dotEdgeMin = 15,
  dotEdgeMax = 45,
  falloffRadius = 180,
  scale = 1,
  maxOpacity = 1,
  blendMode = 'normal',
  trigger = 'hover',
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
  const curRef = useRef({ x: -9999, y: -9999 });
  const targetRef = useRef({ x: -9999, y: -9999 });

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
    // Clamp and convert percent-of-cell to actual px radius. 100% = touching (cell/2).
    const minR = (Math.max(0, Math.min(100, dotEdgeMin)) / 100) * (effectiveStep / 2);
    const maxR = (Math.max(0, Math.min(100, dotEdgeMax)) / 100) * (effectiveStep / 2);

    const resize = () => {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const draw = () => {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      curRef.current.x += (targetRef.current.x - curRef.current.x) * 0.18;
      curRef.current.y += (targetRef.current.y - curRef.current.y) * 0.18;

      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      const { x: cx, y: cy } = curRef.current;
      const half = effectiveStep / 2;

      for (let gx = half; gx < w + half; gx += effectiveStep) {
        for (let gy = half; gy < h + half; gy += effectiveStep) {
          // Proximity-based interpolation between min and max radius
          let t = 1;
          if (cx > -100) {
            const dist = Math.hypot(gx - cx, gy - cy);
            t = Math.max(0, 1 - dist / effectiveFalloff);
          } else {
            t = 0; // no cursor yet → sit at min radius
          }
          const r = minR + (maxR - minR) * t;
          if (r < 0.3) continue;
          ctx.fillStyle = lerpColor(colA, colB, 1 - t);
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      targetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const show = () => {
      runningRef.current = true;
      canvas.classList.add(styles.active);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };
    const hide = () => {
      // Keep drawing during the CSS opacity fade so dots stay intact as they fade.
      canvas.classList.remove(styles.active);
      setTimeout(() => {
        runningRef.current = false;
        cancelAnimationFrame(rafRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 500);
    };

    host.addEventListener('mousemove', onMove);
    if (trigger === 'hover') {
      host.addEventListener('mouseenter', show);
      host.addEventListener('mouseleave', hide);
    } else if (trigger === 'always') {
      // Keep cursor offscreen so dots sit at min radius; mouse updates override.
      show();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseenter', show);
      host.removeEventListener('mouseleave', hide);
    };
  }, [resolvedColorA, resolvedColorB, effectiveStep, dotEdgeMin, dotEdgeMax, effectiveFalloff, trigger]);

  if (trigger === 'never') return null;

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
