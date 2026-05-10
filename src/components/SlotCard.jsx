import { T } from '../theme.js'
import { CATEGORIES, MARKETS } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import { projectShow, programCost, findDirector, findStar, findIP, findMovie } from '../engine.js'

export function SlotCard({ slot, idx, station, research, onClick }) {
  const empty = !slot.categoryId && !slot.movieId
  const market = MARKETS[station.market]

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
          padding: '20px 16px',
          color: T.muted,
          textAlign: 'center',
          transition: 'all .15s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = T.accent
          e.currentTarget.style.color = T.accent
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = T.border
          e.currentTarget.style.color = T.muted
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>+ Slot {idx + 1}</div>
        <div style={{ fontSize: 11 }}>Plan a program</div>
      </button>
    )
  }

  const isMovie = !!slot.movieId
  const movie = isMovie ? findMovie(slot.movieId) : null
  const cat = slot.categoryId ? CATEGORIES[slot.categoryId] : (isMovie ? CATEGORIES.movie : null)
  const proj = projectShow(slot, station, research)
  const cost = programCost(slot, market, research)

  const dir = findDirector(slot.directorId)
  const star = findStar(slot.starId)
  const ip = findIP(slot.ipId)

  const displayName = isMovie ? movie?.name : slot.name

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
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.borderLeftColor = cat?.color || T.accent }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.borderLeftColor = cat?.color || T.accent }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>
            Slot {idx + 1} · {cat?.icon} {isMovie ? 'Movie License' : cat?.label}
            {slot.seqSeason ? <span style={{ color: T.purple, marginLeft: 4 }}>· S{slot.seqSeason}</span> : null}
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

      {/* Talent / details line */}
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

      {/* Stats row */}
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

      {/* Cost */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cost</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: T.red, fontWeight: 600 }}>
          ${cost.toFixed(1)}M
        </span>
      </div>
    </button>
  )
}
