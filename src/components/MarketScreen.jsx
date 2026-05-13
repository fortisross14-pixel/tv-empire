import { useState, useMemo, useEffect } from 'react'
import { T } from '../theme.js'
import { CATEGORIES, MARKETS, SLOT_TYPES, MONTHS } from '../constants.js'
import { SectionTitle } from './ui.jsx'
import { fameLabel } from '../engine.js'

const TIER_LABEL = {
  big4: 'Major Network',
  regional: 'Regional',
  niche: 'Niche Channel',
}
const TIER_COLOR = {
  big4: '#e8a045',
  regional: '#3ecfcf',
  niche: '#a855f7',
}

const SUB_TABS = [
  { id: 'networks',     label: 'Networks' },
  { id: 'programs',     label: 'Programs' },
]

export function MarketScreen({
  station, competitors, year, monthIdx,
  yearShows, allShows, competitorAllShows,
  onBack,
}) {
  const [sub, setSub] = useState('networks')

  return (
    <div className="view-wrap" style={{ maxWidth: 900, margin: '0 auto', padding: 14 }}>
      <div style={{
        display: 'flex', gap: 4, marginBottom: 14,
        borderBottom: `1px solid ${T.border}`, overflowX: 'auto',
      }}>
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            style={{
              background: 'transparent', border: 'none',
              color: sub === t.id ? T.accent : T.muted,
              fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '.1em',
              padding: '8px 14px', cursor: 'pointer',
              borderBottom: `2px solid ${sub === t.id ? T.accent : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
        ))}
      </div>

      {sub === 'networks' && (
        <NetworksTab station={station} competitors={competitors} year={year} yearShows={yearShows || []} />
      )}
      {sub === 'programs' && (
        <ProgramsTab
          stationName={station.name}
          yearShows={yearShows || []}
          allPlayerShows={allShows || []}
          competitorAllShows={competitorAllShows || []}
          year={year}
          monthIdx={monthIdx}
        />
      )}
    </div>
  )
}

// ─── NETWORKS TAB (was the whole screen) ─────────────────────────────────
function NetworksTab({ station, competitors, year, yearShows }) {
  const market = MARKETS[station.market]
  // Player YTD = sum of all this year's airings audience. Previously hardcoded
  // to 0, which is why the "YTD Aud" cell showed 0 in months 2+.
  const playerAudYTD = (yearShows || []).reduce((a, s) => a + (s.audience || 0), 0)
  const allYTD = [
    { name: station.name, fame: station.fame, cash: station.cash, audYTD: playerAudYTD, audLY: 0, isPlayer: true },
    ...(competitors || []).map(c => ({
      name: c.name, fame: c.fame, cash: c.cash,
      audYTD: c.yearAudienceTotal || 0,
      audLY: c.yearAudienceLastYear || 0,
      tier: c.tier,
      focusCats: c.focusCats,
      activeRuns: c.activeRuns,
      slotTypeIds: c.slotTypeIds,
      historyByYear: c.historyByYear,
      isPlayer: false,
    })),
  ]
  allYTD.sort((a, b) => b.fame - a.fame)

  return (
    <>
      <SectionTitle>{market.label} — Market Rivals</SectionTitle>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Other broadcasters fighting for the same audience. They run their own programming,
        accumulate fame and cash.
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {allYTD.map((s, i) => (
          <CompetitorCard key={s.name} comp={s} rank={i + 1} year={year} />
        ))}
      </div>
    </>
  )
}

function CompetitorCard({ comp, rank, year }) {
  const tierColor = comp.isPlayer ? T.gold : (TIER_COLOR[comp.tier] || T.muted)
  const tierLabel = comp.isPlayer ? 'YOUR STATION' : (TIER_LABEL[comp.tier] || 'Competitor')

  return (
    <div style={{
      background: comp.isPlayer ? T.gold + '0a' : T.surface,
      border: `1px solid ${comp.isPlayer ? T.gold : T.border}`,
      borderLeft: `4px solid ${tierColor}`,
      borderRadius: 6,
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700,
          color: rank <= 3 ? T.gold : T.muted,
          minWidth: 26,
        }}>#{rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
            {comp.name}
            {comp.isPlayer && <span style={{ fontSize: 9, marginLeft: 6, color: T.gold, fontWeight: 700 }}>● YOU</span>}
          </div>
          <div style={{ fontSize: 9, color: tierColor, letterSpacing: '.1em', marginTop: 2, fontWeight: 600 }}>
            {tierLabel}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8,
        marginBottom: comp.isPlayer ? 0 : 10,
      }}>
        <Cell label="Fame" value={comp.fame.toFixed(1)} sub={fameLabel(comp.fame)} accent={T.gold} />
        <Cell label="Cash" value={`$${comp.cash.toFixed(0)}M`} accent={T.green} />
        {!comp.isPlayer && (
          <>
            <Cell label="YTD Aud" value={`${comp.audYTD.toFixed(1)}M`} accent={T.teal} />
            <Cell label="Last Yr" value={`${comp.audLY.toFixed(1)}M`} accent={T.muted} />
          </>
        )}
      </div>

      {!comp.isPlayer && (
        <>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.1em', marginBottom: 4 }}>SPECIALIZES IN</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(comp.focusCats || []).map(c => {
                const cat = CATEGORIES[c]
                return (
                  <span key={c} style={{
                    fontSize: 10, padding: '3px 8px',
                    background: T.cardHi, borderRadius: 10, color: T.text,
                  }}>
                    {cat?.icon} {cat?.label || c}
                  </span>
                )
              })}
            </div>
          </div>

          {comp.activeRuns?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.1em', marginBottom: 4 }}>
                CURRENTLY AIRING ({comp.activeRuns.length})
              </div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
                {comp.activeRuns.slice(0, 5).map((r, i) => {
                  const cat = CATEGORIES[r.categoryId]
                  const slot = SLOT_TYPES[r.slotTypeId]
                  return (
                    <div key={i} style={{ padding: '2px 0' }}>
                      <span style={{ color: T.text }}>{cat?.icon} {r.name}</span>
                      <span style={{ color: T.muted }}> · {slot?.label} · {r.monthsAired}/{r.runMonths} mo</span>
                    </div>
                  )
                })}
                {comp.activeRuns.length > 5 && (
                  <div style={{ fontStyle: 'italic', color: T.muted }}>... +{comp.activeRuns.length - 5} more</div>
                )}
              </div>
            </div>
          )}

          {comp.historyByYear && Object.keys(comp.historyByYear).length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{
                fontSize: 10, color: T.muted, letterSpacing: '.1em',
                cursor: 'pointer', userSelect: 'none',
              }}>PRIOR YEARS ({Object.keys(comp.historyByYear).length})</summary>
              <div style={{ marginTop: 6 }}>
                {Object.entries(comp.historyByYear).sort((a, b) => b[0] - a[0]).map(([y, stats]) => (
                  <div key={y} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, padding: '3px 0', color: T.muted,
                  }}>
                    <span>Year {y}</span>
                    <span style={{ fontFamily: 'JetBrains Mono' }}>
                      {stats.audienceTotal.toFixed(1)}M aud · fame {stats.fame.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  )
}

// ─── THIS YEAR TAB (folded from ThisYearScreen + competitor data) ─────────
function ProgramsTab({ stationName, yearShows, allPlayerShows, competitorAllShows, year, monthIdx }) {
  // Time range: 'thisyear' or 'alltime'
  const [timeRange, setTimeRange] = useState('thisyear')

  // Pick which player shows + competitor shows to consider based on range.
  // For 'thisyear': just this calendar year. For 'alltime': everything from
  // game start through now.
  const playerShows = timeRange === 'thisyear' ? yearShows : allPlayerShows
  const compShows = timeRange === 'thisyear'
    ? (competitorAllShows || []).filter(s => s.year === year)
    : (competitorAllShows || [])

  // Combine — annotate with player/competitor flag
  const allConsidered = useMemo(() => {
    const mine = (playerShows || []).map(s => ({
      ...s, _station: stationName, _isPlayer: true,
    }))
    const them = (compShows || []).map(s => ({
      ...s, _station: s.stationName || 'Unknown', _isPlayer: false,
    }))
    return [...mine, ...them]
  }, [playerShows, compShows, stationName])

  // Player totals across the chosen range
  const totalAudience = playerShows.reduce((a, s) => a + (s.audience || 0), 0)
  const totalRevenue  = playerShows.reduce((a, s) => a + (s.revenue || 0), 0)
  const avgRating     = playerShows.length ? playerShows.reduce((a, s) => a + (s.rating || 0), 0) / playerShows.length : 0

  // Build (year, month) → slot → airings buckets
  const byYearMonthSlot = useMemo(() => {
    const m = new Map()
    for (const a of allConsidered) {
      const y = a.year ?? year
      const mn = a.month ?? 0
      const slot = a.slotTypeId || 'unknown'
      const key = `${y}-${mn}`
      if (!m.has(key)) m.set(key, { year: y, month: mn, slots: {} })
      const entry = m.get(key)
      if (!entry.slots[slot]) entry.slots[slot] = []
      entry.slots[slot].push(a)
    }
    // Sort each bucket
    for (const entry of m.values()) {
      for (const sId of Object.keys(entry.slots)) {
        entry.slots[sId].sort((x, y) => (y.audience || 0) - (x.audience || 0))
      }
    }
    return m
  }, [allConsidered, year])

  // Months-with-data, sorted chronologically
  const monthsWithShows = useMemo(() => {
    const list = Array.from(byYearMonthSlot.values())
      .filter(b => Object.values(b.slots).some(arr => arr.length > 0))
      .sort((a, b) => (a.year - b.year) || (a.month - b.month))
    return list
  }, [byYearMonthSlot])

  // Default to latest available
  const initialKey = monthsWithShows.length > 0
    ? `${monthsWithShows[monthsWithShows.length - 1].year}-${monthsWithShows[monthsWithShows.length - 1].month}`
    : `${year}-${Math.max(0, monthIdx - 1)}`
  const [selectedKey, setSelectedKey] = useState(initialKey)
  const [slotFilter, setSlotFilter] = useState('all')

  // Keep selectedKey valid as data changes / range toggles
  useEffect(() => {
    if (monthsWithShows.length === 0) return
    const valid = monthsWithShows.some(b => `${b.year}-${b.month}` === selectedKey)
    if (!valid) {
      const latest = monthsWithShows[monthsWithShows.length - 1]
      setSelectedKey(`${latest.year}-${latest.month}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsWithShows.length, timeRange])

  const currentIdx = monthsWithShows.findIndex(b => `${b.year}-${b.month}` === selectedKey)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx >= 0 && currentIdx < monthsWithShows.length - 1
  const goPrev = () => { if (hasPrev) {
    const b = monthsWithShows[currentIdx - 1]
    setSelectedKey(`${b.year}-${b.month}`)
  } }
  const goNext = () => { if (hasNext) {
    const b = monthsWithShows[currentIdx + 1]
    setSelectedKey(`${b.year}-${b.month}`)
  } }

  const selectedBucket = monthsWithShows[currentIdx] || null
  const selectedMonthSlots = selectedBucket?.slots || {}
  const slotsInMonth = Object.keys(selectedMonthSlots)

  const filteredRows = useMemo(() => {
    if (slotFilter === 'all') {
      const all = Object.values(selectedMonthSlots).flat()
      return all.slice().sort((x, y) => (y.audience || 0) - (x.audience || 0))
    }
    return (selectedMonthSlots[slotFilter] || []).slice()
  }, [selectedMonthSlots, slotFilter])

  const monthAirings = Object.values(selectedMonthSlots).flat()
  const monthAudTotal  = monthAirings.reduce((a, s) => a + (s.audience || 0), 0)
  const yourAudInMonth = monthAirings.filter(s => s._isPlayer).reduce((a, s) => a + (s.audience || 0), 0)

  if (allConsidered.length === 0) {
    return (
      <>
        <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
        <div style={{
          padding: 30, textAlign: 'center', fontSize: 12, color: T.muted,
          background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 6,
        }}>
          No shows aired in this range yet.
        </div>
      </>
    )
  }

  return (
    <>
      <SectionTitle>{timeRange === 'thisyear' ? `This Year — Y${year}` : 'All Time'}</SectionTitle>

      {/* Time-range toggle */}
      <TimeRangeToggle value={timeRange} onChange={setTimeRange} />

      {/* Totals for the current range */}
      <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.15em', marginBottom: 8 }}>
        YOUR TOTALS · {timeRange === 'thisyear' ? 'YEAR-TO-DATE' : 'ALL TIME'}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8,
        marginBottom: 20,
      }}>
        <TotalCard label="Shows" value={playerShows.length} />
        <TotalCard label="Audience" value={`${totalAudience.toFixed(1)}M`} accent={T.teal} />
        <TotalCard label="Revenue" value={`$${totalRevenue.toFixed(1)}M`} accent={T.green} />
        <TotalCard label="Avg Rating" value={avgRating.toFixed(2)} accent={T.gold} />
      </div>

      {/* Month picker */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, justifyContent: 'center',
      }}>
        <ChevBtn disabled={!hasPrev} onClick={goPrev}>‹</ChevBtn>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          padding: '7px 18px', borderRadius: 4, minWidth: 150, textAlign: 'center',
        }}>
          <div className="mono" style={{ fontSize: 9.5, color: T.muted, letterSpacing: '.1em' }}>
            REVIEWING
          </div>
          <div className="display" style={{
            fontSize: 16, color: T.text, letterSpacing: '.04em', marginTop: 2,
          }}>
            {selectedBucket ? `${MONTHS[selectedBucket.month]} · Y${selectedBucket.year}` : '—'}
          </div>
        </div>
        <ChevBtn disabled={!hasNext} onClick={goNext}>›</ChevBtn>
      </div>

      {monthAirings.length > 0 && (
        <div style={{
          textAlign: 'center', fontSize: 11, color: T.muted, marginBottom: 14,
        }}>
          {monthAirings.length} program{monthAirings.length === 1 ? '' : 's'} aired ·
          <span style={{ color: T.teal, marginLeft: 4 }}>
            {yourAudInMonth.toFixed(1)}M / {monthAudTotal.toFixed(1)}M
          </span>
          <span style={{ marginLeft: 4 }}>
            (your share {monthAudTotal > 0 ? `${((yourAudInMonth / monthAudTotal) * 100).toFixed(0)}%` : '0%'})
          </span>
        </div>
      )}

      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center',
      }}>
        <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em', marginRight: 4 }}>
          FILTER:
        </div>
        <FilterChip
          label={`All (${monthAirings.length})`}
          active={slotFilter === 'all'}
          onClick={() => setSlotFilter('all')}
        />
        {slotsInMonth.map(sid => {
          const slot = SLOT_TYPES[sid] || { label: sid, icon: '·' }
          const count = (selectedMonthSlots[sid] || []).length
          return (
            <FilterChip
              key={sid}
              label={`${slot.icon} ${slot.label} (${count})`}
              active={slotFilter === sid}
              onClick={() => setSlotFilter(sid)}
            />
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
        {slotFilter === 'all'
          ? `Top programs ranked by audience. ● = your station.`
          : `Top programs in this slot. ● = your station.`}
      </div>

      {filteredRows.length === 0 ? (
        <div style={{
          padding: 18, textAlign: 'center', fontSize: 12, color: T.muted,
          background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 6,
        }}>
          No programs in this filter.
        </div>
      ) : (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 6, padding: 10,
        }}>
          {filteredRows.map((a, i) => (
            <AiringRow key={`${a.id || i}`} airing={a} rank={i + 1} total={filteredRows.length} showSlot={slotFilter === 'all'} />
          ))}
        </div>
      )}
    </>
  )
}

function TimeRangeToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 18, justifyContent: 'center',
    }}>
      <RangeBtn label="This Year" active={value === 'thisyear'} onClick={() => onChange('thisyear')} />
      <RangeBtn label="All Time"  active={value === 'alltime'}  onClick={() => onChange('alltime')} />
    </div>
  )
}

function RangeBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? T.accent + '22' : 'transparent',
      border: `1px solid ${active ? T.accent : T.border}`,
      color: active ? T.accent : T.muted,
      borderRadius: 4, padding: '7px 18px', fontSize: 12,
      fontFamily: 'Anton, sans-serif', letterSpacing: '.08em',
      cursor: 'pointer', textTransform: 'uppercase', fontWeight: 600,
    }}>{label}</button>
  )
}

function ChevBtn({ disabled, onClick, children }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: `1px solid ${disabled ? T.border : T.borderHi}`,
        color: disabled ? T.muted : T.text,
        width: 30, height: 30, borderRadius: 4,
        fontFamily: 'Anton, sans-serif', fontSize: 18,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{children}</button>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? T.accent + '33' : 'transparent',
      border: `1px solid ${active ? T.accent : T.border}`,
      color: active ? T.accent : T.muted,
      borderRadius: 12, padding: '4px 11px', fontSize: 11,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function AiringRow({ airing: a, rank, total, showSlot }) {
  const isPlayer = a._isPlayer
  const cat = CATEGORIES[a.categoryId]
  const slot = SLOT_TYPES[a.slotTypeId]
  const rankColor = rank === 1 ? T.gold : rank === 2 ? '#bbb' : rank === 3 ? '#c98a4b' : T.muted

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px', margin: '2px 0',
      background: isPlayer ? T.gold + '12' : 'transparent',
      borderRadius: 4,
      borderLeft: isPlayer ? `3px solid ${T.gold}` : '3px solid transparent',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
        color: rankColor, minWidth: 24, textAlign: 'right',
      }}>#{rank}</div>
      <div style={{ fontSize: 13 }}>{cat?.icon || '📺'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: isPlayer ? 700 : 500,
          color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {a.name}
          {isPlayer && <span style={{ fontSize: 9, marginLeft: 6, color: T.gold, fontWeight: 700 }}>● YOU</span>}
        </div>
        <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>
          {a._station}
          {showSlot && slot && (
            <span style={{ marginLeft: 6, color: T.textDim }}>
              · {slot.icon} {slot.label}
            </span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: T.teal, fontWeight: 700 }}>
          {(a.audience || 0).toFixed(2)}M
        </div>
        <div style={{ fontSize: 9, color: T.muted }}>
          rating {(a.rating || 0).toFixed(1)}
        </div>
      </div>
    </div>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
function Cell({ label, value, sub, accent }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.08em' }}>{label}</div>
      <div style={{
        fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600,
        color: accent || T.text, marginTop: 2,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

function TotalCard({ label, value, accent }) {
  return (
    <div style={{
      padding: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5,
    }}>
      <div style={{ fontSize: 9, letterSpacing: '.1em', color: T.muted }}>{label}</div>
      <div style={{
        fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 600,
        color: accent || T.text, marginTop: 2,
      }}>{value}</div>
    </div>
  )
}
