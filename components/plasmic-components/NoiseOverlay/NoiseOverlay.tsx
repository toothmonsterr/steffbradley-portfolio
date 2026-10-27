import React, { useEffect, useRef, useState } from 'react';
import styles from './NoiseOverlay.module.css';
import { useAnimationTier } from '@/hooks/useAnimationTier';
import { colorOrDefault } from '@/hooks/colorDefault';
import { findHoverHost } from '@/hooks/findHoverHost';
import { grainTileUrl, seedOffset, tileSizeForFrequency } from '../textures';
import { tintedGrain } from './tintedGrain';

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

// The grain is a pre-rendered noise tile
// (public/textures, see scripts/build-textures.mjs). It used to be a live
// feTurbulence filter, which recomputed procedural noise for every pixel each
// time anything under it repainted. The tile is the same noise, thresholded
// the same way ("0 1" = coverage 50), so it looks the same and costs a single
// image decode. It is drawn pre-tinted as a repeating background (see below).
const GRAIN_TILE = grainTileUrl(50);

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
  const ref = useRef<HTMLSpanElement>(null);
  const { prefersReduced, isTouch } = useAnimationTier();

  // Larger grain = lower frequency. Same mapping as the old filter, expressed
  // as how large the tile is drawn.
  const baseFrequency = Math.max(0.1, 0.85 / Math.max(0.4, grainSize));
  const size = tileSizeForFrequency(baseFrequency);

  useEffect(() => {
    // Static grain on touch: 'hover' can never fire without a pointer, and the
    // 'always' flicker isn't worth a continuous repaint on a phone.
    if (animate === 'never' || prefersReduced || isTouch) return;
    const el = ref.current;
    if (!el) return;
    const on = () => { el.dataset.flicker = ''; };
    const off = () => { delete el.dataset.flicker; };

    if (animate === 'always') {
      // Only flicker while on screen.
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) on();
        else off();
      }, { threshold: 0 });
      io.observe(el);
      return () => { io.disconnect(); off(); };
    }

    const host = findHoverHost(el);
    if (!host) return;
    host.addEventListener('mouseenter', on);
    host.addEventListener('mouseleave', off);
    return () => {
      host.removeEventListener('mouseenter', on);
      host.removeEventListener('mouseleave', off);
      off();
    };
  }, [animate, prefersReduced, isTouch]);

  // Once hydrated, swap the mask for a pre-tinted background tile (see
  // tintedGrain.ts — masks were the biggest scroll cost in Firefox). The
  // server render keeps the mask so the first paint already has grain.
  const [tinted, setTinted] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    tintedGrain(GRAIN_TILE, resolvedColor).then((url) => { if (live) setTinted(url); });
    return () => { live = false; };
  }, [resolvedColor]);

  const tileSize = `${size.toFixed(1)}px ${size.toFixed(1)}px`;
  const tilePosition = seedOffset(seed, size);

  const grain: React.CSSProperties = tinted
    ? {
        backgroundImage: `url(${tinted})`,
        backgroundSize: tileSize,
        backgroundPosition: tilePosition,
      }
    : {
        backgroundColor: resolvedColor,
        maskImage: `url(${GRAIN_TILE})`,
        WebkitMaskImage: `url(${GRAIN_TILE})`,
        maskSize: tileSize,
        WebkitMaskSize: tileSize,
        maskPosition: tilePosition,
        WebkitMaskPosition: tilePosition,
      };

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={[styles.overlay, className ?? ''].filter(Boolean).join(' ')}
      data-tinted={tinted ? '' : undefined}
      style={{
        opacity: intensity,
        mixBlendMode: blendMode,
        isolation: isolateBlend ? 'isolate' : 'auto',
        ...grain,
      }}
    />
  );
}
