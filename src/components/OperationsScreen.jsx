import { useState, useMemo } from 'react'
import { T, FONTS, tierStyle } from '../theme.js'
import {
  CATEGORIES, MARKETS, MARKETING_TIERS, IPS, SPORTS_LEAGUES, MONTHS,
  leagueAvailableInYear, leagueYearsUntilReturn,
  STAFF_ROLES, STAFF_SEARCHES, STAFF_SALARY_BY_TIER, STAFF_EFFECTS,
  STAFF_FIRE_PENALTY_MULT,
  DIRECTOR_ROLES, DIRECTOR_SALARY, DIRECTOR_HIRE_COST,
  IP_LICENSE_TERMS, NETWORK_CAMPAIGNS, computeCampaignInputMultiplier,
  CONTRACT_TYPES, TIERS, MARKET_ORDER,
  MOVIES, MOVIE_PACK_REBUY_HYPE_PENALTY, MOVIE_PACK_COOLDOWN_MONTHS,
  FIRE_PENALTY_MULT,
} from '../constants.js'
import { HTag, Bar, Pill, SectionTitle } from './ui.jsx'
import { Icon, CategoryIcon } from '../icons.jsx'
import { OfficeFloorPlan } from './OfficeFloorPlan.jsx'
import {
  findDirector, findStar, findIP, findLeague, findWriter,
  staffSalaryTotal, directorSalaryTotal,
  canHireDirector, hasDirector, directorCount,
  talentCapacity, talentCount,
  contractCost, fameLabel, sportsLicenseCost,
  ipLicenseCost, ownsIP, activeIPLicenses, canHireStaffRole,
  SPEC_GENRES, specThresholdFor, fmtM, canPromote,
  specQualityBonus, specHypeBonus,
  findOwnedActivePack, findLastConsumedPack, moviePackPurchaseHype,
  r1,
} from '../engine.js'

// ─── SUB-TABS ────────────────────────────────────────────────────────────
const SUB_TABS = [
  { id: 'status',    label: 'Network Status' },
  { id: 'talent',    label: 'Talent' },
  { id: 'rights',    label: 'Purchase Rights' },
  { id: 'staff',     label: 'Staff' },
  { id: 'marketing', label: 'Marketing' },
]

export function OperationsScreen(props) {
  const { onBack } = props
  const [sub, setSub] = useState('status')

  // Active sub-tab label for the eyebrow — mirrors Programming's pattern
  // "Operations · Staff" / "Operations · Talent" etc, so the player always
  // knows where they are within the section.
  const activeTab = SUB_TABS.find(t => t.id === sub)

  return (
    <div className="view-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 48px' }}>

      {/* Back link — restyled as a quiet text link rather than an outlined button.
          It's a meta-action, doesn't need to scream. */}
      <div style={{ paddingTop: 24 }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none',
          color: T.muted, padding: '4px 0', cursor: 'pointer',
          fontSize: 11, fontWeight: 500, letterSpacing: '.08em',
          textTransform: 'uppercase', display: 'inline-flex',
          alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>←</span> Back
        </button>
      </div>

      {/* ─── HERO ───
          Same pattern as Programming: gold rule + accent eyebrow + Fraunces
          serif title + sans subhead. The eyebrow includes the active sub-tab
          so the player has clear location context. */}
      <div style={{ position: 'relative', padding: '24px 0 24px' }}>
        <div style={{
          width: 36, height: 2,
          background: `linear-gradient(90deg, ${T.accent} 0%, transparent 100%)`,
          marginBottom: 14,
        }} />
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
          textTransform: 'uppercase', color: T.accent, marginBottom: 14,
        }}>
          Operations · {activeTab?.label || 'Suite'}
        </div>
        <h1 className="editorial" style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 52, lineHeight: 0.95, letterSpacing: '-.025em',
          color: T.text, marginBottom: 12,
        }}>
          Operations
        </h1>
        <div style={{
          fontSize: 14, color: T.muted, lineHeight: 1.55, maxWidth: 540,
        }}>
          Network status, talent, content rights, staff structure, and marketing.
          Every signing and every campaign launches from here.
        </div>
      </div>

      {/* ─── SUB-TABS ───
          Match the v3 mock: small caps with .12em letterspace, gold bullet
          square on the active tab, gold bottom rule on active. Hover state
          for the inactive ones (background tint + text brighten). */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 32, marginTop: 16,
        borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto',
      }}>
        {SUB_TABS.map(t => (
          <OpsSubTab key={t.id}
            id={t.id} label={t.label}
            active={sub === t.id}
            onClick={() => setSub(t.id)}
          />
        ))}
      </div>

      {sub === 'status'    && <StatusTab    {...props} />}
      {sub === 'talent'    && <TalentTab    {...props} />}
      {sub === 'rights'    && <RightsTab    {...props} />}
      {sub === 'staff'     && <StaffTab     {...props} />}
      {sub === 'marketing' && <MarketingTab {...props} />}
    </div>
  )
}

/** Editorial sub-tab — small caps, gold bullet on active, hover tint.
 *  Same pattern as Programming's subtab buttons. */
function OpsSubTab({ id, label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: !active && hover ? 'rgba(255, 255, 255, 0.025)' : 'transparent',
        border: 'none',
        color: active ? T.text : (hover ? T.text : T.muted),
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: active ? 700 : 600,
        letterSpacing: '.12em', textTransform: 'uppercase',
        padding: '12px 14px', cursor: 'pointer',
        borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
        marginBottom: -1,
        whiteSpace: 'nowrap',
        transition: 'color .15s, background .15s',
        display: 'inline-flex', alignItems: 'center', gap: 7,
      }}
    >
      {active && (
        <span style={{
          display: 'inline-block',
          width: 5, height: 5, background: T.accent,
          marginTop: -1,
        }} />
      )}
      {label}
    </button>
  )
}

// ─── 1. TALENT TAB ───────────────────────────────────────────────────────
function TalentTab({ station, marketRoster, onHire, onFire, onHireWriter, onFireWriter }) {
  const [section, setSection] = useState('directors')
  const [hireModal, setHireModal] = useState(null)  // { role, talent }
  const [fireModal, setFireModal] = useState(null)

  const dirs = (station.hiredDirectors || []).map(h => ({ ...h, talent: findDirector(h.talentId) }))
  const stars = (station.hiredStars || []).map(h => ({ ...h, talent: findStar(h.talentId) }))

  // Unified talent room: writers + stars + creative directors share one cap.
  const cap = talentCapacity(station)
  const cnt = talentCount(station)
  const roomFull = cnt >= cap

  return (
    <div>
      {/* Office-full banner — editorial restyle */}
      {roomFull && (
        <div style={{
          background: `linear-gradient(180deg, ${T.red}15 0%, ${T.red}08 100%)`,
          border: `1px solid ${T.red}55`,
          borderLeft: `3px solid ${T.red}`,
          borderRadius: 5, padding: '14px 16px', marginBottom: 18,
          fontSize: 12, color: T.text, lineHeight: 1.5,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.16em',
            textTransform: 'uppercase', color: T.red, marginBottom: 4,
          }}>
            Office full
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
          }}>
            All <span style={{ fontStyle: 'normal', fontFamily: FONTS.mono, color: T.red, fontWeight: 600 }}>{cnt}/{cap}</span> seats are taken.
            Fire someone, hire a Director of Talent (National), or expand to a bigger market before signing anyone new.
          </div>
        </div>
      )}

      {/* Sub-sub-tab bar — Producers / Stars / Writers */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 22,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <OpsSubTab id="directors" label="Producers / Directors" active={section === 'directors'} onClick={() => setSection('directors')} />
        <OpsSubTab id="stars"     label="Stars"                  active={section === 'stars'}     onClick={() => setSection('stars')} />
        <OpsSubTab id="writers"   label="Writers"                active={section === 'writers'}   onClick={() => setSection('writers')} />
      </div>

      {section === 'directors' && (
        <TalentSubSection
          rosterTitle="Under contract"
          marketTitle="Director Market"
          marketSubtitle="Fresh roster · Refreshes monthly"
          items={dirs}
          pool={marketRoster.directors}
          role="director"
          station={station}
          roomFull={roomFull}
          onHireOpen={(role, t) => setHireModal({ role, t })}
          onFireOpen={(role, id, t) => setFireModal({ role, id, t })}
        />
      )}
      {section === 'stars' && (
        <TalentSubSection
          rosterTitle="Under contract"
          marketTitle="Star Market"
          marketSubtitle="Fresh roster · Refreshes monthly"
          items={stars}
          pool={marketRoster.stars}
          role="star"
          station={station}
          roomFull={roomFull}
          onHireOpen={(role, t) => setHireModal({ role, t })}
          onFireOpen={(role, id, t) => setFireModal({ role, id, t })}
        />
      )}
      {section === 'writers' && (
        <WritersTalentSection
          station={station}
          marketWriters={marketRoster.writers || []}
          roomFull={roomFull}
          onHireWriter={onHireWriter}
          onFireWriter={onFireWriter}
        />
      )}

      {hireModal && (
        <HireModal {...hireModal} cash={station.cash}
          onConfirm={(ctId) => { onHire(hireModal.role, hireModal.t, ctId); setHireModal(null) }}
          onCancel={() => setHireModal(null)}
        />
      )}
      {fireModal && (
        <FireConfirm {...fireModal} onConfirm={() => { onFire(fireModal.role, fireModal.id); setFireModal(null) }}
          onCancel={() => setFireModal(null)}
        />
      )}
    </div>
  )
}

/** TalentSubSection — wraps a roster block + a market block with
 *  editorial section heads (gradient hairline, serif title, mono meta). */
function TalentSubSection({ rosterTitle, marketTitle, marketSubtitle, items, pool, role, station, roomFull, onHireOpen, onFireOpen }) {
  return (
    <>
      {/* Roster section head */}
      <SectionHead title={rosterTitle} meta={`${items.length} ${items.length === 1 ? 'contract' : 'contracts'}`} />

      <RosterGroup items={items} role={role} onFire={onFireOpen} />

      {items.length === 0 && (
        <EmptyRoster role={role} />
      )}

      {/* Market section head */}
      <div style={{ marginTop: 36 }}>
        <SectionHead title={marketTitle} meta={marketSubtitle} />
      </div>

      <MarketGroup pool={pool || []} role={role} roomFull={roomFull} onHire={onHireOpen} />
    </>
  )
}

