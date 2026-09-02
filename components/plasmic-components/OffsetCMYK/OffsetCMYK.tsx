import React, { useId, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import styles from './OffsetCMYK.module.css';
import { useAnimationTier } from '@/hooks/useAnimationTier';
import {
  buildWobble,
  useOffsetActivity,
  useHalftoneProximity,
  useHalftoneScreen,
  useLayerMotionValues,
  type Interaction,
  type TextureMode,
} from '../OffsetShape/shared';
import { channelFilter } from './channelFilter';

export interface OffsetCMYKProps {
  /** Slot — text, images, anything. Each plate (C/M/Y/K) renders a copy of the
   * children separated into its channel. Best with rich color content; plain
   * text or pure-black content will mostly produce K only. */
  children?: React.ReactNode;

  /** Cyan ink color (default: process cyan) */
  colorC?: string;
  /** Magenta ink color */
  colorM?: string;
  /** Yellow ink color */
  colorY?: string;
  /** Key (black) ink color */
  colorK?: string;

  /** Misregistration distance per plate (px). Plates form a diamond at this radius. */
  offsetX?: number;
  offsetY?: number;

  /** CSS mix-blend-mode between the ink plates */
  blendMode?: 'multiply' | 'darken' | 'screen' | 'overlay';

  /** Channel contrast — higher = richer inks */
  channelContrast?: number;

  interaction?: Interaction;
  jitter?: number;
  easeDuration?: number;
  texture?: TextureMode;
  textureStep?: number;
  textureContrast?: number;
  textureHoverContrast?: number;
  textureHoverEnabled?: boolean;
  textureProximityRadius?: number;
  textureHoverFeather?: number;
  className?: string;
}

export function OffsetCMYK({
  children,
  colorC       = '#00AEEF',
  colorM       = '#EC008C',
  colorY       = '#FFF200',
  colorK       = '#000000',
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
  const uid = useId().replace(/:/g, '');
  const ids = {
    C: `cmyk-c-${uid}`,
    M: `cmyk-m-${uid}`,
    Y: `cmyk-y-${uid}`,
    K: `cmyk-k-${uid}`,
  };
  const { prefersReduced, frameInterval } = useAnimationTier();

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
    interaction, offsetX, offsetY, easeDuration, prefersReduced, frameInterval, layers,
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

  const screenIds = useMemo(
    () => texture === 'halftone' ? [ids.C, ids.M, ids.Y, ids.K] : [],
    [texture, ids.C, ids.M, ids.Y, ids.K],
  );
  useHalftoneScreen(hostRef, screenIds, { step: textureStep, contrast: textureContrast, prefersReduced });

  const renderLayer = (filterId: string) => (
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
          {channelFilter(ids.C, 'C', colorC, channelContrast, texture, 0, textureStep, textureContrast)}
          {channelFilter(ids.M, 'M', colorM, channelContrast, texture, 1, textureStep, textureContrast)}
          {channelFilter(ids.Y, 'Y', colorY, channelContrast, texture, 2, textureStep, textureContrast)}
          {channelFilter(ids.K, 'K', colorK, channelContrast, texture, 3, textureStep, textureContrast)}
        </defs>
      </svg>

      {/* Sizer — establishes wrapper dimensions from the children's natural size. */}
      <span className={styles.sizer} aria-hidden="true">{children}</span>

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

      {/* Transparent interaction layer — captures pointer/keyboard events for
          buttons, links, etc. placed in children. The ink layers are inert. */}
      <span className={styles.interactionLayer}>{children}</span>
    </span>
  );
}
