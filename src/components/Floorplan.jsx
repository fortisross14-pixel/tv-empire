import { R } from '../theme.js'
import { fmtM } from '../engine.js'
import { TalentLounge } from './TalentLounge.jsx'
import { RivalsPanel } from './RivalsPanel.jsx'

/**
 * Floorplan — the new home screen.
 *
 * Replaces PlanView as what the player sees when view === 'plan'.
 * Rooms are clickable; each opens the corresponding existing screen by
 * changing the `view` state:
 *   CEO Suite         → financials
 *   Programming       → schedule (renders old PlanView)
 *   Talent Relations  → operations
 *   Studio Alpha/Beta/Gamma → content (ContentScreen)
 *   Research Lab      → research
 *   [Right sidebar]   → market (rivals) / history (library)
 */
export function Floorplan({
  game,
  onGoTo,        // (view: string) => void
  onAdvanceMonth,
  runsBySlot,
}) {
  const station = game?.station
  if (!station) return null

  const programs = station.programs || []
  const scripts = station.scripts || []
  const readyScripts = scripts.filter(s => s.status === 'ready')
  const draftingScripts = scripts.filter(s => s.status === 'drafting')
  const producingPrograms = programs.filter(p => p.status === 'producing')
  // Stage AR2: bind productions to their studios by studioIdx. Fall back
  // to array index for legacy behavior only when nothing has a studioIdx
  // (i.e. save that skipped hydrate).
  const producingByStudio = (idx) =>
    producingPrograms.find(p => p.studioIdx === idx)
    || (producingPrograms.every(p => typeof p.studioIdx !== 'number') ? producingPrograms[idx] : null)
  const airingPrograms = programs.filter(p => p.status === 'airing')
  const shelfPrograms = programs.filter(p => p.status === 'shelf')

  const research = game?.research
  const availableResearch = countAvailableResearch(research)
  const unlockedResearch = countUnlockedResearch(research)

  return (
    <div style={{
      maxWidth: 1600, margin: '0 auto',
      padding: '20px 20px 40px',
    }}>
      {/* Three-column layout: talent lounge / floorplan / rivals+library */}
      <div className="floorplan-layout" style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 280px',
        gap: 20,
      }}>
        {/* ─── LEFT: TALENT LOUNGE ─── */}
        <aside className="floorplan-sidebar">
          <TalentLounge
            station={station}
            onOpenTalent={() => onGoTo('operations')}
          />
        </aside>

        {/* ─── CENTER: FLOOR PLAN ─── */}
        <main>
          <FloorplanHeader />

          <div className="floorplan-frame wood-bg" style={{ padding: 20 }}>
            {/* Top row: CEO / Programming / Talent Relations */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 14,
            }}>
              <Room
                iconClass="fa-solid fa-user-tie"
                label="CEO Suite"
                onClick={() => onGoTo('ceo')}
                sublines={[
                  { text: 'Strategy · Finance', color: R.textDim },
                  { text: fmtM(station.cash || 0), color: R.cash, size: 20, mono: true },
                ]}
                statusChip={{
                  text: 'FISCAL BRIEFING',
                  color: R.cash,
                }}
              />

              <Room
                iconClass="fa-solid fa-calendar-days"
                label="Programming"
                onClick={() => onGoTo('schedule')}
                sublines={[
                  { text: 'Weekly Grid', color: R.textDim, size: 11 },
                  { text: `${countScheduledSlots(runsBySlot)}/${runsBySlot ? runsBySlot.length : 0}`, color: R.viewers, size: 24, bold: true },
                  { text: 'slots programmed', color: '#7dd3fc', size: 9 },
                ]}
                statusChip={{
                  text: 'CLICK TO EDIT GRID',
                  color: R.viewers,
                }}
              />

              <Room
                iconClass="fa-solid fa-address-book"
                label="Talent"
                onClick={() => onGoTo('operations')}
                sublines={[
                  { text: `${talentCount(station)}`, color: R.rank, size: 30, bold: true },
                  { text: 'UNDER CONTRACT', color: '#fcd34d', size: 9 },
                ]}
                statusChip={{
                  text: 'HIRE · FIRE · SIGN',
                  color: R.rank,
                }}
              />
            </div>

            {/* Studio row: Alpha / Beta / Gamma */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 14,
            }}>
              <StudioRoom
                name="Studio Alpha"
                producing={producingByStudio(0)}
                shelfCount={shelfPrograms.length}
                airingCount={airingPrograms.length}
                onClick={() => onGoTo('studio-alpha')}
              />
              <StudioRoom
                name="Studio Beta"
                producing={producingByStudio(1)}
                shelfCount={shelfPrograms.length}
                airingCount={airingPrograms.length}
                onClick={() => onGoTo('studio-beta')}
              />
              <StudioRoom
                name="Studio Gamma"
                producing={producingByStudio(2)}
                shelfCount={shelfPrograms.length}
                airingCount={airingPrograms.length}
                onClick={() => onGoTo('studio-gamma')}
              />
            </div>

            {/* Bottom row: Research Lab (wide) */}
            <div
              onClick={() => onGoTo('research')}
              className="room-card"
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 68,
                padding: '12px 16px',
                gap: 16,
                flexDirection: 'row',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="brass-plaque" style={{
                  width: 38, height: 38, padding: 0,
                  justifyContent: 'center',
                }}>
                  <i className="fa-solid fa-flask" style={{ fontSize: 18 }} />
                </div>
                <div>
                  <div className="section-title" style={{ fontSize: 14, color: '#fff' }}>
                    Research &amp; Development Lab
                  </div>
                  <div style={{ fontSize: 11, color: R.textDim, marginTop: 2 }}>
                    {unlockedResearch} formats unlocked · {availableResearch} available
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 10, color: R.cash, fontFamily: 'monospace',
                  letterSpacing: 1.5,
                }}>
                  {researchInProgress(research) ? 'IN PROGRESS' : 'READY TO STUDY'}
                </div>
                <div style={{ fontSize: 9, color: '#34d39988', marginTop: 2 }}>
                  CLICK TO RESEARCH
                </div>
              </div>
            </div>
          </div>

          {/* Below the floor: quick script summary strip */}
          <div style={{
            marginTop: 16, padding: '10px 16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{
              fontSize: 10, color: R.gold, letterSpacing: 2,
              fontFamily: 'monospace', textTransform: 'uppercase',
            }}>
              Content pipeline
            </div>
            <PipelineStat label="Scripts ready"  value={readyScripts.length} color={R.cash} />
            <PipelineStat label="In drafting"    value={draftingScripts.length} color={R.viewers} />
            <PipelineStat label="In production"  value={producingPrograms.length} color={R.rank} />
            <PipelineStat label="On air"         value={airingPrograms.length} color={R.red} />
            <PipelineStat label="On shelf"       value={shelfPrograms.length} color={R.textDim} />
          </div>
        </main>

        {/* ─── RIGHT: RIVALS + LIBRARY ─── */}
        <aside className="floorplan-sidebar" style={{
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <RivalsPanel
            game={game}
            onOpenMarket={() => onGoTo('market')}
            onOpenHistory={() => onGoTo('history')}
            onOpenContent={() => onGoTo('content')}
          />
        </aside>
      </div>
    </div>
  )
}

