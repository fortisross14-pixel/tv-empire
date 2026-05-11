import { useState } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, MARKETS, MARKETING_TIERS, IPS, SPORTS_LEAGUES, MONTHS,
  STAFF_ROLES, STAFF_SEARCHES, STAFF_SALARY_BY_TIER, STAFF_EFFECTS,
  STAFF_FIRE_PENALTY_MULT,
  IP_LICENSE_TERMS, NETWORK_CAMPAIGNS,
  CONTRACT_TYPES, TIERS,
} from '../constants.js'
import { HTag, Bar, Pill, SectionTitle } from './ui.jsx'
import {
  findDirector, findStar, findIP, findLeague,
  staffSalaryTotal, contractCost, fameLabel, sportsLicenseCost,
  ipLicenseCost, ownsIP, activeIPLicenses, canHireStaffRole,
} from '../engine.js'

// ─── SUB-TABS ────────────────────────────────────────────────────────────
const SUB_TABS = [
  { id: 'talent',    label: 'Talent' },
  { id: 'rights',    label: 'Purchase Rights' },
  { id: 'staff',     label: 'Staff' },
  { id: 'marketing', label: 'Marketing' },
]

export function OperationsScreen(props) {
  const { onBack } = props
  const [sub, setSub] = useState('talent')

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 18 }}>
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
              fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '.1em',
              padding: '8px 14px', cursor: 'pointer',
              borderBottom: `2px solid ${sub === t.id ? T.accent : 'transparent'}`,
              marginBottom: -1,
              whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
        ))}
      </div>

      {sub === 'talent'    && <TalentTab    {...props} />}
      {sub === 'rights'    && <RightsTab    {...props} />}
      {sub === 'staff'     && <StaffTab     {...props} />}
      {sub === 'marketing' && <MarketingTab {...props} />}
    </div>
  )
}

// ─── 1. TALENT TAB ───────────────────────────────────────────────────────
function TalentTab({ station, marketRoster, onHire, onFire }) {
  const [hireModal, setHireModal] = useState(null)  // { role, talent }
  const [fireModal, setFireModal] = useState(null)

  const dirs = (station.hiredDirectors || []).map(h => ({ ...h, talent: findDirector(h.talentId) }))
  const stars = (station.hiredStars || []).map(h => ({ ...h, talent: findStar(h.talentId) }))

  return (
    <div>
      {/* Current roster */}
      <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        UNDER CONTRACT
      </div>

      <RosterGroup title="Directors / Producers" items={dirs} role="director" onFire={(role, id, t) => setFireModal({ role, id, t })} />
      <RosterGroup title="Stars" items={stars} role="star" onFire={(role, id, t) => setFireModal({ role, id, t })} />
      {dirs.length + stars.length === 0 && (
        <div style={{ padding: 14, fontSize: 12, color: T.muted, fontStyle: 'italic',
                      background: T.cardHi, border: `1px solid ${T.border}`, borderRadius: 5 }}>
          No talent under contract.
        </div>
      )}

      {/* Market */}
      <div style={{ marginTop: 22, fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        AVAILABLE TO SIGN
      </div>
      <MarketGroup title="Directors / Producers" pool={marketRoster.directors} role="director" onHire={(role, t) => setHireModal({ role, t })} />
      <MarketGroup title="Stars" pool={marketRoster.stars} role="star" onHire={(role, t) => setHireModal({ role, t })} />

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
            <div style={{ textAlign: 'right', fontFamily: 'DM Mono', fontSize: 10,
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
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11,
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
function RightsTab({ station, year, research, onBuyIP, onBuySportsLicense }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        SPORTS RIGHTS — YEAR {year}
      </div>
      <SportsBlock station={station} year={year} onBuy={onBuySportsLicense} />

      <div style={{ marginTop: 24, fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        IP LICENSES — OWNED & AVAILABLE
      </div>
      <IPBlock station={station} year={year} research={research} onBuy={onBuyIP} />
    </div>
  )
}

function SportsBlock({ station, year, onBuy }) {
  const owned = new Set((station.sportsLicenses || []).filter(l => l.year === year).map(l => l.leagueId))
  return (
    <div style={{
      display: 'grid', gap: 8,
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    }}>
      {SPORTS_LEAGUES.map(lg => {
        const ownedNow = owned.has(lg.id)
        const cost = sportsLicenseCost(lg.id, station.market)
        const affordable = station.cash >= cost
        return (
          <div key={lg.id} style={{
            background: ownedNow ? T.green + '15' : T.card,
            border: `1px solid ${ownedNow ? T.green : T.border}`,
            borderRadius: 5, padding: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: ownedNow ? T.green : T.text }}>
              {lg.icon} {lg.label} {ownedNow && '✓'}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>
              Season: {lg.season.length} mo · Peak: {MONTHS[lg.peakMonth]} ({lg.peakLabel})
            </div>
            {!ownedNow ? (
              <button disabled={!affordable} onClick={() => onBuy(lg.id)} style={{
                marginTop: 7, width: '100%', padding: '5px 8px',
                background: affordable ? T.accent : T.border,
                color: affordable ? T.bg : T.muted,
                border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700,
                cursor: affordable ? 'pointer' : 'not-allowed',
              }}>${cost.toFixed(0)}M BUY</button>
            ) : (
              <div style={{ marginTop: 7, fontSize: 10, color: T.green, fontStyle: 'italic' }}>
                Owned · Assign in slot editor
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
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: T.green }}>
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
        <div style={{ fontFamily: 'DM Mono', fontSize: 14, color: salary > 0 ? T.red : T.muted, fontWeight: 700 }}>
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
                <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: T.red, fontWeight: 700 }}>
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
