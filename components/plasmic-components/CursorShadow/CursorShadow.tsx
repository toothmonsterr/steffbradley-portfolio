import React, { useRef, useEffect } from 'react';
import styles from './CursorShadow.module.css';

function parseColor(str: string): [number, number, number] {
  const h6 = str.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (h6) return [parseInt(h6[1], 16), parseInt(h6[2], 16), parseInt(h6[3], 16)];
  const h3 = str.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (h3) return [parseInt(h3[1] + h3[1], 16), parseInt(h3[2] + h3[2], 16), parseInt(h3[3] + h3[3], 16)];
  const m = str.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  return [0, 0, 0];
}

export interface CursorShadowProps {
  /** Shadow dot color — dark dots + multiply blend = halftone shadow */
  dotColor?: string;
  /** Grid cell size in px */
  step?: number;
  /** Radius in px over which dots radiate from the cursor */
  spotlightRadius?: number;
  /** Max canvas opacity (0–1) */
  maxOpacity?: number;
  /** CSS mix-blend-mode applied to the canvas */
  blendMode?: 'multiply' | 'darken' | 'overlay' | 'screen' | 'normal';
  /** z-index for the fixed overlay */
  zIndex?: number;
}

export function CursorShadow({
  dotColor = '#201B2A',
  step = 12,
  spotlightRadius = 180,
  maxOpacity = 0.65,
  blendMode = 'multiply',
  zIndex = 9999,
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
    const fillColor = `rgb(${r},${g},${b})`;
    const maxR = step * 0.48;

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

      cur.current.x += (target.current.x - cur.current.x) * 0.13;
      cur.current.y += (target.current.y - cur.current.y) * 0.13;

      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      const { x: cx, y: cy } = cur.current;
      if (cx < -100) return;

      ctx.fillStyle = fillColor;
      const half = step / 2;
      for (let gx = half; gx < w + half; gx += step) {
        for (let gy = half; gy < h + half; gy += step) {
          const dist = Math.hypot(gx - cx, gy - cy);
          const t = Math.max(0, 1 - dist / spotlightRadius);
          if (t === 0) continue;
          const dotR = maxR * Math.sqrt(t);
          if (dotR < 0.4) continue;
          ctx.beginPath();
          ctx.arc(gx, gy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // --- Global mouse tracking ---
    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!running.current) {
        // Snap position on first move so lerp doesn't drag from (-9999, -9999)
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
  }, [dotColor, step, spotlightRadius]);

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
