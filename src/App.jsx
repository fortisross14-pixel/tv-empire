import React, { useState, useMemo, useEffect } from 'react'
import { T, findBrand } from './theme'
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
  // 6 — ledger
  ledgerEntry,
  // 7 — specialization
  applySpecXP,
  specOnMarketPromotion,
  // 8 — movie packs
  buyMoviePack,
  canBuyMoviePack,
  findOwnedActivePack,
  findLastConsumedPack,
  moviePackPurchaseHype,
  // 9 — achievements
  scanAchievements,
  applyUnlockedAchievements,
  recordMarketAchievement,
} from './engine'

import { SetupScreen } from './components/SetupScreen'
import { SlotCard } from './components/SlotCard'
import { SlotScheduler } from './components/SlotScheduler'
import { ResultsView } from './components/ResultsView'
import { AwardsView } from './components/AwardsView'
import { ResearchScreen } from './components/ResearchScreen'
import { OperationsScreen } from './components/OperationsScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { MarketScreen } from './components/MarketScreen'
import { ContentScreen } from './components/ContentScreen'
import { ReviewModal } from './components/ReviewModal'
import { FinancialsScreen } from './components/FinancialsScreen'
import { SectionTitle } from './components/ui'
import { play as playSound, initOnGesture, isMuted, toggleMuted } from './audio'
import { Icon } from './icons.jsx'

