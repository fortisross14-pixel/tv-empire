import { useState } from 'react'
import { R } from '../theme.js'
import { CATEGORIES } from '../constants.js'
import {
  findDirector, findStar, findMovie, findLeague, fmtM,
} from '../engine.js'
import { ProductionView } from './ProductionView.jsx'
import { ProgramArt } from './ProgramArt.jsx'

/**
 * StudioRoom — dedicated screen for one studio.
 *
 * Studios don't have a real engine field yet — we infer which production
 * lives in which studio by index: producing[studioIdx] → this studio.
 * This is intentional. Adding a studioId field on programs would require
 * save-schema migration; for AQ we get the per-studio feel with zero
 * engine risk.
 *
 * States:
 *   IDLE  → empty state + "Start New Production" CTA (opens ProductionView modal)
 *   BUSY  → NOW FILMING card with progress, crew, cost, cancel button
 *
 * The right sidebar always shows other-studio status + pipeline summary
 * so the player can jump laterally without going through the Floorplan.
 */
const STUDIO_LABELS = ['Studio Alpha', 'Studio Beta', 'Studio Gamma']
const STUDIO_ACCENTS = [R.viewers, R.rank, R.red]  // sky / amber / red

export function StudioRoom({
  studioIdx, game,
  onBeginProgram, onCancelProgram,
  onGoTo,           // (view: string) => void — jump to other studios or programming
  onBack,           // → floorplan
}) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const station = game?.station
  if (!station) return null

  const programs = station.programs || []
  const producing = programs.filter(p => p.status === 'producing')
  // Find production bound to this studio (Stage AR2). Fall back to array
  // index only if no producing program has a studioIdx yet — belt-and-
  // suspenders for a save that didn't run through hydrate for some reason.
  const production =
    producing.find(p => p.studioIdx === studioIdx)
    || (producing.every(p => typeof p.studioIdx !== 'number') ? producing[studioIdx] : null)
    || null
  const label = STUDIO_LABELS[studioIdx] || `Studio ${studioIdx + 1}`
  const accent = STUDIO_ACCENTS[studioIdx] || R.gold

  return (
    <div style={{
      maxWidth: 1600, margin: '0 auto',
      padding: '20px 20px 40px',
    }}>
      {/* ─── HERO ─── */}
      <StudioHero label={label} accent={accent} production={production} />

      {/* ─── GRID: MAIN + SIDEBAR ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 20,
      }} className="studio-layout">

        {/* MAIN */}
        <main>
          {production ? (
            <ProductionCard
              production={production}
              accent={accent}
              station={station}
              research={game.research}
              onCancel={() => setCancelConfirm(true)}
            />
          ) : (
            <IdleCard
              accent={accent}
              scriptsReady={(station.scripts || []).filter(s => s.status === 'ready').length}
              onStartProduction={() => setShowBuilder(true)}
            />
          )}
        </main>

        {/* SIDEBAR */}
        <aside>
          <OtherStudiosPanel
            currentIdx={studioIdx}
            producing={producing}
            onGoTo={onGoTo}
          />
          <PipelinePanel station={station} />
        </aside>
      </div>

      {/* ─── BOTTOM ACTIONS ─── */}
      <div style={{
        marginTop: 24, padding: '14px 18px',
        background: 'rgba(15, 23, 42, 0.5)',
        border: `1px solid ${R.border}44`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 11, color: R.textDim, flex: 1, minWidth: 200 }}>
          <i className="fa-solid fa-info-circle" style={{ marginRight: 6, color: accent }} />
          {production
            ? `${label} is booked until this production finishes. Cancel to free it.`
            : `${label} is available. Start a production or head back to the floor plan.`}
        </div>
        <button onClick={onBack} className="retro-button-secondary" style={{ fontSize: 11 }}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
          Back to Floor Plan
        </button>
      </div>

      {/* ─── PRODUCTION BUILDER MODAL (existing ProductionView, reused) ─── */}
      {showBuilder && (
        <ProductionView
          station={station}
          research={game.research}
          year={game.year}
          monthIdx={game.monthIdx}
          onBegin={(opts) => {
            // Stage AR2: tag the production with this studio's index so it
            // opens here, not in the first idle slot.
            onBeginProgram({ ...opts, studioIdx })
            setShowBuilder(false)
          }}
          onClose={() => setShowBuilder(false)}
        />
      )}

      {/* ─── CANCEL CONFIRM MODAL ─── */}
      {cancelConfirm && production && (
        <CancelConfirm
          production={production}
          onKeep={() => setCancelConfirm(false)}
          onCancel={() => {
            onCancelProgram(production.id)
            setCancelConfirm(false)
          }}
        />
      )}
    </div>
  )
}

