import { T } from '../theme.js'
import { CATEGORIES, SLOT_TYPES, MONTHS } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import { Icon, SlotIcon, CategoryIcon } from '../icons.jsx'
import { play as playSound } from '../audio.js'
import {
  projectShow, findDirector, findStar, findIP, findMovie, findLeague,
  getSeasonalPref, cancelRunCost,
} from '../engine.js'

/**
 * SlotCard — two visual states:
 *   1. EMPTY  → a flat "off" tile: deep void color, no border, faint inset.
 *               Hover lifts it. Click to plan.
 *   2. ACTIVE → a fully "lit" broadcast tile with:
 *                 · category-color edge bar (animated pulse while airing)
 *                 · raised contrast
 *                 · prominent title set in editorial serif
 *                 · projected quality/hype bars
 *                 · ON-AIR red dot while currently running
 */
export function SlotCard({ plan, run, idx, slotTypeId, cycleIdx, station, research, onClick, onCancel }) {
  const slotType = SLOT_TYPES[slotTypeId] || SLOT_TYPES.prime
  const seasonal = getSeasonalPref(slotTypeId, cycleIdx)

  if (run) {
    return <ActiveRunCard
      run={run} slotType={slotType} cycleIdx={cycleIdx}
      station={station} research={research} onCancel={onCancel}
    />
  }

  return <EmptySlotCard
    slotType={slotType} cycleIdx={cycleIdx} seasonal={seasonal} onClick={onClick}
  />
}

