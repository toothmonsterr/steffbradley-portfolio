import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './CursorParallax.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useGlobalCursor } from '@/hooks/useGlobalCursor';

export interface CursorParallaxProps {
  children?: React.ReactNode;
  intensity?: number;
  depthScale?: number;
  reverse?: boolean;
  mode?: 'hover' | 'global';
  smoothing?: number;
  perspective?: number;
  ambientIdle?: boolean;
  className?: string;
}

export function CursorParallax({
  children,
  intensity = 30,
  depthScale = 1,
  reverse = false,
  mode = 'hover',
  smoothing = 0.15,
  perspective = 0,
  ambientIdle = false,
  className,
}: CursorParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const cursor = useGlobalCursor();

  const childArray = useMemo(() => React.Children.toArray(children), [children]);
  const n = childArray.length;

  // Layer refs — one per child — so we can mutate transforms imperatively
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  layerRefs.current = layerRefs.current.slice(0, n);

  // Target + current (lerped) offsets in normalized -1..1
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const lastInputAt = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  // Depth coefficients per child: 0 = no movement, 1 = max movement.
  const depths = useMemo(() => {
    if (n <= 1) return [1];
    return Array.from({ length: n }, (_, i) => {
      const raw = i / (n - 1);
      const scaled = Math.pow(raw, 1) * depthScale;
      return reverse ? 1 - scaled : scaled;
    });
  }, [n, depthScale, reverse]);

  // Hover listeners for `mode: hover`
  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReduced) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      target.current.x = px * 2 - 1;
      target.current.y = py * 2 - 1;
      lastInputAt.current = performance.now();
    };
    const onEnter = () => setIsHovered(true);
    const onLeave = () => {
      setIsHovered(false);
      if (mode === 'hover') {
        target.current.x = 0;
        target.current.y = 0;
      }
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [prefersReduced, mode]);

  // Global cursor subscription
  useEffect(() => {
    if (mode !== 'global' || prefersReduced) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = cursor.x.get() - cx;
      const dy = cursor.y.get() - cy;
      const diag = Math.hypot(r.width, r.height);
      target.current.x = Math.max(-1, Math.min(1, dx / diag));
      target.current.y = Math.max(-1, Math.min(1, dy / diag));
      lastInputAt.current = performance.now();
    };
    const unsubX = cursor.x.on('change', update);
    const unsubY = cursor.y.on('change', update);
    return () => { unsubX(); unsubY(); };
  }, [mode, prefersReduced, cursor.x, cursor.y]);

  // Single RAF loop — lerps current toward target and writes transforms
  useEffect(() => {
    if (prefersReduced) return;
    let raf = 0;
    const tick = (now: number) => {
      // Ambient idle — if enabled and no recent input (800ms), add figure-8 drift
      const idle = ambientIdle && (now - lastInputAt.current > 800 || (mode === 'hover' && !isHovered && lastInputAt.current === 0));
      let tgtX = target.current.x;
      let tgtY = target.current.y;
      if (idle) {
        const t = now / 1000;
        tgtX += Math.sin(t * 0.6) * 0.25;
        tgtY += Math.sin(t * 0.9) * 0.15;
      }

      current.current.x += (tgtX - current.current.x) * smoothing;
      current.current.y += (tgtY - current.current.y) * smoothing;

      for (let i = 0; i < n; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const depth = depths[i] ?? 0;
        const x = current.current.x * depth * intensity;
        const y = current.current.y * depth * intensity;
        const z = perspective > 0 ? depth * perspective * 0.1 : 0;
        el.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, depths, intensity, smoothing, perspective, ambientIdle, mode, isHovered, prefersReduced]);

  if (prefersReduced) {
    return <div className={[styles.container, className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={[styles.container, className ?? ''].filter(Boolean).join(' ')}
      style={perspective > 0 ? { perspective: `${perspective}px`, transformStyle: 'preserve-3d' } : undefined}
    >
      {childArray.map((child, i) => (
        <div
          key={i}
          ref={(el) => { layerRefs.current[i] = el; }}
          className={styles.layer}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