// ─── HERO ──────────────────────────────────────────────────────────────
function StudioHero({ label, accent, production }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 20, gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Big film-reel icon on the left */}
        <div style={{
          width: 64, height: 64, borderRadius: 12,
          background: `linear-gradient(145deg, ${accent}33, ${accent}11)`,
          border: `2px solid ${accent}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${accent}44`,
        }}>
          <i className="fa-solid fa-video" style={{ color: accent, fontSize: 28 }} />
        </div>

        <div>
          <div style={{
            fontSize: 10, color: accent, letterSpacing: 3,
            fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
          }}>
            Production Studio
          </div>
          <div className="section-title" style={{
            fontSize: 30, color: '#fff', letterSpacing: 2, lineHeight: 1,
          }}>
            {label}
          </div>
        </div>
      </div>

      {/* Status pill */}
      <div style={{
        padding: '10px 16px', borderRadius: 999,
        background: production ? `${R.red}22` : `${R.cash}22`,
        border: `2px solid ${production ? R.red : R.cash}77`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="live-dot" style={{
          background: production ? R.red : R.cash,
          boxShadow: `0 0 8px ${production ? R.red : R.cash}`,
        }} />
        <span style={{
          fontSize: 12, letterSpacing: 2, fontFamily: 'monospace',
          fontWeight: 700, color: production ? R.red : R.cash,
          textTransform: 'uppercase',
        }}>
          {production ? 'Now Filming' : 'Idle · Ready'}
        </span>
      </div>
    </div>
  )
}

