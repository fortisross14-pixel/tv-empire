import { useMemo } from 'react'
import { T } from '../theme.js'
import { CATEGORIES, MONTHS, SLOT_TYPES } from '../constants.js'
import { SectionTitle } from './ui.jsx'

export function ThisYearScreen({ yearShows, year, onBack }) {
  // Group shows by month, then by slot
  const byMonth = useMemo(() => {
    const m = Array(12).fill(null).map(() => ({}))
    ;(yearShows || []).forEach(s => {
      const month = s.month ?? s.monthIdx ?? 0
      if (!m[month][s.slotTypeId]) m[month][s.slotTypeId] = []
      m[month][s.slotTypeId].push(s)
    })
    return m
  }, [yearShows])

  // Category totals
  const byCategory = useMemo(() => {
    const t = {}
    ;(yearShows || []).forEach(s => {
      const c = s.categoryId || (s.sportsRunLeagueId ? 'sports' : s.movieId ? 'movie' : 'other')
      if (!t[c]) t[c] = { count: 0, audience: 0, ratingSum: 0 }
      t[c].count += 1
      t[c].audience += s.audience || 0
      t[c].ratingSum += s.rating || 0
    })
    return t
  }, [yearShows])

  // Slot totals
  const bySlot = useMemo(() => {
    const t = {}
    ;(yearShows || []).forEach(s => {
      if (!t[s.slotTypeId]) t[s.slotTypeId] = { count: 0, audience: 0, ratingSum: 0 }
      t[s.slotTypeId].count += 1
      t[s.slotTypeId].audience += s.audience || 0
      t[s.slotTypeId].ratingSum += s.rating || 0
    })
    return t
  }, [yearShows])

  const totalAudience = (yearShows || []).reduce((a, s) => a + (s.audience || 0), 0)
  const totalRevenue  = (yearShows || []).reduce((a, s) => a + (s.revenue || 0), 0)
  const avgRating     = yearShows?.length ? yearShows.reduce((a, s) => a + (s.rating || 0), 0) / yearShows.length : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 18 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: `1px solid ${T.border}`,
        color: T.muted, padding: '8px 14px', borderRadius: 5,
        fontSize: 11, fontWeight: 600, marginBottom: 16, cursor: 'pointer',
      }}>← Back</button>

      <SectionTitle>This Year — Y{year}</SectionTitle>

      {(yearShows?.length || 0) === 0 ? (
        <div style={{
          padding: 30, textAlign: 'center', fontSize: 12, color: T.muted,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
        }}>
          No shows aired this year yet.
        </div>
      ) : (
        <>
          {/* Year totals */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10,
            marginBottom: 18,
          }}>
            <TotalCard label="Total Shows" value={yearShows.length} />
            <TotalCard label="Total Audience" value={`${totalAudience.toFixed(1)}M`} accent={T.teal} />
            <TotalCard label="Total Revenue" value={`$${totalRevenue.toFixed(1)}M`} accent={T.green} />
            <TotalCard label="Avg Rating" value={avgRating.toFixed(2)} accent={T.gold} />
          </div>

          {/* By category */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 8 }}>BY CATEGORY</div>
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 6, overflow: 'hidden',
            }}>
              {Object.entries(byCategory)
                .sort((a, b) => b[1].audience - a[1].audience)
                .map(([catId, stats]) => {
                  const cat = CATEGORIES[catId]
                  return (
                    <div key={catId} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderBottom: `1px solid ${T.border}`,
                    }}>
                      <span style={{ fontSize: 16 }}>{cat?.icon || '📺'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{cat?.label || catId}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>
                          {stats.count} airing{stats.count > 1 ? 's' : ''} · avg rating {(stats.ratingSum / stats.count).toFixed(1)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: T.teal, fontWeight: 700 }}>
                          {stats.audience.toFixed(1)}M
                        </div>
                        <div style={{ fontSize: 9, color: T.muted }}>audience</div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* By slot */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 8 }}>BY SLOT</div>
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 6, overflow: 'hidden',
            }}>
              {Object.entries(bySlot)
                .sort((a, b) => b[1].audience - a[1].audience)
                .map(([slotId, stats]) => {
                  const slot = SLOT_TYPES[slotId]
                  return (
                    <div key={slotId} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderBottom: `1px solid ${T.border}`,
                    }}>
                      <span style={{ fontSize: 16 }}>{slot?.icon || '📅'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{slot?.label || slotId}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>
                          {stats.count} airing{stats.count > 1 ? 's' : ''} · avg rating {(stats.ratingSum / stats.count).toFixed(1)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: T.teal, fontWeight: 700 }}>
                          {stats.audience.toFixed(1)}M
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Month-by-month breakdown */}
          <div>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 8 }}>MONTH BY MONTH</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {byMonth.map((monthData, mIdx) => {
                const shows = Object.values(monthData).flat()
                if (shows.length === 0) return null
                const monthAud = shows.reduce((a, s) => a + (s.audience || 0), 0)
                return (
                  <details key={mIdx} style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 6, padding: '8px 12px',
                  }}>
                    <summary style={{
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>{MONTHS[mIdx]} Y{year}</span>
                      <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: T.teal }}>
                        {shows.length} shows · {monthAud.toFixed(1)}M aud
                      </span>
                    </summary>
                    <div style={{ marginTop: 8 }}>
                      {Object.entries(monthData).map(([slotId, slotShows]) => {
                        const slot = SLOT_TYPES[slotId]
                        return (
                          <div key={slotId} style={{ paddingLeft: 8, marginTop: 6 }}>
                            <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em' }}>
                              {slot?.icon} {slot?.label?.toUpperCase()}
                            </div>
                            {slotShows.map((s, i) => {
                              const cat = CATEGORIES[s.categoryId] || CATEGORIES[s.sportsRunLeagueId ? 'sports' : 'movie']
                              return (
                                <div key={i} style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '4px 6px', fontSize: 11,
                                }}>
                                  <span>{cat?.icon}</span>
                                  <span style={{ flex: 1, color: T.text }}>{s.name}</span>
                                  <span style={{ color: T.green, fontFamily: 'DM Mono' }}>Q{s.quality?.toFixed(1)}</span>
                                  <span style={{ color: T.pink, fontFamily: 'DM Mono' }}>H{s.hype?.toFixed(1)}</span>
                                  <span style={{ color: T.teal, fontFamily: 'DM Mono' }}>{(s.audience || 0).toFixed(2)}M</span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </details>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TotalCard({ label, value, accent }) {
  return (
    <div style={{
      padding: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: T.muted }}>{label}</div>
      <div style={{
        fontFamily: 'DM Mono', fontSize: 18, fontWeight: 600,
        color: accent || T.text, marginTop: 2,
      }}>{value}</div>
    </div>
  )
}
