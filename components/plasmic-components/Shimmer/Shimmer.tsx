import React from 'react';
import styles from './Shimmer.module.css';

export interface ShimmerProps {
  /** Base (resting) color of the block */
  baseColor?: string;
  /** Color of the moving highlight band */
  highlightColor?: string;
  /** Animation duration in seconds (default 1.4) */
  durationSec?: number;
  /** Border radius in px (default 6) */
  radius?: number;
  /** Sweep angle in degrees — 90 = left→right, 180 = top→bottom (default 90) */
  angleDeg?: number;
  className?: string;
}

export function Shimmer({
  baseColor      = 'rgba(0, 0, 0, 0.06)',
  highlightColor = 'rgba(255, 255, 255, 0.6)',
  durationSec    = 1.4,
  radius         = 6,
  angleDeg       = 90,
  className,
}: ShimmerProps) {
  const cssVars = {
    '--shimmer-base':      baseColor,
    '--shimmer-highlight': highlightColor,
    '--shimmer-duration':  `${durationSec}s`,
    '--shimmer-radius':    `${radius}px`,
    '--shimmer-angle':     `${angleDeg}deg`,
  } as React.CSSProperties;

  return (
    <div
      className={[styles.root, className ?? ''].filter(Boolean).join(' ')}
      style={cssVars}
      aria-hidden="true"
    />
  );
}
