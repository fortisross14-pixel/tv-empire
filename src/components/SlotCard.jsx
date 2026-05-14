import { useState } from 'react'
import { T, FONTS } from '../theme.js'
import { CATEGORIES, SLOT_TYPES, MONTHS } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import { Icon, SlotIcon, CategoryIcon } from '../icons.jsx'
import { play as playSound } from '../audio.js'
import {
  projectShow, findDirector, findStar, findIP, findMovie, findLeague,
  getSeasonalPref, cancelRunCost,
  slotAutoAt, idleSchedulingDirectors,
} from '../engine.js'

/**
 * SlotCard — three visual states:
 *   1. EMPTY  → flat "off" tile; click to plan.
 *   2. ACTIVE → broadcast tile with title, ratings, cancel button.
 *   3. AUTO   → "Director-managed" tile showing category focus + cancel button.
 *               Manual scheduling is BLOCKED while auto is on this slot.
 */
export function SlotCard({
  plan, run, idx, slotTypeId, cycleIdx, station, research,
  onClick, onCancel,
  onAssignSchedDirector, onCancelSchedDirector,
}) {
  const slotType = SLOT_TYPES[slotTypeId] || SLOT_TYPES.prime
  const seasonal = getSeasonalPref(slotTypeId, cycleIdx)
  const auto = slotAutoAt(station, idx)

  if (run) {
    return <ActiveRunCard
      run={run} slotType={slotType} cycleIdx={cycleIdx}
      station={station} research={research} onCancel={onCancel}
    />
  }

  if (auto) {
    return <AutoManagedSlotCard
      slotType={slotType} auto={auto} slotIdx={idx}
      onCancelSchedDirector={onCancelSchedDirector}
    />
  }

  return <EmptySlotCard
    slotType={slotType} cycleIdx={cycleIdx} seasonal={seasonal}
    onClick={onClick}
    canAssignAuto={idleSchedulingDirectors(station) > 0}
    slotIdx={idx}
    onAssignSchedDirector={onAssignSchedDirector}
  />
}

