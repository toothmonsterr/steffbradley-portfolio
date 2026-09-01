import React, { useEffect, useId, useState } from 'react';
import { NextImage } from '../NextImage';
import { ScotchTape } from '../ScotchTape';
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
  /** Show captions read from the CMS caption slots (carouselCap1, etc). */
  showCaptions?: boolean;
  /** plain — text under the image. tape — text on a strip of scotch tape. */
  captionStyle?: 'plain' | 'tape';
  captionColor?: string;
  /** Tape tint. Real tape is translucent, so keep some alpha. */
  tapeColor?: string;
  /** Tape tilt in degrees — real tape is rarely applied straight. */
  tapeRotation?: number;
  /** Disable lazy loading on the first tile — use only above the fold */
  priority?: boolean;

  // ── Carousel-only ────────────────────────────────────────────────────────
  /**
   * How many images are visible in the frame at once. 1 is a classic
   * one-at-a-time carousel; 2+ shows several side by side and advances by one.
   * Falls back to a single slide below 720px.
   */
  visibleSlides?: number;
  /** Gap between slides in px when more than one is visible. */
  slideGap?: number;
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

/** Trim float noise (33.333333333333336 → 33.3333) out of inline styles. */
function round(n: number): number {
  return Math.round(n * 10000) / 10000;
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
  showCaptions = true,
  captionStyle = 'plain',
  captionColor,
  tapeColor = 'rgba(221, 234, 68, 0.75)',
  tapeRotation = -2,
  priority = false,
  visibleSlides = 1,
  slideGap = 16,
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
  // Images are paired with their captions by slot NUMBER, not by position, so
  // a blank slot in the middle cannot shift captions onto the wrong image.
  const slides = React.useMemo(() => {
    if (!images || typeof images !== 'object') return [];

    const bySlot = new Map<number, { src?: string; caption?: string }>();
    let unnumbered = 0;

    for (const key of Object.keys(images)) {
      const value = images[key];
      const digits = key.match(/(\d+)\s*$/);
      // Keys with no trailing number (a plain `image`) still get a stable slot.
      const slot = digits ? parseInt(digits[1], 10) : ++unnumbered * 1000;
      const entry = bySlot.get(slot) ?? {};

      // A caption slot is any text value whose key is not an image key —
      // matched on the key stem so cap/caption/label/title all work.
      if (typeof value === 'string' && /cap|caption|label|title|text/i.test(key)) {
        entry.caption = value;
      } else {
        const src = toSrc(value);
        if (src) entry.src = src;
      }
      bySlot.set(slot, entry);
    }

    return [...bySlot.entries()]
      .sort((a, b) => a[0] - b[0])
      // A caption with no image has nothing to caption.
      .filter(([, v]) => !!v.src)
      .map(([, v]) => ({ src: v.src as string, caption: v.caption?.trim() || undefined }));
  }, [images]);

  const srcs = slides.map(s => s.src);

  const [index, setIndex] = useState(0);
  const groupId = useId().replace(/:/g, '');

  // Below 720px two side-by-side images are too small to read, so the carousel
  // collapses to one at a time. This has to be tracked in JS rather than a
  // media query: slide width and the track translate are computed from the
  // same number, and a CSS-only override would desync them.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 720px)');
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Slots and the visible count can both change (CMS row edits, Studio prop
  // edits); keep the index within the range those allow.
  const clampMax = Math.max(
    0,
    srcs.length -
      (isNarrow ? 1 : Math.max(1, Math.min(Math.floor(visibleSlides), srcs.length || 1)))
  );
  useEffect(() => {
    setIndex(i => Math.min(i, clampMax));
  }, [clampMax]);

  // Unfilled slots render nothing at all — no empty grid, no broken tiles.
  if (srcs.length === 0) {
    return null;
  }

  if (layout === 'grid') {
    return (
      <div
        className={[styles.grid, className ?? ''].filter(Boolean).join(' ')}
        style={{
          ['--gallery-tape' as string]: tapeColor,
          gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
          gap,
        }}
      >
        {slides.map((slide, i) => (
          <figure key={`${slide.src}-${i}`} className={styles.figure}>
            <div
              className={styles.cell}
              style={{ aspectRatio, borderRadius: rounded || undefined }}
            >
              <NextImage
                src={slide.src}
                // A caption describes the image, so it doubles as alt text —
                // better than one shared `alt` repeated across every image.
                alt={slide.caption || alt}
                fill
                objectFit={objectFit}
                priority={priority && i === 0}
              />
            </div>
            {showCaptions && slide.caption && (
              <figcaption className={styles.caption}>
                {captionStyle === 'tape' ? (
                  <ScotchTape
                    className={styles.tape}
                    rotation={tapeRotation}
                    toothSize={6}
                    toothJitter={0.25}
                  >
                    <span className={styles.tapeLabel} style={{ color: captionColor }}>
                      {slide.caption}
                    </span>
                  </ScotchTape>
                ) : (
                  <span className={styles.plainCaption} style={{ color: captionColor }}>
                    {slide.caption}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    );
  }

  // ── Carousel ──────────────────────────────────────────────────────────────
  const count = srcs.length;
  // Never show more slides than exist, or the track leaves a trailing gap.
  const visible = isNarrow ? 1 : Math.max(1, Math.min(Math.floor(visibleSlides), count));
  // With several slides visible the track stops once the last one is flush
  // against the right edge, so the final index is count - visible.
  const maxIndex = Math.max(0, count - visible);
  const gapPx = visible > 1 ? slideGap : 0;

  const canPrev = loop || index > 0;
  const canNext = loop || index < maxIndex;
  // Arrows and dots are pointless when everything is already on screen.
  const hasPaging = count > visible;

  const go = (delta: number) =>
    setIndex(i => {
      const next = i + delta;
      if (next < 0) return loop ? maxIndex : 0;
      if (next > maxIndex) return loop ? 0 : maxIndex;
      return next;
    });

  return (
    <div
      className={[styles.carousel, className ?? ''].filter(Boolean).join(' ')}
      style={{ ['--gallery-tape' as string]: tapeColor } as React.CSSProperties}
      role="group"
      aria-roledescription="carousel"
    >
      {/* The aspect ratio governs the IMAGE, not the viewport — a caption
          strip adds height below it rather than eating into the artwork. */}
      <div id={groupId} className={styles.viewport}>
        <div
          className={styles.track}
          style={{
            gap: gapPx || undefined,
            // One step advances by a full slide plus a gap. A slide is
            // (viewport - gaps)/visible, so slide + gap works out to
            // 100/visible percent PLUS gap/visible px — the percentage is of
            // the viewport, which still includes the gaps.
            transform: `translateX(calc(${round(-index * (100 / visible))}% - ${round(
              (index * gapPx) / visible
            )}px))`,
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={`${slide.src}-${i}`}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              // Off-screen slides are hidden from assistive tech and taken out
              // of the tab order, so keyboard focus cannot land on them.
              style={{
                // Slides share the viewport minus the gaps between them.
                flex: `0 0 calc(${round(100 / visible)}% - ${round(
                  (gapPx * (visible - 1)) / visible
                )}px)`,
              }}
              aria-hidden={i < index || i >= index + visible}
              inert={i < index || i >= index + visible}
            >
              {/* The image fills whatever the caption strip leaves behind, so
                  the two stack instead of the caption overlaying the art. */}
              <div
                className={styles.slideImage}
                style={{ aspectRatio, borderRadius: rounded || undefined }}
              >
                <NextImage
                  src={slide.src}
                  alt={slide.caption || alt}
                  fill
                  objectFit={objectFit}
                  priority={priority && i === 0}
                />
              </div>
              {showCaptions && slide.caption && (
                <div className={styles.slideCaptionRow}>
                  {captionStyle === 'tape' ? (
                    <ScotchTape
                      className={styles.tape}
                      rotation={tapeRotation}
                      toothSize={6}
                      toothJitter={0.25}
                    >
                      <span className={styles.tapeLabel} style={{ color: captionColor }}>
                        {slide.caption}
                      </span>
                    </ScotchTape>
                  ) : (
                    <span className={styles.plainCaption} style={{ color: captionColor }}>
                      {slide.caption}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showArrows && hasPaging && (
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

      {showDots && hasPaging && (
        <div className={styles.dots}>
          {/* One dot per scroll position, which is maxIndex + 1 — not one per
              image, since several images share a position when visible > 1. */}
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              className={styles.dot}
              style={{ background: i === index ? activeDotColor : dotColor }}
              onClick={() => setIndex(i)}
              aria-label={`Go to position ${i + 1} of ${maxIndex + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
