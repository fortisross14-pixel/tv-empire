import { R } from '../theme.js'
import { fmtM, findStar, findDirector } from '../engine.js'
import { CATEGORIES } from '../constants.js'
import { TalentLounge } from './TalentLounge.jsx'
import { RivalsPanel } from './RivalsPanel.jsx'
import { ProgramArt } from './ProgramArt.jsx'

/**
 * Headquarters / studio campus.
 *
 * This is intentionally a management surface rather than a decorative menu:
 * - every department is a clickable room
 * - productions occupy physical sound stages
 * - the lower pipeline exposes bottlenecks at a glance
 * - staff/talent appear as visible crew tokens
 */
export function Floorplan({ game, onGoTo, onAdvanceMonth, runsBySlot }) {
  const station = game?.station
  if (!station) return null

  const programs = station.programs || []
  const scripts = station.scripts || []
  const producing = programs.filter(p => p.status === 'producing')
  const ready = programs.filter(p => p.status === 'shelf')
  const airing = programs.filter(p => p.status === 'airing')
  const writers = station.hiredWriters || []
  const talent = station.hiredTalent || station.talent || []
  const executives = Object.values(station.staff || {}).filter(Boolean)

  const producingByStudio = idx =>
    producing.find(p => p.studioIdx === idx)
    || (producing.every(p => typeof p.studioIdx !== 'number') ? producing[idx] : null)

  const scheduled = countScheduledSlots(runsBySlot)
  const totalSlots = Math.max(1, (station.slotIds || []).length)
  const readyScripts = scripts.filter(s => s.status === 'ready')
  const drafting = scripts.filter(s => s.status === 'drafting')
  const researchActive = (game.research?.inProgress || []).length

  return (
    <div className="hq-shell">
      <div className="hq-topbar">
        <div>
          <div className="hq-kicker">LIVE MANAGEMENT VIEW</div>
          <h1 className="hq-title">{station.name || 'TV Empire'} Studios</h1>
          <div className="hq-subtitle">Build the slate, staff the rooms, and keep every stage moving.</div>
        </div>
        <div className="hq-command-strip">
          <Metric label="Cash" value={fmtM(station.cash || 0)} tone={R.cash} />
          <Metric label="On air" value={airing.length} tone={R.viewers} />
          <Metric label="In production" value={producing.length} tone={R.rank} />
          <Metric label="Schedule" value={`${scheduled}/${totalSlots}`} tone={R.gold} />
        </div>
      </div>

      <div className="floorplan-layout hq-layout">
        <aside className="floorplan-sidebar hq-sidebar">
          <TalentLounge station={station} onOpenTalent={() => onGoTo('operations')} />
          <CrewBoard writers={writers.length} talent={talent.length} executives={executives.length} onGoTo={onGoTo} />
        </aside>

        <main className="hq-campus-wrap">
          <div className="hq-campus">
            <div className="hq-campus-label">STUDIO CAMPUS · CLICK A ROOM TO ENTER</div>

            <div className="hq-upper-row">
              <DepartmentRoom
                kind="executive"
                icon="fa-solid fa-user-tie"
                title="Executive Suite"
                eyebrow="STRATEGY + FINANCE"
                primary={fmtM(station.cash || 0)}
                secondary={`${executives.length} senior leaders`}
                people={Math.max(1, executives.length)}
                onClick={() => onGoTo('ceo')}
              />
              <DepartmentRoom
                kind="writers"
                icon="fa-solid fa-pen-nib"
                title="Writers' Room"
                eyebrow="DEVELOPMENT"
                primary={`${readyScripts.length} ready`}
                secondary={drafting.length ? `${drafting.length} scripts drafting` : 'No active drafts'}
                people={Math.max(1, Math.min(6, writers.length))}
                warning={!writers.length ? 'No writers hired' : null}
                onClick={() => onGoTo('scripting')}
              />
              <DepartmentRoom
                kind="programming"
                icon="fa-solid fa-calendar-days"
                title="Programming Control"
                eyebrow="SCHEDULE + RATINGS"
                primary={`${Math.round((scheduled / totalSlots) * 100)}% filled`}
                secondary={`${scheduled} of ${totalSlots} slots`}
                people={2}
                warning={scheduled < totalSlots ? `${totalSlots - scheduled} open slots` : null}
                onClick={() => onGoTo('schedule')}
              />
              <DepartmentRoom
                kind="research"
                icon="fa-solid fa-flask"
                title="Format Lab"
                eyebrow="R&D + TECHNOLOGY"
                primary={researchActive ? `${researchActive} active` : 'Lab available'}
                secondary="Unlock formats and efficiency"
                people={researchActive ? 3 : 1}
                onClick={() => onGoTo('research')}
              />
            </div>

            <div className="hq-corridor">
              <span>PRODUCTION CORRIDOR</span>
              <div className="hq-corridor-lights"><i /><i /><i /><i /><i /><i /></div>
            </div>

            <div className="hq-stage-row">
              {[0, 1, 2].map(idx => (
                <SoundStage
                  key={idx}
                  index={idx}
                  program={producingByStudio(idx)}
                  onClick={() => onGoTo(['studio-alpha', 'studio-beta', 'studio-gamma'][idx])}
                />
              ))}
              <DepartmentRoom
                kind="talent"
                icon="fa-solid fa-star"
                title="Casting & Talent"
                eyebrow="CONTRACTS + CHEMISTRY"
                primary={`${talent.length} signed`}
                secondary="Build casts and lock stars"
                people={Math.max(1, Math.min(6, talent.length))}
                onClick={() => onGoTo('operations')}
              />
            </div>

            <PipelineBoard
              scripts={scripts}
              producing={producing}
              ready={ready}
              airing={airing}
              onGoTo={onGoTo}
            />
          </div>
        </main>

        <aside className="floorplan-sidebar hq-sidebar right">
          <RivalsPanel
            game={game}
            onOpenMarket={() => onGoTo('market')}
            onOpenHistory={() => onGoTo('history')}
            onOpenContent={() => onGoTo('content')}
          />
          <TonightBoard runsBySlot={runsBySlot} programs={programs} onGoTo={() => onGoTo('schedule')} />
        </aside>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }) {
  return <div className="hq-metric"><span>{label}</span><strong style={{ color: tone }}>{value}</strong></div>
}

