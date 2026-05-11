import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, SLOT_TYPES, MONTHS, RUN_LENGTHS,
} from '../constants.js'
import { HTag } from './ui.jsx'
import {
  findDirector, findStar, findIP, findLeague,
  isSportsInSeason, getSeasonalPref, fmtM,
} from '../engine.js'

/**
 * SlotScheduler — picks a shelf program to schedule into a slot.
 * Programs:
 *   - must have status === 'shelf'
 *   - sports programs only schedulable when league is in-season this month
 *   - movies forced to 1 month run; sports forced to 12; others pick from RUN_LENGTHS
 */
export function SlotScheduler({
  slotTypeId, cycleIdx, year, station,
  onSchedule, onClose, onGoToProduction,
}) {
  const slotType = SLOT_TYPES[slotTypeId] || SLOT_TYPES.prime
  const seasonal = getSeasonalPref(slotTypeId, cycleIdx)

  // Programs available to schedule = shelf only
  const shelf = (station.programs || []).filter(p => p.status === 'shelf')

  // Sort: matching category first (slot prefers), then others
  const sorted = useMemo(() => {
    return [...shelf].sort((a, b) => {
      const aMatch = (slotType.prefersCategory || []).includes(a.categoryId) ? 0 : 1
      const bMatch = (slotType.prefersCategory || []).includes(b.categoryId) ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
      return (b.estQ + b.estH) - (a.estQ + a.estH)
    })
  }, [shelf, slotTypeId])

  const [selectedId, setSelectedId] = useState(sorted[0]?.id || null)
  const [runMonths, setRunMonths] = useState(1)

  const selected = shelf.find(p => p.id === selectedId)

  // Determine valid runMonths for selected program
  const forcedLength = selected?.movieId ? 1 : (selected?.sportsLeagueId ? 12 : null)
  const effectiveRunMonths = forcedLength ?? runMonths

  // Sports availability gate — must be in-season THIS month to start airing
  const sportsBlocker = selected?.sportsLeagueId
    ? !isSportsInSeason(selected.sportsLeagueId, cycleIdx)
    : false

  const canSchedule = selected && !sportsBlocker

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em' }}>SCHEDULE PROGRAM IN</div>
        <div className="bebas" style={{ fontSize: 22, color: T.accent, letterSpacing: '.08em', marginTop: 2 }}>
          {slotType.icon} {slotType.label.toUpperCase()}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1.4 }}>
          {slotType.desc}
        </div>
        {seasonal && (
          <div style={{
            fontSize: 10, padding: '5px 8px', marginTop: 8,
            background: T.gold + '14', border: `1px solid ${T.gold}44`,
            color: T.gold, borderRadius: 4,
          }}>
            🌟 {MONTHS[cycleIdx]}: {seasonal.label || 'Seasonal bonus this month'}
          </div>
        )}
        <div style={{
          fontSize: 10, color: T.muted, marginTop: 6, fontStyle: 'italic',
        }}>
          Prefers: {(slotType.prefersCategory || []).map(c => CATEGORIES[c]?.label || c).join(', ')}
        </div>
      </div>

      {/* Shelf list */}
      {sorted.length === 0 ? (
        <div style={{
          background: T.bg, border: `1px dashed ${T.border}`,
          borderRadius: 6, padding: 18, textAlign: 'center', marginBottom: 14,
        }}>
          <div style={{ fontSize: 13, color: T.text, marginBottom: 6 }}>No programs on the shelf.</div>
          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
            Programs need to be built in <strong style={{ color: T.text }}>Content → Production</strong> before you can schedule them.
          </div>
          <button onClick={onGoToProduction} style={btnPrimary}>
            Go to Production
          </button>
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 10, color: T.muted, letterSpacing: '.1em', marginBottom: 6,
          }}>SHELF · {sorted.length} READY</div>
          <div style={{
            maxHeight: 260, overflowY: 'auto',
            border: `1px solid ${T.border}`, borderRadius: 5,
            marginBottom: 12, background: T.bg,
          }}>
            {sorted.map(p => {
              const isSel = p.id === selectedId
              const isMatch = (slotType.prefersCategory || []).includes(p.categoryId)
              const cat = CATEGORIES[p.categoryId]
              const isSportsP = !!p.sportsLeagueId
              const isSportOOS = isSportsP && !isSportsInSeason(p.sportsLeagueId, cycleIdx)
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  disabled={isSportOOS}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: isSel ? T.accent + '22' : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${T.border}`,
                    color: T.text,
                    padding: '9px 10px',
                    cursor: isSportOOS ? 'not-allowed' : 'pointer',
                    opacity: isSportOOS ? 0.45 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? T.accent : T.text, lineHeight: 1.2 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>
                        {cat?.icon} {cat?.label || p.categoryId}
                        {p.ipId && ' · 📜 IP'}
                        {p.movieId && ' · 🎞 Movie'}
                        {isSportsP && ` · ${findLeague(p.sportsLeagueId)?.label || 'Sports'}`}
                        {isMatch && <span style={{ color: T.green, marginLeft: 4 }}>✓ matches slot</span>}
                        {isSportOOS && <span style={{ color: T.red, marginLeft: 4 }}>· out of season</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{
                        fontFamily: "'DM Mono',monospace", fontSize: 11,
                        color: T.text,
                      }}>
                        Q {p.estQRange[0]}–{p.estQRange[1]}
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono',monospace", fontSize: 11,
                        color: T.gold, marginTop: 2,
                      }}>
                        H {p.estHRange[0]}–{p.estHRange[1]}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Run length selector */}
          {selected && !forcedLength && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em', marginBottom: 6 }}>
                RUN LENGTH
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {RUN_LENGTHS.map(rl => (
                  <button
                    key={rl.id}
                    onClick={() => setRunMonths(rl.months)}
                    style={{
                      background: runMonths === rl.months ? T.accent + '33' : 'transparent',
                      border: `1px solid ${runMonths === rl.months ? T.accent : T.border}`,
                      color: runMonths === rl.months ? T.accent : T.muted,
                      borderRadius: 4, padding: '6px 12px',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >{rl.label}</button>
                ))}
              </div>
            </div>
          )}

          {forcedLength && selected && (
            <div style={{
              padding: '8px 10px', marginBottom: 12, fontSize: 11,
              background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
              color: T.muted,
            }}>
              {selected.movieId
                ? 'Movies run for 1 month (one-off airing).'
                : 'Sports rights run for the full calendar year (skip out-of-season months).'}
            </div>
          )}

          {/* Confirm */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
            <button
              onClick={() => canSchedule && onSchedule(selected.id, slotTypeId, effectiveRunMonths)}
              disabled={!canSchedule}
              style={{ ...btnPrimary, opacity: canSchedule ? 1 : 0.4, cursor: canSchedule ? 'pointer' : 'not-allowed' }}
            >
              {sportsBlocker
                ? 'Out of season'
                : `Schedule (${effectiveRunMonths} mo)`}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

const btnPrimary = {
  flex: 1, padding: '9px 12px',
  background: T.accent, color: T.bg,
  border: 'none', borderRadius: 4,
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
const btnSecondary = {
  flex: 1, padding: '9px 12px',
  background: 'transparent', color: T.muted,
  border: `1px solid ${T.border}`, borderRadius: 4,
  fontSize: 12, cursor: 'pointer',
}

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 18,
          width: '100%',
          maxWidth: 520,
          maxHeight: '92vh',
          overflow: 'auto',
        }}
      >{children}</div>
    </div>
  )
}
