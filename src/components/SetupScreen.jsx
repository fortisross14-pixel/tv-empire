import { useState } from 'react'
import { T, BRAND_PRESETS, findBrand } from '../theme.js'
import { FOCUSES, MARKETS } from '../constants.js'
import { Icon } from '../icons.jsx'
import { play as playSound, initOnGesture } from '../audio.js'

export function SetupScreen({ onStart }) {
  const [name, setName] = useState('')
  const [focusId, setFocusId] = useState('general')
  const [brandId, setBrandId] = useState('ember')
  // Tutorial choice — default ON since most new players benefit from it.
  // Player explicitly chooses Free Play to opt out.
  const [tutorialEnabled, setTutorialEnabled] = useState(true)

  const brand = findBrand(brandId)
  const ready = name.trim().length >= 2

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 60% at 50% 0%, ${brand.accent}14 0%, transparent 55%),
        radial-gradient(ellipse 50% 70% at 100% 100%, rgba(180, 117, 255, .05), transparent 70%),
        ${T.bg}
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 760, width: '100%', position: 'relative', zIndex: 2 }}>

        {/* ─── HERO ─── */}
        <div style={{ textAlign: 'center', marginBottom: 30 }} className="ani">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span className="onair-dot" />
            <span className="mono" style={{ fontSize: 11, color: T.muted, letterSpacing: '.2em' }}>
              ON AIR · EST. {new Date().getFullYear()}
            </span>
          </div>
          <div className="display" style={{
            fontSize: 72,
            color: T.text,
            lineHeight: .95,
            textShadow: `0 0 50px ${brand.accent}33`,
          }}>
            TV <span style={{ color: brand.accent }}>EMPIRE</span>
          </div>
          <div className="editorial" style={{
            color: T.muted, fontSize: 15, marginTop: 6,
            fontStyle: 'italic', letterSpacing: '.01em',
          }}>
            Build your network · From local to national
          </div>
        </div>

        {/* ─── CARD ─── */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 28,
          boxShadow: `0 12px 40px rgba(0,0,0,.4), 0 0 0 1px ${brand.accent}12`,
        }} className="ani">

          <div className="display" style={{ fontSize: 22, color: T.text, marginBottom: 20, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            New Station
          </div>

          {/* Network Name */}
          <Label>Network Name</Label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Apex Broadcasting"
            maxLength={32}
            style={{
              width: '100%', fontSize: 16, padding: '11px 14px', marginBottom: 22,
            }}
            autoFocus
          />

          {/* Brand colors */}
          <Label>Corporate Identity</Label>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Pick your channel's on-screen colors. Used for the network ident, the Continue button, and key brand touches throughout the broadcast.
          </div>

          {/* Live preview chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
            padding: '14px 16px', background: T.bg, borderRadius: 6,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{
              display: 'inline-flex',
              background: brand.bg, color: brand.fg,
              padding: '8px 14px',
              fontFamily: 'Anton, sans-serif',
              fontSize: 22, letterSpacing: '.06em',
              borderRadius: 3,
              border: `1.5px solid ${brand.fg}`,
              textTransform: 'uppercase',
              lineHeight: 1,
              maxWidth: 220,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {(name.trim() || 'CHANNEL').slice(0, 12)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="mono" style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em' }}>
                BRAND PREVIEW
              </div>
              <div style={{ fontSize: 13, color: T.text, marginTop: 3, fontWeight: 500 }}>
                {brand.label}
              </div>
            </div>
            <button
              style={{
                background: brand.accent, color: brand.bg,
                padding: '10px 18px',
                fontFamily: 'Anton, sans-serif',
                fontSize: 14, letterSpacing: '.08em',
                borderRadius: 3,
                textTransform: 'uppercase',
                cursor: 'default',
              }}
            >Continue ▶</button>
          </div>

          {/* Swatch grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginBottom: 24,
          }}>
            {BRAND_PRESETS.map(b => {
              const active = b.id === brandId
              return (
                <button
                  key={b.id}
                  onClick={() => { initOnGesture(); playSound('tap'); setBrandId(b.id) }}
                  title={b.label}
                  style={{
                    aspectRatio: '1.4 / 1',
                    background: b.bg,
                    border: `2px solid ${active ? b.fg : 'transparent'}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    transition: 'transform .12s, border-color .12s',
                    transform: active ? 'scale(1.04)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = b.fg + '55' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'transparent' }}
                >
                  <div style={{
                    fontFamily: 'Anton, sans-serif',
                    color: b.fg,
                    fontSize: 18,
                    letterSpacing: '.05em',
                  }}>
                    {b.label.slice(0, 3).toUpperCase()}
                  </div>
                  {active && (
                    <div style={{
                      position: 'absolute',
                      top: 3, right: 3,
                      background: b.fg, color: b.bg,
                      borderRadius: 99,
                      width: 14, height: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="check" size={10} color={b.bg} strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Focus */}
          <Label>Programming Focus</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 22 }}>
            {FOCUSES.map(f => {
              const active = focusId === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => { playSound('tap'); setFocusId(f.id) }}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: active ? brand.accent + '14' : T.card,
                    border: `1px solid ${active ? brand.accent : T.border}`,
                    borderRadius: 5,
                    transition: 'all .15s',
                  }}
                >
                  <div style={{
                    fontSize: 13.5, fontWeight: 600,
                    color: active ? brand.accent : T.text, marginBottom: 4,
                  }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
                    {f.desc}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Starting market */}
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 5,
            padding: 14,
            marginBottom: 14,
          }}>
            <Label style={{ marginBottom: 6 }}>Starting Market</Label>
            <div className="display" style={{ fontSize: 18, color: T.teal, marginBottom: 4, letterSpacing: '.04em' }}>
              {MARKETS.local.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
              {MARKETS.local.desc} Reach 25 fame to expand to the metro market.
            </div>
          </div>

          {/* Tutorial choice */}
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 5,
            padding: 14,
            marginBottom: 22,
          }}>
            <Label style={{ marginBottom: 10 }}>Game Mode</Label>
            <div style={{ display: 'grid', gap: 8 }}>
              <ModeRadio
                checked={tutorialEnabled}
                onChange={() => setTutorialEnabled(true)}
                brand={brand}
                title="Guided tutorial"
                subtitle="Recommended for new players — walks you through the first 3 months."
              />
              <ModeRadio
                checked={!tutorialEnabled}
                onChange={() => setTutorialEnabled(false)}
                brand={brand}
                title="Free play"
                subtitle="Skip the tutorial. Start with the same resources and explore on your own."
              />
            </div>
          </div>

          {/* CTA */}
          <button
            disabled={!ready}
            onClick={() => {
              initOnGesture()
              playSound('confirm')
              onStart({ name: name.trim(), focusId, brandId, tutorialEnabled })
            }}
            style={{
              width: '100%',
              padding: '15px',
              background: ready ? brand.accent : T.card,
              color: ready ? brand.bg : T.muted,
              fontFamily: 'Anton, sans-serif',
              fontSize: 22, letterSpacing: '.08em',
              textTransform: 'uppercase',
              borderRadius: 4,
              cursor: ready ? 'pointer' : 'not-allowed',
              transition: 'filter .15s, transform .05s',
            }}
            onMouseEnter={e => { if (ready) e.currentTarget.style.filter = 'brightness(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
          >
            ▶ Go on Air
          </button>

          <div style={{ fontSize: 10.5, color: T.muted, textAlign: 'center', marginTop: 12 }}>
            Year 1 · January begins immediately
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, style }) {
  return (
    <div className="mono" style={{
      fontSize: 10.5, color: T.muted,
      letterSpacing: '.12em', textTransform: 'uppercase',
      marginBottom: 8,
      ...(style || {}),
    }}>
      {children}
    </div>
  )
}

function ModeRadio({ checked, onChange, brand, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 12px',
        background: checked ? brand.accent + '15' : T.surface,
        border: `1.5px solid ${checked ? brand.accent : T.border}`,
        borderRadius: 5,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background .15s, border-color .15s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        border: `2px solid ${checked ? brand.accent : T.border}`,
        flexShrink: 0, marginTop: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: brand.accent,
          }} />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: checked ? T.text : T.textDim,
        }}>{title}</div>
        <div style={{
          fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.4,
        }}>{subtitle}</div>
      </div>
    </button>
  )
}
