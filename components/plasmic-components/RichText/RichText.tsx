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

/**
 * Block-level tags. Whitespace touching one of these is formatting, never
 * content — a newline between </p> and <p> renders as nothing in a block
 * container. Whitespace between INLINE tags is meaningful ("<em>a</em> <b>b</b>")
 * and is left alone.
 */
const BLOCK_TAGS =
  'p|div|h[1-6]|ul|ol|li|figure|figcaption|blockquote|pre|hr|img|video|iframe|' +
  'table|thead|tbody|tfoot|tr|td|th|section|article|aside|header|footer|main|nav';

// `\b` after the tag name so `p` does not match `<param>`, and `[^>]*` covers
// any attributes.
const WS_AFTER_BLOCK = new RegExp(`(</?(?:${BLOCK_TAGS})\\b[^>]*>)\\s+(?=<)`, 'gi');
const WS_BEFORE_BLOCK = new RegExp(`>\\s+(?=</?(?:${BLOCK_TAGS})\\b[^>]*>)`, 'gi');

/**
 * Remove formatting whitespace between block tags.
 *
 * CMS rich text carries a newline between every block element. In a block
 * container those collapse to nothing, but Plasmic applies `display: flex` to
 * component instances, and in a flex or grid container each one becomes a
 * layout item with its own line box — roughly 170px of dead space across a
 * single case study, plus blockified children that break the caption layout.
 *
 * Stripping the whitespace fixes it at the source, so the result no longer
 * depends on winning a specificity fight over `display`.
 */
function stripBlockWhitespace(html: string): string {
  return html.replace(WS_AFTER_BLOCK, '$1').replace(WS_BEFORE_BLOCK, '>');
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
      dangerouslySetInnerHTML={{ __html: stripBlockWhitespace(html) }}
    />
  );
}
