import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, SLOT_TYPES, MONTHS,
} from '../constants.js'
import { HTag } from './ui.jsx'
import { Icon, SlotIcon, CategoryIcon } from '../icons.jsx'
import {
  findDirector, findStar, findIP, findLeague,
  isSportsInSeason, getSeasonalPref, fmtM,
  findOwnedActivePack,
} from '../engine.js'

/**
 * SlotScheduler — picks a shelf program to schedule into a slot.
 * Programs:
 *   - must have status === 'shelf'
 *   - sports programs only schedulable when league is in-season this month
 *   - run length is LOCKED to whatever was committed at production time
 *     (plannedRunMonths). Movies always 1, sports always 12.
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
  // Movie play mode — chosen for movie packs only. Default 'single' (legacy
  // behavior: one airing per scheduling). 'full' commits to all remaining
  // pack airings in one multi-month run.
  const [moviePlayMode, setMoviePlayMode] = useState('single')

  const selected = shelf.find(p => p.id === selectedId)

  // Movie pack info — only relevant when selected program is a movie.
  // airingsLeft tells us how many months a Full Pack run would last.
  const moviePack = selected?.movieId
    ? findOwnedActivePack(station, selected.movieId)
    : null
  const movieAiringsLeft = moviePack?.airingsLeft || 0

  // Run length depends on choice for movies:
  //   - Movies (single) → 1 month
  //   - Movies (full)   → airings remaining in pack
  //   - Sports          → 12 months
  //   - Scripted        → plannedRunMonths
  //   - Legacy          → 1 month fallback
  const lockedRunMonths = selected?.movieId
    ? (moviePlayMode === 'full' ? Math.max(1, movieAiringsLeft) : 1)
    : (selected?.sportsLeagueId
      ? 12
      : (selected?.plannedRunMonths || 1))
  const isLegacy = selected && !selected.movieId && !selected.sportsLeagueId && !selected.plannedRunMonths

  // Sports availability gate — must be in-season THIS month to start airing
  const sportsBlocker = selected?.sportsLeagueId
    ? !isSportsInSeason(selected.sportsLeagueId, cycleIdx)
    : false

  const canSchedule = selected && !sportsBlocker

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 10, color: T.muted, letterSpacing: '.15em' }}>
          SCHEDULE PROGRAM IN
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 6,
        }}>
          <SlotIcon slotTypeId={slotType.id} size={22} color={T.accent} />
          <div className="display" style={{
            fontSize: 22, color: T.accent, letterSpacing: '.04em',
            textTransform: 'uppercase', lineHeight: 1,
          }}>
            {slotType.label}
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
          {slotType.desc}
        </div>
        {seasonal && (
          <div style={{
            fontSize: 11, padding: '7px 10px', marginTop: 10,
            background: 'rgba(255, 209, 102, .07)',
            border: `1px solid rgba(255, 209, 102, .3)`,
            color: T.gold, borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icon name="star" size={12} color={T.gold} />
            <span>{MONTHS[cycleIdx]}: {seasonal.label || 'Seasonal bonus this month'}</span>
          </div>
        )}
        <div style={{
          fontSize: 10.5, color: T.muted, marginTop: 8, fontStyle: 'italic',
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: isSel ? T.accent : T.text, lineHeight: 1.2 }}>
                        {p.name}
                      </div>
                      <div style={{
                        fontSize: 10.5, color: T.muted, marginTop: 4,
                        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
                      }}>
                        {cat && <CategoryIcon categoryId={p.categoryId} size={11} color={cat.color || T.muted} />}
                        <span>{cat?.label || p.categoryId}</span>
                        {p.ipId && <span>· IP</span>}
                        {p.movieId && <span>· Movie</span>}
                        {isSportsP && <span>· {findLeague(p.sportsLeagueId)?.label || 'Sports'}</span>}
                        {isMatch && <span style={{ color: T.green, marginLeft: 2, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Icon name="check" size={10} color={T.green} strokeWidth={2.5} /> matches slot
                        </span>}
                        {isSportOOS && <span style={{ color: T.red, marginLeft: 2 }}>· out of season</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div className="mono" style={{
                        fontSize: 11, color: T.text,
                      }}>
                        Q {p.estQRange[0]}–{p.estQRange[1]}
                      </div>
                      <div className="mono" style={{
                        fontSize: 11, color: T.gold, marginTop: 2,
                      }}>
                        H {p.estHRange[0]}–{p.estHRange[1]}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Movie pack picker — when a movie is selected, the player chooses
              between airing one movie or the full pack. */}
          {selected?.movieId && (
            <div style={{
              padding: '10px 12px', marginBottom: 12,
              background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5,
            }}>
              <div style={{
                fontSize: 10, color: T.muted, letterSpacing: '.1em',
                marginBottom: 8, textTransform: 'uppercase',
              }}>
                Movie pack · {movieAiringsLeft} airing{movieAiringsLeft === 1 ? '' : 's'} left
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setMoviePlayMode('single')}
                  style={{
                    flex: 1, padding: '8px 10px',
                    background: moviePlayMode === 'single' ? T.accent + '33' : T.surface,
                    border: `1.5px solid ${moviePlayMode === 'single' ? T.accent : T.border}`,
                    color: moviePlayMode === 'single' ? T.accent : T.text,
                    borderRadius: 4, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, textAlign: 'left',
                  }}
                >
                  <div style={{ marginBottom: 2 }}>Just 1 Movie</div>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 400 }}>
                    1 month · use 1 airing
                  </div>
                </button>
                <button
                  onClick={() => setMoviePlayMode('full')}
                  disabled={movieAiringsLeft < 2}
                  style={{
                    flex: 1, padding: '8px 10px',
                    background: moviePlayMode === 'full' ? T.accent + '33' : T.surface,
                    border: `1.5px solid ${moviePlayMode === 'full' ? T.accent : T.border}`,
                    color: moviePlayMode === 'full' ? T.accent : (movieAiringsLeft < 2 ? T.muted : T.text),
                    borderRadius: 4,
                    cursor: movieAiringsLeft < 2 ? 'not-allowed' : 'pointer',
                    fontSize: 12, fontWeight: 600, textAlign: 'left',
                    opacity: movieAiringsLeft < 2 ? 0.5 : 1,
                  }}
                >
                  <div style={{ marginBottom: 2 }}>Full Pack</div>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 400 }}>
                    {movieAiringsLeft} months · use all airings
                  </div>
                </button>
              </div>
              <div style={{
                fontSize: 10, color: T.muted, lineHeight: 1.5, marginTop: 8,
              }}>
                Full Pack locks the slot until the pack runs out. Cancelling
                early returns unused airings to the pack — no penalty.
              </div>
            </div>
          )}

          {/* Run length info (non-movie programs) */}
          {selected && !selected.movieId && (
            <div style={{
              padding: '8px 10px', marginBottom: 12, fontSize: 11,
              background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
              color: T.muted, lineHeight: 1.5,
            }}>
              <div style={{ color: T.text, fontWeight: 600, marginBottom: 2 }}>
                Run length: {lockedRunMonths} {lockedRunMonths === 1 ? 'month' : 'months'}
              </div>
              {selected.sportsLeagueId
                ? 'Sports rights run the full calendar year — out-of-season months are skipped automatically.'
                : isLegacy
                  ? 'Legacy program (no planned run committed at production). Defaulting to 1 month.'
                  : `Locked in at production. Programs are built to run for a fixed length — they cannot be stretched or shortened at scheduling time.`}
            </div>
          )}

          {/* Confirm */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
            <button
              onClick={() => canSchedule && onSchedule(selected.id, slotTypeId, lockedRunMonths, {
                moviePlayMode: selected.movieId ? moviePlayMode : null,
              })}
              disabled={!canSchedule}
              style={{ ...btnPrimary, opacity: canSchedule ? 1 : 0.4, cursor: canSchedule ? 'pointer' : 'not-allowed' }}
            >
              {sportsBlocker
                ? 'Out of season'
                : `Schedule (${lockedRunMonths} mo)`}
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
