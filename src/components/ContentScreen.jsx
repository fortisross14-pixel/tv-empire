import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, WRITERS_CAP, FIRE_PENALTY_MULT, MONTHS,
} from '../constants.js'
import { HTag, SectionTitle, Card } from './ui.jsx'
import {
  findWriter, findIP, findLeague, findMovie,
  activeWriters, activeIPLicenses, fmtM, r1,
  getUnlocks,
} from '../engine.js'
import { ProductionView } from './ProductionView.jsx'

const SUB_TABS = [
  { id: 'production', label: 'Production' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'writers', label: 'Writers' },
]

export function ContentScreen({
  station, marketRoster, year, monthIdx, research,
  onHireWriter, onFireWriter,
  onBeginScript, onRefreshScript, onArchiveScript, onDeleteScript,
  onBeginProgram, onCancelProgram,
  onBack,
}) {
  const [sub, setSub] = useState('production')

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 14 }}>
      {/* Sub-tabs */}
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
      {sub === 'writers' && (
        <WritersTab
          station={station}
          marketWriters={marketRoster?.writers || []}
          onHireWriter={onHireWriter}
          onFireWriter={onFireWriter}
        />
      )}
    </div>
  )
}

// ─── PRODUCTION TAB ───────────────────────────────────────────────────────────
function ProductionTab({ station, year, monthIdx, research, onBeginProgram, onCancelProgram }) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [filter, setFilter] = useState('active')

  const programs = station.programs || []
  const producing = programs.filter(p => p.status === 'producing')
  const shelf = programs.filter(p => p.status === 'shelf')
  const airing = programs.filter(p => p.status === 'airing')
  const finished = programs.filter(p => p.status === 'finished')

  const filtered = useMemo(() => {
    if (filter === 'producing') return producing
    if (filter === 'shelf') return shelf
    if (filter === 'airing') return airing
    if (filter === 'finished') return finished
    // 'active' = everything except finished
    return [...producing, ...shelf, ...airing]
  }, [filter, programs])

  return (
    <>
      <div style={{
        display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setShowBuilder(true)}
          style={{
            background: T.accent, color: T.bg,
            border: 'none', borderRadius: 5, padding: '8px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >+ New Production</button>
        <div style={{ flex: 1 }} />
        <FilterChip label={`Active (${producing.length + shelf.length + airing.length})`} active={filter === 'active'} onClick={() => setFilter('active')} />
        <FilterChip label={`Producing (${producing.length})`} active={filter === 'producing'} onClick={() => setFilter('producing')} />
        <FilterChip label={`Shelf (${shelf.length})`} active={filter === 'shelf'} onClick={() => setFilter('shelf')} />
        <FilterChip label={`Airing (${airing.length})`} active={filter === 'airing'} onClick={() => setFilter('airing')} />
        <FilterChip label={`Done (${finished.length})`} active={filter === 'finished'} onClick={() => setFilter('finished')} />
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: T.surface, border: `1px dashed ${T.border}`,
          borderRadius: 6, padding: 20, fontSize: 12, color: T.muted, textAlign: 'center',
        }}>
          {programs.length === 0
            ? 'No programs yet. Tap "+ New Production" to build one.'
            : `No programs ${filter !== 'active' ? `in "${filter}"` : 'active'}.`}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10,
        }}>
          {filtered.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              onCancel={() => {
                if (p.status === 'producing' || p.status === 'shelf') {
                  if (window.confirm(`Cancel "${p.name}"? You won't get the upfront cost back.`)) {
                    onCancelProgram(p.id)
                  }
                }
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
    </>
  )
}

function ProgramCard({ program: p, onCancel }) {
  const cat = CATEGORIES[p.categoryId]
  const movie = p.movieId ? findMovie(p.movieId) : null
  const league = p.sportsLeagueId ? findLeague(p.sportsLeagueId) : null

  const statusColor =
    p.status === 'producing' ? T.accent :
    p.status === 'shelf' ? T.green :
    p.status === 'airing' ? T.gold :
    T.muted
  const statusLabel =
    p.status === 'producing' ? `Producing · ${p.prodMonthsRemaining}/${p.prodMonthsTotal} mo` :
    p.status === 'shelf' ? 'On shelf' :
    p.status === 'airing' ? `Airing (${p.airingsCount}×)` :
    'Finished'

  const showTrue = p.revealed || p.status === 'finished' || p.status === 'airing'

  return (
    <Card style={{ padding: 12 }} accent={statusColor + '55'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{p.name}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, color: cat?.color || T.muted,
              background: (cat?.color || T.muted) + '22',
              padding: '1px 6px', borderRadius: 3, letterSpacing: '.05em',
            }}>
              {movie ? '🎞' : league ? league.icon : cat?.icon} {movie ? 'Movie' : league ? league.label : (cat?.label || p.categoryId)}
            </span>
          </div>
        </div>
        <div style={{
          fontSize: 10, color: statusColor, fontWeight: 700,
          background: statusColor + '22', padding: '2px 6px', borderRadius: 3,
          whiteSpace: 'nowrap',
        }}>{statusLabel}</div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 9, fontSize: 11 }}>
        <div>
          <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>
            Quality {!showTrue && <span style={{ textTransform: 'none' }}>(est)</span>}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, fontWeight: 600 }}>
            {showTrue ? p.trueQ.toFixed(1) : `${p.estQRange[0]}–${p.estQRange[1]}`}
          </div>
        </div>
        <div>
          <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>
            Hype {!showTrue && <span style={{ textTransform: 'none' }}>(est)</span>}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.gold, fontWeight: 600 }}>
            {showTrue ? p.trueH.toFixed(1) : `${p.estHRange[0]}–${p.estHRange[1]}`}
          </div>
        </div>
        {p.airingsCount > 0 && (
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Total Aud</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, fontWeight: 600 }}>
              {p.totalAudience.toFixed(1)}M
            </div>
          </div>
        )}
      </div>

      {/* Cost line */}
      <div style={{ marginTop: 8, fontSize: 11, color: T.muted, lineHeight: 1.4 }}>
        Sunk: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text }}>{fmtM(p.totalCost)}</span>
        {p.status === 'airing' && (
          <> · Earned: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: T.green }}>{fmtM(p.totalRevenue)}</span></>
        )}
      </div>

      {/* Components — only when revealed and not a movie */}
      {showTrue && !p.movieId && p.components && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        }}>
          <Comp label="Narr" value={p.components.narrative} />
          <Comp label="Art" value={p.components.art} />
          <Comp label="Innov" value={p.components.innovation} />
          <Comp label="Tech" value={p.components.technical} />
        </div>
      )}

      {/* Review quote, if any */}
      {showTrue && p.review && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
          fontSize: 11, color: T.muted, fontStyle: 'italic', lineHeight: 1.4,
        }}>
          “{p.review.quote}”
        </div>
      )}

      {(p.status === 'producing' || p.status === 'shelf') && (
        <button
          onClick={onCancel}
          style={{
            width: '100%', marginTop: 10, padding: '6px 8px',
            background: 'transparent', color: T.red,
            border: `1px solid ${T.red}55`,
            borderRadius: 4, fontSize: 11,
            cursor: 'pointer',
          }}
        >
          {p.status === 'producing' ? '✕ Cancel Production' : '🗑 Discard'}
        </button>
      )}
    </Card>
  )
}

