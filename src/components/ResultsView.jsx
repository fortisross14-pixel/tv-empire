import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import { CATEGORIES, MARKETS, SLOT_TYPES } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import { fameLabel, fmtM, findLeague } from '../engine.js'

const SORT_OPTIONS = [
  { id: 'rating',   label: 'Rating' },
  { id: 'audience', label: 'Audience' },
  { id: 'revenue',  label: 'Revenue' },
  { id: 'profit',   label: 'Margin' },
  { id: 'slot',     label: 'Slot' },
]

export function ResultsView({ results, station, onContinue, cycleLabel }) {
  if (!results) return null
  const airings = results.airings || []
  const competitorAirings = results.competitorAirings || []
  const totals = results.totals || {}
  const market = MARKETS[station.market]

  const [slotFilter, setSlotFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating')

  // Compute per-airing slot rank (rank within slot vs competitors)
  const ranked = useMemo(() => {
    const bySlot = {}
    ;[...airings, ...competitorAirings].forEach(a => {
      const sid = a.slotTypeId || 'prime'
      if (!bySlot[sid]) bySlot[sid] = []
      bySlot[sid].push(a)
    })
    Object.values(bySlot).forEach(group => group.sort((a, b) => (b.audience || 0) - (a.audience || 0)))
    return airings.map(a => {
      const sid = a.slotTypeId || 'prime'
      const group = bySlot[sid] || []
      const slotRank = group.findIndex(x => x.id === a.id) + 1
      const slotTotal = group.length
      return { ...a, slotRank, slotTotal, _profit: (a.revenue || 0) - (a.cost || 0) }
    })
  }, [airings, competitorAirings])

  const filtered = useMemo(() => {
    return slotFilter === 'all' ? ranked : ranked.filter(a => a.slotTypeId === slotFilter)
  }, [ranked, slotFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'audience': return (b.audience || 0) - (a.audience || 0)
        case 'revenue':  return (b.revenue  || 0) - (a.revenue  || 0)
        case 'profit':   return (b._profit  || 0) - (a._profit  || 0)
        case 'slot':     return (a.slotTypeId || '').localeCompare(b.slotTypeId || '') || (a.slotRank - b.slotRank)
        case 'rating':
        default:         return (b.rating || 0) - (a.rating || 0)
      }
    })
  }, [filtered, sortBy])

  const usedSlots = useMemo(() => {
    const s = new Set(airings.map(a => a.slotTypeId).filter(Boolean))
    return Array.from(s)
  }, [airings])

  const fameAfter = station.fame
  const fameDelta = totals.fameDelta || 0
  const networkCount = totals.networkCount || 1
  const audRank = totals.audRank || 1
  const revRank = totals.revRank || 1

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 14px 60px' }} className="ani">
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div className="bebas" style={{ fontSize: 26, color: T.text, lineHeight: 1.1 }}>
          {cycleLabel} Results
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>
          {market.label} · {airings.length} program{airings.length === 1 ? '' : 's'} aired
        </div>
      </div>

      {/* Network totals */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 6, padding: 12, marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
          NETWORK TOTALS
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Tot label="Audience" value={`${(totals.audience ?? 0).toFixed(1)}M`} color={T.teal}
            sub={`Rank #${audRank} of ${networkCount}`} />
          <Tot label="Revenue" value={fmtM(totals.revenue ?? 0)} color={T.green}
            sub={`Rank #${revRank} of ${networkCount}`} />
          <Tot label="Costs" value={fmtM(totals.cost ?? 0)} color={T.red} />
          <Tot label="Net" value={fmtM(totals.net ?? 0)}
            color={(totals.net ?? 0) >= 0 ? T.green : T.red} />
          <Tot label="Fame" value={fameAfter.toFixed(1)}
            color={fameDelta >= 0 ? T.gold : T.red}
            sub={`${fameDelta >= 0 ? '+' : ''}${fameDelta.toFixed(1)} · ${fameLabel(fameAfter)}`} />
        </div>
      </div>

      <button
        onClick={onContinue}
        style={{
          width: '100%', padding: '11px 14px', marginBottom: 14,
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          color: '#fff', border: 'none', borderRadius: 5,
          fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: '.1em',
          cursor: 'pointer', fontWeight: 700,
        }}
      >Continue ▶</button>

      {airings.length > 0 && (
        <>
          <div style={{
            display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em', marginRight: 4 }}>FILTER:</div>
            <Chip label={`All (${airings.length})`} active={slotFilter === 'all'} onClick={() => setSlotFilter('all')} />
            {usedSlots.map(sid => {
              const slot = SLOT_TYPES[sid] || { label: sid, icon: '·' }
              const count = airings.filter(a => a.slotTypeId === sid).length
              return (
                <Chip key={sid}
                  label={`${slot.icon} ${slot.label} (${count})`}
                  active={slotFilter === sid}
                  onClick={() => setSlotFilter(sid)} />
              )
            })}
          </div>
          <div style={{
            display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em', marginRight: 4 }}>SORT:</div>
            {SORT_OPTIONS.map(o => (
              <Chip key={o.id} label={o.label} active={sortBy === o.id} onClick={() => setSortBy(o.id)} />
            ))}
          </div>
        </>
      )}

      {sorted.length === 0 ? (
        <div style={{
          background: T.surface, border: `1px dashed ${T.border}`,
          borderRadius: 6, padding: 24, fontSize: 12, color: T.muted, textAlign: 'center',
        }}>No programs in this filter.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((a, i) => (
            <ProgramRow key={a.id || i} airing={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProgramRow({ airing: a }) {
  const cat = CATEGORIES[a.categoryId]
  const slot = SLOT_TYPES[a.slotTypeId] || SLOT_TYPES.prime
  const league = a.sportsRunLeagueId ? findLeague(a.sportsRunLeagueId) : null
  const ratingColor = a.rating >= 8 ? T.gold : a.rating >= 7 ? T.green : a.rating >= 5 ? T.accent : T.red
  const profit = (a.revenue || 0) - (a.cost || 0)
  const profitColor = profit >= 0 ? T.green : T.red
  const isMovie = !!a.movieId
  const isSports = !!a.sportsRunLeagueId

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${cat?.color || T.accent}`,
      borderRadius: 6,
      padding: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {slot.icon} {slot.label}
            {a.slotRank > 0 && (
              <span style={{ color: a.slotRank === 1 ? T.gold : T.muted, marginLeft: 5 }}>
                · #{a.slotRank}/{a.slotTotal} in slot
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 2, lineHeight: 1.2 }}>
            {a.name || 'Untitled'}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
            {isMovie ? '🎞 Movie' : isSports ? `${league?.icon || '🏆'} ${league?.label || 'Sports'}` : ((cat?.icon || '') + ' ' + (cat?.label || a.categoryId))}
          </div>
        </div>
        <div style={{
          background: ratingColor + '22', border: `1px solid ${ratingColor}55`,
          color: ratingColor, padding: '3px 8px', borderRadius: 4,
          fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700,
          whiteSpace: 'nowrap',
        }}>{a.rating?.toFixed(1)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <Cell label="Q" value={(a.quality || 0).toFixed(1)} color={T.green} />
        <Cell label="H" value={(a.hype || 0).toFixed(1)} color={T.gold} />
        <Cell label="Aud" value={`${(a.audience || 0).toFixed(1)}M`} color={T.teal} />
        <Cell label="Rev" value={fmtM(a.revenue || 0)} color={T.text} />
        <Cell label="Margin" value={fmtM(profit)} color={profitColor} />
      </div>
    </div>
  )
}

function Tot({ label, value, color, sub }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 5, padding: '8px 10px',
      flex: 1, minWidth: 110,
    }}>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      <div className="bebas" style={{ fontSize: 20, color: color || T.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function Cell({ label, value, color }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.07em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 12, color: color || T.text, fontWeight: 600,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? T.accent + '33' : 'transparent',
      border: `1px solid ${active ? T.accent : T.border}`,
      color: active ? T.accent : T.muted,
      borderRadius: 12, padding: '3px 9px', fontSize: 11,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}
