export const colorPrimitive = {
  // Primary palette
  cream:       '#EADBC2',
  lavender:    '#CEBEE3',
  coral:       '#FF6A50',
  peach:       '#FFAB7B',
  chartreuse:  '#DDEA44',
  green:       '#52A159',
  navy:        '#00427F',

  // Secondary palette (darker counterparts)
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

// 8-point grid; xs/sm/md/lg/xl/nxl are t-shirt names.
// 4px (xs) and 12px are supplementary half-steps.
// Strictly 8pt-grid from sm upward; 20px omitted as a non-grid step.
export const spacing = {
  '0':    '0px',
  xs:     '4px',    // 0.5× base
  sm:     '8px',    // 1× base
  '12':   '12px',   // 1.5× base (explicit non-grid step)
  md:     '16px',   // 2× base
  lg:     '24px',   // 3× base
  xl:     '32px',   // 4× base
  '2xl':  '40px',   // 5× base
  '3xl':  '48px',   // 6× base
  '4xl':  '64px',   // 8× base
  '5xl':  '80px',   // 10× base
  '6xl':  '96px',   // 12× base
  '7xl':  '128px',  // 16× base
  '8xl':  '144px',  // 18× base
  '9xl':  '160px',  // 20× base
  '10xl': '192px',  // 24× base
} as const;

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

// Decimal opacity values (0–1).
// Numeric keys = percentage (e.g. '10' = 10% = 0.1).
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

// rem-based; key is t-shirt size.
export const fontSize = {
  xs:    '0.75rem',    // 12px
  sm:    '0.875rem',   // 14px
  base:  '1rem',       // 16px
  lg:    '1.125rem',   // 18px
  xl:    '1.25rem',    // 20px
  '2xl': '1.5rem',     // 24px
  '3xl': '1.875rem',   // 30px
  '4xl': '2.25rem',    // 36px
  '5xl': '3rem',       // 48px
  '6xl': '3.75rem',    // 60px
  '7xl': '4.5rem',     // 72px
  '8xl': '6rem',       // 96px
} as const;

// Unitless multipliers.
export const lineHeight = {
  none:    '1',
  tight:   '1.1',
  snug:    '1.25',
  normal:  '1.5',
  relaxed: '1.625',
  loose:   '2',
} as const;
