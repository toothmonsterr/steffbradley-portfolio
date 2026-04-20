import React, { useMemo } from 'react';
import { mulberry32 } from '../OffsetShape/shared';

export interface TornEdgeProps {
  seed?: number;
  roughness?: number;
  stepSize?: number;
  height?: number;
  direction?: 'up' | 'down';
  color?: string;
  className?: string;
}

// Virtual width of the path coordinate system. The SVG stretches to fill its
// container via preserveAspectRatio="none", so this can be any resolution.
const VWIDTH = 1000;

export function TornEdge({
  seed      = 1,
  roughness = 20,
  stepSize  = 12,
  height    = 60,
  direction = 'down',
  color     = '#FFFFFF',
  className,
}: TornEdgeProps) {
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
    // Add a point at the right edge if the last step didn't land exactly on it.
    if (x - stepSize < VWIDTH) {
      pts.push(`${VWIDTH},${clamp(baseY + (rand() * 2 - 1) * roughness).toFixed(1)}`);
    }

    const torn = pts.join(' L ');
    return direction === 'down'
      ? `M 0,0 L ${torn} L ${VWIDTH},0 Z`
      : `M 0,${height} L ${torn} L ${VWIDTH},${height} Z`;
  }, [seed, roughness, stepSize, height, direction]);

  return (
    <svg
      className={className}
      width="100%"
      height={height}
      viewBox={`0 0 ${VWIDTH} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d={pathD} fill={color} />
    </svg>
  );
}
