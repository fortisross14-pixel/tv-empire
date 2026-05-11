import React, { useState, useMemo } from 'react'
import { T } from './theme'
import {
  MARKETS, RESEARCH, MOVIES, SLOT_TYPES, MONTHS,
  SPORTS_LEAGUES, IPS, IPS as IPS_FOR_NAMES,
} from './constants'
import {
  initGame,
  emptyPlanned,
  programCost,
  planToRun,
  runMonth,
  finalizeMonthForRuns,
  assignAudiences,
  cancelRunCost,
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
  sportsLicenseCost,
  ownsLicense,
  findLeague,
  initCompetitors,
  simulateCompetitorMonth,
  applyCompetitorMonth,
  rolloverCompetitorYear,
  // 4d/4e
  beginResearch,
  tickResearch,
  researchAdjusted,
  staffSalaryTotal,
  tickStaffSearches,
  openStaffPosition,
  cancelStaffPosition,
  hireStaffCandidate,
  fireStaffMember,
  buyIPLicense,
  activeIPLicenses,
  launchNetworkCampaign,
} from './engine'

import { SetupScreen } from './components/SetupScreen'
import { SlotCard } from './components/SlotCard'
import { SlotEditor } from './components/SlotEditor'
import { ResultsView } from './components/ResultsView'
import { AwardsView } from './components/AwardsView'
import { ResearchScreen } from './components/ResearchScreen'
import { OperationsScreen } from './components/OperationsScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { ThisYearScreen } from './components/ThisYearScreen'
import { MarketScreen } from './components/MarketScreen'
import { SectionTitle } from './components/ui'

// ─── AUTO-SAVE ──────────────────────────────────────────────────────────
const SAVE_KEY = 'tv-empire-save-v1'

function saveGame(game) {
  try {
    if (!game || game.phase === 'setup') return
    localStorage.setItem(SAVE_KEY, JSON.stringify(game))
  } catch (e) { /* localStorage full or unavailable */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) { return null }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY) } catch (e) { /* noop */ }
}

