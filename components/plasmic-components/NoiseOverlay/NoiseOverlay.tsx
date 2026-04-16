import React, { useEffect, useId, useRef } from 'react';
import styles from './NoiseOverlay.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface NoiseOverlayProps {
  children?: React.ReactNode;
  intensity?: number;
  grainSize?: number;
  color?: string;
  blendMode?: 'multiply' | 'overlay' | 'soft-light' | 'darken' | 'screen' | 'normal';
  animate?: boolean;
  seed?: number;
  fullscreen?: boolean;
  zIndex?: number;
  className?: string;
}

export function NoiseOverlay({
  children,
  intensity = 0.25,
  grainSize = 1.2,
  color = '#201B2A',
  blendMode = 'multiply',
  animate = false,
  seed = 0,
  fullscreen = false,
  zIndex,
  className,
}: NoiseOverlayProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `noise-${uid}`;
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  // baseFrequency is inversely related to grain size — bigger grain = lower frequency.
  const baseFrequency = Math.max(0.1, 0.85 / Math.max(0.4, grainSize));

  useEffect(() => {
    if (!animate || prefersReduced) return;
    const el = turbRef.current;
    if (!el) return;

    let raf = 0;
    let last = 0;
    let s = seed;
    const tick = (t: number) => {
      if (t - last > 83) {
        s = (s + 1) % 1000;
        el.setAttribute('seed', String(s));
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, seed, prefersReduced]);

  const overlay = (
    <svg
      aria-hidden="true"
      focusable="false"
      className={[
        styles.overlay,
        fullscreen ? styles.fullscreen : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={{
        opacity: intensity,
        mixBlendMode: blendMode,
        zIndex,
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
            result="noise"
          />
          {/* Threshold the noise into discrete black/white grains */}
          <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
          <feComponentTransfer in="grey" result="mask">
            <feFuncR type="discrete" tableValues="0 1" />
            <feFuncG type="discrete" tableValues="0 1" />
            <feFuncB type="discrete" tableValues="0 1" />
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          {/* Use the white grains as an alpha mask for a solid color fill */}
          <feFlood floodColor={color} result="tint" />
          <feComposite in="tint" in2="mask" operator="in" />
        </filter>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  );

  if (fullscreen) {
    return (
      <>
        {children}
        {overlay}
      </>
    );
  }

  return (
    <span className={styles.wrapper}>
      {children}
      {overlay}
    </span>
  );
}
