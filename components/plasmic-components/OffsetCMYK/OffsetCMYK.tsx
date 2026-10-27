import React, { useId, useMemo, useRef } from 'react';
import styles from './OffsetCMYK.module.css';
import m from '../OffsetShape/offsetMotion.module.css';
import { useAnimationTier } from '@/hooks/useAnimationTier';
import { useIsWebKit } from '@/hooks/useIsWebKit';
import {
  buildWobble,
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
  const { prefersReduced } = useAnimationTier();
  const webkit = useIsWebKit();

  const wobbleC = useMemo(() => buildWobble(uid.charCodeAt(0) + 1, jitter), [uid, jitter]);
  const wobbleM = useMemo(() => buildWobble(uid.charCodeAt(0) + 2, jitter), [uid, jitter]);
  const wobbleY = useMemo(() => buildWobble(uid.charCodeAt(0) + 3, jitter), [uid, jitter]);
  const wobbleK = useMemo(() => buildWobble(uid.charCodeAt(0) + 4, jitter), [uid, jitter]);

  const hostRef = useRef<HTMLSpanElement>(null);
  useOffsetInteraction(hostRef, interaction);

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
      className={[styles.wrapper, m.host, className ?? ''].filter(Boolean).join(' ')}
      style={offsetHostVars(easeDuration)}
      data-active={restsActive(interaction) ? '' : undefined}
      // Each plate is a full SVG filter chain: hold the plates still on
      // touch, where sub-pixel breathing is not worth re-rasterizing four.
      data-static-touch=""
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          {channelFilter(ids.C, 'C', colorC, channelContrast, texture, 0, textureStep, textureContrast, webkit)}
          {channelFilter(ids.M, 'M', colorM, channelContrast, texture, 1, textureStep, textureContrast, webkit)}
          {channelFilter(ids.Y, 'Y', colorY, channelContrast, texture, 2, textureStep, textureContrast, webkit)}
          {channelFilter(ids.K, 'K', colorK, channelContrast, texture, 3, textureStep, textureContrast, webkit)}
        </defs>
      </svg>

      {/* Sizer — establishes wrapper dimensions from the children's natural size. */}
      <span className={styles.sizer} aria-hidden="true">{children}</span>

      <span
        className={[styles.layer, m.layer].join(' ')}
        aria-hidden="true"
        inert
        style={{
          ...offsetLayerVars(-1, -1, offsetX, offsetY),
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        <span className={m.wobble} style={wobbleVars(wobbleC)}>{renderLayer(ids.C)}</span>
      </span>

      <span
        className={[styles.layer, m.layer].join(' ')}
        aria-hidden="true"
        inert
        style={{
          ...offsetLayerVars(1, -1, offsetX, offsetY),
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        <span className={m.wobble} style={wobbleVars(wobbleM)}>{renderLayer(ids.M)}</span>
      </span>

      <span
        className={[styles.layer, m.layer].join(' ')}
        aria-hidden="true"
        inert
        style={{
          ...offsetLayerVars(-1, 1, offsetX, offsetY),
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
        }}
      >
        <span className={m.wobble} style={wobbleVars(wobbleY)}>{renderLayer(ids.Y)}</span>
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
        <span className={m.wobble} style={wobbleVars(wobbleK)}>{renderLayer(ids.K)}</span>
      </span>

      {/* Transparent interaction layer — captures pointer/keyboard events for
          buttons, links, etc. placed in children. The ink layers are inert. */}
      <span className={styles.interactionLayer}>{children}</span>
    </span>
  );
}