/** Editorial section head — Fraunces title left, mono meta right,
 *  gradient gold hairline below. Reused across sub-tabs. */
function SectionHead({ title, meta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 18, paddingBottom: 10, position: 'relative',
    }}>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 500",
        fontSize: 24, letterSpacing: '-.01em', color: T.text,
      }}>
        {title}
      </div>
      {meta && (
        <div style={{
          fontFamily: FONTS.mono, fontSize: 10,
          color: T.muted, letterSpacing: '.08em',
          textTransform: 'uppercase',
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

/** EmptyRoster — friendly empty state when nothing under contract. */
function EmptyRoster({ role }) {
  const label = role === 'director' ? 'directors'
              : role === 'star'     ? 'stars'
              :                       'writers'
  return (
    <div style={{
      padding: '32px 24px',
      background: T.surface, border: `1px dashed ${T.borderHi}`,
      borderRadius: 6, textAlign: 'center',
      marginBottom: 12,
    }}>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 36, 'wght' 500",
        fontStyle: 'italic',
        fontSize: 16, color: T.textDim, marginBottom: 4,
      }}>
        No {label} under contract
      </div>
      <div style={{ fontSize: 12, color: T.muted }}>
        Browse the market below to find one.
      </div>
    </div>
  )
}

/** WriterCard — editorial vertical card for the writer-specific shape
 *  (skill % + salary + status, no Q/H since writers don't air directly).
 *  Same visual vocabulary as TalentCardRow but vertical: name on top,
 *  tier+specialty pills, stats row, action button. */
function WriterCard({ w, tierName, skill, salaryLabel, statusLabel, statusColor, action, dim }) {
  const [hover, setHover] = useState(false)
  const cat = CATEGORIES[w.specialty]
  const ts = tierStyle(tierName)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover
          ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
          : `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
        border: `1px solid ${hover ? ts.b : T.border}`,
        borderLeft: `3px solid ${ts.c}`,
        borderRadius: 5,
        padding: 14,
        opacity: dim ? 0.4 : 1,
        transition: 'background .15s, border-color .15s',
        boxShadow: hover ? '0 4px 16px rgba(0,0,0,.25)' : 'none',
      }}
    >
      {/* Header — name + tier pill on the right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 600",
            fontSize: 17, letterSpacing: '-.005em',
            color: T.text, lineHeight: 1.15,
          }}>
            {w.name}
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic', fontSize: 12,
            color: T.muted, marginTop: 3,
          }}>
            <span style={{
              fontStyle: 'normal', color: T.textDim,
              fontFamily: FONTS.sans, fontWeight: 500, fontSize: 11,
            }}>
              {cat?.label || w.specialty} writer
            </span>
          </div>
        </div>
        <span style={{
          fontFamily: FONTS.sans, fontSize: 9, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 2,
          color: ts.c, border: `1px solid ${ts.b}`, background: ts.bg,
          whiteSpace: 'nowrap',
        }}>{tierName}</span>
      </div>

      {/* Stats row — skill / salary / status */}
      <div style={{ display: 'flex', gap: 18, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <WriterStat label="Skill"  value={`${(skill * 100).toFixed(0)}`} />
        <WriterStat label="Salary" value={salaryLabel} />
        {statusLabel && <WriterStat label="Status" value={statusLabel} color={statusColor} />}
      </div>

      {action}
    </div>
  )
}

function WriterStat({ label, value, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase',
        color: T.muted, fontWeight: 600, marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600,
        color: color || T.text, letterSpacing: 0,
      }}>{value}</div>
    </div>
  )
}

function WritersTalentSection({ station, marketWriters, roomFull, onHireWriter, onFireWriter }) {
  // Lightweight inline writer roster + hire — keeps the same engine plumbing
  // as Content used to, just lives in Operations now.
  const hired = station.hiredWriters || []
  const scripts = station.scripts || []
  const [confirmFire, setConfirmFire] = useState(null)

  return (
    <>
      <SectionHead title="Under contract" meta={`${hired.length} ${hired.length === 1 ? 'writer' : 'writers'}`} />

      {hired.length === 0 ? (
        <EmptyRoster role="writer" />
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10,
          marginBottom: 18,
        }}>
          {hired.map(h => {
            const w = findWriter(h.talentId)
            if (!w) return null
            const draftCount = scripts.filter(s => s.writerId === w.id && s.status === 'drafting').length
            const isBusy = draftCount > 0
            const isFree = !!h.freeStarter
            return (
              <WriterCard
                key={h.talentId}
                w={w}
                tierName={w.tier}
                skill={w.skill}
                salaryLabel={isFree ? <span style={{ color: T.green }}>FREE</span> : `$${(h.perMonthCharge || w.cost || 0).toFixed(1)}M/mo`}
                statusLabel={isBusy ? `DRAFTING (${draftCount})` : 'IDLE'}
                statusColor={isBusy ? T.gold : T.green}
                action={
                  <button
                    className={isBusy ? '' : 'danger-btn'}
                    onClick={() => !isBusy && setConfirmFire({ w, h })}
                    disabled={isBusy}
                    style={isBusy ? {
                      marginTop: 10, padding: '6px 10px', width: '100%',
                      background: T.card, border: `1px solid ${T.border}`,
                      color: T.muted, borderRadius: 4,
                      fontSize: 11, fontWeight: 600, cursor: 'not-allowed',
                      letterSpacing: '.08em',
                    } : {
                      marginTop: 10, width: '100%',
                    }}
                  >
                    {isBusy ? 'BUSY' : 'Release contract'}
                  </button>
                }
              />
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 36 }}>
        <SectionHead title="Writers Market" meta="Refreshes monthly" />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10,
      }}>
        {marketWriters.map(w => {
          const alreadyHired = hired.some(h => h.talentId === w.id)
          const tooExpensive = station.cash < (w.cost || 0)
          const canHire = !alreadyHired && !tooExpensive && !roomFull
          const label = alreadyHired ? 'HIRED'
            : roomFull ? 'OFFICE FULL'
            : tooExpensive ? 'TOO EXPENSIVE'
            : 'HIRE'
          return (
            <WriterCard
              key={w.id}
              w={w}
              tierName={w.tier}
              skill={w.skill}
              salaryLabel={`$${(w.cost || 0).toFixed(1)}M/mo`}
              dim={alreadyHired}
              action={
                <SignButton
                  priceLabel={canHire ? `$${(w.cost || 0).toFixed(1)}M` : null}
                  disabled={!canHire}
                  onClick={() => canHire && onHireWriter(w)}
                />
              }
            />
          )
        })}
      </div>

      {confirmFire && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}
        onClick={() => setConfirmFire(null)}
        >
          <div style={{
            background: T.bg, border: `1px solid ${T.borderHi}`, borderRadius: 6,
            padding: 18, maxWidth: 360, width: '90%',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 36, 'wght' 600",
              fontSize: 20, color: T.text, marginBottom: 10,
            }}>
              Release {confirmFire.w.name}?
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
              Severance penalty of {r1((confirmFire.h.perMonthCharge || confirmFire.w.cost || 0) * FIRE_PENALTY_MULT).toFixed(1)}M will be charged.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmFire(null)}
                style={{
                  flex: 1, padding: '8px 12px', background: 'transparent',
                  border: `1px solid ${T.border}`, color: T.text, borderRadius: 4,
                  cursor: 'pointer', fontSize: 12,
                }}
              >Cancel</button>
              <button
                onClick={() => { onFireWriter(confirmFire.w.id); setConfirmFire(null) }}
                style={{
                  flex: 1, padding: '8px 12px', background: T.red, color: T.bg,
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                }}
              >Release</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** TalentCardRow — shared layout for roster + market entries.
 *
 *  5-column grid: avatar / info (name + slug) / stats (Q+H bars) / tier pill / right action.
 *  Tier-colored left stripe + ring on the avatar. Cards lift on hover with a
 *  tier-matched border tint and a subtle drop shadow.
 *
 *  Right side is consumer-defined via `right` slot — pass in either a
 *  contract-status block (roster) or a Sign button (market).
 */
function TalentCardRow({ talent, tier, q, h, costLabel, right, dim }) {
  const [hover, setHover] = useState(false)
  const cat = CATEGORIES[talent.specialty]
  const ts = tierStyle(tier)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto auto auto',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px 14px 18px',
        background: hover
          ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
          : `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
        border: `1px solid ${hover ? ts.b : T.border}`,
        borderLeft: `3px solid ${ts.c}`,
        borderRadius: 5,
        marginBottom: 8,
        cursor: 'default',
        opacity: dim ? 0.55 : 1,
        transition: 'background .15s, border-color .15s, transform .05s',
        boxShadow: hover ? '0 4px 16px rgba(0,0,0,.25)' : 'none',
      }}
    >
      {/* Avatar — specialty icon, tier-colored ring */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `linear-gradient(135deg, #2c2440 0%, #1a1428 100%)`,
        border: `1.5px solid ${ts.b}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {cat ? <CategoryIcon categoryId={talent.specialty} size={20} color={ts.c} /> : null}
      </div>

      {/* Info block — Fraunces name + italic serif slugline */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 600",
          fontSize: 17, letterSpacing: '-.005em',
          color: T.text, lineHeight: 1.15, marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {talent.name}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic', fontSize: 12, color: T.muted,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            fontStyle: 'normal', color: T.textDim,
            fontFamily: FONTS.sans, fontWeight: 500, fontSize: 11,
          }}>
            {cat?.label || talent.specialty}
          </span>
          {costLabel && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.mutedDim, flexShrink: 0 }} />
              <span>{costLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats — Q+H label-above-bar with right-aligned mono value */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <TalentStat label="Quality" value={q} kind="q" />
        <TalentStat label="Hype"    value={h} kind="h" />
      </div>

      {/* Tier pill */}
      <span style={{
        fontFamily: FONTS.sans, fontSize: 9, fontWeight: 700,
        letterSpacing: '.14em', textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 2,
        color: ts.c,
        border: `1px solid ${ts.b}`,
        background: ts.bg,
        whiteSpace: 'nowrap',
      }}>
        {tier}
      </span>

      {/* Right slot — Sign / Fire / contract status */}
      <div>{right}</div>
    </div>
  )
}

/** TalentStat — Q or H stat block. Label above, value right-aligned,
 *  gradient-fill bar below. Matches the v3 proposal exactly. */
function TalentStat({ label, value, kind }) {
  const pct = Math.min(100, Math.max(0, value * 10))
  const grad = kind === 'q'
    ? `linear-gradient(90deg, ${T.qStart} 0%, ${T.qEnd} 100%)`
    : `linear-gradient(90deg, ${T.hStart} 0%, ${T.hEnd} 100%)`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 76 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase',
        color: T.muted, fontWeight: 600,
      }}>
        <span>{label}</span>
        <span style={{
          fontFamily: FONTS.mono, color: T.text, fontWeight: 600,
          letterSpacing: 0, fontSize: 11,
        }}>+{value.toFixed(1)}</span>
      </div>
      <div style={{
        width: '100%', height: 3,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: grad, borderRadius: 2 }} />
      </div>
    </div>
  )
}

/** Sign button — outline that fills with accent on hover. */
function SignButton({ priceLabel, disabled, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: !disabled && hover ? 'rgba(240, 179, 94, 0.12)' : 'transparent',
        border: `1px solid ${disabled ? T.border : 'rgba(240, 179, 94, 0.45)'}`,
        color: disabled ? T.muted : T.accent,
        padding: '9px 18px',
        fontFamily: FONTS.sans, fontWeight: 700,
        fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase',
        borderRadius: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .15s, border-color .15s, color .15s',
        minWidth: 84, gap: 2,
      }}
    >
      <span>{disabled ? 'Full' : 'Sign'}</span>
      {priceLabel && (
        <span style={{
          fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0,
          color: disabled ? T.muted : T.text, fontWeight: 600,
        }}>{priceLabel}</span>
      )}
    </button>
  )
}

function RosterGroup({ items, role, onFire }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 14 }}>
      {items.map(item => {
        const t = item.talent
        if (!t) return null
        return (
          <TalentCardRow
            key={t.id}
            talent={t}
            tier={t.tier}
            q={t.q}
            h={t.h}
            costLabel={item.permanent
              ? 'Permanent contract'
              : `${item.monthsLeft} ${item.monthsLeft === 1 ? 'month' : 'months'} left`}
            right={
              <button
                className="danger-btn"
                onClick={() => onFire(role, t.id, t)}
              >Fire</button>
            }
          />
        )
      })}
    </div>
  )
}

function MarketGroup({ pool, role, roomFull, onHire }) {
  // Filters live in component state so the player can narrow a large pool.
  const [specialtyFilter, setSpecialtyFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')

  if ((pool || []).length === 0) return null

  // Build the set of specialties that actually appear in the pool, so the
  // dropdown doesn't list options that would return nothing.
  const specialtiesInPool = [...new Set(pool.map(t => t.specialty))]
  const filteredPool = pool.filter(t => {
    if (specialtyFilter !== 'all' && t.specialty !== specialtyFilter) return false
    if (tierFilter !== 'all' && t.tier !== tierFilter) return false
    return true
  })

  const TIERS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Filter row — no surface, no box. Sits flat per the v3 design. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        marginBottom: 16, flexWrap: 'wrap',
      }}>
        {/* Specialty dropdown — custom-styled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '.16em',
            textTransform: 'uppercase', color: T.muted,
          }}>Specialty</span>
          <div style={{ position: 'relative' }}>
            <select
              value={specialtyFilter}
              onChange={e => setSpecialtyFilter(e.target.value)}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.text,
                padding: '7px 30px 7px 12px',
                fontFamily: FONTS.sans, fontSize: 12, fontWeight: 500,
                borderRadius: 4, cursor: 'pointer',
                minWidth: 150,
                transition: 'border-color .15s, background .15s',
              }}
            >
              <option value="all">All specialties</option>
              {specialtiesInPool.map(s => (
                <option key={s} value={s}>
                  {CATEGORIES[s]?.label || s}
                </option>
              ))}
            </select>
            {/* CSS chevron — replaces native dropdown arrow */}
            <div style={{
              position: 'absolute',
              right: 11, top: '50%',
              width: 7, height: 7,
              borderRight: `1.5px solid ${T.muted}`,
              borderBottom: `1.5px solid ${T.muted}`,
              transform: 'translateY(-70%) rotate(45deg)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Tier segmented pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '.16em',
            textTransform: 'uppercase', color: T.muted,
          }}>Tier</span>
          <div style={{
            display: 'flex',
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 5,
            padding: 2, gap: 2,
          }}>
            <SegPill label="All"      active={tierFilter === 'all'}      onClick={() => setTierFilter('all')} />
            {TIERS.map(tier => (
              <SegPill key={tier} label={tier}
                active={tierFilter === tier}
                onClick={() => setTierFilter(tier)}
              />
            ))}
          </div>
        </div>

        <div style={{
          marginLeft: 'auto',
          fontFamily: FONTS.mono, fontSize: 10.5,
          color: T.muted, letterSpacing: '.02em',
        }}>
          <span style={{ color: T.text, fontWeight: 600 }}>{filteredPool.length}</span>
          {' '}of {pool.length} candidates
        </div>
      </div>

      {/* Pool — either cards or empty state */}
      {filteredPool.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: T.surface,
          border: `1px dashed ${T.borderHi}`, borderRadius: 6,
        }}>
          <div style={{ fontSize: 32, opacity: 0.5, marginBottom: 12 }}>📭</div>
          <div style={{
            fontFamily: FONTS.serif, fontSize: 18,
            color: T.text, marginBottom: 8,
          }}>No candidates match these filters</div>
          <div style={{
            fontSize: 12, color: T.muted, maxWidth: 320,
            margin: '0 auto 16px', lineHeight: 1.5,
          }}>
            Try widening one of the filters, or wait until next month — the roster refreshes with fresh talent.
          </div>
          <button
            onClick={() => { setSpecialtyFilter('all'); setTierFilter('all') }}
            style={{
              background: 'transparent', color: T.accent,
              border: `1px solid ${T.accent}`,
              padding: '7px 16px', fontSize: 11, fontWeight: 600,
              letterSpacing: '.08em', textTransform: 'uppercase',
              borderRadius: 3, cursor: 'pointer',
            }}
          >Clear filters</button>
        </div>
      ) : (
        // Show up to 30 (filter is the primary narrowing control)
        filteredPool.slice(0, 30).map(t => (
          <TalentCardRow
            key={t.id}
            talent={t}
            tier={t.tier}
            q={t.q}
            h={t.h}
            costLabel={`$${t.cost.toFixed(1)}M/mo`}
            dim={roomFull}
            right={
              <SignButton
                priceLabel={`$${t.cost.toFixed(1)}M`}
                disabled={roomFull}
                onClick={() => !roomFull && onHire(role, t)}
              />
            }
          />
        ))
      )}
    </div>
  )
}

/** Segmented pill — gold-filled when active, transparent ghost when not. */
function SegPill({ label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        fontFamily: FONTS.sans, fontSize: 10.5, fontWeight: 600,
        letterSpacing: '.06em',
        color: active ? '#1a0f08' : (hover ? T.text : T.muted),
        background: active ? T.accent : (hover ? 'rgba(255, 255, 255, 0.04)' : 'transparent'),
        border: 'none', padding: '6px 12px',
        borderRadius: 3, cursor: 'pointer',
        transition: 'background .15s, color .15s',
      }}
    >{label}</button>
  )
}

function HireModal({ role, t, cash, onConfirm, onCancel }) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ padding: 24, maxWidth: 480, width: '100%' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.16em',
          textTransform: 'uppercase', color: T.accent, marginBottom: 6,
        }}>
          Sign contract · {t.tier}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 28, letterSpacing: '-.015em',
          color: T.text, marginBottom: 6, lineHeight: 1.05,
        }}>
          {t.name}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic', fontSize: 12.5,
          color: T.muted, marginBottom: 18,
        }}>
          Base cost{' '}
          <span style={{ fontStyle: 'normal', fontFamily: FONTS.mono, color: T.text }}>
            ${t.cost.toFixed(1)}M / month
          </span>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {CONTRACT_TYPES.map(ct => {
            const cost = contractCost(t, ct.id)
            const affordable = cash >= cost
            const priceLabel = ct.months === -1 ? `$${cost.toFixed(1)}M/mo` : `$${cost.toFixed(1)}M upfront`
            return (
              <button key={ct.id} disabled={!affordable} onClick={() => onConfirm(ct.id)}
                style={{
                  textAlign: 'left', padding: '12px 14px',
                  background: affordable
                    ? `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`
                    : T.surface,
                  border: `1px solid ${affordable ? T.borderHi : T.border}`,
                  borderRadius: 5, cursor: affordable ? 'pointer' : 'not-allowed',
                  opacity: affordable ? 1 : 0.45, color: T.text,
                  transition: 'border-color .15s, background .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{
                    fontFamily: FONTS.serif,
                    fontVariationSettings: "'opsz' 36, 'wght' 600",
                    fontSize: 15, color: T.text,
                  }}>{ct.label}</span>
                  <span style={{
                    fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                    color: ct.months === -1 ? T.gold : T.green,
                  }}>{priceLabel}</span>
                </div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4 }}>{ct.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </ModalOverlay>
  )
}

function FireConfirm({ role, id, t, onConfirm, onCancel }) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ padding: 24, maxWidth: 420, width: '100%' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.16em',
          textTransform: 'uppercase', color: T.red, marginBottom: 6,
        }}>
          Confirm release
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 24, letterSpacing: '-.01em',
          color: T.text, marginBottom: 10, lineHeight: 1.1,
        }}>
          Fire {t.name}?
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic', fontSize: 13,
          color: T.muted, marginBottom: 20, lineHeight: 1.5,
        }}>
          You'll pay a severance penalty. Permanent contracts cost{' '}
          <span style={{ fontStyle: 'normal', fontFamily: FONTS.mono, color: T.red, fontWeight: 600 }}>5×</span>{' '}
          one month's pay.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 14px',
            background: 'transparent', border: `1px solid ${T.border}`,
            color: T.text, borderRadius: 4,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '.04em',
          }}>Keep</button>
          <button onClick={onConfirm} style={{
            flex: 2, padding: '10px 14px',
            background: T.red, color: T.text,
            border: 'none', borderRadius: 4,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '.08em', textTransform: 'uppercase',
          }}>Fire</button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ─── 2. PURCHASE RIGHTS TAB ──────────────────────────────────────────────
function RightsTab({ station, year, monthIdx, research, onBuyIP, onBuyMoviePack, onBuySportsLicense }) {
  const [section, setSection] = useState('ip')
  return (
    <div>
      {/* Sub-sub-tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 14,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <SubSubTab id="ip"     label="IP Licenses" active={section} onClick={setSection} />
        <SubSubTab id="sports" label="Sports"      active={section} onClick={setSection} />
        <SubSubTab id="movies" label="Movie Packs" active={section} onClick={setSection} />
      </div>

      {section === 'ip' && (
        <>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
            License existing IPs (books, characters, franchises) to pair with scripts for hype + quality bumps.
          </div>
          <IPBlock station={station} year={year} research={research} onBuy={onBuyIP} />
        </>
      )}

      {section === 'sports' && (
        <>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Buy a full year of league rights, then assign them to a slot in Programming.
            Each league only airs during its real season, and gets a big bump on its peak month.
            Major leagues cost more in bigger markets.
          </div>
          <SportsBlock station={station} year={year} onBuy={onBuySportsLicense} />
        </>
      )}

      {section === 'movies' && (
        <>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Each pack gives you 3 airings of the same licensed film. When you exhaust a pack, it returns to the catalog — but re-buying within 12 months means reduced hype (overexposure).
          </div>
          <MoviePackBlock station={station} year={year} monthIdx={monthIdx} onBuy={onBuyMoviePack} />
        </>
      )}
    </div>
  )
}

function SubSubTab({ id, label, active, onClick }) {
  const isActive = active === id
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        background: 'transparent',
        border: 'none',
        color: isActive ? T.accent : T.muted,
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: isActive ? 700 : 500,
        cursor: 'pointer',
        letterSpacing: '.02em',
        borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  )
}

function SportsBlock({ station, year, onBuy }) {
  const owned = (station.sportsLicenses || []).filter(l => l.year === year)
  const ownedIds = new Set(owned.map(l => l.leagueId))
  const market = station.market

  // Group leagues by tier so the UI tells the story: mega → pro → college →
  // regional. Mega events sit at the top because they're the most expensive
  // AND grant the most fame — they're the headline acquisitions.
  const tierOrder = ['mega', 'pro', 'college', 'regional', 'niche']
  const byTier = {}
  for (const lg of SPORTS_LEAGUES) {
    const t = lg.tier || 'pro'
    if (!byTier[t]) byTier[t] = []
    byTier[t].push(lg)
  }
  const tierLabels = {
    mega: 'Mega Events',
    pro: 'Pro Leagues',
    college: 'College',
    regional: 'Regional',
    niche: 'Niche',
  }

  return (
    <div>
      {tierOrder.filter(t => byTier[t]).map(t => (
        <div key={t} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 10, color: T.muted, letterSpacing: '.15em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>{tierLabels[t]}</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 8,
          }}>
            {byTier[t].map(lg => {
              const isOwned = ownedIds.has(lg.id)
              const cost = sportsLicenseCost(lg.id, market)
              const affordable = station.cash >= cost
              const availableThisYear = leagueAvailableInYear(lg, year)
              const yearsAway = availableThisYear ? 0 : leagueYearsUntilReturn(lg, year)
              const fame = lg.fameOnSign || 0
              const canBuy = !isOwned && affordable && availableThisYear

              return (
                <div key={lg.id} style={{
                  background: isOwned ? T.green + '15' : (!availableThisYear ? T.bg : T.card),
                  border: `1px solid ${isOwned ? T.green : (!availableThisYear ? T.border : T.border)}`,
                  borderRadius: 5, padding: 10,
                  opacity: availableThisYear ? 1 : 0.65,
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: isOwned ? T.green : T.text,
                  }}>
                    {lg.icon} {lg.label} {isOwned && '✓'}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 3, lineHeight: 1.4 }}>
                    Season: {lg.season.length} mo · Peak: {MONTHS[lg.peakMonth]} ({lg.peakLabel})
                  </div>
                  {fame > 0 && (
                    <div style={{
                      fontSize: 10, color: T.gold, marginTop: 4, fontWeight: 600,
                    }}>
                      ⭐ +{fame} fame on signing
                    </div>
                  )}
                  {!availableThisYear ? (
                    <div style={{
                      marginTop: 7, fontSize: 10, color: T.muted,
                      fontStyle: 'italic',
                      background: T.border + '33', padding: '4px 6px', borderRadius: 3,
                    }}>
                      Returns in Y{year + (yearsAway || 1)}
                    </div>
                  ) : !isOwned ? (
                    <button
                      onClick={() => onBuy(lg.id)}
                      disabled={!affordable}
                      style={{
                        width: '100%', marginTop: 7, padding: '6px 8px',
                        background: affordable ? T.accent : T.border,
                        color: affordable ? T.bg : T.muted,
                        border: 'none', borderRadius: 4,
                        fontSize: 11, fontWeight: 700,
                        cursor: affordable ? 'pointer' : 'not-allowed',
                      }}
                    >${cost.toFixed(0)}M · BUY</button>
                  ) : (
                    <div style={{ marginTop: 7, fontSize: 10, color: T.green, fontStyle: 'italic' }}>
                      Owned · Use in slot editor
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function IPBlock({ station, year, research, onBuy }) {
  const [ipModal, setIpModal] = useState(null)

  // Owned vs available
  const owned = activeIPLicenses(station, year)
  const ownedById = new Map(owned.map(o => [o.ipId, o]))

  return (
    <div>
      {/* Owned IPs */}
      {owned.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: T.green, marginBottom: 6 }}>YOU OWN ({owned.length})</div>
          <div style={{ display: 'grid', gap: 6,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {owned.map(o => {
              const ip = findIP(o.ipId)
              if (!ip) return null
              return (
                <div key={o.ipId} style={{
                  padding: 9, background: T.green + '12',
                  border: `1px solid ${T.green}55`, borderRadius: 5,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>📜 {ip.name}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                    Q +{ip.q.toFixed(1)} H +{ip.h.toFixed(1)} · Fits: {ip.fits.join(', ')}
                  </div>
                  <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>
                    Expires after Year {o.expiresYear}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available IPs */}
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>AVAILABLE TO LICENSE</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {IPS.filter(ip => !ownedById.has(ip.id)).map(ip => (
          <div key={ip.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 10, background: T.card, border: `1px solid ${T.border}`, borderRadius: 5,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>📜 {ip.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>
                Q +{ip.q.toFixed(1)} H +{ip.h.toFixed(1)} · Fits: {ip.fits.join(', ')}
              </div>
            </div>
            <HTag tier={ip.tier} />
            <button onClick={() => setIpModal(ip)} style={{
              background: T.accent, color: T.bg, padding: '6px 12px',
              border: 'none', borderRadius: 4,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>License</button>
          </div>
        ))}
      </div>

      {ipModal && (
        <IPLicenseModal ip={ipModal} station={station} year={year} research={research}
          onConfirm={(termId) => { onBuy(ipModal.id, termId); setIpModal(null) }}
          onCancel={() => setIpModal(null)}
        />
      )}
    </div>
  )
}

function IPLicenseModal({ ip, station, year, research, onConfirm, onCancel }) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ padding: 18 }}>
        <div className="bebas" style={{ fontSize: 18, color: T.accent, marginBottom: 4 }}>
          License {ip.name}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>
          Free per-show use during the license term. Renewable when it expires.
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {IP_LICENSE_TERMS.map(term => {
            const cost = ipLicenseCost(ip.id, term.id, research)
            const affordable = station.cash >= cost
            const expYear = year + term.years - 1
            return (
              <button key={term.id} disabled={!affordable} onClick={() => onConfirm(term.id)} style={{
                textAlign: 'left', padding: '11px 13px',
                background: affordable ? T.cardHi : T.surface,
                border: `1px solid ${affordable ? T.borderHi : T.border}`,
                borderRadius: 5, cursor: affordable ? 'pointer' : 'not-allowed',
                opacity: affordable ? 1 : 0.5, color: T.text,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{term.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.green }}>
                    ${cost.toFixed(1)}M · expires Y{expYear}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: T.muted }}>{term.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </ModalOverlay>
  )
}

// ─── 3. STAFF TAB ────────────────────────────────────────────────────────
function StaffTab({ station, pendingHires, onOpenPosition, onCancelPosition, onPickCandidate, onFireStaff, onHireDirector, onFireDirector, research }) {
  const personnelHired = !!station.staff?.personnel
  const salary = staffSalaryTotal(station)
  const isNational = station.market === 'national'

  return (
    <div>
      {/* Office floor plan — visual status of who's been hired */}
      <OfficeFloorPlan station={station} />

      {/* Pending hires — must resolve first */}
      {pendingHires.length > 0 && (
        <div style={{
          marginBottom: 22, padding: 14,
          background: T.gold + '14', border: `1px solid ${T.gold}55`, borderRadius: 6,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>
            ⭐ {pendingHires.length} search result{pendingHires.length > 1 ? 's' : ''} ready — pick a candidate
          </div>
          {pendingHires.map(p => (
            <PendingHireBlock key={p.role} pending={p} onPick={onPickCandidate} />
          ))}
        </div>
      )}

      {/* Total salary */}
      <div style={{
        marginBottom: 18, padding: 12,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 12 }}>Monthly salary burn</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: salary > 0 ? T.red : T.muted, fontWeight: 700 }}>
          {salary > 0 ? `$${salary.toFixed(1)}M/mo` : 'None hired'}
        </div>
      </div>

      {/* VP section */}
      <SectionTitle>Vice Presidents</SectionTitle>
      <div style={{ display: 'grid', gap: 10 }}>
        {STAFF_ROLES.map(role => (
          <StaffRoleCard
            key={role.id}
            role={role}
            station={station}
            research={research}
            personnelHired={personnelHired}
            onOpen={onOpenPosition}
            onCancel={onCancelPosition}
            onFire={onFireStaff}
          />
        ))}
      </div>

      {!personnelHired && (
        <div style={{
          marginTop: 14, padding: 12,
          background: T.cardHi, border: `1px dashed ${T.border}`, borderRadius: 5,
          fontSize: 11, color: T.muted, lineHeight: 1.5,
        }}>
          💡 Hire a VP of Personnel first — they unlock searches for all other VPs.
          Until then only Personnel can be opened (via Quick Search).
        </div>
      )}

      {/* Directors section — only relevant at National */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle>Directors</SectionTitle>
        {!isNational ? (
          <div style={{
            padding: 12, background: T.cardHi,
            border: `1px dashed ${T.border}`, borderRadius: 5,
            fontSize: 11, color: T.muted, lineHeight: 1.5,
          }}>
            🔒 Director-level hires are only available at the National office.
            Promote your market when you're ready.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {DIRECTOR_ROLES.map(role => (
              <DirectorRoleCard
                key={role.id}
                role={role}
                station={station}
                onHire={onHireDirector}
                onFire={onFireDirector}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** A single director card — hire/fire UI for one DIRECTOR_ROLES entry. */
function DirectorRoleCard({ role, station, onHire, onFire }) {
  const cur = directorCount(station, role.id)
  const isScheduling = role.id === 'scheduling'
  const max = role.maxCount || 1
  const filled = cur >= max
  const check = canHireDirector(station, role.id)
  const canHire = check.ok && station.cash >= DIRECTOR_HIRE_COST
  const hireDisabledReason = !check.ok
    ? check.reason
    : (station.cash < DIRECTOR_HIRE_COST ? `Need $${DIRECTOR_HIRE_COST}M` : null)

  return (
    <div style={{
      padding: 12, background: T.surface,
      border: `1px solid ${cur > 0 ? T.gold + '88' : T.border}`,
      borderRadius: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{role.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{role.label}</div>
            {cur > 0 && (
              <Pill color={T.gold}>
                {isScheduling ? `${cur} / ${max}` : 'Hired'}
              </Pill>
            )}
          </div>
          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, marginBottom: 8 }}>
            {role.desc}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 8 }}>
            ${DIRECTOR_SALARY.toFixed(1)}M / month · ${DIRECTOR_HIRE_COST.toFixed(1)}M to hire (Common)
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => onHire(role.id)}
              disabled={!canHire || filled}
              style={{
                background: (canHire && !filled) ? T.accent + '22' : 'transparent',
                border: `1.5px solid ${(canHire && !filled) ? T.accent : T.border}`,
                color: (canHire && !filled) ? T.accent : T.muted,
                padding: '6px 12px', fontSize: 11, fontWeight: 700,
                borderRadius: 4,
                cursor: (canHire && !filled) ? 'pointer' : 'not-allowed',
              }}
            >
              {filled ? 'Slots full' : (isScheduling && cur > 0 ? `Hire another (${cur + 1}/${max})` : 'Hire')}
            </button>
            {cur > 0 && (
              <button
                onClick={() => onFire(role.id)}
                style={{
                  background: 'transparent', border: `1.5px solid ${T.red}88`,
                  color: T.red, padding: '6px 12px', fontSize: 11, fontWeight: 600,
                  borderRadius: 4, cursor: 'pointer',
                }}
              >
                {isScheduling && cur > 1 ? `Fire one (${cur - 1} remain)` : 'Fire'}
              </button>
            )}
          </div>
          {hireDisabledReason && cur === 0 && (
            <div style={{ fontSize: 10, color: T.muted, marginTop: 6, fontStyle: 'italic' }}>
              {hireDisabledReason}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PendingHireBlock({ pending, onPick }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>
        VP OF {pending.role.toUpperCase()} — pick one of {pending.candidates.length}
      </div>
      <div style={{ display: 'grid', gap: 5 }}>
        {pending.candidates.map((c, i) => (
          <button key={i} onClick={() => onPick(pending.role, c)} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 10, background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 5, cursor: 'pointer', color: T.text, textAlign: 'left',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>
                ${STAFF_SALARY_BY_TIER[c.tier].toFixed(1)}M/mo salary
              </div>
            </div>
            <HTag tier={c.tier} />
          </button>
        ))}
      </div>
    </div>
  )
}

function StaffRoleCard({ role, station, research, personnelHired, onOpen, onCancel, onFire }) {
  const hired = station.staff?.[role.id]
  const openPos = (station.openPositions || []).find(p => p.role === role.id)
  const locked = !personnelHired && role.id !== 'personnel'

  return (
    <div style={{
      padding: 12,
      background: hired ? T.green + '08' : T.surface,
      border: `1px solid ${hired ? T.green + '55' : T.border}`,
      borderRadius: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontSize: 20 }}>{role.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{role.label}</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>
            {role.desc}
          </div>
        </div>
        {hired && <HTag tier={hired.tier} />}
      </div>

      {/* Hired state */}
      {hired && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: T.green + '10', borderRadius: 4,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{hired.name}</div>
            <div style={{ fontSize: 10, color: T.muted }}>
              ${STAFF_SALARY_BY_TIER[hired.tier].toFixed(1)}M/mo · effect: {effectSummary(role, hired.tier)}
            </div>
          </div>
          <button onClick={() => {
            if (window.confirm(`Fire ${hired.name}? Severance = ${STAFF_FIRE_PENALTY_MULT}× one month ($${(STAFF_SALARY_BY_TIER[hired.tier] * STAFF_FIRE_PENALTY_MULT).toFixed(1)}M).`)) {
              onFire(role.id)
            }
          }} style={{
            background: 'transparent', border: `1px solid ${T.red}55`,
            color: T.red, padding: '5px 10px', borderRadius: 4,
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
          }}>Fire</button>
        </div>
      )}

      {/* Open search */}
      {openPos && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: T.gold + '10', border: `1px solid ${T.gold}33`, borderRadius: 4,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, color: T.gold }}>
            🔍 Finding a {role.label}… {openPos.monthsLeft}/{openPos.monthsTotal} mo left
          </div>
          <button onClick={() => onCancel(role.id)} style={{
            background: 'transparent', border: `1px solid ${T.red}55`,
            color: T.red, padding: '4px 8px', borderRadius: 4,
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
          }}>Cancel</button>
        </div>
      )}

      {/* Hire actions */}
      {!hired && !openPos && (
        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STAFF_SEARCHES.map(s => {
            const available = isSearchTierAvailable(s.id, research, role.id, personnelHired)
            return (
              <button key={s.id} disabled={!available || locked} onClick={() => onOpen(role.id, s.id)}
                style={{
                  flex: '1 1 auto', padding: '7px 10px',
                  background: available && !locked ? T.cardHi : T.surface,
                  border: `1px solid ${available && !locked ? T.borderHi : T.border}`,
                  color: available && !locked ? T.text : T.muted,
                  borderRadius: 4, cursor: available && !locked ? 'pointer' : 'not-allowed',
                  fontSize: 11, fontWeight: 600, opacity: available && !locked ? 1 : 0.5,
                }}
              >
                <div>{s.label}</div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>
                  {s.months} mo · ${s.cost.toFixed(1)}M
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function isSearchTierAvailable(tierId, research, roleId, personnelHired) {
  if (tierId === 'quick') return true  // always available
  if (!personnelHired && roleId !== 'personnel') return false
  if (tierId === 'normal') return (research?.unlocked || []).includes('ops_search_normal')
  if (tierId === 'heavy')  return (research?.unlocked || []).includes('ops_search_heavy')
  return false
}

function effectSummary(role, tier) {
  const eff = STAFF_EFFECTS[role.id]?.[tier]
  if (!eff) return '—'
  if (role.id === 'operations') return `prod cost ×${eff.prodCostMult?.toFixed(2)}`
  if (role.id === 'innovation') return `research cost ×${eff.researchCostMult?.toFixed(2)}, time ×${eff.researchMonthsMult?.toFixed(2)}`
  if (role.id === 'marketing')  return `mktg cost ×${eff.mktgCostMult?.toFixed(2)}, impact ×${eff.mktgImpactMult?.toFixed(2)}`
  if (role.id === 'content')    return `+${eff.qBonus?.toFixed(2)} quality on every show`
  if (role.id === 'personnel')  return 'unlocks hiring'
  return ''
}

// ─── 4. MARKETING TAB ────────────────────────────────────────────────────
//
// Marketing campaigns are station-wide brand initiatives. The catalog is in
// NETWORK_CAMPAIGNS in constants.js. Two flavors:
//
//   1. Quick campaigns (Local Buzz, Regional Push, National) — one click,
//      no inputs needed. Effect lasts 1 month except where noted.
//
//   2. Mega campaigns (Sponsor Event, Sponsor Team, Super Bowl Ad) — open
//      the CampaignLauncher modal where you pick a star + 2 shows. The
//      effect scales with the chosen inputs' quality + hype + star tier.
//
// Multiple campaigns can stack. Active ones list at top with month counter.
function MarketingTab({ station, research, onLaunchCampaign }) {
  // Modal state: which mega-tier the player is configuring, null = closed
  const [launcherTier, setLauncherTier] = useState(null)
  const active = station.activeCampaigns || []

  // Marketing-VP staff bonus — same logic the engine uses, but we recompute
  // it here so the catalog shows accurate prices/effects.
  const mktgEff = STAFF_EFFECTS.marketing?.[station.staff?.marketing?.tier]
  const costMult = mktgEff?.mktgCostMult || 1.0
  const impactMult = mktgEff?.mktgImpactMult || 1.0

  // Market gating — check which tiers the player is allowed to launch
  const marketRank = MARKET_ORDER.indexOf(station.market || 'local')

  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Station-wide campaigns boost <strong>every show</strong>'s hype while active and
        grant a one-time fame bump on launch. Sponsorships run multiple months;
        Super Bowl ads burn bright for one. Campaigns can stack.
      </div>

      {active.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 10, color: T.muted, letterSpacing: '.12em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>Active ({active.length})</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {active.map(c => (
              <ActiveCampaignCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      )}

      <div style={{
        fontSize: 10, color: T.muted, letterSpacing: '.12em',
        textTransform: 'uppercase', marginBottom: 6,
      }}>Launch a new campaign</div>

      <div style={{ display: 'grid', gap: 8 }}>
        {NETWORK_CAMPAIGNS.map(c => {
          const adjustedCost = c.cost * costMult
          const adjustedHype = c.hypeBoost * impactMult
          const adjustedFame = c.fameGain * impactMult
          const minRank = MARKET_ORDER.indexOf(c.minMarket || 'local')
          const marketOk = marketRank >= minRank
          const affordable = station.cash >= adjustedCost
          const canLaunch = affordable && marketOk

          // Mega campaigns open the modal; basic campaigns launch directly.
          const handleClick = () => {
            if (!canLaunch) return
            if (c.needsInputs) setLauncherTier(c)
            else onLaunchCampaign(c.id)
          }

          return (
            <button
              key={c.id}
              disabled={!canLaunch}
              onClick={handleClick}
              style={{
                padding: '12px 14px', textAlign: 'left',
                background: canLaunch ? T.card : T.surface,
                border: `1px solid ${c.needsInputs ? T.gold + '55' : T.border}`,
                borderRadius: 5, cursor: canLaunch ? 'pointer' : 'not-allowed',
                opacity: canLaunch ? 1 : 0.55, color: T.text,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {c.icon || '📣'} {c.label}
                  {c.needsInputs && (
                    <span style={{
                      marginLeft: 8, fontSize: 9, color: T.gold,
                      background: T.gold + '22', border: `1px solid ${T.gold}66`,
                      padding: '1px 6px', borderRadius: 3,
                      letterSpacing: '.1em', fontWeight: 700,
                    }}>MEGA</span>
                  )}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: T.red, fontWeight: 700 }}>
                  ${adjustedCost.toFixed(1)}M
                </span>
              </div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4 }}>
                {c.desc}
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
                +{adjustedFame.toFixed(1)} fame · +{adjustedHype.toFixed(2)} hype/mo · {c.monthsActive || 1} mo
                {!marketOk && <span style={{ color: T.red, marginLeft: 6 }}>· Requires {c.minMarket} market</span>}
                {marketOk && !affordable && <span style={{ color: T.red, marginLeft: 6 }}>· Not enough cash</span>}
                {c.needsInputs && marketOk && affordable && (
                  <span style={{ color: T.gold, marginLeft: 6 }}>· Tap to configure ▸</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {launcherTier && (
        <CampaignLauncher
          tier={launcherTier}
          station={station}
          costMult={costMult}
          impactMult={impactMult}
          onCancel={() => setLauncherTier(null)}
          onLaunch={(opts) => {
            setLauncherTier(null)
            onLaunchCampaign(launcherTier.id, opts)
          }}
        />
      )}
    </div>
  )
}

/** Pinned card showing one active campaign, with a months-remaining badge. */
function ActiveCampaignCard({ c }) {
  // Multi-month campaigns show progress; one-month campaigns just show "1 mo".
  const totalMonths = c.monthsTotal || 1
  const remaining = c.monthsRemaining || 1
  return (
    <div style={{
      padding: 10,
      background: T.gold + '12',
      border: `1px solid ${T.gold}55`, borderRadius: 5,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>
          {c.icon || '📣'} {c.label}
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono', color: T.gold,
          background: T.gold + '22', padding: '2px 8px', borderRadius: 3,
        }}>
          {remaining}/{totalMonths} mo left
        </span>
      </div>
      <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.4 }}>
        +{(c.hypeBoost || 0).toFixed(2)} hype on every airing
        {c.starName && ` · featuring ${c.starName}`}
        {c.showNames?.length === 2 && ` · ${c.showNames[0]} + ${c.showNames[1]}`}
      </div>
      {c.inputMultiplier && c.inputMultiplier !== 1.0 && (
        <div style={{ fontSize: 9, color: T.muted, marginTop: 3, fontStyle: 'italic' }}>
          Input multiplier: ×{c.inputMultiplier.toFixed(2)}
        </div>
      )}
    </div>
  )
}

/** Modal for configuring a mega-campaign: pick star + 2 shows.
 *  Shows live preview of effect strength as inputs change. */
function CampaignLauncher({ tier, station, costMult, impactMult, onCancel, onLaunch }) {
  // Eligible stars — only those the player has under contract
  const hiredStars = (station.hiredStars || [])
    .map(h => ({ contract: h, star: findStar(h.talentId) }))
    .filter(({ star }) => star !== null)

  // Eligible shows — any program the player owns. Includes producing,
  // shelved, and currently-airing. We DON'T filter to airing-only because
  // the campaign markets your tentpole catalog, not just what's on this
  // week — Game of Thrones can be the face of an HBO ad even between
  // seasons.
  const programs = (station.programs || []).filter(p => p.status !== 'cancelled')

  const [starId, setStarId] = useState(hiredStars[0]?.star?.id || '')
  const [show1Id, setShow1Id] = useState(programs[0]?.id || '')
  const [show2Id, setShow2Id] = useState(programs[1]?.id || '')

  const star = starId ? findStar(starId) : null
  const show1 = programs.find(p => p.id === show1Id) || null
  const show2 = programs.find(p => p.id === show2Id) || null

  // Live preview math — same formula the engine uses.
  const inputMult = computeCampaignInputMultiplier(star, show1, show2)
  const adjustedCost = tier.cost * costMult
  const adjustedHype = tier.hypeBoost * inputMult * impactMult
  const adjustedFame = tier.fameGain * inputMult * impactMult

  // Validation
  const hasEnoughStars = hiredStars.length >= 1
  const hasEnoughShows = programs.length >= 2
  const distinctShows = show1Id && show2Id && show1Id !== show2Id
  const affordable = station.cash >= adjustedCost
  const canLaunch = !!star && !!show1 && !!show2 && distinctShows && affordable

  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ padding: 18, maxWidth: 540, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div className="bebas" style={{ fontSize: 22, color: T.gold, letterSpacing: '.02em' }}>
              {tier.icon} {tier.label}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {tier.monthsActive} month{tier.monthsActive > 1 ? 's' : ''} · {tier.minMarket} market minimum
            </div>
          </div>
          <button onClick={onCancel} style={{
            background: 'transparent', border: 'none', color: T.muted,
            fontSize: 20, cursor: 'pointer', padding: 4,
          }}>×</button>
        </div>

        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.5 }}>
          {tier.desc}
        </div>

        {/* Star picker */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
            Featured Star
          </div>
          {!hasEnoughStars ? (
            <div style={{
              padding: 10, background: T.bg, border: `1px solid ${T.red}55`,
              borderRadius: 4, fontSize: 11, color: T.red,
            }}>
              You don't have any stars under contract. Sign one before launching this campaign.
            </div>
          ) : (
            <select
              value={starId}
              onChange={e => setStarId(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px',
                background: T.bg, color: T.text,
                border: `1px solid ${T.border}`, borderRadius: 4,
                fontSize: 12,
              }}
            >
              {hiredStars.map(({ star: s }) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.tier} {s.specialty} (Q+{s.q.toFixed(1)} H+{s.h.toFixed(1)})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Show pickers */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
            Tentpole Shows (choose 2)
          </div>
          {!hasEnoughShows ? (
            <div style={{
              padding: 10, background: T.bg, border: `1px solid ${T.red}55`,
              borderRadius: 4, fontSize: 11, color: T.red,
            }}>
              You need at least two programs in your catalog before launching this campaign.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              <select
                value={show1Id}
                onChange={e => setShow1Id(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px',
                  background: T.bg, color: T.text,
                  border: `1px solid ${T.border}`, borderRadius: 4,
                  fontSize: 12,
                }}
              >
                <option value="">— Pick first show —</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Q{p.trueQ?.toFixed(1) || '?'} H{p.trueH?.toFixed(1) || '?'})
                  </option>
                ))}
              </select>
              <select
                value={show2Id}
                onChange={e => setShow2Id(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px',
                  background: T.bg, color: T.text,
                  border: `1px solid ${T.border}`, borderRadius: 4,
                  fontSize: 12,
                }}
              >
                <option value="">— Pick second show —</option>
                {programs.filter(p => p.id !== show1Id).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Q{p.trueQ?.toFixed(1) || '?'} H{p.trueH?.toFixed(1) || '?'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div style={{
          padding: 12, marginBottom: 14,
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5,
        }}>
          <div style={{
            fontSize: 10, color: T.muted, letterSpacing: '.12em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>Preview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            <div>
              <div style={{ color: T.muted, fontSize: 10 }}>Hype per airing</div>
              <div style={{ color: T.gold, fontSize: 16, fontWeight: 700 }}>
                +{adjustedHype.toFixed(2)}
              </div>
              <div style={{ color: T.muted, fontSize: 9 }}>
                for {tier.monthsActive} month{tier.monthsActive > 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 10 }}>Fame on launch</div>
              <div style={{ color: T.gold, fontSize: 16, fontWeight: 700 }}>
                +{adjustedFame.toFixed(1)}
              </div>
              <div style={{ color: T.muted, fontSize: 9 }}>
                input multiplier ×{inputMult.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{
            marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`,
            fontSize: 11, color: T.textDim, fontStyle: 'italic', lineHeight: 1.4,
          }}>
            {inputMult >= 1.5 ? `Excellent inputs — a stacked star and strong shows make this campaign roar.`
              : inputMult >= 1.2 ? `Solid inputs — your campaign lands well.`
              : inputMult >= 0.9 ? `Average inputs — the campaign does its job, no fireworks.`
              : `Weak inputs — most of this spend won't translate. Consider stronger shows or a bigger star.`}
          </div>
        </div>

        {/* Cost + launch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.muted }}>Cost</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: T.red, fontWeight: 700 }}>
            ${adjustedCost.toFixed(1)}M
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 14px',
            background: T.card, color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 4,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => canLaunch && onLaunch({ starId, showProgramIds: [show1Id, show2Id] })}
            disabled={!canLaunch}
            style={{
              flex: 2, padding: '10px 14px',
              background: canLaunch ? T.gold : T.border,
              color: canLaunch ? T.bg : T.muted,
              border: 'none', borderRadius: 4,
              fontSize: 13, fontWeight: 700, cursor: canLaunch ? 'pointer' : 'not-allowed',
              letterSpacing: '.05em',
            }}
          >
            {!affordable ? 'NOT ENOUGH CASH'
              : !star ? 'PICK A STAR'
              : !show1 || !show2 ? 'PICK TWO SHOWS'
              : !distinctShows ? 'PICK TWO DIFFERENT SHOWS'
              : `LAUNCH · $${adjustedCost.toFixed(1)}M`}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ─── MODAL OVERLAY ───────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,14,23,.85)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 12, overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 8, maxWidth: 520, width: '100%', marginTop: 30,
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── NETWORK STATUS TAB ──────────────────────────────────────────────────
//
// Dashboard view: how is the network doing?
//   1. Stat strip — current month/year/market/fame.
//   2. Three-month trend — audience and revenue for the last 3 completed
//      months side by side, each with a tiny sparkline-style mini bar chart
//      and a direction arrow.
//   3. Specialization grid — 8 genres, 5-star meter + XP progress.
//   4. Awards by year — table of wins per year.
//
function StatusTab({ station, year, monthIdx, allShows, awardsByYear, onPromote }) {
  const market = MARKETS[station.market]

  // Determine if expansion is available right now.
  const promotable = canPromote(station)
  const idx = MARKET_ORDER.indexOf(station.market)
  const nextMarket = idx < MARKET_ORDER.length - 1 ? MARKETS[MARKET_ORDER[idx + 1]] : null
  const expansionCost = nextMarket?.promoteCost || 0
  const canAffordExpansion = station.cash >= expansionCost

  // ── Aggregate per-month audience + revenue from allShows ──────────────
  // allShows is the flat list of every airing the player has ever produced
  // across every year. We bucket by (year, monthIdx) and pull the last 3
  // *completed* months for the trend view.
  const monthBuckets = useMemo(() => {
    const map = new Map()
    for (const s of (allShows || [])) {
      const key = `${s.year}-${s.month}`
      if (!map.has(key)) map.set(key, { year: s.year, month: s.month, audience: 0, revenue: 0, count: 0 })
      const b = map.get(key)
      b.audience += s.audience || 0
      b.revenue  += s.revenue || 0
      b.count    += 1
    }
    return Array.from(map.values()).sort((a, b) => (a.year - b.year) || (a.month - b.month))
  }, [allShows])

  // Last completed month = (year, monthIdx-1) with wrap. We want the most
  // recent 3 entries from monthBuckets that come BEFORE the current month.
  const trend = useMemo(() => {
    const filtered = monthBuckets.filter(b =>
      b.year < year || (b.year === year && b.month < monthIdx)
    )
    return filtered.slice(-3)
  }, [monthBuckets, year, monthIdx])

  const audDirection = trendDirection(trend.map(t => t.audience))
  const revDirection = trendDirection(trend.map(t => t.revenue))

  // ── Awards aggregation ────────────────────────────────────────────────
  const awardRows = useMemo(() => {
    const rows = []
    for (const [yearStr, aw] of Object.entries(awardsByYear || {})) {
      const yr = Number(yearStr)
      let count = 0
      let cash  = 0
      let fame  = 0
      ;(aw.wins || []).forEach(w => { count += 1; cash += w.cashBonus || 0; fame += w.fameBonus || 0 })
      if (aw.bestOverall) { count += 1; cash += aw.bestOverall.cashBonus || 0; fame += aw.bestOverall.fameBonus || 0 }
      if (aw.mostWatched) { count += 1; cash += aw.mostWatched.cashBonus || 0; fame += aw.mostWatched.fameBonus || 0 }
      rows.push({ year: yr, count, cash, fame })
    }
    rows.sort((a, b) => b.year - a.year)
    return rows
  }, [awardsByYear])

  return (
    <div>
      {/* ─── STAT STRIP ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
        marginBottom: 24,
      }}>
        <StatusStat label="Period"   value={`${MONTHS[monthIdx]} Y${year}`} accent={T.text} />
        <StatusStat label="Market"   value={market.label}                   accent={T.teal} />
        <StatusStat label="Cash"     value={fmtM(station.cash)}             accent={T.green} />
        <StatusStat label="Fame"     value={`${station.fame.toFixed(1)} · ${fameLabel(station.fame)}`} accent={T.gold} />
        {market.monthlyInfra > 0 && (
          <StatusStat label="Infra"  value={`${fmtM(market.monthlyInfra)}/mo`} accent={T.red} />
        )}
      </div>

      {/* ─── EXPANSION OPPORTUNITY (only when promotable) ─── */}
      {promotable && nextMarket && (
        <div style={{
          background: 'linear-gradient(135deg, ' + T.teal + '18 0%, ' + T.teal + '08 100%)',
          border: `1px solid ${T.teal}`,
          borderRadius: 6, padding: 16, marginBottom: 24,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
          }}>
            <Icon name="chart_up" size={18} color={T.teal} />
            <div className="display" style={{
              fontSize: 16, color: T.teal, letterSpacing: '.08em', textTransform: 'uppercase',
            }}>Expansion Available</div>
          </div>
          <div style={{ fontSize: 12.5, color: T.text, marginBottom: 12, lineHeight: 1.55 }}>
            You've reached the fame threshold for <b>{nextMarket.label}</b>. {nextMarket.desc}
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 8, marginBottom: 12,
            padding: 10, background: 'rgba(0,0,0,.25)', borderRadius: 4,
          }}>
            <StatusStat label="One-time"      value={fmtM(expansionCost)}             accent={canAffordExpansion ? T.text : T.red} />
            <StatusStat label="Monthly infra" value={`${fmtM(nextMarket.monthlyInfra)}/mo`} accent={T.text} />
            <StatusStat label="Prod cost"     value={`×${nextMarket.prodCostMult.toFixed(2)}`} accent={T.text} />
            <StatusStat label="Rev/viewer"    value={`$${nextMarket.revPerViewer.toFixed(1)}`} accent={T.green} />
          </div>
          <div style={{
            fontSize: 11, color: T.gold, lineHeight: 1.55, marginBottom: 12,
            padding: '8px 10px',
            background: T.gold + '0c', border: `1px dashed ${T.gold}55`, borderRadius: 4,
          }}>
            ⚠ Specialization reset: only your specialty (min 0.5★) and any genre at 4★+ (kept at 1★) carry over.
          </div>
          <button
            onClick={canAffordExpansion ? onPromote : undefined}
            disabled={!canAffordExpansion}
            style={{
              background: canAffordExpansion ? T.teal : T.card,
              color: canAffordExpansion ? T.bg : T.muted,
              border: 'none', borderRadius: 4,
              padding: '11px 18px',
              fontFamily: 'Anton, sans-serif',
              fontSize: 15, letterSpacing: '.08em',
              textTransform: 'uppercase',
              cursor: canAffordExpansion ? 'pointer' : 'not-allowed',
            }}
          >
            {canAffordExpansion ? `Expand for ${fmtM(expansionCost)} ▸` : `Need ${fmtM(expansionCost)} (have ${fmtM(station.cash)})`}
          </button>
        </div>
      )}

      {/* ─── TREND ─── */}
      <SectionHeader>3-Month Trend</SectionHeader>
      {trend.length === 0 ? (
        <EmptyPanel
          icon="chart_up"
          title="No history yet"
          subtitle="Trend appears after you've completed at least one month of airings."
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          <TrendCard
            label="Audience"
            metric="audience"
            unit="M"
            color={T.teal}
            data={trend}
            direction={audDirection}
          />
          <TrendCard
            label="Revenue"
            metric="revenue"
            unit="$"
            color={T.green}
            data={trend}
            direction={revDirection}
          />
        </div>
      )}

      {/* ─── SPECIALIZATION ─── */}
      <SectionHeader>Specialization</SectionHeader>
      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 12, lineHeight: 1.55, maxWidth: 640 }}>
        Your network's expertise per genre. Every airing earns XP toward the next
        half-star (XP = airing rating). Stars boost the quality of new productions in
        that genre — and at 3★+ they also boost hype, as audiences anticipate something
        new from you. Going to Metro / National wipes most progress except your
        specialty.
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 10, marginBottom: 28,
      }}>
        {SPEC_GENRES.map(g => (
          <SpecGenreRow
            key={g}
            genre={g}
            stars={(station.specStars || {})[g] || 0}
            xp={(station.specXP || {})[g] || 0}
            market={station.market}
            isFocus={g === station.focus}
          />
        ))}
      </div>

      {/* ─── AWARDS BY YEAR ─── */}
      <SectionHeader>Awards History</SectionHeader>
      {awardRows.length === 0 ? (
        <EmptyPanel
          icon="trophy"
          title="No awards yet"
          subtitle="Awards are decided in December. Make a hit show and you'll have something here."
        />
      ) : (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 1fr',
            background: T.card,
            padding: '8px 14px',
            borderBottom: `1px solid ${T.border}`,
            fontSize: 10.5, color: T.muted, letterSpacing: '.12em',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span>YEAR</span>
            <span style={{ textAlign: 'right' }}>WINS</span>
            <span style={{ textAlign: 'right' }}>CASH BONUS</span>
            <span style={{ textAlign: 'right' }}>FAME BONUS</span>
          </div>
          {awardRows.map(row => (
            <div key={row.year} style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 1fr 1fr',
              padding: '10px 14px',
              borderBottom: `1px solid ${T.border}`,
              alignItems: 'center',
            }}>
              <span className="mono" style={{ fontSize: 13, color: T.text, fontWeight: 700 }}>
                Y{row.year}
              </span>
              <span className="mono" style={{ fontSize: 13, color: T.text, textAlign: 'right', fontWeight: 500 }}>
                {row.count}
              </span>
              <span className="mono" style={{ fontSize: 13, color: T.green, textAlign: 'right' }}>
                +{fmtM(row.cash).replace('$','$')}
              </span>
              <span className="mono" style={{ fontSize: 13, color: T.gold, textAlign: 'right' }}>
                +{row.fame.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── STATUS HELPERS ──────────────────────────────────────────────────────

function trendDirection(values) {
  if (values.length < 2) return 'flat'
  const first = values[0]
  const last  = values[values.length - 1]
  if (first === 0 && last === 0) return 'flat'
  const change = (last - first) / Math.max(0.01, Math.abs(first))
  if (change > 0.05)  return 'up'
  if (change < -0.05) return 'down'
  return 'flat'
}

function StatusStat({ label, value, accent }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 5,
      padding: '10px 12px',
      minWidth: 0,
    }}>
      <div className="mono" style={{
        fontSize: 9.5, color: T.muted, letterSpacing: '.12em',
      }}>{label.toUpperCase()}</div>
      <div className="mono" style={{
        fontSize: 14, color: accent || T.text, fontWeight: 700,
        marginTop: 4, letterSpacing: '-.01em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
    </div>
  )
}

function SectionHeader({ children }) {
  return (
    <div className="display" style={{
      fontSize: 14, color: T.text, letterSpacing: '.06em',
      textTransform: 'uppercase', marginBottom: 10,
      paddingBottom: 6, borderBottom: `1px solid ${T.border}`,
    }}>
      {children}
    </div>
  )
}

function TrendCard({ label, metric, unit, color, data, direction }) {
  // Compute max for bar scaling
  const max = Math.max(0.01, ...data.map(d => d[metric] || 0))
  const arrow = direction === 'up'   ? { icon: 'chart_up',   color: T.green, label: 'UP' }
              : direction === 'down' ? { icon: 'chart_down', color: T.red,   label: 'DOWN' }
              :                        { icon: 'dot',        color: T.muted, label: 'FLAT' }
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 6, padding: 14,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <div className="mono" style={{ fontSize: 10.5, color: T.muted, letterSpacing: '.12em' }}>
          {label.toUpperCase()}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          color: arrow.color,
          fontSize: 10, letterSpacing: '.1em', fontWeight: 600,
        }}>
          <Icon name={arrow.icon} size={12} color={arrow.color} />
          {arrow.label}
        </div>
      </div>

      {/* Mini bar chart — 3 bars side by side */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10, height: 70,
        marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${T.border}`,
      }}>
        {data.map((d, i) => {
          const v = d[metric] || 0
          const h = Math.max(6, (v / max) * 60)
          const isLatest = i === data.length - 1
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
            }}>
              <div className="mono" style={{ fontSize: 10, color: T.text, fontWeight: 500 }}>
                {metric === 'revenue' ? `$${v.toFixed(1)}` : v.toFixed(1)}
              </div>
              <div style={{
                width: '100%', maxWidth: 50, height: h,
                background: isLatest ? color : color + '66',
                borderRadius: '3px 3px 0 0',
                boxShadow: isLatest ? `0 0 12px ${color}55` : 'none',
                transition: 'all .3s',
              }} />
              <div className="mono" style={{ fontSize: 9, color: T.muted, letterSpacing: '.05em' }}>
                {MONTHS[d.month]}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: T.muted }}>
        <span>Earliest: {data[0] ? (metric === 'revenue' ? fmtM(data[0][metric]) : `${(data[0][metric]||0).toFixed(1)}M`) : '—'}</span>
        <span>Latest: {data[data.length-1] ? (metric === 'revenue' ? fmtM(data[data.length-1][metric]) : `${(data[data.length-1][metric]||0).toFixed(1)}M`) : '—'}</span>
      </div>
    </div>
  )
}

function SpecGenreRow({ genre, stars, xp, market, isFocus }) {
  const cat = CATEGORIES[genre]
  const label = cat?.label || genre
  const color = cat?.color || T.accent
  const threshold = specThresholdFor(stars, market)
  const atCap = threshold == null
  const pct = atCap ? 1 : Math.min(1, xp / threshold)
  const qBonus = specQualityBonus(stars)
  const hBonus = specHypeBonus(stars)
  const hasAnyBonus = qBonus > 0 || hBonus > 0

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${stars > 0 ? color : T.border}`,
      borderRadius: 5, padding: '11px 13px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 7,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <CategoryIcon categoryId={genre} size={14} color={stars > 0 ? color : T.muted} />
          <span style={{
            fontSize: 13, color: T.text, fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{label}</span>
          {isFocus && (
            <span className="mono" style={{
              fontSize: 8.5, color: T.gold, letterSpacing: '.1em',
              padding: '1px 5px', borderRadius: 2,
              border: `1px solid ${T.gold}55`,
              background: T.gold + '12',
              flexShrink: 0,
            }}>SPECIALTY</span>
          )}
        </div>
        <StarMeter stars={stars} color={color} />
      </div>

      {/* Active bonus badges — only when there's something to show. */}
      {hasAnyBonus && (
        <div style={{
          display: 'flex', gap: 6, marginBottom: 7,
        }}>
          {qBonus > 0 && (
            <span className="mono" style={{
              fontSize: 9.5, color: color, fontWeight: 700,
              padding: '2px 7px', borderRadius: 3,
              background: color + '18',
              border: `1px solid ${color}55`,
              letterSpacing: '.06em',
            }}>
              Q +{qBonus.toFixed(2)}
            </span>
          )}
          {hBonus > 0 && (
            <span className="mono" style={{
              fontSize: 9.5, color: T.gold, fontWeight: 700,
              padding: '2px 7px', borderRadius: 3,
              background: T.gold + '14',
              border: `1px solid ${T.gold}66`,
              letterSpacing: '.06em',
            }}>
              H +{hBonus.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* XP bar */}
      <div style={{
        height: 4, background: T.border, borderRadius: 2, overflow: 'hidden',
        marginBottom: 4,
      }}>
        <div style={{
          height: '100%',
          width: `${pct * 100}%`,
          background: color,
          transition: 'width .5s',
        }} />
      </div>
      <div className="mono" style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9.5, color: T.muted, letterSpacing: '.06em',
      }}>
        {atCap ? (
          <span style={{ color: T.gold }}>MAX</span>
        ) : (
          <>
            <span>XP {xp.toFixed(1)} / {threshold}</span>
            <span>Next: {(stars + 0.5).toFixed(1)}★</span>
          </>
        )}
      </div>
    </div>
  )
}

function StarMeter({ stars, color }) {
  // Render 5 star slots. Each can be empty / half / full based on stars value.
  const slots = []
  for (let i = 0; i < 5; i++) {
    const filled = stars - i
    let state = 'empty'
    if (filled >= 1) state = 'full'
    else if (filled >= 0.5) state = 'half'
    slots.push(state)
  }
  return (
    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
      {slots.map((s, i) => (
        <StarSlot key={i} state={s} color={color} />
      ))}
    </div>
  )
}

function StarSlot({ state, color }) {
  // Approximate a 5-pointed star with an SVG polygon. Two layers: outline + fill clipped by state.
  const path = "M8 1.2 L9.85 5.95 L15 6.4 L11.1 9.85 L12.35 14.85 L8 12.1 L3.65 14.85 L4.9 9.85 L1 6.4 L6.15 5.95 Z"
  const fillId = `star-fill-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" style={{ display: 'block' }}>
      <defs>
        <clipPath id={fillId}>
          <rect x="0" y="0" width={state === 'full' ? 16 : state === 'half' ? 8 : 0} height="16" />
        </clipPath>
      </defs>
      {/* Outline always shows */}
      <path d={path} fill="none" stroke={state === 'empty' ? T.borderHi : color} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Filled portion */}
      <path d={path} fill={color} clipPath={`url(#${fillId})`} />
    </svg>
  )
}

function EmptyPanel({ icon, title, subtitle }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 6, padding: 28, textAlign: 'center', marginBottom: 24,
    }}>
      <Icon name={icon} size={24} color={T.muted} />
      <div style={{ fontSize: 13.5, color: T.text, marginTop: 10, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
        {subtitle}
      </div>
    </div>
  )
}

// ─── MOVIE PACKS BLOCK ───────────────────────────────────────────────────
function MoviePackBlock({ station, year, monthIdx, onBuy }) {
  const ownedPacks = (station.moviePacks || []).filter(p => (p.airingsLeft || 0) > 0)
  const ownedIds = new Set(ownedPacks.map(p => p.packId))

  // Sort the catalog: highest tier first
  const tierOrder = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 }
  const catalog = [...MOVIES].sort((a, b) =>
    (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99) || (b.h - a.h)
  )

  return (
    <div>
      {/* Owned packs */}
      {ownedPacks.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: T.green, marginBottom: 6 }}>ON SHELF ({ownedPacks.length})</div>
          <div style={{ display: 'grid', gap: 6,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {ownedPacks.map(p => {
              const pack = MOVIES.find(m => m.id === p.packId)
              if (!pack) return null
              const total = pack.packSize || 3
              return (
                <div key={p.packId} style={{
                  padding: 10, background: T.green + '12',
                  border: `1px solid ${T.green}55`, borderRadius: 5,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🎞 {pack.name}
                    </div>
                    <div className="mono" style={{
                      fontSize: 11, color: T.green, fontWeight: 600, flexShrink: 0,
                      background: T.green + '22', padding: '2px 7px', borderRadius: 3,
                    }}>
                      {p.airingsLeft}/{total}
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.muted, marginTop: 4 }}>
                    {pack.tier} · Q {pack.q.toFixed(1)} · H {(p.purchaseHype ?? pack.h).toFixed(1)}
                    {p.penaltyApplied && <span style={{ color: T.gold, marginLeft: 4 }}>· reduced hype</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available catalog */}
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>AVAILABLE TO LICENSE</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {catalog.map(pack => {
          const isOwned = ownedIds.has(pack.id)
          const hypeInfo = moviePackPurchaseHype(station, pack.id, year, monthIdx)
          const lastConsumed = findLastConsumedPack(station, pack.id)
          const affordable = station.cash >= pack.cost
          const tierColor = pack.tier === 'Legendary' ? T.gold
                           : pack.tier === 'Epic' ? T.purple
                           : pack.tier === 'Rare' ? T.teal
                           : pack.tier === 'Uncommon' ? T.green
                           : T.muted

          let buttonLabel, buttonDisabled
          if (isOwned) {
            buttonLabel = 'ON SHELF'
            buttonDisabled = true
          } else if (!affordable) {
            buttonLabel = `Need ${fmtM(pack.cost)}`
            buttonDisabled = true
          } else if (hypeInfo.penaltyApplied) {
            buttonLabel = `Buy ${fmtM(pack.cost)} (−hype)`
            buttonDisabled = false
          } else {
            buttonLabel = `Buy ${fmtM(pack.cost)}`
            buttonDisabled = false
          }

          return (
            <div key={pack.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 11px',
              background: isOwned ? 'rgba(91, 214, 135, .04)' : T.surface,
              border: `1px solid ${isOwned ? T.green + '33' : T.border}`,
              borderLeft: `3px solid ${tierColor}`,
              borderRadius: 5,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3 }}>
                  {pack.name}
                </div>
                <div style={{ fontSize: 10.5, color: T.muted, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: tierColor }}>{pack.tier}</span>
                  <span>· Q {pack.q.toFixed(1)}</span>
                  <span>· H {hypeInfo.hype.toFixed(1)}{hypeInfo.penaltyApplied && <span style={{ color: T.gold }}> ↓</span>}</span>
                  <span>· {pack.packSize || 3} airings</span>
                  {hypeInfo.penaltyApplied && (
                    <span style={{ color: T.gold }}>
                      · cooldown: {hypeInfo.monthsUntilRestore} mo
                    </span>
                  )}
                  {!isOwned && !hypeInfo.penaltyApplied && lastConsumed && (
                    <span style={{ color: T.muted, fontStyle: 'italic' }}>· previously aired</span>
                  )}
                </div>
              </div>
              <button
                onClick={buttonDisabled ? undefined : () => onBuy(pack.id)}
                disabled={buttonDisabled}
                style={{
                  background: buttonDisabled ? T.card : tierColor,
                  color: buttonDisabled ? T.muted : T.bg,
                  border: 'none', borderRadius: 4,
                  padding: '6px 11px',
                  fontFamily: 'Anton, sans-serif',
                  fontSize: 11.5, letterSpacing: '.06em',
                  cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {buttonLabel}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