function CrewBoard({ writers, talent, executives, onGoTo }) {
  return (
    <button className="hq-mini-panel" onClick={() => onGoTo('operations')}>
      <div className="hq-mini-title"><i className="fa-solid fa-users" /> Workforce</div>
      <div className="hq-crew-grid">
        <CrewStat label="Writers" value={writers} />
        <CrewStat label="Talent" value={talent} />
        <CrewStat label="Execs" value={executives} />
      </div>
      <div className="hq-mini-link">OPEN STAFF ROSTER →</div>
    </button>
  )
}
function CrewStat({ label, value }) { return <div><strong>{value}</strong><span>{label}</span></div> }

function DepartmentRoom({ kind, icon, title, eyebrow, primary, secondary, people = 2, warning, onClick }) {
  return (
    <button className={`hq-room hq-room-${kind}`} onClick={onClick}>
      <div className="hq-room-wall">
        <div className="hq-room-sign"><i className={icon} /> {title}</div>
        <div className="hq-room-window">
          <div className="hq-room-desks">
            {Array.from({ length: Math.min(6, people) }).map((_, i) => <PersonToken key={i} index={i} />)}
          </div>
          <div className="hq-room-prop"><i className={icon} /></div>
        </div>
      </div>
      <div className="hq-room-info">
        <span>{eyebrow}</span>
        <strong>{primary}</strong>
        <small>{secondary}</small>
        {warning && <em><i className="fa-solid fa-triangle-exclamation" /> {warning}</em>}
      </div>
    </button>
  )
}

function PersonToken({ index }) {
  return <span className="hq-person" style={{ '--delay': `${index * 0.17}s` }}><i /><b /></span>
}

