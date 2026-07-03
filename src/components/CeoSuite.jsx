import { R } from '../theme.js'
import { MARKETS, MARKET_ORDER, MONTHS } from '../constants.js'
import { canPromote, fmtM } from '../engine.js'

/**
 * CeoSuite — the strategic overview room.
 *
 * Consolidates high-level information that used to live spread across
 * Financials / Awards / (implicit) Expansion:
 *   - Financial snapshot (cash, monthly burn, next-month cost, runway)
 *   - Market position (current market, fame, promotion offer)
 *   - Awards trophy case (total wins, recent highlights)
 *   - Strategic alerts (cash blocker, no scripts, no producing, etc.)
 *
 * This is a SUMMARY room. Deeper drill-downs still live in their own
 * screens (Financials for full P&L, History for full awards catalog).
 * Buttons on each panel link into the detailed views.
 */
export function CeoSuite({
  game,
  nextMonthCost,
  cashBlocker,
  onGoTo,          // (view) => void
  onPromote,       // engine call for market promotion
  onBack,
}) {
  const station = game?.station
  if (!station) return null

  const cash = station.cash || 0
  const fame = station.fame || 0

  const marketIdx = MARKET_ORDER.indexOf(station.market)
  const currentMarket = MARKETS[station.market]
  const nextMarket = marketIdx < MARKET_ORDER.length - 1 ? MARKETS[MARKET_ORDER[marketIdx + 1]] : null
  const canExpand = canPromote(station)

  // Estimated runway in months
  const runway = nextMonthCost > 0 ? Math.floor(cash / nextMonthCost) : Infinity

  // Awards
  const awardsByYear = game.awardsByYear || {}
  const allYears = Object.keys(awardsByYear).map(Number).sort((a, b) => b - a)
  const totalWins = allYears.reduce((sum, y) => {
    const a = awardsByYear[y]
    const playerWins = (a?.playerAwardsWon || []).length
    return sum + playerWins
  }, 0)
  const lastYearWins = allYears.length > 0 ? (awardsByYear[allYears[0]].playerAwardsWon || []) : []

  // Alerts
  const alerts = deriveAlerts({ game, station, cashBlocker, nextMonthCost })

  return (
    <div style={{
      maxWidth: 1400, margin: '0 auto',
      padding: '20px 20px 40px',
    }}>
      {/* ─── HERO ─── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 20, gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: `linear-gradient(145deg, ${R.gold}33, ${R.gold}11)`,
            border: `2px solid ${R.gold}88`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${R.gold}44`,
          }}>
            <i className="fa-solid fa-user-tie" style={{ color: R.gold, fontSize: 28 }} />
          </div>
          <div>
            <div style={{
              fontSize: 10, color: R.gold, letterSpacing: 3,
              fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
            }}>
              Executive Wing
            </div>
            <div className="section-title" style={{
              fontSize: 30, color: '#fff', letterSpacing: 2, lineHeight: 1,
            }}>
              CEO Suite
            </div>
          </div>
        </div>

        <div style={{
          padding: '10px 16px', borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{
            fontSize: 9, color: R.textDim, letterSpacing: 2,
            fontFamily: 'monospace', textTransform: 'uppercase',
          }}>Reporting Period</div>
          <div style={{
            fontSize: 14, color: '#fff', fontWeight: 700,
            fontFamily: 'Oswald, Impact, system-ui',
            letterSpacing: 1,
          }}>
            {MONTHS[game.monthIdx]} · Y{game.year}
          </div>
        </div>
      </div>

      {/* ─── ALERTS (if any) ─── */}
      {alerts.length > 0 && (
        <div style={{
          marginBottom: 20,
          padding: '14px 18px',
          background: 'rgba(196, 30, 58, 0.08)',
          border: `1px solid ${R.red}55`,
          borderLeft: `4px solid ${R.red}`,
          borderRadius: 10,
        }}>
          <div style={{
            fontSize: 10, color: R.red, letterSpacing: 2.5,
            fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className="fa-solid fa-triangle-exclamation" />
            <span>Strategic Alerts · {alerts.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                fontSize: 13, color: R.text, lineHeight: 1.5,
              }}>
                <span style={{ color: R.red, marginTop: 2 }}>●</span>
                <span style={{ flex: 1 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── GRID: 3 columns ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20, marginBottom: 20,
      }} className="ceo-layout">
        {/* Financial snapshot */}
        <FinancialsCard
          cash={cash}
          nextMonthCost={nextMonthCost}
          runway={runway}
          cashBlocker={cashBlocker}
          onOpenDetail={() => onGoTo('financials')}
        />

        {/* Market position */}
        <MarketCard
          station={station}
          currentMarket={currentMarket}
          nextMarket={nextMarket}
          canExpand={canExpand}
          fame={fame}
          onPromote={onPromote}
          onOpenMarket={() => onGoTo('market')}
        />

        {/* Awards */}
        <AwardsCard
          totalWins={totalWins}
          lastYearWins={lastYearWins}
          lastYear={allYears[0]}
          onOpenHistory={() => onGoTo('history')}
        />
      </div>

      {/* ─── OPERATIONS SUMMARY ─── */}
      <OpsSummary
        station={station}
        onGoTo={onGoTo}
      />

      {/* ─── BACK ─── */}
      <div style={{
        marginTop: 24, padding: '14px 18px',
        background: 'rgba(15, 23, 42, 0.5)',
        border: `1px solid ${R.border}44`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ fontSize: 11, color: R.textDim }}>
          <i className="fa-solid fa-info-circle" style={{ marginRight: 6, color: R.gold }} />
          High-level briefing. For detailed breakdowns, jump into a specific room.
        </div>
        <button onClick={onBack} className="retro-button-secondary" style={{ fontSize: 11 }}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
          Back to Floor Plan
        </button>
      </div>
    </div>
  )
}

// ─── FINANCIAL SNAPSHOT ────────────────────────────────────────────────
function FinancialsCard({ cash, nextMonthCost, runway, cashBlocker, onOpenDetail }) {
  const runwayLabel = runway === Infinity ? '∞'
                    : runway > 24 ? '24+ mo'
                    : `${runway} mo`
  const runwayColor = runway === Infinity || runway > 12 ? R.cash
                    : runway > 6 ? R.gold
                    : R.red

  return (
    <div className="retro-panel" style={{ padding: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div className="section-title" style={{
          fontSize: 14, color: '#fff', letterSpacing: 1.5,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="fa-solid fa-wallet" style={{ color: R.cash }} />
          <span>Fiscal Position</span>
        </div>
      </div>

      {/* Big cash figure */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, color: R.textDim, letterSpacing: 2,
          fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
        }}>Cash on Hand</div>
        <div className="retro-led" style={{
          fontSize: 36, color: R.cash, lineHeight: 1,
        }}>
          {fmtM(cash)}
        </div>
      </div>

      {/* Metric rows */}
      <MetricRow
        label="Next month cost"
        value={fmtM(nextMonthCost)}
        color={cashBlocker ? R.red : R.text}
      />
      <MetricRow
        label="Runway"
        value={runwayLabel}
        color={runwayColor}
      />

      {cashBlocker && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: `${R.red}18`,
          border: `1px solid ${R.red}55`,
          borderRadius: 6,
          fontSize: 11, color: R.red,
          fontFamily: 'monospace', letterSpacing: 0.5,
        }}>
          <i className="fa-solid fa-warning" style={{ marginRight: 5 }} />
          INSUFFICIENT FUNDS — CUT COSTS OR SECURE REVENUE
        </div>
      )}

      <button
        onClick={onOpenDetail}
        style={{
          marginTop: 14, width: '100%',
          background: 'transparent',
          border: `1px solid ${R.cash}55`,
          color: R.cash,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 11, letterSpacing: 1.5,
          fontFamily: 'Oswald, Impact, system-ui',
          fontWeight: 700, textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${R.cash}18`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <i className="fa-solid fa-arrow-right" style={{ marginRight: 6 }} />
        Full Financials
      </button>
    </div>
  )
}

// ─── MARKET POSITION ───────────────────────────────────────────────────
function MarketCard({ station, currentMarket, nextMarket, canExpand, fame, onPromote, onOpenMarket }) {
  return (
    <div className="retro-panel" style={{ padding: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div className="section-title" style={{
          fontSize: 14, color: '#fff', letterSpacing: 1.5,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="fa-solid fa-signal" style={{ color: R.viewers }} />
          <span>Market Position</span>
        </div>
      </div>

      {/* Current market */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontSize: 9, color: R.textDim, letterSpacing: 2,
          fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
        }}>Current Market</div>
        <div style={{
          fontSize: 22, color: '#fff', fontWeight: 700,
          fontFamily: 'Oswald, Impact, system-ui',
          letterSpacing: 0.5, lineHeight: 1,
        }}>
          {currentMarket?.label || station.market}
        </div>
        <div style={{
          fontSize: 11, color: R.textDim, fontFamily: 'monospace', marginTop: 4,
        }}>
          Fame: <span style={{ color: R.rank, fontWeight: 700 }}>{fame.toFixed(1)}</span>
        </div>
      </div>

      {/* Promotion offer */}
      {nextMarket && (
        <div style={{
          padding: '12px 14px',
          background: canExpand
            ? `linear-gradient(145deg, ${R.gold}18, ${R.gold}08)`
            : 'rgba(15, 23, 42, 0.6)',
          border: `1px solid ${canExpand ? R.gold + '88' : R.border + '44'}`,
          borderRadius: 8,
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 9,
            color: canExpand ? R.gold : R.textDim,
            letterSpacing: 2,
            fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 6,
          }}>
            {canExpand ? '★ Expansion Available' : 'Next Market'}
          </div>
          <div style={{
            fontSize: 15, color: canExpand ? R.gold : R.text, fontWeight: 700,
            fontFamily: 'Oswald, Impact, system-ui', letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            {nextMarket.label}
          </div>
          <div style={{ fontSize: 11, color: R.textDim, lineHeight: 1.4 }}>
            {canExpand
              ? `Ready to promote for ${fmtM(nextMarket.promoteCost)}.`
              : `Requires ${nextMarket.promoteFame || '?'} fame · ${fmtM(nextMarket.promoteCost)}`}
          </div>
          {canExpand && onPromote && (
            <button
              onClick={onPromote}
              style={{
                marginTop: 10, width: '100%',
                background: `linear-gradient(to bottom, ${R.gold}, ${R.goldDim})`,
                color: R.bg,
                border: `1px solid ${R.gold}`,
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 11, letterSpacing: 1.5,
                fontFamily: 'Oswald, Impact, system-ui',
                fontWeight: 700, textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-star" style={{ marginRight: 6 }} />
              Promote Now
            </button>
          )}
        </div>
      )}

      <button
        onClick={onOpenMarket}
        style={{
          width: '100%',
          background: 'transparent',
          border: `1px solid ${R.viewers}55`,
          color: R.viewers,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 11, letterSpacing: 1.5,
          fontFamily: 'Oswald, Impact, system-ui',
          fontWeight: 700, textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${R.viewers}18`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <i className="fa-solid fa-arrow-right" style={{ marginRight: 6 }} />
        Rival Analysis
      </button>
    </div>
  )
}

// ─── AWARDS ────────────────────────────────────────────────────────────
function AwardsCard({ totalWins, lastYearWins, lastYear, onOpenHistory }) {
  return (
    <div className="retro-panel" style={{ padding: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div className="section-title" style={{
          fontSize: 14, color: '#fff', letterSpacing: 1.5,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="fa-solid fa-trophy" style={{ color: R.rank }} />
          <span>Trophy Case</span>
        </div>
      </div>

      {/* Total wins */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={{
          fontSize: 9, color: R.textDim, letterSpacing: 2,
          fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
        }}>Lifetime Wins</div>
        <div className="retro-led" style={{
          fontSize: 44, color: R.rank, lineHeight: 1,
        }}>
          {totalWins}
        </div>
      </div>

      {/* Last year highlights */}
      {lastYearWins.length > 0 ? (
        <div>
          <div style={{
            fontSize: 9, color: R.textDim, letterSpacing: 2,
            fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Last Ceremony · Y{lastYear}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {lastYearWins.slice(0, 4).map((w, i) => (
              <div key={i} style={{
                padding: '6px 10px',
                background: 'rgba(251, 191, 36, 0.08)',
                border: `1px solid ${R.rank}33`,
                borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <i className="fa-solid fa-star" style={{ color: R.rank, fontSize: 10 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 11, color: '#fff', fontWeight: 700,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {w.programName || w.categoryLabel || 'Award'}
                  </div>
                  {w.categoryLabel && w.programName && (
                    <div style={{ fontSize: 9, color: R.textDim }}>
                      {w.categoryLabel}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {lastYearWins.length > 4 && (
              <div style={{ fontSize: 10, color: R.textDim, textAlign: 'center', marginTop: 4 }}>
                + {lastYearWins.length - 4} more
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px 12px', textAlign: 'center',
          color: R.textDim, fontSize: 11, fontStyle: 'italic',
        }}>
          {totalWins > 0 ? 'No wins last ceremony.' : 'No awards yet — keep producing.'}
        </div>
      )}

      <button
        onClick={onOpenHistory}
        style={{
          marginTop: 14, width: '100%',
          background: 'transparent',
          border: `1px solid ${R.rank}55`,
          color: R.rank,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 11, letterSpacing: 1.5,
          fontFamily: 'Oswald, Impact, system-ui',
          fontWeight: 700, textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${R.rank}18`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <i className="fa-solid fa-arrow-right" style={{ marginRight: 6 }} />
        History Archive
      </button>
    </div>
  )
}

// ─── OPS SUMMARY (below the 3 cards) ───────────────────────────────────
function OpsSummary({ station, onGoTo }) {
  const programs = station.programs || []
  const scripts = station.scripts || []
  const rows = [
    { label: 'Airing', value: programs.filter(p => p.status === 'airing').length, color: R.red, iconClass: 'fa-solid fa-signal', view: 'schedule' },
    { label: 'In Production', value: programs.filter(p => p.status === 'producing').length, color: R.rank, iconClass: 'fa-solid fa-clapperboard', view: 'studio-alpha' },
    { label: 'On Shelf', value: programs.filter(p => p.status === 'shelf').length, color: R.viewers, iconClass: 'fa-solid fa-box', view: 'content' },
    { label: 'Scripts Ready', value: scripts.filter(s => s.status === 'ready').length, color: R.cash, iconClass: 'fa-solid fa-scroll', view: 'content' },
    { label: 'Talent', value: (station.hiredWriters||[]).length + (station.hiredDirectors||[]).length + (station.hiredStars||[]).length, color: R.gold, iconClass: 'fa-solid fa-users', view: 'operations' },
  ]

  return (
    <div className="retro-panel" style={{ padding: 20 }}>
      <div className="section-title" style={{
        fontSize: 14, color: '#fff', letterSpacing: 1.5, marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <i className="fa-solid fa-chart-simple" style={{ color: R.gold }} />
        <span>Operations Snapshot</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10,
      }}>
        {rows.map((row, i) => (
          <button
            key={i}
            onClick={() => onGoTo(row.view)}
            style={{
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${row.color}33`,
              borderLeft: `3px solid ${row.color}`,
              borderRadius: 8,
              cursor: 'pointer',
              color: R.text,
              fontFamily: 'inherit',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(30, 41, 55, 0.9)'
              e.currentTarget.style.borderLeftColor = row.color
              e.currentTarget.style.borderColor = row.color + '77'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'
              e.currentTarget.style.borderColor = `${row.color}33`
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
            }}>
              <i className={row.iconClass} style={{ color: row.color, fontSize: 12 }} />
              <span style={{
                fontSize: 9, color: R.textDim, letterSpacing: 1.5,
                fontFamily: 'monospace', textTransform: 'uppercase',
              }}>{row.label}</span>
            </div>
            <div className="retro-led" style={{
              fontSize: 22, color: row.color, lineHeight: 1,
            }}>
              {row.value}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── HELPERS ───────────────────────────────────────────────────────────
function MetricRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{
        fontSize: 11, color: R.textDim,
        fontFamily: 'monospace', letterSpacing: 0.5, textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontSize: 14, color, fontWeight: 700,
        fontFamily: 'Oswald, Impact, system-ui',
      }}>{value}</span>
    </div>
  )
}

function deriveAlerts({ game, station, cashBlocker, nextMonthCost }) {
  const alerts = []

  if (cashBlocker) {
    alerts.push(`Cash won't cover next month's costs (${fmtM(nextMonthCost)}). Cancel a production, drop marketing spend, or negotiate a way out.`)
  }

  const programs = station.programs || []
  const airing = programs.filter(p => p.status === 'airing').length
  const producing = programs.filter(p => p.status === 'producing').length
  const shelf = programs.filter(p => p.status === 'shelf').length

  if (airing === 0 && producing === 0 && shelf === 0) {
    alerts.push(`Nothing airing, producing, or on the shelf. Program the schedule or start a production.`)
  } else if (airing === 0 && (producing > 0 || shelf > 0)) {
    alerts.push(`Nothing currently airing. Schedule your ready programs into slots.`)
  }

  const scripts = station.scripts || []
  const ready = scripts.filter(s => s.status === 'ready').length
  const drafting = scripts.filter(s => s.status === 'drafting').length
  if (ready === 0 && drafting === 0 && (station.hiredWriters || []).length > 0) {
    alerts.push(`Script pipeline is empty. Commission new scripts to keep future productions rolling.`)
  }

  if ((station.hiredWriters || []).length === 0) {
    alerts.push(`No writers under contract. Hire at least one to commission scripts.`)
  }

  return alerts
}
