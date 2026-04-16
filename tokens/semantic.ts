// Neutral scale: warm-to-cool directional shift, strongly desaturated.
// cream undertone (#EADBC2) → midnight (#201B2A), chroma pulled way down.
export const colorNeutral = {
  '0':   '#EDE9E3',  // warm off-white
  '25':  '#C5C0BA',  // warm light grey
  '50':  '#888388',  // cool mid-grey (subtle lavender undertone)
  '75':  '#504C57',  // dark cool grey
  '100': '#201B2A',  // midnight (anchor)
} as const;

// Success: pure success green overlaid with brand green (#52A159).
// 50-stop leans slightly more yellow-green than pure, retaining brand warmth.
export const colorSuccess = {
  '0':   '#EAF3EB',
  '25':  '#9DCF9F',
  '50':  '#4CAF56',  // base — most saturated
  '75':  '#2A7030',
  '100': '#153818',
} as const;

// Warning: standard amber overlaid with brand peach (#FFAB7B).
// Shifts peach toward a clear amber warning tone.
export const colorWarning = {
  '0':   '#FFF5EC',
  '25':  '#FFC98A',
  '50':  '#F59340',  // base — most saturated
  '75':  '#B05E1A',
  '100': '#6B3409',
} as const;

// Error: standard error red overlaid with brand coral (#FF6A50).
// Coral pushed slightly further from orange toward red.
export const colorError = {
  '0':   '#FFE9E6',
  '25':  '#FF9F94',
  '50':  '#F04E38',  // base — most saturated
  '75':  '#922018',
  '100': '#4D0E09',
} as const;
