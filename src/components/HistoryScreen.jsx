import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import { CATEGORIES, CATEGORY_IDS, MONTHS } from '../constants.js'
import { SectionTitle } from './ui.jsx'

const METRICS = [
  { id: 'quality',  label: 'Quality',   key: 'quality',  color: '#45c47a', max: 10 },
  { id: 'hype',     label: 'Hype',      key: 'hype',     color: '#ff69b4', max: 10 },
  { id: 'rating',   label: 'Rating',    key: 'rating',   color: '#e8a045', max: 10 },
  { id: 'audience', label: 'Audience',  key: 'audience', color: '#3ecfcf', max: null },
]

export function HistoryScreen({ stationName, allShows, competitorAllShows, onBack }) {
  const [category, setCategory] = useState('total')
  const [metric, setMetric] = useState('rating')

  // Combine player + competitor shows, label by station name
  const all = useMemo(() => {
    const mine = (allShows || []).map(s => ({
      ...s,
      _station: stationName,
      _isPlayer: true,
    }))
    const them = (competitorAllShows || []).map(s => ({
      ...s,
      _station: s.stationName || 'Unknown',
      _isPlayer: false,
    }))
    return [...mine, ...them]
  }, [allShows, competitorAllShows, stationName])

  // Filter by category, then sort by metric, top 20
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 18 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: `1px solid ${T.border}`,
        color: T.muted, padding: '8px 14px', borderRadius: 5,
        fontSize: 11, fontWeight: 600, marginBottom: 16, cursor: 'pointer',
      }}>← Back</button>

      <SectionTitle>History — All Networks</SectionTitle>

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Every show that's ever aired in this market, by you and your competitors.
        Filter by category, sort by metric. Top 20 ranked.
      </div>

      {/* Category filter */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 6 }}>CATEGORY</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FilterChip label="Total" active={category === 'total'} onClick={() => setCategory('total')} />
          {CATEGORY_IDS.map(id => {
            const c = CATEGORIES[id]
            return (
              <FilterChip
                key={id}
                label={`${c.icon} ${c.label}`}
                active={category === id}
                onClick={() => setCategory(id)}
              />
            )
          })}
        </div>
      </div>

      {/* Metric switch */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 6 }}>METRIC</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {METRICS.map(m => (
            <FilterChip
              key={m.id}
              label={m.label}
              active={metric === m.id}
              onClick={() => setMetric(m.id)}
              color={m.color}
            />
          ))}
        </div>
      </div>

      {/* Leaderboard */}
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
    </div>
  )
}

function FilterChip({ label, active, onClick, color }) {
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
        fontFamily: 'DM Mono', fontSize: 12,
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
          fontFamily: 'DM Mono', fontSize: 14, fontWeight: 700,
          color: m.color,
        }}>
          {m.id === 'audience' ? `${(value || 0).toFixed(2)}M` : (value || 0).toFixed(1)}
        </div>
      </div>
    </div>
  )
}
