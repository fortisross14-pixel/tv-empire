// ─── PRESTIGE BROADCAST PALETTE ────────────────────────────────────────────
// Deeper, more cinematic than v5. Warm amber stays as the system accent but
// the canvas is darker and richer, with proper tonal separation between layers.

export const T = {
  // canvas layers (darkest → lightest)
  bg:       '#0a0910',   // deepest — page background
  surface:  '#13111c',   // panel surfaces
  card:     '#1c1828',   // raised card
  cardHi:   '#262136',   // hover / selected card
  void:     '#0f0d16',   // empty slot — flat, no border (the "off light")

  // borders
  border:   '#2a2438',
  borderHi: '#3d3552',

  // brand accent (system warm — used for "Programming" / current tab / CTAs)
  accent:   '#f0a347',
  accentDim:'#7a5223',

  // semantic
  teal:     '#3ecfcf',
  red:      '#ef4565',
  green:    '#5bd687',
  gold:     '#ffd166',
  purple:   '#b475ff',
  orange:   '#ff8c42',
  pink:     '#ff6aa9',

  // text
  text:     '#f4ecd8',   // warm cream (paper-like)
  textDim:  '#bbb1c4',
  muted:    '#7a7389',
  mutedDim: '#4d4659',
}

// Corporate brand presets — user picks ONE pair at setup.
// Each pair: { id, label, bg, fg, accent } where bg/fg form the IDENT chip
// (network logo treatment) and `accent` is the highlight used by the
// Continue button and brand-tinted elements throughout the UI.
export const BRAND_PRESETS = [
  { id: 'ember',   label: 'Ember',   bg: '#0a0910', fg: '#f0a347', accent: '#f0a347' },
  { id: 'crimson', label: 'Crimson', bg: '#1a0a0e', fg: '#ff4d6d', accent: '#ff4d6d' },
  { id: 'royal',   label: 'Royal',   bg: '#0a0f2a', fg: '#7da3ff', accent: '#7da3ff' },
  { id: 'forest',  label: 'Forest',  bg: '#0a1a14', fg: '#5bd687', accent: '#5bd687' },
  { id: 'magenta', label: 'Magenta', bg: '#1a0a1a', fg: '#ff6aa9', accent: '#ff6aa9' },
  { id: 'cyan',    label: 'Cyan',    bg: '#08171c', fg: '#3ecfcf', accent: '#3ecfcf' },
  { id: 'gold',    label: 'Gold',    bg: '#15110a', fg: '#ffd166', accent: '#ffd166' },
  { id: 'paper',   label: 'Paper',   bg: '#f4ecd8', fg: '#1a0f08', accent: '#d4c9aa' },
  { id: 'mono',    label: 'Mono',    bg: '#0a0910', fg: '#e8e8ec', accent: '#e8e8ec' },
  { id: 'violet',  label: 'Violet',  bg: '#100820', fg: '#b475ff', accent: '#b475ff' },
]

export const DEFAULT_BRAND = BRAND_PRESETS[0]

export function findBrand(brandId) {
  return BRAND_PRESETS.find(b => b.id === brandId) || DEFAULT_BRAND
}
