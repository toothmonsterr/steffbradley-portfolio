import React, { useId, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import styles from './OffsetImage.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  buildWobble,
  shapeFilterJSX,
  imageFilterJSX,
  useOffsetActivity,
  useLayerMotionValues,
  type Interaction,
  type TintMode,
} from '../OffsetShape/shared';

export interface OffsetImageProps {
  slotA?: React.ReactNode;
  slotB?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  tintSlots?: boolean;
  mode?: TintMode;
  imageContrast?: number;
  offsetX?: number;
  offsetY?: number;
  blendMode?: 'normal' | 'multiply' | 'darken' | 'screen' | 'overlay';
  interaction?: Interaction;
  jitter?: number;
  /** Ease-in / ease-out duration (seconds) for the hover transition */
  easeDuration?: number;
  className?: string;
}

export function OffsetImage({
  slotA,
  slotB,
  colorA        = '#FF6A50',
  colorB        = '#DDEA44',
  tintSlots     = false,
  mode          = 'shape',
  imageContrast = 1.3,
  offsetX       = 4,
  offsetY       = 3,
  blendMode     = 'multiply',
  interaction   = 'hover',
  jitter        = 1.2,
  easeDuration  = 0.6,
  className,
}: OffsetImageProps) {
  const uid       = useId().replace(/:/g, '');
  const filterAId = `oi-a-${uid}`;
  const filterBId = `oi-b-${uid}`;
  const prefersReduced = usePrefersReducedMotion();

  const wobbleA = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleB = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);

  const layerA = useLayerMotionValues(-1, -1, wobbleA);
  const layerB = useLayerMotionValues(1, 1, wobbleB);

  const hostRef = useRef<HTMLSpanElement>(null);
  const layers = [layerA, layerB];

  useOffsetActivity(hostRef, {
    interaction,
    offsetX,
    offsetY,
    easeDuration,
    prefersReduced,
    layers,
  });

  const filterJSX = mode === 'image'
    ? (id: string, color: string) => imageFilterJSX(id, color, imageContrast)
    : shapeFilterJSX;

  return (
    <span
      ref={hostRef}
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
    >
      {tintSlots && (
        <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
          <defs>
            {filterJSX(filterAId, colorA)}
            {filterJSX(filterBId, colorB)}
          </defs>
        </svg>
      )}

      <span className={styles.sizer} aria-hidden="true">
        {slotA}
      </span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerA.x, y: layerA.y, rotate: layerA.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        <span
          className={styles.filterShell}
          style={tintSlots ? { filter: `url(#${filterAId})` } : undefined}
        >
          <span className={styles.filterInner}>{slotA}</span>
        </span>
      </motion.span>

      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerB.x, y: layerB.y, rotate: layerB.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        <span
          className={styles.filterShell}
          style={tintSlots ? { filter: `url(#${filterBId})` } : undefined}
        >
          <span className={styles.filterInner}>{slotB}</span>
        </span>
      </motion.span>
    </span>
  );
}