// ─── AUTO-SAVE ──────────────────────────────────────────────────────────
const SAVE_KEY = 'tv-empire-save-v9'

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
    if (!g.station.brandId) g.station.brandId = 'ember'
    if (!g.station.moviePacks) g.station.moviePacks = []
    if (!g.station.specStars) {
      // Default: focus genre 1★, everything else 0
      g.station.specStars = { news: 0, reality: 0, series: 0, latenight: 0, sports: 0, movie: 0, family: 0, kids: 0 }
      if (g.station.focus) g.station.specStars[g.station.focus] = 1
    }
    if (!g.station.specXP) g.station.specXP = { news: 0, reality: 0, series: 0, latenight: 0, sports: 0, movie: 0, family: 0, kids: 0 }
    if (!g.station.achievements) g.station.achievements = { unlocked: {} }
    if (!g.research.inProgress) g.research.inProgress = []
    if (!g.research.scriptTiersUnlocked) g.research.scriptTiersUnlocked = []
    if (!g.pendingHires) g.pendingHires = []
    if (!g.pendingReviews) g.pendingReviews = []
    if (!g.ownedShows) g.ownedShows = []
    if (!g.allShows) g.allShows = []
    if (!g.competitorAllShows) g.competitorAllShows = []
    if (!g.ledger) g.ledger = []
    if (!g.awardsByYear) g.awardsByYear = {}
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
  const [muted, setMutedState] = useState(() => isMuted())
  const prevPhase = React.useRef(game.phase)

  // Auto-save on every game state change
  React.useEffect(() => {
    saveGame(game)
  }, [game])

  // Unlock Web Audio on first user interaction anywhere in the document.
  // (Browsers require a gesture before sound can play.)
  React.useEffect(() => {
    const unlock = () => initOnGesture()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Phase-transition sounds. Fires once per transition, not per render.
  React.useEffect(() => {
    if (prevPhase.current === game.phase) return
    if (game.phase === 'results') playSound('results_reveal')
    else if (game.phase === 'awards') playSound('award')
    prevPhase.current = game.phase
  }, [game.phase])

  const onToggleMute = () => {
    const m = toggleMuted()
    setMutedState(m)
    if (!m) playSound('tick') // confirmation that audio is back
  }

  // Apply the chosen brand's CSS variables on the root element.
  // These power `.cta`, `.ident`, and any brand-tinted UI elsewhere.
  useEffect(() => {
    const brand = findBrand(game?.station?.brandId)
    const root = document.documentElement
    root.style.setProperty('--brand-bg',     brand.bg)
    root.style.setProperty('--brand-fg',     brand.fg)
    root.style.setProperty('--brand-accent', brand.accent)
  }, [game?.station?.brandId])

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
      const entry = penalty > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'fire_penalty',
        label: `Cancelled "${run.name || 'program'}"`,
        amount: -penalty,
        programId: run.programId,
        programName: run.name,
      }) : null
      return {
        ...g,
        runs,
        station: { ...g.station, cash: g.station.cash - penalty, programs },
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
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

  // Permanent contract per-month total + staff salaries + writer salaries + market infra
  const permanentCharge = useMemo(() => {
    if (!game.station) return 0
    const tally = (list) => (list || []).reduce((a, h) => a + (h.permanent ? (h.perMonthCharge || 0) : 0), 0)
    const talentMonthly = tally(game.station.hiredDirectors) + tally(game.station.hiredStars)
    const writerMonthly = writerSalaryTotal(game.station)
    const staffMonthly = staffSalaryTotal(game.station)
    const infraMonthly = MARKETS[game.station.market]?.monthlyInfra || 0
    return talentMonthly + writerMonthly + staffMonthly + infraMonthly
  }, [game.station])

  // ─── ADVANCE MONTH ────────────────────────────────────────────────────
  const advanceMonth = () => {
    if (nextMonthCost + permanentCharge > game.station.cash) {
      playSound('error')
      return
    }
    playSound('month_advance')

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

      // ── Phase 3b: specialization XP ──────────────────────────────────
      // Every player airing contributes max(1, rating) XP to its genre.
      // Movies count as 'movie', sports as 'sports', otherwise the program's
      // categoryId. Star-ups are collected for the milestone log + audio cue.
      let stationWithSpec = g.station
      const starUpsThisMonth = []
      playerAirings.forEach(a => {
        const catForSpec = a.movieId ? 'movie'
                         : a.sportsRunLeagueId ? 'sports'
                         : a.categoryId
        const res = applySpecXP(stationWithSpec, catForSpec, a.rating || 0)
        stationWithSpec = res.station
        if (res.starUps.length > 0) {
          starUpsThisMonth.push(...res.starUps)
        }
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
      // Programs whose runs expired this month → mark finished.
      // Track which programs actually finished (vs movie packs going back to
      // shelf) so we can log pack consumption.
      let stationForFinish = { ...g.station, programs: programsAfterAirings, moviePacks: g.station.moviePacks || [] }
      const finishLogs = []
      result.expiredRunIds.forEach(rid => {
        const expiredRun = g.runs.find(r => r.id === rid)
        if (!expiredRun?.programId) return
        const upd = finishProgram(stationForFinish, expiredRun.programId, null, g.year, g.monthIdx)
        stationForFinish = upd.station
        if (upd.packExhausted) {
          finishLogs.push(`🎞 Pack exhausted: "${expiredRun.name}" — 12-month cooldown until full hype returns`)
        } else if (upd.packConsumed) {
          // Pack still has airings, the program returned to shelf
          const remaining = findOwnedActivePack(stationForFinish, expiredRun.movieId)?.airingsLeft ?? 0
          finishLogs.push(`🎞 "${expiredRun.name}" returned to shelf — ${remaining} airing${remaining === 1 ? '' : 's'} left`)
        }
      })
      programsAfterAirings = stationForFinish.programs
      const moviePacksAfterAirings = stationForFinish.moviePacks
      finishLogs.forEach(l => logLines.push(l))

      // Monthly market-tier infrastructure cost (studios, transmitters,
      // bureaus, regulatory). Zero at local, $2M at metro, $5M at national.
      const infraCost = MARKETS[g.station.market]?.monthlyInfra || 0

      const newCash = g.station.cash - playerCost + playerRev - ticked.perMonthCharge - salaryThisMonth - infraCost
      const newFame = Math.max(0, g.station.fame + result.fameDeltaFromRatings)

      if (salaryThisMonth > 0) {
        logLines.push(`👥 Staff salaries: ${fmtM(-salaryThisMonth)}`)
      }
      if (infraCost > 0) {
        logLines.push(`🏢 ${MARKETS[g.station.market].label} infrastructure: ${fmtM(-infraCost)}`)
      }

      // ── Build month ledger entries ─────────────────────────────────
      // Per-airing entries: revenue (positive) and airing cost (negative).
      // We group revenue and cost separately so the Financials view can
      // show "Program revenue → Program A: X" and "Program expense → Program A: Y"
      // as sibling lines under the same program.
      const monthLedger = []
      playerAirings.forEach(a => {
        if (!a.programId) return
        const prog = programsAfterAirings.find(p => p.id === a.programId)
                  || g.station.programs.find(p => p.id === a.programId)
        const progName = prog?.name
                     || (a.sportsRunLeagueId ? `${findLeague(a.sportsRunLeagueId)?.label || 'Sports'} Coverage` : null)
                     || 'Untitled'
        if ((a.revenue || 0) > 0) {
          monthLedger.push(ledgerEntry({
            year: g.year, month: g.monthIdx,
            kind: 'program_revenue',
            label: 'Airing revenue',
            amount: a.revenue,
            programId: a.programId, programName: progName,
          }))
        }
        if ((a.cost || 0) > 0) {
          monthLedger.push(ledgerEntry({
            year: g.year, month: g.monthIdx,
            kind: 'program_airing',
            label: 'Airing / transmission cost',
            amount: -a.cost,
            programId: a.programId, programName: progName,
          }))
        }
      })
      // Salaries (talent permanent + writer + staff)
      if ((ticked.talentCharge || 0) > 0) {
        monthLedger.push(ledgerEntry({
          year: g.year, month: g.monthIdx,
          kind: 'salary_talent',
          label: 'Talent salaries (permanent)',
          amount: -ticked.talentCharge,
        }))
      }
      if ((ticked.writerCharge || 0) > 0) {
        monthLedger.push(ledgerEntry({
          year: g.year, month: g.monthIdx,
          kind: 'salary_writer',
          label: 'Writer salaries',
          amount: -ticked.writerCharge,
        }))
      }
      if (salaryThisMonth > 0) {
        monthLedger.push(ledgerEntry({
          year: g.year, month: g.monthIdx,
          kind: 'salary_staff',
          label: 'Staff salaries',
          amount: -salaryThisMonth,
        }))
      }
      if (infraCost > 0) {
        monthLedger.push(ledgerEntry({
          year: g.year, month: g.monthIdx,
          kind: 'infrastructure',
          label: `${MARKETS[g.station.market].label} infrastructure`,
          amount: -infraCost,
        }))
      }

      const baseStation = {
        ...stationAfterStaff,
        cash: r1(newCash),
        fame: r2(newFame),
        hiredDirectors: ticked.hiredDirectors,
        hiredStars: ticked.hiredStars,
        hiredWriters: ticked.hiredWriters,
        scripts: tickedScripts.scripts,
        programs: programsAfterAirings,
        moviePacks: moviePacksAfterAirings,
        activeCampaign: null,  // campaigns last only the month they're launched
        // v7: carry forward this month's specialization XP and any star-ups
        specStars: stationWithSpec.specStars,
        specXP:    stationWithSpec.specXP,
      }
      // Achievements get merged in later (after the scan, which depends on
      // playerAirings — finalized just above). For now station is provisional.
      let station = baseStation

      // Log + play audio for any star-ups this month
      starUpsThisMonth.forEach(({ categoryId, newStars }) => {
        const catLabel = (categoryId || '').toString().replace(/^./, c => c.toUpperCase())
        logLines.push(`⭐ Specialty up: ${catLabel} now at ${newStars}★`)
      })
      if (starUpsThisMonth.length > 0) {
        // Defer to next paint so it lands after results_reveal
        setTimeout(() => playSound('confirm'), 1100)
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

      // ── Slot rank per player airing (so achievements & UI can read it) ──
      // Bucket all airings (player + competitors) by slot and rank by audience.
      const slotBuckets = {}
      ;[...playerAirings, ...competitorAiringsThisMonth].forEach(a => {
        const sid = a.slotTypeId || 'prime'
        if (!slotBuckets[sid]) slotBuckets[sid] = []
        slotBuckets[sid].push(a)
      })
      Object.values(slotBuckets).forEach(g => g.sort((a, b) => (b.audience || 0) - (a.audience || 0)))
      playerAirings.forEach(a => {
        const sid = a.slotTypeId || 'prime'
        const group = slotBuckets[sid] || []
        a.slotRank = group.findIndex(x => x.id === a.id) + 1
        a.slotTotal = group.length
      })

      // ── Achievements scan ──
      const achScan = scanAchievements(
        stationWithSpec,         // most up-to-date station before this month's final compose
        playerAirings,
        competitorAiringsThisMonth,
        g.station.market,
        g.year,
        g.monthIdx,
      )
      // Apply firsts: merge unlocked achievements into the final station so
      // they persist. Recurring events fire each month and aren't stored.
      station = applyUnlockedAchievements(station, achScan.unlocked, g.year, g.monthIdx)

      const lastMonthResult = {
        airings: playerAirings,
        competitorAirings: competitorAiringsThisMonth,
        starUps: starUpsThisMonth,
        achievements: {
          unlocked: achScan.unlocked,   // [{id, achievement, context}]
          recurring: achScan.recurring, // [{id, achievement, context}]
        },
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
        const awardLedger = []
        awards.wins.forEach(w => {
          cash += w.cashBonus; fame += w.fameBonus
          if (w.cashBonus > 0) awardLedger.push(ledgerEntry({
            year: g.year, month: g.monthIdx,
            kind: 'award_bonus',
            label: `Award: ${w.label || w.category || 'Win'}`,
            amount: w.cashBonus,
          }))
        })
        if (awards.bestOverall) {
          cash += awards.bestOverall.cashBonus; fame += awards.bestOverall.fameBonus
          if (awards.bestOverall.cashBonus > 0) awardLedger.push(ledgerEntry({
            year: g.year, month: g.monthIdx,
            kind: 'award_bonus',
            label: `Award: Best Overall`,
            amount: awards.bestOverall.cashBonus,
          }))
        }
        if (awards.mostWatched) {
          cash += awards.mostWatched.cashBonus; fame += awards.mostWatched.fameBonus
          if (awards.mostWatched.cashBonus > 0) awardLedger.push(ledgerEntry({
            year: g.year, month: g.monthIdx,
            kind: 'award_bonus',
            label: `Award: Most Watched`,
            amount: awards.mostWatched.cashBonus,
          }))
        }
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
          awardsByYear: { ...(g.awardsByYear || {}), [g.year]: awards },
          pendingReviews: newReviews,
          ledger: [...(g.ledger || []), ...monthLedger, ...awardLedger],
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
        ledger: [...(g.ledger || []), ...monthLedger],
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
    if (!canPromote(game.station)) { playSound('error'); return }
    const nextMarketId = promotedMarket(game.station)
    const nextMarket = MARKETS[nextMarketId]
    const cost = nextMarket?.promoteCost || 0
    if (game.station.cash < cost) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Need ${fmtM(cost)} to expand to ${nextMarket.label} — you have ${fmtM(g.station.cash)}`] }))
      return
    }
    playSound('confirm')
    setGame((g) => {
      if (!canPromote(g.station)) return g
      const prev = g.station.market
      // Apply specialization reset: keep specialty min 0.5, keep ≥4 at 1, lose rest.
      const withSpecReset = specOnMarketPromotion({ ...g.station, market: nextMarketId }, prev, nextMarketId)
      // Record the market-tier "first" achievement, if applicable
      const marketAch = recordMarketAchievement({ ...withSpecReset, cash: r1(g.station.cash - cost) }, nextMarketId, g.year, g.monthIdx)
      const entry = cost > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'market_promotion',
        label: `Expansion: ${MARKETS[prev].label} → ${nextMarket.label}`,
        amount: -cost,
      }) : null
      const newLog = [
        ...g.log,
        `🚀 Expanded to ${nextMarket.label} for ${fmtM(cost)}! Specialization reset — only specialty and elite genres retained.`,
      ]
      if (marketAch.unlocked) {
        newLog.push(`🏅 Achievement: ${marketAch.unlocked.achievement.title}`)
      }
      return {
        ...g,
        station: marketAch.station,
        competitors: initCompetitors(nextMarketId),
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: newLog,
      }
    })
  }

  // ─── RESEARCH ────────────────────────────────────────────────────────
  const startResearch = (id) => {
    const probe = beginResearch(id, game.station, game.research, game.year, game.monthIdx)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Research: ${probe.error}`] }))
      return
    }
    playSound('confirm')
    setGame((g) => {
      const result = beginResearch(id, g.station, g.research, g.year, g.monthIdx)
      if (result.error) return { ...g, log: [...g.log, `⚠ Research: ${result.error}`] }
      const adj = researchAdjusted(id, g.station, g.research)
      const r = RESEARCH.find(x => x.id === id)
      const entry = ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'research',
        label: `Research: ${r?.label || id}`,
        amount: -adj.cost,
      })
      return {
        ...g,
        station: result.station,
        research: result.research,
        ledger: [...(g.ledger || []), entry],
        log: [...g.log, `🔬 Began research: ${r?.label} (${adj.months} mo, ${fmtM(adj.cost)})`],
      }
    })
  }

  // ─── SPORTS LICENSES ──────────────────────────────────────────────────
  const buySportsLicense = (leagueId) => {
    const cost = sportsLicenseCost(leagueId, game.station.market)
    if (game.station.cash < cost) { playSound('error'); return }
    if (ownsLicense(game.station, leagueId, game.year)) { playSound('error'); return }
    playSound('confirm')
    setGame((g) => {
      const lg = findLeague(leagueId)
      const entry = ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'rights_sports',
        label: `${lg.label} rights (Y${g.year})`,
        amount: -cost,
      })
      return {
        ...g,
        station: {
          ...g.station,
          cash: g.station.cash - cost,
          sportsLicenses: [...(g.station.sportsLicenses || []), { leagueId, year: g.year }],
        },
        ledger: [...(g.ledger || []), entry],
        log: [...g.log, `🏆 Acquired ${lg.label} rights for Y${g.year} (${fmtM(-cost)})`],
      }
    })
  }

  // ─── TALENT ──────────────────────────────────────────────────────────
  const onHire = (role, talent, contractTypeId) => {
    const probe = hireTalent(game.station, role, talent, contractTypeId)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ ${probe.error}`] }))
      return
    }
    playSound('confirm')
    setGame((g) => {
      const result = hireTalent(g.station, role, talent, contractTypeId)
      if (result.error) return { ...g, log: [...g.log, `⚠ ${result.error}`] }
      const marketRoster = {
        directors: g.marketRoster.directors.filter(d => !(role === 'director' && d.id === talent.id)),
        stars:     g.marketRoster.stars.filter(s => !(role === 'star' && s.id === talent.id)),
      }
      const entry = result.charged > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'hire_signing',
        label: `Signed ${talent.name} (${role})`,
        amount: -result.charged,
      }) : null
      return {
        ...g,
        station: result.station,
        marketRoster,
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: [...g.log, `✍ Signed ${talent.name} (${contractTypeId}) for ${fmtM(result.charged)}`],
      }
    })
  }

  const onFire = (role, talentId) => {
    setGame((g) => {
      const result = fireTalent(g.station, role, talentId)
      if (result.error) return { ...g, log: [...g.log, `⚠ ${result.error}`] }
      const entry = result.charged > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'fire_penalty',
        label: `Fire penalty (${role})`,
        amount: -result.charged,
      }) : null
      return {
        ...g,
        station: result.station,
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: [...g.log, `🚪 Fired talent (penalty ${fmtM(result.charged)})`],
      }
    })
  }

  // ─── WRITERS ─────────────────────────────────────────────────────────
  const onHireWriter = (writer) => {
    const probe = hireWriter(game.station, writer)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Writer: ${probe.error}`] }))
      return
    }
    playSound('confirm')
    setGame((g) => {
      const result = hireWriter(g.station, writer)
      if (result.error) return { ...g, log: [...g.log, `⚠ Writer: ${result.error}`] }
      const marketRoster = {
        ...g.marketRoster,
        writers: (g.marketRoster.writers || []).filter(w => w.id !== writer.id),
      }
      const entry = result.charged > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'hire_signing',
        label: `Hired writer ${writer.name}`,
        amount: -result.charged,
      }) : null
      return {
        ...g,
        station: result.station,
        marketRoster,
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: [...g.log, `✍ Hired writer ${writer.name} (${fmtM(result.charged)} signing, ${fmtM(writer.cost)}/mo permanent)`],
      }
    })
  }

  const onFireWriter = (writerId) => {
    setGame((g) => {
      const result = fireWriter(g.station, writerId)
      if (result.error) return { ...g, log: [...g.log, `⚠ Writer: ${result.error}`] }
      const entry = result.charged > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'fire_penalty',
        label: `Fire penalty (writer)`,
        amount: -result.charged,
      }) : null
      return {
        ...g,
        station: result.station,
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: [...g.log, `🚪 Fired writer (penalty ${fmtM(result.charged)})`],
      }
    })
  }

  // ─── SCRIPTS ─────────────────────────────────────────────────────────
  const onBeginScript = (opts) => {
    const probe = beginScript(game.station, opts)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Script: ${probe.error}`] }))
      return
    }
    playSound('script_start')
    setGame((g) => {
      const result = beginScript(g.station, opts)
      if (result.error) return { ...g, log: [...g.log, `⚠ Script: ${result.error}`] }
      const tier = opts.tier || 'normal'
      const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
      const months = tier === 'normal' ? 1 : 2
      const costNote = result.charged ? `, ${fmtM(result.charged)}` : ''
      return {
        ...g,
        station: result.station,
        log: [...g.log, `📝 Began ${tierLabel} draft: "${opts.name}" (${months} mo${costNote})`],
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
    const probe = beginProgram(game.station, game.research, game.year, opts)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Production: ${probe.error}`] }))
      return
    }
    playSound('production_start')
    setGame((g) => {
      const result = beginProgram(g.station, g.research, g.year, opts)
      if (result.error) return { ...g, log: [...g.log, `⚠ Production: ${result.error}`] }
      const entry = ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'program_build',
        label: `Production: ${opts.name}`,
        amount: -result.program.prepCostPaid,
        programId: result.program.id,
        programName: result.program.name,
      })
      return {
        ...g,
        station: result.station,
        ledger: [...(g.ledger || []), entry],
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
    const probe = scheduleProgram(game.station, programId, slotTypeId, runMonths)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Schedule: ${probe.error}`] }))
      return
    }
    playSound('confirm')
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
      const entry = tierCost > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'hire_signing',
        label: `${role} search (${tierId})`,
        amount: -tierCost,
      }) : null
      return {
        ...g,
        station: result.station,
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: [...g.log, `📋 Opened ${role} position (${tierId} search, ${fmtM(tierCost)})`],
      }
    })
  }

  const onCancelPosition = (role) => {
    setGame((g) => {
      const result = cancelStaffPosition(g.station, role)
      if (result.error) return { ...g, log: [...g.log, `⚠ ${result.error}`] }
      const entry = result.refund > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'hire_signing',  // negative expense → reimbursement
        label: `Search refund (${role})`,
        amount: result.refund,
      }) : null
      return {
        ...g,
        station: result.station,
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: [...g.log, `❌ Cancelled ${role} search (refund ${fmtM(result.refund)})`],
      }
    })
  }

  const onPickCandidate = (role, candidate) => {
    playSound('confirm')
    setGame((g) => {
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
      const entry = result.penalty > 0 ? ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'fire_penalty',
        label: `Severance (${role})`,
        amount: -result.penalty,
      }) : null
      return {
        ...g,
        station: result.station,
        ledger: entry ? [...(g.ledger || []), entry] : (g.ledger || []),
        log: [...g.log, `🚪 Fired ${role} director (severance ${fmtM(result.penalty)})`],
      }
    })
  }

  // ─── IP RIGHTS ──────────────────────────────────────────────────────
  const onBuyIP = (ipId, termId) => {
    const probe = buyIPLicense(game.station, ipId, termId, game.year, game.research)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ IP: ${probe.error}`] }))
      return
    }
    playSound('confirm')
    setGame((g) => {
      const result = buyIPLicense(g.station, ipId, termId, g.year, g.research)
      if (result.error) return { ...g, log: [...g.log, `⚠ IP: ${result.error}`] }
      const ipObj = IPS_FOR_NAMES.find(i => i.id === ipId)
      const entry = ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'rights_ip',
        label: `${ipObj?.name || ipId} (${termId.replace('y','-yr')})`,
        amount: -result.cost,
      })
      return {
        ...g,
        station: result.station,
        ledger: [...(g.ledger || []), entry],
        log: [...g.log, `📜 Licensed ${ipObj?.name || ipId} (${termId.replace('y','-year')}, ${fmtM(result.cost)})`],
      }
    })
  }

  // ─── MOVIE PACKS ────────────────────────────────────────────────────
  const onBuyMoviePack = (packId) => {
    const probe = buyMoviePack(game.station, packId, game.year, game.monthIdx)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Movie pack: ${probe.error}`] }))
      return
    }
    playSound('confirm')
    setGame((g) => {
      const result = buyMoviePack(g.station, packId, g.year, g.monthIdx)
      if (result.error) return { ...g, log: [...g.log, `⚠ Movie pack: ${result.error}`] }
      const entry = ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'rights_ip',  // bucket with IP rights for now
        label: `Movie pack: ${result.pack.name}${result.penaltyApplied ? ' (cooldown — reduced hype)' : ''}`,
        amount: -result.cost,
      })
      return {
        ...g,
        station: result.station,
        ledger: [...(g.ledger || []), entry],
        log: [...g.log, `🎞 Acquired ${result.pack.name} (${result.pack.packSize || 3} airings, ${fmtM(result.cost)})${result.penaltyApplied ? ' — overexposed, hype reduced' : ''}`],
      }
    })
  }

  // ─── NETWORK CAMPAIGNS ──────────────────────────────────────────────
  const onLaunchCampaign = (campaignId) => {
    const probe = launchNetworkCampaign(game.station, campaignId, game.research)
    if (probe.error) {
      playSound('error')
      setGame((g) => ({ ...g, log: [...g.log, `⚠ Campaign: ${probe.error}`] }))
      return
    }
    playSound('confirm')
    setGame((g) => {
      const result = launchNetworkCampaign(g.station, campaignId, g.research)
      if (result.error) return { ...g, log: [...g.log, `⚠ Campaign: ${result.error}`] }
      const entry = ledgerEntry({
        year: g.year, month: g.monthIdx,
        kind: 'marketing',
        label: `Network campaign: ${result.label}`,
        amount: -(result.cost || 0),
      })
      return {
        ...g,
        station: result.station,
        ledger: [...(g.ledger || []), entry],
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
        muted={muted}
        onToggleMute={onToggleMute}
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
        />
      )}

      {game.phase === 'plan' && view === 'operations' && (
        <OperationsScreen
          station={game.station}
          marketRoster={game.marketRoster}
          research={game.research}
          year={game.year}
          monthIdx={game.monthIdx}
          allShows={game.allShows || []}
          awardsByYear={game.awardsByYear || {}}
          pendingHires={game.pendingHires || []}
          onHire={onHire}
          onFire={onFire}
          onOpenPosition={onOpenPosition}
          onCancelPosition={onCancelPosition}
          onPickCandidate={onPickCandidate}
          onFireStaff={onFireStaff}
          onBuyIP={onBuyIP}
          onBuyMoviePack={onBuyMoviePack}
          onBuySportsLicense={buySportsLicense}
          onHireWriter={onHireWriter}
          onFireWriter={onFireWriter}
          onLaunchCampaign={onLaunchCampaign}
          onPromote={promoteMarket}
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
          monthIdx={game.monthIdx}
          yearShows={game.yearShows || []}
          competitorAllShows={game.competitorAllShows || []}
          onBack={() => setView('plan')}
        />
      )}

      {game.phase === 'plan' && view === 'financials' && (
        <FinancialsScreen
          game={game}
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
function TopBar({ game, view, setView, onAdvanceMonth, cashBlocker, nextMonthCost, onContinueResults, onContinueAwards, muted, onToggleMute }) {
  const m = MARKETS[game.station.market]
  const isInPlanFlow = game.phase === 'plan'
  const brand = findBrand(game.station.brandId)

  // Continue button: in plan flow advances month from any tab; in results dismisses; in awards goes to new year
  const continueAction =
    game.phase === 'results' ? onContinueResults :
    game.phase === 'awards' ? onContinueAwards :
    (isInPlanFlow && !cashBlocker) ? onAdvanceMonth :
    null
  const continueLabel =
    game.phase === 'results' ? 'Continue' :
    game.phase === 'awards' ? 'New Year' :
    'Air Month'
  const continueEnabled = !!continueAction

  // Ident label = first 12 chars uppercased, like a real channel ident
  const identLabel = (game.station.name || 'CHANNEL').slice(0, 12).toUpperCase()

  return (
    <div className="topbar" style={{
      background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`,
      borderBottom: `1px solid ${T.border}`,
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: `0 2px 20px rgba(0,0,0,.4)`,
    }}>
      {/* ROW 1: ident + stats + date + continue */}
      <div className="topbar-row" style={{
        display: 'flex', gap: 10, padding: '10px 12px',
        alignItems: 'center',
      }}>
        {/* IDENT — uses brand colors */}
        <div className="topbar-ident" style={{
          display: 'inline-flex',
          background: brand.bg, color: brand.fg,
          padding: '6px 10px',
          fontFamily: 'Anton, sans-serif',
          fontSize: 15, letterSpacing: '.06em',
          borderRadius: 3,
          border: `1.5px solid ${brand.fg}`,
          textTransform: 'uppercase',
          lineHeight: 1,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {identLabel}
        </div>

        {/* Market subtitle (mobile-collapsed) */}
        <div className="topbar-market" style={{ flex: '1 1 0', minWidth: 0 }}>
          <div className="mono" style={{
            fontSize: 9.5, color: T.muted, letterSpacing: '.12em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {m.label.toUpperCase()}
          </div>
          <div style={{
            fontSize: 11, color: T.textDim, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span className="onair-dot" style={{ width: 5, height: 5 }} />
            <span style={{ color: T.red, fontSize: 9.5, letterSpacing: '.1em', fontWeight: 600 }}>LIVE</span>
          </div>
        </div>

        {/* Stats */}
        <div className="topbar-stats" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <MiniStat label="CASH" value={fmtM(game.station.cash)} accent={T.green} />
          <MiniStat label="FAME" value={game.station.fame.toFixed(1)} accent={T.gold} />
        </div>

        {/* Mute toggle */}
        <button
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          title={muted ? 'Audio muted' : 'Audio on'}
          style={{
            background: 'transparent',
            border: `1px solid ${T.border}`,
            color: muted ? T.muted : T.text,
            borderRadius: 4,
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
        >
          <Icon name={muted ? 'speaker_off' : 'speaker_on'} size={15} color="currentColor" />
        </button>

        {/* DATE + Continue — on mobile this gets pulled to its own row via CSS */}
        <div className="topbar-cta" style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexShrink: 0 }}>
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: '4px 0 0 4px',
            borderRight: 'none',
            padding: '5px 9px',
            textAlign: 'center', minWidth: 46,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div className="mono" style={{ fontSize: 9, color: T.muted, letterSpacing: '.1em', lineHeight: 1 }}>
              {MONTHS[game.monthIdx].toUpperCase()}
            </div>
            <div className="display" style={{ fontSize: 13, color: T.text, marginTop: 3, lineHeight: 1, letterSpacing: '.04em' }}>
              Y{game.year}
            </div>
          </div>
          <button
            onClick={continueEnabled ? continueAction : undefined}
            disabled={!continueEnabled}
            style={{
              background: continueEnabled ? brand.accent : T.card,
              border: 'none',
              borderRadius: '0 4px 4px 0',
              color: continueEnabled ? brand.bg : T.muted,
              padding: '0 14px',
              fontFamily: 'Anton, sans-serif',
              fontSize: 13.5,
              letterSpacing: '.07em',
              textTransform: 'uppercase',
              cursor: continueEnabled ? 'pointer' : 'not-allowed',
              minWidth: 70,
              transition: 'filter .12s',
            }}
            onMouseEnter={e => { if (continueEnabled) e.currentTarget.style.filter = 'brightness(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
          >
            {continueLabel} ▸
          </button>
        </div>
      </div>

      {/* ROW 2: main tabs */}
      {isInPlanFlow && (
        <div className="topbar-tabs" style={{
          display: 'flex', gap: 0, padding: '0 8px',
          borderTop: `1px solid ${T.border}`,
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          <NavTab label="Programming" active={view === 'plan'} onClick={() => setView('plan')} brand={brand} />
          <NavTab label="Content" active={view === 'content'} onClick={() => setView('content')} brand={brand} />
          <NavTab label="Operations" active={view === 'operations'} onClick={() => setView('operations')} brand={brand} />
          <NavTab label="Research" active={view === 'research'} onClick={() => setView('research')} brand={brand} />
          <NavTab label="History" active={view === 'history'} onClick={() => setView('history')} brand={brand} />
          <NavTab label="Market" active={view === 'market'} onClick={() => setView('market')} brand={brand} />
          <NavTab label="Financials" active={view === 'financials'} onClick={() => setView('financials')} brand={brand} />
        </div>
      )}
    </div>
  )
}

function NavTab({ label, active, onClick, brand }) {
  const activeColor = brand?.accent || T.accent
  const handleClick = () => {
    if (!active) playSound('tap')
    onClick()
  }
  return (
    <button onClick={handleClick} style={{
      background: 'transparent', border: 'none',
      color: active ? activeColor : T.muted,
      fontFamily: "'Inter Tight', sans-serif",
      fontSize: 12, fontWeight: active ? 600 : 500,
      letterSpacing: '.02em',
      padding: '11px 13px', cursor: 'pointer',
      borderBottom: `2px solid ${active ? activeColor : 'transparent'}`,
      marginBottom: -1, whiteSpace: 'nowrap',
      transition: 'color .15s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.text }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.muted }}
    >{label}</button>
  )
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 48 }}>
      <div className="mono" style={{
        fontSize: 8.5, letterSpacing: '.12em', color: T.muted, lineHeight: 1,
      }}>{label}</div>
      <div className="mono" style={{
        fontSize: 14, fontWeight: 700,
        color: accent || T.text, marginTop: 3, lineHeight: 1,
        whiteSpace: 'nowrap',
        letterSpacing: '-.02em',
      }}>{value}</div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ minWidth: 80 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', color: T.muted }}>{label}</div>
      <div className="mono" style={{
        fontSize: 18, fontWeight: 700,
        color: accent || T.text, marginTop: 4,
        letterSpacing: '-.01em',
      }}>{value}</div>
    </div>
  )
}

// ─── PLAN VIEW ──────────────────────────────────────────────────────────
function PlanView({
  game, runsBySlot, nextMonthCost, permanentCharge, cashBlocker,
  onOpenSlot, onCancelRun, onAdvanceMonth,
}) {
  const totalCost = nextMonthCost + permanentCharge
  const filledCount = game.station.slotIds.filter((_, i) => runsBySlot[i]).length
  const totalSlots = game.station.slotIds.length

  return (
    <div className="view-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: 18 }}>
      {/* Broadcast schedule header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 18, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div className="mono" style={{
            fontSize: 11, color: T.muted, letterSpacing: '.15em', marginBottom: 4,
          }}>
            BROADCAST SCHEDULE · {MONTHS[game.monthIdx].toUpperCase()} Y{game.year}
          </div>
          <h1 className="display" style={{
            fontSize: 32, color: T.text, letterSpacing: '.04em',
            textTransform: 'uppercase', lineHeight: 1,
          }}>
            Programming
          </h1>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.5, maxWidth: 520 }}>
            Fill empty slots with programs (1, 3, 6, or 12-month commitments) or sports rights.
            Active programs auto-air each month.
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          padding: '10px 16px',
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 5,
        }}>
          <div className="mono" style={{ fontSize: 28, color: T.text, fontWeight: 700, letterSpacing: '-.02em' }}>
            {filledCount}
            <span style={{ color: T.muted, fontSize: 18, fontWeight: 400 }}> / {totalSlots}</span>
          </div>
          <div className="mono" style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em' }}>
            SLOTS<br/>FILLED
          </div>
        </div>
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

      {/* Next month preview — Continue button is now in the top bar */}
      <div style={{
        marginTop: 22, padding: 16,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div className="mono" style={{ fontSize: 10, color: T.muted, letterSpacing: '.15em' }}>
              NEXT MONTH BUDGET
            </div>
            <div className="mono" style={{
              fontSize: 22, fontWeight: 700,
              color: cashBlocker ? T.red : T.text,
              marginTop: 4,
              letterSpacing: '-.02em',
            }}>{fmtM(totalCost)}</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>
              {game.runs.length} active program{game.runs.length === 1 ? '' : 's'}
              {permanentCharge > 0 && ` · ${fmtM(permanentCharge)} contracts`}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, fontStyle: 'italic', maxWidth: 220, textAlign: 'right' }}>
            Tap <strong style={{ color: T.accent }}>Air Month ▸</strong> at the top to advance to {MONTHS[(game.monthIdx + 1) % 12]}.
          </div>
        </div>
        {cashBlocker && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(239, 69, 101, .08)',
            border: `1px solid rgba(239, 69, 101, .3)`,
            borderRadius: 4,
            fontSize: 11.5, color: T.red,
          }}>
            Not enough cash to advance — cancel a run, fire someone, or check Financials.
          </div>
        )}
      </div>

      <ActivityLog log={game.log} />

      <div style={{
        marginTop: 16, padding: '10px 14px',
        fontSize: 10.5, color: T.muted, textAlign: 'center',
      }}>
        Auto-saved.{' '}
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
            cursor: 'pointer', fontSize: 10.5,
          }}
        >Reset game</button>
      </div>
    </div>
  )
}

// ─── SPORTS RIGHTS PANEL ────────────────────────────────────────────────
// (moved to MarketScreen — kept marker for findability)

function ActivityLog({ log }) {
  const tail = log.slice(-6).reverse()
  return (
    <div style={{
      marginTop: 18, padding: 14,
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
    }}>
      <div className="mono" style={{
        fontSize: 10, letterSpacing: '.15em', color: T.muted, marginBottom: 10,
      }}>ACTIVITY</div>
      {tail.map((line, i) => (
        <div key={i} className="mono" style={{
          fontSize: 11.5,
          color: i === 0 ? T.text : T.muted, padding: '3px 0',
        }}>{line}</div>
      ))}
    </div>
  )
}
