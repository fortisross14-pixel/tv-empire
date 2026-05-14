import { useState } from 'react'
import { T, FONTS } from '../theme.js'
import { RESEARCH, SLOT_TYPES, CATEGORIES } from '../constants.js'
import { canResearch, getUnlocks, researchAdjusted } from '../engine.js'

// Note: SectionTitle/Bar imports from ./ui.jsx removed in stage AL — the
// editorial migration inlines their roles with SectionHead and gradient
// progress bars.

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
  const activeGroupMeta = GROUPS.find(g => g.id === activeGroup)

  return (
    <div className="view-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 48px' }}>
      {/* Back link — quiet text style, same as Operations/Programming */}
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
          Same Fraunces hero pattern as Operations/Programming. */}
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
          R&amp;D · {activeGroupMeta?.label || 'Research'}
        </div>
        <h1 className="editorial" style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 52, lineHeight: 0.95, letterSpacing: '-.025em',
          color: T.text, marginBottom: 12,
        }}>
          Research &amp; Development
        </h1>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 14, color: T.textDim, lineHeight: 1.55, maxWidth: 580,
        }}>
          Research takes time and money. A VP of Innovation discounts both.
          Researching in a domain you already know is faster.
        </div>
      </div>

      {/* VP of Innovation gate — editorial empty state when no R&D head */}
      {!hasInnovationDir && (
        <div style={{
          marginBottom: 24, padding: '20px 22px',
          background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
          border: `1px solid ${T.red}44`,
          borderLeft: `3px solid ${T.red}`,
          borderRadius: 6,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
            textTransform: 'uppercase', color: T.red, marginBottom: 10,
          }}>
            R&amp;D department closed
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 96, 'wght' 500",
            fontStyle: 'italic',
            fontSize: 17, color: T.text, marginBottom: 8, lineHeight: 1.3,
          }}>
            Hire a VP of Innovation first.
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 13, color: T.textDim, lineHeight: 1.55, maxWidth: 540,
          }}>
            Without one, the department doesn't exist — and no research can begin.
            Open <span className="mono" style={{ fontStyle: 'normal', fontSize: 12 }}>Operations → Staff</span> to put a head on it.
          </div>
        </div>
      )}

      {/* In-progress projects — editorial event card */}
      {inProgress.length > 0 && (
        <div style={{
          marginBottom: 32, padding: '20px 22px',
          background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
          border: `1px solid ${T.gold}55`,
          borderLeft: `3px solid ${T.gold}`,
          borderRadius: 6,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
            textTransform: 'uppercase', color: T.gold, marginBottom: 10,
          }}>
            In progress · {inProgress.length} project{inProgress.length === 1 ? '' : 's'}
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {inProgress.map(p => {
              const r = RESEARCH.find(x => x.id === p.id)
              const pct = (p.monthsTotal - p.monthsLeft) / p.monthsTotal
              return (
                <div key={p.id}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontFamily: FONTS.serif,
                      fontVariationSettings: "'opsz' 24, 'wght' 600",
                      fontSize: 15, color: T.text, letterSpacing: '-.005em',
                    }}>
                      {r?.icon || '🔬'} {r?.label || p.id}
                    </span>
                    <span className="mono" style={{
                      fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: '.06em',
                    }}>
                      {p.monthsLeft} mo left
                    </span>
                  </div>
                  {/* Gradient progress bar */}
                  <div style={{
                    height: 4, background: T.border, borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${pct * 100}%`,
                      background: `linear-gradient(90deg, ${T.gold}aa 0%, ${T.gold} 100%)`,
                      transition: 'width .5s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Group tabs — reuse the Operations OpsSubTab pattern */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 14,
        borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto',
      }}>
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

      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 13, color: T.textDim, marginBottom: 20, lineHeight: 1.5, maxWidth: 620,
      }}>
        {activeGroupMeta?.desc}
      </div>

      <div style={{
        display: 'grid', gap: 10,
        gridTemplateColumns: activeGroup === 'content' || activeGroup === 'tech'
          ? 'repeat(auto-fill, minmax(320px, 1fr))'
          : '1fr',
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

/** Editorial sub-tab — matches Operations OpsSubTab. */
function GroupTab({ label, count, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: hover && !active ? 'rgba(255,255,255,.025)' : 'transparent',
        border: 'none',
        color: active ? T.text : (hover ? T.text : T.muted),
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: active ? 700 : 600,
        letterSpacing: '.12em', textTransform: 'uppercase',
        padding: '11px 16px', cursor: 'pointer',
        position: 'relative',
        whiteSpace: 'nowrap',
        transition: 'color .15s, background .15s',
      }}
    >
      {/* Gold bullet square on active */}
      {active && (
        <span style={{
          display: 'inline-block',
          width: 5, height: 5,
          background: T.accent,
          marginRight: 8, marginBottom: 1,
          verticalAlign: 'middle',
        }} />
      )}
      {label}{typeof count === 'number' && count > 0 ? ` · ${count}` : ''}
      {/* Gold bottom rule on active */}
      {active && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: -1, height: 2,
          background: T.accent,
        }} />
      )}
    </button>
  )
}

function ResearchCard({ item, research, station, cash, unlocks, onBuy, hasInnovationDir }) {
  const [hover, setHover] = useState(false)
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

  // Stripe color: green if owned, gold if in progress, accent if buyable, muted otherwise
  const stripeColor = isReallyOwned ? T.green
                    : inProgress    ? T.gold
                    : enabled       ? T.accent
                    : T.borderHi

  const missingPrereqs = item.requires && !item.requires.every(req => (research.unlocked || []).includes(req))
    ? `Requires: ${item.requires.map(id => RESEARCH.find(r => r.id === id)?.label || id).join(', ')}`
    : null

  const stationMarketIdx = ['local','metro','national'].indexOf(station.market)
  const requiredMarketIdx = item.requiresMarket ? ['local','metro','national'].indexOf(item.requiresMarket) : -1
  const missingMarket = requiredMarketIdx > stationMarketIdx
    ? `Requires ${item.requiresMarket === 'metro' ? 'Metro' : 'National'} market`
    : null

  const prereqText = [missingPrereqs, missingMarket].filter(Boolean).join(' · ')

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: !available && !isReallyOwned
          ? T.surface
          : (hover && enabled
              ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
              : `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`),
        border: `1px solid ${hover && enabled ? T.borderHi : T.border}`,
        borderLeft: `3px solid ${stripeColor}`,
        borderRadius: 5, padding: 14,
        opacity: !available && !isReallyOwned ? 0.55 : 1,
        transition: 'background .15s, border-color .15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + icon */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
          }}>
            {item.icon && <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>}
            <span style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 24, 'wght' 600",
              fontSize: 15.5, color: T.text, letterSpacing: '-.005em',
            }}>
              {item.label}
            </span>
            {isReallyOwned && (
              <span className="mono" style={{
                fontSize: 9, color: T.green, fontWeight: 700,
                letterSpacing: '.14em', marginLeft: 4,
              }}>✓</span>
            )}
          </div>

          {/* Description — italic serif */}
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 12.5, color: T.textDim, lineHeight: 1.5, marginBottom: 8,
          }}>
            {item.desc}
          </div>

          {/* Detail (e.g. slot / topic unlocked) — inline mono callout */}
          {detail && (
            <div className="mono" style={{
              fontSize: 10.5, color: T.text, marginBottom: 8,
              padding: '5px 9px',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 3,
              display: 'inline-block',
            }}>
              {detail}
            </div>
          )}

          {/* Prereq warnings */}
          {prereqText && (
            <div style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 14, 'wght' 400",
              fontStyle: 'italic',
              fontSize: 11.5, color: T.red, marginBottom: 8, lineHeight: 1.4,
            }}>
              {prereqText}
            </div>
          )}

          {/* Cost + time — mono pill row */}
          {!isReallyOwned && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span className="mono" style={{
                fontSize: 9.5, color: T.muted, fontWeight: 700,
                padding: '2px 7px', borderRadius: 3,
                background: T.surface, border: `1px solid ${T.border}`,
                letterSpacing: '.08em',
              }}>
                {adj.months} MO
              </span>
              <span className="mono" style={{
                fontSize: 9.5, color: affordable ? T.text : T.red, fontWeight: 700,
                padding: '2px 7px', borderRadius: 3,
                background: T.surface, border: `1px solid ${affordable ? T.border : T.red + '55'}`,
                letterSpacing: '.06em',
              }}>
                ${adj.cost.toFixed(1)}M
              </span>
              {(adj.cost < item.cost || adj.months < item.months) && (
                <span className="mono" style={{
                  fontSize: 9.5, color: T.gold, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 3,
                  background: T.gold + '14', border: `1px solid ${T.gold}66`,
                  letterSpacing: '.08em', textTransform: 'uppercase',
                }}>
                  Discounted
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action button — outline-fills-on-hover for buyable, distinct states otherwise */}
        <ResearchActionButton
          owned={isReallyOwned}
          inProgress={inProgress}
          enabled={enabled}
          hasInnovationDir={hasInnovationDir}
          available={available}
          affordable={affordable}
          cost={adj.cost}
          onClick={onBuy}
          ownedLabel={hasSlot ? 'Have' : alreadyHaveAll ? 'Known' : 'Owned'}
        />
      </div>
    </div>
  )
}

function ResearchActionButton({ owned, inProgress, enabled, hasInnovationDir, available, affordable, cost, onClick, ownedLabel }) {
  const [hover, setHover] = useState(false)

  // Owned state — green caps, no button affordance
  if (owned) {
    return (
      <span className="mono" style={{
        fontSize: 10, color: T.green, fontWeight: 700,
        padding: '6px 12px', borderRadius: 3,
        background: T.green + '14', border: `1px solid ${T.green}55`,
        letterSpacing: '.16em', textTransform: 'uppercase',
        flexShrink: 0, alignSelf: 'flex-start',
      }}>
        {ownedLabel}
      </span>
    )
  }
  // In progress — gold caps with mono
  if (inProgress) {
    return (
      <span className="mono" style={{
        fontSize: 10, color: T.gold, fontWeight: 700,
        padding: '6px 12px', borderRadius: 3,
        background: T.gold + '14', border: `1px solid ${T.gold}55`,
        letterSpacing: '.16em', textTransform: 'uppercase',
        flexShrink: 0, alignSelf: 'flex-start',
      }}>
        Running
      </span>
    )
  }
  // Locked states — dashed-border red or muted
  if (!hasInnovationDir) {
    return (
      <span className="mono" style={{
        fontSize: 10, color: T.red, fontWeight: 700,
        padding: '6px 12px', borderRadius: 3,
        background: T.surface, border: `1px dashed ${T.red}55`,
        letterSpacing: '.14em', textTransform: 'uppercase',
        flexShrink: 0, alignSelf: 'flex-start', whiteSpace: 'nowrap',
      }}>
        No R&amp;D
      </span>
    )
  }
  if (!available) {
    return (
      <span className="mono" style={{
        fontSize: 10, color: T.muted, fontWeight: 700,
        padding: '6px 12px', borderRadius: 3,
        background: T.surface, border: `1px dashed ${T.border}`,
        letterSpacing: '.14em', textTransform: 'uppercase',
        flexShrink: 0, alignSelf: 'flex-start',
      }}>
        Locked
      </span>
    )
  }
  if (!affordable) {
    return (
      <span className="mono" style={{
        fontSize: 10, color: T.red, fontWeight: 700,
        padding: '6px 12px', borderRadius: 3,
        background: T.surface, border: `1px dashed ${T.red}55`,
        letterSpacing: '.14em', textTransform: 'uppercase',
        flexShrink: 0, alignSelf: 'flex-start', whiteSpace: 'nowrap',
      }}>
        ${cost.toFixed(1)}M
      </span>
    )
  }
  // Buyable — outline-fills-on-hover, same pattern as SignButton/IPLicenseButton
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? T.accent : 'transparent',
        color: hover ? T.bg : T.accent,
        border: `1px solid ${T.accent}`,
        padding: '6px 14px', borderRadius: 4,
        fontSize: 10, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase',
        cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start',
        transition: 'background .15s, color .15s',
      }}
    >
      Begin
    </button>
  )
}
