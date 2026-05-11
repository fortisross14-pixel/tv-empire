import { useState } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, CONTRACT_TYPES, FIRE_PENALTY_MULT,
} from '../constants.js'
import { findDirector, findStar, contractCost, r1, fmtM } from '../engine.js'
import { HTag, SectionTitle } from './ui.jsx'

export function TalentScreen({ station, marketRoster, onHire, onFire, onBack }) {
  const [tab, setTab] = useState('roster') // 'roster' | 'market'
  const [hireFor, setHireFor] = useState(null) // {role, talent} when picking contract
  const [confirmFire, setConfirmFire] = useState(null) // {role, talentId, name, penalty}

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 18 }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: `1px solid ${T.border}`,
          color: T.muted, padding: '8px 14px', borderRadius: 5,
          fontSize: 11, fontWeight: 600, marginBottom: 16,
        }}
      >← Back to Programming</button>

      <SectionTitle>Talent Management</SectionTitle>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: `1px solid ${T.border}` }}>
        <TabBtn label="My Roster" active={tab === 'roster'} onClick={() => setTab('roster')}
          count={(station.hiredDirectors?.length || 0) + (station.hiredStars?.length || 0)} />
        <TabBtn label="Hire New" active={tab === 'market'} onClick={() => setTab('market')}
          count={(marketRoster.directors?.length || 0) + (marketRoster.stars?.length || 0)} />
      </div>

      {tab === 'roster' && (
        <RosterView
          station={station}
          onFireRequest={(role, talentId, talent) => {
            const rec = (role === 'director' ? station.hiredDirectors : station.hiredStars)
              .find(h => h.talentId === talentId)
            const penalty = rec?.permanent
              ? r1((rec.perMonthCharge || talent.cost) * FIRE_PENALTY_MULT)
              : r1(Math.min(talent.cost, (rec?.monthsLeft || 0) * talent.cost * 0.4))
            setConfirmFire({ role, talentId, name: talent.name, penalty, permanent: rec?.permanent })
          }}
        />
      )}

      {tab === 'market' && (
        <MarketView
          marketRoster={marketRoster}
          onHireRequest={(role, talent) => setHireFor({ role, talent })}
          cash={station.cash}
        />
      )}

      {/* Hire modal */}
      {hireFor && (
        <HireModal
          role={hireFor.role}
          talent={hireFor.talent}
          cash={station.cash}
          onCancel={() => setHireFor(null)}
          onConfirm={(contractTypeId) => {
            onHire(hireFor.role, hireFor.talent, contractTypeId)
            setHireFor(null)
          }}
        />
      )}

      {/* Fire confirm */}
      {confirmFire && (
        <FireConfirmModal
          info={confirmFire}
          onCancel={() => setConfirmFire(null)}
          onConfirm={() => {
            onFire(confirmFire.role, confirmFire.talentId)
            setConfirmFire(null)
          }}
        />
      )}
    </div>
  )
}

function TabBtn({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none',
        color: active ? T.accent : T.muted,
        fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '.1em',
        padding: '10px 14px', cursor: 'pointer',
        borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
        marginBottom: -1,
      }}
    >{label}{typeof count === 'number' ? ` · ${count}` : ''}</button>
  )
}