// ─── EMPTY SLOT — confident, inviting, with proper hover lift ─────────
function EmptySlotCard({
  slotType, cycleIdx, seasonal, onClick,
  canAssignAuto, slotIdx, onAssignSchedDirector,
}) {
  const [picking, setPicking] = useState(false)
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        // Solid surface instead of dashed border — confident, not provisional.
        // Subtle gradient gives depth without a heavy fill.
        background: hover
          ? `linear-gradient(180deg, ${T.cardHiGradTop || T.cardHi} 0%, ${T.cardHiGradBot || T.card} 100%)`
          : `linear-gradient(180deg, ${T.surface} 0%, rgba(15, 11, 22, 0.4) 100%)`,
        border: `1px solid ${hover ? T.borderHi : T.border}`,
        borderRadius: 6,
        transition: 'background .15s, border-color .15s, transform .05s',
        boxShadow: hover ? '0 4px 16px rgba(0,0,0,.25)' : 'none',
      }}
    >
      <button
        onClick={() => { playSound('tick'); onClick() }}
        style={{
          display: 'block', width: '100%',
          background: 'transparent', border: 'none',
          borderRadius: 6, padding: '16px 16px 14px',
          textAlign: 'left', cursor: 'pointer', color: T.text,
        }}
      >
        {/* Slot type eyebrow — small caps with icon */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 8,
        }}>
          <SlotIcon slotTypeId={slotType.id} size={14} color={T.muted} />
          <div style={{
            fontSize: 10, fontWeight: 700,
            color: T.muted, letterSpacing: '.14em',
            textTransform: 'uppercase',
          }}>
            {slotType.label}
          </div>
        </div>

        {/* Editorial empty-state title — serif italic, suggests the void waiting to be filled */}
        <div className="editorial" style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 500",
          fontSize: 22, lineHeight: 1.1,
          color: hover ? T.text : T.textDim,
          fontStyle: 'italic',
          marginBottom: 8,
          transition: 'color .15s',
        }}>
          Awaiting program
        </div>

        {/* Slot description — kept brief */}
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontSize: 12, lineHeight: 1.5,
          color: T.muted,
          marginBottom: 14,
        }}>
          {slotType.desc}
        </div>

        {/* Seasonal hint — kept, but restyled to fit the new system */}
        {seasonal && (
          <div style={{
            fontSize: 10.5,
            padding: '7px 10px',
            background: 'rgba(255, 209, 102, .08)',
            border: `1px solid rgba(255, 209, 102, .3)`,
            borderRadius: 3,
            color: T.gold,
            marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="star" size={11} color={T.gold} />
            <span>{MONTHS[cycleIdx]} wants <strong>{seasonal.label}</strong></span>
            <span style={{ opacity: .8, marginLeft: 'auto', fontFamily: FONTS.mono }}>
              +{seasonal.bonusH?.toFixed(1)}H
            </span>
          </div>
        )}

        {/* CTA — outline button that fills in on card hover (parent-driven) */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          background: hover ? T.accent : 'transparent',
          color: hover ? T.bg : T.accent,
          border: `1px solid ${T.accent}`,
          borderRadius: 3,
          fontSize: 11, fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          transition: 'background .15s, color .15s',
        }}>
          <Icon name="plus" size={11} color={hover ? T.bg : T.accent} />
          <span>Plan program</span>
        </div>
      </button>

      {/* Auto-assign affordance — only shown if there's an idle scheduling director */}
      {canAssignAuto && !picking && (
        <div style={{
          padding: '0 16px 12px',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setPicking(true) }}
            style={{
              fontSize: 10, color: T.muted,
              background: 'transparent', border: `1px dashed ${T.border}`,
              borderRadius: 3, padding: '4px 9px',
              cursor: 'pointer', letterSpacing: '.06em',
              fontWeight: 500,
            }}
          >
            <Icon name="calendar" size={10} color={T.muted} style={{ marginRight: 4 }} />
            Auto-assign director
          </button>
        </div>
      )}
      {canAssignAuto && picking && (
        <CategoryPicker
          onPick={(catId) => {
            setPicking(false)
            onAssignSchedDirector?.(slotIdx, catId)
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  )
}

// ─── AUTO-MANAGED SLOT — director owns it, manual scheduling blocked ──
function AutoManagedSlotCard({ slotType, auto, slotIdx, onCancelSchedDirector }) {
  const cat = CATEGORIES.find(c => c.id === auto.categoryId)
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.gold}55`,
      borderRadius: 6,
      padding: '14px 14px 12px',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6,
      }}>
        <SlotIcon slotTypeId={slotType.id} size={16} color={T.gold} />
        <div className="display" style={{
          fontSize: 13, color: T.gold, letterSpacing: '.06em', textTransform: 'uppercase',
        }}>
          {slotType.label}
        </div>
        <div style={{
          marginLeft: 'auto', fontSize: 9, color: T.gold, letterSpacing: '.1em',
          padding: '2px 6px', background: T.gold + '22', borderRadius: 3, fontWeight: 700,
        }}>
          AUTO
        </div>
      </div>

      <div style={{
        fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 1.5,
      }}>
        Director of Scheduling is producing <strong style={{ color: T.text }}>{cat?.label || auto.categoryId}</strong> programs here every month.
        Quality 0.9× · Hype 0.85× vs hand-crafted.
      </div>

      <button
        onClick={() => onCancelSchedDirector?.(slotIdx)}
        style={{
          fontSize: 11, color: T.muted,
          background: 'transparent', border: `1px solid ${T.border}`,
          borderRadius: 3, padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        Cancel auto-scheduling
      </button>
    </div>
  )
}

// ─── CATEGORY PICKER (used by EmptySlot to assign auto director) ──────
function CategoryPicker({ onPick, onCancel }) {
  return (
    <div style={{
      padding: 10, margin: '0 10px 10px',
      background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
    }}>
      <div style={{
        fontSize: 10, color: T.muted, letterSpacing: '.1em', marginBottom: 6,
      }}>FOCUS CATEGORY</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c.id}
            onClick={() => onPick(c.id)}
            style={{
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.text, fontSize: 11, padding: '6px 8px',
              borderRadius: 3, cursor: 'pointer', textAlign: 'left',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'right', marginTop: 6 }}>
        <button onClick={onCancel} style={{
          fontSize: 10, color: T.muted,
          background: 'transparent', border: 'none',
          cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── ACTIVE RUN — "the light is on" ───────────────────────────────────
function ActiveRunCard({ run, slotType, cycleIdx, station, research, onCancel }) {
  const isMovie = !!run.movieId
  const isSports = !!run.sportsRunLeagueId
  const movie = isMovie ? findMovie(run.movieId) : null
  const league = isSports ? findLeague(run.sportsRunLeagueId) : null

  const cat = isSports ? CATEGORIES.sports
            : isMovie  ? CATEGORIES.movie
            :            (run.categoryId ? CATEGORIES[run.categoryId] : null)
  const catColor = cat?.color || T.accent

  const dir = findDirector(run.directorId)
  const star = findStar(run.starId)
  const ip = findIP(run.ipId)

  const proj = projectShow(run, station, research, cycleIdx)
  const displayName = isMovie
    ? movie?.name
    : (isSports ? `${league?.label} Coverage` : (run.name || 'Untitled'))

  const monthsRemaining = run.runMonths - run.monthsAired
  const inSeasonNow = isSports ? league?.season.includes(cycleIdx) : true
  const cancelCost = cancelRunCost(run)
  const isOnAir = inSeasonNow && monthsRemaining > 0
  // "Finale next" — the upcoming airing will be the last in a multi-month
  // scripted/reality run. Gets a +25% hype boost at airing time (see airShow).
  // Sports rights use peakBonus instead, so they don't show this badge.
  const finaleNext = !isSports && run.runMonths >= 2 && monthsRemaining === 1

  return (
    <div style={{
      position: 'relative',
      background: T.card,
      borderRadius: 6,
      padding: '14px 14px 14px 18px',
      color: T.text,
      overflow: 'hidden',
      boxShadow: `0 1px 0 ${T.borderHi}, 0 4px 12px rgba(0,0,0,.3), inset 0 0 0 1px ${T.border}`,
    }}>
      {/* LEFT EDGE — category color bar (pulses while airing) */}
      <div
        className={isOnAir ? 'airing' : ''}
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 4,
          background: `linear-gradient(180deg, ${catColor}, ${catColor}88)`,
          boxShadow: `0 0 12px ${catColor}66`,
        }}
      />

      {/* SOFT INNER GLOW in category color */}
      <div style={{
        position: 'absolute',
        left: 4, top: 0, bottom: 0,
        width: 60,
        background: `linear-gradient(90deg, ${catColor}14, transparent)`,
        pointerEvents: 'none',
      }}/>

      {/* TOP ROW — slot label + on-air + months */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 8, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <SlotIcon slotTypeId={slotType.id} size={14} color={T.muted} />
          <span className="display" style={{
            fontSize: 11, color: T.muted, letterSpacing: '.08em', textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{slotType.label}</span>
          {isOnAir && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
              <span className="onair-dot" />
              <span className="mono" style={{ fontSize: 9, color: T.red, letterSpacing: '.1em' }}>LIVE</span>
            </span>
          )}
        </div>
        <span className="mono" style={{
          color: T.green, fontSize: 10.5, fontWeight: 500,
          background: 'rgba(91, 214, 135, .1)',
          padding: '2px 7px', borderRadius: 3,
          border: `1px solid rgba(91, 214, 135, .25)`,
          whiteSpace: 'nowrap',
        }}>{run.monthsAired}/{run.runMonths}MO</span>
        {finaleNext && (
          <span className="mono" style={{
            color: T.gold, fontSize: 9, fontWeight: 700,
            background: T.gold + '1a',
            padding: '2px 6px', borderRadius: 3,
            border: `1px solid ${T.gold}55`,
            whiteSpace: 'nowrap', letterSpacing: '.08em',
            marginLeft: 4,
          }}>🎬 FINALE NEXT</span>
        )}
      </div>

      {/* TITLE BLOCK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Program name — Fraunces serif, prominent */}
          <div className="editorial" style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 600",
            fontSize: 20, color: T.text, lineHeight: 1.15,
            letterSpacing: '-.01em',
            marginBottom: 4,
          }}>
            {displayName}
          </div>
          {/* Slugline — italic serif, category + season info */}
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 12, color: T.muted,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {cat && <CategoryIcon categoryId={cat === CATEGORIES.movie ? 'movie' : cat === CATEGORIES.sports ? 'sports' : run.categoryId} size={11} color={catColor} />}
            <span>{isMovie ? 'Movie' : isSports ? 'Sports Rights' : cat?.label}</span>
            {run.seqSeason > 1 && (
              <span style={{ color: T.purple }}>· Season {run.seqSeason}</span>
            )}
          </div>
        </div>
        {proj && <HTag tier={proj.tier} />}
      </div>

      {/* Off-season notice */}
      {isSports && !inSeasonNow && (
        <div style={{
          fontSize: 10.5, color: T.muted, fontStyle: 'italic',
          padding: '7px 9px', background: T.surface, borderRadius: 3, marginBottom: 10,
          border: `1px solid ${T.border}`,
        }}>
          Off-season this month — no airing, no cost.
        </div>
      )}

      {/* TALENT LINE */}
      <div style={{
        fontSize: 11, color: T.textDim, marginBottom: 10, lineHeight: 1.5,
        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
      }}>
        {isMovie ? <span style={{ color: T.muted, fontStyle: 'italic' }}>Licensed film</span> : (
          <>
            {dir
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="play" size={10} color={T.muted} /> {dir.name}
                </span>
              : <span style={{ color: T.mutedDim }}>— Director</span>}
            <span style={{ color: T.mutedDim }}>·</span>
            {star
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="star" size={10} color={T.gold} /> {star.name}
                </span>
              : <span style={{ color: T.mutedDim }}>— Star</span>}
            {ip && <>
              <span style={{ color: T.mutedDim }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="ip" size={10} color={T.teal} /> {ip.name}
              </span>
            </>}
          </>
        )}
      </div>

      {/* Q / H bars */}
      {proj && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <MetricBar label="QUALITY" value={proj.quality} color={T.green} />
          <MetricBar label="HYPE"    value={proj.hype}    color={T.pink} />
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 10, borderTop: `1px solid ${T.border}`, gap: 8,
      }}>
        <span className="mono" style={{ fontSize: 11, color: T.muted }}>
          ${run.monthlyCost.toFixed(1)}M / mo · {monthsRemaining} left
        </span>
        {onCancel && monthsRemaining > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`Cancel "${displayName}"? Penalty: $${cancelCost.toFixed(1)}M (50% of remaining run).`)) {
                onCancel()
              }
            }}
            style={{
              background: 'transparent',
              border: `1px solid rgba(239, 69, 101, .35)`,
              color: T.red,
              padding: '5px 11px',
              borderRadius: 3,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '.05em',
            }}
          >CANCEL · ${cancelCost.toFixed(1)}M</button>
        )}
      </div>
    </div>
  )
}

function MetricBar({ label, value, color }) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontSize: 9, color: T.muted, marginBottom: 4, letterSpacing: '.08em',
      }}>
        <span>{label}</span>
        <span className="mono" style={{ color, fontSize: 11, fontWeight: 500 }}>
          {value.toFixed(1)}
        </span>
      </div>
      <Bar value={value} color={color} h={4} />
    </div>
  )
}
