import React, { useId, useRef } from 'react';
import { motion, useAnimationFrame, useScroll, useSpring, useTransform } from 'motion/react';
import styles from './RevealOnScroll.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { colorOrDefault } from '@/hooks/colorDefault';

export interface RevealOnScrollProps {
  children?: React.ReactNode;
  /** Max blur in px — organic, noise-displaced (not clean Gaussian) */
  blurAmount?: number;
  /** Max displacement scale — controls how noisy/wavy the blur looks */
  displaceAmount?: number;
  /** Max grain overlay opacity at the start of the reveal (0–1) */
  noiseIntensity?: number;
  /** Viewport fraction (0–1) where the reveal completes — 0.1 = fast, 0.7 = slow */
  endRatio?: number;
  /** Noise grain size — larger = chunkier grain */
  grainSize?: number;
  /** Grain overlay color */
  noiseColor?: string;
  /**
   * scroll — reveal on scroll (default)
   * always — show fully revealed; use in Plasmic Studio canvas preview
   */
  trigger?: 'scroll' | 'always';
  className?: string;
}

export function RevealOnScroll({
  children,
  blurAmount = 12,
  displaceAmount = 30,
  noiseIntensity = 0.5,
  endRatio = 0.35,
  grainSize = 1.2,
  noiseColor,
  trigger = 'scroll',
  className,
}: RevealOnScrollProps) {
  const prefersReduced = usePrefersReducedMotion();
  const uid = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement>(null);

  // SVG filter element refs — updated imperatively each frame
  const turbRef         = useRef<SVGFETurbulenceElement>(null);
  const blurRef         = useRef<SVGFEGaussianBlurElement>(null);
  const displaceRef     = useRef<SVGFEDisplacementMapElement>(null);
  const saturateRef     = useRef<SVGFEColorMatrixElement>(null);
  const overlayTurbRef  = useRef<SVGFETurbulenceElement>(null);

  // Seed accumulators for chaotic noise
  const seedRef        = useRef(0);
  const overlaySeedRef = useRef(0);

  const resolvedNoiseColor = colorOrDefault(noiseColor, '#201B2A');
  const grainFrequency = Math.max(0.1, 0.85 / Math.max(0.4, grainSize));

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', `start ${endRatio}`],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  // MotionValues consumed by motion elements
  const contentOpacity = useTransform(smoothProgress, [0, 1], [0.1, 1]);
  const noiseOpacity   = useTransform(smoothProgress, [0, 1], [noiseIntensity, 0]);

  // Imperative SVG attribute updates — zero React re-renders
  useAnimationFrame(() => {
    if (prefersReduced || trigger !== 'scroll') return;
    const p     = smoothProgress.get();
    const chaos = Math.max(0, 1 - p);

    if (blurRef.current)     blurRef.current.setAttribute('stdDeviation', String((1 - p) * blurAmount));
    if (displaceRef.current) displaceRef.current.setAttribute('scale', String((1 - p) * displaceAmount));
    if (saturateRef.current) saturateRef.current.setAttribute('values', String(p));

    if (chaos > 0.02) {
      seedRef.current        = (seedRef.current        + chaos * 0.5) % 1000;
      overlaySeedRef.current = (overlaySeedRef.current + chaos * 0.4) % 1000;
      if (turbRef.current)        turbRef.current.setAttribute('seed',        String(Math.floor(seedRef.current)));
      if (overlayTurbRef.current) overlayTurbRef.current.setAttribute('seed', String(Math.floor(overlaySeedRef.current)));
    }
  });

  const filterId        = `reveal-content-${uid}`;
  const overlayFilterId = `reveal-overlay-${uid}`;

  // In 'always' mode or when reduced motion is preferred: fully revealed immediately
  if (trigger === 'always' || prefersReduced) {
    return (
      <div ref={rootRef} className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>

      {/* Zero-size SVG carrying both filter definitions */}
      <svg width="0" height="0" className={styles.defs} aria-hidden="true" focusable="false">
        <defs>
          {/*
            Content filter: noisy blur + turbulence displacement + desaturate.
            All three intensities collapse to zero as scroll progress → 1.
          */}
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              ref={turbRef}
              type="turbulence"
              baseFrequency="0.03"
              numOctaves={2}
              seed={0}
              result="noise"
            />
            <feGaussianBlur
              ref={blurRef}
              in="SourceGraphic"
              stdDeviation={blurAmount}
              result="blurred"
            />
            <feDisplacementMap
              ref={displaceRef}
              in="blurred"
              in2="noise"
              scale={displaceAmount}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feColorMatrix
              ref={saturateRef}
              type="saturate"
              values="0"
              in="displaced"
            />
          </filter>

          {/* Overlay filter: grain threshold — same pattern as NoiseOverlay */}
          <filter id={overlayFilterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              ref={overlayTurbRef}
              type="fractalNoise"
              baseFrequency={grainFrequency}
              numOctaves={2}
              seed={0}
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
            <feComponentTransfer in="grey" result="mask">
              <feFuncR type="discrete" tableValues="0 1" />
              <feFuncG type="discrete" tableValues="0 1" />
              <feFuncB type="discrete" tableValues="0 1" />
              <feFuncA type="discrete" tableValues="0 1" />
            </feComponentTransfer>
            <feFlood floodColor={resolvedNoiseColor} result="tint" />
            <feComposite in="tint" in2="mask" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* Slot content — noisy blur + desaturate applied via SVG filter */}
      <motion.div
        className={styles.content}
        style={{
          opacity: contentOpacity,
          filter: `url(#${filterId})`,
        }}
      >
        {children}
      </motion.div>

      {/* Grain overlay — fades out as reveal completes */}
      <motion.svg
        className={styles.overlay}
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
        style={{ opacity: noiseOpacity }}
      >
        <rect x="0" y="0" width="100%" height="100%" filter={`url(#${overlayFilterId})`} />
      </motion.svg>

    </div>
  );
}
