import React, { useId, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import styles from './OffsetShape.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  buildWobble,
  shapeFilterJSX,
  useOffsetActivity,
  useLayerMotionValues,
  type Interaction,
  type TextureMode,
} from './shared';

export interface OffsetShapeProps {
  children?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  offsetX?: number;
  offsetY?: number;
  blendMode?: 'multiply' | 'darken' | 'screen' | 'overlay';
  interaction?: Interaction;
  jitter?: number;
  easeDuration?: number;
  /** Ink texture: none = solid flood fill, halftone = dot screen, noise = grain */
  texture?: TextureMode;
  /** Halftone cell size in px (used when texture = halftone) */
  textureStep?: number;
  /** Halftone dot radius as % of cell 0–100 (used when texture = halftone) */
  textureContrast?: number;
  className?: string;
}

export function OffsetShape({
  children,
  colorA        = '#FF6A50',
  colorB        = '#DDEA44',
  offsetX       = 4,
  offsetY       = 3,
  blendMode     = 'multiply',
  interaction   = 'hover',
  jitter        = 1.2,
  easeDuration  = 0.6,
  texture       = 'none',
  textureStep   = 4,
  textureContrast = 60,
  className,
}: OffsetShapeProps) {
  const uid        = useId().replace(/:/g, '');
  const filterAId  = `os-a-${uid}`;
  const filterBId  = `os-b-${uid}`;
  const prefersReduced = usePrefersReducedMotion();

  const wobbleA = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleB = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);

  const layerA = useLayerMotionValues(-1, -1, wobbleA);
  const layerB = useLayerMotionValues(1, 1, wobbleB);

  const hostRef = useRef<HTMLSpanElement>(null);
  const layers = [layerA, layerB];

  useOffsetActivity(hostRef, { interaction, offsetX, offsetY, easeDuration, prefersReduced, layers });

  const layerCopy = (filterId: string) => (
    <span className={styles.filterShell} style={{ filter: `url(#${filterId})` }}>
      <span className={styles.filterInner}>{children}</span>
    </span>
  );

  return (
    <span
      ref={hostRef}
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          {shapeFilterJSX(filterAId, colorA, texture, 0, textureStep, textureContrast)}
          {shapeFilterJSX(filterBId, colorB, texture, 1, textureStep, textureContrast)}
        </defs>
      </svg>

      <span className={styles.sizer} aria-hidden="true">{children}</span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{ x: layerA.x, y: layerA.y, rotate: layerA.rotate, mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'] }}
      >
        {layerCopy(filterAId)}
      </motion.span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{ x: layerB.x, y: layerB.y, rotate: layerB.rotate, mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'] }}
      >
        {layerCopy(filterBId)}
      </motion.span>
    </span>
  );
}
