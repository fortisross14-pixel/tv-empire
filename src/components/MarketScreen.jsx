import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import { CATEGORIES, MARKETS, SLOT_TYPES, SPORTS_LEAGUES, MONTHS } from '../constants.js'
import { SectionTitle } from './ui.jsx'
import { fameLabel, sportsLicenseCost } from '../engine.js'

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
  { id: 'thisyear',     label: 'This Year' },
  { id: 'sports',       label: 'Sports Rights' },
]

export function MarketScreen({
  station, competitors, year, monthIdx,
  yearShows, competitorAllShows, onBuySportsLicense,
  onBack,
}) {
  const [sub, setSub] = useState('networks')

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 14 }}>
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
      {sub === 'thisyear' && (
        <ThisYearTab
          stationName={station.name}
          yearShows={yearShows || []}
          competitorAllShows={competitorAllShows || []}
          year={year}
          monthIdx={monthIdx}
        />
      )}
      {sub === 'sports' && (
        <SportsRightsTab station={station} year={year} onBuy={onBuySportsLicense} />
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
function ThisYearTab({ stationName, yearShows, competitorAllShows, year, monthIdx }) {
  // Combine player shows + competitor shows for THIS year only
  const allThisYear = useMemo(() => {
    const mine = (yearShows || []).map(s => ({
      ...s, _station: stationName, _isPlayer: true,
    }))
    const them = (competitorAllShows || [])
      .filter(s => s.year === year)
      .map(s => ({ ...s, _station: s.stationName || 'Unknown', _isPlayer: false }))
    return [...mine, ...them]
  }, [yearShows, competitorAllShows, year, stationName])

  // Player totals YTD
  const totalAudience = yearShows.reduce((a, s) => a + (s.audience || 0), 0)
  const totalRevenue  = yearShows.reduce((a, s) => a + (s.revenue || 0), 0)
  const avgRating     = yearShows.length ? yearShows.reduce((a, s) => a + (s.rating || 0), 0) / yearShows.length : 0

  // Build month-by-month → slot-by-slot ranking
  // Structure: byMonth[m] = { [slotTypeId]: airings sorted desc by audience }
  const byMonthSlot = useMemo(() => {
    const m = Array(12).fill(null).map(() => ({}))
    for (const a of allThisYear) {
      const mn = a.month ?? 0
      const slot = a.slotTypeId || 'unknown'
      if (!m[mn][slot]) m[mn][slot] = []
      m[mn][slot].push(a)
    }
    // Sort each slot list by audience desc
    for (let i = 0; i < 12; i++) {
      for (const slot of Object.keys(m[i])) {
        m[i][slot].sort((x, y) => (y.audience || 0) - (x.audience || 0))
      }
    }
    return m
  }, [allThisYear])

  const monthsWithShows = useMemo(() => {
    const list = []
    for (let i = 0; i < 12; i++) {
      const slots = byMonthSlot[i]
      const hasAny = Object.values(slots).some(arr => arr.length > 0)
      if (hasAny) list.push(i)
    }
    return list
  }, [byMonthSlot])

  if (yearShows.length === 0 && allThisYear.length === 0) {
    return (
      <div style={{
        padding: 30, textAlign: 'center', fontSize: 12, color: T.muted,
        background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 6,
      }}>
        No shows aired this year yet.
      </div>
    )
  }

  return (
    <>
      <SectionTitle>This Year — Y{year}</SectionTitle>

      {/* Your YTD totals */}
      <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.15em', marginBottom: 8 }}>
        YOUR YEAR-TO-DATE
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8,
        marginBottom: 20,
      }}>
        <TotalCard label="Shows" value={yearShows.length} />
        <TotalCard label="Audience" value={`${totalAudience.toFixed(1)}M`} accent={T.teal} />
        <TotalCard label="Revenue" value={`$${totalRevenue.toFixed(1)}M`} accent={T.green} />
        <TotalCard label="Avg Rating" value={avgRating.toFixed(2)} accent={T.gold} />
      </div>

      {/* Slot battle — month-by-month with rankings */}
      <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.15em', marginBottom: 8 }}>
        SLOT-BY-SLOT vs COMPETITORS
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Every aired slot ranked by audience this year. ● = your station.
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {monthsWithShows.length === 0 ? (
          <div style={{
            padding: 18, textAlign: 'center', fontSize: 12, color: T.muted,
            background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 6,
          }}>
            No competitive data yet. Air programs to start seeing slot battles here.
          </div>
        ) : monthsWithShows.map(mIdx => (
          <MonthBlock
            key={mIdx}
            monthIdx={mIdx}
            byMonthSlot={byMonthSlot}
            year={year}
            openByDefault={mIdx === monthsWithShows[monthsWithShows.length - 1]}
          />
        ))}
      </div>
    </>
  )
}