/* ─── ATOMIC COMPONENTS ─── */

function FloorplanHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div>
        <div className="section-title" style={{
          fontSize: 24, color: '#fff', letterSpacing: 2,
        }}>
          Headquarters — Floor 1
        </div>
        <div style={{ fontSize: 11, color: R.textDim, marginTop: 2 }}>
          Click any room to manage · Advance the month when ready
        </div>
      </div>
      <div style={{
        fontSize: 10, padding: '4px 12px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span className="live-dot" />
        <span style={{ color: R.cash, fontFamily: 'monospace', letterSpacing: 2 }}>
          LIVE FEED
        </span>
      </div>
    </div>
  )
}

/** Generic room card */
function Room({ iconClass, label, onClick, sublines, statusChip }) {
  return (
    <div className="room-card" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <span className="brass-plaque">
          <i className={iconClass} style={{ fontSize: 14 }} />
          <span>{label}</span>
        </span>
      </div>
      <div className="room-card-inner">
        {(sublines || []).map((s, i) => (
          <div key={i} style={{
            fontSize: s.size || 11,
            color: s.color || R.text,
            fontWeight: s.bold ? 900 : 400,
            fontFamily: s.mono ? 'monospace' : 'inherit',
            lineHeight: 1.1,
            letterSpacing: s.size > 20 ? -0.5 : 0.2,
          }}>
            {s.text}
          </div>
        ))}
      </div>
      {statusChip && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{
            fontSize: 9, padding: '2px 8px',
            background: `${statusChip.color}22`,
            color: statusChip.color,
            borderRadius: 999,
            letterSpacing: 1.5,
            fontFamily: 'monospace',
          }}>
            {statusChip.text}
          </span>
        </div>
      )}
    </div>
  )
}

