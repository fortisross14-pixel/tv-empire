import { useState, useMemo } from 'react'
import { T, FONTS } from '../theme.js'
import { CATEGORIES, CATEGORY_IDS, MONTHS } from '../constants.js'
import { fmtM, findLeague, findMovie, r1 } from '../engine.js'

// Note: SectionTitle from ./ui.jsx removed in stage AL — replaced by the
// editorial SectionHead pattern.

const METRICS = [
  { id: 'quality',  label: 'Quality',   key: 'quality',  color: '#45c47a', max: 10 },
  { id: 'hype',     label: 'Hype',      key: 'hype',     color: '#ff69b4', max: 10 },
  { id: 'rating',   label: 'Rating',    key: 'rating',   color: '#e8a045', max: 10 },
  { id: 'audience', label: 'Audience',  key: 'audience', color: '#3ecfcf', max: null },
]

const TABS = [
  { id: 'productions', label: 'My Productions' },
  { id: 'leaderboard', label: 'All Networks' },
]

export function HistoryScreen({ stationName, allShows, competitorAllShows, programs, onBack }) {
  const [tab, setTab] = useState('productions')
  const activeTab = TABS.find(t => t.id === tab)

  return (
    <div className="view-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 48px' }}>
      <BackLink onClick={onBack} />

      {/* ─── HERO ─── */}
      <div style={{ position: 'relative', padding: '24px 0 24px' }}>
        <div style={{
          width: 36, height: 2,
          background: `linear-gradient(90deg, ${T.accent} 0%, transparent 100%)`,
          marginBottom: 14,
        }} />
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
          textTransform: 'uppercase', color: T.accent, marginBottom: 14,
        }}>
          Archive · {activeTab?.label || 'History'}
        </div>
        <h1 className="editorial" style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 52, lineHeight: 0.95, letterSpacing: '-.025em',
          color: T.text, marginBottom: 12,
        }}>
          History
        </h1>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 14, color: T.textDim, lineHeight: 1.55, maxWidth: 540,
        }}>
          Your productions and how they've measured against the market.
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 32, marginTop: 16,
        borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <HistorySubTab key={t.id}
            label={t.label}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
          />
        ))}
      </div>

      {tab === 'productions' ? (
        <ProductionsList programs={programs || []} allShows={allShows || []} />
      ) : (
        <LeaderboardView
          stationName={stationName}
          allShows={allShows}
          competitorAllShows={competitorAllShows}
        />
      )}
    </div>
  )
}

/** Quiet "← Back" text-link. Same as Operations. */
function BackLink({ onClick }) {
  return (
    <div style={{ paddingTop: 24 }}>
      <button onClick={onClick} style={{
        background: 'transparent', border: 'none',
        color: T.muted, padding: '4px 0', cursor: 'pointer',
        fontSize: 11, fontWeight: 500, letterSpacing: '.08em',
        textTransform: 'uppercase', display: 'inline-flex',
        alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 14 }}>←</span> Back
      </button>
    </div>
  )
}

/** Editorial sub-tab — gold bullet on active, hover tint. */
function HistorySubTab({ label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: hover && !active ? 'rgba(255,255,255,.025)' : 'transparent',
        border: 'none',
        color: active ? T.text : (hover ? T.text : T.muted),
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: active ? 700 : 600,
        letterSpacing: '.12em', textTransform: 'uppercase',
        padding: '11px 16px', cursor: 'pointer',
        position: 'relative',
        whiteSpace: 'nowrap',
        transition: 'color .15s, background .15s',
      }}
    >
      {active && (
        <span style={{
          display: 'inline-block',
          width: 5, height: 5,
          background: T.accent,
          marginRight: 8, marginBottom: 1,
          verticalAlign: 'middle',
        }} />
      )}
      {label}
      {active && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: -1, height: 2,
          background: T.accent,
        }} />
      )}
    </button>
  )
}

/** SectionHead — Fraunces + mono meta + gradient-rule. Same as Operations/Results. */
function SectionHead({ title, meta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 16, paddingBottom: 10, position: 'relative',
    }}>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 500",
        fontSize: 24, letterSpacing: '-.01em', color: T.text,
      }}>
        {title}
      </div>
      {meta && (
        <div className="mono" style={{
          fontSize: 10, color: T.muted,
          letterSpacing: '.08em', textTransform: 'uppercase',
        }}>
          {meta}
        </div>
      )}
      <div className="gradient-rule" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
      }} />
    </div>
  )
}

