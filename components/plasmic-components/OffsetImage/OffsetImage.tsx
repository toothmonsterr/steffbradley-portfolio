import React, { useId, useMemo, useRef } from 'react';
import styles from './OffsetImage.module.css';
import m from '../OffsetShape/offsetMotion.module.css';
import { useAnimationTier } from '@/hooks/useAnimationTier';
import { useIsWebKit } from '@/hooks/useIsWebKit';
import {
  buildWobble,
  imageFilterJSX,
  offsetHostVars,
  offsetLayerVars,
  restsActive,
  useOffsetInteraction,
  useHalftoneProximity,
  useHalftoneScreen,
  wobbleVars,
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
  /** Per-slot override of imageContrast. Negative values invert the luminance
      separation, so light areas take the ink instead of dark ones. */
  imageContrastA?: number;
  imageContrastB?: number;
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

export const OffsetImage = React.memo(function OffsetImage({
  slotA,
  slotB,
  colorA        = '#FF6A50',
  colorB        = '#DDEA44',
  tintSlots      = false,
  imageContrast  = 1.3,
  imageContrastA,
  imageContrastB,
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
  const { prefersReduced } = useAnimationTier();
  const webkit = useIsWebKit();

  // Per-slot contrast falls back to the shared imageContrast when unset.
  const contrastA = imageContrastA ?? imageContrast;
  const contrastB = imageContrastB ?? imageContrast;

  const wobbleA = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleB = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);

  const hostRef = useRef<HTMLSpanElement>(null);
  useOffsetInteraction(hostRef, interaction);

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
      className={[styles.wrapper, m.host, className ?? ''].filter(Boolean).join(' ')}
      style={offsetHostVars(easeDuration)}
      data-active={restsActive(interaction) ? '' : undefined}
    >
      {tintSlots && (
        <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
          <defs>
            {imageFilterJSX(filterAId, colorA, contrastA, texture, 0, textureStep, textureContrast, webkit)}
            {imageFilterJSX(filterBId, colorB, contrastB, texture, 1, textureStep, textureContrast, webkit)}
          </defs>
        </svg>
      )}

      <span className={styles.sizer} aria-hidden="true">
        {slotA}
      </span>

      <span
        className={[styles.layer, m.layer].join(' ')}
        aria-hidden="true"
        inert
        style={{
          ...offsetLayerVars(-1, -1, offsetX, offsetY),
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        <span className={m.wobble} style={wobbleVars(wobbleA)}>
          <span
            className={styles.filterShell}
            style={tintSlots ? { filter: `url(#${filterAId})` } : undefined}
          >
            <span className={styles.filterInner}>{slotA}</span>
          </span>
        </span>
      </span>

      <span
        className={[styles.layer, m.layer].join(' ')}
        aria-hidden="true"
        inert
        style={{
          ...offsetLayerVars(1, 1, offsetX, offsetY),
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        <span className={m.wobble} style={wobbleVars(wobbleB)}>
          <span
            className={styles.filterShell}
            style={tintSlots ? { filter: `url(#${filterBId})` } : undefined}
          >
            <span className={styles.filterInner}>{slotB}</span>
          </span>
        </span>
      </span>

      {/* Transparent interaction layer — captures pointer/keyboard events for
          any buttons, links, or interactive elements placed in slotA. The visual
          ink layers above are inert decorations; this layer is the real target. */}
      <span className={styles.interactionLayer}>{slotA}</span>
    </span>
  );
});
