import React, { useEffect, useId, useRef } from 'react';
import styles from './NoiseOverlay.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { colorOrDefault } from '@/hooks/colorDefault';
import { findHoverHost } from '@/hooks/findHoverHost';

export interface NoiseOverlayProps {
  /** Noise opacity (0–1) */
  intensity?: number;
  /** Grain size in px — larger = chunkier */
  grainSize?: number;
  /** Grain color */
  color?: string;
  /** CSS mix-blend-mode */
  blendMode?: 'multiply' | 'overlay' | 'soft-light' | 'darken' | 'screen' | 'normal';
  /**
   * When true, the blend mode only affects content within this component
   * (via `isolation: isolate`). When false (default), the grain blends with
   * whatever is behind the overlay on the page.
   */
  isolateBlend?: boolean;
  /**
   * When the grain flickers:
   *   never  — static grain (cheapest)
   *   hover  — flicker only while the hosting element is hovered
   *   always — flicker continuously
   */
  animate?: 'never' | 'hover' | 'always';
  /** Fixed seed — change to shift the grain pattern */
  seed?: number;
  className?: string;
}

export function NoiseOverlay({
  intensity = 0.25,
  grainSize = 1.2,
  color,
  blendMode = 'multiply',
  isolateBlend = false,
  animate = 'never',
  seed = 0,
  className,
}: NoiseOverlayProps) {
  const resolvedColor = colorOrDefault(color, '#201B2A');
  const uid = useId().replace(/:/g, '');
  const filterId = `noise-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  // Larger grain = lower frequency.
  const baseFrequency = Math.max(0.1, 0.85 / Math.max(0.4, grainSize));

  useEffect(() => {
    if (animate === 'never' || prefersReduced) return;
    const el = turbRef.current;
    if (!el) return;

    let raf = 0;
    let last = 0;
    let s = seed;
    let visible = true;
    const tick = (t: number) => {
      if (visible && t - last > 83) {
        s = (s + 1) % 1000;
        el.setAttribute('seed', String(s));
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      // Reset to the base seed so the grain returns to its "rest" state
      el.setAttribute('seed', String(seed));
      s = seed;
    };

    if (animate === 'always') {
      const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 });
      if (svgRef.current) io.observe(svgRef.current);
      start();
      return () => { stop(); io.disconnect(); };
    }

    // animate === 'hover' — attach listeners to the hover host
    const host = findHoverHost(svgRef.current);
    if (!host) return;
    const onEnter = () => start();
    const onLeave = () => stop();
    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);
    return () => {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
      stop();
    };
  }, [animate, seed, prefersReduced]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      className={[styles.overlay, className ?? ''].filter(Boolean).join(' ')}
      style={{
        opacity: intensity,
        mixBlendMode: blendMode,
        isolation: isolateBlend ? 'isolate' : 'auto',
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
          {/* Threshold into discrete black/white grains */}
          <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
          <feComponentTransfer in="grey" result="mask">
            <feFuncR type="discrete" tableValues="0 1" />
            <feFuncG type="discrete" tableValues="0 1" />
            <feFuncB type="discrete" tableValues="0 1" />
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          {/* Paint the grain with the target color */}
          <feFlood floodColor={resolvedColor} result="tint" />
          <feComposite in="tint" in2="mask" operator="in" />
        </filter>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  );
}
