import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import styles from './TiltCard.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useGlobalCursor } from '@/hooks/useGlobalCursor';

export interface TiltCardProps {
  children?: React.ReactNode;
  maxTiltX?: number;
  maxTiltY?: number;
  perspective?: number;
  scaleOnHover?: number;
  idleMode?: 'rest' | 'breathe';
  breatheAmplitude?: number;
  breatheDuration?: number;
  reactToGlobalCursor?: boolean;
  className?: string;
}

export function TiltCard({
  children,
  maxTiltX = 20,
  maxTiltY = 20,
  perspective = 600,
  scaleOnHover = 1.04,
  idleMode = 'rest',
  breatheAmplitude = 4,
  breatheDuration = 6,
  reactToGlobalCursor = false,
  className,
}: TiltCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const prefersReduced = usePrefersReducedMotion();
  const cursor = useGlobalCursor();

  // Target tilt values (normalized -1..1, scaled by max* later)
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const scale = useMotionValue(1);

  const springCfg = { stiffness: 150, damping: 20, mass: 0.6 };
  const sx = useSpring(tx, springCfg);
  const sy = useSpring(ty, springCfg);
  const sScale = useSpring(scale, springCfg);

  const rotateY = useTransform(sx, (v) => v * maxTiltY);
  const rotateX = useTransform(sy, (v) => -v * maxTiltX);

  // Local hover-based tilt
  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReduced) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;  // 0..1
      const py = (e.clientY - r.top) / r.height;  // 0..1
      tx.set(px * 2 - 1);
      ty.set(py * 2 - 1);
    };

    const onEnter = () => {
      setHovered(true);
      scale.set(scaleOnHover);
    };
    const onLeave = () => {
      setHovered(false);
      scale.set(1);
      if (!reactToGlobalCursor) {
        tx.set(0);
        ty.set(0);
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
  }, [prefersReduced, scaleOnHover, reactToGlobalCursor, tx, ty, scale]);

  // Global cursor response when not hovered
  useEffect(() => {
    if (!reactToGlobalCursor || prefersReduced) return;
    const el = containerRef.current;
    if (!el) return;

    const unsubX = cursor.x.on('change', () => {
      if (hovered) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = cursor.x.get() - cx;
      const dy = cursor.y.get() - cy;
      // Falloff scaled by 2x the element's diagonal so distant cursors have gentle influence
      const diag = Math.hypot(r.width, r.height) * 2;
      tx.set(Math.max(-1, Math.min(1, dx / diag)));
      ty.set(Math.max(-1, Math.min(1, dy / diag)));
    });
    return () => { unsubX(); };
  }, [reactToGlobalCursor, prefersReduced, cursor.x, cursor.y, hovered, tx, ty]);

  // Breathe idle — sinusoidal rotate when not hovered and in breathe mode
  useEffect(() => {
    if (idleMode !== 'breathe' || prefersReduced) return;
    if (hovered) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) / 1000) / breatheDuration;
      const phase = t * Math.PI * 2;
      const amp = breatheAmplitude / Math.max(maxTiltX, maxTiltY);
      tx.set(Math.sin(phase) * amp);
      ty.set(Math.cos(phase * 0.7) * amp);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idleMode, hovered, prefersReduced, breatheAmplitude, breatheDuration, maxTiltX, maxTiltY, tx, ty]);

  if (prefersReduced) {
    return <div className={[styles.card, className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
  }

  return (
    // Outer wrapper owns `perspective` — it must live on the PARENT of the
    // rotating element for the 3D depth to read. Without this split, a
    // self-perspective mostly flattens out visually.
    <div
      ref={containerRef}
      className={[styles.card, className ?? ''].filter(Boolean).join(' ')}
      style={{ perspective: `${perspective}px` }}
    >
      <motion.div
        className={styles.inner}
        style={{
          rotateX,
          rotateY,
          scale: sScale,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
