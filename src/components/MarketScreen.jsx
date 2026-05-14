import { useState, useMemo, useEffect } from 'react'
import { T, FONTS } from '../theme.js'
import { CATEGORIES, MARKETS, SLOT_TYPES, MONTHS } from '../constants.js'
import { fameLabel } from '../engine.js'

// Note: SectionTitle from ./ui.jsx removed in stage AL — replaced by the
// editorial SectionHead pattern.

const TIER_LABEL = {
  big4:     'Major Network',
  regional: 'Regional',
  niche:    'Niche Channel',
}
// Tier-stripe color used for CompetitorCard left edge.
const TIER_COLOR = {
  big4:     T.accent,  // brand amber for the big networks
  regional: T.teal,
  niche:    T.purple,
}

const SUB_TABS = [
  { id: 'networks', label: 'Networks' },
  { id: 'programs', label: 'Programs' },
]

export function MarketScreen({
  station, competitors, year, monthIdx,
  yearShows, allShows, competitorAllShows,
  onBack,
}) {
  const [sub, setSub] = useState('networks')
  const market = MARKETS[station.market]
  const activeTab = SUB_TABS.find(t => t.id === sub)

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
          Market · {market.label} · {activeTab?.label}
        </div>
        <h1 className="editorial" style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 52, lineHeight: 0.95, letterSpacing: '-.025em',
          color: T.text, marginBottom: 12,
        }}>
          The Market
        </h1>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 14, color: T.textDim, lineHeight: 1.55, maxWidth: 540,
        }}>
          Who else is on the air. Where you sit in the rankings. What's drawing the audience.
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 32, marginTop: 16,
        borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto',
      }}>
        {SUB_TABS.map(t => (
          <MarketSubTab key={t.id}
            label={t.label}
            active={sub === t.id}
            onClick={() => setSub(t.id)}
          />
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

function MarketSubTab({ label, active, onClick }) {
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

function Chip({ label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active ? T.accent : 'transparent',
        border: `1px solid ${active ? T.accent : (hover ? T.borderHi : T.border)}`,
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

// ─── NETWORKS TAB ──────────────────────────────────────────────────────
function NetworksTab({ station, competitors, year, yearShows }) {
  const market = MARKETS[station.market]
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
      <SectionHead title={`${market.label} · rivals`} meta={`${allYTD.length} networks`} />
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 13, color: T.textDim, marginBottom: 20, lineHeight: 1.55, maxWidth: 620,
      }}>
        Other broadcasters fighting for the same audience. They run their own programming
        and accumulate fame and cash.
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {allYTD.map((s, i) => (
          <CompetitorCard key={s.name} comp={s} rank={i + 1} year={year} />
        ))}
      </div>
    </>
  )
}

function CompetitorCard({ comp, rank, year }) {
  const isPlayer = comp.isPlayer
  const tierColor = isPlayer ? T.gold : (TIER_COLOR[comp.tier] || T.muted)
  const tierLabel = isPlayer ? 'Your station' : (TIER_LABEL[comp.tier] || 'Competitor')

  return (
    <div style={{
      padding: '16px 20px',
      background: isPlayer
        ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
        : `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${isPlayer ? T.gold + '55' : T.border}`,
      borderLeft: `3px solid ${tierColor}`,
      borderRadius: 5,
    }}>
      {/* Header row — rank + name + tier */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14,
      }}>
        {/* Big Fraunces rank */}
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 96, 'wght' 600",
          fontSize: 32, color: rank <= 3 ? T.gold : T.muted,
          letterSpacing: '-.025em', lineHeight: 1,
          minWidth: 56, textAlign: 'right',
        }}>
          {rank === 1 ? '🏆' : ''}#{rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 96, 'wght' 600",
            fontSize: 22, color: T.text, letterSpacing: '-.015em',
            marginBottom: 4,
            display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
          }}>
            {comp.name}
            {isPlayer && (
              <span className="mono" style={{
                fontSize: 9, color: T.gold, fontWeight: 700,
                padding: '2px 7px', borderRadius: 3,
                background: T.gold + '14', border: `1px solid ${T.gold}66`,
                letterSpacing: '.14em', textTransform: 'uppercase',
              }}>You</span>
            )}
          </div>
          <div className="mono" style={{
            fontSize: 10, color: tierColor, fontWeight: 700,
            letterSpacing: '.16em', textTransform: 'uppercase',
          }}>
            {tierLabel}
          </div>
        </div>
      </div>

      {/* Stat grid — editorial mini-stats. Player has fewer cells (no YTD/LY) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 1, background: T.border,
        borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
        marginBottom: isPlayer ? 0 : 14,
      }}>
        <CompStat label="Fame"
          value={comp.fame.toFixed(1)} color={T.gold}
          sub={fameLabel(comp.fame)} />
        <CompStat label="Cash"
          value={`$${comp.cash.toFixed(0)}M`} color={T.green} />
        {!isPlayer && (
          <>
            <CompStat label="YTD aud"
              value={`${comp.audYTD.toFixed(1)}M`} color={T.teal} />
            <CompStat label="Last year"
              value={`${comp.audLY.toFixed(1)}M`} color={T.text} />
          </>
        )}
      </div>

      {/* Specializes-in + active runs + history (competitors only) */}
      {!isPlayer && (
        <>
          {/* Specializes in */}
          {comp.focusCats?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="mono" style={{
                fontSize: 9.5, color: T.muted,
                letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 6,
              }}>
                Specializes in
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {comp.focusCats.map(c => {
                  const cat = CATEGORIES[c]
                  return (
                    <span key={c} className="mono" style={{
                      fontSize: 10, color: T.text, fontWeight: 600,
                      padding: '3px 9px', borderRadius: 3,
                      background: T.surface, border: `1px solid ${T.border}`,
                      letterSpacing: '.04em',
                    }}>
                      {cat?.icon} {cat?.label || c}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Currently airing — italic-serif list */}
          {comp.activeRuns?.length > 0 && (
            <div style={{ marginBottom: comp.historyByYear && Object.keys(comp.historyByYear).length > 0 ? 12 : 0 }}>
              <div className="mono" style={{
                fontSize: 9.5, color: T.muted,
                letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 6,
              }}>
                Currently airing · {comp.activeRuns.length}
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {comp.activeRuns.slice(0, 5).map((r, i) => {
                  const cat = CATEGORIES[r.categoryId]
                  const slot = SLOT_TYPES[r.slotTypeId]
                  return (
                    <div key={i} style={{
                      fontFamily: FONTS.serif,
                      fontVariationSettings: "'opsz' 14, 'wght' 400",
                      fontSize: 12.5, color: T.text, lineHeight: 1.4,
                    }}>
                      <span>{cat?.icon} {r.name}</span>
                      <span className="mono" style={{
                        color: T.muted, fontSize: 10.5, marginLeft: 8, letterSpacing: '.04em',
                      }}>
                        {slot?.label} · {r.monthsAired}/{r.runMonths} mo
                      </span>
                    </div>
                  )
                })}
                {comp.activeRuns.length > 5 && (
                  <div style={{
                    fontFamily: FONTS.serif,
                    fontVariationSettings: "'opsz' 14, 'wght' 400",
                    fontStyle: 'italic',
                    fontSize: 11.5, color: T.muted,
                  }}>
                    +{comp.activeRuns.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prior years — collapsible <details> */}
          {comp.historyByYear && Object.keys(comp.historyByYear).length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary className="mono" style={{
                fontSize: 9.5, color: T.muted,
                letterSpacing: '.16em', textTransform: 'uppercase',
                cursor: 'pointer', userSelect: 'none', padding: '4px 0',
              }}>
                Prior years · {Object.keys(comp.historyByYear).length}
              </summary>
              <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                {Object.entries(comp.historyByYear).sort((a, b) => b[0] - a[0]).map(([y, stats]) => (
                  <div key={y} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '4px 0', borderTop: `1px solid ${T.border}`,
                  }}>
                    <span style={{
                      fontFamily: FONTS.serif,
                      fontVariationSettings: "'opsz' 24, 'wght' 600",
                      fontSize: 13, color: T.text, letterSpacing: '-.005em',
                    }}>Y{y}</span>
                    <span className="mono" style={{
                      fontSize: 11.5, color: T.muted, letterSpacing: '.04em',
                    }}>
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

function CompStat({ label, value, color, sub }) {
  return (
    <div style={{ background: T.bg, padding: '12px 14px' }}>
      <div className="mono" style={{
        fontSize: 9, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 36, 'wght' 600",
        fontSize: 18, letterSpacing: '-.01em',
        color: color || T.text,
      }}>{value}</div>
      {sub && (
        <div className="mono" style={{
          fontSize: 9, color: T.muted, marginTop: 2, letterSpacing: '.06em',
        }}>{sub}</div>
      )}
    </div>
  )
}

// ─── PROGRAMS TAB ──────────────────────────────────────────────────────
function ProgramsTab({ stationName, yearShows, allPlayerShows, competitorAllShows, year, monthIdx }) {
  const [timeRange, setTimeRange] = useState('thisyear')

  const playerShows = timeRange === 'thisyear' ? yearShows : allPlayerShows
  const compShows = timeRange === 'thisyear'
    ? (competitorAllShows || []).filter(s => s.year === year)
    : (competitorAllShows || [])

  const allConsidered = useMemo(() => {
    const mine = (playerShows || []).map(s => ({
      ...s, _station: stationName, _isPlayer: true,
    }))
    const them = (compShows || []).map(s => ({
      ...s, _station: s.stationName || 'Unknown', _isPlayer: false,
    }))
    return [...mine, ...them]
  }, [playerShows, compShows, stationName])

  const totalAudience = playerShows.reduce((a, s) => a + (s.audience || 0), 0)
  const totalRevenue  = playerShows.reduce((a, s) => a + (s.revenue || 0), 0)
  const avgRating     = playerShows.length ? playerShows.reduce((a, s) => a + (s.rating || 0), 0) / playerShows.length : 0

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
    for (const entry of m.values()) {
      for (const sId of Object.keys(entry.slots)) {
        entry.slots[sId].sort((x, y) => (y.audience || 0) - (x.audience || 0))
      }
    }
    return m
  }, [allConsidered, year])

  const monthsWithShows = useMemo(() => {
    const list = Array.from(byYearMonthSlot.values())
      .filter(b => Object.values(b.slots).some(arr => arr.length > 0))
      .sort((a, b) => (a.year - b.year) || (a.month - b.month))
    return list
  }, [byYearMonthSlot])

  const initialKey = monthsWithShows.length > 0
    ? `${monthsWithShows[monthsWithShows.length - 1].year}-${monthsWithShows[monthsWithShows.length - 1].month}`
    : `${year}-${Math.max(0, monthIdx - 1)}`
  const [selectedKey, setSelectedKey] = useState(initialKey)
  const [slotFilter, setSlotFilter] = useState('all')

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
  const sharePct = monthAudTotal > 0 ? (yourAudInMonth / monthAudTotal) * 100 : 0

  if (allConsidered.length === 0) {
    return (
      <>
        <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
        <div style={{
          background: T.surface, border: `1px dashed ${T.borderHi}`,
          borderRadius: 6, padding: '32px 24px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 500",
            fontStyle: 'italic',
            fontSize: 16, color: T.textDim,
          }}>
            No shows aired in this range yet.
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHead
        title={timeRange === 'thisyear' ? `This year · Y${year}` : 'All time'}
        meta={`${playerShows.length} of yours`}
      />

      {/* Time-range toggle */}
      <TimeRangeToggle value={timeRange} onChange={setTimeRange} />

      {/* Your totals — editorial stat grid */}
      <div className="mono" style={{
        fontSize: 9.5, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        Your totals · {timeRange === 'thisyear' ? 'YTD' : 'all time'}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 1, background: T.border,
        borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
        marginBottom: 28,
      }}>
        <TotalStat label="Shows"      value={playerShows.length} />
        <TotalStat label="Audience"   value={`${totalAudience.toFixed(1)}M`} color={T.teal} />
        <TotalStat label="Revenue"    value={`$${totalRevenue.toFixed(1)}M`} color={T.green} />
        <TotalStat label="Avg rating" value={avgRating.toFixed(2)} color={T.gold} />
      </div>

      {/* Month stepper */}
      <MonthStepper
        label={selectedBucket ? `${MONTHS[selectedBucket.month]} · Y${selectedBucket.year}` : '—'}
        hasPrev={hasPrev} hasNext={hasNext}
        onPrev={goPrev} onNext={goNext}
      />

      {/* Month summary line — italic serif */}
      {monthAirings.length > 0 && (
        <div style={{
          textAlign: 'center', marginBottom: 18,
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 13, color: T.textDim, lineHeight: 1.4,
        }}>
          {monthAirings.length} program{monthAirings.length === 1 ? '' : 's'} aired · your share was{' '}
          <span className="mono" style={{
            fontStyle: 'normal', color: sharePct > 30 ? T.green : sharePct > 15 ? T.gold : T.red,
            fontSize: 12, fontWeight: 700,
          }}>{sharePct.toFixed(0)}%</span>
          {' '}({yourAudInMonth.toFixed(1)}M of {monthAudTotal.toFixed(1)}M).
        </div>
      )}

      {/* Slot filter */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center',
        paddingBottom: 14, borderBottom: `1px solid ${T.border}`,
      }}>
        <span className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase', marginRight: 4,
        }}>Filter</span>
        <Chip label={`All (${monthAirings.length})`}
          active={slotFilter === 'all'}
          onClick={() => setSlotFilter('all')} />
        {slotsInMonth.map(sid => {
          const slot = SLOT_TYPES[sid] || { label: sid, icon: '·' }
          const count = (selectedMonthSlots[sid] || []).length
          return (
            <Chip key={sid}
              label={`${slot.icon} ${slot.label} (${count})`}
              active={slotFilter === sid}
              onClick={() => setSlotFilter(sid)} />
          )
        })}
      </div>

      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.5,
      }}>
        {slotFilter === 'all'
          ? `Top programs ranked by audience.`
          : `Top programs in this slot.`}
      </div>

      {filteredRows.length === 0 ? (
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
            No programs in this filter.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      <Chip label="This year" active={value === 'thisyear'} onClick={() => onChange('thisyear')} />
      <Chip label="All time"  active={value === 'alltime'}  onClick={() => onChange('alltime')} />
    </div>
  )
}

function TotalStat({ label, value, color }) {
  return (
    <div style={{ background: T.bg, padding: '14px 16px' }}>
      <div className="mono" style={{
        fontSize: 9.5, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 36, 'wght' 600",
        fontSize: 22, letterSpacing: '-.015em',
        color: color || T.text,
      }}>{value}</div>
    </div>
  )
}

/** Month stepper — chevron buttons + month display in editorial card.
 *  Shared pattern with Financials. */
function MonthStepper({ label, hasPrev, hasNext, onPrev, onNext }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, marginBottom: 16,
    }}>
      <ChevButton disabled={!hasPrev} onClick={onPrev}>‹</ChevButton>
      <div style={{
        background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
        border: `1px solid ${T.border}`,
        padding: '10px 22px', borderRadius: 4,
        minWidth: 180, textAlign: 'center',
      }}>
        <div className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase',
        }}>
          Reviewing
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 600",
          fontSize: 18, color: T.text, letterSpacing: '-.01em',
          marginTop: 4,
        }}>
          {label}
        </div>
      </div>
      <ChevButton disabled={!hasNext} onClick={onNext}>›</ChevButton>
    </div>
  )
}

function ChevButton({ disabled, onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: disabled
          ? 'transparent'
          : (hover ? T.cardHi : 'transparent'),
        border: `1px solid ${disabled ? T.border : (hover ? T.borderHi : T.border)}`,
        color: disabled ? T.mutedDim : T.text,
        width: 36, height: 44, borderRadius: 4,
        fontFamily: FONTS.serif, fontSize: 20,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s, border-color .15s',
      }}
    >{children}</button>
  )
}

function AiringRow({ airing: a, rank, showSlot }) {
  const isPlayer = a._isPlayer
  const cat = CATEGORIES[a.categoryId]
  const slot = SLOT_TYPES[a.slotTypeId]
  const catColor = cat?.color || T.accent
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
          fontSize: 20, color: rankColor, letterSpacing: '-.02em', lineHeight: 1,
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
          <span>{cat?.icon || '📺'} {a.name}</span>
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
          {a._station}
          {showSlot && slot && (
            <span className="mono" style={{
              fontStyle: 'normal', fontSize: 10.5,
              marginLeft: 8, color: T.textDim, letterSpacing: '.04em',
            }}>
              · {slot.icon} {slot.label}
            </span>
          )}
        </div>
      </div>

      {/* Audience + rating */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 96, 'wght' 600",
          fontSize: 20, color: T.teal, letterSpacing: '-.025em', lineHeight: 1,
        }}>
          {(a.audience || 0).toFixed(2)}M
        </div>
        <div className="mono" style={{
          fontSize: 9, color: T.muted, fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 4,
        }}>
          rating {(a.rating || 0).toFixed(1)}
        </div>
      </div>
    </div>
  )
}
