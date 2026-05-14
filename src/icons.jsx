import React from 'react'

// All icons are 1em-sized SVGs that inherit `color` via currentColor.
// Use like: <Icon name="sun" size={16} color={T.accent} />

const STROKE = 1.8

const PATHS = {
  // ─── DAYPARTS ─────────────────────────────────────────────────────
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  cloud_sun: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v1M2 8h1M3.5 3.5l.7.7M12 4l-.7.7" />
      <path d="M16 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 19h8a3 3 0 0 0 0-5z" />
    </>
  ),
  sunset: (
    <>
      <path d="M2 18h20" />
      <path d="M12 9v6" />
      <path d="M6 18a6 6 0 0 1 12 0" />
      <path d="M4 15l-2 2M22 17l-2-2M9 12l3-3 3 3" />
    </>
  ),
  city: (
    <>
      <path d="M3 21V9l4-2v14M9 21V5l5-2v18M16 21v-9l5 1v8M3 21h18" />
      <path d="M5 12h.01M5 15h.01M11 9h.01M11 12h.01M11 15h.01M11 18h.01M18 15h.01M18 18h.01" />
    </>
  ),
  tower: (
    <>
      <path d="M12 2v20" />
      <path d="M9 22h6" />
      <path d="M7 8l5-3 5 3" />
      <path d="M6 13l6-3.5 6 3.5" />
      <path d="M4 18l8-4.5 8 4.5" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </>
  ),
  bear: (
    <>
      <circle cx="12" cy="13" r="7" />
      <circle cx="7" cy="6.5" r="2.5" />
      <circle cx="17" cy="6.5" r="2.5" />
      <circle cx="10" cy="12" r=".5" fill="currentColor" />
      <circle cx="14" cy="12" r=".5" fill="currentColor" />
      <path d="M11 16h2" />
    </>
  ),
  popcorn: (
    <>
      <path d="M6 9h12l-1 12H7L6 9z" />
      <path d="M6 9a3 3 0 0 1 1-5.5 3 3 0 0 1 5-1 3 3 0 0 1 4 0 3 3 0 0 1 5 1A3 3 0 0 1 18 9" />
      <path d="M10 12v6M14 12v6" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
      <path d="M10 16h4M9 21h6M12 16v5" />
    </>
  ),

  // ─── CATEGORIES ───────────────────────────────────────────────────
  news: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M7 9h6M7 13h10M7 17h7" />
    </>
  ),
  reality: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  series: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 9h20M6 5v14M18 5v14" />
    </>
  ),
  latenight: (
    <>
      <path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4z" />
      <path d="M6 10a6 6 0 0 0 12 0M12 14v4M9 22h6" />
    </>
  ),
  sports: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
    </>
  ),
  movie: (
    <>
      <rect x="2" y="6" width="16" height="12" rx="1" />
      <path d="M18 10l4-2v8l-4-2" />
    </>
  ),
  family: (
    <>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M15 21v-1a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1" />
    </>
  ),
  kids: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 9h.01M15 9h.01" />
      <path d="M9 12c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
      <path d="M8 16l-1 5M16 16l1 5" />
    </>
  ),

  // ─── UI ───────────────────────────────────────────────────────────
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  check: (
    <>
      <path d="M5 12l5 5L20 7" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  star: (
    <>
      <path d="M12 3l2.6 6 6.4.5-4.9 4.3 1.5 6.4L12 17l-5.6 3.2 1.5-6.4L3 9.5 9.4 9z" />
    </>
  ),
  play: (
    <>
      <path d="M7 5l12 7-12 7V5z" />
    </>
  ),
  chart_up: (
    <>
      <path d="M3 17l6-6 4 4 7-8" />
      <path d="M14 7h6v6" />
    </>
  ),
  chart_down: (
    <>
      <path d="M3 7l6 6 4-4 7 8" />
      <path d="M14 17h6v-6" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14 9.5a3 3 0 0 0-5 1.5c0 3 5 2 5 5a3 3 0 0 1-5 1.5" />
      <path d="M12 6v2M12 16v2" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="6" />,
  diamond: <path d="M12 2L2 12l10 10 10-10L12 2z" />,
  ip: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  microphone: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </>
  ),
  flask: (
    <>
      <path d="M10 2v6L4 18a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 18L14 8V2" />
      <path d="M8 2h8M7 14h10" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-4h4v4" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10v4l11 5V5z" />
      <path d="M14 8a4 4 0 0 1 0 8" />
      <path d="M7 14v3a2 2 0 0 0 4 0v-2" />
    </>
  ),
  speaker_on: (
    <>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  speaker_off: (
    <>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M22 9l-6 6M16 9l6 6" />
    </>
  ),

  // ─── LUCIDE-STYLE ICONS (added v6 for migrated screens) ──────────────
  // Paths adapted from Lucide (MIT). These supersede emoji on the
  // Programming screen and any other migrated views.
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  tv: (
    <>
      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </>
  ),
  arrow_right: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  arrow_left: (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
  circle_dot: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </>
  ),
  trending_up: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  wallet: (
    <>
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M20 12v4H6a2 2 0 0 0-2 2c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  zap: (
    <>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </>
  ),
  film: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </>
  ),
}

// Aliases for ergonomic use
const ALIASES = {
  morning: 'sun',
  afternoon: 'cloud_sun',
  evening: 'sunset',
  prime: 'city',
  prime2: 'tower',
  late: 'moon',
  latenight_slot: 'moon',
  weekend_morning: 'bear',
  weekend_afternoon: 'sun',
  weekend_prime: 'popcorn',
  weekend_latenight: 'moon',
  award: 'trophy',
  research: 'flask',
  ops: 'building',
  marketing: 'megaphone',
}

export function Icon({ name, size = 16, color = 'currentColor', strokeWidth, style }) {
  const key = ALIASES[name] || name
  const path = PATHS[key]
  if (!path) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth || STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: '-.18em', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}

// Map slot type IDs → icon names
export const SLOT_ICONS = {
  morning: 'sun',
  afternoon: 'cloud_sun',
  evening: 'sunset',
  prime: 'city',
  prime2: 'tower',
  latenight: 'moon',
  weekend_morning: 'bear',
  weekend_afternoon: 'sun',
  weekend_prime: 'popcorn',
  weekend_latenight: 'moon',
}

// Map category IDs → icon names
export const CAT_ICONS = {
  news: 'news',
  reality: 'reality',
  series: 'series',
  latenight: 'microphone',
  sports: 'sports',
  movie: 'movie',
  family: 'family',
  kids: 'kids',
}

export function SlotIcon({ slotTypeId, size = 16, color }) {
  return <Icon name={SLOT_ICONS[slotTypeId] || 'play'} size={size} color={color} />
}

export function CategoryIcon({ categoryId, size = 14, color }) {
  return <Icon name={CAT_ICONS[categoryId] || 'play'} size={size} color={color} />
}
