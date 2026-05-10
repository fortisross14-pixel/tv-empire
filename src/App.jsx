import React, { useState, useMemo } from 'react'
import { T } from './theme'
import { MARKETS, MARKETING_TIERS, RESEARCH, MOVIES } from './constants'
import {
  initGame,
  emptyPlanned,
  programCost,
  runCycle,
  buildAwards,
  applyResearch,
  canResearch,
  canPromote,
  promotedMarket,
  buildRoster,
  fameLabel,
  uid,
  fmtM,
} from './engine'

import { SetupScreen } from './components/SetupScreen'
import { SlotCard } from './components/SlotCard'
import { SlotEditor } from './components/SlotEditor'
import { ResultsView } from './components/ResultsView'
import { AwardsView } from './components/AwardsView'
import { ResearchPanel } from './components/ResearchPanel'
import { SectionTitle, Pill } from './components/ui'

const QLABEL = ['Q1', 'Q2', 'Q3', 'Q4']

export default function App() {
  const [game, setGame] = useState({ phase: 'setup' })
  const [editingSlot, setEditingSlot] = useState(null) // index or null

  // ─── SETUP ────────────────────────────────────────────────────────────
  const startGame = (setup) => {
    setGame(initGame(setup))
  }

  // ─── PLANNING ────────────────────────────────────────────────────────
  const openSlot = (i) => setEditingSlot(i)
  const closeSlot = () => setEditingSlot(null)

  const saveSlot = (draft) => {
    setGame((g) => {
      const slots = g.slots.slice()
      slots[editingSlot] = draft
      return { ...g, slots }
    })
    setEditingSlot(null)
  }

  const clearSlot = () => {
    setGame((g) => {
      const slots = g.slots.slice()
      slots[editingSlot] = emptyPlanned()
      return { ...g, slots }
    })
    setEditingSlot(null)
  }

  // Set of director/star ids already booked in OTHER slots
  const bookedTalent = useMemo(() => {
    if (!game.slots) return new Set()
    const s = new Set()
    game.slots.forEach((slot, i) => {
      if (i === editingSlot) return
      if (slot.directorId) s.add(slot.directorId)
      if (slot.starId) s.add(slot.starId)
    })
    return s
  }, [game.slots, editingSlot])

  // Total planned cost for the cycle preview
  const cycleCost = useMemo(() => {
    if (!game.slots) return 0
    return game.slots.reduce((sum, slot) => {
      if (!slot.categoryId && !slot.movieId) return sum
      return sum + programCost(slot, game.station.market, game.research)
    }, 0)
  }, [game.slots, game.station, game.research])

  const filledSlotCount = useMemo(() => {
    if (!game.slots) return 0
    return game.slots.filter((s) => s.categoryId || s.movieId).length
  }, [game.slots])

  // ─── AIR THE CYCLE ────────────────────────────────────────────────────
  const airCycle = () => {
    if (filledSlotCount === 0) return
    if (cycleCost > game.station.cash) return

    const planned = game.slots
      .filter((s) => s.categoryId || s.movieId)
      .map((s) => ({ ...s, id: uid() }))

    const results = runCycle(planned, game.station, game.research)

    setGame((g) => {
      const newCash = g.station.cash - results.totals.cost + results.totals.revenue
      const newFame = Math.max(0, g.station.fame + results.totals.fameDelta)
      const station = { ...g.station, cash: newCash, fame: newFame }

      // Track shows eligible for renewal (quality >= 7, not movies)
      const newOwned = [...g.ownedShows]
      results.shows.forEach((sh) => {
        if (sh.movieId) return
        if (sh.quality >= 7) {
          // remove existing entry with same name (renewal upgrade)
          const idx = newOwned.findIndex((o) => o.name === sh.name)
          const rec = {
            id: sh.id,
            name: sh.name,
            categoryId: sh.categoryId,
            topicId: sh.topicId,
            ipId: sh.ipId,
            lastQuality: sh.quality,
            lastHype: sh.hype,
            lastRating: sh.rating,
            lastSeqSeason: sh.seqSeason || 1,
          }
          if (idx >= 0) newOwned[idx] = rec
          else newOwned.push(rec)
        }
      })

      return {
        ...g,
        station,
        lastResults: results,
        yearShows: [...g.yearShows, ...results.shows],
        ownedShows: newOwned,
        phase: 'results',
        log: [
          ...g.log,
          `Y${g.year} ${QLABEL[g.cycleIdx]} aired — net ${fmtM(results.totals.net)}, fame ${results.totals.fameDelta >= 0 ? '+' : ''}${results.totals.fameDelta.toFixed(1)}`,
        ],
      }
    })
  }

  // ─── ADVANCE ─────────────────────────────────────────────────────────
  const continueAfterResults = () => {
    setGame((g) => {
      const wasQ4 = g.cycleIdx === 3
      if (wasQ4) {
        const awards = buildAwards(g.yearShows, g.station)
        // apply awards bonuses immediately
        let cash = g.station.cash
        let fame = g.station.fame
        awards.wins.forEach((w) => {
          cash += w.cashBonus
          fame += w.fameBonus
        })
        if (awards.bestOverall) {
          cash += awards.bestOverall.cashBonus
          fame += awards.bestOverall.fameBonus
        }
        return {
          ...g,
          station: { ...g.station, cash, fame },
          awards,
          phase: 'awards',
        }
      }
      // Normal cycle advance
      return {
        ...g,
        cycleIdx: g.cycleIdx + 1,
        slots: Array(g.numSlots).fill(null).map(() => emptyPlanned()),
        lastResults: null,
        phase: 'plan',
      }
    })
  }

  const newYear = () => {
    setGame((g) => ({
      ...g,
      year: g.year + 1,
      cycleIdx: 0,
      yearShows: [],
      slots: Array(g.numSlots).fill(null).map(() => emptyPlanned()),
      roster: buildRoster(g.scoutLevel),
      awards: null,
      lastResults: null,
      phase: 'plan',
      log: [...g.log, `🎬 Year ${g.year + 1} — fresh roster, fresh slate`],
    }))
  }

  const promoteMarket = () => {
    setGame((g) => {
      if (!canPromote(g.station)) return g
      const next = promotedMarket(g.station)
      return {
        ...g,
        station: { ...g.station, market: next, cash: g.station.cash + 25 },
        log: [...g.log, `🚀 Expanded to ${MARKETS[next].label}! +$25M relocation budget`],
      }
    })
  }

  // ─── RESEARCH ────────────────────────────────────────────────────────
  const buyResearch = (id) => {
    const item = RESEARCH.find((r) => r.id === id)
    if (!item) return
    if (game.station.cash < item.cost) return
    if (!canResearch(id, game.research)) return

    setGame((g) => {
      const research = applyResearch(g.research, id)
      let numSlots = g.numSlots
      let slots = g.slots
      let scoutLevel = g.scoutLevel
      let roster = g.roster

      if (item.effect.numSlots && item.effect.numSlots > numSlots) {
        const add = item.effect.numSlots - numSlots
        numSlots = item.effect.numSlots
        slots = [...slots, ...Array(add).fill(null).map(() => emptyPlanned())]
      }
      if (item.effect.refreshRoster) {
        scoutLevel += 1
        roster = buildRoster(scoutLevel)
      }

      return {
        ...g,
        research,
        numSlots,
        slots,
        scoutLevel,
        roster,
        station: { ...g.station, cash: g.station.cash - item.cost },
        log: [...g.log, `🔬 Researched ${item.label}`],
      }
    })
  }

  // ─── RENDER ──────────────────────────────────────────────────────────
  if (game.phase === 'setup') {
    return <SetupScreen onStart={startGame} />
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: 40 }}>
      <TopBar game={game} />

      {game.phase === 'plan' && (
        <PlanView
          game={game}
          cycleCost={cycleCost}
          filledSlotCount={filledSlotCount}
          onOpenSlot={openSlot}
          onAir={airCycle}
          onResearch={buyResearch}
        />
      )}

      {game.phase === 'results' && (
        <ResultsView
          results={game.lastResults}
          station={game.station}
          cycleLabel={`Y${game.year} ${QLABEL[game.cycleIdx]}`}
          onContinue={continueAfterResults}
        />
      )}

      {game.phase === 'awards' && (
        <AwardsView
          awards={game.awards}
          station={game.station}
          year={game.year}
          onContinue={newYear}
          onPromote={promoteMarket}
        />
      )}

      {editingSlot !== null && game.phase === 'plan' && (
        <SlotEditor
          initial={game.slots[editingSlot]}
          station={game.station}
          research={game.research}
          roster={game.roster}
          movies={MOVIES}
          takenTalent={bookedTalent}
          ownedShows={game.ownedShows}
          onSave={saveSlot}
          onClear={clearSlot}
          onClose={closeSlot}
        />
      )}
    </div>
  )
}

