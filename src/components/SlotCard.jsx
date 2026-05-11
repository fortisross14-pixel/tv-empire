import { T } from '../theme.js'
import { CATEGORIES, SLOT_TYPES, MONTHS } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import {
  projectShow, findDirector, findStar, findIP, findMovie, findLeague,
  getSeasonalPref, cancelRunCost,
} from '../engine.js'

export function SlotCard({ plan, run, idx, slotTypeId, cycleIdx, station, research, onClick, onCancel }) {
  const slotType = SLOT_TYPES[slotTypeId] || SLOT_TYPES.prime
  const seasonal = getSeasonalPref(slotTypeId, cycleIdx)

  // ── ACTIVE RUN STATE ───────────────────────────────────────────────────
  if (run) {
    return <ActiveRunCard run={run} slotType={slotType} cycleIdx={cycleIdx}
                          station={station} research={research} onCancel={onCancel} />
  }

  // ── EMPTY SLOT STATE ───────────────────────────────────────────────────
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        background: T.card,
        border: `1.5px dashed ${T.border}`,
        borderRadius: 6,
        padding: '16px 14px',
        textAlign: 'left',
        transition: 'all .15s',
        cursor: 'pointer',
        color: T.text,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
    >
      <div style={{
        fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '.08em',
        color: T.accent, marginBottom: 4,
      }}>
        {slotType.icon} {slotType.label.toUpperCase()}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 1.4 }}>
        {slotType.desc}
      </div>
      {seasonal && (
        <div style={{
          fontSize: 10, padding: '6px 8px',
          background: T.gold + '14',
          border: `1px solid ${T.gold}33`,
          borderRadius: 4, color: T.gold, marginBottom: 10,
        }}>
          ⭐ {MONTHS[cycleIdx]} wants: <strong>{seasonal.label}</strong>
          {' '}<span style={{ opacity: 0.8 }}>(+{seasonal.bonusH?.toFixed(1)} hype if matched)</span>
        </div>
      )}
      <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
        + Plan a program
      </div>
    </button>
  )
}

// ─── ACTIVE RUN CARD ────────────────────────────────────────────────────
function ActiveRunCard({ run, slotType, cycleIdx, station, research, onCancel }) {
  const isMovie = !!run.movieId
  const isSports = !!run.sportsRunLeagueId
  const movie = isMovie ? findMovie(run.movieId) : null
  const league = isSports ? findLeague(run.sportsRunLeagueId) : null

  const cat = isSports ? CATEGORIES.sports
            : isMovie  ? CATEGORIES.movie
            :            (run.categoryId ? CATEGORIES[run.categoryId] : null)

  const dir = findDirector(run.directorId)
  const star = findStar(run.starId)
  const ip = findIP(run.ipId)

  const proj = projectShow(run, station, research, cycleIdx)
  const displayName = isMovie ? movie?.name : (isSports ? `${league?.label} Coverage` : (run.name || 'Untitled'))

  const monthsRemaining = run.runMonths - run.monthsAired
  const inSeasonNow = isSports ? league?.season.includes(cycleIdx) : true
  const cancelCost = cancelRunCost(run)

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${cat?.color || T.accent}`,
      borderRadius: 6,
      padding: 14,
      color: T.text,
      position: 'relative',
    }}>
      <div style={{
        fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: '.08em',
        color: T.muted, marginBottom: 6,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>{slotType.icon} {slotType.label.toUpperCase()}</span>
        <span style={{
          color: T.green, fontFamily: 'DM Mono', fontSize: 11,
          background: T.green + '14', padding: '2px 6px', borderRadius: 3,
        }}>{run.monthsAired}/{run.runMonths} mo</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>
            {cat?.icon} {isMovie ? 'Movie' : isSports ? 'Sports Rights' : cat?.label}
            {run.seqSeason > 1 && <span style={{ color: T.purple, marginLeft: 6 }}>· S{run.seqSeason}</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
            {displayName}
          </div>
        </div>
        {proj && <HTag tier={proj.tier} />}
      </div>

      {isSports && !inSeasonNow && (
        <div style={{
          fontSize: 10, color: T.muted, fontStyle: 'italic',
          padding: 6, background: T.cardHi, borderRadius: 4, marginBottom: 8,
        }}>
          Off-season this month — no airing, no cost.
        </div>
      )}

      <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>
        {isMovie ? 'Licensed film' : (
          <>
            {dir ? `🎬 ${dir.name}` : <span style={{ opacity: .5 }}>—</span>}
            {' · '}
            {star ? `⭐ ${star.name}` : <span style={{ opacity: .5 }}>—</span>}
            {ip ? <> · 📜 {ip.name}</> : null}
          </>
        )}
      </div>

      {proj && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.muted, marginBottom: 2 }}>
              <span>Q</span>
              <span style={{ color: T.green }}>{proj.quality.toFixed(1)}</span>
            </div>
            <Bar value={proj.quality} color={T.green} h={4} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.muted, marginBottom: 2 }}>
              <span>H</span>
              <span style={{ color: T.pink }}>{proj.hype.toFixed(1)}</span>
            </div>
            <Bar value={proj.hype} color={T.pink} h={4} />
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 8, borderTop: `1px solid ${T.border}`,
        gap: 8,
      }}>
        <span style={{ fontSize: 10, color: T.muted }}>
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
              border: `1px solid ${T.red}55`,
              color: T.red,
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >CANCEL (${cancelCost.toFixed(1)}M)</button>
        )}
      </div>
    </div>
  )
}
