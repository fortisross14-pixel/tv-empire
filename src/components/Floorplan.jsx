import { R } from '../theme.js'
import { fmtM } from '../engine.js'
import { TalentLounge } from './TalentLounge.jsx'
import { RivalsPanel } from './RivalsPanel.jsx'
import { ProgramArt } from './ProgramArt.jsx'

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
            {/* Top row: strategy + content acquisition (4 rooms) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
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
                iconClass="fa-solid fa-feather"
                label="Writers Room"
                onClick={() => onGoTo('scripting')}
                sublines={[
                  { text: 'Scripts', color: R.textDim, size: 11 },
                  { text: `${readyScripts.length}`, color: R.gold, size: 24, bold: true },
                  { text: draftingScripts.length > 0 ? `+ ${draftingScripts.length} drafting` : 'ready to produce', color: '#fcd34d99', size: 9 },
                ]}
                statusChip={{
                  text: 'COMMISSION SCRIPTS',
                  color: R.gold,
                }}
              />

              <Room
                iconClass="fa-solid fa-calendar-days"
                label="Programming"
                onClick={() => onGoTo('schedule')}
                sublines={[
                  { text: 'Weekly Grid', color: R.textDim, size: 11 },
                  { text: `${countScheduledSlots(runsBySlot)}/${(station.slotIds || []).length}`, color: R.viewers, size: 24, bold: true },
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

            {/* Bottom row: 3 studios + research lab (4 rooms, uniform) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
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
              <Room
                iconClass="fa-solid fa-flask"
                label="R&D Lab"
                onClick={() => onGoTo('research')}
                sublines={[
                  { text: `${unlockedResearch}`, color: R.cash, size: 26, bold: true },
                  { text: 'FORMATS UNLOCKED', color: '#34d39999', size: 9 },
                  ...(availableResearch > 0 ? [{ text: `${availableResearch} available`, color: R.textDim, size: 10 }] : []),
                ]}
                statusChip={{
                  text: researchInProgress(research) ? 'IN PROGRESS' : 'READY TO STUDY',
                  color: researchInProgress(research) ? R.rank : R.cash,
                }}
              />
            </div>
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
    <div style={{ marginBottom: 12 }}>
      <div className="section-title" style={{
        fontSize: 24, color: '#fff', letterSpacing: 2,
      }}>
        Headquarters
      </div>
      <div style={{ fontSize: 11, color: R.textDim, marginTop: 2 }}>
        Click any room to manage · Advance the month when ready
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
            <ProgramArt program={producing} compact showTitle={false} style={{ width: '100%', height: 68 }} />
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
  // runsBySlot is a plain object keyed by slot index (from App.jsx useMemo),
  // NOT an array — use Object.values to iterate.
  const vals = Array.isArray(runsBySlot) ? runsBySlot : Object.values(runsBySlot)
  return vals.filter(r => r && r.programId).length
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
