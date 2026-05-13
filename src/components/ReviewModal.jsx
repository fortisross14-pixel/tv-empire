import { useState } from 'react'
import { createPortal } from 'react-dom'
import { T } from '../theme.js'
import { CATEGORIES } from '../constants.js'

/**
 * ReviewModal — shows reviews for programs that just aired for the first time.
 *
 * New three-outlet shape:
 *   review = {
 *     aggregate, band, verdict: { label, tone }, rating,
 *     components, outlets: [{id, name, icon, score, band, line}, ...]
 *   }
 *
 * Backward compat: the older single-quote shape (review.quote) is still
 * handled if it shows up on programs from a save predating this update.
 *
 * Props:
 *   reviews: Array<{ program, review }>  — shown one by one
 *   onClose: called after the user dismisses the last one
 */
export function ReviewModal({ reviews, onClose }) {
  const [idx, setIdx] = useState(0)
  if (!reviews || reviews.length === 0) return null
  const { program: p, review: rev } = reviews[idx] || {}
  if (!p || !rev) return null

  const isLegacy = !rev.outlets && !!rev.quote
  const cat = CATEGORIES[p.categoryId]
  const isLast = idx === reviews.length - 1

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      {isLegacy
        ? <LegacyReviewBody p={p} rev={rev} cat={cat} idx={idx} total={reviews.length} isLast={isLast} onNext={() => setIdx(idx + 1)} onClose={onClose} />
        : <NewReviewBody p={p} rev={rev} cat={cat} idx={idx} total={reviews.length} isLast={isLast} onNext={() => setIdx(idx + 1)} onClose={onClose} />
      }
    </div>,
    document.body
  )
}

// ─── NEW SHAPE — three outlets + aggregate ──────────────────────────────────
function NewReviewBody({ p, rev, cat, idx, total, isLast, onNext, onClose }) {
  const v = rev.verdict || { label: 'SOLID', tone: 'accent' }
  const vColor = toneColor(v.tone)

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: 22,
      width: '100%',
      maxWidth: 520,
      maxHeight: '92vh',
      overflow: 'auto',
      boxShadow: `0 24px 64px rgba(0,0,0,.5), 0 0 60px ${vColor}22`,
    }}>
      {/* Banner */}
      <div style={{
        fontSize: 10, color: T.muted, letterSpacing: '.15em',
        textTransform: 'uppercase', marginBottom: 4, textAlign: 'center',
      }}>📰 Reviews for</div>
      <div style={{
        fontFamily: 'Anton, sans-serif', fontSize: 24, color: T.text,
        textAlign: 'center', marginBottom: 6, lineHeight: 1.05,
      }}>{p.name}</div>
      <div style={{
        fontSize: 11, color: T.muted, textAlign: 'center', marginBottom: 16,
      }}>
        {cat?.icon} {cat?.label} · came in!
      </div>

      {/* Three outlets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {(rev.outlets || []).map(o => (
          <OutletRow key={o.id} outlet={o} />
        ))}
      </div>

      {/* Aggregate verdict */}
      <div style={{
        borderTop: `1px solid ${T.border}`,
        paddingTop: 14, textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10, color: T.muted, letterSpacing: '.2em',
          textTransform: 'uppercase', marginBottom: 8,
        }}>Aggregate Score</div>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 14,
          padding: '10px 18px',
          background: vColor + '14',
          border: `1.5px solid ${vColor}66`,
          borderRadius: 6,
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700, color: vColor,
            lineHeight: 1,
          }}>{(rev.aggregate ?? 0).toFixed(1)}</span>
          <span style={{
            fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '.2em',
            color: vColor,
          }}>{v.label}</span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 18, alignItems: 'center' }}>
        {total > 1 && (
          <div style={{ fontSize: 10, color: T.muted, paddingLeft: 4 }}>
            {idx + 1} of {total}
          </div>
        )}
        <button
          onClick={isLast ? onClose : onNext}
          style={{
            flex: 1, padding: '11px 14px',
            background: isLast ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : T.accent,
            color: isLast ? '#fff' : T.bg,
            border: 'none', borderRadius: 5,
            fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '.1em',
            cursor: 'pointer', fontWeight: 700,
          }}
        >{isLast ? 'CONTINUE ▶' : 'NEXT REVIEW ▶'}</button>
      </div>
    </div>
  )
}

