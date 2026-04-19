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
} from './shared';

export interface OffsetShapeProps {
  children?: React.ReactNode;
  /** First ink color (negative-offset layer) */
  colorA?: string;
  /** Second ink color (positive-offset layer) */
  colorB?: string;
  offsetX?: number;
  offsetY?: number;
  blendMode?: 'multiply' | 'darken' | 'screen' | 'overlay';
  /**
   * 'hover'   — misregistered at rest; eases into alignment on hover, eases back out on leave.
   * 'always'  — permanent misregistration, no hover reaction.
   * 'inverse' — aligned at rest; eases out into misregistration on hover.
   */
  interaction?: Interaction;
  /** Sub-pixel wobble magnitude for organic hand-printed feel (px) */
  jitter?: number;
  /** Ease-in / ease-out duration (seconds) for the hover transition */
  easeDuration?: number;
  className?: string;
}

/**
 * OffsetShape — shape-mask misregistration for buttons, text, and solid shapes.
 *
 * Duplicates children into two ink layers flooded with colorA / colorB and
 * offset against each other. The intersection color is whatever `blendMode`
 * produces when the layers overlap. For photos use OffsetCMYK; for two
 * independent image overlays use OffsetImage.
 */
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

  useOffsetActivity(hostRef, {
    interaction,
    offsetX,
    offsetY,
    easeDuration,
    prefersReduced,
    layers,
  });

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
          {shapeFilterJSX(filterAId, colorA)}
          {shapeFilterJSX(filterBId, colorB)}
        </defs>
      </svg>

      {/* Sizer — invisible copy of children to establish the wrapper's layout box. */}
      <span className={styles.sizer} aria-hidden="true">
        {children}
      </span>

      {/* Layer A — negatively offset ink */}
      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerA.x, y: layerA.y, rotate: layerA.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        {layerCopy(filterAId)}
      </motion.span>

      {/* Layer B — positively offset ink */}
      <motion.span
        className={styles.layer}
        aria-hidden="true"
        inert
        style={{
          x: layerB.x, y: layerB.y, rotate: layerB.rotate,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        {layerCopy(filterBId)}
      </motion.span>
    </span>
  );
}
