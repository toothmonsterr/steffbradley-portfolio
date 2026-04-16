import React from 'react';
import styles from './NoiseOverlay.module.css';

interface NoiseOverlayProps {
  // Controls the visibility of the noise. 0.08–0.18 is the sweet spot for a
  // subtle risograph feel without being too heavy.
  opacity?: number;
  className?: string;
}

// Renders a thresholded B&W noise overlay over the parent element.
// The parent MUST have position: relative (or absolute/fixed/sticky).
// The SVG filter definition lives in pages/_document.tsx.
export function NoiseOverlay({ opacity = 0.12, className }: NoiseOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={[styles.overlay, className ?? ''].filter(Boolean).join(' ')}
      style={{ '--noise-opacity': opacity } as React.CSSProperties}
    />
  );
}
