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
  // 5a — writers + scripts
  hireWriter,
  fireWriter,
  writerSalaryTotal,
  beginScript,
  refreshScript,
  archiveScript,
  deleteArchivedScript,
  tickScripts,
  // 5b — programs
  beginProgram,
  tickPrograms,
  scheduleProgram,
  cancelProgram,
  estimateProgramQH,
  programBuildCost,
  productionMethodFor,
  productionMonthsFor,
  updateProgramFromAiring,
  finishProgram,
  r1,
  r2,
} from './engine'

import { SetupScreen } from './components/SetupScreen'
import { SlotCard } from './components/SlotCard'
import { SlotScheduler } from './components/SlotScheduler'
import { ResultsView } from './components/ResultsView'
import { AwardsView } from './components/AwardsView'
import { ResearchScreen } from './components/ResearchScreen'
import { OperationsScreen } from './components/OperationsScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { ThisYearScreen } from './components/ThisYearScreen'
import { MarketScreen } from './components/MarketScreen'
import { ContentScreen } from './components/ContentScreen'
import { ReviewModal } from './components/ReviewModal'
import { SectionTitle } from './components/ui'

// ─── AUTO-SAVE ──────────────────────────────────────────────────────────
const SAVE_KEY = 'tv-empire-save-v5'

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
    const g = JSON.parse(raw)
    // Validate required fields — if any missing, treat save as invalid
    if (!g || !g.station || !g.research) return null
    if (!Array.isArray(g.runs)) return null
    if (!Array.isArray(g.competitors)) return null
    if (typeof g.monthIdx !== 'number' || typeof g.year !== 'number') return null
    // Stage (b) station fields all present in fresh init — defensive defaults only
    if (!g.station.staff) g.station.staff = { personnel: null, innovation: null, operations: null, marketing: null, content: null }
    if (!g.station.openPositions) g.station.openPositions = []
    if (!g.station.ipLicenses) g.station.ipLicenses = []
    if (!g.station.sportsLicenses) g.station.sportsLicenses = []
    if (!g.station.hiredWriters) g.station.hiredWriters = []
    if (!g.station.scripts) g.station.scripts = []
    if (!g.station.programs) g.station.programs = []
    if (!g.research.inProgress) g.research.inProgress = []
    if (!g.pendingHires) g.pendingHires = []
    if (!g.pendingReviews) g.pendingReviews = []
    if (!g.ownedShows) g.ownedShows = []
    if (!g.allShows) g.allShows = []
    if (!g.competitorAllShows) g.competitorAllShows = []
    return g
  } catch (e) { return null }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY) } catch (e) { /* noop */ }
}

