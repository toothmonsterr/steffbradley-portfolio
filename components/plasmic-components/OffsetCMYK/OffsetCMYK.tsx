import React, { useId, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import styles from './OffsetCMYK.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  buildWobble,
  useOffsetActivity,
  useHalftoneProximity,
  useLayerMotionValues,
  rotatedDotScreenUri,
  type Interaction,
  type TextureMode,
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
  jitter?: number;
  easeDuration?: number;
  texture?: TextureMode;
  textureStep?: number;
  textureContrast?: number;
  /** When set, dots grow to this size (%) as cursor approaches the element */
  textureHoverContrast?: number;
  /** Enables or disables the halftone hover proximity effect (default true) */
  textureHoverEnabled?: boolean;
  /** px radius over which the hover dot-size effect ramps (default 150) */
  textureProximityRadius?: number;
  /** Falloff curve: 0.5 = wide soft halo, 1 = linear, 2+ = tight spot (default 0.5) */
  textureHoverFeather?: number;
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

const SCREEN_ANGLES = [15, 30, 45, 60];

function channelFilter(
  id: string, channel: Channel, color: string, contrast: number,
  texture: TextureMode, layerIndex: number, step: number, dotSize: number,
) {
  const densityChain = (
    <>
      <feColorMatrix type="matrix" values={MATRIX_FOR[channel]} result="density" />
      <feComposite in="density" in2="SourceAlpha" operator="in" result="maskedDensity" />
      <feComponentTransfer in="maskedDensity" result="curved">
        <feFuncA type="table" tableValues={contrastTable(contrast)} />
      </feComponentTransfer>
    </>
  );

  if (texture === 'halftone') {
    const angle = SCREEN_ANGLES[layerIndex % SCREEN_ANGLES.length];
    const s = Math.max(2, Math.round(step));
    const uri = rotatedDotScreenUri(s, dotSize, angle);
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {densityChain}
        <feImage href={uri} x="0" y="0" width={s} height={s} result="screen" preserveAspectRatio="none" />
        <feTile in="screen" result="tiled" />
        {/* Dots clipped by channel density */}
        <feComposite in="tiled" in2="curved" operator="in" result="dots" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="dots" operator="in" />
      </filter>
    );
  }

  if (texture === 'noise') {
    const freq = (0.4 / Math.max(1, step)).toFixed(4);
    const n = 10;
    const ones = Math.round(Math.max(1, Math.min(n - 1, (dotSize / 100) * n)));
    const tv = Array.from({ length: n }, (_, i) => (i >= n - ones ? 1 : 0)).join(' ');
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {densityChain}
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2"
                      seed={layerIndex * 7 + 1} stitchTiles="stitch" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
        <feComponentTransfer in="grey" result="grain">
          <feFuncR type="discrete" tableValues={tv} />
          <feFuncG type="discrete" tableValues={tv} />
          <feFuncB type="discrete" tableValues={tv} />
          <feFuncA type="discrete" tableValues={tv} />
        </feComponentTransfer>
        <feComposite in="grain" in2="curved" operator="in" result="maskedGrain" />
        <feFlood floodColor={color} result="ink" />
        <feComposite in="ink" in2="maskedGrain" operator="in" />
      </filter>
    );
  }

  // none
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      {densityChain}
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

  interaction    = 'hover',
  jitter         = 1.2,
  easeDuration   = 0.6,
  texture        = 'none' as TextureMode,
  textureStep    = 4,
  textureContrast = 60,
  textureHoverContrast,
  textureHoverEnabled = true,
  textureProximityRadius,
  textureHoverFeather,
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
  const layers = [layerC, layerM, layerY, layerK];

  useOffsetActivity(hostRef, {
    interaction,
    offsetX,
    offsetY,
    easeDuration,
    prefersReduced,
    layers,
  });

  const halftoneIds = useMemo(
    () => texture === 'halftone' && textureHoverContrast != null && textureHoverEnabled
      ? [ids.C, ids.M, ids.Y, ids.K]
      : [],
    [texture, textureHoverContrast, textureHoverEnabled, ids.C, ids.M, ids.Y, ids.K],
  );
  useHalftoneProximity(hostRef, halftoneIds, {
    step: textureStep,
    baseDotSize: textureContrast,
    hoverDotSize: textureHoverContrast ?? textureContrast,
    proximityRadius: textureProximityRadius,
    feather: textureHoverFeather,
    prefersReduced,
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
          {channelFilter(ids.C, 'C', colorC, channelContrast, texture, 0, textureStep, textureContrast)}
          {channelFilter(ids.M, 'M', colorM, channelContrast, texture, 1, textureStep, textureContrast)}
          {channelFilter(ids.Y, 'Y', colorY, channelContrast, texture, 2, textureStep, textureContrast)}
          {channelFilter(ids.K, 'K', colorK, channelContrast, texture, 3, textureStep, textureContrast)}
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