/** Editorial Chip — outline that fills with accent on active, hover tints
 *  the border. .08em uppercase Inter Tight, .04em border-radius. Same
 *  vocabulary as Results filter chips. */
function Chip({ label, active, onClick, color }) {
  const [hover, setHover] = useState(false)
  const c = color || T.accent
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active ? c : 'transparent',
        border: `1px solid ${active ? c : (hover ? T.borderHi : T.border)}`,
        color: active ? T.bg : (hover ? T.text : T.muted),
        padding: '5px 11px', borderRadius: 3,
        fontSize: 10, fontWeight: 600,
        letterSpacing: '.08em', textTransform: 'uppercase',
        fontFamily: FONTS.sans,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background .15s, border-color .15s, color .15s',
      }}
    >{label}</button>
  )
}

// ─── MY PRODUCTIONS TAB ───────────────────────────────────────────────
function ProductionsList({ programs, allShows }) {
  const [filter, setFilter] = useState('all')

  // Aggregate auto-scheduled airings into pseudo-program rows so the
  // Director-managed programming appears alongside the player's own
  // productions. Auto-airings share the synthetic programId
  // `auto:<slotIdx>:<categoryId>` and we group by that key.
  const autoPrograms = useMemo(() => {
    const groups = new Map()
    for (const a of allShows || []) {
      if (!a._isAuto || !a.programId) continue
      const key = a.programId
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          name: a.name,
          categoryId: a.categoryId,
          status: 'auto',
          isAuto: true,
          airings: [],
          firstYear: a.year,
          firstMonth: a.month,
        })
      }
      groups.get(key).airings.push(a)
    }
    const result = []
    for (const g of groups.values()) {
      const n = g.airings.length
      const sumQ = g.airings.reduce((s, a) => s + (a.quality || 0), 0)
      const sumH = g.airings.reduce((s, a) => s + (a.hype || 0), 0)
      const sumR = g.airings.reduce((s, a) => s + (a.rating || 0), 0)
      const sumAud = g.airings.reduce((s, a) => s + (a.audience || 0), 0)
      const sumRev = g.airings.reduce((s, a) => s + (a.revenue || 0), 0)
      const sumCost = g.airings.reduce((s, a) => s + (a.cost || 0), 0)
      const aiHistory = g.airings.slice().sort((a, b) =>
        (b.year - a.year) || (b.month - a.month)
      ).map(a => ({
        year: a.year, month: a.month,
        rating: a.rating, audience: a.audience, net: (a.revenue || 0) - (a.cost || 0),
      }))
      result.push({
        id: g.id,
        name: g.name,
        categoryId: g.categoryId,
        status: g.status,
        isAuto: true,
        revealed: true,
        bornYear: g.firstYear,
        airingsCount: n,
        avgQuality: r1(sumQ / n),
        avgHype: r1(sumH / n),
        avgRating: r1(sumR / n),
        totalAudience: r1(sumAud),
        totalRevenue: r1(sumRev),
        totalCost: r1(sumCost),
        aiHistory,
      })
    }
    return result
  }, [allShows])

  const combined = useMemo(() => [...programs, ...autoPrograms], [programs, autoPrograms])

  const filtered = useMemo(() => {
    let pool = combined
    if (filter !== 'all') pool = combined.filter(p => p.status === filter)
    return [...pool].sort((a, b) => {
      if (a.revealed !== b.revealed) return a.revealed ? -1 : 1
      return (b.airingsCount || 0) - (a.airingsCount || 0)
    })
  }, [combined, filter])

  const counts = {
    all: combined.length,
    airing: combined.filter(p => p.status === 'airing').length,
    shelf: combined.filter(p => p.status === 'shelf').length,
    producing: combined.filter(p => p.status === 'producing').length,
    finished: combined.filter(p => p.status === 'finished').length,
    auto: combined.filter(p => p.status === 'auto').length,
  }

  if (combined.length === 0) {
    return (
      <div style={{
        background: T.surface, border: `1px dashed ${T.borderHi}`,
        borderRadius: 6, padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 500",
          fontStyle: 'italic',
          fontSize: 16, color: T.textDim, marginBottom: 6,
        }}>
          No productions yet.
        </div>
        <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
          Head to <span className="mono" style={{ fontSize: 11.5, color: T.text }}>Content → Production</span> to build your first show.
        </div>
      </div>
    )
  }

  return (
    <>
      <SectionHead title="Productions" meta={`${combined.length} total`} />

      <div style={{
        display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center',
        paddingBottom: 14, borderBottom: `1px solid ${T.border}`,
      }}>
        <span className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase', marginRight: 4,
        }}>Filter</span>
        <Chip label={`All (${counts.all})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        <Chip label={`Airing (${counts.airing})`} active={filter === 'airing'} onClick={() => setFilter('airing')} />
        <Chip label={`Shelf (${counts.shelf})`} active={filter === 'shelf'} onClick={() => setFilter('shelf')} />
        <Chip label={`Producing (${counts.producing})`} active={filter === 'producing'} onClick={() => setFilter('producing')} />
        <Chip label={`Done (${counts.finished})`} active={filter === 'finished'} onClick={() => setFilter('finished')} />
        {counts.auto > 0 && (
          <Chip label={`Auto (${counts.auto})`} active={filter === 'auto'} onClick={() => setFilter('auto')} />
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: T.surface, border: `1px dashed ${T.borderHi}`,
          borderRadius: 6, padding: '24px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 500",
            fontStyle: 'italic',
            fontSize: 15, color: T.textDim,
          }}>
            No programs in "{filter}".
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => <ProductionRow key={p.id} program={p} />)}
        </div>
      )}
    </>
  )
}

function ProductionRow({ program: p }) {
  if (p.isAuto) return <AutoProductionRow program={p} />

  const cat = CATEGORIES[p.categoryId]
  const league = p.sportsLeagueId ? findLeague(p.sportsLeagueId) : null
  const movie = p.movieId ? findMovie(p.movieId) : null
  const showTrue = p.revealed || p.status === 'finished' || p.status === 'airing'
  const profit = (p.totalRevenue || 0) - (p.totalCost || 0)
  const catColor = cat?.color || T.accent

  // Status pill color
  const statusColor =
    p.status === 'producing' ? T.accent :
    p.status === 'shelf'     ? T.green :
    p.status === 'airing'    ? T.gold :
                               T.muted

  const slugline = movie ? 'Movie · licensed feature'
                : league ? `${league.label} · live coverage`
                :          (cat?.label || p.categoryId || 'Program')

  return (
    <div style={{
      padding: 14,
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${catColor}`,
      borderRadius: 5,
    }}>
      {/* Header — name + status */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 12, marginBottom: 8,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 600",
            fontSize: 17, color: T.text, letterSpacing: '-.01em',
            marginBottom: 3,
          }}>
            {p.name}
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 12.5, color: T.muted, lineHeight: 1.4,
          }}>
            {slugline}
            {p.bornYear && <span className="mono" style={{ fontStyle: 'normal', fontSize: 11, marginLeft: 6 }}>· Y{p.bornYear}</span>}
            {p.airingsCount > 0 && <span className="mono" style={{ fontStyle: 'normal', fontSize: 11, marginLeft: 6 }}>· {p.airingsCount} airing{p.airingsCount > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <span className="mono" style={{
          fontSize: 9, color: statusColor, fontWeight: 700,
          padding: '3px 9px', borderRadius: 3,
          background: statusColor + '14',
          border: `1px solid ${statusColor}66`,
          letterSpacing: '.14em', textTransform: 'uppercase',
          flexShrink: 0,
        }}>{p.status}</span>
      </div>

      {/* Stats row — mono pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: showTrue && !p.movieId && p.components ? 10 : (p.review ? 10 : 0) }}>
        <StatPill label="Q" color={T.qEnd}
          value={showTrue ? p.trueQ.toFixed(1) : `${p.estQRange[0]}–${p.estQRange[1]}`} />
        <StatPill label="H" color={T.gold}
          value={showTrue ? p.trueH.toFixed(1) : `${p.estHRange[0]}–${p.estHRange[1]}`} />
        {p.airingsCount > 0 && (
          <>
            <StatPill color={T.teal} bare
              value={`${(p.totalAudience || 0).toFixed(1)}M AUD`} />
            <StatPill color={profit >= 0 ? T.green : T.red} bare emphatic
              value={`${profit >= 0 ? '+' : '−'}${fmtM(Math.abs(profit))}`} />
          </>
        )}
      </div>

      {/* Components bars — revealed non-movies */}
      {showTrue && !p.movieId && p.components && (
        <div style={{
          marginTop: 4, paddingTop: 10,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        }}>
          <CompBar label="Narrative"  value={p.components.narrative}  color={T.purple || T.accent} />
          <CompBar label="Art"        value={p.components.art}        color={T.pink || T.gold} />
          <CompBar label="Innovation" value={p.components.innovation} color={T.teal} />
          <CompBar label="Technical"  value={p.components.technical}  color={T.green} />
        </div>
      )}

      {/* Review — italic-serif pull-quote */}
      {p.review && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: T.surface,
          borderLeft: `2px solid ${T.gold}55`,
          borderRadius: 3,
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 13, color: T.textDim, lineHeight: 1.5,
        }}>
          "{p.review.quote}"
        </div>
      )}
    </div>
  )
}

