import React, { useRef, useEffect } from 'react';
import styles from './DotOverlay.module.css';

export interface DotOverlayProps {
  /** First dot color (base state) */
  dotColorA?: string;
  /** Second dot color (blend target at peak hover) */
  dotColorB?: string;
  /** Dot grid cell size — any CSS length, e.g. '0.6em', '10px' */
  dotSize?: string;
  /** Max opacity when fully visible (0–1) */
  maxOpacity?: number;
  /**
   * 'hover'  — dots fade in when the parent element is hovered (default)
   * 'always' — always visible; useful for seeing the effect in Plasmic Studio
   * 'never'  — hidden; useful for toggling off without deleting the layer
   */
  trigger?: 'hover' | 'always' | 'never';
  className?: string;
}

export function DotOverlay({
  dotColorA,
  dotColorB,
  dotSize = '0.6em',
  maxOpacity = 1,
  trigger = 'hover',
  className,
}: DotOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || trigger !== 'hover') return;

    const parent = el.parentElement;
    if (!parent) return;

    const show = () => el.classList.add(styles.active);
    const hide = () => el.classList.remove(styles.active);

    parent.addEventListener('mouseenter', show);
    parent.addEventListener('mouseleave', hide);

    return () => {
      parent.removeEventListener('mouseenter', show);
      parent.removeEventListener('mouseleave', hide);
    };
  }, [trigger]);

  const vars = {
    ...(dotColorA  && { '--dot-a': dotColorA }),
    ...(dotColorB  && { '--dot-b': dotColorB }),
    '--dot-size':    dotSize,
    '--dot-opacity': maxOpacity,
  } as React.CSSProperties;

  const cls = [
    styles.overlay,
    trigger === 'always' ? styles.alwaysVisible : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return <div ref={ref} className={cls} style={vars} aria-hidden="true" />;
}
