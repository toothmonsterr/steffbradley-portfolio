import React, { useId, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import styles from './OffsetImage.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  buildWobble,
  imageFilterJSX,
  useOffsetActivity,
  useHalftoneProximity,
  useHalftoneScreen,
  useLayerMotionValues,
  type Interaction,
  type TextureMode,
} from '../OffsetShape/shared';

export interface OffsetImageProps {
  slotA?: React.ReactNode;
  slotB?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  /** When true, applies luminance-separation tinting to each slot using colorA/colorB */
  tintSlots?: boolean;
  imageContrast?: number;
  offsetX?: number;
  offsetY?: number;
  blendMode?: 'normal' | 'multiply' | 'darken' | 'screen' | 'overlay';
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

export function OffsetImage({
  slotA,
  slotB,
  colorA        = '#FF6A50',
  colorB        = '#DDEA44',
  tintSlots      = false,
  imageContrast  = 1.3,
  offsetX        = 4,
  offsetY        = 3,
  blendMode      = 'multiply',
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

  const halftoneIds = useMemo(
    () => tintSlots && texture === 'halftone' && textureHoverContrast != null && textureHoverEnabled
      ? [filterAId, filterBId]
      : [],
    [tintSlots, texture, textureHoverContrast, textureHoverEnabled, filterAId, filterBId],
  );
  useHalftoneProximity(hostRef, halftoneIds, {
    step: textureStep,
    baseDotSize: textureContrast,
    hoverDotSize: textureHoverContrast ?? textureContrast,
    proximityRadius: textureProximityRadius,
    feather: textureHoverFeather,
    prefersReduced,
  });

  const screenIds = useMemo(
    () => tintSlots && texture === 'halftone' ? [filterAId, filterBId] : [],
    [tintSlots, texture, filterAId, filterBId],
  );
  useHalftoneScreen(hostRef, screenIds, { step: textureStep, contrast: textureContrast, prefersReduced });

  return (
    <span
      ref={hostRef}
      className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
    >
      {tintSlots && (
        <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
          <defs>
            {imageFilterJSX(filterAId, colorA, imageContrast, texture, 0, textureStep, textureContrast)}
            {imageFilterJSX(filterBId, colorB, imageContrast, texture, 1, textureStep, textureContrast)}
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
