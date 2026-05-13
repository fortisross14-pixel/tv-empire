import { useState } from 'react'
import { T } from '../theme.js'
import { RESEARCH, SLOT_TYPES, CATEGORIES } from '../constants.js'
import { canResearch, getUnlocks, researchAdjusted } from '../engine.js'
import { SectionTitle, Bar } from './ui.jsx'

const GROUPS = [
  { id: 'slots',   label: 'Slots',      desc: 'Add new programming slots to your schedule.' },
  { id: 'content', label: 'Content',    desc: 'Unlock new categories and sub-genres.' },
  { id: 'tech',    label: 'Tech',       desc: 'Audio, subtitles, and video quality upgrades.' },
  { id: 'ops',     label: 'Operations', desc: 'Permanent boosts and unlock searches.' },
]

export function ResearchScreen({ research, station, cash, onBuy, onBack }) {
  const [activeGroup, setActiveGroup] = useState('slots')
  const items = RESEARCH.filter(r => r.group === activeGroup)
  const unlocks = getUnlocks(station, research)
  const inProgress = research?.inProgress || []
  const hasInnovationDir = !!station.staff?.innovation

  return (
    <div className="view-wrap" style={{ maxWidth: 900, margin: '0 auto', padding: 18 }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: `1px solid ${T.border}`,
          color: T.muted, padding: '8px 14px', borderRadius: 5,
          fontSize: 11, fontWeight: 600, marginBottom: 16, cursor: 'pointer',
        }}
      >← Back</button>

      <SectionTitle>Research & Development</SectionTitle>

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Research takes time (months) and money. A VP of Innovation discounts both.
        Researching in a domain you already know is faster.
      </div>

      {/* VP of Innovation gate banner */}
      {!hasInnovationDir && (
        <div style={{
          marginBottom: 16, padding: '12px 14px',
          background: 'rgba(239, 69, 101, .08)',
          border: `1px solid rgba(239, 69, 101, .35)`,
          borderRadius: 6,
        }}>
          <div style={{ fontSize: 12.5, color: T.red, fontWeight: 600, marginBottom: 4 }}>
            R&amp;D department closed
          </div>
          <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.5 }}>
            Hire a VP of Innovation (Operations → Staff) before any research can begin.
            Without one, the department doesn't exist.
          </div>
        </div>
      )}

      {/* In-progress projects */}
      {inProgress.length > 0 && (
        <div style={{
          marginBottom: 16, padding: 12,
          background: T.gold + '0c', border: `1px solid ${T.gold}44`, borderRadius: 6,
        }}>
          <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 8 }}>
            🔬 IN PROGRESS ({inProgress.length})
          </div>
          {inProgress.map(p => {
            const r = RESEARCH.find(x => x.id === p.id)
            const pct = (p.monthsTotal - p.monthsLeft) / p.monthsTotal
            return (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: T.text }}>{r?.icon || '🔬'} {r?.label || p.id}</span>
                  <span style={{ color: T.muted, fontFamily: 'JetBrains Mono' }}>
                    {p.monthsLeft} mo left
                  </span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Bar value={pct * 10} color={T.gold} h={4} max={10} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Group tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {GROUPS.map(g => {
          const count = RESEARCH.filter(r =>
            r.group === g.id &&
            !((research.unlocked || []).includes(r.id) && !r.repeatable)
          ).length
          return (
            <GroupTab key={g.id} label={g.label} count={count}
              active={activeGroup === g.id} onClick={() => setActiveGroup(g.id)} />
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: T.muted, marginBottom: 14, fontStyle: 'italic' }}>
        {GROUPS.find(g => g.id === activeGroup)?.desc}
      </div>

      <div style={{
        display: 'grid', gap: 10,
        gridTemplateColumns: activeGroup === 'content' || activeGroup === 'tech' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
      }}>
        {items.map(r => (
          <ResearchCard
            key={r.id}
            item={r}
            research={research}
            station={station}
            cash={cash}
            unlocks={unlocks}
            hasInnovationDir={hasInnovationDir}
            onBuy={() => onBuy(r.id)}
          />
        ))}
      </div>
    </div>
  )
}

function GroupTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none',
        color: active ? T.accent : T.muted,
        fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '.1em',
        padding: '10px 14px', cursor: 'pointer',
        borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
        marginBottom: -1, whiteSpace: 'nowrap',
      }}
    >{label}{typeof count === 'number' && count > 0 ? ` · ${count}` : ''}</button>
  )
}

