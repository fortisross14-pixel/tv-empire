import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, MARKETS, MARKETING_TIERS, IPS, SPORTS_LEAGUES, MONTHS,
  STAFF_ROLES, STAFF_SEARCHES, STAFF_SALARY_BY_TIER, STAFF_EFFECTS,
  STAFF_FIRE_PENALTY_MULT,
  IP_LICENSE_TERMS, NETWORK_CAMPAIGNS,
  CONTRACT_TYPES, TIERS, MARKET_ORDER,
  MOVIES, MOVIE_PACK_REBUY_HYPE_PENALTY, MOVIE_PACK_COOLDOWN_MONTHS,
  FIRE_PENALTY_MULT,
} from '../constants.js'
import { HTag, Bar, Pill, SectionTitle } from './ui.jsx'
import { Icon, CategoryIcon } from '../icons.jsx'
import {
  findDirector, findStar, findIP, findLeague, findWriter,
  staffSalaryTotal, contractCost, fameLabel, sportsLicenseCost,
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

  return (
    <div className="view-wrap" style={{ maxWidth: 1000, margin: '0 auto', padding: 18 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: `1px solid ${T.border}`,
        color: T.muted, padding: '8px 14px', borderRadius: 5,
        fontSize: 11, fontWeight: 600, marginBottom: 16, cursor: 'pointer',
      }}>← Back</button>

      <SectionTitle>Operations</SectionTitle>

      {/* Sub-tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 18,
        borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto',
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
              marginBottom: -1,
              whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
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

// ─── 1. TALENT TAB ───────────────────────────────────────────────────────
function TalentTab({ station, marketRoster, onHire, onFire, onHireWriter, onFireWriter }) {
  const [section, setSection] = useState('directors')
  const [hireModal, setHireModal] = useState(null)  // { role, talent }
  const [fireModal, setFireModal] = useState(null)

  const dirs = (station.hiredDirectors || []).map(h => ({ ...h, talent: findDirector(h.talentId) }))
  const stars = (station.hiredStars || []).map(h => ({ ...h, talent: findStar(h.talentId) }))

  return (
    <div>
      {/* Sub-sub-tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 14,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <SubSubTab id="directors" label="Producers / Directors" active={section} onClick={setSection} />
        <SubSubTab id="stars"     label="Stars"                  active={section} onClick={setSection} />
        <SubSubTab id="writers"   label="Writers"                active={section} onClick={setSection} />
      </div>

      {section === 'directors' && (
        <TalentSubSection
          rosterTitle="Producers / Directors under contract"
          marketTitle="Producers / Directors available"
          items={dirs}
          pool={marketRoster.directors}
          role="director"
          station={station}
          onHireOpen={(role, t) => setHireModal({ role, t })}
          onFireOpen={(role, id, t) => setFireModal({ role, id, t })}
        />
      )}
      {section === 'stars' && (
        <TalentSubSection
          rosterTitle="Stars under contract"
          marketTitle="Stars available"
          items={stars}
          pool={marketRoster.stars}
          role="star"
          station={station}
          onHireOpen={(role, t) => setHireModal({ role, t })}
          onFireOpen={(role, id, t) => setFireModal({ role, id, t })}
        />
      )}
      {section === 'writers' && (
        <WritersTalentSection
          station={station}
          marketWriters={marketRoster.writers || []}
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

function TalentSubSection({ rosterTitle, marketTitle, items, pool, role, station, onHireOpen, onFireOpen }) {
  return (
    <>
      <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        {rosterTitle.toUpperCase()}
      </div>
      <RosterGroup title="" items={items} role={role} onFire={onFireOpen} />
      {items.length === 0 && (
        <div style={{ padding: 14, fontSize: 12, color: T.muted, fontStyle: 'italic',
                      background: T.cardHi, border: `1px solid ${T.border}`, borderRadius: 5,
                      marginBottom: 16 }}>
          None under contract.
        </div>
      )}
      <div style={{ marginTop: 22, fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        {marketTitle.toUpperCase()}
      </div>
      <MarketGroup title="" pool={pool || []} role={role} onHire={onHireOpen} />
    </>
  )
}

function WritersTalentSection({ station, marketWriters, onHireWriter, onFireWriter }) {
  // Lightweight inline writer roster + hire — keeps the same engine plumbing
  // as Content used to, just lives in Operations now.
  const hired = station.hiredWriters || []
  const scripts = station.scripts || []
  const [confirmFire, setConfirmFire] = useState(null)

  return (
    <>
      <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        WRITERS UNDER CONTRACT ({hired.length})
      </div>
      {hired.length === 0 ? (
        <div style={{ padding: 14, fontSize: 12, color: T.muted, fontStyle: 'italic',
                      background: T.cardHi, border: `1px solid ${T.border}`, borderRadius: 5,
                      marginBottom: 16 }}>
          No writers employed.
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8,
          marginBottom: 16,
        }}>
          {hired.map(h => {
            const w = findWriter(h.talentId)
            if (!w) return null
            const draftCount = scripts.filter(s => s.writerId === w.id && s.status === 'drafting').length
            const isBusy = draftCount > 0
            const isFree = !!h.freeStarter
            return (
              <div key={h.talentId} style={{
                background: T.cardHi, border: `1px solid ${T.border}`, borderRadius: 5,
                padding: 10,
              }}>
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
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
                  <div>
                    <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em' }}>SKILL</div>
                    <div className="mono" style={{ color: T.text, fontWeight: 600 }}>{(w.skill * 100).toFixed(0)}</div>
                  </div>
                  <div>
                    <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em' }}>SALARY</div>
                    <div className="mono" style={{ color: T.text, fontWeight: 600 }}>
                      {isFree ? <span style={{ color: T.green }}>FREE</span> : `${(h.perMonthCharge || w.cost || 0).toFixed(1)}M/mo`}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em' }}>STATUS</div>
                    <div className="mono" style={{ color: isBusy ? T.gold : T.green, fontWeight: 600 }}>
                      {isBusy ? `DRAFTING (${draftCount})` : 'IDLE'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmFire({ w, h })}
                  disabled={isBusy}
                  style={{
                    marginTop: 9, padding: '6px 10px', width: '100%',
                    background: isBusy ? T.card : 'transparent',
                    border: `1px solid ${isBusy ? T.border : T.red}55`,
                    color: isBusy ? T.muted : T.red,
                    borderRadius: 4, fontSize: 11, fontWeight: 600,
                    cursor: isBusy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isBusy ? 'BUSY' : 'Release contract'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        AVAILABLE TO HIRE
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8,
      }}>
        {marketWriters.map(w => {
          const alreadyHired = hired.some(h => h.talentId === w.id)
          const canHire = !alreadyHired && station.cash >= (w.cost || 0)
          return (
            <div key={w.id} style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5,
              padding: 10, opacity: alreadyHired ? 0.4 : 1,
            }}>
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
                  <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em' }}>SKILL</div>
                  <div className="mono" style={{ color: T.text, fontWeight: 600 }}>{(w.skill * 100).toFixed(0)}</div>
                </div>
                <div>
                  <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em' }}>SALARY</div>
                  <div className="mono" style={{ color: T.text, fontWeight: 600 }}>${(w.cost || 0).toFixed(1)}M/mo</div>
                </div>
              </div>
              <button
                onClick={() => canHire && onHireWriter(w)}
                disabled={!canHire}
                style={{
                  marginTop: 9, padding: '6px 10px', width: '100%',
                  background: canHire ? T.accent : T.card,
                  color: canHire ? T.bg : T.muted,
                  border: 'none', borderRadius: 4,
                  fontSize: 11, fontWeight: 700, cursor: canHire ? 'pointer' : 'not-allowed',
                }}
              >
                {alreadyHired ? 'HIRED' : (canHire ? 'HIRE' : 'TOO EXPENSIVE')}
              </button>
            </div>
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
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>
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

function RosterGroup({ title, items, role, onFire }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: T.text, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {items.map(item => {
        const t = item.talent
        if (!t) return null
        const cat = CATEGORIES[t.specialty]
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 10, marginBottom: 5,
            background: T.cardHi, border: `1px solid ${T.border}`, borderRadius: 5,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>
                {cat?.icon} {cat?.label} · Q +{t.q.toFixed(1)} H +{t.h.toFixed(1)}
              </div>
            </div>
            <HTag tier={t.tier} />
            <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: 10,
                          color: item.permanent ? T.gold : T.green, fontWeight: 600 }}>
              {item.permanent ? 'PERMANENT' : `${item.monthsLeft} mo`}
            </div>
            <button onClick={() => onFire(role, t.id, t)} style={{
              background: 'transparent', border: `1px solid ${T.red}55`,
              color: T.red, padding: '5px 10px', borderRadius: 4,
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
            }}>Fire</button>
          </div>
        )
      })}
    </div>
  )
}

function MarketGroup({ title, pool, role, onHire }) {
  if ((pool || []).length === 0) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: T.text, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {pool.slice(0, 12).map(t => {
        const cat = CATEGORIES[t.specialty]
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 10, marginBottom: 5,
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 5,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>
                {cat?.icon} {cat?.label} · Q +{t.q.toFixed(1)} H +{t.h.toFixed(1)} · ${t.cost.toFixed(1)}M/mo
              </div>
            </div>
            <HTag tier={t.tier} />
            <button onClick={() => onHire(role, t)} style={{
              background: T.accent, color: T.bg, padding: '6px 12px',
              border: 'none', borderRadius: 4,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Sign</button>
          </div>
        )
      })}
    </div>
  )
}

function HireModal({ role, t, cash, onConfirm, onCancel }) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ padding: 18 }}>
        <div className="bebas" style={{ fontSize: 18, color: T.accent, marginBottom: 4 }}>
          Sign {t.name}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>
          Base cost: ${t.cost.toFixed(1)}M / month
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {CONTRACT_TYPES.map(ct => {
            const cost = contractCost(t, ct.id)
            const affordable = cash >= cost
            const label = ct.months === -1 ? `$${cost.toFixed(1)}M/mo (each month)` : `$${cost.toFixed(1)}M upfront`
            return (
              <button key={ct.id} disabled={!affordable} onClick={() => onConfirm(ct.id)}
                style={{
                  textAlign: 'left', padding: '11px 13px',
                  background: affordable ? T.cardHi : T.surface,
                  border: `1px solid ${affordable ? T.borderHi : T.border}`,
                  borderRadius: 5, cursor: affordable ? 'pointer' : 'not-allowed',
                  opacity: affordable ? 1 : 0.5, color: T.text,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{ct.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11,
                                 color: ct.months === -1 ? T.gold : T.green }}>{label}</span>
                </div>
                <div style={{ fontSize: 10, color: T.muted }}>{ct.desc}</div>
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
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Fire {t.name}?</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
          You'll pay a severance penalty. Permanent contracts cost {5}× one month's pay.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 14px', background: T.red, color: T.bg,
            border: 'none', borderRadius: 5, fontWeight: 700, cursor: 'pointer',
          }}>Fire</button>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 14px', background: 'transparent',
            border: `1px solid ${T.border}`, color: T.muted,
            borderRadius: 5, fontWeight: 600, cursor: 'pointer',
          }}>Keep</button>
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 8,
    }}>
      {SPORTS_LEAGUES.map(lg => {
        const isOwned = ownedIds.has(lg.id)
        const cost = sportsLicenseCost(lg.id, market)
        const affordable = station.cash >= cost
        return (
          <div key={lg.id} style={{
            background: isOwned ? T.green + '15' : T.card,
            border: `1px solid ${isOwned ? T.green : T.border}`,
            borderRadius: 5, padding: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: isOwned ? T.green : T.text }}>
              {lg.icon} {lg.label} {isOwned && '✓'}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 3, lineHeight: 1.4 }}>
              Season: {lg.season.length} mo · Peak: {MONTHS[lg.peakMonth]} ({lg.peakLabel})
            </div>
            {!isOwned ? (
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
function StaffTab({ station, pendingHires, onOpenPosition, onCancelPosition, onPickCandidate, onFireStaff, research }) {
  const personnelHired = !!station.staff?.personnel
  const salary = staffSalaryTotal(station)

  return (
    <div>
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

      {/* Role grid */}
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
          💡 Hire a Personnel Director first — they unlock searches for all other roles.
          Until then only Personnel can be opened (via Quick Search).
        </div>
      )}
    </div>
  )
}

