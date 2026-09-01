import React from 'react';
import styles from './RichText.module.css';

export interface RichTextProps {
  /**
   * HTML string from a Plasmic CMS rich-text field.
   * Bind to e.g. $ctx.plasmicCmsCaseStudyTitleItem.data.caseStudyContentTop
   */
  html?: string;
  /** Max line length in px for readability. Leave unset to fill the parent. */
  maxWidth?: number;
  align?: 'left' | 'center';
  /** Base body text size */
  size?: 'small' | 'body' | 'large';
  /**
   * Accent color for links and blockquote rules. Bind to the row's colour field
   * (e.g. caseStudyColor) so each case study's prose picks up its own brand colour.
   */
  accentColor?: string;
  /**
   * How <figcaption> elements inside the CMS content are styled.
   * plain — muted text under the image. tape — a torn strip of scotch tape,
   * matching the gallery's caption treatment.
   */
  captionStyle?: 'plain' | 'tape';
  /** Tape tint. Real tape is translucent, so keep some alpha. */
  tapeColor?: string;
  /** Tilt in degrees for taped captions. 0 lays them straight. */
  tapeRotation?: number;
  className?: string;
}

export function RichText({
  html,
  maxWidth,
  align = 'left',
  size = 'body',
  accentColor,
  captionStyle = 'plain',
  tapeColor = 'rgba(221, 234, 68, 0.75)',
  tapeRotation = 3,
  className,
}: RichTextProps) {
  // An unfilled CMS field renders nothing rather than an empty box.
  if (!html || !html.trim()) {
    return null;
  }

  return (
    <div
      className={[
        styles.prose,
        styles[size],
        captionStyle === 'tape' ? styles.tapeCaptions : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={{
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        textAlign: align,
        // Custom property consumed by the link / blockquote rules in the stylesheet.
        ...(accentColor ? ({ ['--rt-accent']: accentColor } as React.CSSProperties) : {}),
        ...({
          ['--rt-tape']: tapeColor,
          ['--rt-tape-tilt']: `${tapeRotation}deg`,
        } as React.CSSProperties),
      }}
      // Safe here: this HTML is authored solely through the Plasmic CMS editor by the
      // site owner — it is never user-generated content from untrusted visitors.
      // If contributors are ever added, sanitize `html` at this single call site.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
