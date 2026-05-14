// ─── PRESTIGE BROADCAST PALETTE ────────────────────────────────────────────
// Deeper, more cinematic than v5. Warm amber stays as the system accent but
// the canvas is darker and richer, with proper tonal separation between layers.
//
// v6: editorial polish pass. Added Fraunces serif tokens, finer accent shades,
// gradient stops for stat bars, and tier color set used by talent + program
// cards. Everything below `accentSoft` is new — old tokens kept stable so
// screens not yet migrated stay rendering correctly.

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

  // ─── v6 EDITORIAL TOKENS (added by stage AG) ─────────────────────────────
  // These don't replace anything — they fill out the palette for the new
  // editorial card language. Migrated screens (Programming first) use these.

  // Finer accent shades for hover halos and faint backgrounds
  accentSoft:    'rgba(240, 163, 71, 0.15)',   // 15% accent — hover halos, soft fills
  accentFaint:   'rgba(240, 163, 71, 0.06)',   // 6% accent — barely-there glow
  accentHi:      '#f0b35e',                     // slightly cooler amber for hover states

  // Gradient stops — used as backgrounds via inline style for cards
  cardGradTop:   '#221a30',
  cardGradBot:   '#1c1428',
  cardHiGradTop: '#2e2542',
  cardHiGradBot: '#261c38',

  // Stat bar gradients (Q teal→green, H amber→red)
  qStart: '#45d9d9',
  qEnd:   '#5fd68a',
  hStart: '#ff9d4d',
  hEnd:   '#ef4a6b',

  // Tier color set — used on talent cards, program tier badges, etc.
  // Each tier has a primary color + a 40% alpha border + 8% alpha background.
  tier: {
    legendary: { c: '#ffd166', b: 'rgba(255, 209, 102, 0.4)', bg: 'rgba(255, 209, 102, 0.08)' },
    epic:      { c: '#c9a3ff', b: 'rgba(180, 117, 255, 0.4)', bg: 'rgba(180, 117, 255, 0.08)' },
    rare:      { c: '#6ee8e8', b: 'rgba(69, 217, 217, 0.4)',  bg: 'rgba(69, 217, 217, 0.08)' },
    uncommon:  { c: '#7ce0a3', b: 'rgba(95, 214, 138, 0.4)',  bg: 'rgba(95, 214, 138, 0.08)' },
    common:    { c: '#bbb1c4', b: '#3d3552',                  bg: 'transparent' },
  },

  // Hairlines — gradient divider rule (gold→border→transparent)
  // Use as: `background: T.ruleGold`
  ruleGold: 'linear-gradient(90deg, rgba(240, 179, 94, 0.45) 0%, rgba(240, 179, 94, 0.15) 20%, #2a2438 40%, transparent 100%)',
}

// Font stacks — Fraunces for editorial display + Inter for UI + JetBrains for numbers.
// CSS injection (in App entrypoint) loads these from Google Fonts.
export const FONTS = {
  serif: "'Fraunces', Georgia, serif",
  sans:  "'Inter', -apple-system, system-ui, sans-serif",
  mono:  "'JetBrains Mono', 'SF Mono', Menlo, monospace",
}

// Tier name → tier token lookup. Centralizes the mapping so cards don't each
// re-implement it.
export function tierStyle(tierName) {
  const k = (tierName || '').toLowerCase()
  return T.tier[k] || T.tier.common
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