export default function App() {
  const [game, setGame] = useState(() => {
    const saved = loadGame()
    return saved || { phase: 'setup' }
  })
  const [editingSlotIdx, setEditingSlotIdx] = useState(null)
  const [view, setView] = useState('plan')

  // Auto-save on every game state change
  React.useEffect(() => {
    saveGame(game)
  }, [game])

  // ─── SETUP ───────────────────────────────────────────────────────────
  const startGame = (setup) => {
    setGame(initGame(setup))
    setView('plan')
  }

  // ─── SLOT EDITING ────────────────────────────────────────────────────
  // For each slot index in station.slotIds:
  //   - if there's an active run for it → show run card
  //   - else → empty plan; clicking opens editor
  const openSlot = (i) => setEditingSlotIdx(i)
  const closeSlot = () => setEditingSlotIdx(null)

  const saveSlot = (draft) => {
    // Convert draft to a run, push into runs[]
    setGame((g) => {
      const run = planToRun(draft, g.station, g.research)
      const plans = g.plans.slice()
      const slotTypeId = g.station.slotIds[editingSlotIdx]
      plans[editingSlotIdx] = emptyPlanned(slotTypeId)  // clear the planning slot
      return {
        ...g,
        runs: [...g.runs, run],
        plans,
        log: [...g.log, `▶ ${run.name || 'New program'} → ${slotTypeId} (${run.runMonths} mo)`],
      }
    })
    setEditingSlotIdx(null)
  }

  const clearSlot = () => {
    setEditingSlotIdx(null)
  }

  const cancelRun = (runId) => {
    setGame((g) => {
      const run = g.runs.find(r => r.id === runId)
      if (!run) return g
      const penalty = cancelRunCost(run)
      const runs = g.runs.filter(r => r.id !== runId)
      return {
        ...g,
        runs,
        station: { ...g.station, cash: g.station.cash - penalty },
        log: [...g.log, `❌ Cancelled "${run.name || 'program'}" — penalty ${fmtM(-penalty)}`],
      }
    })
  }

  // Helper: which slot index does a given run occupy?
  const slotIndexForRun = (run) => game.station.slotIds.indexOf(run.slotTypeId)

  // Map slotIdx → run (or null)
  const runsBySlot = useMemo(() => {
    if (!game.runs || !game.station) return {}
    const m = {}
    game.runs.forEach(r => {
      // first slot of matching type that doesn't already have a run mapped
      const candidates = (game.station.slotIds || []).map((s, i) => ({ s, i })).filter(x => x.s === r.slotTypeId)
      for (const c of candidates) {
        if (!m[c.i]) { m[c.i] = r; break }
      }
    })
    return m
  }, [game.runs, game.station])

  // Talents currently bound to active runs (so SlotEditor knows they're taken)
  const bookedTalent = useMemo(() => {
    const s = new Set()
    if (!game.runs) return s
    game.runs.forEach(r => {
      if (r.directorId) s.add(r.directorId)
      if (r.starId)     s.add(r.starId)
    })
    return s
  }, [game.runs])

  // Next-month preview cost
  const nextMonthCost = useMemo(() => {
    if (!game.runs) return 0
    return game.runs.reduce((sum, r) => {
      if (r.monthsAired >= r.runMonths) return sum
      // Sports skip if out of season
      if (r.sportsRunLeagueId) {
        const lg = findLeague(r.sportsRunLeagueId)
        if (!lg?.season.includes(game.monthIdx)) return sum
      }
      return sum + (r.monthlyCost || 0)
    }, 0)
  }, [game.runs, game.monthIdx])

  // Permanent contract per-month total + staff salaries
  const permanentCharge = useMemo(() => {
    if (!game.station) return 0
    const tally = (list) => (list || []).reduce((a, h) => a + (h.permanent ? (h.perMonthCharge || 0) : 0), 0)
    const talentMonthly = tally(game.station.hiredDirectors) + tally(game.station.hiredStars)
    const staffMonthly = staffSalaryTotal(game.station)
    return talentMonthly + staffMonthly
  }, [game.station])

  // ─── ADVANCE MONTH ────────────────────────────────────────────────────
  const advanceMonth = () => {
    if (nextMonthCost + permanentCharge > game.station.cash) return

    setGame((g) => {
      // ── Phase 1: produce airings (no audience yet) ───────────────────
      const result = runMonth(g.station, g.research, g.runs, g.monthIdx, g.year)

      // Shallow-clone competitors so we don't mutate the source array's objects
      const competitors = (g.competitors || []).map(c => ({ ...c, activeRuns: c.activeRuns.map(r => ({ ...r })) }))
      const market = MARKETS[g.station.market]

      const competitorAiringsThisMonth = []
      competitors.forEach(c => {
        const airings = simulateCompetitorMonth(c, g.monthIdx, g.year)
        airings.forEach(a => competitorAiringsThisMonth.push({ ...a, id: uid() }))
      })

      // ── Phase 2: combine all airings + assign audience demographically
      const playerAirings = result.airings.map(a => ({ ...a, id: uid() }))
      const allAirings = [...playerAirings, ...competitorAiringsThisMonth]
      const fameMap = { __player__: g.station.fame }
      competitors.forEach(c => { fameMap[c.id] = c.fame })
      assignAudiences(allAirings, market, fameMap, g.monthIdx)

      // ── Phase 3: aggregate player totals from filled-in airings ──────
      let playerCost = result.totalProductionCost
      let playerRev = 0
      let playerAud = 0
      playerAirings.forEach(a => {
        a.net = r1((a.revenue || 0) - (a.cost || 0))
        playerRev += a.revenue || 0
        playerAud += a.audience || 0
      })

      // Finalize player run histories
      finalizeMonthForRuns(g.runs, g.monthIdx, g.year)

      // Apply competitor month results (fame, cash, year audience)
      competitors.forEach(c => {
        const compAirings = competitorAiringsThisMonth.filter(a => a.stationId === c.id)
        applyCompetitorMonth(c, compAirings, market)
      })

      const logLines = [...g.log]

      // ── Phase 4: contracts, fame, cash, staff, research, campaigns ──
      const ticked = tickContracts(g.station)
      const remainingRuns = g.runs.filter(r => !result.expiredRunIds.includes(r.id))

      // Tick research-in-progress (returns { research, completed[] })
      let researchState = { ...g.research, inProgress: [...(g.research.inProgress || [])] }
      const tickRes = tickResearch(researchState)
      researchState = tickRes.research
      const researchFinished = tickRes.completed
      // Auto-apply each finished research
      let newPlans = g.plans
      let stationAfterResearch = { ...g.station }
      let scoutLevel = g.scoutLevel
      let marketRoster = g.marketRoster
      for (const rid of researchFinished) {
        const r = applyResearch(researchState, rid)
        researchState = r.research
        if (r.addSlotType && !(stationAfterResearch.slotIds || []).includes(r.addSlotType)) {
          stationAfterResearch = {
            ...stationAfterResearch,
            slotIds: [...stationAfterResearch.slotIds, r.addSlotType],
          }
          newPlans = [...newPlans, emptyPlanned(r.addSlotType)]
        }
        if (r.refreshRoster) {
          scoutLevel += 1
          marketRoster = buildMarketRoster(stationAfterResearch, scoutLevel)
        }
        logLines.push(`✅ Research complete: ${RESEARCH.find(x=>x.id===rid)?.label || rid}`)
      }

      // Tick staff searches (any positions finishing this month produce candidates)
      const tickedStaff = tickStaffSearches({ ...stationAfterResearch, openPositions: [...(stationAfterResearch.openPositions || [])] })
      const stationAfterStaff = tickedStaff.station
      const newPendingHires = [
        ...(g.pendingHires || []),
        ...tickedStaff.resolvedPositions.map(rp => ({
          ...rp,
          resolvedYear: g.year,
          resolvedMonth: g.monthIdx,
        }))
      ]
      tickedStaff.resolvedPositions.forEach(p => {
        logLines.push(`🔍 Search complete: ${p.role} candidates ready — go pick one in Operations → Staff`)
      })

      // Build owned-shows from expired runs (≥7 avg)
      const newOwned = [...g.ownedShows]
      result.expiredRunIds.forEach(rid => {
        const run = g.runs.find(r => r.id === rid)
        if (!run || run.movieId || run.sportsRunLeagueId) return
        const ratings = run.aiHistory.map(h => h.rating)
        if (ratings.length === 0) return
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
        if (avgRating >= 7) {
          const idx = newOwned.findIndex(o => o.name === run.name)
          const rec = {
            id: rid, name: run.name,
            categoryId: run.categoryId, topicId: run.topicId, ipId: run.ipId,
            slotTypeId: run.slotTypeId,
            lastDirectorId: run.directorId, lastStarId: run.starId,
            lastSeqSeason: run.seqSeason || 1, lastAvgRating: avgRating,
          }
          if (idx >= 0) newOwned[idx] = rec
          else newOwned.push(rec)
        }
      })

      // Staff salary deduction
      const salaryThisMonth = staffSalaryTotal(stationAfterStaff)

      const newCash = g.station.cash - playerCost + playerRev - ticked.perMonthCharge - salaryThisMonth
      const newFame = Math.max(0, g.station.fame + result.fameDeltaFromRatings)

      if (salaryThisMonth > 0) {
        logLines.push(`👥 Staff salaries: ${fmtM(-salaryThisMonth)}`)
      }

      const station = {
        ...stationAfterStaff,
        cash: r1(newCash),
        fame: r2(newFame),
        hiredDirectors: ticked.hiredDirectors,
        hiredStars: ticked.hiredStars,
        activeCampaign: null,  // campaigns last only the month they're launched
      }

      const monthLabel = MONTHS[g.monthIdx]
      if (playerAirings.length === 0) {
        logLines.push(`📅 ${monthLabel} Y${g.year} — no programming. Free runtime burned.`)
      } else {
        logLines.push(`📅 ${monthLabel} Y${g.year}: ${playerAirings.length} shows, ${playerAud.toFixed(1)}M aud, net ${fmtM(playerRev - playerCost)}`)
      }
      if (ticked.perMonthCharge > 0) {
        logLines.push(`💼 Permanent contracts: ${fmtM(-ticked.perMonthCharge)}`)
      }
      if (result.expiredRunIds.length > 0) {
        logLines.push(`🎬 ${result.expiredRunIds.length} program${result.expiredRunIds.length > 1 ? 's' : ''} finished`)
      }

      const nextMonth = g.monthIdx + 1
      const isYearEnd = nextMonth >= 12

      // Synthetic "result" object for ResultsView compatibility
      const lastMonthResult = {
        airings: playerAirings,
        totals: {
          cost: r1(playerCost),
          revenue: r1(playerRev),
          audience: r1(playerAud),
          net: r1(playerRev - playerCost),
          fameDelta: result.fameDeltaFromRatings,
        },
      }

      if (isYearEnd) {
        const allYearShows = [...g.yearShows, ...playerAirings]
        const awards = buildAwards(allYearShows, station)
        let cash = station.cash
        let fame = station.fame
        awards.wins.forEach(w => { cash += w.cashBonus; fame += w.fameBonus })
        if (awards.bestOverall) { cash += awards.bestOverall.cashBonus; fame += awards.bestOverall.fameBonus }
        if (awards.mostWatched) { cash += awards.mostWatched.cashBonus; fame += awards.mostWatched.fameBonus }
        competitors.forEach(c => rolloverCompetitorYear(c, g.year))

        return {
          ...g,
          station: { ...station, cash: r1(cash), fame: r2(fame) },
          runs: remainingRuns,
          plans: newPlans,
          research: researchState,
          pendingHires: newPendingHires,
          scoutLevel,
          marketRoster,
          yearShows: allYearShows,
          allShows: [...(g.allShows || []), ...playerAirings],
          competitorAllShows: [...(g.competitorAllShows || []), ...competitorAiringsThisMonth],
          competitors,
          ownedShows: newOwned,
          lastMonthResult,
          awards,
          phase: 'awards',
          log: logLines,
        }
      }

      return {
        ...g,
        station,
        runs: remainingRuns,
        plans: newPlans,
        research: researchState,
        pendingHires: newPendingHires,
        scoutLevel,
        marketRoster,
        monthIdx: nextMonth,
        yearShows: [...g.yearShows, ...playerAirings],
        allShows: [...(g.allShows || []), ...playerAirings],
        competitorAllShows: [...(g.competitorAllShows || []), ...competitorAiringsThisMonth],
        competitors,
        ownedShows: newOwned,
        lastMonthResult,
        phase: playerAirings.length > 0 ? 'results' : 'plan',
        log: logLines,
      }
    })
  }

  const continueAfterResults = () => {
    setGame((g) => ({ ...g, phase: 'plan', lastMonthResult: null }))
  }

  const newYear = () => {
    setGame((g) => ({
      ...g,
      year: g.year + 1,
      monthIdx: 0,
      yearShows: [],
      marketRoster: buildMarketRoster(g.station, g.scoutLevel),
      // Sports licenses: previous year's all expire — clear
      station: { ...g.station, sportsLicenses: [] },
      awards: null,
      lastMonthResult: null,
      phase: 'plan',
      log: [...g.log, `🎬 Year ${g.year + 1} — new year, sports rights expired`],
    }))
  }

  const promoteMarket = () => {
    setGame((g) => {
      if (!canPromote(g.station)) return g
      const next = promotedMarket(g.station)
      return {
        ...g,
        station: { ...g.station, market: next, cash: g.station.cash + 25 },
        competitors: initCompetitors(next),
        log: [...g.log, `🚀 Expanded to ${MARKETS[next].label}! New competitors: ${initCompetitors(next).map(c=>c.name).join(', ')}`],
      }
    })
  }

  // ─── RESEARCH ────────────────────────────────────────────────────────
  const startResearch = (id) => {
    setGame((g) => {
      const result = beginResearch(id, g.station, g.research, g.year, g.monthIdx)
      if (result.error) return { ...g, log: [...g.log, `⚠ Research: ${result.error}`] }
      const adj = researchAdjusted(id, g.station, g.research)
      return {
        ...g,
        station: result.station,
        research: result.research,
        log: [...g.log, `🔬 Began research: ${RESEARCH.find(r=>r.id===id)?.label} (${adj.months} mo, ${fmtM(adj.cost)})`],
      }
    })
  }

  // ─── SPORTS LICENSES ──────────────────────────────────────────────────
  const buySportsLicense = (leagueId) => {
    const cost = sportsLicenseCost(leagueId, game.station.market)
    if (game.station.cash < cost) return
    if (ownsLicense(game.station, leagueId, game.year)) return
    setGame((g) => {
      const lg = findLeague(leagueId)
      return {
        ...g,
        station: {
          ...g.station,
          cash: g.station.cash - cost,
          sportsLicenses: [...(g.station.sportsLicenses || []), { leagueId, year: g.year }],
        },
        log: [...g.log, `🏆 Acquired ${lg.label} rights for Y${g.year} (${fmtM(-cost)})`],
      }
    })
  }

  // ─── TALENT ──────────────────────────────────────────────────────────
  const onHire = (role, talent, contractTypeId) => {
    setGame((g) => {
      const result = hireTalent(g.station, role, talent, contractTypeId)
      if (result.error) return { ...g, log: [...g.log, `⚠ ${result.error}`] }
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

  // ─── STAFF ──────────────────────────────────────────────────────────
  const onOpenPosition = (role, tierId) => {
    setGame((g) => {
      const result = openStaffPosition(g.station, role, tierId)
      if (result.error) return { ...g, log: [...g.log, `⚠ ${result.error}`] }
      const tierCost = result.station.openPositions.find(p => p.role === role)?.cost || 0
      return {
        ...g,
        station: result.station,
        log: [...g.log, `📋 Opened ${role} position (${tierId} search, ${fmtM(tierCost)})`],
      }
    })
  }

  const onCancelPosition = (role) => {
    setGame((g) => {
      const result = cancelStaffPosition(g.station, role)
      if (result.error) return { ...g, log: [...g.log, `⚠ ${result.error}`] }
      return {
        ...g,
        station: result.station,
        log: [...g.log, `❌ Cancelled ${role} search (refund ${fmtM(result.refund)})`],
      }
    })
  }

  const onPickCandidate = (role, candidate) => {
    setGame((g) => {
      // hireStaffCandidate returns the updated station directly, not wrapped
      const newStation = hireStaffCandidate(g.station, role, candidate, g.year, g.monthIdx)
      const pendingHires = (g.pendingHires || []).filter(p => p.role !== role)
      return {
        ...g,
        station: newStation,
        pendingHires,
        log: [...g.log, `🤝 Hired ${candidate.name} as ${role} director (${candidate.tier})`],
      }
    })
  }

  const onFireStaff = (role) => {
    setGame((g) => {
      const result = fireStaffMember(g.station, role)
      return {
        ...g,
        station: result.station,
        log: [...g.log, `🚪 Fired ${role} director (severance ${fmtM(result.penalty)})`],
      }
    })
  }

  // ─── IP RIGHTS ──────────────────────────────────────────────────────
  const onBuyIP = (ipId, termId) => {
    setGame((g) => {
      const result = buyIPLicense(g.station, ipId, termId, g.year, g.research)
      if (result.error) return { ...g, log: [...g.log, `⚠ IP: ${result.error}`] }
      const ipObj = IPS_FOR_NAMES.find(i => i.id === ipId)
      return {
        ...g,
        station: result.station,
        log: [...g.log, `📜 Licensed ${ipObj?.name || ipId} (${termId.replace('y','-year')}, ${fmtM(result.cost)})`],
      }
    })
  }

  // ─── NETWORK CAMPAIGNS ──────────────────────────────────────────────
  const onLaunchCampaign = (campaignId) => {
    setGame((g) => {
      const result = launchNetworkCampaign(g.station, campaignId, g.research)
      if (result.error) return { ...g, log: [...g.log, `⚠ Campaign: ${result.error}`] }
      return {
        ...g,
        station: result.station,
        log: [...g.log, `📣 Network campaign launched: ${result.label}`],
      }
    })
  }

  // ─── RENDER ──────────────────────────────────────────────────────────
  if (game.phase === 'setup') {
    return <SetupScreen onStart={startGame} />
  }

  const cashBlocker = nextMonthCost + permanentCharge > game.station.cash

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: 40 }}>
      <TopBar game={game} view={view} setView={setView} />

      {game.phase === 'plan' && view === 'plan' && (
        <PlanView
          game={game}
          runsBySlot={runsBySlot}
          nextMonthCost={nextMonthCost}
          permanentCharge={permanentCharge}
          cashBlocker={cashBlocker}
          onOpenSlot={openSlot}
          onCancelRun={cancelRun}
          onAdvanceMonth={advanceMonth}
          onBuySportsLicense={buySportsLicense}
        />
      )}

      {game.phase === 'plan' && view === 'operations' && (
        <OperationsScreen
          station={game.station}
          marketRoster={game.marketRoster}
          research={game.research}
          year={game.year}
          pendingHires={game.pendingHires || []}
          onHire={onHire}
          onFire={onFire}
          onOpenPosition={onOpenPosition}
          onCancelPosition={onCancelPosition}
          onPickCandidate={onPickCandidate}
          onFireStaff={onFireStaff}
          onBuyIP={onBuyIP}
          onBuySportsLicense={buySportsLicense}
          onLaunchCampaign={onLaunchCampaign}
          onBack={() => setView('plan')}
        />
      )}

      {game.phase === 'plan' && view === 'research' && (
        <ResearchScreen
          research={game.research}
          station={game.station}
          cash={game.station.cash}
          onBuy={startResearch}
          onBack={() => setView('plan')}
        />
      )}

      {game.phase === 'plan' && view === 'thisyear' && (
        <ThisYearScreen
          yearShows={game.yearShows || []}
          year={game.year}
          onBack={() => setView('plan')}
        />
      )}

      {game.phase === 'plan' && view === 'history' && (
        <HistoryScreen
          stationName={game.station.name}
          allShows={game.allShows || []}
          competitorAllShows={game.competitorAllShows || []}
          onBack={() => setView('plan')}
        />
      )}

      {game.phase === 'plan' && view === 'market' && (
        <MarketScreen
          station={game.station}
          competitors={game.competitors || []}
          year={game.year}
          onBack={() => setView('plan')}
        />
      )}

      {game.phase === 'results' && (
        <ResultsView
          results={game.lastMonthResult}
          station={game.station}
          cycleLabel={`${MONTHS[(game.monthIdx - 1 + 12) % 12]} Y${game.year}`}
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
          cycleIdx={game.monthIdx}
          station={game.station}
          research={game.research}
          roster={activeRoster(game.station)}
          movies={MOVIES}
          takenTalent={bookedTalent}
          ownedShows={game.ownedShows}
          year={game.year}
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
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
      <div style={{
        display: 'flex', gap: 14, padding: '14px 18px',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 1, lineHeight: 1 }}>
            {game.station.name}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
            {m.label} · {fameLabel(game.station.fame)}
          </div>
        </div>
        <Stat label="DATE"  value={`${MONTHS[game.monthIdx]} Y${game.year}`} />
        <Stat label="FAME" value={game.station.fame.toFixed(1)} accent={T.gold} />
        <Stat label="CASH" value={fmtM(game.station.cash)} accent={T.green} />
      </div>
      {isInPlanFlow && (
        <div style={{ display: 'flex', gap: 4, padding: '0 12px', borderTop: `1px solid ${T.border}`, overflowX: 'auto' }}>
          <NavTab label="Programming" active={view === 'plan'} onClick={() => setView('plan')} />
          <NavTab
            label="Operations"
            active={view === 'operations'} onClick={() => setView('operations')} />
          <NavTab label="Research" active={view === 'research'} onClick={() => setView('research')} />
          <NavTab label="This Year" active={view === 'thisyear'} onClick={() => setView('thisyear')} />
          <NavTab label="History" active={view === 'history'} onClick={() => setView('history')} />
          <NavTab label="Market" active={view === 'market'} onClick={() => setView('market')} />
        </div>
      )}
    </div>
  )
}

function NavTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 'none',
      color: active ? T.accent : T.muted,
      fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '.1em',
      padding: '10px 14px', cursor: 'pointer',
      borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
      marginBottom: -1,
    }}>{label}</button>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ minWidth: 80 }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: T.muted }}>{label}</div>
      <div style={{
        fontFamily: 'DM Mono', fontSize: 16, fontWeight: 600,
        color: accent || T.text, marginTop: 2,
      }}>{value}</div>
    </div>
  )
}

