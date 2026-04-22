import React, { useId, useMemo } from 'react';
import { mulberry32 } from '../OffsetShape/shared';

export interface TornEdgeProps {
  seed?: number;
  roughness?: number;
  stepSize?: number;
  height?: number;
  direction?: 'up' | 'down';
  /** Color of the paper/torn shape */
  color?: string;
  /** Color of the fill on the opposite side of the tear — matches the adjacent section's background */
  backgroundColor?: string;
  /** Shadow color */
  shadowColor?: string;
  /** Shadow blur radius in px */
  shadowBlur?: number;
  /** Shadow horizontal offset in px */
  shadowX?: number;
  /**
   * Shadow vertical offset in px.
   * Positive = downward (use for direction: down).
   * Negative = upward (use for direction: up).
   */
  shadowY?: number;
  /** Shadow opacity (0–1) */
  shadowOpacity?: number;
  className?: string;
}

// Virtual width of the path coordinate system. The SVG stretches to fill its
// container via preserveAspectRatio="none", so this can be any resolution.
const VWIDTH = 1000;

export function TornEdge({
  seed           = 1,
  roughness      = 20,
  stepSize       = 12,
  height         = 60,
  direction      = 'down',
  color          = '#FFFFFF',
  backgroundColor = 'transparent',
  shadowColor    = '#000000',
  shadowBlur     = 8,
  shadowX        = 0,
  shadowY        = 4,
  shadowOpacity  = 0.25,
  className,
}: TornEdgeProps) {
  const uid      = useId().replace(/:/g, '');
  const filterId = `torn-shadow-${uid}`;

  const pathD = useMemo(() => {
    const rand  = mulberry32(seed);
    const baseY = height / 2;
    const clamp = (v: number) => Math.max(0, Math.min(height, v));
    const pts: string[] = [];

    let x = 0;
    while (x <= VWIDTH) {
      pts.push(`${x},${clamp(baseY + (rand() * 2 - 1) * roughness).toFixed(1)}`);
      x += stepSize;
    }
    if (x - stepSize < VWIDTH) {
      pts.push(`${VWIDTH},${clamp(baseY + (rand() * 2 - 1) * roughness).toFixed(1)}`);
    }

    const torn = pts.join(' L ');
    return direction === 'down'
      ? `M 0,0 L ${torn} L ${VWIDTH},0 Z`
      : `M 0,${height} L ${torn} L ${VWIDTH},${height} Z`;
  }, [seed, roughness, stepSize, height, direction]);

  const hasShadow = shadowOpacity > 0;

  return (
    <svg
      className={className}
      width="100%"
      height={height}
      viewBox={`0 0 ${VWIDTH} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {hasShadow && (
        <defs>
          {/* Filter region is generous to accommodate shadows in any direction */}
          <filter id={filterId} x="-5%" y="-150%" width="110%" height="400%">
            <feDropShadow
              dx={shadowX}
              dy={shadowY}
              stdDeviation={shadowBlur}
              floodColor={shadowColor}
              floodOpacity={shadowOpacity}
            />
          </filter>
        </defs>
      )}

      {/* Background fill — covers the full SVG area; the torn path paints on top of it.
          The portion NOT covered by the path (the other side of the tear) shows this color. */}
      <rect x="0" y="0" width={VWIDTH} height={height} fill={backgroundColor} />

      {/* Torn paper shape with optional shadow */}
      <path
        d={pathD}
        fill={color}
        filter={hasShadow ? `url(#${filterId})` : undefined}
      />
    </svg>
  );
}