function Comp({ label, value }) {
  const v = Math.max(0, Math.min(10, value || 0))
  return (
    <div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.text, fontWeight: 600 }}>
        {v.toFixed(1)}
      </div>
    </div>
  )
}

// ─── WRITERS TAB ──────────────────────────────────────────────────────────────
function WritersTab({ station, marketWriters, onHireWriter, onFireWriter }) {
  const hired = station.hiredWriters || []
  const scripts = station.scripts || []
  const capReached = hired.length >= WRITERS_CAP
  const [confirmFire, setConfirmFire] = useState(null)

  return (
    <>
      {/* Roster */}
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontSize: 11, color: T.muted, letterSpacing: 1.5, marginBottom: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span>YOUR WRITERS ({hired.length} / {WRITERS_CAP})</span>
        </div>

        {hired.length === 0 ? (
          <div style={{
            background: T.surface, border: `1px dashed ${T.border}`,
            borderRadius: 6, padding: 16, fontSize: 12, color: T.muted, textAlign: 'center',
          }}>
            No writers employed.
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10,
          }}>
            {hired.map(h => {
              const w = findWriter(h.talentId)
              if (!w) return null
              const draftCount = scripts.filter(s => s.writerId === w.id && s.status === 'drafting').length
              const isBusy = draftCount > 0
              const isFree = !!h.freeStarter
              const penalty = isFree ? 0 : r1((h.perMonthCharge || w.cost || 0) * FIRE_PENALTY_MULT)
              return (
                <Card key={h.talentId} style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{w.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <HTag tier={w.tier} />
                        <span style={{
                          fontSize: 10, color: CATEGORIES[w.specialty]?.color || T.muted,
                          background: (CATEGORIES[w.specialty]?.color || T.muted) + '22',
                          padding: '1px 6px', borderRadius: 3, letterSpacing: '.05em',
                        }}>
                          {CATEGORIES[w.specialty]?.icon} {CATEGORIES[w.specialty]?.label || w.specialty}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11 }}>
                    <div>
                      <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Skill</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, fontWeight: 600 }}>
                        {(w.skill * 100).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Salary</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: isFree ? T.green : T.text, fontWeight: 600 }}>
                        {isFree ? 'free' : `${fmtM(h.perMonthCharge || w.cost)}/mo`}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Status</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: isBusy ? T.accent : T.green, fontWeight: 600 }}>
                        {isBusy ? `Drafting` : 'Idle'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmFire({ id: w.id, name: w.name, penalty, busy: isBusy })}
                    style={{
                      width: '100%', marginTop: 10, padding: '6px 8px',
                      background: 'transparent', border: `1px solid ${T.border}`,
                      color: T.muted, borderRadius: 4, fontSize: 11, cursor: 'pointer',
                    }}
                  >Fire {!isFree && `(${fmtM(penalty)} penalty)`}</button>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Market */}
      <div>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, marginBottom: 8 }}>
          HIRE NEW WRITER · MARKET
        </div>
        {capReached && (
          <div style={{
            background: T.red + '15', border: `1px solid ${T.red}55`,
            borderRadius: 5, padding: 10, fontSize: 12, color: T.red, marginBottom: 10,
          }}>
            Writer cap reached. Fire someone to make room.
          </div>
        )}
        {marketWriters.length === 0 ? (
          <div style={{
            background: T.surface, border: `1px dashed ${T.border}`,
            borderRadius: 6, padding: 16, fontSize: 12, color: T.muted, textAlign: 'center',
          }}>
            No writers available this month. The roster refreshes after research / each year.
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10,
          }}>
            {marketWriters.map(w => {
              const upfront = r1(w.cost)
              const affordable = station.cash >= upfront
              const canHire = affordable && !capReached
              return (
                <Card key={w.id} style={{ padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{w.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <HTag tier={w.tier} />
                    <span style={{
                      fontSize: 10, color: CATEGORIES[w.specialty]?.color || T.muted,
                      background: (CATEGORIES[w.specialty]?.color || T.muted) + '22',
                      padding: '1px 6px', borderRadius: 3, letterSpacing: '.05em',
                    }}>
                      {CATEGORIES[w.specialty]?.icon} {CATEGORIES[w.specialty]?.label || w.specialty}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
                    <div>
                      <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Skill</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, fontWeight: 600 }}>
                        {(w.skill * 100).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Salary</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, fontWeight: 600 }}>
                        {fmtM(w.cost)}/mo
                      </div>
                    </div>
                    <div>
                      <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Sign</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, fontWeight: 600 }}>
                        {fmtM(upfront)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => canHire && onHireWriter(w)}
                    disabled={!canHire}
                    style={{
                      width: '100%', marginTop: 10, padding: '7px 8px',
                      background: canHire ? T.accent : T.border,
                      color: canHire ? T.bg : T.muted,
                      border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      cursor: canHire ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {!affordable ? 'Not enough cash' : capReached ? 'Cap reached' : 'HIRE — Permanent'}
                  </button>
                </Card>
              )
            })}
          </div>
        )}
        <div style={{ fontSize: 11, color: T.muted, marginTop: 10, lineHeight: 1.5, fontStyle: 'italic' }}>
          Writers are permanent contracts only. Upfront cost = 1 month salary. Firing = {FIRE_PENALTY_MULT}× monthly salary.
        </div>
      </div>

      {/* Fire confirm modal */}
      {confirmFire && (
        <Modal onClose={() => setConfirmFire(null)}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Fire {confirmFire.name}?</div>
          {confirmFire.busy ? (
            <div style={{ fontSize: 12, color: T.red, marginBottom: 12 }}>
              This writer is mid-draft. Wait for the script to finish (or archive it) first.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              Penalty: <span style={{ color: T.red, fontWeight: 700 }}>{fmtM(confirmFire.penalty)}</span>. Their existing ready scripts remain.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirmFire(null)} style={btnSecondary}>Cancel</button>
            <button
              onClick={() => { onFireWriter(confirmFire.id); setConfirmFire(null) }}
              disabled={confirmFire.busy}
              style={{ ...btnDanger, opacity: confirmFire.busy ? 0.4 : 1 }}
            >Confirm Fire</button>
          </div>
        </Modal>
      )}
    </>
  )
}

