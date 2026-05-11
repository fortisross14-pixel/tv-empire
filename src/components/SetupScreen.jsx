import { useState } from 'react'
import { T } from '../theme.js'
import { FOCUSES, MARKETS } from '../constants.js'

export function SetupScreen({ onStart }) {
  const [name, setName] = useState('')
  const [focusId, setFocusId] = useState('general')

  const ready = name.trim().length >= 2

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, #1a1825 0%, ${T.bg} 65%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ maxWidth: 760, width: '100%' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }} className="ani">
          <div className="bebas" style={{
            fontSize: 56,
            color: T.accent,
            letterSpacing: '.1em',
            lineHeight: 1,
            textShadow: `0 0 40px ${T.accent}40`,
          }}>📡 TV EMPIRE</div>
          <div style={{ color: T.muted, fontSize: 12, letterSpacing: '.2em', marginTop: 5, textTransform: 'uppercase' }}>
            Build your network · From local to national
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 28,
        }} className="ani">

          <div className="bebas" style={{ fontSize: 22, color: T.text, marginBottom: 16, letterSpacing: '.05em' }}>
            New Station
          </div>

          {/* Name */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Network Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apex Broadcasting"
              maxLength={32}
              style={{
                width: '100%',
                fontSize: 16,
                padding: '10px 14px',
                fontFamily: "'DM Sans', sans-serif",
              }}
              autoFocus
            />
          </div>

          {/* Focus */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Programming Focus
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {FOCUSES.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFocusId(f.id)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: focusId === f.id ? T.accent + '14' : T.card,
                    border: `1px solid ${focusId === f.id ? T.accent : T.border}`,
                    borderRadius: 5,
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: focusId === f.id ? T.accent : T.text, marginBottom: 3 }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.45 }}>
                    {f.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Starting market */}
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 5,
            padding: 12,
            marginBottom: 22,
          }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 5 }}>
              Starting Market
            </div>
            <div className="bebas" style={{ fontSize: 17, color: T.teal, marginBottom: 3 }}>{MARKETS.local.label}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
              {MARKETS.local.desc} Reach 25 fame to expand to the metro market.
            </div>
          </div>

          <button
            className="cta"
            disabled={!ready}
            onClick={() => onStart({ name: name.trim(), focusId })}
          >
            ▶ Go on Air
          </button>

          <div style={{ fontSize: 10, color: T.muted, textAlign: 'center', marginTop: 10 }}>
            Year 1 · January begins immediately
          </div>
        </div>

      </div>
    </div>
  )
}