// ─── EMPTY SLOT — "the light is off" ──────────────────────────────────
function EmptySlotCard({ slotType, cycleIdx, seasonal, onClick }) {
  return (
    <button
      onClick={() => { playSound('tick'); onClick() }}
      style={{
        display: 'block',
        width: '100%',
        background: T.void,
        border: 'none',
        borderRadius: 6,
        padding: '18px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        color: T.mutedDim,
        position: 'relative',
        boxShadow: `inset 0 0 0 1px ${T.border}, inset 0 1px 2px rgba(0,0,0,.4)`,
        transition: 'all .2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.surface
        e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.accent}66, 0 4px 12px rgba(240,163,71,.06)`
        e.currentTarget.style.color = T.muted
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = T.void
        e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${T.border}, inset 0 1px 2px rgba(0,0,0,.4)`
        e.currentTarget.style.color = T.mutedDim
      }}
    >
      {/* Top row: icon + slot label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 8,
      }}>
        <SlotIcon slotTypeId={slotType.id} size={18} color="currentColor" />
        <div className="display" style={{
          fontSize: 14,
          color: 'currentColor',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}>
          {slotType.label}
        </div>
      </div>

      <div style={{
        fontSize: 11.5, color: T.mutedDim, marginBottom: 14, lineHeight: 1.5,
      }}>
        {slotType.desc}
      </div>

      {seasonal && (
        <div style={{
          fontSize: 10.5,
          padding: '6px 9px',
          background: 'rgba(255, 209, 102, .06)',
          border: `1px solid rgba(255, 209, 102, .22)`,
          borderRadius: 3,
          color: T.gold,
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="star" size={11} color={T.gold} />
          <span>{MONTHS[cycleIdx]} wants <strong>{seasonal.label}</strong></span>
          <span style={{ opacity: .7, marginLeft: 'auto' }}>+{seasonal.bonusH?.toFixed(1)}H</span>
        </div>
      )}

      <div style={{
        fontSize: 12,
        color: T.muted,
        display: 'flex', alignItems: 'center', gap: 6,
        fontStyle: 'italic',
      }}>
        <Icon name="plus" size={13} color={T.muted} />
        <span>Plan a program</span>
      </div>
    </button>
  )
}

// ─── ACTIVE RUN — "the light is on" ───────────────────────────────────
function ActiveRunCard({ run, slotType, cycleIdx, station, research, onCancel }) {
  const isMovie = !!run.movieId
  const isSports = !!run.sportsRunLeagueId
  const movie = isMovie ? findMovie(run.movieId) : null
  const league = isSports ? findLeague(run.sportsRunLeagueId) : null

  const cat = isSports ? CATEGORIES.sports
            : isMovie  ? CATEGORIES.movie
            :            (run.categoryId ? CATEGORIES[run.categoryId] : null)
  const catColor = cat?.color || T.accent

  const dir = findDirector(run.directorId)
  const star = findStar(run.starId)
  const ip = findIP(run.ipId)

  const proj = projectShow(run, station, research, cycleIdx)
  const displayName = isMovie
    ? movie?.name
    : (isSports ? `${league?.label} Coverage` : (run.name || 'Untitled'))

  const monthsRemaining = run.runMonths - run.monthsAired
  const inSeasonNow = isSports ? league?.season.includes(cycleIdx) : true
  const cancelCost = cancelRunCost(run)
  const isOnAir = inSeasonNow && monthsRemaining > 0

  return (
    <div style={{
      position: 'relative',
      background: T.card,
      borderRadius: 6,
      padding: '14px 14px 14px 18px',
      color: T.text,
      overflow: 'hidden',
      boxShadow: `0 1px 0 ${T.borderHi}, 0 4px 12px rgba(0,0,0,.3), inset 0 0 0 1px ${T.border}`,
    }}>
      {/* LEFT EDGE — category color bar (pulses while airing) */}
      <div
        className={isOnAir ? 'airing' : ''}
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 4,
          background: `linear-gradient(180deg, ${catColor}, ${catColor}88)`,
          boxShadow: `0 0 12px ${catColor}66`,
        }}
      />

      {/* SOFT INNER GLOW in category color */}
      <div style={{
        position: 'absolute',
        left: 4, top: 0, bottom: 0,
        width: 60,
        background: `linear-gradient(90deg, ${catColor}14, transparent)`,
        pointerEvents: 'none',
      }}/>

      {/* TOP ROW — slot label + on-air + months */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 8, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <SlotIcon slotTypeId={slotType.id} size={14} color={T.muted} />
          <span className="display" style={{
            fontSize: 11, color: T.muted, letterSpacing: '.08em', textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{slotType.label}</span>
          {isOnAir && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
              <span className="onair-dot" />
              <span className="mono" style={{ fontSize: 9, color: T.red, letterSpacing: '.1em' }}>LIVE</span>
            </span>
          )}
        </div>
        <span className="mono" style={{
          color: T.green, fontSize: 10.5, fontWeight: 500,
          background: 'rgba(91, 214, 135, .1)',
          padding: '2px 7px', borderRadius: 3,
          border: `1px solid rgba(91, 214, 135, .25)`,
          whiteSpace: 'nowrap',
        }}>{run.monthsAired}/{run.runMonths}MO</span>
      </div>

      {/* TITLE BLOCK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 10, color: T.muted, marginBottom: 3,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {cat && <CategoryIcon categoryId={cat === CATEGORIES.movie ? 'movie' : cat === CATEGORIES.sports ? 'sports' : run.categoryId} size={12} color={catColor} />}
            <span>{isMovie ? 'Movie' : isSports ? 'Sports Rights' : cat?.label}</span>
            {run.seqSeason > 1 && (
              <span style={{ color: T.purple, marginLeft: 4 }}>· S{run.seqSeason}</span>
            )}
          </div>
          <div className="editorial" style={{
            fontSize: 18, fontWeight: 600, color: T.text, lineHeight: 1.15,
            letterSpacing: '-.005em',
          }}>
            {displayName}
          </div>
        </div>
        {proj && <HTag tier={proj.tier} />}
      </div>

      {/* Off-season notice */}
      {isSports && !inSeasonNow && (
        <div style={{
          fontSize: 10.5, color: T.muted, fontStyle: 'italic',
          padding: '7px 9px', background: T.surface, borderRadius: 3, marginBottom: 10,
          border: `1px solid ${T.border}`,
        }}>
          Off-season this month — no airing, no cost.
        </div>
      )}

      {/* TALENT LINE */}
      <div style={{
        fontSize: 11, color: T.textDim, marginBottom: 10, lineHeight: 1.5,
        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
      }}>
        {isMovie ? <span style={{ color: T.muted, fontStyle: 'italic' }}>Licensed film</span> : (
          <>
            {dir
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="play" size={10} color={T.muted} /> {dir.name}
                </span>
              : <span style={{ color: T.mutedDim }}>— Director</span>}
            <span style={{ color: T.mutedDim }}>·</span>
            {star
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="star" size={10} color={T.gold} /> {star.name}
                </span>
              : <span style={{ color: T.mutedDim }}>— Star</span>}
            {ip && <>
              <span style={{ color: T.mutedDim }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="ip" size={10} color={T.teal} /> {ip.name}
              </span>
            </>}
          </>
        )}
      </div>

      {/* Q / H bars */}
      {proj && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <MetricBar label="QUALITY" value={proj.quality} color={T.green} />
          <MetricBar label="HYPE"    value={proj.hype}    color={T.pink} />
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 10, borderTop: `1px solid ${T.border}`, gap: 8,
      }}>
        <span className="mono" style={{ fontSize: 11, color: T.muted }}>
          ${run.monthlyCost.toFixed(1)}M / mo · {monthsRemaining} left
        </span>
        {onCancel && monthsRemaining > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`Cancel "${displayName}"? Penalty: $${cancelCost.toFixed(1)}M (50% of remaining run).`)) {
                onCancel()
              }
            }}
            style={{
              background: 'transparent',
              border: `1px solid rgba(239, 69, 101, .35)`,
              color: T.red,
              padding: '5px 11px',
              borderRadius: 3,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '.05em',
            }}
          >CANCEL · ${cancelCost.toFixed(1)}M</button>
        )}
      </div>
    </div>
  )
}

function MetricBar({ label, value, color }) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontSize: 9, color: T.muted, marginBottom: 4, letterSpacing: '.08em',
      }}>
        <span>{label}</span>
        <span className="mono" style={{ color, fontSize: 11, fontWeight: 500 }}>
          {value.toFixed(1)}
        </span>
      </div>
      <Bar value={value} color={color} h={4} />
    </div>
  )
}
