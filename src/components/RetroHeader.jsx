import { R } from '../theme.js'
import { fmtM } from '../engine.js'
import { MONTHS } from '../constants.js'

/**
 * RetroHeader — the sticky retro header for the game view.
 *
 * Layout: [Logo + Network name] · [Cash | Viewers | Rank] · [Month/Year · Advance]
 *
 * Stage AO version:
 *  - Rendered on every game phase/view (floorplan and all room screens).
 *  - Cash/viewers/rank/month are read from `game.station` and `game`.
 *  - Advance-Month button appears only in the plan phase.
 *  - Mute/settings on the far right.
 *
 * The room-modal screens (Content/Operations/etc) have their own back
 * buttons and heros, so this header stays visible above them without
 * overlap.
 */
export function RetroHeader({
  game, view,
  onAdvanceMonth,
  cashBlocker, nextMonthCost,
  muted, onToggleMute,
  onOpenSettings,
  onGoFloorplan,
}) {
  const station = game?.station
  if (!station) return null

  // Weekly viewers estimate: sum of last month's audience across programs.
  // For AO we don't have that broken out; fall back to programs count.
  // Rank: derive from competitor list if available.
  const airingCount = (station.programs || []).filter(p => p.status === 'airing').length
  const totalAudience = (station.programs || [])
    .filter(p => p.status === 'airing')
    .reduce((sum, p) => sum + (p.lastMonthAudience || 0), 0)
  const rank = deriveRank(game)

  const monthLabel = MONTHS[game.monthIdx] || 'Jan'
  const canAdvance = game.phase === 'plan' && view !== 'plan-loading'
  const inRoom = view !== 'plan'

  return (
    <header className="retro-header" style={{
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1600, margin: '0 auto',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        {/* ─── LEFT: Logo + Network name + optional Back-to-Floorplan ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 auto' }}>
          {/* Logo — round with brass border */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: `linear-gradient(135deg, ${R.gold}, ${R.red}, ${R.gold})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `4px solid ${R.bg}`,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            flexShrink: 0,
          }}>
            <i className="fa-solid fa-tv" style={{ fontSize: 26, color: R.bg }} />
          </div>

          {/* Network wordmark + name */}
          <div style={{ minWidth: 0 }}>
            <div className="section-title" style={{
              fontSize: 20, lineHeight: 1,
              color: '#fff', letterSpacing: 3,
              display: 'flex', gap: 4, alignItems: 'baseline',
            }}>
              <span>{station.name || 'RETROVISION'}</span>
            </div>
            <div style={{
              fontSize: 9, color: R.gold, letterSpacing: 3,
              marginTop: 2, fontFamily: 'monospace',
            }}>
              EST Y{game.year || 1} · NATIONAL TELEVISION
            </div>
          </div>

          {/* Back-to-floorplan chip (only when in a room) */}
          {inRoom && (
            <button
              onClick={onGoFloorplan}
              className="retro-button-secondary"
              style={{ marginLeft: 12 }}
            >
              <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
              Floor Plan
            </button>
          )}
        </div>

        {/* ─── CENTER-RIGHT: Key stats ─── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          {/* Cash */}
          <StatChip
            iconClass="fa-solid fa-wallet"
            color={R.cash}
            label="Cash on hand"
            value={fmtM(station.cash || 0)}
          />

          {/* Viewers (M) */}
          <StatChip
            iconClass="fa-solid fa-users"
            color={R.viewers}
            label="On-air programs"
            value={totalAudience > 0
              ? `${totalAudience.toFixed(1)}M`
              : `${airingCount} live`}
          />

          {/* Rank */}
          <div style={{
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 9, color: R.rank, letterSpacing: 2.5,
                fontFamily: 'monospace', textTransform: 'uppercase',
              }}>Market rank</div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'baseline' }}>
                <span className="retro-led" style={{ fontSize: 28, color: R.rank, lineHeight: 1 }}>
                  #{rank.pos}
                </span>
                <span style={{ fontSize: 11, color: R.rank, opacity: 0.7 }}>
                  /{rank.total}
                </span>
              </div>
            </div>
          </div>

          {/* Month / Year */}
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            textAlign: 'center', minWidth: 96,
          }}>
            <div style={{
              fontSize: 9, color: R.textDim, letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>Y{game.year || 1} · Month</div>
            <div style={{
              fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1,
              fontFamily: 'Oswald, Impact, system-ui',
            }}>
              {monthLabel.toUpperCase()}
            </div>
          </div>

          {/* Advance-month button */}
          {game.phase === 'plan' && (
            <button
              onClick={onAdvanceMonth}
              className="retro-button"
              disabled={cashBlocker}
              title={cashBlocker
                ? `Not enough cash — need ${fmtM(nextMonthCost)} for next month`
                : `Advance to next month`}
              style={{ fontSize: 14 }}
            >
              <i className="fa-solid fa-forward" />
              <span>ADVANCE</span>
            </button>
          )}

          {/* Mute + settings */}
          <div style={{ display: 'flex', gap: 6 }}>
            <IconButton
              iconClass={muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'}
              onClick={onToggleMute}
              title={muted ? 'Unmute' : 'Mute'}
            />
            <IconButton
              iconClass="fa-solid fa-cog"
              onClick={onOpenSettings}
              title="Settings"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

function StatChip({ iconClass, color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 9, color, letterSpacing: 2.5,
          fontFamily: 'monospace', textTransform: 'uppercase',
        }}>{label}</div>
        <div className="retro-led" style={{
          fontSize: 22, color, lineHeight: 1, marginTop: 2,
        }}>{value}</div>
      </div>
      <i className={iconClass} style={{ color, fontSize: 22 }} />
    </div>
  )
}

function IconButton({ iconClass, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34, height: 34, borderRadius: 8,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#e2e8f0',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
    >
      <i className={iconClass} style={{ fontSize: 13 }} />
    </button>
  )
}

/** Derive market rank from competitor list. Falls back to #1/1 if no data. */
function deriveRank(game) {
  const comps = game?.competitors || []
  const stationFame = game?.station?.fame || 0
  const higher = comps.filter(c => (c.fame || 0) > stationFame).length
  return {
    pos: higher + 1,
    total: comps.length + 1,
  }
}
