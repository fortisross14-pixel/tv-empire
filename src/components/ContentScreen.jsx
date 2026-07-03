import { useState, useMemo } from 'react'
import { T, FONTS, R } from '../theme.js'
import { RetroRoomHero } from './RetroRoomHero.jsx'
import {
  CATEGORIES, MONTHS, SCRIPT_TIERS, MARKET_ORDER,
} from '../constants.js'
// Note: HTag/SectionTitle/Card from ./ui.jsx removed in stage AN — replaced
// with editorial SectionHead + gradient surfaces. Anton sub-tabs replaced
// with the OpsSubTab pattern. The dead WritersTab function (writers are
// managed in Operations/Talent) was dropped entirely.
import {
  findWriter, findIP, findLeague, findMovie,
  activeIPLicenses, fmtM, r1,
  getUnlocks,
} from '../engine.js'
import { ProductionView } from './ProductionView.jsx'

const SUB_TABS = [
  { id: 'production', label: 'Production' },
  { id: 'scripts',    label: 'Scripts' },
]

export function ContentScreen({
  station, marketRoster, year, monthIdx, research,
  onHireWriter, onFireWriter,
  onBeginScript, onRefreshScript, onArchiveScript, onDeleteScript,
  onBeginProgram, onCancelProgram,
  onBack,
  initialSub = 'production',    // Stage AS: allow Writers Room to open at Scripts tab
}) {
  const [sub, setSub] = useState(initialSub)
  const activeTab = SUB_TABS.find(t => t.id === sub)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 48px' }}>
      {/* ─── RETRO HERO ─── */}
      <RetroRoomHero
        iconClass={sub === 'scripts' ? 'fa-solid fa-feather' : 'fa-solid fa-clapperboard'}
        eyebrow={`Content · ${activeTab?.label || ''}`}
        title={sub === 'scripts' ? 'Writers Room' : 'Content'}
        subtitle={sub === 'scripts'
          ? 'Commission scripts. Track drafts. Ready pool to produce.'
          : 'Scripts in development. Productions in the can. What\'s on the shelf, on the air.'}
        accent={sub === 'scripts' ? R.gold : R.viewers}
        onBack={onBack}
      />

      {/* Sub-tabs — retro style */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24,
        padding: 4,
        background: 'rgba(15, 23, 42, 0.6)',
        border: `1px solid ${R.border}44`,
        borderRadius: 10,
        maxWidth: 400,
      }}>
        {SUB_TABS.map(t => (
          <RetroSubTab key={t.id}
            label={t.label}
            iconClass={t.id === 'scripts' ? 'fa-solid fa-feather' : 'fa-solid fa-clapperboard'}
            active={sub === t.id}
            onClick={() => setSub(t.id)}
          />
        ))}
      </div>

      {sub === 'production' && (
        <ProductionTab
          station={station}
          year={year}
          monthIdx={monthIdx}
          research={research}
          onBeginProgram={onBeginProgram}
          onCancelProgram={onCancelProgram}
        />
      )}
      {sub === 'scripts' && (
        <ScriptsTab
          station={station}
          year={year}
          research={research}
          onBeginScript={onBeginScript}
          onRefreshScript={onRefreshScript}
          onArchiveScript={onArchiveScript}
          onDeleteScript={onDeleteScript}
        />
      )}
    </div>
  )
}

/** Quiet "← Back" text-link. Same as Operations. */
function RetroSubTab({ label, iconClass, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        flex: 1,
        background: active
          ? `linear-gradient(to bottom, ${R.gold}22, ${R.gold}0a)`
          : (hover ? 'rgba(255,255,255,0.04)' : 'transparent'),
        border: `1px solid ${active ? R.gold + '77' : 'transparent'}`,
        color: active ? R.gold : (hover ? R.text : R.textDim),
        fontFamily: 'Oswald, Impact, system-ui',
        fontSize: 12, fontWeight: 700,
        letterSpacing: 1.5, textTransform: 'uppercase',
        padding: '9px 14px',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8,
        transition: 'all 0.15s',
      }}
    >
      <i className={iconClass} style={{ fontSize: 12 }} />
      <span>{label}</span>
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

/** "+ New Production" / "+ New Script" — outline-fills accent button. */
function NewButton({ onClick, disabled, children }) {
  const [hover, setHover] = useState(false)
  if (disabled) {
    return (
      <span className="mono" style={{
        fontSize: 11, color: T.muted, fontWeight: 700,
        padding: '10px 16px', borderRadius: 4,
        background: T.surface, border: `1px dashed ${T.border}`,
        letterSpacing: '.14em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{children}</span>
    )
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? T.accent : 'transparent',
        color: hover ? T.bg : T.accent,
        border: `1px solid ${T.accent}`,
        padding: '10px 16px', borderRadius: 4,
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase',
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background .15s, color .15s',
      }}
    >{children}</button>
  )
}

