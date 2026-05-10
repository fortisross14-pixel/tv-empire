import { T } from '../theme.js'
import { CATEGORIES, SLOT_TYPES } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import {
  projectShow, programCost, findDirector, findStar, findIP, findMovie,
  getSeasonalPref,
} from '../engine.js'

export function SlotCard({ plan, idx, slotTypeId, cycleIdx, station, research, onClick }) {
  const slotType = SLOT_TYPES[slotTypeId] || SLOT_TYPES.prime
  const seasonal = getSeasonalPref(slotTypeId, cycleIdx)
  const empty = !plan.categoryId && !plan.movieId

  // ─── EMPTY STATE: prominent slot label + seasonal hint ─────────────────
  if (empty) {
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
            ⭐ This quarter: <strong>{seasonal.label}</strong>
            {' '}<span style={{ opacity: 0.8 }}>(+{seasonal.bonusH?.toFixed(1)} hype if matched)</span>
          </div>
        )}
        <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
          + Plan a program
        </div>
      </button>
    )
  }

  // ─── FILLED STATE ───────────────────────────────────────────────────────
  const isMovie = !!plan.movieId
  const movie = isMovie ? findMovie(plan.movieId) : null
  const cat = plan.categoryId ? CATEGORIES[plan.categoryId] : (isMovie ? CATEGORIES.movie : null)
  const proj = projectShow(plan, station, research, cycleIdx)
  const cost = programCost(plan, station, research)

  const dir = findDirector(plan.directorId)
  const star = findStar(plan.starId)
  const ip = findIP(plan.ipId)

  const displayName = isMovie ? movie?.name : plan.name

  // Did we match the seasonal prompt? (positive feedback)
  const matchedSeasonal = seasonal && (proj?.seasonBonusH || 0) > 0
  const matchedSlotPref = (proj?.slotBonusH || 0) > 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        background: T.card,
        border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${cat?.color || T.accent}`,
        borderRadius: 6,
        padding: 14,
        textAlign: 'left',
        transition: 'all .15s',
        color: T.text,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
    >
      <div style={{
        fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: '.08em',
        color: slotType ? T.muted : T.accent, marginBottom: 4,
      }}>
        {slotType.icon} {slotType.label.toUpperCase()}
        {plan.seqSeason ? <span style={{ color: T.purple, marginLeft: 6 }}>· S{plan.seqSeason}</span> : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>
            {cat?.icon} {isMovie ? 'Movie License' : cat?.label}
          </div>
          <div style={{
            fontSize: 15, fontWeight: 600, color: T.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName || 'Untitled'}
          </div>
        </div>
        {proj && <HTag tier={proj.tier} />}
      </div>

      {(matchedSeasonal || matchedSlotPref) && (
        <div style={{ fontSize: 9, color: T.gold, marginBottom: 8, fontWeight: 600 }}>
          {matchedSlotPref && '✓ Slot fit '}
          {matchedSeasonal && `✓ Season pick (+${proj.seasonBonusH.toFixed(1)} hype)`}
        </div>
      )}

      <div style={{ fontSize: 10, color: T.muted, marginBottom: 9, lineHeight: 1.5 }}>
        {isMovie ? (
          <>Licensed film</>
        ) : (
          <>
            {dir ? `🎬 ${dir.name}` : <span style={{ opacity: .5 }}>No director</span>}
            {' · '}
            {star ? `⭐ ${star.name}` : <span style={{ opacity: .5 }}>No star</span>}
            {ip ? <> · 📜 {ip.name}</> : null}
          </>
        )}
      </div>

      {proj && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 9 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.muted, marginBottom: 2 }}>
              <span>QUALITY</span>
              <span style={{ color: T.green }}>{proj.quality.toFixed(1)}</span>
            </div>
            <Bar value={proj.quality} color={T.green} h={4} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.muted, marginBottom: 2 }}>
              <span>HYPE</span>
              <span style={{ color: T.pink }}>{proj.hype.toFixed(1)}</span>
            </div>
            <Bar value={proj.hype} color={T.pink} h={4} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cost</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: T.red, fontWeight: 600 }}>
          ${cost.toFixed(1)}M
        </span>
      </div>
    </button>
  )
}