// ─── ROSTER (hired) ─────────────────────────────────────────────────────
function RosterView({ station, onFireRequest }) {
  const dirs = (station.hiredDirectors || []).map(h => ({ ...h, talent: findDirector(h.talentId) }))
  const stars = (station.hiredStars || []).map(h => ({ ...h, talent: findStar(h.talentId) }))

  return (
    <div>
      <Group title="Directors / Producers" items={dirs} role="director" onFireRequest={onFireRequest} />
      <Group title="Stars" items={stars} role="star" onFireRequest={onFireRequest} />
      {dirs.length === 0 && stars.length === 0 && (
        <div style={{ padding: 16, fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
          No talent under contract. Switch to "Hire New" to sign someone.
        </div>
      )}
    </div>
  )
}

function Group({ title, items, role, onFireRequest }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8, fontWeight: 600 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(item => {
          const t = item.talent
          if (!t) return null
          const cat = CATEGORIES[t.specialty]
          const status = item.permanent
            ? 'PERMANENT'
            : `${item.monthsLeft} month${item.monthsLeft === 1 ? '' : 's'} left`
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: 10, background: T.cardHi, border: `1px solid ${T.border}`,
              borderRadius: 6,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: T.muted }}>
                  {cat?.icon} {cat?.label || t.specialty} · Q +{t.q.toFixed(1)} H +{t.h.toFixed(1)}
                </div>
              </div>
              <HTag tier={t.tier} />
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                <div style={{
                  fontFamily: 'DM Mono', fontSize: 10,
                  color: item.permanent ? T.gold : T.green,
                  fontWeight: 600,
                }}>{status}</div>
                {item.permanent && (
                  <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: T.muted, marginTop: 2 }}>
                    {fmtM(item.perMonthCharge)}/mo
                  </div>
                )}
              </div>
              <button
                onClick={() => onFireRequest(role, t.id, t)}
                style={{
                  background: 'transparent', border: `1px solid ${T.red}66`,
                  color: T.red, padding: '6px 10px', borderRadius: 4,
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                }}
              >FIRE</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MARKET (available to hire) ─────────────────────────────────────────
function MarketView({ marketRoster, onHireRequest, cash }) {
  return (
    <div>
      <MarketGroup title="Directors / Producers" items={marketRoster.directors || []}
        role="director" onHireRequest={onHireRequest} cash={cash} />
      <MarketGroup title="Stars" items={marketRoster.stars || []}
        role="star" onHireRequest={onHireRequest} cash={cash} />
      {(marketRoster.directors?.length || 0) === 0 && (marketRoster.stars?.length || 0) === 0 && (
        <div style={{ padding: 16, fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
          No talent available. Try "Talent Scout" research to refresh, or wait for next year.
        </div>
      )}
    </div>
  )
}

function MarketGroup({ title, items, role, onHireRequest, cash }) {
  if (items.length === 0) return null
  // Sort by tier desc
  const tierIdx = (t) => ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].indexOf(t)
  const sorted = [...items].sort((a, b) => tierIdx(b.tier) - tierIdx(a.tier))

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: T.muted, letterSpacing: '.1em', marginBottom: 8, fontWeight: 600 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {sorted.map(t => {
          const cat = CATEGORIES[t.specialty]
          const baseCost = t.cost
          const affordable = cash >= baseCost
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: 10, background: T.cardHi, border: `1px solid ${T.border}`,
              borderRadius: 6,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: T.muted }}>
                  {cat?.icon} {cat?.label || t.specialty} · Q +{t.q.toFixed(1)} H +{t.h.toFixed(1)}
                </div>
              </div>
              <HTag tier={t.tier} />
              <div style={{
                fontFamily: 'DM Mono', fontSize: 12, color: T.muted,
                minWidth: 60, textAlign: 'right',
              }}>{fmtM(baseCost)}/cyc</div>
              <button
                disabled={!affordable}
                onClick={() => onHireRequest(role, t)}
                style={{
                  background: affordable ? T.accent : 'transparent',
                  border: affordable ? 'none' : `1px solid ${T.border}`,
                  color: affordable ? T.bg : T.muted,
                  padding: '6px 12px', borderRadius: 4,
                  fontSize: 10, fontWeight: 700, letterSpacing: '.05em',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                }}
              >HIRE</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── HIRE MODAL — pick contract type ────────────────────────────────────
function HireModal({ role, talent, cash, onCancel, onConfirm }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div className="bebas" style={{ fontSize: 18, color: T.accent, letterSpacing: '.05em' }}>
            Sign {talent.name}
          </div>
          <button onClick={onCancel} style={{ color: T.muted, fontSize: 18, padding: '0 6px' }}>✕</button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
            Base cost: <span style={{ color: T.text, fontFamily: 'DM Mono' }}>{fmtM(talent.cost)} / month</span>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {CONTRACT_TYPES.map(ct => {
              const cost = contractCost(talent, ct.id)
              const upfront = cost
              const affordable = cash >= upfront
              const label = ct.months === -1
                ? `${fmtM(cost)} / mo (paid each month)`
                : `${fmtM(upfront)} upfront`
              return (
                <button
                  key={ct.id}
                  disabled={!affordable}
                  onClick={() => onConfirm(ct.id)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: affordable ? T.cardHi : T.surface,
                    border: `1px solid ${affordable ? T.borderHi : T.border}`,
                    borderRadius: 6,
                    cursor: affordable ? 'pointer' : 'not-allowed',
                    opacity: affordable ? 1 : 0.5,
                    color: T.text,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{ct.label}</span>
                    <span style={{
                      fontFamily: 'DM Mono', fontSize: 12,
                      color: ct.months === -1 ? T.gold : T.green,
                    }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.muted }}>{ct.desc}</div>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 14, fontSize: 10, color: T.muted, fontStyle: 'italic' }}>
            Permanent talent works every month. Firing them costs {FIRE_PENALTY_MULT}× one month's pay.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FIRE CONFIRM MODAL ─────────────────────────────────────────────────
function FireConfirmModal({ info, onCancel, onConfirm }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 20 }}>
          <div className="bebas" style={{ fontSize: 18, color: T.red, letterSpacing: '.05em', marginBottom: 12 }}>
            Fire {info.name}?
          </div>
          <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>
            {info.permanent
              ? `Penalty: ${fmtM(info.penalty)} (${FIRE_PENALTY_MULT}× one month's pay)`
              : `Penalty: ${fmtM(info.penalty)} kill fee`}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 18 }}>
            They'll be removed from your roster immediately. You can re-hire them later if they're available.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.muted, padding: '10px 14px', borderRadius: 5,
              fontSize: 12, fontWeight: 600,
            }}>Cancel</button>
            <button onClick={onConfirm} className="cta danger" style={{
              width: 'auto', padding: '10px 16px', fontSize: 12,
            }}>FIRE</button>
          </div>
        </div>
      </div>
    </div>
  )
}
