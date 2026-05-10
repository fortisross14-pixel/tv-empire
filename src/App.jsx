import React, { useState, useMemo } from 'react'
import { T } from './theme'
import {
  MARKETS, MARKETING_TIERS, RESEARCH, MOVIES, SLOT_TYPES,
} from './constants'
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
  buildMarketRoster,
  activeRoster,
  tickContracts,
  hireTalent,
  fireTalent,
  fameLabel,
  uid,
  fmtM,
} from './engine'

import { SetupScreen } from './components/SetupScreen'
import { SlotCard } from './components/SlotCard'
import { SlotEditor } from './components/SlotEditor'
import { ResultsView } from './components/ResultsView'
import { AwardsView } from './components/AwardsView'
import { ResearchScreen } from './components/ResearchScreen'
import { TalentScreen } from './components/TalentScreen'
import { SectionTitle } from './components/ui'

const QLABEL = ['Q1', 'Q2', 'Q3', 'Q4']

export default function App() {
  const [game, setGame] = useState({ phase: 'setup' })
  const [editingSlotIdx, setEditingSlotIdx] = useState(null)
  const [view, setView] = useState('plan') // 'plan' | 'talent' | 'research'

  // ─── SETUP ───────────────────────────────────────────────────────────
  const startGame = (setup) => {
    setGame(initGame(setup))
    setView('plan')
  }

  // ─── SLOT EDITING ────────────────────────────────────────────────────
  const openSlot = (i) => setEditingSlotIdx(i)
  const closeSlot = () => setEditingSlotIdx(null)

  const saveSlot = (draft) => {
    setGame((g) => {
      const plans = g.plans.slice()
      plans[editingSlotIdx] = draft
      return { ...g, plans }
    })
    setEditingSlotIdx(null)
  }

  const clearSlot = () => {
    setGame((g) => {
      const plans = g.plans.slice()
      const slotTypeId = g.station.slotIds[editingSlotIdx]
      plans[editingSlotIdx] = emptyPlanned(slotTypeId)
      return { ...g, plans }
    })
    setEditingSlotIdx(null)
  }

  // Set of director/star ids already booked in OTHER slots this cycle
  const bookedTalent = useMemo(() => {
    if (!game.plans) return new Set()
    const s = new Set()
    game.plans.forEach((p, i) => {
      if (i === editingSlotIdx) return
      if (p.directorId) s.add(p.directorId)
      if (p.starId)     s.add(p.starId)
    })
    return s
  }, [game.plans, editingSlotIdx])

  // Total cost of planned cycle
  const cycleCost = useMemo(() => {
    if (!game.plans) return 0
    return game.plans.reduce((sum, p) => {
      if (!p.categoryId && !p.movieId) return sum
      return sum + programCost(p, game.station, game.research)
    }, 0)
  }, [game.plans, game.station, game.research])

  const filledCount = useMemo(() => {
    if (!game.plans) return 0
    return game.plans.filter((p) => p.categoryId || p.movieId).length
  }, [game.plans])

  // Per-cycle permanent-contract charges (preview)
  const permanentCharge = useMemo(() => {
    if (!game.station) return 0
    const tally = (list) => (list || []).reduce((a, h) => a + (h.permanent ? (h.perCycleCharge || 0) : 0), 0)
    return tally(game.station.hiredDirectors) + tally(game.station.hiredStars)
  }, [game.station])

  // ─── AIR THE CYCLE ────────────────────────────────────────────────────
  const airCycle = () => {
    if (filledCount === 0) return
    if (cycleCost > game.station.cash) return

    const planned = game.plans
      .filter((p) => p.categoryId || p.movieId)
      .map((p) => ({ ...p, id: uid() }))

    const results = runCycle(planned, game.station, game.research, game.cycleIdx)

    setGame((g) => {
      // Tick contracts AFTER airing — they used up one cycle
      const ticked = tickContracts(g.station)
      const stationAfterTick = {
        ...g.station,
        hiredDirectors: ticked.hiredDirectors,
        hiredStars: ticked.hiredStars,
      }

      const newCash = stationAfterTick.cash
        - results.totals.cost
        + results.totals.revenue
        - ticked.perCycleCharge   // charge permanent contracts
      const newFame = Math.max(0, stationAfterTick.fame + results.totals.fameDelta)
      const station = { ...stationAfterTick, cash: newCash, fame: newFame }

      // Track shows eligible for renewal (quality >= 7, not movies)
      const newOwned = [...g.ownedShows]
      results.shows.forEach((sh) => {
        if (sh.movieId) return
        if (sh.quality >= 7) {
          const idx = newOwned.findIndex((o) => o.name === sh.name)
          const rec = {
            id: sh.id,
            name: sh.name,
            categoryId: sh.categoryId,
            topicId: sh.topicId,
            ipId: sh.ipId,
            slotTypeId: sh.slotTypeId,
            lastQuality: sh.quality,
            lastHype: sh.hype,
            lastRating: sh.rating,
            lastSeqSeason: sh.seqSeason || 1,
          }
          if (idx >= 0) newOwned[idx] = rec
          else newOwned.push(rec)
        }
      })

      const logLines = [
        ...g.log,
        `Y${g.year} ${QLABEL[g.cycleIdx]} aired — net ${fmtM(results.totals.net)}, fame ${results.totals.fameDelta >= 0 ? '+' : ''}${results.totals.fameDelta.toFixed(1)}`,
      ]
      if (ticked.perCycleCharge > 0) {
        logLines.push(`💼 Permanent contracts: ${fmtM(-ticked.perCycleCharge)} this cycle`)
      }

      return {
        ...g,
        station,
        lastResults: results,
        yearShows: [...g.yearShows, ...results.shows],
        ownedShows: newOwned,
        phase: 'results',
        log: logLines,
      }
    })
  }

  // ─── ADVANCE ─────────────────────────────────────────────────────────
  const continueAfterResults = () => {
    setGame((g) => {
      const wasQ4 = g.cycleIdx === 3
      if (wasQ4) {
        const awards = buildAwards(g.yearShows, g.station)
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
      // Normal cycle advance — reset plans for next cycle, slot types persist
      return {
        ...g,
        cycleIdx: g.cycleIdx + 1,
        plans: g.station.slotIds.map(id => emptyPlanned(id)),
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
      plans: g.station.slotIds.map(id => emptyPlanned(id)),
      marketRoster: buildMarketRoster(g.station, g.scoutLevel),
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
      const result = applyResearch(g.research, id)
      const research = result.research

      // Mutate station + plans if research adds a slot
      let station = { ...g.station, cash: g.station.cash - item.cost }
      let plans = g.plans
      let log = [...g.log, `🔬 Researched ${item.label}`]

      if (result.addSlotType) {
        // Don't add duplicate slots of the same type (idempotency safety)
        if (!(station.slotIds || []).includes(result.addSlotType)) {
          station = { ...station, slotIds: [...(station.slotIds || []), result.addSlotType] }
          plans = [...plans, emptyPlanned(result.addSlotType)]
          const st = SLOT_TYPES[result.addSlotType]
          log.push(`🆕 New ${st?.label || 'slot'} added to schedule`)
        }
      }

      // Refresh roster if applicable
      let scoutLevel = g.scoutLevel
      let marketRoster = g.marketRoster
      if (result.refreshRoster) {
        scoutLevel += 1
        marketRoster = buildMarketRoster(station, scoutLevel)
        log.push(`🔍 Talent market refreshed`)
      }

      return {
        ...g,
        research,
        station,
        plans,
        scoutLevel,
        marketRoster,
        log,
      }
    })
  }

  // ─── TALENT MANAGEMENT ────────────────────────────────────────────────
  const onHire = (role, talent, contractTypeId) => {
    setGame((g) => {
      const result = hireTalent(g.station, role, talent, contractTypeId)
      if (result.error) {
        return { ...g, log: [...g.log, `⚠ ${result.error}`] }
      }
      // remove from market roster
      const marketRoster = {
        directors: g.marketRoster.directors.filter(d => !(role === 'director' && d.id === talent.id)),
        stars:     g.marketRoster.stars.filter(s => !(role === 'star' && s.id === talent.id)),
      }
      return {
        ...g,
        station: result.station,
        marketRoster,
        log: [...g.log, `✍ Signed ${talent.name} (${contractTypeId}) for ${fmtM(result.charged)}`],
      }
    })
  }

  const onFire = (role, talentId) => {
    setGame((g) => {
      const result = fireTalent(g.station, role, talentId)
      if (result.error) return { ...g, log: [...g.log, `⚠ ${result.error}`] }
      return {
        ...g,
        station: result.station,
        log: [...g.log, `🚪 Fired talent (penalty ${fmtM(result.charged)})`],
      }
    })
  }

  // ─── RENDER ──────────────────────────────────────────────────────────
  if (game.phase === 'setup') {
    return <SetupScreen onStart={startGame} />
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: 40 }}>
      <TopBar game={game} view={view} setView={setView} />

      {game.phase === 'plan' && view === 'plan' && (
        <PlanView
          game={game}
          cycleCost={cycleCost}
          permanentCharge={permanentCharge}
          filledCount={filledCount}
          onOpenSlot={openSlot}
          onAir={airCycle}
        />
      )}

      {game.phase === 'plan' && view === 'talent' && (
        <TalentScreen
          station={game.station}
          marketRoster={game.marketRoster}
          onHire={onHire}
          onFire={onFire}
          onBack={() => setView('plan')}
        />
      )}

      {game.phase === 'plan' && view === 'research' && (
        <ResearchScreen
          research={game.research}
          station={game.station}
          cash={game.station.cash}
          onBuy={buyResearch}
          onBack={() => setView('plan')}
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

      {editingSlotIdx !== null && game.phase === 'plan' && view === 'plan' && (
        <SlotEditor
          initial={game.plans[editingSlotIdx]}
          slotTypeId={game.station.slotIds[editingSlotIdx]}
          cycleIdx={game.cycleIdx}
          station={game.station}
          research={game.research}
          roster={activeRoster(game.station)}
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
function TopBar({ game, view, setView }) {
  const m = MARKETS[game.station.market]
  const isInPlanFlow = game.phase === 'plan'
  return (
    <div
      style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          display: 'flex', gap: 14, padding: '14px 18px',
          flexWrap: 'wrap', alignItems: 'center',
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
      {isInPlanFlow && (
        <div style={{
          display: 'flex', gap: 4, padding: '0 12px',
          borderTop: `1px solid ${T.border}`,
        }}>
          <NavTab label="Programming" active={view === 'plan'} onClick={() => setView('plan')} />
          <NavTab
            label={`Talent (${(game.station.hiredDirectors?.length || 0) + (game.station.hiredStars?.length || 0)})`}
            active={view === 'talent'} onClick={() => setView('talent')} />
          <NavTab label="Research" active={view === 'research'} onClick={() => setView('research')} />
        </div>
      )}
    </div>
  )
}

function NavTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: active ? T.accent : T.muted,
        fontFamily: 'Bebas Neue',
        fontSize: 14,
        letterSpacing: '.1em',
        padding: '10px 14px',
        cursor: 'pointer',
        borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
        marginBottom: -1,
      }}
    >
      {label}
    </button>
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
function PlanView({ game, cycleCost, permanentCharge, filledCount, onOpenSlot, onAir }) {
  const totalCost = cycleCost + permanentCharge
  const canAir = filledCount > 0 && totalCost <= game.station.cash
  const m = MARKETS[game.station.market]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 18 }}>
      <SectionTitle>Programming Slate · {QLABEL[game.cycleIdx]} Year {game.year}</SectionTitle>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
      }}>
        {game.plans.map((p, i) => {
          const slotTypeId = game.station.slotIds[i]
          return (
            <SlotCard
              key={i}
              plan={p}
              idx={i}
              slotTypeId={slotTypeId}
              cycleIdx={game.cycleIdx}
              station={game.station}
              research={game.research}
              onClick={() => onOpenSlot(i)}
            />
          )
        })}
      </div>

      <div style={{
        marginTop: 24, padding: 16,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5 }}>CYCLE COST</div>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 22,
              color: totalCost > game.station.cash ? T.red : T.text,
            }}>
              {fmtM(totalCost)}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {filledCount} of {game.plans.length} slots planned
              {permanentCharge > 0 && ` · ${fmtM(permanentCharge)} contracts`}
            </div>
          </div>
          <button
            className={`cta ${canAir ? 'green' : 'danger'}`}
            disabled={!canAir}
            onClick={onAir}
            style={{ minWidth: 180 }}
          >▶ AIR THE CYCLE</button>
        </div>
        {totalCost > game.station.cash && (
          <div style={{ marginTop: 10, fontSize: 11, color: T.red }}>
            Not enough cash — trim a slot or pick cheaper marketing.
          </div>
        )}
        {filledCount === 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
            Plan at least one program to air the cycle.
          </div>
        )}
      </div>

      <ActivityLog log={game.log} />

      <div style={{
        marginTop: 18, padding: 14,
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 8, fontSize: 11, color: T.muted, lineHeight: 1.6,
      }}>
        <div style={{ color: T.text, fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
          {m.label}
        </div>
        Audience cap: {(m.audCap).toFixed(1)}M · Rev / viewer: ${m.revPerViewer.toFixed(2)} · Marketing reach: {m.marketingMult.toFixed(1)}×
        {canPromote(game.station) && (
          <div style={{ marginTop: 8, color: T.gold }}>
            Eligible to expand at year-end.
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityLog({ log }) {
  const tail = log.slice(-6).reverse()
  return (
    <div style={{
      marginTop: 18, padding: 14,
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
    }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.muted, marginBottom: 8 }}>ACTIVITY</div>
      {tail.map((line, i) => (
        <div key={i} style={{
          fontFamily: 'DM Mono', fontSize: 11,
          color: i === 0 ? T.text : T.muted, padding: '3px 0',
        }}>
          {line}
        </div>
      ))}
    </div>
  )
}

// ─── END ─────────────────────────────────────────────────────────────────