function MonthBlock({ monthIdx, byMonthSlot, year, openByDefault }) {
  const slots = byMonthSlot[monthIdx]
  const allMonth = Object.values(slots).flat()
  const monthAud = allMonth.reduce((a, s) => a + (s.audience || 0), 0)
  const yours = allMonth.filter(s => s._isPlayer)
  const yourAud = yours.reduce((a, s) => a + (s.audience || 0), 0)
  const slotIds = Object.keys(slots)

  return (
    <details
      open={openByDefault}
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 6, padding: '10px 12px',
      }}>
      <summary style={{
        cursor: 'pointer', listStyle: 'none', userSelect: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {MONTHS[monthIdx]} Y{year}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: T.teal }}>
              {yourAud.toFixed(1)}M / {monthAud.toFixed(1)}M
            </div>
            <div style={{ fontSize: 9, color: T.muted }}>
              your share {monthAud > 0 ? `${((yourAud / monthAud) * 100).toFixed(0)}%` : '0%'}
            </div>
          </div>
        </div>
      </summary>

      <div style={{ marginTop: 12 }}>
        {slotIds.map(slotId => {
          const slot = SLOT_TYPES[slotId]
          const airings = slots[slotId]
          return (
            <div key={slotId} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10, color: T.muted, letterSpacing: '.1em',
                marginBottom: 6, paddingBottom: 4,
                borderBottom: `1px dashed ${T.border}`,
              }}>
                {slot?.icon} {slot?.label?.toUpperCase() || slotId.toUpperCase()}
              </div>
              {airings.map((a, i) => (
                <AiringRow key={`${slotId}-${i}`} airing={a} rank={i + 1} total={airings.length} />
              ))}
            </div>
          )
        })}
      </div>
    </details>
  )
}

function AiringRow({ airing: a, rank, total }) {
  const isPlayer = a._isPlayer
  const cat = CATEGORIES[a.categoryId]
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

// ─── SPORTS RIGHTS TAB ───────────────────────────────────────────────────
function SportsRightsTab({ station, year, onBuy }) {
  const owned = (station.sportsLicenses || []).filter(l => l.year === year)
  const ownedIds = new Set(owned.map(l => l.leagueId))
  const market = station.market

  return (
    <>
      <SectionTitle>Sports Rights — Year {year}</SectionTitle>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Buy a full year of rights, then assign them to a slot in Programming.
        Each league runs only during its real season — and gets a big bump on its peak month.
        Major leagues cost real money: scaled to your market size.
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 8,
      }}>
        {SPORTS_LEAGUES.map(lg => {
          const isOwned = ownedIds.has(lg.id)
          const cost = sportsLicenseCost(lg.id, market)
          const affordable = station.cash >= cost
          return (
            <div key={lg.id} style={{
              background: isOwned ? T.green + '15' : T.card,
              border: `1px solid ${isOwned ? T.green : T.border}`,
              borderRadius: 5, padding: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isOwned ? T.green : T.text }}>
                {lg.icon} {lg.label} {isOwned && '✓'}
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3, lineHeight: 1.4 }}>
                Season: {lg.season.length} mo · Peak: {MONTHS[lg.peakMonth]} ({lg.peakLabel})
              </div>
              {!isOwned ? (
                <button
                  onClick={() => onBuy(lg.id)}
                  disabled={!affordable}
                  style={{
                    width: '100%', marginTop: 7, padding: '6px 8px',
                    background: affordable ? T.accent : T.border,
                    color: affordable ? T.bg : T.muted,
                    border: 'none', borderRadius: 4,
                    fontSize: 11, fontWeight: 700,
                    cursor: affordable ? 'pointer' : 'not-allowed',
                  }}
                >${cost.toFixed(0)}M · BUY</button>
              ) : (
                <div style={{ marginTop: 7, fontSize: 10, color: T.green, fontStyle: 'italic' }}>
                  Owned · Use in slot editor
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
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