// ─── PRODUCTION TAB ──────────────────────────────────────────────────
function ProductionTab({ station, year, monthIdx, research, onBeginProgram, onCancelProgram }) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [filter, setFilter] = useState('active')
  // Cancel-confirm modal — replaces window.confirm
  const [cancelTarget, setCancelTarget] = useState(null)

  const programs = station.programs || []
  const producing = programs.filter(p => p.status === 'producing')
  const shelf     = programs.filter(p => p.status === 'shelf')
  const airing    = programs.filter(p => p.status === 'airing')
  const finished  = programs.filter(p => p.status === 'finished')

  const filtered = useMemo(() => {
    if (filter === 'producing') return producing
    if (filter === 'shelf')     return shelf
    if (filter === 'airing')    return airing
    if (filter === 'finished')  return finished
    // 'active' = everything except finished
    return [...producing, ...shelf, ...airing]
  }, [filter, programs])

  return (
    <>
      <SectionHead title="Productions" meta={`${programs.length} total`} />

      {/* Header bar — new button left, filter chips right */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${T.border}`,
      }}>
        <NewButton onClick={() => setShowBuilder(true)}>+ New Production</NewButton>
        <div style={{ flex: 1 }} />
        <span className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase',
        }}>Filter</span>
        <Chip label={`Active (${producing.length + shelf.length + airing.length})`}
          active={filter === 'active'} onClick={() => setFilter('active')} />
        <Chip label={`Producing (${producing.length})`}
          active={filter === 'producing'} onClick={() => setFilter('producing')} />
        <Chip label={`Shelf (${shelf.length})`}
          active={filter === 'shelf'} onClick={() => setFilter('shelf')} />
        <Chip label={`Airing (${airing.length})`}
          active={filter === 'airing'} onClick={() => setFilter('airing')} />
        <Chip label={`Done (${finished.length})`}
          active={filter === 'finished'} onClick={() => setFilter('finished')} />
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: T.surface, border: `1px dashed ${T.borderHi}`,
          borderRadius: 6, padding: '32px 24px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 500",
            fontStyle: 'italic',
            fontSize: 16, color: T.textDim, marginBottom: 6,
          }}>
            {programs.length === 0
              ? 'Nothing in production yet.'
              : `No programs ${filter !== 'active' ? `in "${filter}"` : 'active'}.`}
          </div>
          {programs.length === 0 && (
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
              Tap <span className="mono" style={{ fontSize: 11.5, color: T.text }}>+ New Production</span> to build your first show.
            </div>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 10,
        }}>
          {filtered.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              onCancel={() => {
                if (p.status === 'producing' || p.status === 'shelf') setCancelTarget(p)
              }}
            />
          ))}
        </div>
      )}

      {showBuilder && (
        <ProductionView
          station={station}
          research={research}
          year={year}
          monthIdx={monthIdx}
          onBegin={(opts) => { onBeginProgram(opts); setShowBuilder(false) }}
          onClose={() => setShowBuilder(false)}
        />
      )}

      {cancelTarget && (
        <ConfirmModal
          title={cancelTarget.status === 'producing' ? 'Cancel production?' : 'Discard program?'}
          message={cancelTarget.status === 'producing'
            ? `Cancel "${cancelTarget.name}"? You won't get the upfront cost back.`
            : `Discard "${cancelTarget.name}"? This cannot be undone.`}
          confirmLabel={cancelTarget.status === 'producing' ? 'Cancel production' : 'Discard'}
          onConfirm={() => { onCancelProgram(cancelTarget.id); setCancelTarget(null) }}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  )
}

