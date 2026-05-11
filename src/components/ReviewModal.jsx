import { useState } from 'react'
import { createPortal } from 'react-dom'
import { T } from '../theme.js'
import { CATEGORIES } from '../constants.js'

/**
 * ReviewModal — shows reviews for programs that just aired for the first time.
 * Props:
 *   reviews: Array<{ program, review }>  ordered, will be shown one by one
 *   onClose: called when user clicks Continue on the last one
 */
export function ReviewModal({ reviews, onClose }) {
  const [idx, setIdx] = useState(0)
  if (!reviews || reviews.length === 0) return null

  const { program: p, review: rev } = reviews[idx] || {}
  if (!p || !rev) return null

  const cat = CATEGORIES[p.categoryId]
  const r = rev.rating
  const verdict =
    r >= 8.5 ? { label: 'BLOCKBUSTER', color: T.gold } :
    r >= 7.0 ? { label: 'HIT', color: T.green } :
    r >= 5.5 ? { label: 'OK', color: T.accent } :
    r >= 4.0 ? { label: 'WEAK', color: T.gold } :
               { label: 'FLOP', color: T.red }

  const c = rev.components
  const isLast = idx === reviews.length - 1

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 22,
        width: '100%',
        maxWidth: 460,
        maxHeight: '92vh',
        overflow: 'auto',
        boxShadow: `0 24px 64px rgba(0,0,0,.5), 0 0 60px ${verdict.color}22`,
      }}>
        {/* Banner: TV MAGAZINE */}
        <div style={{
          fontSize: 9, color: T.muted, letterSpacing: '.25em',
          textTransform: 'uppercase', marginBottom: 4, textAlign: 'center',
        }}>📰 TV Magazine · Review</div>

        {reviews.length > 1 && (
          <div style={{
            fontSize: 10, color: T.muted, textAlign: 'center', marginBottom: 12,
          }}>
            {idx + 1} of {reviews.length}
          </div>
        )}

        {/* Verdict tag */}
        <div style={{
          textAlign: 'center', marginBottom: 8,
        }}>
          <span style={{
            display: 'inline-block',
            background: verdict.color + '22',
            border: `1.5px solid ${verdict.color}`,
            color: verdict.color,
            padding: '5px 14px', borderRadius: 4,
            fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: '.2em',
            fontWeight: 700,
          }}>{verdict.label}</span>
        </div>

        {/* Program name */}
        <div style={{
          fontFamily: 'Bebas Neue', fontSize: 26, color: T.text,
          textAlign: 'center', marginBottom: 4, lineHeight: 1.05,
        }}>{p.name}</div>
        <div style={{
          fontSize: 11, color: T.muted, textAlign: 'center', marginBottom: 16,
        }}>
          {cat?.icon} {cat?.label} · Rating {r.toFixed(1)}
        </div>

        {/* The pull quote */}
        <div style={{
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6,
          padding: '14px 16px', marginBottom: 16,
          fontSize: 14, color: T.text, lineHeight: 1.5, fontStyle: 'italic',
          textAlign: 'center',
        }}>
          “{rev.quote}”
        </div>

        {/* Components */}
        <div style={{
          fontSize: 10, color: T.muted, letterSpacing: '.1em',
          marginBottom: 8, textTransform: 'uppercase',
        }}>Quality Breakdown</div>

        <Component label="Narrative"  value={c.narrative}  color={T.purple || T.accent} />
        <Component label="Art"        value={c.art}        color={T.pink   || T.gold} />
        <Component label="Innovation" value={c.innovation} color={T.teal} />
        <Component label="Technical"  value={c.technical}  color={T.green} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {!isLast ? (
            <button
              onClick={() => setIdx(idx + 1)}
              style={{
                flex: 1, padding: '11px 14px',
                background: T.accent, color: T.bg,
                border: 'none', borderRadius: 5,
                fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '.1em',
                cursor: 'pointer', fontWeight: 700,
              }}
            >Next Review ▶</button>
          ) : (
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '11px 14px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                color: '#fff', border: 'none', borderRadius: 5,
                fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '.1em',
                cursor: 'pointer', fontWeight: 700,
              }}
            >Continue ▶</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Component({ label, value, color }) {
  const v = Math.max(0, Math.min(10, value || 0))
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: T.muted, marginBottom: 3, lineHeight: 1,
      }}>
        <span>{label}</span>
        <span style={{
          fontFamily: "'DM Mono',monospace",
          color: T.text, fontWeight: 700,
        }}>{v.toFixed(1)}</span>
      </div>
      <div style={{
        height: 6, background: T.border, borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${(v / 10) * 100}%`,
          background: color || T.accent,
          transition: 'width .4s ease',
        }} />
      </div>
    </div>
  )
}