/** Studio room — shows a producing program's status if one exists. */
function StudioRoom({ name, producing, shelfCount, airingCount, onClick }) {
  const status = producing
    ? { text: `FILMING · ${Math.round(((producing.prodMonthsTotal - producing.prodMonthsRemaining) / producing.prodMonthsTotal) * 100)}%`, color: R.rank }
    : { text: 'STUDIO IDLE · READY', color: R.cash }

  return (
    <div className="room-card" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <span className="brass-plaque">
          <i className="fa-solid fa-video" style={{ fontSize: 14 }} />
          <span>{name}</span>
        </span>
      </div>

      <div className="room-card-inner" style={{ gap: 8 }}>
        {producing ? (
          <>
            <div style={{
              fontSize: 12, color: '#fff', fontWeight: 700, lineHeight: 1.2,
              padding: '0 4px', textAlign: 'center',
            }}>
              {producing.name}
            </div>
            <div style={{
              fontSize: 10, color: R.textDim, fontFamily: 'monospace',
            }}>
              {producing.prodMonthsRemaining}/{producing.prodMonthsTotal} mo remaining
            </div>
          </>
        ) : (
          <>
            <i className="fa-solid fa-video-slash" style={{ fontSize: 22, color: R.textMuted }} />
            <div style={{ fontSize: 10, color: R.textDim, marginTop: 4 }}>
              No production in progress
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{
          fontSize: 9, padding: '2px 8px',
          background: `${status.color}22`,
          color: status.color,
          borderRadius: 999,
          letterSpacing: 1.5,
          fontFamily: 'monospace',
        }}>
          {status.text}
        </span>
      </div>
    </div>
  )
}

function PipelineStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{
        fontSize: 16, fontWeight: 900, color, fontFamily: 'monospace',
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: R.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>
    </div>
  )
}

/* ─── DATA HELPERS ─── */
function talentCount(station) {
  if (!station) return 0
  return (station.hiredWriters || []).length
       + (station.hiredDirectors || []).length
       + (station.hiredStars || []).length
       + (station.hiredStaff || []).length
}

function countScheduledSlots(runsBySlot) {
  if (!runsBySlot) return 0
  return runsBySlot.filter(r => r && r.programId).length
}

function countAvailableResearch(research) {
  if (!research) return 0
  // Best-effort: any research node that has cost and isn't unlocked
  const unlocked = new Set(research.unlocked || [])
  const all = research.available || []
  return all.filter(n => !unlocked.has(n.id)).length
}

function countUnlockedResearch(research) {
  if (!research) return 0
  return (research.unlocked || []).length
}

function researchInProgress(research) {
  if (!research) return false
  return !!(research.inProgress && research.inProgress.id)
}
