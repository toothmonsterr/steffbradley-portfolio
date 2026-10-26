import React, { useId } from 'react';
import styles from './FloatingElement.module.css';

export interface FloatingElementProps {
  children?: React.ReactNode;
  animationAmplitude?: number;
  animationDuration?: number;
  /** Fixed phase offset 0–1. Leave unset for a per-instance offset. */
  phaseOffset?: number;
  className?: string;
}

// Stable 0–1 value from the instance id. The server and client agree on it, so
// it can go into the server-rendered style without a hydration mismatch (a
// Math.random() phase could not).
function phaseFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// The float is a CSS keyframe animation on `translate` and `rotate`, so it runs
// on the compositor: no per-frame JavaScript, and the content (often a filtered
// or textured image) is rasterized once and moved as a layer. It used to be a
// Motion `animate` loop on the main thread. Reduced motion is handled in CSS.
export function FloatingElement({
  children,
  animationAmplitude = 12,
  animationDuration = 4,
  phaseOffset,
  className,
}: FloatingElementProps) {
  const id = useId();
  const phase = phaseOffset ?? phaseFromId(id);
  const vars = {
    '--float-amp': `${-animationAmplitude}px`,
    '--float-dur': `${animationDuration}s`,
    '--float-delay': `${-(phase * animationDuration)}s`,
  } as React.CSSProperties;

  return (
    <div className={[styles.float, className ?? ''].filter(Boolean).join(' ')} style={vars}>
      {children}
    </div>
  );
}