function AutoProductionRow({ program: p }) {
  const cat = CATEGORIES[p.categoryId]
  const profit = (p.totalRevenue || 0) - (p.totalCost || 0)

  return (
    <div style={{
      padding: 14,
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.gold}44`,
      borderLeft: `3px solid ${T.gold}`,
      borderRadius: 5,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 12, marginBottom: 8,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 600",
            fontSize: 17, color: T.text, letterSpacing: '-.01em',
            marginBottom: 3,
          }}>
            {p.name}
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 12.5, color: T.muted, lineHeight: 1.4,
          }}>
            {cat?.label}
            {p.bornYear && <span className="mono" style={{ fontStyle: 'normal', fontSize: 11, marginLeft: 6 }}>· since Y{p.bornYear}</span>}
            <span className="mono" style={{ fontStyle: 'normal', fontSize: 11, marginLeft: 6 }}>· {p.airingsCount} airing{p.airingsCount > 1 ? 's' : ''}</span>
          </div>
        </div>
        <span className="mono" style={{
          fontSize: 9, color: T.gold, fontWeight: 700,
          padding: '3px 9px', borderRadius: 3,
          background: T.gold + '14',
          border: `1px solid ${T.gold}66`,
          letterSpacing: '.14em', textTransform: 'uppercase',
          flexShrink: 0,
        }}>Auto</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <StatPill label="AVG Q" color={T.qEnd}  value={p.avgQuality.toFixed(1)} />
        <StatPill label="AVG H" color={T.gold}  value={p.avgHype.toFixed(1)} />
        <StatPill label="AVG R" color={T.accent} value={p.avgRating.toFixed(1)} />
        <StatPill color={T.teal} bare value={`${(p.totalAudience || 0).toFixed(1)}M AUD`} />
        <StatPill color={profit >= 0 ? T.green : T.red} bare emphatic
          value={`${profit >= 0 ? '+' : '−'}${fmtM(Math.abs(profit))}`} />
      </div>

      <div style={{
        paddingTop: 10,
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 12, color: T.muted, lineHeight: 1.5,
      }}>
        Director-managed programming — each month's quality and hype roll fresh from the auto-scheduling band.
      </div>
    </div>
  )
}

/** Stat pill — bare (no label) or label + value. */
function StatPill({ label, value, color, bare, emphatic }) {
  const c = color || T.text
  return (
    <span className="mono" style={{
      fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em',
      padding: '2px 8px', borderRadius: 3,
      background: emphatic ? c + '18' : (color ? c + '12' : 'transparent'),
      color: c,
      border: `1px solid ${color ? c + '55' : T.border}`,
    }}>
      {label && <span style={{ opacity: 0.7, marginRight: 3 }}>{label}</span>}
      {value}
    </span>
  )
}

/** Component score bar — Narrative/Art/Innovation/Technical. */
function CompBar({ label, value, color }) {
  const v = Math.max(0, Math.min(10, value || 0))
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span className="mono" style={{
          fontSize: 9, color: T.muted, letterSpacing: '.12em',
          textTransform: 'uppercase',
        }}>{label}</span>
        <span className="mono" style={{
          fontSize: 11, color: T.text, fontWeight: 600,
        }}>{v.toFixed(1)}</span>
      </div>
      <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${(v / 10) * 100}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}aa 0%, ${color} 100%)`,
          transition: 'width .5s',
        }} />
      </div>
    </div>
  )
}

