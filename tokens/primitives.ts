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

// ── Spacing ──────────────────────────────────────────────────────────────────
// Primitive numeric scale — key is the pixel value.
// 8-point grid base; 4px and 12px are explicit half-steps.
export const spacingScale = {
  '0':   '0px',
  '4':   '4px',    // 0.5× base
  '8':   '8px',    // 1× base
  '12':  '12px',   // 1.5× base
  '16':  '16px',   // 2×
  '24':  '24px',   // 3×
  '32':  '32px',   // 4×
  '40':  '40px',   // 5×
  '48':  '48px',   // 6×
  '64':  '64px',   // 8×
  '80':  '80px',   // 10×
  '96':  '96px',   // 12×
  '128': '128px',  // 16×
  '144': '144px',  // 18×
  '160': '160px',  // 20×
  '192': '192px',  // 24×
} as const;

// Semantic t-shirt aliases — each entry references a spacingScale value.
export const spacing = {
  '0':    spacingScale['0'],
  xs:     spacingScale['4'],    // 4px
  sm:     spacingScale['8'],    // 8px
  '12':   spacingScale['12'],   // 12px — half-step, no t-shirt equivalent
  md:     spacingScale['16'],   // 16px
  lg:     spacingScale['24'],   // 24px
  xl:     spacingScale['32'],   // 32px
  '2xl':  spacingScale['40'],   // 40px
  '3xl':  spacingScale['48'],   // 48px
  '4xl':  spacingScale['64'],   // 64px
  '5xl':  spacingScale['80'],   // 80px
  '6xl':  spacingScale['96'],   // 96px
  '7xl':  spacingScale['128'],  // 128px
  '8xl':  spacingScale['144'],  // 144px
  '9xl':  spacingScale['160'],  // 160px
  '10xl': spacingScale['192'],  // 192px
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────
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

// ── Opacity ───────────────────────────────────────────────────────────────────
// Key = integer percentage; value = decimal (0–1).
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

// ── Font size ─────────────────────────────────────────────────────────────────
// Primitive numeric scale — key is the pixel equivalent at a 16px root.
export const fontSizeScale = {
  '12': '0.75rem',
  '14': '0.875rem',
  '16': '1rem',
  '18': '1.125rem',
  '20': '1.25rem',
  '24': '1.5rem',
  '30': '1.875rem',
  '36': '2.25rem',
  '48': '3rem',
  '60': '3.75rem',
  '72': '4.5rem',
  '96': '6rem',
} as const;

// Semantic t-shirt aliases — each entry references a fontSizeScale value.
export const fontSize = {
  xs:    fontSizeScale['12'],   // 12px
  sm:    fontSizeScale['14'],   // 14px
  base:  fontSizeScale['16'],   // 16px
  lg:    fontSizeScale['18'],   // 18px
  xl:    fontSizeScale['20'],   // 20px
  '2xl': fontSizeScale['24'],   // 24px
  '3xl': fontSizeScale['30'],   // 30px
  '4xl': fontSizeScale['36'],   // 36px
  '5xl': fontSizeScale['48'],   // 48px
  '6xl': fontSizeScale['60'],   // 60px
  '7xl': fontSizeScale['72'],   // 72px
  '8xl': fontSizeScale['96'],   // 96px
} as const;

// ── Line height ───────────────────────────────────────────────────────────────
// Unitless multipliers.
export const lineHeight = {
  none:    '1',
  tight:   '1.1',
  snug:    '1.25',
  normal:  '1.5',
  relaxed: '1.625',
  loose:   '2',
} as const;
