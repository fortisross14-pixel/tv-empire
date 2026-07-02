import { R } from '../theme.js'
import { SLOT_TYPES, MONTHS, CATEGORIES } from '../constants.js'
import {
  projectShow, findDirector, getSeasonalPref,
  slotAutoAt, findMovie, findLeague,
} from '../engine.js'

/**
 * ProgrammingRoom — the 3-column retro schedule grid.
 *
 * Replaces PlanView (via view === 'schedule') under the retro shell.
 * Layout: three retro panels side-by-side:
 *   1. WEEKDAY 1  (Weekday Daytime)  → morning, afternoon, evening
 *   2. WEEKDAY 2  (Weekday Primetime)→ prime, prime2, latenight
 *   3. WEEKEND                       → weekend_morning, weekend_afternoon,
 *                                       weekend_prime, weekend_latenight
 *
 * Each slot tile shows one of three states (matches SlotCard's states):
 *   - EMPTY  → dashed brass border, "+ SCHEDULE" affordance. Click → open SlotScheduler.
 *   - RUN    → program name, quality/hype, months remaining, cancel X.
 *   - AUTO   → director-managed marker + focus category.
 *
 * The click handler stays wired to the existing openSlot → SlotScheduler
 * flow, so the underlying scheduling engine is untouched. This is a UI
 * reshape, NOT an engine change.
 */