// ─── PLAN VIEW ──────────────────────────────────────────────────────────
function PlanView({
  game, runsBySlot, nextMonthCost, permanentCharge, cashBlocker,
  onOpenSlot, onCancelRun, onAdvanceMonth, onBuySportsLicense,
}) {
  const totalCost = nextMonthCost + permanentCharge

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 18 }}>
      <SectionTitle>
        {MONTHS[game.monthIdx]} · Year {game.year}
      </SectionTitle>

      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Fill empty slots with programs (1, 3, 6, or 12-month commitments) or sports rights.
        Active programs auto-air each month. Advance the month when ready.
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {game.station.slotIds.map((slotTypeId, i) => {
          const run = runsBySlot[i]
          return (
            <SlotCard
              key={i}
              plan={run || game.plans[i]}
              run={run}
              idx={i}
              slotTypeId={slotTypeId}
              cycleIdx={game.monthIdx}
              station={game.station}
              research={game.research}
              onClick={() => !run && onOpenSlot(i)}
              onCancel={run ? () => onCancelRun(run.id) : null}
            />
          )
        })}
      </div>

      {/* Sports Rights Panel */}
      <SportsRightsPanel
        station={game.station}
        year={game.year}
        onBuy={onBuySportsLicense}
      />

      {/* Advance Month bar */}
      <div style={{
        marginTop: 22, padding: 16,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5 }}>NEXT MONTH</div>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 22,
              color: cashBlocker ? T.red : T.text,
            }}>{fmtM(totalCost)}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {game.runs.length} active program{game.runs.length === 1 ? '' : 's'}
              {permanentCharge > 0 && ` · ${fmtM(permanentCharge)} contracts`}
            </div>
          </div>
          <button
            className={`cta ${cashBlocker ? 'danger' : 'green'}`}
            disabled={cashBlocker}
            onClick={onAdvanceMonth}
            style={{ minWidth: 180 }}
          >▶ ADVANCE TO {MONTHS[(game.monthIdx + 1) % 12].toUpperCase()}</button>
        </div>
        {cashBlocker && (
          <div style={{ marginTop: 10, fontSize: 11, color: T.red }}>
            Not enough cash to advance — cancel a run, fire someone, or check finances.
          </div>
        )}
      </div>

      <ActivityLog log={game.log} />

      <div style={{
        marginTop: 16, padding: '10px 14px',
        fontSize: 10, color: T.muted, textAlign: 'center',
      }}>
        💾 Auto-saved.{' '}
        <button
          onClick={() => {
            if (window.confirm('Reset the game and start a new station? Current save will be deleted.')) {
              clearSave()
              window.location.reload()
            }
          }}
          style={{
            background: 'transparent', border: 'none',
            color: T.muted, textDecoration: 'underline',
            cursor: 'pointer', fontSize: 10,
          }}
        >Reset game</button>
      </div>
    </div>
  )
}

