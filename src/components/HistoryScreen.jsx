import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import { CATEGORIES, CATEGORY_IDS, MONTHS } from '../constants.js'
import { SectionTitle } from './ui.jsx'
import { fmtM, findLeague, findMovie, r1 } from '../engine.js'

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

  return (
    <div className="view-wrap" style={{ maxWidth: 900, margin: '0 auto', padding: 18 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: `1px solid ${T.border}`,
        color: T.muted, padding: '8px 14px', borderRadius: 5,
        fontSize: 11, fontWeight: 600, marginBottom: 16, cursor: 'pointer',
      }}>← Back</button>

      <SectionTitle>History</SectionTitle>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 18,
        borderBottom: `1px solid ${T.border}`, overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent', border: 'none',
              color: tab === t.id ? T.accent : T.muted,
              fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '.1em',
              padding: '8px 14px', cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.id ? T.accent : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
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

// ─── MY PRODUCTIONS TAB ──────────────────────────────────────────────────────
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
          name: a.name, // e.g. "Director-managed: reality"
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
    // Convert each group into a program-like record with totals
    const result = []
    for (const g of groups.values()) {
      const n = g.airings.length
      const sumQ = g.airings.reduce((s, a) => s + (a.quality || 0), 0)
      const sumH = g.airings.reduce((s, a) => s + (a.hype || 0), 0)
      const sumR = g.airings.reduce((s, a) => s + (a.rating || 0), 0)
      const sumAud = g.airings.reduce((s, a) => s + (a.audience || 0), 0)
      const sumRev = g.airings.reduce((s, a) => s + (a.revenue || 0), 0)
      const sumCost = g.airings.reduce((s, a) => s + (a.cost || 0), 0)
      // Sort airings newest first for the timeline
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
    // Newest first (revealed first, then by airingsCount desc)
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
        background: T.surface, border: `1px dashed ${T.border}`,
        borderRadius: 6, padding: 24, textAlign: 'center',
        fontSize: 12, color: T.muted, lineHeight: 1.5,
      }}>
        No productions yet. Head to <strong style={{ color: T.text }}>Content → Production</strong> to build your first show.
      </div>
    )
  }

  return (
    <>
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap',
      }}>
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
          background: T.surface, border: `1px dashed ${T.border}`,
          borderRadius: 6, padding: 18, textAlign: 'center',
          fontSize: 12, color: T.muted,
        }}>No programs in "{filter}".</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => <ProductionRow key={p.id} program={p} />)}
        </div>
      )}
    </>
  )
}

function ProductionRow({ program: p }) {
  // Auto-scheduled rows have a different shape: avgQ/avgH/avgRating instead
  // of trueQ/components, status='auto', and a 🗓 badge.
  if (p.isAuto) return <AutoProductionRow program={p} />

  const cat = CATEGORIES[p.categoryId]
  const league = p.sportsLeagueId ? findLeague(p.sportsLeagueId) : null
  const movie = p.movieId ? findMovie(p.movieId) : null
  const showTrue = p.revealed || p.status === 'finished' || p.status === 'airing'
  const profit = (p.totalRevenue || 0) - (p.totalCost || 0)

  const statusColor =
    p.status === 'producing' ? T.accent :
    p.status === 'shelf' ? T.green :
    p.status === 'airing' ? T.gold :
    T.muted

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${cat?.color || T.accent}`,
      borderRadius: 6,
      padding: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{p.name}</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>
            {movie ? '🎞 Movie' : league ? `${league.icon} ${league.label}` : `${cat?.icon} ${cat?.label}`}
            {p.bornYear && <> · Y{p.bornYear}</>}
            {p.airingsCount > 0 && <> · {p.airingsCount} airing{p.airingsCount > 1 ? 's' : ''}</>}
          </div>
        </div>
        <div style={{
          fontSize: 9, color: statusColor, fontWeight: 700,
          background: statusColor + '22', padding: '2px 6px', borderRadius: 3,
          whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.08em',
        }}>{p.status}</div>
      </div>

      {/* True Q/H or estimate */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, marginBottom: 8 }}>
        <Field label="Quality">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.text }}>
            {showTrue ? p.trueQ.toFixed(1) : `${p.estQRange[0]}–${p.estQRange[1]}`}
          </span>
        </Field>
        <Field label="Hype">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.gold }}>
            {showTrue ? p.trueH.toFixed(1) : `${p.estHRange[0]}–${p.estHRange[1]}`}
          </span>
        </Field>
        {p.airingsCount > 0 && (
          <>
            <Field label="Aud">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.teal }}>
                {(p.totalAudience || 0).toFixed(1)}M
              </span>
            </Field>
            <Field label="P/L">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: profit >= 0 ? T.green : T.red }}>
                {fmtM(profit)}
              </span>
            </Field>
          </>
        )}
      </div>

      {/* Components — revealed non-movies */}
      {showTrue && !p.movieId && p.components && (
        <div style={{
          marginTop: 4, paddingTop: 8, borderTop: `1px dashed ${T.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        }}>
          <CompBar label="Narrative" value={p.components.narrative} color={T.purple || T.accent} />
          <CompBar label="Art" value={p.components.art} color={T.pink || T.gold} />
          <CompBar label="Innovation" value={p.components.innovation} color={T.teal} />
          <CompBar label="Technical" value={p.components.technical} color={T.green} />
        </div>
      )}

      {/* Review */}
      {p.review && (
        <div style={{
          marginTop: 9, padding: '8px 10px',
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
          fontSize: 11, color: T.muted, fontStyle: 'italic', lineHeight: 1.4,
        }}>📰 “{p.review.quote}”</div>
      )}
    </div>
  )
}