// ─── ACTIVE PRODUCTION CARD ────────────────────────────────────────────
function ProductionCard({ production: p, accent, station, research, onCancel }) {
  const cat = CATEGORIES[p.categoryId]
  const movie = p.movieId ? findMovie(p.movieId) : null
  const league = p.sportsLeagueId ? findLeague(p.sportsLeagueId) : null
  const director = p.directorId ? findDirector(p.directorId) : null
  const star = p.starId ? findStar(p.starId) : null
  const star2 = p.starId2 ? findStar(p.starId2) : null

  const totalMonths = p.prodMonthsTotal || 1
  const remaining = p.prodMonthsRemaining || 0
  const monthsDone = totalMonths - remaining
  const pctDone = totalMonths > 0 ? Math.min(100, (monthsDone / totalMonths) * 100) : 0

  const slugline = movie ? 'Licensed feature'
                 : league ? `${league.label} rights`
                 : (cat?.label || 'Program')

  return (
    <div className="retro-panel crt-screen" style={{
      padding: 24,
      borderColor: `${accent}88`,
    }}>
      {/* Eyebrow */}
      <div style={{
        fontSize: 10, color: accent, letterSpacing: 3,
        fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 10,
        position: 'relative', zIndex: 2,
      }}>
        <i className="fa-solid fa-clapperboard" style={{ marginRight: 6 }} />
        In Production · {slugline}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 34%) 1fr', gap: 20, alignItems: 'stretch', marginBottom: 20, position: 'relative', zIndex: 2 }} className="production-hero-grid">
        <ProgramArt program={p} style={{ minHeight: 190 }} />
        <div style={{ alignSelf: 'center' }}>
          <div style={{
            fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.05,
            letterSpacing: -0.5, marginBottom: 10,
            fontFamily: 'Oswald, Impact, system-ui',
          }}>
            {p.name}
          </div>
          <div style={{ color: R.textDim, fontSize: 12, lineHeight: 1.5 }}>
            A visible production identity now follows this show from the studio floor to the content library and schedule.
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 6, fontFamily: 'monospace',
        }}>
          <span style={{ fontSize: 10, color: R.textDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Production Progress
          </span>
          <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>
            Month {monthsDone} of {totalMonths}
          </span>
        </div>
        <div style={{
          height: 10,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 999,
          overflow: 'hidden',
          border: `1px solid ${R.border}55`,
        }}>
          <div style={{
            width: `${pctDone}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${accent}aa, ${accent})`,
            borderRadius: 999,
            boxShadow: `0 0 12px ${accent}66`,
            transition: 'width 0.6s',
          }} />
        </div>
        <div style={{
          marginTop: 6, fontSize: 11, color: R.textDim, fontFamily: 'monospace',
        }}>
          {remaining} month{remaining === 1 ? '' : 's'} remaining
        </div>
      </div>

      {/* Crew row */}
      {(director || star || star2) && (
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: 10, color: R.textDim, letterSpacing: 1.5,
            fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8,
          }}>Assigned Crew</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {director && <CrewChip role="Director" name={director.name} tier={director.tier} iconClass="fa-solid fa-clapperboard" color={R.viewers} />}
            {star && <CrewChip role={star2 ? 'Lead Star' : 'Star'} name={star.name} tier={star.tier} iconClass="fa-solid fa-star" color={R.red} />}
            {star2 && <CrewChip role="Co-Star" name={star2.name} tier={star2.tier} iconClass="fa-solid fa-star" color={R.red} />}
          </div>
        </div>
      )}

      {/* Q/H estimate + cost grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 1,
        background: R.border,
        borderTop: `1px solid ${R.border}`,
        borderBottom: `1px solid ${R.border}`,
        marginBottom: 20,
        position: 'relative', zIndex: 2,
      }}>
        <MetricCell
          label="Quality est"
          value={p.estQRange ? `${p.estQRange[0]}–${p.estQRange[1]}` : '—'}
          color={R.viewers}
        />
        <MetricCell
          label="Hype est"
          value={p.estHRange ? `${p.estHRange[0]}–${p.estHRange[1]}` : '—'}
          color={R.gold}
        />
        <MetricCell
          label="Sunk cost"
          value={fmtM(p.totalCost || 0)}
          color={R.text}
        />
        <MetricCell
          label="Category"
          value={cat?.label || p.categoryId || '—'}
          color={cat?.color || R.text}
          small
        />
      </div>

      {/* Cancel action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
        <button onClick={onCancel} style={{
          background: 'transparent',
          border: `1px solid ${R.red}77`,
          color: R.red,
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: 11, letterSpacing: 1.5,
          fontFamily: 'Oswald, Impact, system-ui',
          fontWeight: 700, textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = `${R.red}22`
          e.currentTarget.style.borderColor = R.red
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = `${R.red}77`
        }}
        >
          <i className="fa-solid fa-xmark" style={{ marginRight: 6 }} />
          Cancel Production
        </button>
      </div>
    </div>
  )
}

function CrewChip({ role, name, tier, iconClass, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px',
      background: `${color}12`,
      border: `1px solid ${color}55`,
      borderRadius: 8,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6,
        background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={iconClass} style={{ color, fontSize: 12 }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 9, color, letterSpacing: 1.5,
          fontFamily: 'monospace', textTransform: 'uppercase',
        }}>{role}</div>
        <div style={{
          fontSize: 12, color: '#fff', fontWeight: 700, lineHeight: 1.1,
        }}>
          {name} <span style={{ opacity: 0.6, fontSize: 10, fontWeight: 500 }}>· {tier}</span>
        </div>
      </div>
    </div>
  )
}

function MetricCell({ label, value, color, small }) {
  return (
    <div style={{ background: R.bg, padding: '10px 14px' }}>
      <div style={{
        fontSize: 9, color: R.textDim, letterSpacing: 1.4,
        fontFamily: 'monospace', textTransform: 'uppercase',
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: small ? 13 : 18, color: color || R.text,
        fontWeight: 700,
        fontFamily: small ? 'inherit' : 'Oswald, Impact, system-ui',
        letterSpacing: small ? 0 : -0.3,
        lineHeight: 1,
      }}>{value}</div>
    </div>
  )
}

// ─── IDLE STATE CARD ───────────────────────────────────────────────────
function IdleCard({ accent, scriptsReady, onStartProduction }) {
  return (
    <div className="retro-panel crt-screen" style={{
      padding: 44,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center',
      minHeight: 380,
      justifyContent: 'center',
      gap: 20,
    }}>
      {/* Big idle icon */}
      <div style={{
        width: 110, height: 110, borderRadius: 20,
        background: `linear-gradient(145deg, rgba(30,41,55,0.9), rgba(15,23,42,0.9))`,
        border: `2px dashed ${accent}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <i className="fa-solid fa-video-slash" style={{ color: accent, opacity: 0.7, fontSize: 44 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="section-title" style={{
          fontSize: 22, color: '#fff', letterSpacing: 2, marginBottom: 8,
        }}>
          Studio Idle
        </div>
        <div style={{
          fontSize: 13, color: R.textDim, maxWidth: 380, lineHeight: 1.5,
        }}>
          No production in progress. Start a new show by picking a script, movie, or sports rights.
        </div>
      </div>

      {/* Scripts hint */}
      {scriptsReady > 0 && (
        <div style={{
          padding: '8px 14px',
          background: `${R.gold}12`,
          border: `1px solid ${R.gold}44`,
          borderRadius: 999,
          fontSize: 11, color: R.gold,
          fontFamily: 'monospace', letterSpacing: 1,
          textTransform: 'uppercase',
          position: 'relative', zIndex: 2,
        }}>
          <i className="fa-solid fa-scroll" style={{ marginRight: 6 }} />
          {scriptsReady} script{scriptsReady === 1 ? '' : 's'} ready to produce
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStartProduction}
        className="retro-button"
        style={{ fontSize: 14, padding: '12px 24px', position: 'relative', zIndex: 2 }}
      >
        <i className="fa-solid fa-plus" />
        <span>Start New Production</span>
      </button>
    </div>
  )
}

// ─── SIDEBAR: OTHER STUDIOS ────────────────────────────────────────────
function OtherStudiosPanel({ currentIdx, producing, onGoTo }) {
  const others = [0, 1, 2].filter(i => i !== currentIdx)
  const routeMap = ['studio-alpha', 'studio-beta', 'studio-gamma']

  return (
    <div className="retro-panel" style={{ padding: 16, marginBottom: 16 }}>
      <div className="section-title" style={{
        fontSize: 13, color: '#fff', letterSpacing: 1.5, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <i className="fa-solid fa-video" style={{ color: R.textDim }} />
        <span>Other Studios</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {others.map(i => {
          const label = STUDIO_LABELS[i] || `Studio ${i + 1}`
          const accent = STUDIO_ACCENTS[i]
          // Stage AR2: find by studioIdx binding, not array index
          const prod =
            producing.find(p => p.studioIdx === i)
            || (producing.every(p => typeof p.studioIdx !== 'number') ? producing[i] : null)
          return (
            <button
              key={i}
              onClick={() => onGoTo(routeMap[i])}
              style={{
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: `1px solid ${accent}44`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                color: R.text,
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(30, 41, 55, 0.9)'
                e.currentTarget.style.borderColor = accent
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)'
                e.currentTarget.style.borderColor = `${accent}44`
              }}
            >
              <div style={{
                fontSize: 11, color: '#fff', fontWeight: 700,
                marginBottom: 3,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: 10, color: prod ? accent : R.textDim,
                fontFamily: 'monospace', letterSpacing: 0.5,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {prod
                  ? `● ${prod.name} · ${prod.prodMonthsRemaining}mo`
                  : '○ IDLE'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── SIDEBAR: PIPELINE ─────────────────────────────────────────────────
function PipelinePanel({ station }) {
  const programs = station.programs || []
  const scripts = station.scripts || []
  const rows = [
    { label: 'Scripts ready', value: scripts.filter(s => s.status === 'ready').length, color: R.cash, iconClass: 'fa-solid fa-scroll' },
    { label: 'Scripts drafting', value: scripts.filter(s => s.status === 'drafting').length, color: R.gold, iconClass: 'fa-solid fa-feather' },
    { label: 'On shelf', value: programs.filter(p => p.status === 'shelf').length, color: R.viewers, iconClass: 'fa-solid fa-box' },
    { label: 'Airing', value: programs.filter(p => p.status === 'airing').length, color: R.red, iconClass: 'fa-solid fa-signal' },
  ]

  return (
    <div className="retro-panel" style={{ padding: 16 }}>
      <div className="section-title" style={{
        fontSize: 13, color: '#fff', letterSpacing: 1.5, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <i className="fa-solid fa-list" style={{ color: R.gold }} />
        <span>Content Pipeline</span>
      </div>

      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 10px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(100,116,139,0.2)',
          borderRadius: 8,
          marginBottom: 6,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 5,
            background: `${row.color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className={row.iconClass} style={{ color: row.color, fontSize: 10 }} />
          </div>
          <span style={{ flex: 1, fontSize: 11, color: R.textDim }}>
            {row.label}
          </span>
          <span className="retro-led" style={{
            fontSize: 15, color: row.color,
          }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── CANCEL CONFIRM MODAL ──────────────────────────────────────────────
function CancelConfirm({ production, onKeep, onCancel }) {
  return (
    <div
      onClick={onKeep}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="retro-panel"
        style={{
          padding: 28,
          maxWidth: 460, width: '100%',
        }}
      >
        <div style={{
          fontSize: 10, color: R.red, letterSpacing: 3,
          fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8,
        }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
          Cancel Production
        </div>
        <div className="section-title" style={{
          fontSize: 22, color: '#fff', letterSpacing: 1.5, marginBottom: 12,
        }}>
          Cancel "{production.name}"?
        </div>
        <div style={{
          fontSize: 13, color: R.textDim, lineHeight: 1.55, marginBottom: 20,
        }}>
          The studio will be freed. You won't get the upfront cost ({fmtM(production.totalCost || 0)}) back, and any assigned crew will be released from their contract for this production.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onKeep}
            className="retro-button-secondary"
            style={{ flex: 1 }}
          >
            Keep Producing
          </button>
          <button
            onClick={onCancel}
            className="retro-button"
            style={{ flex: 1, background: `linear-gradient(to bottom, ${R.red}, ${R.redDim})` }}
          >
            Cancel Production
          </button>
        </div>
      </div>
    </div>
  )
}
