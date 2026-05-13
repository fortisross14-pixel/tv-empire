import { useState, useMemo, useEffect } from 'react'
import { T } from '../theme.js'
import { CATEGORIES, MARKETS, SLOT_TYPES } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import { fameLabel, fmtM, findLeague, ratingLabel, ratingLabelColor } from '../engine.js'
import { play as playSound } from '../audio.js'

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

  // After the results-reveal whoosh (played from App on phase change), follow up
  // with one hit or flop accent sound — whichever the headline result was.
  // We pick a single sound rather than spamming one per airing to keep things
  // tasteful: the biggest hit beats the biggest flop, ratings ≥ 8 = hit,
  // ratings < 4 = flop, otherwise silence.
  useEffect(() => {
    const best  = airings.reduce((m, a) => (a.rating > (m?.rating ?? -1) ? a : m), null)
    const worst = airings.reduce((m, a) => (a.rating < (m?.rating ?? 99) ? a : m), null)
    let timer
    if (best && best.rating >= 8) {
      timer = setTimeout(() => playSound('hit'), 700)
    } else if (worst && worst.rating < 4) {
      timer = setTimeout(() => playSound('flop'), 700)
    }
    return () => { if (timer) clearTimeout(timer) }
    // Run once on mount per results set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

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
    <div className="view-wrap ani" style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 14px 60px' }}>
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

      {/* Milestones: spec star-ups + achievements unlocked + recurring events */}
      <MilestonesSection
        starUps={results.starUps || []}
        achievementsUnlocked={results.achievements?.unlocked || []}
        achievementsRecurring={results.achievements?.recurring || []}
      />

      <button
        onClick={onContinue}
        style={{
          width: '100%', padding: '11px 14px', marginBottom: 14,
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          color: '#fff', border: 'none', borderRadius: 5,
          fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '.1em',
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
  const ratingColor = ratingLabelColor(a.rating, T)
  const label = ratingLabel(a.rating)
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
            {a.isFinale && (
              <span style={{
                marginLeft: 6,
                fontSize: 9, color: T.gold,
                background: T.gold + '22',
                border: `1px solid ${T.gold}66`,
                padding: '1px 6px', borderRadius: 3,
                letterSpacing: '.1em', fontWeight: 700,
                verticalAlign: 'middle',
              }}>🎬 FINALE</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
            {isMovie ? '🎞 Movie' : isSports ? `${league?.icon || '🏆'} ${league?.label || 'Sports'}` : ((cat?.icon || '') + ' ' + (cat?.label || a.categoryId))}
          </div>
        </div>
        <div style={{
          background: ratingColor + '22', border: `1px solid ${ratingColor}55`,
          color: ratingColor, padding: '4px 10px', borderRadius: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          minWidth: 78,
        }}>
          <div className="mono" style={{
            fontSize: 16, fontWeight: 700, lineHeight: 1,
          }}>{a.rating?.toFixed(1)}</div>
          {label && (
            <div className="mono" style={{
              fontSize: 8.5, letterSpacing: '.1em', marginTop: 3, fontWeight: 700,
            }}>{label}</div>
          )}
        </div>
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
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: color || T.text, fontWeight: 600,
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

// ─── MILESTONES SECTION ──────────────────────────────────────────────────
// Surfaces three kinds of "good things that happened this month":
//   1. Specialization star-ups (per genre, half-star)
//   2. Newly unlocked one-shot achievements (firsts)
//   3. Recurring events (most-watched of the month, etc.)
// Renders nothing if none of these fired.
function MilestonesSection({ starUps, achievementsUnlocked, achievementsRecurring }) {
  const hasAny = (starUps?.length || 0) > 0
                 || (achievementsUnlocked?.length || 0) > 0
                 || (achievementsRecurring?.length || 0) > 0
  if (!hasAny) return null

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.gold}10 0%, ${T.surface} 60%)`,
      border: `1px solid ${T.gold}55`,
      borderRadius: 6, padding: 14, marginBottom: 14,
    }}>
      <div style={{
        fontSize: 10, color: T.gold, letterSpacing: '.12em',
        marginBottom: 10, fontWeight: 700,
      }}>
        ✨ MILESTONES THIS MONTH
      </div>

      {/* Star-ups */}
      {starUps && starUps.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {starUps.map((s, i) => {
            const cat = CATEGORIES[s.categoryId]
            const catColor = cat?.color || T.accent
            return (
              <MilestoneRow
                key={`star-${i}`}
                icon="⭐"
                tone={T.gold}
                title={`Specialty up: ${cat?.label || s.categoryId}`}
                subtitle={`Now ${s.newStars.toFixed(1)}★ — your productions in this genre get bigger bonuses.`}
                accentColor={catColor}
              />
            )
          })}
        </div>
      )}

      {/* Unlocked achievements */}
      {achievementsUnlocked && achievementsUnlocked.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {achievementsUnlocked.map((u, i) => (
            <MilestoneRow
              key={`ach-${i}`}
              icon={u.achievement.icon}
              tone={u.achievement.tone === 'gold' ? T.gold : u.achievement.tone === 'silver' ? T.textDim : T.accent}
              title={`Achievement unlocked: ${u.achievement.title}`}
              subtitle={u.achievement.desc}
              context={u.context?.programName}
            />
          ))}
        </div>
      )}

      {/* Recurring events (e.g. month top) */}
      {achievementsRecurring && achievementsRecurring.length > 0 && (
        <div>
          {achievementsRecurring.map((r, i) => (
            <MilestoneRow
              key={`rec-${i}`}
              icon={r.achievement.icon}
              tone={T.gold}
              title={r.achievement.title}
              subtitle={
                r.context?.programName
                  ? `"${r.context.programName}" reached ${r.context.audience?.toFixed(1) || '?'}M viewers — leading the market.`
                  : r.achievement.desc
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MilestoneRow({ icon, tone, title, subtitle, context, accentColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '7px 9px',
      background: 'rgba(0,0,0,.2)',
      borderLeft: `3px solid ${accentColor || tone || T.accent}`,
      borderRadius: 3,
      marginBottom: 5,
    }}>
      <div style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: tone || T.text, lineHeight: 1.3 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, marginTop: 2 }}>
          {subtitle}
          {context && (
            <span style={{ color: T.textDim, fontStyle: 'italic', marginLeft: 4 }}>
              — "{context}"
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