export function ProgrammingRoom({
  game, runsBySlot,
  onOpenSlot, onCancelRun,
  onAssignSchedDirector, onCancelSchedDirector,
  onBack,
}) {
  const station = game.station
  const slotIds = station.slotIds || []
  const filled = slotIds.filter((_, i) => runsBySlot[i]).length

  // Column definitions — slot type IDs grouped into three broadcast blocks.
  const COLUMNS = [
    {
      id: 'weekday1',
      label: 'Weekday 1',
      sub: 'Daytime · Mon–Fri',
      iconClass: 'fa-solid fa-sun',
      accent: R.rank,   // amber
      slotTypeIds: ['morning', 'afternoon', 'evening'],
    },
    {
      id: 'weekday2',
      label: 'Weekday 2',
      sub: 'Primetime · Mon–Fri',
      iconClass: 'fa-solid fa-tv',
      accent: R.red,    // signature red
      slotTypeIds: ['prime', 'prime2', 'latenight'],
    },
    {
      id: 'weekend',
      label: 'Weekend',
      sub: 'Sat + Sun',
      iconClass: 'fa-solid fa-star',
      accent: R.gold,   // brass gold
      slotTypeIds: ['weekend_morning', 'weekend_afternoon', 'weekend_prime', 'weekend_latenight'],
    },
  ]

  return (
    <div style={{
      maxWidth: 1600, margin: '0 auto',
      padding: '20px 20px 40px',
    }}>
      {/* ─── HERO ─── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 16, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div className="section-title" style={{
            fontSize: 26, color: '#fff', letterSpacing: 2,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <i className="fa-solid fa-calendar-days" style={{ color: R.gold }} />
            <span>Programming Schedule</span>
          </div>
          <div style={{ fontSize: 12, color: R.textDim, marginTop: 3 }}>
            {MONTHS[game.monthIdx]} Y{game.year} · Click any slot to schedule a program
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 9, color: R.textDim, letterSpacing: 1.5,
              fontFamily: 'monospace', textTransform: 'uppercase',
            }}>Slots Filled</div>
            <div className="retro-led" style={{
              fontSize: 20, color: R.viewers, lineHeight: 1,
            }}>
              {filled}<span style={{ opacity: 0.6, fontSize: 14 }}>/{slotIds.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── THREE COLUMNS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {COLUMNS.map(col => (
          <ScheduleColumn
            key={col.id}
            column={col}
            slotIds={slotIds}
            runsBySlot={runsBySlot}
            plans={station.plans || []}
            station={station}
            research={game.research}
            cycleIdx={game.monthIdx}
            onOpenSlot={onOpenSlot}
            onCancelRun={onCancelRun}
          />
        ))}
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{
        marginTop: 24, padding: '14px 18px',
        background: 'rgba(15, 23, 42, 0.5)',
        border: `1px solid ${R.border}44`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 11, color: R.textDim, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
          <i className="fa-solid fa-info-circle" style={{ marginRight: 6, color: R.gold }} />
          Programs stay booked for their run length (1, 3, 6, or 12 months). Cancel early to open a slot — cancellation costs part of the remaining contract.
        </div>
        <button
          onClick={onBack}
          className="retro-button-secondary"
          style={{ fontSize: 11 }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
          Back to Floor Plan
        </button>
      </div>
    </div>
  )
}

// ─── COLUMN ────────────────────────────────────────────────────────────
function ScheduleColumn({ column, slotIds, runsBySlot, plans, station, research, cycleIdx, onOpenSlot, onCancelRun }) {
  // Which of this column's slot types does the station actually own?
  const ownedTiles = column.slotTypeIds
    .map(typeId => {
      const idx = slotIds.indexOf(typeId)
      return idx >= 0 ? { typeId, idx } : null
    })
    .filter(Boolean)

  // Also: slot types in this column that the station has NOT unlocked yet.
  // Show them as locked placeholders so the player knows what's available.
  const lockedTiles = column.slotTypeIds
    .filter(typeId => slotIds.indexOf(typeId) < 0)
    .map(typeId => ({ typeId }))

  const filledInCol = ownedTiles.filter(t => runsBySlot[t.idx]).length

  return (
    <div className="retro-panel" style={{ padding: 14 }}>
      {/* Column header — brass plaque style */}
      <div style={{
        marginBottom: 14, paddingBottom: 12,
        borderBottom: `2px solid ${column.accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `${column.accent}22`,
            border: `1px solid ${column.accent}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className={column.iconClass} style={{ color: column.accent, fontSize: 15 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="section-title" style={{
              fontSize: 14, color: '#fff', letterSpacing: 1.5, lineHeight: 1.1,
            }}>
              {column.label}
            </div>
            <div style={{
              fontSize: 9, color: R.textDim, letterSpacing: 1.2,
              fontFamily: 'monospace', marginTop: 2, textTransform: 'uppercase',
            }}>
              {column.sub}
            </div>
          </div>
        </div>
        <div className="retro-led" style={{
          fontSize: 15, color: column.accent, lineHeight: 1,
          padding: '4px 8px', border: `1px solid ${column.accent}44`,
          borderRadius: 6, flexShrink: 0,
        }}>
          {filledInCol}/{ownedTiles.length}
        </div>
      </div>

      {/* Tiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ownedTiles.length === 0 && lockedTiles.length === 0 && (
          <div style={{
            padding: 20, textAlign: 'center', color: R.textDim, fontSize: 11,
          }}>
            No slots in this block.
          </div>
        )}

        {ownedTiles.map(t => (
          <SlotTile
            key={t.typeId}
            idx={t.idx}
            slotTypeId={t.typeId}
            run={runsBySlot[t.idx]}
            plan={plans[t.idx]}
            station={station}
            research={research}
            cycleIdx={cycleIdx}
            accent={column.accent}
            onOpenSlot={onOpenSlot}
            onCancelRun={onCancelRun}
          />
        ))}

        {lockedTiles.map(t => (
          <LockedTile key={t.typeId} slotTypeId={t.typeId} />
        ))}
      </div>
    </div>
  )
}

// ─── SLOT TILE ─────────────────────────────────────────────────────────
function SlotTile({ idx, slotTypeId, run, plan, station, research, cycleIdx, accent, onOpenSlot, onCancelRun }) {
  const slotType = SLOT_TYPES[slotTypeId] || SLOT_TYPES.prime
  const seasonal = getSeasonalPref(slotTypeId, cycleIdx)
  const auto = slotAutoAt(station, idx)

  if (run) {
    return (
      <ActiveRunTile
        run={run}
        idx={idx}
        slotType={slotType}
        station={station}
        research={research}
        accent={accent}
        onCancel={() => onCancelRun(run.id)}
      />
    )
  }

  if (auto) {
    return (
      <AutoTile
        idx={idx}
        slotType={slotType}
        auto={auto}
        station={station}
        accent={accent}
        onClick={() => onOpenSlot(idx)}
      />
    )
  }

  return (
    <EmptyTile
      idx={idx}
      slotType={slotType}
      seasonal={seasonal}
      accent={accent}
      onClick={() => onOpenSlot(idx)}
    />
  )
}

// ─── EMPTY TILE ────────────────────────────────────────────────────────
function EmptyTile({ idx, slotType, seasonal, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        background: 'rgba(15, 23, 42, 0.7)',
        border: `2px dashed ${R.border}88`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.15s',
        minHeight: 84,
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.background = 'rgba(30, 41, 55, 0.9)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${R.border}88`
        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)'
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 6,
      }}>
        <div style={{
          fontSize: 11, color: R.text, fontWeight: 700, letterSpacing: 0.5,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>{slotType.icon}</span>
          <span>{slotType.label}</span>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, color: accent, fontSize: 10, letterSpacing: 2,
        fontFamily: 'monospace', textTransform: 'uppercase',
      }}>
        <i className="fa-solid fa-plus" />
        <span>Schedule Program</span>
      </div>

      {seasonal && (
        <div style={{
          marginTop: 8, padding: '5px 8px',
          background: `${R.gold}18`,
          border: `1px solid ${R.gold}44`,
          borderRadius: 6,
          fontSize: 9.5, color: R.gold,
          fontFamily: 'monospace', letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}>
          <i className="fa-solid fa-bolt" style={{ marginRight: 5 }} />
          Wants: {seasonal.label}
        </div>
      )}
    </div>
  )
}

// ─── ACTIVE RUN TILE ───────────────────────────────────────────────────
function ActiveRunTile({ run, idx, slotType, station, research, accent, onCancel }) {
  // Look up program details
  const program = (station.programs || []).find(p => p.id === run.programId)
  const projected = program ? projectShow(program, slotType.id, station, research) : null
  const remaining = run.monthsRemaining ?? run.runMonths ?? 1
  const totalRun = run.runMonths ?? 1

  // Sports and movies show different info
  const movie = program?.movieId ? findMovie(program.movieId) : null
  const league = program?.sportsLeagueId ? findLeague(program.sportsLeagueId) : null

  const displayName = program?.name || movie?.name || (league ? `${league.label}` : 'Unknown')
  const q = projected?.q ?? program?.trueQ ?? 0
  const h = projected?.h ?? program?.trueH ?? 0

  return (
    <div style={{
      padding: '12px 14px',
      background: `linear-gradient(145deg, ${R.panel} 0%, ${R.panelLo} 100%)`,
      border: `2px solid ${accent}88`,
      borderLeft: `4px solid ${accent}`,
      borderRadius: 10,
      minHeight: 84,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {/* Header: slot name + cancel */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{
          fontSize: 9.5, color: R.textDim, letterSpacing: 1.5,
          fontFamily: 'monospace', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span>{slotType.icon}</span>
          <span>{slotType.label}</span>
        </div>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: `1px solid ${R.red}55`,
            color: R.red,
            padding: '2px 8px',
            fontSize: 9,
            letterSpacing: 1,
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}
          title="Cancel this run"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* Program name */}
      <div style={{
        fontSize: 14, color: '#fff', fontWeight: 700, lineHeight: 1.15,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {displayName}
      </div>

      {/* Q/H + run remaining */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto',
      }}>
        <QHPill label="Q" value={q} color={R.viewers} />
        <QHPill label="H" value={h} color={R.gold} />
        <div style={{ flex: 1 }} />
        <div style={{
          fontSize: 10, color: R.textDim, fontFamily: 'monospace',
          letterSpacing: 0.5,
        }}>
          {remaining}/{totalRun} mo
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 3, background: 'rgba(0,0,0,0.35)', borderRadius: 999,
        overflow: 'hidden', marginTop: 2,
      }}>
        <div style={{
          width: `${totalRun > 0 ? ((totalRun - remaining + 1) / totalRun) * 100 : 0}%`,
          height: '100%',
          background: accent,
          borderRadius: 999,
        }} />
      </div>
    </div>
  )
}

function QHPill({ label, value, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 3,
      padding: '2px 7px',
      background: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 10, fontWeight: 700, color,
    }}>
      <span style={{ opacity: 0.6, fontSize: 9 }}>{label}</span>
      <span>{(value || 0).toFixed(1)}</span>
    </span>
  )
}

// ─── AUTO (director-managed) TILE ──────────────────────────────────────
function AutoTile({ idx, slotType, auto, station, accent, onClick }) {
  const director = findDirector(auto.directorId)
  const focus = CATEGORIES[auto.focus] || null

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        background: 'rgba(30, 41, 55, 0.7)',
        border: `1px dashed ${accent}66`,
        borderRadius: 10,
        cursor: 'pointer',
        minHeight: 84,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{
        fontSize: 9.5, color: R.textDim, letterSpacing: 1.5,
        fontFamily: 'monospace', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span>{slotType.icon}</span>
        <span>{slotType.label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 5,
          background: `${accent}22`,
          border: `1px solid ${accent}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="fa-solid fa-clapperboard" style={{ color: accent, fontSize: 11 }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 12, color: '#fff', fontWeight: 700,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {director?.name || 'Director-managed'}
          </div>
          <div style={{ fontSize: 10, color: R.textDim, marginTop: 1 }}>
            Focus: {focus?.label || auto.focus || 'any'}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 'auto',
        fontSize: 9, color: accent, letterSpacing: 1.5,
        fontFamily: 'monospace', textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        Auto-scheduling active · tap to manage
      </div>
    </div>
  )
}

// ─── LOCKED TILE (slot type not owned) ─────────────────────────────────
function LockedTile({ slotTypeId }) {
  const slotType = SLOT_TYPES[slotTypeId]
  if (!slotType) return null

  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(15, 23, 42, 0.4)',
      border: `1px dashed ${R.border}44`,
      borderRadius: 10,
      minHeight: 60,
      opacity: 0.55,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        fontSize: 10, color: R.textMuted, letterSpacing: 1,
        fontFamily: 'monospace', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span>{slotType.icon}</span>
        <span>{slotType.label}</span>
      </div>
      <div style={{
        fontSize: 10, color: R.textMuted, fontStyle: 'italic',
      }}>
        <i className="fa-solid fa-lock" style={{ marginRight: 5, fontSize: 9 }} />
        Not unlocked yet — visit Research
      </div>
    </div>
  )
}
