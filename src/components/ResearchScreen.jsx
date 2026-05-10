import { useState } from 'react'
import { T } from '../theme.js'
import { RESEARCH, SLOT_TYPES, CATEGORIES } from '../constants.js'
import { canResearch, getUnlocks } from '../engine.js'
import { SectionTitle } from './ui.jsx'

const GROUPS = [
  { id: 'slots',   label: 'Slots',      desc: 'Add new programming slots to your schedule.' },
  { id: 'content', label: 'Content',    desc: 'Unlock new categories and sub-genres.' },
  { id: 'ops',     label: 'Operations', desc: 'Permanent boosts to costs and operations.' },
]

export function ResearchScreen({ research, station, cash, onBuy, onBack }) {
  const [activeGroup, setActiveGroup] = useState('slots')
  const items = RESEARCH.filter(r => r.group === activeGroup)
  const unlocks = getUnlocks(station, research)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 18 }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: `1px solid ${T.border}`,
          color: T.muted, padding: '8px 14px', borderRadius: 5,
          fontSize: 11, fontWeight: 600, marginBottom: 16, cursor: 'pointer',
        }}
      >← Back to Programming</button>

      <SectionTitle>Research & Development</SectionTitle>

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Invest in your station's capabilities. Slot research adds new programming
        windows, content research unlocks categories and topics, operations gives
        permanent economic boosts.
      </div>

      {/* Group tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: `1px solid ${T.border}` }}>
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
        gridTemplateColumns: activeGroup === 'content' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
      }}>
        {items.map(r => (
          <ResearchCard
            key={r.id}
            item={r}
            research={research}
            station={station}
            cash={cash}
            unlocks={unlocks}
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
        fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '.1em',
        padding: '10px 14px', cursor: 'pointer',
        borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
        marginBottom: -1,
      }}
    >{label}{typeof count === 'number' && count > 0 ? ` · ${count}` : ''}</button>
  )
}

function ResearchCard({ item, research, station, cash, unlocks, onBuy }) {
  const owned = (research.unlocked || []).includes(item.id) && !item.repeatable
  const available = canResearch(item.id, research)
  const affordable = cash >= item.cost
  const enabled = !owned && available && affordable

  // For content packs: check if the unlocks are already redundant
  let alreadyHaveAll = false
  if (item.effect?.unlockContent && !owned) {
    alreadyHaveAll = item.effect.unlockContent.every(([cat, topic]) => unlocks.hasTopic(cat, topic))
  }
  // For slot packs: check if station already has this slot type
  const hasSlot = item.effect?.addSlot &&
    (station.slotIds || []).includes(item.effect.addSlot)

  // Build the 'detail' line — what this unlocks specifically
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
    detail = st ? `${st.icon} ${st.label} — prefers ${st.prefersCategory.map(c => CATEGORIES[c]?.label || c).join(', ')}` : null
  }

  // Compute effective state
  const isReallyOwned = owned || hasSlot || alreadyHaveAll
  const buttonDisabled = isReallyOwned || !available || !affordable
  const buttonLabel = isReallyOwned
    ? (hasSlot ? 'HAVE SLOT' : alreadyHaveAll ? 'ALREADY HAVE' : 'OWNED')
    : !available
      ? 'LOCKED'
      : !affordable
        ? `$${item.cost}M`
        : `$${item.cost}M`

  // Show prerequisite text
  const prereqText = item.requires && !item.requires.every(req => (research.unlocked || []).includes(req))
    ? `Requires: ${item.requires.map(id => RESEARCH.find(r => r.id === id)?.label || id).join(', ')}`
    : null

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${isReallyOwned ? T.green + '55' : T.border}`,
      borderRadius: 6,
      padding: 12,
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
            {item.repeatable && <span style={{ fontSize: 9, color: T.teal, fontWeight: 700 }}>♻ REPEATABLE</span>}
          </div>
          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginTop: 4 }}>
            {item.desc}
          </div>
          {detail && (
            <div style={{
              fontSize: 10, color: T.text, marginTop: 6,
              padding: '5px 8px', background: T.cardHi, borderRadius: 3,
              fontStyle: 'italic',
            }}>
              {detail}
            </div>
          )}
          {prereqText && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 5 }}>
              🔒 {prereqText}
            </div>
          )}
        </div>
        <button
          onClick={onBuy}
          disabled={buttonDisabled}
          style={{
            background: isReallyOwned
              ? T.green + '22'
              : enabled ? T.accent : T.border,
            color: isReallyOwned
              ? T.green
              : enabled ? T.bg : T.muted,
            padding: '6px 11px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.04em',
            cursor: buttonDisabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            border: 'none',
            minWidth: 80,
          }}
        >{buttonLabel}</button>
      </div>
    </div>
  )
}