function OutletRow({ outlet: o }) {
  const oColor = bandColor(o.band)
  return (
    <div style={{
      background: T.bg,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${oColor}`,
      borderRadius: 5,
      padding: '10px 12px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 6, gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{o.icon}</span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: T.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{o.name}</span>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700,
          color: oColor, lineHeight: 1, flexShrink: 0,
        }}>{(o.score ?? 0).toFixed(1)}</div>
      </div>
      <div style={{
        fontSize: 11.5, color: T.textDim, lineHeight: 1.45, fontStyle: 'italic',
      }}>“{o.line}”</div>
    </div>
  )
}

// ─── LEGACY SHAPE — preserved for save compatibility ────────────────────────
function LegacyReviewBody({ p, rev, cat, idx, total, isLast, onNext, onClose }) {
  const r = rev.rating
  const verdict =
    r >= 8.5 ? { label: 'BLOCKBUSTER', color: T.gold } :
    r >= 7.0 ? { label: 'HIT',         color: T.green } :
    r >= 5.5 ? { label: 'SOLID',       color: T.accent } :
    r >= 4.0 ? { label: 'SOFT',        color: T.gold } :
               { label: 'FLOP',        color: T.red }
  const c = rev.components || {}
  return (
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
      <div style={{
        fontSize: 9, color: T.muted, letterSpacing: '.25em',
        textTransform: 'uppercase', marginBottom: 10, textAlign: 'center',
      }}>📰 TV Magazine · Review</div>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{
          display: 'inline-block',
          background: verdict.color + '22',
          border: `1.5px solid ${verdict.color}`,
          color: verdict.color,
          padding: '5px 14px', borderRadius: 4,
          fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '.2em',
          fontWeight: 700,
        }}>{verdict.label}</span>
      </div>
      <div style={{
        fontFamily: 'Anton, sans-serif', fontSize: 26, color: T.text,
        textAlign: 'center', marginBottom: 4, lineHeight: 1.05,
      }}>{p.name}</div>
      <div style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginBottom: 16 }}>
        {cat?.icon} {cat?.label} · Rating {r.toFixed(1)}
      </div>
      <div style={{
        background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6,
        padding: '14px 16px', marginBottom: 16,
        fontSize: 14, color: T.text, lineHeight: 1.5, fontStyle: 'italic',
        textAlign: 'center',
      }}>“{rev.quote}”</div>
      <div style={{
        fontSize: 10, color: T.muted, letterSpacing: '.1em',
        marginBottom: 8, textTransform: 'uppercase',
      }}>Quality Breakdown</div>
      <CompBar label="Narrative"  value={c.narrative}  color={T.purple || T.accent} />
      <CompBar label="Art"        value={c.art}        color={T.pink   || T.gold} />
      <CompBar label="Innovation" value={c.innovation} color={T.teal} />
      <CompBar label="Technical"  value={c.technical}  color={T.green} />
      <div style={{ display: 'flex', gap: 8, marginTop: 18, alignItems: 'center' }}>
        {total > 1 && (
          <div style={{ fontSize: 10, color: T.muted, paddingLeft: 4 }}>
            {idx + 1} of {total}
          </div>
        )}
        <button
          onClick={isLast ? onClose : onNext}
          style={{
            flex: 1, padding: '11px 14px',
            background: isLast ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : T.accent,
            color: isLast ? '#fff' : T.bg,
            border: 'none', borderRadius: 5,
            fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '.1em',
            cursor: 'pointer', fontWeight: 700,
          }}
        >{isLast ? 'CONTINUE ▶' : 'NEXT REVIEW ▶'}</button>
      </div>
    </div>
  )
}

function CompBar({ label, value, color }) {
  const v = Math.max(0, Math.min(10, value || 0))
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: T.muted, marginBottom: 3, lineHeight: 1,
      }}>
        <span>{label}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: T.text, fontWeight: 700,
        }}>{v.toFixed(1)}</span>
      </div>
      <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${(v / 10) * 100}%`,
          background: color || T.accent,
          transition: 'width .4s ease',
        }} />
      </div>
    </div>
  )
}

function toneColor(tone) {
  switch (tone) {
    case 'gold':   return T.gold
    case 'green':  return T.green
    case 'red':    return T.red
    case 'accent': return T.accent
    case 'muted':  return T.muted
    default:       return T.accent
  }
}
function bandColor(band) {
  switch (band) {
    case 'blockbuster': return T.gold
    case 'hit':         return T.green
    case 'solid':       return T.accent
    case 'soft':        return T.muted
    case 'flop':        return T.red
    default:            return T.accent
  }
}
