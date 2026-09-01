import React from 'react';
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
  columns = 2,
  gap = 24,
  aspectRatio = '4 / 3',
  objectFit = 'cover',
  rounded = 0,
  alt = '',
  priority = false,
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

  // Unfilled slots render nothing at all — no empty grid, no broken tiles.
  if (srcs.length === 0) {
    return null;
  }

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
