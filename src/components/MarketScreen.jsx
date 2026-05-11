import { T } from '../theme.js'
import { CATEGORIES, MARKETS, SLOT_TYPES } from '../constants.js'
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

export function MarketScreen({ station, competitors, year, onBack }) {
  const market = MARKETS[station.market]
  // Compute audience share for the prior cycle (use yearAudienceLastYear if available, else current YTD)
  const allYTD = [
    { name: station.name, fame: station.fame, cash: station.cash, audYTD: 0, audLY: 0, isPlayer: true },
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
  // Sort by fame
  allYTD.sort((a, b) => b.fame - a.fame)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 18 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: `1px solid ${T.border}`,
        color: T.muted, padding: '8px 14px', borderRadius: 5,
        fontSize: 11, fontWeight: 600, marginBottom: 16, cursor: 'pointer',
      }}>← Back</button>

      <SectionTitle>{market.label} — Market Rivals</SectionTitle>

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Other broadcasters fighting for the same audience. They run their own programming,
        accumulate fame and cash. Their last-year audience totals and current run state shown below.
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {allYTD.map((s, i) => (
          <CompetitorCard key={s.name} comp={s} rank={i + 1} year={year} />
        ))}
      </div>
    </div>
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
      padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{
          fontFamily: 'DM Mono', fontSize: 14, fontWeight: 700,
          color: rank <= 3 ? T.gold : T.muted,
          minWidth: 28,
        }}>#{rank}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
            {comp.name}
            {comp.isPlayer && <span style={{ fontSize: 10, marginLeft: 8, color: T.gold, fontWeight: 700 }}>● YOU</span>}
          </div>
          <div style={{ fontSize: 10, color: tierColor, letterSpacing: '.1em', marginTop: 2, fontWeight: 600 }}>
            {tierLabel}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8,
        marginBottom: comp.isPlayer ? 0 : 10,
      }}>
        <Cell label="Fame" value={comp.fame.toFixed(1)} sub={fameLabel(comp.fame)} accent={T.gold} />
        <Cell label="Cash" value={`$${comp.cash.toFixed(0)}M`} accent={T.green} />
        {!comp.isPlayer && (
          <>
            <Cell label="YTD Audience" value={`${comp.audYTD.toFixed(1)}M`} accent={T.teal} />
            <Cell label="Last Year" value={`${comp.audLY.toFixed(1)}M`} accent={T.muted} />
          </>
        )}
      </div>

      {!comp.isPlayer && (
        <>
          {/* Focus categories */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1.3, marginBottom: 4 }}>SPECIALIZES IN</div>
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

          {/* Active programming */}
          {comp.activeRuns?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1.3, marginBottom: 4 }}>
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

          {/* Prior years history */}
          {comp.historyByYear && Object.keys(comp.historyByYear).length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{
                fontSize: 10, color: T.muted, letterSpacing: 1.3,
                cursor: 'pointer', userSelect: 'none',
              }}>PRIOR YEARS HISTORY ({Object.keys(comp.historyByYear).length})</summary>
              <div style={{ marginTop: 6 }}>
                {Object.entries(comp.historyByYear).sort((a, b) => b[0] - a[0]).map(([y, stats]) => (
                  <div key={y} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, padding: '3px 0', color: T.muted,
                  }}>
                    <span>Year {y}</span>
                    <span style={{ fontFamily: 'DM Mono' }}>
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

function Cell({ label, value, sub, accent }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1.3 }}>{label}</div>
      <div style={{
        fontFamily: 'DM Mono', fontSize: 14, fontWeight: 600,
        color: accent || T.text, marginTop: 2,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}
