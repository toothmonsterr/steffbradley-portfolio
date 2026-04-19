import React, { useId, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import styles from './OffsetCMYK.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  buildWobble,
  useOffsetActivity,
  useLayerMotionValues,
  type Interaction,
} from '../OffsetShape/shared';

export interface OffsetCMYKProps {
  /** Source image to auto-separate into C / M / Y / K plates. */
  sourceImage?: string;

  /** Cyan ink color (default: process cyan) */
  colorC?: string;
  /** Magenta ink color (default: process magenta) */
  colorM?: string;
  /** Yellow ink color (default: process yellow) */
  colorY?: string;
  /** Key (black) ink color (default: pure black) */
  colorK?: string;

  /** Misregistration distance per plate (px). Plates form a diamond at this radius. */
  offsetX?: number;
  offsetY?: number;

  /** CSS mix-blend-mode between the ink plates */
  blendMode?: 'multiply' | 'darken' | 'screen' | 'overlay';

  /** Channel contrast — higher = richer inks, deeper shadows */
  channelContrast?: number;

  /**
   * 'hover'   — misregistered at rest; eases into alignment on hover.
   * 'always'  — permanent misregistration.
   * 'inverse' — aligned at rest; eases apart on hover.
   */
  interaction?: Interaction;
  /** Sub-pixel wobble magnitude for organic hand-printed feel (px) */
  jitter?: number;
  /** Ease-in / ease-out duration for the hover transition (seconds) */
  easeDuration?: number;

  className?: string;
}

// ---------------------------------------------------------------------------
// Per-channel CMYK separation filters
//
// For each channel we:
//   1. Compute channel density (how much ink that channel contributes) via
//      an feColorMatrix that puts the density in the alpha channel.
//   2. Multiply by the SOURCE ALPHA — critical so transparent areas of the
//      source image don't ink up to full density. Without this, a transparent
//      PNG background prints as black/cyan/etc on every channel.
//   3. Run the alpha through a contrast curve (higher = darker inks).
//   4. Flood the resulting alpha with the ink color.
//
// Channel density formulas (for standard RGB → CMY):
//   Cyan    = 1 - R
//   Magenta = 1 - G
//   Yellow  = 1 - B
//   Key     ≈ 1 - (R + G + B) / 3   (approximates min(1-R, 1-G, 1-B))
// ---------------------------------------------------------------------------

type Channel = 'C' | 'M' | 'Y' | 'K';

const MATRIX_FOR: Record<Channel, string> = {
  // A' = 1 - R  (others zeroed)
  C: '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   -1 0 0 0 1',
  // A' = 1 - G
  M: '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0    0 -1 0 0 1',
  // A' = 1 - B
  Y: '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0    0 0 -1 0 1',
  // A' = 1 - (R+G+B)/3
  K: `0 0 0 0 0   0 0 0 0 0   0 0 0 0 0    ${-1/3} ${-1/3} ${-1/3} 0 1`,
};

function contrastTable(k: number): string {
  const n = 9;
  const power = Math.max(0.1, k);
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    values.push(Math.pow(t, 1 / power));
  }
  return values.map((v) => v.toFixed(3)).join(' ');
}

function channelFilter(id: string, channel: Channel, color: string, contrast: number) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      {/* 1. Compute density into alpha */}
      <feColorMatrix type="matrix" values={MATRIX_FOR[channel]} result="density" />

      {/* 2. Clip density by source alpha — no ink where the source was transparent */}
      <feComposite in="density" in2="SourceAlpha" operator="in" result="maskedDensity" />

      {/* 3. Contrast curve */}
      <feComponentTransfer in="maskedDensity" result="curved">
        <feFuncA type="table" tableValues={contrastTable(contrast)} />
      </feComponentTransfer>

      {/* 4. Paint alpha with ink color */}
      <feFlood floodColor={color} result="ink" />
      <feComposite in="ink" in2="curved" operator="in" />
    </filter>
  );
}

export function OffsetCMYK({
  sourceImage,

  colorC       = '#00AEEF',  // process cyan
  colorM       = '#EC008C',  // process magenta
  colorY       = '#FFF200',  // process yellow
  colorK       = '#000000',  // key / black

  offsetX      = 4,
  offsetY      = 3,
  blendMode    = 'multiply',
  channelContrast = 1.4,

  interaction  = 'hover',
  jitter       = 1.2,
  easeDuration = 0.6,
  className,
}: OffsetCMYKProps) {
  const uid  = useId().replace(/:/g, '');
  const ids  = {
    C: `cmyk-c-${uid}`,
    M: `cmyk-m-${uid}`,
    Y: `cmyk-y-${uid}`,
    K: `cmyk-k-${uid}`,
  };
  const prefersReduced = usePrefersReducedMotion();

  // Diamond offsets: C → NW, M → NE, Y → SW, K → SE
  const wobbleC = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleM = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);
  const wobbleY = useMemo(() => buildWobble(uid.charCodeAt(0) + 3, jitter), [uid, jitter]);
  const wobbleK = useMemo(() => buildWobble(uid.charCodeAt(0) + 4, jitter), [uid, jitter]);

  const layerC = useLayerMotionValues(-1, -1, wobbleC);
  const layerM = useLayerMotionValues( 1, -1, wobbleM);
  const layerY = useLayerMotionValues(-1,  1, wobbleY);
  const layerK = useLayerMotionValues( 1,  1, wobbleK);

  const hostRef = useRef<HTMLSpanElement>(null);
  const layers = useMemo(() => [layerC, layerM, layerY, layerK], [layerC, layerM, layerY, layerK]);

  useOffsetActivity(hostRef, {
    interaction,
    offsetX,
    offsetY,
    easeDuration,
    prefersReduced,
    layers,
  });

  const renderLayer = (filterId: string) => (
    <span className={styles.filterShell} style={{ filter: `url(#${filterId})` }}>
      <span className={styles.filterInner}>
        {sourceImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sourceImage} alt="" className={styles.sourceImage} draggable={false} />
        ) : null}
      </span>
    </span>
  );

  return (
    <span
      ref={hostRef}
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          {channelFilter(ids.C, 'C', colorC, channelContrast)}
          {channelFilter(ids.M, 'M', colorM, channelContrast)}
          {channelFilter(ids.Y, 'Y', colorY, channelContrast)}
          {channelFilter(ids.K, 'K', colorK, channelContrast)}
        </defs>
      </svg>

      {/* Sizer — an invisible copy of the source image establishes the
          wrapper's intrinsic dimensions. */}
      <span className={styles.sizer} aria-hidden="true">
        {sourceImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sourceImage} alt="" className={styles.sourceImage} draggable={false} />
        ) : null}
      </span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerC.x, y: layerC.y, rotate: layerC.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        {renderLayer(ids.C)}
      </motion.span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerM.x, y: layerM.y, rotate: layerM.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        {renderLayer(ids.M)}
      </motion.span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerY.x, y: layerY.y, rotate: layerY.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        {renderLayer(ids.Y)}
      </motion.span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerK.x, y: layerK.y, rotate: layerK.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        {renderLayer(ids.K)}
      </motion.span>
    </span>
  );
}