// ─── SPORTS RIGHTS PANEL ────────────────────────────────────────────────
function SportsRightsPanel({ station, year, onBuy }) {
  const owned = (station.sportsLicenses || []).filter(l => l.year === year)
  const ownedIds = new Set(owned.map(l => l.leagueId))
  const market = station.market

  return (
    <div style={{
      marginTop: 22, padding: 16,
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
    }}>
      <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, marginBottom: 8 }}>
        SPORTS RIGHTS · YEAR {year}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
        Buy a full year of rights, then assign them to a slot. Each league runs only during its real season — and gets a big bump on its peak month.
      </div>

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
              borderRadius: 5, padding: 9,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isOwned ? T.green : T.text }}>
                {lg.icon} {lg.label} {isOwned && '✓'}
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3, lineHeight: 1.4 }}>
                Season: {lg.season.length} mo · Peak: {MONTHS[lg.peakMonth]} ({lg.peakLabel})
              </div>
              {!isOwned && (
                <button
                  onClick={() => onBuy(lg.id)}
                  disabled={!affordable}
                  style={{
                    width: '100%', marginTop: 6, padding: '5px 8px',
                    background: affordable ? T.accent : T.border,
                    color: affordable ? T.bg : T.muted,
                    border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    cursor: affordable ? 'pointer' : 'not-allowed',
                  }}
                >${cost.toFixed(0)}M · BUY</button>
              )}
              {isOwned && (
                <div style={{ marginTop: 6, fontSize: 10, color: T.green, fontStyle: 'italic' }}>
                  Owned · Use in slot editor
                </div>
              )}
            </div>
          )
        })}
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
        }}>{line}</div>
      ))}
    </div>
  )
}