// ─── TOP BAR ────────────────────────────────────────────────────────────
function TopBar({ game }) {
  const m = MARKETS[game.station.market]
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: '14px 18px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: '1 1 200px' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 1, lineHeight: 1 }}>
          {game.station.name}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
          {m.label} · {fameLabel(game.station.fame)}
        </div>
      </div>
      <Stat label="YEAR" value={`${game.year} · ${QLABEL[game.cycleIdx]}`} />
      <Stat label="FAME" value={game.station.fame.toFixed(1)} accent={T.gold} />
      <Stat label="CASH" value={fmtM(game.station.cash)} accent={T.green} />
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ minWidth: 80 }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: T.muted }}>{label}</div>
      <div
        style={{
          fontFamily: 'DM Mono',
          fontSize: 16,
          fontWeight: 600,
          color: accent || T.text,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ─── PLAN VIEW ──────────────────────────────────────────────────────────
function PlanView({ game, cycleCost, filledSlotCount, onOpenSlot, onAir, onResearch }) {
  const canAir = filledSlotCount > 0 && cycleCost <= game.station.cash
  const m = MARKETS[game.station.market]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 280px',
        gap: 18,
        padding: 18,
        maxWidth: 1200,
        margin: '0 auto',
      }}
      className="plan-grid"
    >
      <div>
        <SectionTitle>Programming Slate · {QLABEL[game.cycleIdx]} Year {game.year}</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {game.slots.map((slot, i) => (
            <SlotCard key={i} slot={slot} idx={i} onClick={() => onOpenSlot(i)} station={game.station} research={game.research} />
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5 }}>CYCLE COST</div>
              <div
                style={{
                  fontFamily: 'DM Mono',
                  fontSize: 22,
                  color: cycleCost > game.station.cash ? T.red : T.text,
                }}
              >
                {fmtM(cycleCost)}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {filledSlotCount} of {game.numSlots} slots planned
              </div>
            </div>
            <button
              className={`cta ${canAir ? 'green' : 'danger'}`}
              disabled={!canAir}
              onClick={onAir}
              style={{ minWidth: 180 }}
            >
              ▶ AIR THE CYCLE
            </button>
          </div>
          {cycleCost > game.station.cash && (
            <div style={{ marginTop: 10, fontSize: 11, color: T.red }}>
              Not enough cash — trim a slot or pick cheaper talent.
            </div>
          )}
          {filledSlotCount === 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
              Plan at least one program to air the cycle.
            </div>
          )}
        </div>

        <ActivityLog log={game.log} />
      </div>

      <div>
        <ResearchPanel
          research={game.research}
          cash={game.station.cash}
          onBuy={onResearch}
        />
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            fontSize: 11,
            color: T.muted,
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: T.text, fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
            {m.label}
          </div>
          Audience cap: {(m.audCap / 1e6).toFixed(1)}M<br />
          Rev / viewer: ${m.revPerViewer.toFixed(2)}<br />
          Marketing reach: {m.marketingMult.toFixed(1)}×<br />
          {canPromote(game.station) && (
            <div style={{ marginTop: 8, color: T.gold }}>
              Eligible to expand at year-end.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActivityLog({ log }) {
  const tail = log.slice(-6).reverse()
  return (
    <div
      style={{
        marginTop: 18,
        padding: 14,
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.muted, marginBottom: 8 }}>
        ACTIVITY
      </div>
      {tail.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: 'DM Mono',
            fontSize: 11,
            color: i === 0 ? T.text : T.muted,
            padding: '3px 0',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}
