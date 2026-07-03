import { R } from '../theme.js'
import { MARKETS } from '../constants.js'

/**
 * RivalsPanel — right sidebar in the floor plan.
 *
 * Two stacked cards:
 *   1. RIVAL NETWORKS — competitor stations sorted by fame.
 *      Click → opens Market screen.
 *   2. PROGRAM LIBRARY — quick counts of the station's IP catalog.
 *      Click → opens History screen.
 */
export function RivalsPanel({ game, onOpenMarket, onOpenHistory, onOpenContent }) {
  const station = game?.station
  const competitors = game?.competitors || []

  const allNetworks = [
    { name: station?.name || 'You', fame: station?.fame || 0, isYou: true },
    ...competitors.map(c => ({ name: c.name, fame: c.fame || 0, isYou: false })),
  ].sort((a, b) => b.fame - a.fame)

  // Total field fame for market-share calculation. Guard against divide-by-zero.
  const totalFame = allNetworks.reduce((sum, n) => sum + n.fame, 0)
  allNetworks.forEach(n => { n._totalFame = totalFame })

  const yourRank = allNetworks.findIndex(n => n.isYou) + 1
  const marketLabel = station ? (MARKETS[station.market]?.label || station.market) : ''

  return (
    <>
      {/* ─── RIVAL NETWORKS ─── */}
      <div className="retro-panel" style={{ padding: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div>
            <div className="section-title" style={{
              fontSize: 14, color: '#fff', letterSpacing: 1.5,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="fa-solid fa-signal" style={{ color: R.red }} />
              <span>Rival Networks</span>
            </div>
            <div style={{ fontSize: 10, color: R.textDim, marginTop: 2 }}>
              {marketLabel} · share by fame
            </div>
          </div>
          <button
            onClick={onOpenMarket}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: R.textDim,
              padding: '4px 8px',
              fontSize: 9,
              borderRadius: 6,
              cursor: 'pointer',
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            <i className="fa-solid fa-arrow-right" style={{ marginRight: 4 }} />
            Details
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {allNetworks.length === 0 ? (
            <div style={{
              padding: 14, textAlign: 'center',
              fontSize: 10, color: R.textDim,
            }}>
              No rival data.
            </div>
          ) : (
            allNetworks.slice(0, 8).map((n, i) => (
              <RivalRow key={i} rank={i + 1} network={n} maxFame={allNetworks[0]?.fame || 1} />
            ))
          )}
        </div>

        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 10, color: R.rank, textAlign: 'center',
          fontFamily: 'monospace', letterSpacing: 1.5,
        }}>
          YOU RANK #{yourRank} OF {allNetworks.length}
        </div>
      </div>

      {/* ─── PROGRAM LIBRARY ─── */}
      <div className="retro-panel" style={{ padding: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div>
            <div className="section-title" style={{
              fontSize: 14, color: '#fff', letterSpacing: 1.5,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="fa-solid fa-book" style={{ color: R.gold }} />
              <span>Library</span>
            </div>
            <div style={{ fontSize: 10, color: R.textDim, marginTop: 2 }}>
              Content · Archive
            </div>
          </div>
        </div>

        <LibraryStat
          label="IP licenses held"
          value={(station?.ipLicenses || []).length}
          color={R.gold}
          iconClass="fa-solid fa-scroll"
        />
        <LibraryStat
          label="Movie packs"
          value={(station?.moviePacks || []).length}
          color={R.viewers}
          iconClass="fa-solid fa-film"
        />
        <LibraryStat
          label="Sports rights"
          value={(station?.sportsLicenses || []).length}
          color={R.red}
          iconClass="fa-solid fa-trophy"
        />
        <LibraryStat
          label="Programs archived"
          value={(station?.programs || []).filter(p => p.status === 'finished').length}
          color={R.textDim}
          iconClass="fa-solid fa-box-archive"
        />

        {/* Two-button footer: Content (scripts/programs manager) + History (past seasons) */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            onClick={onOpenContent}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${R.cash}55`,
              color: R.cash,
              padding: '6px 10px',
              fontSize: 10,
              borderRadius: 6,
              cursor: 'pointer',
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${R.cash}18`}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-scroll" style={{ marginRight: 4 }} />
            Content
          </button>
          <button
            onClick={onOpenHistory}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${R.gold}55`,
              color: R.gold,
              padding: '6px 10px',
              fontSize: 10,
              borderRadius: 6,
              cursor: 'pointer',
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${R.gold}18`}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-book" style={{ marginRight: 4 }} />
            History
          </button>
        </div>
      </div>
    </>
  )
}

function RivalRow({ rank, network, maxFame }) {
  const pct = maxFame > 0 ? Math.round((network.fame / maxFame) * 100) : 0
  const barColor = network.isYou ? R.gold : R.textMuted
  // Market share estimate: fame proportion of the total field
  const share = network._totalFame > 0
    ? Math.round((network.fame / network._totalFame) * 100)
    : 0
  return (
    <div style={{
      padding: '7px 10px',
      background: network.isYou ? `${R.gold}12` : 'rgba(15, 23, 42, 0.6)',
      border: network.isYou
        ? `1px solid ${R.gold}66`
        : '1px solid rgba(100,116,139,0.2)',
      borderRadius: 8,
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: 10, color: R.textDim, fontFamily: 'monospace',
          minWidth: 22,
        }}>
          #{rank}
        </span>
        <span style={{
          fontSize: 12, color: network.isYou ? R.gold : '#fff',
          fontWeight: network.isYou ? 700 : 500,
          flex: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {network.name}
          {network.isYou && (
            <span style={{
              fontSize: 8, marginLeft: 6, color: R.gold,
              letterSpacing: 1.5, fontWeight: 900,
            }}>
              ● YOU
            </span>
          )}
        </span>
        <span style={{
          fontSize: 11, color: R.rank, fontFamily: 'monospace',
          fontWeight: 700,
        }}>
          {share}%
        </span>
      </div>
      <div style={{
        height: 3, background: 'rgba(0,0,0,0.3)', borderRadius: 999,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: barColor,
          borderRadius: 999, transition: 'width 0.4s',
        }} />
      </div>
    </div>
  )
}

function LibraryStat({ label, value, color, iconClass }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px',
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(100,116,139,0.2)',
      borderRadius: 8,
      marginBottom: 6,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6,
        background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={iconClass} style={{ color, fontSize: 11 }} />
      </div>
      <span style={{ flex: 1, fontSize: 11, color: R.textDim }}>
        {label}
      </span>
      <span style={{
        fontSize: 16, fontWeight: 900, color, fontFamily: 'monospace',
      }}>
        {value}
      </span>
    </div>
  )
}
