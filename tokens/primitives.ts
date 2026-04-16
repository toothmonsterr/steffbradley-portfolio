export const colorPrimitive = {
  cream:       '#EADBC2',
  lavender:    '#CEBEE3',
  coral:       '#FF6A50',
  peach:       '#FFAB7B',
  chartreuse:  '#DDEA44',
  green:       '#52A159',
  navy:        '#00427F',
  brick:       '#802E28',
  sienna:      '#80553E',
  olive:       '#607522',
  forest:      '#295037',
  midnight:    '#201B2A',
} as const;

export const fontFamily = {
  display: '"TAN Rosebud", serif',
  heading: '"Syne", sans-serif',
  body:    '"Urbanist", sans-serif',
} as const;

// ── Spacing (px) ──────────────────────────────────────────────────────────────
// Named by value. 8-point grid; 4px and 12px are half-steps.
// Used for Plasmic token registration — components reference CSS vars directly.
export const spacingPx = {
  '4px':   '4px',
  '8px':   '8px',
  '12px':  '12px',
  '16px':  '16px',
  '24px':  '24px',
  '32px':  '32px',
  '40px':  '40px',
  '48px':  '48px',
  '56px':  '56px',
  '64px':  '64px',
  '72px':  '72px',
  '80px':  '80px',
  '88px':  '88px',
  '96px':  '96px',
  '104px': '104px',
  '112px': '112px',
  '120px': '120px',
  '128px': '128px',
  '136px': '136px',
  '144px': '144px',
} as const;

// ── Large layout sizes ─────────────────────────────────────────────────────────
// Common container / breakpoint widths.
export const spacingLarge = {
  '320px':  '320px',
  '375px':  '375px',
  '480px':  '480px',
  '640px':  '640px',
  '750px':  '750px',
  '768px':  '768px',
  '900px':  '900px',
  '1024px': '1024px',
  '1280px': '1280px',
  '1440px': '1440px',
  '1620px': '1620px',
  '1920px': '1920px',
} as const;

// ── Font size (rem) ────────────────────────────────────────────────────────────
// Named by their rem value. Assumes 16px root.
export const fontSizeRem = {
  '0.75rem':  '0.75rem',
  '0.875rem': '0.875rem',
  '1rem':     '1rem',
  '1.125rem': '1.125rem',
  '1.25rem':  '1.25rem',
  '1.5rem':   '1.5rem',
  '1.75rem':  '1.75rem',
  '2rem':     '2rem',
  '2.25rem':  '2.25rem',
  '2.5rem':   '2.5rem',
  '3rem':     '3rem',
  '3.75rem':  '3.75rem',
  '4.5rem':   '4.5rem',
  '6rem':     '6rem',
} as const;

// ── Opacity ───────────────────────────────────────────────────────────────────
export const opacity = {
  '0':   '0',
  '5':   '0.05',
  '10':  '0.1',
  '20':  '0.2',
  '30':  '0.3',
  '40':  '0.4',
  '50':  '0.5',
  '60':  '0.6',
  '70':  '0.7',
  '80':  '0.8',
  '90':  '0.9',
  '95':  '0.95',
  '100': '1',
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────
// Not registered as Plasmic tokens (not a valid TokenType).
// Referenced only via CSS vars: --radius-sm, --radius-md, etc.
export const radius = {
  none:  '0px',
  sm:    '4px',
  md:    '8px',
  lg:    '12px',
  xl:    '16px',
  '2xl': '24px',
  '3xl': '32px',
  full:  '9999px',
} as const;