function ResearchCard({ item, research, station, cash, unlocks, onBuy, hasInnovationDir }) {
  const owned = (research.unlocked || []).includes(item.id) && !item.repeatable
  const inProgress = (research.inProgress || []).some(p => p.id === item.id)
  const available = canResearch(item.id, research, station) && !inProgress
  const adj = researchAdjusted(item.id, station, research)
  const affordable = cash >= adj.cost

  const enabled = !owned && available && affordable && !inProgress && hasInnovationDir

  let alreadyHaveAll = false
  if (item.effect?.unlockContent && !owned) {
    alreadyHaveAll = item.effect.unlockContent.every(([cat, topic]) => unlocks.hasTopic(cat, topic))
  }
  const hasSlot = item.effect?.addSlot &&
    (station.slotIds || []).includes(item.effect.addSlot)

  let detail = null
  if (item.effect?.unlockContent) {
    const parts = item.effect.unlockContent.map(([catId, topicId]) => {
      const cat = CATEGORIES[catId]
      const topic = cat?.topics.find(t => t.id === topicId)
      return topic ? `${cat.icon} ${topic.label}` : null
    }).filter(Boolean)
    detail = parts.join(' · ')
  } else if (item.effect?.addSlot) {
    const st = SLOT_TYPES[item.effect.addSlot]
    detail = st ? `${st.icon} ${st.label}` : null
  }

  const isReallyOwned = owned || hasSlot || alreadyHaveAll
  const buttonDisabled = isReallyOwned || !enabled
  let buttonLabel
  if (isReallyOwned) buttonLabel = hasSlot ? 'HAVE' : alreadyHaveAll ? 'KNOWN' : 'OWNED'
  else if (inProgress) buttonLabel = 'RUNNING'
  else if (!hasInnovationDir) buttonLabel = 'NO R&D'
  else if (!available) buttonLabel = 'LOCKED'
  else if (!affordable) buttonLabel = `$${adj.cost.toFixed(1)}M`
  else buttonLabel = 'BEGIN'

  const missingPrereqs = item.requires && !item.requires.every(req => (research.unlocked || []).includes(req))
    ? `Requires: ${item.requires.map(id => RESEARCH.find(r => r.id === id)?.label || id).join(', ')}`
    : null

  // Market-tier gate
  const stationMarketIdx = ['local','metro','national'].indexOf(station.market)
  const requiredMarketIdx = item.requiresMarket ? ['local','metro','national'].indexOf(item.requiresMarket) : -1
  const missingMarket = requiredMarketIdx > stationMarketIdx
    ? `Requires ${item.requiresMarket === 'metro' ? 'Metro' : 'National'} market`
    : null

  const prereqText = [missingPrereqs, missingMarket].filter(Boolean).join(' · ')

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${isReallyOwned ? T.green + '55' : T.border}`,
      borderRadius: 6, padding: 12,
      opacity: !available && !isReallyOwned ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: isReallyOwned ? T.green : T.text,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
            {item.label}
            {isReallyOwned && <span>✓</span>}
          </div>
          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginTop: 4 }}>
            {item.desc}
          </div>
          {detail && (
            <div style={{
              fontSize: 10, color: T.text, marginTop: 6,
              padding: '5px 8px', background: T.cardHi, borderRadius: 3,
              fontStyle: 'italic',
            }}>{detail}</div>
          )}
          {prereqText && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 5 }}>🔒 {prereqText}</div>
          )}
          {!isReallyOwned && (
            <div style={{
              fontSize: 10, color: T.muted, marginTop: 5, fontFamily: 'JetBrains Mono',
              display: 'flex', gap: 10,
            }}>
              <span>⏱ {adj.months} mo</span>
              <span>💰 ${adj.cost.toFixed(1)}M</span>
              {(adj.cost < item.cost || adj.months < item.months) && (
                <span style={{ color: T.gold }}>discounted!</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onBuy}
          disabled={buttonDisabled}
          style={{
            background: isReallyOwned ? T.green + '22' : enabled ? T.accent : T.border,
            color: isReallyOwned ? T.green : enabled ? T.bg : T.muted,
            padding: '6px 11px', borderRadius: 4,
            fontSize: 11, fontWeight: 700, letterSpacing: '.04em',
            cursor: buttonDisabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', border: 'none', minWidth: 80,
          }}
        >{buttonLabel}</button>
      </div>
    </div>
  )
}
