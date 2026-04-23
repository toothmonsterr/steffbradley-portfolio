import React, { useEffect, useRef } from 'react';
import styles from './TypographyShuffle.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const FAMILIES = ['"TAN Rosebud", serif', '"Syne", sans-serif', '"Urbanist", sans-serif'];
const SIZES    = ['0.75rem', '1rem', '1.5rem', '2rem', '3rem', '4.5rem'];
const WEIGHTS  = [300, 400, 600, 700, 900];
const SPACINGS = ['-0.05em', '0em', '0.05em', '0.1em', '0.2em', '0.3em'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface TypographyShuffleProps {
  text?: string;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div';
  granularity?: 'character' | 'word' | 'line';
  trigger?: 'scroll' | 'load' | 'always';
  duration?: number;
  stagger?: number;
  shuffleFamily?: boolean;
  shuffleSize?: boolean;
  shuffleWeight?: boolean;
  shuffleSpacing?: boolean;
  playOnce?: boolean;
  className?: string;
}

export function TypographyShuffle({
  text = 'Toothmonster',
  tag = 'p',
  granularity = 'character',
  trigger = 'scroll',
  duration = 1.2,
  stagger = 0.04,
  shuffleFamily = true,
  shuffleSize = true,
  shuffleWeight = true,
  shuffleSpacing = true,
  playOnce = true,
  className,
}: TypographyShuffleProps) {
  const prefersReduced = usePrefersReducedMotion();
  const refEl = useRef<HTMLSpanElement>(null);
  const unitRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef(0);
  const hasPlayedRef = useRef(false);

  const units: string[] = granularity === 'character'
    ? text.split('')
    : granularity === 'word'
    ? text.split(' ')
    : [text];

  // Keep unitRefs array sized correctly
  unitRefs.current = unitRefs.current.slice(0, units.length);

  const startAnimation = () => {
    if (playOnce && hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    const finalStyle = refEl.current ? getComputedStyle(refEl.current) : null;
    const finalFamily  = finalStyle?.fontFamily  ?? '';
    const finalSize    = finalStyle?.fontSize    ?? '1rem';
    const finalWeight  = finalStyle?.fontWeight  ?? '400';
    const finalSpacing = finalStyle?.letterSpacing ?? 'normal';

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      let allDone = true;

      for (let i = 0; i < units.length; i++) {
        const el = unitRefs.current[i];
        if (!el) continue;

        const delay = i * stagger;
        const local = Math.min(1, Math.max(0, (elapsed - delay) / duration));
        const eased = local * local;

        if (local < 1) allDone = false;

        if (eased >= 0.95) {
          if (shuffleFamily)  el.style.fontFamily     = finalFamily;
          if (shuffleSize)    el.style.fontSize       = finalSize;
          if (shuffleWeight)  el.style.fontWeight     = finalWeight;
          if (shuffleSpacing) el.style.letterSpacing  = finalSpacing;
        } else {
          if (shuffleFamily)  el.style.fontFamily     = pick(FAMILIES);
          if (shuffleSize)    el.style.fontSize       = pick(SIZES);
          if (shuffleWeight)  el.style.fontWeight     = String(pick(WEIGHTS));
          if (shuffleSpacing) el.style.letterSpacing  = pick(SPACINGS);
        }
      }

      if (!allDone) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Lock all to final
        for (let i = 0; i < units.length; i++) {
          const el = unitRefs.current[i];
          if (!el) continue;
          if (shuffleFamily)  el.style.fontFamily    = finalFamily;
          if (shuffleSize)    el.style.fontSize      = finalSize;
          if (shuffleWeight)  el.style.fontWeight    = finalWeight;
          if (shuffleSpacing) el.style.letterSpacing = finalSpacing;
        }
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (prefersReduced || trigger === 'always') return;

    if (trigger === 'load') {
      startAnimation();
      return () => cancelAnimationFrame(rafRef.current);
    }

    // scroll
    const root = unitRefs.current[0]?.parentElement;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startAnimation();
          if (playOnce) observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, prefersReduced, duration, stagger, playOnce, shuffleFamily, shuffleSize, shuffleWeight, shuffleSpacing, text]);

  const Tag = tag as React.ElementType;

  return (
    <Tag className={[styles.root, className ?? ''].filter(Boolean).join(' ')}>
      <span ref={refEl} className={styles.ref} aria-hidden="true">{text}</span>
      {units.map((unit, i) => (
        <React.Fragment key={i}>
          <span
            ref={(el) => { unitRefs.current[i] = el; }}
            className={styles.unit}
          >
            {unit}
          </span>
          {granularity === 'word' && i < units.length - 1 && ' '}
        </React.Fragment>
      ))}
    </Tag>
  );
}