function ProgramCard({ program: p, onCancel }) {
  const cat = CATEGORIES[p.categoryId]
  const movie = p.movieId ? findMovie(p.movieId) : null
  const league = p.sportsLeagueId ? findLeague(p.sportsLeagueId) : null
  const catColor = cat?.color || T.accent

  const statusColor =
    p.status === 'producing' ? T.accent :
    p.status === 'shelf'     ? T.green :
    p.status === 'airing'    ? T.gold :
                               T.muted
  const statusLabel =
    p.status === 'producing' ? `Producing · ${p.prodMonthsRemaining}/${p.prodMonthsTotal} mo` :
    p.status === 'shelf'     ? 'On shelf' :
    p.status === 'airing'    ? `Airing · ${p.airingsCount}×` :
                               'Finished'

  const showTrue = p.revealed || p.status === 'finished' || p.status === 'airing'
  const slugline = movie ? 'Movie · licensed feature'
                : league ? `${league.label} · live coverage`
                :          (cat?.label || p.categoryId || 'Program')

  return (
    <div style={{
      padding: 14,
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${catColor}`,
      borderRadius: 5,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header — name + status pill */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 10, marginBottom: 8,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 600",
            fontSize: 16.5, color: T.text, letterSpacing: '-.01em',
            marginBottom: 3,
          }}>
            {p.name}
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 12, color: T.muted, lineHeight: 1.4,
          }}>
            {slugline}
          </div>
        </div>
        <span className="mono" style={{
          fontSize: 9, color: statusColor, fontWeight: 700,
          padding: '3px 8px', borderRadius: 3,
          background: statusColor + '14',
          border: `1px solid ${statusColor}66`,
          letterSpacing: '.12em', textTransform: 'uppercase',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>{statusLabel}</span>
      </div>

      {/* Stats row — mono pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <StatPill label={showTrue ? 'Q' : 'Q est'} color={T.qEnd}
          value={showTrue ? p.trueQ.toFixed(1) : `${p.estQRange[0]}–${p.estQRange[1]}`} />
        <StatPill label={showTrue ? 'H' : 'H est'} color={T.gold}
          value={showTrue ? p.trueH.toFixed(1) : `${p.estHRange[0]}–${p.estHRange[1]}`} />
        {p.airingsCount > 0 && (
          <StatPill color={T.teal} bare value={`${p.totalAudience.toFixed(1)}M AUD`} />
        )}
      </div>

      {/* Cost line */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: showTrue && !p.movieId && p.components ? 10 : 0,
        fontSize: 11,
      }}>
        <div>
          <div className="mono" style={{
            fontSize: 9, color: T.muted, fontWeight: 700,
            letterSpacing: '.14em', textTransform: 'uppercase',
          }}>Sunk</div>
          <div className="mono" style={{
            fontSize: 12, color: T.text, fontWeight: 700, marginTop: 2, letterSpacing: '-.005em',
          }}>{fmtM(p.totalCost)}</div>
        </div>
        {p.status === 'airing' && (
          <div>
            <div className="mono" style={{
              fontSize: 9, color: T.muted, fontWeight: 700,
              letterSpacing: '.14em', textTransform: 'uppercase',
            }}>Earned</div>
            <div className="mono" style={{
              fontSize: 12, color: T.green, fontWeight: 700, marginTop: 2, letterSpacing: '-.005em',
            }}>{fmtM(p.totalRevenue)}</div>
          </div>
        )}
      </div>

      {/* Component bars — revealed non-movies */}
      {showTrue && !p.movieId && p.components && (
        <div style={{
          marginTop: 6, paddingTop: 10, borderTop: `1px solid ${T.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
        }}>
          <CompBar label="Narr"  value={p.components.narrative}  color={T.purple || T.accent} />
          <CompBar label="Art"   value={p.components.art}        color={T.pink || T.gold} />
          <CompBar label="Innov" value={p.components.innovation} color={T.teal} />
          <CompBar label="Tech"  value={p.components.technical}  color={T.green} />
        </div>
      )}

      {/* Review quote — italic-serif pull-quote */}
      {showTrue && p.review && (
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: T.surface,
          borderLeft: `2px solid ${T.gold}55`,
          borderRadius: 3,
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 12.5, color: T.textDim, lineHeight: 1.5,
        }}>
          "{p.review.quote}"
        </div>
      )}

      {/* Cancel button — pushed to bottom */}
      {(p.status === 'producing' || p.status === 'shelf') && (
        <button
          onClick={onCancel}
          className="danger-btn"
          style={{
            marginTop: 'auto', paddingTop: 10,
          }}
        >
          {p.status === 'producing' ? 'Cancel production' : 'Discard'}
        </button>
      )}
    </div>
  )
}

function StatPill({ label, value, color, bare, emphatic }) {
  const c = color || T.text
  return (
    <span className="mono" style={{
      fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em',
      padding: '2px 8px', borderRadius: 3,
      background: emphatic ? c + '18' : (color ? c + '12' : 'transparent'),
      color: c,
      border: `1px solid ${color ? c + '55' : T.border}`,
    }}>
      {label && <span style={{ opacity: 0.7, marginRight: 3 }}>{label}</span>}
      {value}
    </span>
  )
}

