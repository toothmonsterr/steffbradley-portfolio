import React, { useRef, useEffect } from 'react';
import styles from './CursorShadow.module.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseColor(str: string): [number, number, number] {
  const h6 = str.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (h6) return [parseInt(h6[1], 16), parseInt(h6[2], 16), parseInt(h6[3], 16)];
  const h3 = str.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (h3) return [parseInt(h3[1] + h3[1], 16), parseInt(h3[2] + h3[2], 16), parseInt(h3[3] + h3[3], 16)];
  const m = str.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  return [0, 0, 0];
}

// Ray-casting point-in-polygon test.
function pointInPolygon(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Minimum distance from point (px, py) to the nearest edge of the polygon.
// Used to feather dot sizes near the arrow boundary.
function distToPolygonEdge(px: number, py: number, poly: [number, number][]): number {
  let minDist = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const nearX = ax + t * dx, nearY = ay + t * dy;
    const d = Math.hypot(px - nearX, py - nearY);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// ---------------------------------------------------------------------------
// Arrow cursor polygon — normalized to a [0,1] × [0,1] bounding box.
// Derived from the standard OS arrow cursor path (tip at origin, extends
// down-right). Width ≈ 0.648 of height.
//
//   M 0,0  L 0,0.929  L 0.259,0.669  L 0.439,1.0
//   L 0.536,0.955  L 0.357,0.597  L 0.648,0.597  Z
// ---------------------------------------------------------------------------
const ARROW_POLY: [number, number][] = [
  [0.000, 0.000],
  [0.000, 0.929],
  [0.259, 0.669],
  [0.439, 1.000],
  [0.536, 0.955],
  [0.357, 0.597],
  [0.648, 0.597],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface CursorShadowProps {
  /** Shadow dot color — dark dots + multiply blend = halftone shadow */
  dotColor?: string;
  /** Grid cell size in px */
  step?: number;
  /**
   * arrow  — dots fill the arrow cursor shape (default)
   * radial — dots radiate in a circle from the cursor
   */
  shape?: 'arrow' | 'radial';
  /**
   * For 'arrow': height of the cursor shape in px
   * For 'radial': spotlight radius in px
   */
  cursorSize?: number;
  /** Max canvas opacity (0–1) */
  maxOpacity?: number;
  /** Feather width in px — dots shrink to nothing within this distance of the arrow edge */
  feather?: number;
  /** Per-frame lerp factor toward the real cursor (0–1). Higher = snappier, less trail. */
  smoothing?: number;
  /** CSS mix-blend-mode applied to the canvas */
  blendMode?: 'multiply' | 'darken' | 'overlay' | 'screen' | 'normal';
  /** z-index for the fixed overlay */
  zIndex?: number;
}

export function CursorShadow({
  dotColor    = '#201B2A',
  step        = 10,
  shape       = 'arrow',
  cursorSize  = 56,
  feather     = 14,
  maxOpacity  = 0.75,
  smoothing   = 0.3,
  blendMode   = 'multiply',
  zIndex      = 9999,
}: CursorShadowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const cur       = useRef({ x: -9999, y: -9999 });
  const target    = useRef({ x: -9999, y: -9999 });
  const running   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const [r, g, b] = parseColor(dotColor);
    const fillColor  = `rgb(${r},${g},${b})`;
    const maxR       = step * 0.48;

    // --- Resize canvas to full viewport ---
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // --- Draw loop ---
    const draw = () => {
      if (!running.current) return;
      rafRef.current = requestAnimationFrame(draw);

      // Lerp cursor toward mouse target
      cur.current.x += (target.current.x - cur.current.x) * smoothing;
      cur.current.y += (target.current.y - cur.current.y) * smoothing;

      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      const { x: cx, y: cy } = cur.current;
      if (cx < -100) return;

      ctx.fillStyle = fillColor;
      const half = step / 2;

      if (shape === 'arrow') {
        // Arrow polygon — tip at (cx, cy), extends down-right by cursorSize px.
        // ARROW_POLY is normalised to height=1, width=0.648.
        const arrowH = cursorSize;
        const arrowW = cursorSize * 0.648;

        for (let gx = cx - step; gx <= cx + arrowW + step; gx += step) {
          // Snap to nearest grid line relative to cx
          const snappedX = Math.round((gx - half) / step) * step + half;
          for (let gy = cy - step; gy <= cy + arrowH + step; gy += step) {
            const snappedY = Math.round((gy - half) / step) * step + half;
            const nx = (snappedX - cx) / arrowH; // normalise by height (not width)
            const ny = (snappedY - cy) / arrowH;
            if (nx < -0.05 || ny < -0.05) continue;
            if (!pointInPolygon(nx, ny, ARROW_POLY)) continue;
            // Scale dot by distance to nearest polygon edge (feathered edge)
            const edgeDist = distToPolygonEdge(nx, ny, ARROW_POLY) * arrowH;
            const t = feather > 0 ? Math.min(1, edgeDist / feather) : 1;
            const dotR = maxR * Math.sqrt(t);
            if (dotR < 0.4) continue;
            ctx.beginPath();
            ctx.arc(snappedX, snappedY, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // Radial falloff (original behaviour, kept as fallback)
        for (let gx = half; gx < w + half; gx += step) {
          for (let gy = half; gy < h + half; gy += step) {
            const dist = Math.hypot(gx - cx, gy - cy);
            const t    = Math.max(0, 1 - dist / cursorSize);
            if (t === 0) continue;
            const dotR = maxR * Math.sqrt(t);
            if (dotR < 0.4) continue;
            ctx.beginPath();
            ctx.arc(gx, gy, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    // --- Global mouse tracking ---
    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!running.current) {
        cur.current = { ...target.current };
        running.current = true;
        canvas.classList.add(styles.active);
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    const onLeave = () => {
      running.current = false;
      canvas.classList.remove(styles.active);
      setTimeout(() => {
        if (!running.current) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 320);
    };

    window.addEventListener('mousemove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [dotColor, step, shape, cursorSize, feather, smoothing]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{
        zIndex,
        mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        ['--shadow-opacity' as string]: maxOpacity,
      }}
      aria-hidden="true"
    />
  );
}