// ─── LEADERBOARD TAB ───────────────────────────────────────────────────
function LeaderboardView({ stationName, allShows, competitorAllShows }) {
  const [category, setCategory] = useState('total')
  const [metric, setMetric] = useState('rating')

  const all = useMemo(() => {
    const mine = (allShows || []).map(s => ({ ...s, _station: stationName, _isPlayer: true }))
    const them = (competitorAllShows || []).map(s => ({
      ...s, _station: s.stationName || 'Unknown', _isPlayer: false,
    }))
    return [...mine, ...them]
  }, [allShows, competitorAllShows, stationName])

  const filtered = useMemo(() => {
    let pool = all
    if (category !== 'total') {
      pool = all.filter(s => {
        if (category === 'movie') return !!s.movieId || s.categoryId === 'movie'
        if (category === 'sports') return !!s.sportsRunLeagueId || s.categoryId === 'sports'
        return s.categoryId === category
      })
    }
    const key = METRICS.find(m => m.id === metric)?.key || 'rating'
    return [...pool].sort((a, b) => (b[key] || 0) - (a[key] || 0)).slice(0, 20)
  }, [all, category, metric])

  return (
    <>
      <SectionHead title="All networks · top 20" meta={`by ${METRICS.find(m => m.id === metric)?.label.toLowerCase()}`} />

      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 13, color: T.textDim, marginBottom: 20, lineHeight: 1.55, maxWidth: 620,
      }}>
        Every show that's ever aired in this market, by you and your competitors.
      </div>

      {/* Category filter */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center',
      }}>
        <span className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase', marginRight: 4,
        }}>Category</span>
        <Chip label="All" active={category === 'total'} onClick={() => setCategory('total')} />
        {CATEGORY_IDS.map(id => {
          const c = CATEGORIES[id]
          return (
            <Chip key={id} label={`${c.icon} ${c.label}`}
              active={category === id} onClick={() => setCategory(id)} />
          )
        })}
      </div>

      {/* Metric filter */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center',
        paddingBottom: 14, borderBottom: `1px solid ${T.border}`,
      }}>
        <span className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase', marginRight: 4,
        }}>Metric</span>
        {METRICS.map(m => (
          <Chip key={m.id} label={m.label}
            active={metric === m.id} onClick={() => setMetric(m.id)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: T.surface, border: `1px dashed ${T.borderHi}`,
          borderRadius: 6, padding: '24px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 500",
            fontStyle: 'italic',
            fontSize: 15, color: T.textDim,
          }}>
            No shows match this filter yet.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((s, i) => (
            <LeaderRow key={s.id + '_' + i} show={s} rank={i + 1} metric={metric} />
          ))}
        </div>
      )}
    </>
  )
}