function CompBar({ label, value, color }) {
  const v = Math.max(0, Math.min(10, value || 0))
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span className="mono" style={{
          fontSize: 9, color: T.muted, letterSpacing: '.12em',
          textTransform: 'uppercase',
        }}>{label}</span>
        <span className="mono" style={{
          fontSize: 10.5, color: T.text, fontWeight: 600,
        }}>{v.toFixed(1)}</span>
      </div>
      <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${(v / 10) * 100}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}aa 0%, ${color} 100%)`,
          transition: 'width .5s',
        }} />
      </div>
    </div>
  )
}

// ─── SCRIPTS TAB ─────────────────────────────────────────────────────
function ScriptsTab({ station, year, research, onBeginScript, onRefreshScript, onArchiveScript, onDeleteScript }) {
  const scripts = station.scripts || []
  const writers = station.hiredWriters || []
  const [filter, setFilter] = useState('all') // all|ready|drafting|archived
  const [showNew, setShowNew] = useState(false)
  // Delete-confirm modal — replaces window.confirm
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return scripts.filter(s => s.status !== 'archived')
    return scripts.filter(s => s.status === filter)
  }, [scripts, filter])

  const ready    = scripts.filter(s => s.status === 'ready').length
  const drafting = scripts.filter(s => s.status === 'drafting').length
  const archived = scripts.filter(s => s.status === 'archived').length

  return (
    <>
      <SectionHead title="Scripts" meta={`${scripts.length} total`} />

      {/* Header bar */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${T.border}`,
      }}>
        <NewButton onClick={() => setShowNew(true)} disabled={writers.length === 0}>
          + New Script
        </NewButton>
        <div style={{ flex: 1 }} />
        <span className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase',
        }}>Filter</span>
        <Chip label={`All (${scripts.filter(s => s.status !== 'archived').length})`}
          active={filter === 'all'} onClick={() => setFilter('all')} />
        <Chip label={`Ready (${ready})`}
          active={filter === 'ready'} onClick={() => setFilter('ready')} />
        <Chip label={`Drafting (${drafting})`}
          active={filter === 'drafting'} onClick={() => setFilter('drafting')} />
        <Chip label={`Archived (${archived})`}
          active={filter === 'archived'} onClick={() => setFilter('archived')} />
      </div>

      {/* No-writers gate */}
      {writers.length === 0 && (
        <div style={{
          marginBottom: 20, padding: '20px 22px',
          background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
          border: `1px solid ${T.red}44`,
          borderLeft: `3px solid ${T.red}`,
          borderRadius: 6,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
            textTransform: 'uppercase', color: T.red, marginBottom: 10,
          }}>
            No writers on staff
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 500",
            fontStyle: 'italic',
            fontSize: 16, color: T.text, marginBottom: 6, lineHeight: 1.3,
          }}>
            Hire a writer first.
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 13, color: T.textDim, lineHeight: 1.55,
          }}>
            Open <span className="mono" style={{ fontStyle: 'normal', fontSize: 11.5, color: T.text }}>Operations → Talent</span> to sign a writer before commissioning scripts.
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && writers.length > 0 && (
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
            No scripts {filter !== 'all' ? `in "${filter}"` : 'yet'}.
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 10,
      }}>
        {filtered.map(s => (
          <ScriptCard
            key={s.id}
            script={s}
            anyFreeWriter={writers.some(h => !scripts.some(x => x.writerId === h.talentId && x.status === 'drafting'))}
            onRefresh={() => onRefreshScript(s.id)}
            onArchive={() => onArchiveScript(s.id)}
            onDelete={() => setDeleteTarget(s)}
          />
        ))}
      </div>

      {showNew && (
        <NewScriptModal
          station={station}
          year={year}
          research={research}
          onCancel={() => setShowNew(false)}
          onConfirm={(opts) => { onBeginScript(opts); setShowNew(false) }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete script?"
          message={`Permanently delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete script"
          onConfirm={() => { onDeleteScript(deleteTarget.id); setDeleteTarget(null) }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

function ScriptCard({ script: s, anyFreeWriter, onRefresh, onArchive, onDelete }) {
  const writer = findWriter(s.writerId)
  const ip = s.ipId ? findIP(s.ipId) : null
  const cat = CATEGORIES[s.categoryId]
  const topic = cat?.topics.find(t => t.id === s.topicId)
  const catColor = cat?.color || T.accent

  const statusColor =
    s.status === 'ready'    ? T.green :
    s.status === 'drafting' ? T.accent :
                              T.muted
  const statusLabel =
    s.status === 'drafting' ? (s.refreshing ? `Refreshing · ${s.monthsRemaining} mo` : `Drafting · ${s.monthsRemaining} mo`) :
    s.status === 'ready'    ? 'Ready' :
                              'Archived'

  // Hype color based on bucket
  const hypeColor = s.hype < 25 ? T.red : s.hype < 50 ? T.gold : T.green

  return (
    <div style={{
      padding: 14,
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${s.status === 'ready' ? T.green : catColor}`,
      borderRadius: 5,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 10, marginBottom: 8,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 600",
            fontSize: 16.5, color: T.text, letterSpacing: '-.01em',
            marginBottom: 3,
          }}>
            {s.name}
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 12, color: T.muted, lineHeight: 1.4,
          }}>
            {cat?.label} · {topic?.label || s.topicId}
            {ip && (
              <span className="mono" style={{
                fontStyle: 'normal', color: T.gold,
                fontSize: 10, fontWeight: 700,
                marginLeft: 8, letterSpacing: '.1em',
              }}>· {ip.name.toUpperCase()}</span>
            )}
          </div>
        </div>
        <span className="mono" style={{
          fontSize: 9, color: statusColor, fontWeight: 700,
          padding: '3px 8px', borderRadius: 3,
          background: statusColor + '14',
          border: `1px solid ${statusColor}66`,
          letterSpacing: '.12em', textTransform: 'uppercase',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>{statusLabel}</span>
      </div>

      {/* Writer + tier callout */}
      <div style={{
        fontSize: 11.5, color: T.textDim,
        marginBottom: s.status !== 'drafting' ? 10 : 12,
      }}>
        <span className="mono" style={{
          fontSize: 9, color: T.muted, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase', marginRight: 6,
        }}>Writer</span>
        <span style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 24, 'wght' 600",
          fontSize: 13, color: T.text,
        }}>{writer?.name || '?'}</span>
        {s.tier && s.tier !== 'normal' && (
          <span className="mono" style={{
            fontSize: 9, color: T.gold, fontWeight: 700,
            padding: '1px 6px', borderRadius: 3,
            background: T.gold + '14', border: `1px solid ${T.gold}55`,
            letterSpacing: '.12em', textTransform: 'uppercase',
            marginLeft: 8,
          }}>{s.tier}</span>
        )}
      </div>

      {/* Quality + hype — only for non-drafting */}
      {s.status !== 'drafting' && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, marginBottom: 10,
        }}>
          <div>
            <div className="mono" style={{
              fontSize: 9, color: T.muted, fontWeight: 700,
              letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 3,
            }}>Quality</div>
            <div style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 96, 'wght' 600",
              fontSize: 22, color: T.text, letterSpacing: '-.025em', lineHeight: 1,
            }}>
              {s.baseQuality.toFixed(1)}
            </div>
          </div>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 5,
            }}>
              <div className="mono" style={{
                fontSize: 9, color: T.muted, fontWeight: 700,
                letterSpacing: '.14em', textTransform: 'uppercase',
              }}>
                Hype {s.timesUsed > 0 && (
                  <span style={{ color: T.muted, fontWeight: 500, marginLeft: 4 }}>
                    · {s.timesUsed} use{s.timesUsed > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span className="mono" style={{
                fontSize: 11, color: T.text, fontWeight: 700,
              }}>
                {Math.round(s.hype)}
              </span>
            </div>
            <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${s.hype}%`, height: '100%',
                background: `linear-gradient(90deg, ${hypeColor}aa 0%, ${hypeColor} 100%)`,
                transition: 'width .5s',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Actions — pushed to bottom */}
      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
        {s.status === 'ready' && (
          <>
            <ActionButton
              variant="primary"
              disabled={!anyFreeWriter}
              title={anyFreeWriter ? `Refresh hype to ${s.originalHype.toFixed(0)}` : 'All writers busy'}
              onClick={onRefresh}
            >
              Refresh
            </ActionButton>
            <ActionButton variant="secondary" onClick={onArchive}>
              Archive
            </ActionButton>
          </>
        )}
        {s.status === 'drafting' && (
          <ActionButton variant="secondary" onClick={onArchive}>
            Cancel draft
          </ActionButton>
        )}
        {s.status === 'archived' && (
          <button onClick={onDelete} className="danger-btn" style={{ flex: 1 }}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

/** Action button — primary (outline-fills accent) or secondary (outline-only muted). */
function ActionButton({ variant, disabled, title, onClick, children }) {
  const [hover, setHover] = useState(false)
  const isPrimary = variant === 'primary'

  if (disabled) {
    return (
      <span title={title} className="mono" style={{
        flex: 1, padding: '6px 10px', textAlign: 'center',
        background: T.surface, border: `1px dashed ${T.border}`,
        color: T.muted, fontSize: 10, fontWeight: 700,
        letterSpacing: '.14em', textTransform: 'uppercase', borderRadius: 3,
      }}>
        {children}
      </span>
    )
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      style={{
        flex: 1,
        background: isPrimary && hover ? T.accent : 'transparent',
        color: isPrimary
          ? (hover ? T.bg : T.accent)
          : (hover ? T.text : T.muted),
        border: `1px solid ${
          isPrimary ? T.accent : (hover ? T.borderHi : T.border)
        }`,
        padding: '6px 10px', borderRadius: 3,
        fontFamily: FONTS.sans,
        fontSize: 10, fontWeight: 700, letterSpacing: '.14em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background .15s, color .15s, border-color .15s',
      }}
    >{children}</button>
  )
}

// ─── NEW SCRIPT MODAL ────────────────────────────────────────────────
function NewScriptModal({ station, year, research, onCancel, onConfirm }) {
  const writers = station.hiredWriters || []
  const scripts = station.scripts || []
  const busyIds = new Set(scripts.filter(s => s.status === 'drafting').map(s => s.writerId))

  const unlocks = useMemo(() => getUnlocks(station, research), [station.focus, research?.contentUnlocks])
  const unlockedCategoryIds = useMemo(
    () => Object.keys(CATEGORIES).filter(id => id !== 'movie' && unlocks.hasCat(id)),
    [unlocks]
  )

  const initialWriterId = writers.find(h => !busyIds.has(h.talentId))?.talentId || writers[0]?.talentId || ''
  const [writerId, setWriterId] = useState(initialWriterId)

  const writer = findWriter(writerId)
  const defaultCat =
    writer?.specialty && unlocks.hasCat(writer.specialty) ? writer.specialty :
    (unlockedCategoryIds[0] || 'series')
  const [categoryId, setCategoryId] = useState(defaultCat)

  const cat = CATEGORIES[categoryId]
  const unlockedTopics = (cat?.topics || []).filter(t => unlocks.hasTopic(categoryId, t.id))
  const [topicId, setTopicId] = useState(unlockedTopics[0]?.id || '')
  const [ipId, setIpId] = useState(null)
  const [name, setName] = useState('')

  const ownedIps = activeIPLicenses(station, year)
    .map(lic => findIP(lic.ipId)).filter(Boolean)
    .filter(ip => (ip.fits || []).includes(categoryId))

  const unlockedTierIds = useMemo(() => {
    const set = new Set(research?.scriptTiersUnlocked || [])
    set.add('normal')
    return set
  }, [research])
  const [tier, setTier] = useState('normal')
  const tierDef = SCRIPT_TIERS.find(t => t.id === tier) || SCRIPT_TIERS[0]
  const tierCost = writer ? r1((writer.cost || 0) * (tierDef.costMult || 1)) : 0
  const canAffordTier = station.cash >= tierCost

  const onCatChange = (newCat) => {
    setCategoryId(newCat)
    const nc = CATEGORIES[newCat]
    const topics = (nc?.topics || []).filter(t => unlocks.hasTopic(newCat, t.id))
    setTopicId(topics[0]?.id || '')
    setIpId(null)
  }

  const writerBusy = busyIds.has(writerId)
  const canSubmit = writerId && categoryId && topicId && name.trim().length >= 2 && !writerBusy && canAffordTier

  if (unlockedCategoryIds.length === 0) {
    return (
      <EditorialModal onClose={onCancel} title="Commission script">
        <div style={{
          padding: '20px 22px',
          background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
          border: `1px solid ${T.red}44`,
          borderLeft: `3px solid ${T.red}`,
          borderRadius: 6,
          marginBottom: 18,
        }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 500",
            fontStyle: 'italic',
            fontSize: 16, color: T.text, marginBottom: 8, lineHeight: 1.3,
          }}>
            No content categories unlocked yet.
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 13, color: T.textDim, lineHeight: 1.55,
          }}>
            Open <span className="mono" style={{ fontStyle: 'normal', fontSize: 11.5, color: T.text }}>Research</span> to unlock categories and topics before commissioning a script.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SecondaryButton onClick={onCancel}>Close</SecondaryButton>
        </div>
      </EditorialModal>
    )
  }

  return (
    <EditorialModal onClose={onCancel} title="Commission script">
      <EditorialField label="Title">
        <EditorialInput
          value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. The Last Frontier"
          maxLength={48}
        />
      </EditorialField>

      <EditorialField label="Writer">
        <EditorialSelect value={writerId} onChange={e => setWriterId(e.target.value)}>
          {writers.map(h => {
            const w = findWriter(h.talentId)
            if (!w) return null
            const busy = busyIds.has(w.id)
            return (
              <option key={w.id} value={w.id} disabled={busy}>
                {w.name} · {w.tier} · {CATEGORIES[w.specialty]?.label}{busy ? ' (busy)' : ''}
              </option>
            )
          })}
        </EditorialSelect>
        {writer && (
          <FieldNote tone={!unlocks.hasCat(writer.specialty) ? 'gold' : 'muted'}>
            Skill <span className="mono" style={{ fontStyle: 'normal' }}>{(writer.skill * 100).toFixed(0)}</span> · best in {CATEGORIES[writer.specialty]?.label}
            {!unlocks.hasCat(writer.specialty) && ' — their specialty isn\'t unlocked yet'}
          </FieldNote>
        )}
      </EditorialField>

      <EditorialField label="Category">
        <EditorialSelect value={categoryId} onChange={e => onCatChange(e.target.value)}>
          {unlockedCategoryIds.map(id => {
            const c = CATEGORIES[id]
            return <option key={id} value={id}>{c.icon} {c.label}</option>
          })}
        </EditorialSelect>
        {writer && writer.specialty !== categoryId && (
          <FieldNote tone="gold">
            Off-specialty — quality and hype will be reduced.
          </FieldNote>
        )}
      </EditorialField>

      <EditorialField label="Topic">
        <EditorialSelect value={topicId} onChange={e => setTopicId(e.target.value)}>
          {unlockedTopics.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </EditorialSelect>
        {unlockedTopics.length < (cat?.topics?.length || 0) && (
          <FieldNote tone="muted">
            {(cat?.topics?.length || 0) - unlockedTopics.length} more topic{unlockedTopics.length === (cat?.topics?.length || 0) - 1 ? '' : 's'} locked — visit Research to unlock.
          </FieldNote>
        )}
      </EditorialField>

      <EditorialField label={`IP${ownedIps.length === 0 ? ' · no compatible IPs licensed' : ' · optional'}`}>
        <EditorialSelect value={ipId || ''} onChange={e => setIpId(e.target.value || null)}>
          <option value="">— None (original) —</option>
          {ownedIps.map(ip => (
            <option key={ip.id} value={ip.id}>{ip.name} ({ip.tier})</option>
          ))}
        </EditorialSelect>
      </EditorialField>

      <EditorialField label="Script tier">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SCRIPT_TIERS.map(t => {
            const unlocked = unlockedTierIds.has(t.id)
            const isActive = tier === t.id
            let lockReason = null
            if (!unlocked) {
              const marketOk = !t.requiresMarket
                || MARKET_ORDER.indexOf(station.market) >= MARKET_ORDER.indexOf(t.requiresMarket)
              lockReason = !marketOk
                ? `Needs ${t.requiresMarket} market`
                : 'Needs research'
            }
            return (
              <TierPickerButton
                key={t.id}
                tier={t}
                isActive={isActive}
                unlocked={unlocked}
                lockReason={lockReason}
                onClick={() => unlocked && setTier(t.id)}
              />
            )
          })}
        </div>
        <FieldNote tone="muted" style={{ marginTop: 8 }}>
          {tierDef.desc}
        </FieldNote>
      </EditorialField>

      {/* Cost summary */}
      <div style={{
        padding: '12px 14px', marginBottom: 16,
        background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
      }}>
        <SummaryStat label="Duration" value={`${tierDef.months} mo`} />
        <SummaryStat label="Cost"     value={fmtM(tierCost)} color={canAffordTier ? T.text : T.red} />
        <SummaryStat label="Q cap"    value={tierDef.qCap.toFixed(1)} />
        <SummaryStat label="H cap"    value={String(tierDef.hCap)} />
      </div>

      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 12, color: T.muted, lineHeight: 1.55, marginBottom: 16,
      }}>
        Writer is locked until the script ships. Each later use drops hype 20%.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <PrimaryButton
          onClick={() => canSubmit && onConfirm({ writerId, name: name.trim(), categoryId, topicId, ipId, tier })}
          disabled={!canSubmit}
        >
          {writerBusy ? 'Writer busy'
            : !canAffordTier ? `Need ${fmtM(tierCost)}`
            : `Begin ${tierDef.label} draft`}
        </PrimaryButton>
      </div>
    </EditorialModal>
  )
}

// ─── SHARED EDITORIAL FORM PRIMITIVES ─────────────────────────────────

function EditorialModal({ children, onClose, title }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
          border: `1px solid ${T.borderHi}`,
          borderRadius: 6,
          padding: '24px 26px',
          width: '100%',
          maxWidth: 460,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {title && (
          <>
            <div style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '.2em',
              textTransform: 'uppercase', color: '#f0c14b', marginBottom: 6,
            }}>
              <i className="fa-solid fa-feather" style={{ marginRight: 6 }} />
              Script
            </div>
            <h2 style={{
              fontFamily: 'Oswald, Impact, system-ui',
              fontSize: 24, fontWeight: 700, lineHeight: 1.05, letterSpacing: 1,
              color: '#fff', marginBottom: 20, textTransform: 'uppercase',
            }}>
              {title}
            </h2>
          </>
        )}
        {children}
      </div>
    </div>
  )
}

function EditorialField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="mono" style={{
        display: 'block', marginBottom: 6,
        fontSize: 9.5, color: T.muted, fontWeight: 700,
        letterSpacing: '.16em', textTransform: 'uppercase',
      }}>{label}</label>
      {children}
    </div>
  )
}

function EditorialInput({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 4,
        color: T.text,
        padding: '9px 11px',
        fontSize: 13,
        fontFamily: FONTS.sans,
        boxSizing: 'border-box',
        outline: 'none',
      }}
    />
  )
}

/** Native <select> styled to match the editorial system. We keep the
 *  native dropdown for accessibility and reliable touch behavior — only
 *  the trigger is restyled. */
function EditorialSelect({ children, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        {...props}
        style={{
          width: '100%',
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          color: T.text,
          padding: '9px 30px 9px 11px',
          fontSize: 13,
          fontFamily: FONTS.sans,
          boxSizing: 'border-box',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      {/* Custom chevron — pointer-events none so click reaches the select */}
      <span style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)',
        color: T.muted, fontSize: 12,
        pointerEvents: 'none',
      }}>▾</span>
    </div>
  )
}

/** Inline note beneath a field. Tone: muted | gold | red. */
function FieldNote({ children, tone = 'muted', style }) {
  const color = tone === 'gold' ? T.gold : tone === 'red' ? T.red : T.muted
  return (
    <div style={{
      marginTop: 6,
      fontFamily: FONTS.serif,
      fontVariationSettings: "'opsz' 14, 'wght' 400",
      fontStyle: 'italic',
      fontSize: 12, color, lineHeight: 1.5,
      ...(style || {}),
    }}>
      {children}
    </div>
  )
}

/** Tier picker button — used for script tiers. Active = accent border,
 *  filled background. Locked = dashed, lower opacity, red lock reason. */
function TierPickerButton({ tier, isActive, unlocked, lockReason, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={!unlocked}
      style={{
        background: isActive
          ? T.accent + '18'
          : (hover && unlocked
              ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
              : T.surface),
        border: isActive
          ? `1px solid ${T.accent}`
          : `1px ${unlocked ? 'solid' : 'dashed'} ${unlocked ? (hover ? T.borderHi : T.border) : T.border}`,
        borderRadius: 5,
        padding: '10px 10px',
        cursor: unlocked ? 'pointer' : 'not-allowed',
        opacity: unlocked ? 1 : 0.55,
        textAlign: 'left',
        color: T.text,
        fontFamily: FONTS.sans,
        transition: 'background .15s, border-color .15s',
      }}
    >
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 24, 'wght' 600",
        fontSize: 14, letterSpacing: '-.005em',
        color: isActive ? T.accent : T.text,
        marginBottom: 5,
      }}>
        {tier.label}
      </div>
      <div className="mono" style={{
        fontSize: 9.5, color: T.muted, fontWeight: 600,
        letterSpacing: '.04em', lineHeight: 1.4,
      }}>
        {tier.months}mo · ×{tier.costMult.toFixed(1)} cost<br/>
        Q≤{tier.qCap.toFixed(1)} · H≤{tier.hCap}
      </div>
      {lockReason && (
        <div className="mono" style={{
          marginTop: 6, fontSize: 9, color: T.red, fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase',
        }}>
          🔒 {lockReason}
        </div>
      )}
    </button>
  )
}

function SummaryStat({ label, value, color }) {
  return (
    <div>
      <div className="mono" style={{
        fontSize: 9, color: T.muted, fontWeight: 700,
        letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 3,
      }}>{label}</div>
      <div className="mono" style={{
        fontSize: 13, color: color || T.text, fontWeight: 700,
        letterSpacing: '-.005em',
      }}>{value}</div>
    </div>
  )
}

function PrimaryButton({ onClick, disabled, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, padding: '11px 14px',
        background: disabled ? T.surface : (hover ? T.accentHi : T.accent),
        color: disabled ? T.muted : T.bg,
        border: disabled ? `1px dashed ${T.border}` : 'none',
        borderRadius: 4,
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .15s',
      }}
    >{children}</button>
  )
}

function SecondaryButton({ onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, padding: '11px 14px',
        background: 'transparent',
        color: hover ? T.text : T.muted,
        border: `1px solid ${hover ? T.borderHi : T.border}`,
        borderRadius: 4,
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'color .15s, border-color .15s',
      }}
    >{children}</button>
  )
}

// ─── CONFIRM MODAL ───────────────────────────────────────────────────
// Used for cancel-production and delete-script — replaces window.confirm.
// Same vocabulary as FireStaffConfirm from Operations.
function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }) {
  return (
    <EditorialModal onClose={onClose} title={title}>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 14, color: T.textDim, lineHeight: 1.55, marginBottom: 22,
      }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <SecondaryButton onClick={onClose}>Keep</SecondaryButton>
        <button onClick={onConfirm} className="danger-btn" style={{ flex: 1 }}>
          {confirmLabel}
        </button>
      </div>
    </EditorialModal>
  )
}