// ─── ERROR BOUNDARY ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('Crash:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24, color: T.text, background: T.bg,
          fontFamily: 'system-ui, sans-serif', minHeight: '100vh',
        }}>
          <h2 style={{ color: T.red, marginBottom: 12 }}>Something broke 😢</h2>
          <div style={{ marginBottom: 12, fontSize: 14 }}>
            Your save may be out of date from an earlier version.
          </div>
          <pre style={{
            fontSize: 11, background: T.surface, padding: 12, borderRadius: 6,
            color: T.muted, overflow: 'auto', whiteSpace: 'pre-wrap',
            marginBottom: 16,
          }}>{String(this.state.error?.stack || this.state.error)}</pre>
          <button
            onClick={() => { clearSave(); window.location.reload() }}
            style={{
              padding: '10px 16px', background: T.accent, color: T.bg,
              border: 'none', borderRadius: 5, fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >Reset save and reload</button>
        </div>
      )
    }
    return this.props.children
  }
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
  const openSlot = (i) => setEditingSlotIdx(i)
  const closeSlot = () => setEditingSlotIdx(null)

  // Cancel a scheduled run. If the run has a programId, flip the program back to shelf.
  // Cancellation penalty = cancelRunCost (50% of remaining airing cost).
  const cancelRun = (runId) => {
    setGame((g) => {
      const run = g.runs.find(r => r.id === runId)
      if (!run) return g
      const penalty = cancelRunCost(run)
      const runs = g.runs.filter(r => r.id !== runId)
      let programs = g.station.programs || []
      if (run.programId) {
        programs = programs.map(p => p.id === run.programId ? { ...p, status: 'shelf' } : p)
      }
      return {
        ...g,
        runs,
        station: { ...g.station, cash: g.station.cash - penalty, programs },
        log: [...g.log, `❌ Cancelled "${run.name || 'program'}" — penalty ${fmtM(-penalty)}${run.programId ? ' (program returned to shelf)' : ''}`],
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

  // Permanent contract per-month total + staff salaries + writer salaries
  const permanentCharge = useMemo(() => {
    if (!game.station) return 0
    const tally = (list) => (list || []).reduce((a, h) => a + (h.permanent ? (h.perMonthCharge || 0) : 0), 0)
    const talentMonthly = tally(game.station.hiredDirectors) + tally(game.station.hiredStars)
    const writerMonthly = writerSalaryTotal(game.station)
    const staffMonthly = staffSalaryTotal(game.station)
    return talentMonthly + writerMonthly + staffMonthly
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

      // Tick scripts (drafts decrement; finished ones become 'ready' with rolled hype/quality)
      const tickedScripts = tickScripts(stationAfterStaff)
      const completedScripts = tickedScripts.completed
      completedScripts.forEach(s => {
        logLines.push(`✍ Script ready: "${s.name}" (hype ${Math.round(s.hype)})`)
      })

      // Tick programs in production (drafts → shelf when done)
      const stationForProgTick = { ...stationAfterStaff, programs: stationAfterStaff.programs || [] }
      const tickedProgs = tickPrograms(stationForProgTick)
      const finishedProgs = tickedProgs.finished
      finishedProgs.forEach(p => {
        logLines.push(`🎬 Program ready: "${p.name}" — on shelf, awaiting schedule`)
      })

      // Mirror airings → programs (per-airing totals + reveal flag + review on first airing)
      let programsAfterAirings = tickedProgs.programs
      const newReviews = []
      playerAirings.forEach(a => {
        if (!a.programId) return
        const before = programsAfterAirings.find(p => p.id === a.programId)
        const upd = updateProgramFromAiring({ programs: programsAfterAirings }, a.programId, a, g.station.name)
        programsAfterAirings = upd.programs
        const after = programsAfterAirings.find(p => p.id === a.programId)
        if (after?.review && !before?.review) {
          newReviews.push({ program: after, review: after.review })
        }
      })
      // Programs whose runs expired this month → mark finished
      result.expiredRunIds.forEach(rid => {
        const expiredRun = g.runs.find(r => r.id === rid)
        if (!expiredRun?.programId) return
        const upd = finishProgram({ programs: programsAfterAirings }, expiredRun.programId, null)
        programsAfterAirings = upd.programs
      })

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
        hiredWriters: ticked.hiredWriters,
        scripts: tickedScripts.scripts,
        programs: programsAfterAirings,
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

      // Synthetic "result" object for ResultsView — includes per-slot competitor data
      // so the redesigned UI can compute ranks per slot and at network level.
      const networkTotals = {}
      // playerAirings + competitor airings → group by stationId
      const allMonthAirings = [...playerAirings, ...competitorAiringsThisMonth]
      allMonthAirings.forEach(a => {
        const sid = a.stationId || '__player__'
        if (!networkTotals[sid]) networkTotals[sid] = { stationId: sid, stationName: a.stationName || sid, audience: 0, revenue: 0, airingsCount: 0 }
        networkTotals[sid].audience += a.audience || 0
        networkTotals[sid].revenue += a.revenue || 0
        networkTotals[sid].airingsCount += 1
      })
      Object.values(networkTotals).forEach(n => { n.audience = r1(n.audience); n.revenue = r1(n.revenue) })
      // Rank networks by audience and by revenue
      const sortedByAud = Object.values(networkTotals).sort((a,b) => b.audience - a.audience)
      const sortedByRev = Object.values(networkTotals).sort((a,b) => b.revenue - a.revenue)
      const audRank = sortedByAud.findIndex(n => n.stationId === '__player__') + 1
      const revRank = sortedByRev.findIndex(n => n.stationId === '__player__') + 1

      const lastMonthResult = {
        airings: playerAirings,
        competitorAirings: competitorAiringsThisMonth,
        totals: {
          cost: r1(playerCost),
          revenue: r1(playerRev),
          audience: r1(playerAud),
          net: r1(playerRev - playerCost),
          fameDelta: result.fameDeltaFromRatings,
          audRank, revRank,
          networkCount: Object.keys(networkTotals).length,
          networkTotals: Object.values(networkTotals),
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
          pendingReviews: newReviews,
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
        pendingReviews: newReviews,
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

  // ─── WRITERS ─────────────────────────────────────────────────────────
  const onHireWriter = (writer) => {
    setGame((g) => {
      const result = hireWriter(g.station, writer)
      if (result.error) return { ...g, log: [...g.log, `⚠ Writer: ${result.error}`] }
      const marketRoster = {
        ...g.marketRoster,
        writers: (g.marketRoster.writers || []).filter(w => w.id !== writer.id),
      }
      return {
        ...g,
        station: result.station,
        marketRoster,
        log: [...g.log, `✍ Hired writer ${writer.name} (${fmtM(result.charged)} signing, ${fmtM(writer.cost)}/mo permanent)`],
      }
    })
  }

  const onFireWriter = (writerId) => {
    setGame((g) => {
      const result = fireWriter(g.station, writerId)
      if (result.error) return { ...g, log: [...g.log, `⚠ Writer: ${result.error}`] }
      const w = g.station.hiredWriters.find(h => h.talentId === writerId)
      const writer = w ? (g.marketRoster.writers || []).find(x => x.id === w.talentId) : null
      return {
        ...g,
        station: result.station,
        log: [...g.log, `🚪 Fired writer (penalty ${fmtM(result.charged)})`],
      }
    })
  }

  // ─── SCRIPTS ─────────────────────────────────────────────────────────
  const onBeginScript = (opts) => {
    setGame((g) => {
      const result = beginScript(g.station, opts)
      if (result.error) return { ...g, log: [...g.log, `⚠ Script: ${result.error}`] }
      return {
        ...g,
        station: result.station,
        log: [...g.log, `📝 Began draft: "${opts.name}" (1 mo)`],
      }
    })
  }

  const onRefreshScript = (scriptId) => {
    setGame((g) => {
      const result = refreshScript(g.station, scriptId)
      if (result.error) return { ...g, log: [...g.log, `⚠ Refresh: ${result.error}`] }
      const s = g.station.scripts.find(x => x.id === scriptId)
      return {
        ...g,
        station: result.station,
        log: [...g.log, `🔁 Refreshing "${s?.name || 'script'}" (1 mo)`],
      }
    })
  }

  const onArchiveScript = (scriptId) => {
    setGame((g) => {
      const result = archiveScript(g.station, scriptId)
      if (result.error) return { ...g, log: [...g.log, `⚠ Archive: ${result.error}`] }
      const s = g.station.scripts.find(x => x.id === scriptId)
      return {
        ...g,
        station: result.station,
        log: [...g.log, `📦 Archived "${s?.name || 'script'}"`],
      }
    })
  }

  const onDeleteScript = (scriptId) => {
    setGame((g) => {
      const s = g.station.scripts.find(x => x.id === scriptId)
      const result = deleteArchivedScript(g.station, scriptId)
      if (result.error) return { ...g, log: [...g.log, `⚠ Delete: ${result.error}`] }
      return {
        ...g,
        station: result.station,
        log: [...g.log, `🗑 Deleted "${s?.name || 'script'}"`],
      }
    })
  }

  // ─── PROGRAMS ────────────────────────────────────────────────────────
  const onBeginProgram = (opts) => {
    setGame((g) => {
      const result = beginProgram(g.station, g.research, g.year, opts)
      if (result.error) return { ...g, log: [...g.log, `⚠ Production: ${result.error}`] }
      return {
        ...g,
        station: result.station,
        log: [...g.log, `🎬 Started production: "${opts.name}" (${fmtM(result.program.prepCostPaid)} upfront, ${result.program.prodMonthsTotal} mo)`],
      }
    })
  }

  const onCancelProgram = (programId) => {
    setGame((g) => {
      const p = g.station.programs.find(x => x.id === programId)
      const result = cancelProgram(g.station, programId)
      if (result.error) return { ...g, log: [...g.log, `⚠ Cancel: ${result.error}`] }
      return {
        ...g,
        station: result.station,
        log: [...g.log, `❌ Cancelled program "${p?.name || ''}" (sunk cost)`],
      }
    })
  }

  // Schedule a shelf program into a slot — creates a run
  const onScheduleProgram = (programId, slotTypeId, runMonths) => {
    setGame((g) => {
      const result = scheduleProgram(g.station, programId, slotTypeId, runMonths)
      if (result.error) return { ...g, log: [...g.log, `⚠ Schedule: ${result.error}`] }
      return {
        ...g,
        station: result.station,
        runs: [...g.runs, result.run],
        log: [...g.log, `▶ ${result.run.name} → ${slotTypeId} (${result.run.runMonths} mo)`],
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
    <ErrorBoundary>
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: 40 }}>
      <TopBar
        game={game}
        view={view}
        setView={setView}
        onAdvanceMonth={advanceMonth}
        cashBlocker={cashBlocker}
        nextMonthCost={nextMonthCost}
        onContinueResults={continueAfterResults}
        onContinueAwards={newYear}
      />

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

      {game.phase === 'plan' && view === 'content' && (
        <ContentScreen
          station={game.station}
          marketRoster={game.marketRoster}
          year={game.year}
          monthIdx={game.monthIdx}
          research={game.research}
          onHireWriter={onHireWriter}
          onFireWriter={onFireWriter}
          onBeginScript={onBeginScript}
          onRefreshScript={onRefreshScript}
          onArchiveScript={onArchiveScript}
          onDeleteScript={onDeleteScript}
          onBeginProgram={onBeginProgram}
          onCancelProgram={onCancelProgram}
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
          programs={game.station.programs || []}
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
        <SlotScheduler
          slotTypeId={game.station.slotIds[editingSlotIdx]}
          cycleIdx={game.monthIdx}
          year={game.year}
          station={game.station}
          onSchedule={(programId, slotTypeId, runMonths) => {
            onScheduleProgram(programId, slotTypeId, runMonths)
            setEditingSlotIdx(null)
          }}
          onClose={closeSlot}
          onGoToProduction={() => { setEditingSlotIdx(null); setView('content') }}
        />
      )}

      {(game.pendingReviews && game.pendingReviews.length > 0) && (
        <ReviewModal
          reviews={game.pendingReviews}
          onClose={() => setGame(g => ({ ...g, pendingReviews: [] }))}
        />
      )}
    </div>
    </ErrorBoundary>
  )
}

// ─── TOP BAR ────────────────────────────────────────────────────────────
function TopBar({ game, view, setView, onAdvanceMonth, cashBlocker, nextMonthCost, onContinueResults, onContinueAwards }) {
  const m = MARKETS[game.station.market]
  const isInPlanFlow = game.phase === 'plan'

  // Continue button: in plan flow advances month from any tab; in results dismisses; in awards goes to new year
  const continueAction =
    game.phase === 'results' ? onContinueResults :
    game.phase === 'awards' ? onContinueAwards :
    (isInPlanFlow && !cashBlocker) ? onAdvanceMonth :
    null
  const continueLabel =
    game.phase === 'results' ? 'Continue' :
    game.phase === 'awards' ? 'New Year' :
    'Continue'
  const continueEnabled = !!continueAction

  return (
    <div style={{
      background: T.surface, borderBottom: `1px solid ${T.border}`,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      {/* ROW 1: identity + stats + continue */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 10px',
        alignItems: 'center',
      }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: '.05em', lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {game.station.name}
          </div>
          <div style={{
            fontSize: 9, color: T.muted, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {m.label}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <MiniStat label="CASH" value={fmtM(game.station.cash)} accent={T.green} />
          <MiniStat label="FAME" value={game.station.fame.toFixed(1)} accent={T.gold} />
        </div>

        {/* DATE + Continue chip */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexShrink: 0 }}>
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: '5px 0 0 5px',
            borderRight: 'none',
            padding: '4px 8px',
            textAlign: 'center', minWidth: 42,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1, lineHeight: 1 }}>
              {MONTHS[game.monthIdx]}
            </div>
            <div style={{ fontSize: 10, color: T.text, fontWeight: 700, marginTop: 2, lineHeight: 1 }}>
              Y{game.year}
            </div>
          </div>
          <button
            onClick={continueEnabled ? continueAction : undefined}
            disabled={!continueEnabled}
            style={{
              background: continueEnabled
                ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                : T.card,
              border: 'none',
              borderRadius: '0 5px 5px 0',
              color: continueEnabled ? '#fff' : T.muted,
              padding: '0 10px',
              fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: '.08em',
              cursor: continueEnabled ? 'pointer' : 'not-allowed',
              minWidth: 60,
            }}
          >
            {continueLabel} ▶
          </button>
        </div>
      </div>

      {/* ROW 2: main tabs */}
      {isInPlanFlow && (
        <div style={{
          display: 'flex', gap: 0, padding: '0 6px',
          borderTop: `1px solid ${T.border}`,
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          <NavTab label="Programming" active={view === 'plan'} onClick={() => setView('plan')} />
          <NavTab label="Content" active={view === 'content'} onClick={() => setView('content')} />
          <NavTab label="Operations" active={view === 'operations'} onClick={() => setView('operations')} />
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
      fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: '.08em',
      padding: '9px 11px', cursor: 'pointer',
      borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
      marginBottom: -1, whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 40 }}>
      <div style={{ fontSize: 8, letterSpacing: 1, color: T.muted, lineHeight: 1 }}>{label}</div>
      <div style={{
        fontFamily: 'DM Mono', fontSize: 11, fontWeight: 700,
        color: accent || T.text, marginTop: 2, lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
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

      {/* Next month preview — Continue button is now in the top bar */}
      <div style={{
        marginTop: 22, padding: 14,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5 }}>NEXT MONTH COST</div>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 20,
              color: cashBlocker ? T.red : T.text,
            }}>{fmtM(totalCost)}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {game.runs.length} active program{game.runs.length === 1 ? '' : 's'}
              {permanentCharge > 0 && ` · ${fmtM(permanentCharge)} contracts`}
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.muted, fontStyle: 'italic', maxWidth: 200, textAlign: 'right' }}>
            Tap <strong style={{ color: T.accent }}>Continue ▶</strong> at the top to advance to {MONTHS[(game.monthIdx + 1) % 12]}.
          </div>
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