function AutoProductionRow({ program: p }) {
  const cat = CATEGORIES[p.categoryId]
  const profit = (p.totalRevenue || 0) - (p.totalCost || 0)

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.gold}55`,
      borderLeft: `3px solid ${T.gold}`,
      borderRadius: 6,
      padding: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>
            {p.name}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>
            {cat?.icon} {cat?.label}
            {p.bornYear && <> · since Y{p.bornYear}</>}
            <> · {p.airingsCount} airing{p.airingsCount > 1 ? 's' : ''}</>
          </div>
        </div>
        <div style={{
          fontSize: 9, color: T.gold, fontWeight: 700,
          background: T.gold + '22', padding: '2px 6px', borderRadius: 3,
          whiteSpace: 'nowrap', letterSpacing: '.08em',
        }}>🗓 AUTO</div>
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 11, marginBottom: 8 }}>
        <Field label="Avg Quality">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.text }}>
            {p.avgQuality.toFixed(1)}
          </span>
        </Field>
        <Field label="Avg Hype">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.gold }}>
            {p.avgHype.toFixed(1)}
          </span>
        </Field>
        <Field label="Avg Rating">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.accent }}>
            {p.avgRating.toFixed(1)}
          </span>
        </Field>
        <Field label="Aud">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.teal }}>
            {(p.totalAudience || 0).toFixed(1)}M
          </span>
        </Field>
        <Field label="P/L">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: profit >= 0 ? T.green : T.red }}>
            {fmtM(profit)}
          </span>
        </Field>
      </div>

      <div style={{
        fontSize: 10.5, color: T.muted, lineHeight: 1.5,
        paddingTop: 8, borderTop: `1px dashed ${T.border}`,
      }}>
        Director-managed programming — each month's quality and hype roll fresh
        from the auto-scheduling band.
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

function CompBar({ label, value, color }) {
  const v = Math.max(0, Math.min(10, value || 0))
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: T.muted, letterSpacing: '.04em',
        textTransform: 'uppercase', marginBottom: 2,
      }}>
        <span>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, textTransform: 'none' }}>{v.toFixed(1)}</span>
      </div>
      <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${(v / 10) * 100}%`, height: '100%',
          background: color || T.accent,
        }} />
      </div>
    </div>
  )
}

// ─── LEADERBOARD TAB (existing logic) ────────────────────────────────────────
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
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Every show that's ever aired in this market, by you and your competitors.
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 6 }}>CATEGORY</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip label="Total" active={category === 'total'} onClick={() => setCategory('total')} />
          {CATEGORY_IDS.map(id => {
            const c = CATEGORIES[id]
            return (
              <Chip key={id} label={`${c.icon} ${c.label}`}
                active={category === id} onClick={() => setCategory(id)} />
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 6 }}>METRIC</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {METRICS.map(m => (
            <Chip key={m.id} label={m.label}
              active={metric === m.id} onClick={() => setMetric(m.id)} color={m.color} />
          ))}
        </div>
      </div>

      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 6, overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12 }}>
            No shows match this filter yet. Air more programs!
          </div>
        ) : filtered.map((s, i) => (
          <ShowRow key={s.id + '_' + i} show={s} rank={i + 1} metric={metric} />
        ))}
      </div>
    </>
  )
}

function ShowRow({ show, rank, metric }) {
  const cat = CATEGORIES[show.categoryId] || CATEGORIES[show.sportsRunLeagueId ? 'sports' : 'movie']
  const m = METRICS.find(x => x.id === metric)
  const value = show[m.key]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px',
      borderBottom: `1px solid ${T.border}`,
      background: show._isPlayer ? T.gold + '08' : 'transparent',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono', fontSize: 12,
        color: rank <= 3 ? T.gold : T.muted, fontWeight: 700,
        minWidth: 28, textAlign: 'right',
      }}>#{rank}</div>
      <div style={{ fontSize: 14 }}>{cat?.icon || '📺'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {show.name}
          {show._isPlayer && <span style={{ fontSize: 9, marginLeft: 6, color: T.gold, fontWeight: 700 }}>● YOU</span>}
        </div>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
          {show._station} · {MONTHS[show.month]} Y{show.year} · {cat?.label || 'Other'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700,
          color: m.color,
        }}>
          {m.id === 'audience' ? `${(value || 0).toFixed(2)}M` : (value || 0).toFixed(1)}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, active, onClick, color }) {
  const accent = color || T.accent
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? accent + '22' : T.card,
        border: `2px solid ${active ? accent : T.border}`,
        borderRadius: 18, padding: '5px 11px',
        fontSize: 11, fontWeight: active ? 700 : 500,
        color: active ? accent : T.muted,
        cursor: 'pointer',
      }}
    >{active && '✓ '}{label}</button>
  )
}
