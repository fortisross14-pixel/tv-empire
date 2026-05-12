import { T } from '../theme.js'
import { TIER_COL, TIERS } from '../constants.js'

export function HTag({ tier }) {
  if (!tier) return null
  return (
    <span style={{
      background: TIER_COL[tier] + '22',
      color: TIER_COL[tier],
      border: `1px solid ${TIER_COL[tier]}55`,
      padding: '1px 7px', borderRadius: 3, fontSize: 10,
      fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{tier}</span>
  )
}

export function Bar({ value, max = 10, color = T.accent, h = 5 }) {
  return (
    <div className="bar" style={{ height: h }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  )
}

export function KV({ label, value, color, mono = true, big = false }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
      <div style={{
        fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
        fontSize: big ? 17 : 13,
        color: color || T.text, fontWeight: 600,
      }}>{value}</div>
    </div>
  )
}

export function Pill({ label, active, onClick, color, disabled }) {
  const accentColor = color || '#e8a045'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? accentColor + '33' : '#1a1825',
        border: `2px solid ${active ? accentColor : '#2e2a40'}`,
        borderRadius: 20,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        color: active ? accentColor : '#8a8499',
        transition: 'all .15s',
        boxShadow: active ? `0 0 0 1px ${accentColor}55` : 'none',
      }}
    >{active ? '✓ ' : ''}{label}</button>
  )
}

export function TabBtn({ label, active, onClick }) {
  return <button className={`tab-btn${active ? ' on' : ''}`} onClick={onClick}>{label}</button>
}

export function Ticker({ items }) {
  const d = [...items, ...items]
  return (
    <div style={{ background: T.accent, height: 27, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', animation: 'ticker 38s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {d.map((x, i) => (
          <span key={i} style={{ color: T.bg, fontWeight: 700, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginRight: 44 }}>▸ {x}</span>
        ))}
      </div>
    </div>
  )
}

export function Card({ children, style, accent }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${accent || T.border}`,
      borderRadius: 6,
      ...(style || {}),
    }}>{children}</div>
  )
}

export function SectionTitle({ children, color }) {
  return (
    <div className="bebas" style={{ fontSize: 13, color: color || T.accent, marginBottom: 7, letterSpacing: '.1em' }}>
      {children}
    </div>
  )
}

export function StatBlock({ icon, label, value, color, sub }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      padding: '10px 12px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 3 }}>
        {icon} {label}
      </div>
      <div className="bebas" style={{ fontSize: 22, color: color || T.text, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}