function LeaderRow({ show, rank, metric }) {
  const cat = CATEGORIES[show.categoryId] || CATEGORIES[show.sportsRunLeagueId ? 'sports' : 'movie']
  const m = METRICS.find(x => x.id === metric)
  const value = show[m.key]
  const isPlayer = show._isPlayer
  const catColor = cat?.color || T.accent

  // Rank color — top 3 get gold/silver/bronze; rest are muted
  const rankColor = rank === 1 ? T.gold
                  : rank === 2 ? T.text
                  : rank === 3 ? T.accent
                  : T.muted

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: 14, alignItems: 'center',
      padding: '11px 14px',
      background: isPlayer
        ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
        : `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${isPlayer ? T.gold + '44' : T.border}`,
      borderLeft: `3px solid ${isPlayer ? T.gold : catColor}`,
      borderRadius: 5,
    }}>
      {/* Rank */}
      <div style={{ minWidth: 40, textAlign: 'right' }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 600",
          fontSize: 22, color: rankColor, letterSpacing: '-.02em', lineHeight: 1,
        }}>
          {rank === 1 ? '🏆 ' : ''}#{rank}
        </div>
      </div>

      {/* Name + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 24, 'wght' 600",
          fontSize: 14.5, color: T.text, letterSpacing: '-.005em',
          marginBottom: 2,
          display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
        }}>
          <span>{cat?.icon || '📺'} {show.name}</span>
          {isPlayer && (
            <span className="mono" style={{
              fontSize: 9, color: T.gold, fontWeight: 700,
              padding: '1px 7px', borderRadius: 3,
              background: T.gold + '14', border: `1px solid ${T.gold}66`,
              letterSpacing: '.14em', textTransform: 'uppercase',
            }}>You</span>
          )}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 11.5, color: T.muted,
        }}>
          {show._station} · {MONTHS[show.month]} Y{show.year} · {cat?.label || 'Other'}
        </div>
      </div>

      {/* Metric value */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 96, 'wght' 600",
          fontSize: 24, color: m.color, letterSpacing: '-.025em', lineHeight: 1,
        }}>
          {m.id === 'audience' ? `${(value || 0).toFixed(2)}M` : (value || 0).toFixed(1)}
        </div>
        <div className="mono" style={{
          fontSize: 9, color: T.muted, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 4,
        }}>
          {m.label}
        </div>
      </div>
    </div>
  )
}
