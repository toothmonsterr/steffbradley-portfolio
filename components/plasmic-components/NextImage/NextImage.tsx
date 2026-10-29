import React from 'react';
import Image from 'next/image';

export interface NextImageProps {
  src?: string;
  alt?: string;
  /** Explicit width in px — required when fill is off */
  width?: number;
  /** Explicit height in px — required when fill is off */
  height?: number;
  /**
   * Fill mode: image expands to cover its parent container.
   * The parent must have position: relative and explicit dimensions set in Plasmic.
   */
  fill?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  /** Mark as high-priority (disables lazy loading — use for above-the-fold images) */
  priority?: boolean;
  /** Image quality 1–100 (default 75). Lower = smaller file, higher = sharper. */
  quality?: number;
  /**
   * Skip Next.js optimisation — required for external URLs not listed in
   * next.config remotePatterns, or for SVGs/GIFs.
   */
  unoptimized?: boolean;
  /**
   * How wide the image renders, as a media-query list (e.g. "300px" or
   * "(max-width: 768px) 100vw, 50vw"). Lets the browser pick the smallest
   * srcset candidate instead of assuming the full viewport width.
   */
  sizes?: string;
  /** Fires once the image has loaded (code use only — not a Studio prop). */
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  className?: string;
}

// GIF/WebP/AVIF files are served as-is: the optimiser would either flatten an
// animation or re-encode a file that is already compressed for the web.
const PASS_THROUGH = /\.(gif|webp|avif)(\?|#|$)/i;

export function NextImage({
  src,
  alt = '',
  width,
  height,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  priority = false,
  quality,
  unoptimized = false,
  sizes,
  onLoad,
  className,
}: NextImageProps) {
  if (!src) {
    return (
      <div
        style={{
          width: fill ? '100%' : (width ?? 300),
          height: fill ? '100%' : (height ?? 200),
          background: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#9ca3af',
        }}
      >
        No image
      </div>
    );
  }

  const skipOptimizer = unoptimized || PASS_THROUGH.test(src);

  const style: React.CSSProperties = {
    objectFit,
    objectPosition,
  };

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        style={style}
        priority={priority}
        quality={quality}
        unoptimized={skipOptimizer}
        sizes={sizes}
        onLoad={onLoad}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 600}
      style={style}
      priority={priority}
      quality={quality}
      unoptimized={skipOptimizer}
      sizes={sizes}
      onLoad={onLoad}
      className={className}
    />
  );
}