function PendingHireBlock({ pending, onPick }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>
        {pending.role.toUpperCase()} DIRECTOR — pick one of {pending.candidates.length}
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
function MarketingTab({ station, research, onLaunchCampaign }) {
  const active = station.activeCampaign
  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Network-wide campaigns boost the station's fame and add a hype bonus to <strong>every show</strong> airing
        the month they launch. Bigger campaigns hit harder. Effects last one month.
      </div>

      {active && (
        <div style={{
          marginBottom: 14, padding: 12,
          background: T.gold + '14', border: `1px solid ${T.gold}55`, borderRadius: 6,
        }}>
          <div style={{ fontSize: 12, color: T.gold, fontWeight: 700 }}>
            📣 Active this month: {active.label}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
            +{active.fameGain.toFixed(1)} fame · +{active.hypeBoost.toFixed(2)} hype on all this month's shows
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {NETWORK_CAMPAIGNS.map(c => {
          const eff = STAFF_EFFECTS.marketing?.[station.staff?.marketing?.tier]
          const adjustedCost = c.cost * (eff?.mktgCostMult || 1.0)
          const adjustedHype = c.hypeBoost * (eff?.mktgImpactMult || 1.0)
          const adjustedFame = c.fameGain * (eff?.mktgImpactMult || 1.0)
          const affordable = station.cash >= adjustedCost && !active
          return (
            <button
              key={c.id}
              disabled={!affordable}
              onClick={() => onLaunchCampaign(c.id)}
              style={{
                padding: '12px 14px', textAlign: 'left',
                background: affordable ? T.card : T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 5, cursor: affordable ? 'pointer' : 'not-allowed',
                opacity: affordable ? 1 : 0.5, color: T.text,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{c.icon} {c.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: T.red, fontWeight: 700 }}>
                  ${adjustedCost.toFixed(1)}M
                </span>
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>
                +{adjustedFame.toFixed(1)} fame · +{adjustedHype.toFixed(2)} hype boost (one month)
              </div>
            </button>
          )
        })}
      </div>
    </div>
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
