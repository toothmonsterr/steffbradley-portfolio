import React, { useEffect, useId, useState } from 'react';
import { NextImage } from '../NextImage';
import styles from './CaseStudyGallery.module.css';

/** Plasmic CMS image sub-fields arrive as objects, not bare URL strings. */
type CmsImage = string | { url?: string } | null | undefined;

export interface CaseStudyGalleryProps {
  /**
   * A whole CMS object field of image slots — e.g. caseStudyFeatures
   * (featureImg1..4) or caseStudyCarousel (carouselImg1..6).
   * Bind the object itself, not an individual sub-field.
   */
  images?: Record<string, CmsImage> | null;
  /** grid — all images at once. carousel — one at a time with prev/next. */
  layout?: 'grid' | 'carousel';
  columns?: number;
  gap?: number;
  /** CSS aspect-ratio for each tile, e.g. "4 / 3" or "16 / 9" */
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  /** Corner radius in px */
  rounded?: number;
  alt?: string;
  /** Disable lazy loading on the first tile — use only above the fold */
  priority?: boolean;

  // ── Carousel-only ────────────────────────────────────────────────────────
  /** Wrap from the last image back to the first (and vice versa) */
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  /** Diameter of the arrow buttons in px */
  arrowSize?: number;
  arrowColor?: string;
  arrowIconColor?: string;
  /**
   * How far the arrows sit from the frame's edge, in px. Positive values push
   * them outward — negative pulls them inside. Matches the overhanging arrow
   * treatment where the buttons straddle the frame border.
   */
  arrowOffset?: number;
  dotColor?: string;
  activeDotColor?: string;

  className?: string;
}

function toSrc(value: CmsImage): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value || undefined;
  if (typeof value === 'object' && 'url' in value) return value.url || undefined;
  return undefined;
}

export function CaseStudyGallery({
  images,
  layout = 'grid',
  columns = 2,
  gap = 24,
  aspectRatio = '4 / 3',
  objectFit = 'cover',
  rounded = 0,
  alt = '',
  priority = false,
  loop = true,
  showArrows = true,
  showDots = true,
  arrowSize = 56,
  arrowColor = '#201B2A',
  arrowIconColor = '#FFFFFF',
  arrowOffset = 0,
  dotColor = 'rgba(32,27,42,0.25)',
  activeDotColor = '#201B2A',
  className,
}: CaseStudyGalleryProps) {
  const srcs =
    images && typeof images === 'object'
      ? Object.keys(images)
          // Numeric collation so featureImg2 sorts before featureImg10.
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map(key => toSrc(images[key]))
          .filter((src): src is string => !!src)
      : [];

  const [index, setIndex] = useState(0);
  const groupId = useId().replace(/:/g, '');

  // Slots can change when the CMS row does; keep the index in range.
  useEffect(() => {
    setIndex(i => (srcs.length === 0 ? 0 : Math.min(i, srcs.length - 1)));
  }, [srcs.length]);

  // Unfilled slots render nothing at all — no empty grid, no broken tiles.
  if (srcs.length === 0) {
    return null;
  }

  if (layout === 'grid') {
    return (
      <div
        className={[styles.grid, className ?? ''].filter(Boolean).join(' ')}
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
          gap,
        }}
      >
        {srcs.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={styles.cell}
            style={{ aspectRatio, borderRadius: rounded || undefined }}
          >
            <NextImage
              src={src}
              alt={alt}
              fill
              objectFit={objectFit}
              priority={priority && i === 0}
            />
          </div>
        ))}
      </div>
    );
  }

  // ── Carousel ──────────────────────────────────────────────────────────────
  const count = srcs.length;
  const atStart = index === 0;
  const atEnd = index === count - 1;
  const canPrev = loop || !atStart;
  const canNext = loop || !atEnd;

  const go = (delta: number) =>
    setIndex(i => {
      const next = i + delta;
      if (next < 0) return loop ? count - 1 : 0;
      if (next >= count) return loop ? 0 : count - 1;
      return next;
    });

  return (
    <div
      className={[styles.carousel, className ?? ''].filter(Boolean).join(' ')}
      role="group"
      aria-roledescription="carousel"
    >
      <div id={groupId} className={styles.viewport} style={{ aspectRatio, borderRadius: rounded || undefined }}>
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {srcs.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              // Off-screen slides are hidden from assistive tech and taken out
              // of the tab order, so keyboard focus cannot land on them.
              aria-hidden={i !== index}
              inert={i !== index}
            >
              <NextImage
                src={src}
                alt={alt}
                fill
                objectFit={objectFit}
                priority={priority && i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            className={[styles.arrow, styles.arrowPrev].join(' ')}
            style={{
              width: arrowSize,
              height: arrowSize,
              background: arrowColor,
              color: arrowIconColor,
              left: -arrowOffset,
            }}
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label="Previous image"
            aria-controls={groupId}
          >
            <svg viewBox="0 0 24 24" width="45%" height="45%" aria-hidden="true" focusable="false">
              <path
                d="M15 4 L7 12 L15 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={[styles.arrow, styles.arrowNext].join(' ')}
            style={{
              width: arrowSize,
              height: arrowSize,
              background: arrowColor,
              color: arrowIconColor,
              right: -arrowOffset,
            }}
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label="Next image"
            aria-controls={groupId}
          >
            <svg viewBox="0 0 24 24" width="45%" height="45%" aria-hidden="true" focusable="false">
              <path
                d="M9 4 L17 12 L9 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className={styles.dots}>
          {srcs.map((src, i) => (
            <button
              key={`dot-${src}-${i}`}
              type="button"
              className={styles.dot}
              style={{ background: i === index ? activeDotColor : dotColor }}
              onClick={() => setIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