function SoundStage({ index, program, onClick }) {
  const labels = ['ALPHA', 'BETA', 'GAMMA']
  const total = Math.max(1, program?.prodMonthsTotal || 1)
  const remain = program?.prodMonthsRemaining ?? total
  const pct = program ? Math.max(4, Math.min(100, ((total - remain) / total) * 100)) : 0
  const cat = CATEGORIES.find(c => c.id === program?.category)

  return (
    <button className={`hq-stage ${program ? 'busy' : 'idle'}`} onClick={onClick}>
      <div className="hq-stage-header">
        <span>SOUNDSTAGE {labels[index]}</span>
        <b>{program ? '● RECORDING' : '○ AVAILABLE'}</b>
      </div>
      <div className="hq-stage-space">
        {program ? (
          <>
            <ProgramArt program={program} compact showTitle={false} style={{ width: '48%', minWidth: 110, height: 104 }} />
            <div className="hq-stage-set">
              <div className="hq-camera"><i className="fa-solid fa-video" /></div>
              <div className="hq-stage-crew"><PersonToken index={0}/><PersonToken index={1}/><PersonToken index={2}/></div>
              <div className="hq-set-flat" />
            </div>
          </>
        ) : (
          <div className="hq-empty-stage">
            <i className="fa-solid fa-plus" />
            <strong>Start a production</strong>
            <span>Stage capacity is being wasted</span>
          </div>
        )}
      </div>
      <div className="hq-stage-footer">
        {program ? (
          <>
            <div className="hq-stage-copy"><strong>{program.name}</strong><span>{cat?.label || program.category || 'Program'} · {remain} mo left</span></div>
            <div className="hq-progress"><i style={{ width: `${pct}%` }} /></div>
          </>
        ) : <span>CLICK TO OPEN PRODUCTION BUILDER</span>}
      </div>
    </button>
  )
}

function PipelineBoard({ scripts, producing, ready, airing, onGoTo }) {
  const stages = [
    { label: 'Development', value: scripts.filter(s => s.status === 'drafting').length, icon: 'fa-pen-nib', go: 'scripting' },
    { label: 'Greenlit', value: scripts.filter(s => s.status === 'ready').length, icon: 'fa-file-circle-check', go: 'scripting' },
    { label: 'Filming', value: producing.length, icon: 'fa-clapperboard', go: 'studio-alpha' },
    { label: 'Ready', value: ready.length, icon: 'fa-box-archive', go: 'content' },
    { label: 'On Air', value: airing.length, icon: 'fa-tower-broadcast', go: 'schedule' },
  ]
  return (
    <div className="hq-pipeline">
      <div className="hq-pipeline-title">CONTENT PIPELINE</div>
      <div className="hq-pipeline-flow">
        {stages.map((s, i) => (
          <button key={s.label} onClick={() => onGoTo(s.go)} className={s.value ? 'active' : ''}>
            <i className={`fa-solid ${s.icon}`} />
            <strong>{s.value}</strong>
            <span>{s.label}</span>
            {i < stages.length - 1 && <b>›</b>}
          </button>
        ))}
      </div>
    </div>
  )
}

function TonightBoard({ runsBySlot, programs, onGoTo }) {
  const entries = Object.entries(runsBySlot || {}).filter(([, v]) => v)
  const top = entries.slice(0, 3)
  return (
    <button className="hq-mini-panel tonight" onClick={onGoTo}>
      <div className="hq-mini-title"><i className="fa-solid fa-tower-broadcast" /> Broadcast board</div>
      {top.length ? top.map(([slot, run]) => {
        const id = run?.programId || run?.showId || run?.id
        const p = programs.find(x => x.id === id)
        return <div className="hq-tonight-row" key={slot}><span>{slot}</span><strong>{p?.name || run?.name || 'Scheduled program'}</strong></div>
      }) : <div className="hq-empty-copy">No programs placed on the current grid.</div>}
      <div className="hq-mini-link">OPEN PROGRAMMING CONTROL →</div>
    </button>
  )
}

function countScheduledSlots(runsBySlot) {
  if (!runsBySlot) return 0
  return Object.values(runsBySlot).filter(Boolean).length
}
