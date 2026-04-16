import React, { useRef, useEffect } from 'react';
import styles from './CursorDots.module.css';

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

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface CursorDotsProps {
  /** Dot color at the cursor center */
  dotColorA?: string;
  /** Dot color at the spotlight edge */
  dotColorB?: string;
  /** Grid cell size in px — smaller = denser dots */
  step?: number;
  /** Radius in px over which dots radiate from the cursor */
  spotlightRadius?: number;
  /** Max canvas opacity (0–1) */
  maxOpacity?: number;
  /**
   * hover   — activates on parent hover (default)
   * always  — always visible; set while editing in Plasmic Studio
   * never   — hidden
   */
  trigger?: 'hover' | 'always' | 'never';
  className?: string;
}

export function CursorDots({
  dotColorA = '#FF6A50',
  dotColorB = '#DDEA44',
  step = 14,
  spotlightRadius = 140,
  maxOpacity = 1,
  trigger = 'hover',
  className,
}: CursorDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const cur       = useRef({ x: -9999, y: -9999 });
  const target    = useRef({ x: -9999, y: -9999 });
  const running   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent || trigger === 'never') return;

    const ctx = canvas.getContext('2d')!;
    const colA = parseColor(dotColorA);
    const colB = parseColor(dotColorB);
    const maxR = step * 0.48; // dots nearly touch at full size

    // --- Resize ---
    const resize = () => {
      canvas.width  = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    // --- Draw loop ---
    const draw = () => {
      if (!running.current) return;
      rafRef.current = requestAnimationFrame(draw);

      // Lerp cursor toward mouse target (ink-spreading feel)
      cur.current.x += (target.current.x - cur.current.x) * 0.13;
      cur.current.y += (target.current.y - cur.current.y) * 0.13;

      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      const { x: cx, y: cy } = cur.current;
      if (cx < -100) return; // still offscreen, nothing to draw

      const half = step / 2;
      for (let gx = half; gx < w + half; gx += step) {
        for (let gy = half; gy < h + half; gy += step) {
          const dist = Math.hypot(gx - cx, gy - cy);
          const t = Math.max(0, 1 - dist / spotlightRadius);
          if (t === 0) continue;
          const r = maxR * Math.sqrt(t); // sqrt = ease-out, big dots at center
          if (r < 0.4) continue;
          // colorA at center (t → 1), colorB toward edge (t → 0)
          ctx.fillStyle = lerpColor(colA, colB, 1 - t);
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // --- Event handlers ---
    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      target.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const show = () => {
      running.current = true;
      canvas.classList.add(styles.active);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    const hide = () => {
      running.current = false;
      canvas.classList.remove(styles.active);
      // Defer clear until fade-out transition ends
      setTimeout(() => {
        if (!running.current) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 220);
    };

    parent.addEventListener('mousemove', onMove);

    if (trigger === 'hover') {
      parent.addEventListener('mouseenter', show);
      parent.addEventListener('mouseleave', hide);
    }

    if (trigger === 'always') {
      // Center the ramp in the element for Studio preview
      const cx = parent.offsetWidth  / 2;
      const cy = parent.offsetHeight / 2;
      cur.current    = { x: cx, y: cy };
      target.current = { x: cx, y: cy };
      show();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      parent.removeEventListener('mousemove',   onMove);
      parent.removeEventListener('mouseenter',  show);
      parent.removeEventListener('mouseleave',  hide);
    };
  }, [dotColorA, dotColorB, step, spotlightRadius, trigger]);

  if (trigger === 'never') return null;

  return (
    <canvas
      ref={canvasRef}
      className={[styles.canvas, className ?? ''].filter(Boolean).join(' ')}
      style={{ opacity: maxOpacity }}
      aria-hidden="true"
    />
  );
}