// ─── SCRIPTS TAB ──────────────────────────────────────────────────────────────
function ScriptsTab({ station, year, research, onBeginScript, onRefreshScript, onArchiveScript, onDeleteScript }) {
  const scripts = station.scripts || []
  const writers = station.hiredWriters || []
  const [filter, setFilter] = useState('all') // all|ready|drafting|archived
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    if (filter === 'all') return scripts.filter(s => s.status !== 'archived')
    return scripts.filter(s => s.status === filter)
  }, [scripts, filter])

  const ready = scripts.filter(s => s.status === 'ready').length
  const drafting = scripts.filter(s => s.status === 'drafting').length
  const archived = scripts.filter(s => s.status === 'archived').length

  return (
    <>
      <div style={{
        display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setShowNew(true)}
          disabled={writers.length === 0}
          style={{
            background: writers.length === 0 ? T.border : T.accent,
            color: writers.length === 0 ? T.muted : T.bg,
            border: 'none', borderRadius: 5, padding: '8px 14px',
            fontSize: 12, fontWeight: 700,
            cursor: writers.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >+ New Script</button>
        <div style={{ flex: 1 }} />
        <FilterChip label={`All (${scripts.filter(s => s.status !== 'archived').length})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip label={`Ready (${ready})`} active={filter === 'ready'} onClick={() => setFilter('ready')} />
        <FilterChip label={`Drafting (${drafting})`} active={filter === 'drafting'} onClick={() => setFilter('drafting')} />
        <FilterChip label={`Archived (${archived})`} active={filter === 'archived'} onClick={() => setFilter('archived')} />
      </div>

      {writers.length === 0 && (
        <div style={{
          background: T.surface, border: `1px dashed ${T.border}`,
          borderRadius: 6, padding: 16, fontSize: 12, color: T.muted, marginBottom: 10,
        }}>
          Hire a writer first to start commissioning scripts.
        </div>
      )}

      {filtered.length === 0 && writers.length > 0 && (
        <div style={{
          background: T.surface, border: `1px dashed ${T.border}`,
          borderRadius: 6, padding: 20, fontSize: 12, color: T.muted, textAlign: 'center',
        }}>
          No scripts {filter !== 'all' && `in "${filter}"`}.
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10,
      }}>
        {filtered.map(s => (
          <ScriptCard
            key={s.id}
            script={s}
            anyFreeWriter={writers.some(h => !scripts.some(x => x.writerId === h.talentId && x.status === 'drafting'))}
            onRefresh={() => onRefreshScript(s.id)}
            onArchive={() => onArchiveScript(s.id)}
            onDelete={() => onDeleteScript(s.id)}
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
    </>
  )
}

function ScriptCard({ script: s, anyFreeWriter, onRefresh, onArchive, onDelete }) {
  const writer = findWriter(s.writerId)
  const ip = s.ipId ? findIP(s.ipId) : null
  const cat = CATEGORIES[s.categoryId]
  const topic = cat?.topics.find(t => t.id === s.topicId)

  const statusColor =
    s.status === 'ready' ? T.green :
    s.status === 'drafting' ? T.accent :
    T.muted
  const statusLabel =
    s.status === 'drafting' ? (s.refreshing ? `Refreshing · ${s.monthsRemaining}mo` : `Drafting · ${s.monthsRemaining}mo`) :
    s.status === 'ready' ? `Ready` :
    `Archived`

  return (
    <Card style={{ padding: 12 }} accent={s.status === 'ready' ? T.green + '55' : T.border}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{s.name}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, color: cat?.color || T.muted,
              background: (cat?.color || T.muted) + '22',
              padding: '1px 6px', borderRadius: 3, letterSpacing: '.05em',
            }}>
              {cat?.icon} {topic?.label || s.topicId}
            </span>
            {ip && (
              <span style={{
                fontSize: 10, color: T.gold,
                background: T.gold + '22',
                padding: '1px 6px', borderRadius: 3, letterSpacing: '.05em',
              }}>
                📜 {ip.name}
              </span>
            )}
          </div>
        </div>
        <div style={{
          fontSize: 10, color: statusColor, fontWeight: 700,
          background: statusColor + '22', padding: '2px 6px', borderRadius: 3,
          whiteSpace: 'nowrap',
        }}>{statusLabel}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 9, fontSize: 11 }}>
        <div>
          <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Writer</div>
          <div style={{ color: T.text, fontWeight: 600 }}>{writer?.name || '?'}</div>
        </div>
        {s.status !== 'drafting' && (
          <>
            <div>
              <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Quality</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.text, fontWeight: 600 }}>
                {s.baseQuality.toFixed(1)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>
                Hype {s.timesUsed > 0 && <span style={{ color: T.muted, textTransform: 'none' }}>({s.timesUsed} use{s.timesUsed > 1 ? 's' : ''})</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${s.hype}%`,
                    height: '100%',
                    background: s.hype < 25 ? T.red : s.hype < 50 ? T.gold : T.green,
                  }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.text, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>
                  {Math.round(s.hype)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {s.status === 'ready' && (
          <>
            <button
              onClick={onRefresh}
              disabled={!anyFreeWriter}
              title={anyFreeWriter ? `Refresh hype to ${s.originalHype.toFixed(0)} (1 month writer time)` : 'All writers busy'}
              style={{
                flex: 1, padding: '6px 8px',
                background: anyFreeWriter ? T.accent + '33' : T.border,
                color: anyFreeWriter ? T.accent : T.muted,
                border: `1px solid ${anyFreeWriter ? T.accent : T.border}`,
                borderRadius: 4, fontSize: 11, fontWeight: 600,
                cursor: anyFreeWriter ? 'pointer' : 'not-allowed',
              }}
            >🔁 Refresh</button>
            <button
              onClick={onArchive}
              style={{
                flex: 1, padding: '6px 8px',
                background: 'transparent', color: T.muted,
                border: `1px solid ${T.border}`,
                borderRadius: 4, fontSize: 11,
                cursor: 'pointer',
              }}
            >📦 Archive</button>
          </>
        )}
        {s.status === 'drafting' && (
          <button
            onClick={onArchive}
            style={{
              flex: 1, padding: '6px 8px',
              background: 'transparent', color: T.muted,
              border: `1px solid ${T.border}`,
              borderRadius: 4, fontSize: 11,
              cursor: 'pointer',
            }}
          >Cancel Draft</button>
        )}
        {s.status === 'archived' && (
          <button
            onClick={() => {
              if (window.confirm(`Permanently delete "${s.name}"? This cannot be undone.`)) onDelete()
            }}
            style={{
              flex: 1, padding: '6px 8px',
              background: 'transparent', color: T.red,
              border: `1px solid ${T.red}55`,
              borderRadius: 4, fontSize: 11,
              cursor: 'pointer',
            }}
          >🗑 Delete</button>
        )}
      </div>
    </Card>
  )
}

function NewScriptModal({ station, year, research, onCancel, onConfirm }) {
  const writers = station.hiredWriters || []
  const scripts = station.scripts || []
  const busyIds = new Set(scripts.filter(s => s.status === 'drafting').map(s => s.writerId))

  // What's unlocked for this station (focus + research)
  const unlocks = useMemo(() => getUnlocks(station, research), [station.focus, research?.contentUnlocks])
  // Movies are licensed, not scripted. Sports use the rights path, not scripts.
  const unlockedCategoryIds = useMemo(
    () => Object.keys(CATEGORIES).filter(id => id !== 'movie' && id !== 'sports' && unlocks.hasCat(id)),
    [unlocks]
  )

  // Default to first non-busy writer
  const initialWriterId = writers.find(h => !busyIds.has(h.talentId))?.talentId || writers[0]?.talentId || ''
  const [writerId, setWriterId] = useState(initialWriterId)

  const writer = findWriter(writerId)
  // Default category: writer's specialty if unlocked, otherwise first unlocked category
  const defaultCat =
    writer?.specialty && unlocks.hasCat(writer.specialty) ? writer.specialty :
    (unlockedCategoryIds[0] || 'series')
  const [categoryId, setCategoryId] = useState(defaultCat)

  const cat = CATEGORIES[categoryId]
  // Filter topics to unlocked ones
  const unlockedTopics = (cat?.topics || []).filter(t => unlocks.hasTopic(categoryId, t.id))
  const [topicId, setTopicId] = useState(unlockedTopics[0]?.id || '')
  const [ipId, setIpId] = useState(null)
  const [name, setName] = useState('')

  const ownedIps = activeIPLicenses(station, year)
    .map(lic => findIP(lic.ipId)).filter(Boolean)
    .filter(ip => (ip.fits || []).includes(categoryId))

  const onCatChange = (newCat) => {
    setCategoryId(newCat)
    const nc = CATEGORIES[newCat]
    const topics = (nc?.topics || []).filter(t => unlocks.hasTopic(newCat, t.id))
    setTopicId(topics[0]?.id || '')
    setIpId(null)
  }

  const writerBusy = busyIds.has(writerId)
  const canSubmit = writerId && categoryId && topicId && name.trim().length >= 2 && !writerBusy

  // If no categories are unlocked at all, show a guidance message
  if (unlockedCategoryIds.length === 0) {
    return (
      <Modal onClose={onCancel}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Commission Script</div>
        <div style={{
          padding: 16, background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 5, fontSize: 12, color: T.muted, lineHeight: 1.5,
        }}>
          No content categories unlocked yet. Visit the <strong style={{ color: T.text }}>Research</strong> tab to unlock categories and topics.
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnSecondary}>Close</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onCancel}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Commission Script</div>

      <Field label="Title">
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. The Last Frontier"
          style={inputStyle}
          maxLength={48}
        />
      </Field>

      <Field label="Writer">
        <select value={writerId} onChange={e => setWriterId(e.target.value)} style={inputStyle}>
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
        </select>
        {writer && (
          <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
            Skill {(writer.skill * 100).toFixed(0)} · best in {CATEGORIES[writer.specialty]?.label}
            {!unlocks.hasCat(writer.specialty) && (
              <span style={{ color: T.gold }}> — their specialty isn't unlocked yet</span>
            )}
          </div>
        )}
      </Field>

      <Field label="Category">
        <select value={categoryId} onChange={e => onCatChange(e.target.value)} style={inputStyle}>
          {unlockedCategoryIds.map(id => {
            const c = CATEGORIES[id]
            return <option key={id} value={id}>{c.icon} {c.label}</option>
          })}
        </select>
        {writer && writer.specialty !== categoryId && (
          <div style={{ fontSize: 10, color: T.gold, marginTop: 4 }}>
            ⚠ Off-specialty — quality and hype will be reduced.
          </div>
        )}
      </Field>

      <Field label="Topic">
        <select value={topicId} onChange={e => setTopicId(e.target.value)} style={inputStyle}>
          {unlockedTopics.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        {unlockedTopics.length < (cat?.topics?.length || 0) && (
          <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
            {(cat?.topics?.length || 0) - unlockedTopics.length} more topic{unlockedTopics.length === (cat?.topics?.length || 0) - 1 ? '' : 's'} locked. Visit Research to unlock.
          </div>
        )}
      </Field>

      <Field label={`IP (optional)${ownedIps.length === 0 ? ' — no compatible IPs licensed' : ''}`}>
        <select value={ipId || ''} onChange={e => setIpId(e.target.value || null)} style={inputStyle}>
          <option value="">— None (original) —</option>
          {ownedIps.map(ip => (
            <option key={ip.id} value={ip.id}>{ip.name} ({ip.tier})</option>
          ))}
        </select>
      </Field>

      <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginTop: 6, marginBottom: 14 }}>
        Drafting takes <strong style={{ color: T.text }}>1 month</strong>. The writer is locked until it ships.
        Initial hype = writer skill + IP bonus + a roll. Each use of the finished script later drops hype 20%.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        <button
          onClick={() => canSubmit && onConfirm({ writerId, name: name.trim(), categoryId, topicId, ipId })}
          disabled={!canSubmit}
          style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
        >Begin Draft (1 mo)</button>
      </div>
    </Modal>
  )
}

// ─── SHARED BITS ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? T.accent + '33' : 'transparent',
      border: `1px solid ${active ? T.accent : T.border}`,
      color: active ? T.accent : T.muted,
      borderRadius: 12, padding: '3px 9px', fontSize: 11,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        fontSize: 10, color: T.muted, letterSpacing: '.1em',
        textTransform: 'uppercase', display: 'block', marginBottom: 4,
      }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: 4,
  color: T.text,
  padding: '7px 9px',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const btnPrimary = {
  flex: 1, padding: '9px 12px',
  background: T.accent, color: T.bg,
  border: 'none', borderRadius: 4,
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
const btnSecondary = {
  flex: 1, padding: '9px 12px',
  background: 'transparent', color: T.muted,
  border: `1px solid ${T.border}`, borderRadius: 4,
  fontSize: 12, cursor: 'pointer',
}
const btnDanger = {
  flex: 1, padding: '9px 12px',
  background: T.red, color: '#fff',
  border: 'none', borderRadius: 4,
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
}

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 18,
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >{children}</div>
    </div>
  )
}
