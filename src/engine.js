/**
 * engine.js — Pure game logic for the playable TV Empire.
 * Pass 4a: 12 months / year, multi-month program runs, sports rights, sequels.
 * No React. Side-effect free. All randomness via Math.random.
 */

import {
  CATEGORIES, MARKETS, MARKET_ORDER, MARKETING_TIERS,
  DIRECTORS, STARS, IPS, MOVIES, COMPETITORS, FOCUSES, RESEARCH,
  TIERS, MONTHS, MONTHS_PER_YEAR,
  SLOT_TYPES, DEFAULT_SLOT_IDS, SEASONAL_PREFS,
  defaultUnlocks, CONTRACT_TYPES, FIRE_PENALTY_MULT,
  RUN_LENGTHS, CANCEL_REFUND_MULT, SEQUEL_BONUSES,
  SPORTS_LEAGUES, SPORTS_MARKET_COST_MULT,
  SHOW_NAME_POOL,
} from './constants.js'

// ─── MATH HELPERS ────────────────────────────────────────────────────────────
export const rnd  = (a, b) => Math.random() * (b - a) + a
export const pick = arr => arr[Math.floor(Math.random() * arr.length)]
export const r1   = n => Math.round(n * 10) / 10
export const r2   = n => Math.round(n * 100) / 100
export const fmtM = n => `$${(n >= 0 ? '' : '-')}${Math.abs(n).toFixed(1)}M`
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// ─── ID HELPERS ──────────────────────────────────────────────────────────────
let _uid = 0
export const uid = () => `p${Date.now().toString(36)}_${(_uid++).toString(36)}`

// ─── LOOKUPS ────────────────────────────────────────────────────────────────
export const findDirector = id => DIRECTORS.find(d => d.id === id) || null
export const findStar     = id => STARS.find(s => s.id === id) || null
export const findIP       = id => IPS.find(i => i.id === id) || null
export const findMovie    = id => MOVIES.find(m => m.id === id) || null
export const findFocus    = id => FOCUSES.find(f => f.id === id) || null
export const findLeague   = id => SPORTS_LEAGUES.find(l => l.id === id) || null

// ─── ROSTER (talent universe sampling) ───────────────────────────────────────
const TIER_EXPOSURE = {
  Common:    0.80,
  Uncommon:  0.60,
  Rare:      0.40,
  Epic:      0.20,
  Legendary: 0.08,
}

export function buildRoster(scoutLevel = 0) {
  const bonus = scoutLevel * 0.15
  const expose = (list) => list.filter(t => Math.random() < clamp(TIER_EXPOSURE[t.tier] + bonus, 0, 1))
  return { directors: expose(DIRECTORS), stars: expose(STARS) }
}

// ─── CONTENT UNLOCKS ─────────────────────────────────────────────────────────
export function getUnlocks(station, research) {
  const focusUnlocks = defaultUnlocks(station.focus || 'general')
  const researchUnlocks = research?.contentUnlocks || []
  const all = [...focusUnlocks, ...researchUnlocks]

  const byCat = {}
  for (const [catId, topicId] of all) {
    if (byCat[catId] === '*') continue
    if (topicId === '*') byCat[catId] = '*'
    else {
      if (!byCat[catId]) byCat[catId] = new Set()
      byCat[catId].add(topicId)
    }
  }
  return {
    byCat,
    hasCat:   (id) => !!byCat[id],
    hasTopic: (catId, topicId) => {
      const v = byCat[catId]
      if (!v) return false
      if (v === '*') return true
      return v.has(topicId)
    },
  }
}

// ─── TALENT CONTRACT HELPERS ─────────────────────────────────────────────────
// Hired record shape:
//   { talentId, role, contractType, permanent, monthsLeft, perMonthCharge, upfrontPaid }

export const findHired = (station, role, talentId) => {
  const list = role === 'director' ? station.hiredDirectors : station.hiredStars
  return (list || []).find(h => h.talentId === talentId) || null
}

export function contractCost(talent, contractTypeId) {
  const ct = CONTRACT_TYPES.find(c => c.id === contractTypeId)
  if (!ct) return 0
  return r1(talent.cost * ct.costMult)
}

export const isActiveContract = (h) => h && (h.permanent || h.monthsLeft > 0)

/** Advance contracts by one month. Permanent contracts charge per-month. */
export function tickContracts(station) {
  let charge = 0
  const tick = (list) => list.map(h => {
    if (h.permanent) {
      charge += h.perMonthCharge || 0
      return h
    }
    return { ...h, monthsLeft: Math.max(0, h.monthsLeft - 1) }
  }).filter(h => h.permanent || h.monthsLeft > 0)

  return {
    hiredDirectors: tick(station.hiredDirectors || []),
    hiredStars:     tick(station.hiredStars     || []),
    perMonthCharge: r1(charge),
  }
}

export function hireTalent(station, role, talent, contractTypeId) {
  const ct = CONTRACT_TYPES.find(c => c.id === contractTypeId)
  if (!ct) return { station, charged: 0, error: 'Bad contract type' }
  const list = role === 'director' ? (station.hiredDirectors || []) : (station.hiredStars || [])
  if (list.find(h => h.talentId === talent.id)) {
    return { station, charged: 0, error: 'Already hired' }
  }
  const upfront = r1(talent.cost * ct.costMult)
  if (station.cash < upfront) return { station, charged: 0, error: 'Not enough cash' }

  const record = {
    talentId: talent.id,
    role,
    contractType: contractTypeId,
    permanent: ct.months === -1,
    monthsLeft: ct.months === -1 ? null : ct.months,
    perMonthCharge: ct.months === -1 ? r1(talent.cost * ct.costMult) : 0,
    upfrontPaid: ct.months === -1 ? 0 : r1(upfront),
  }
  const newStation = {
    ...station,
    cash: r1(station.cash - upfront),
    hiredDirectors: role === 'director' ? [...(station.hiredDirectors || []), record] : (station.hiredDirectors || []),
    hiredStars:     role === 'star'     ? [...(station.hiredStars     || []), record] : (station.hiredStars     || []),
  }
  return { station: newStation, charged: r1(upfront), error: null }
}

export function fireTalent(station, role, talentId) {
  const list = role === 'director' ? (station.hiredDirectors || []) : (station.hiredStars || [])
  const rec = list.find(h => h.talentId === talentId)
  if (!rec) return { station, charged: 0, error: 'Not hired' }

  const talent = role === 'director' ? findDirector(talentId) : findStar(talentId)
  let penalty = 0
  if (rec.permanent) {
    penalty = r1((rec.perMonthCharge || talent?.cost || 0) * FIRE_PENALTY_MULT)
  } else {
    // forfeit proportional to remaining months, capped at 1 month full cost
    penalty = r1(Math.min(talent?.cost || 0, (rec.monthsLeft || 0) * (talent?.cost || 0) * 0.4))
  }

  const filter = (arr) => (arr || []).filter(h => h.talentId !== talentId)
  const newStation = {
    ...station,
    cash: r1(station.cash - penalty),
    hiredDirectors: role === 'director' ? filter(station.hiredDirectors) : station.hiredDirectors,
    hiredStars:     role === 'star'     ? filter(station.hiredStars)     : station.hiredStars,
  }
  return { station: newStation, charged: penalty, error: null }
}

export function activeRoster(station) {
  const dirs = (station.hiredDirectors || [])
    .filter(isActiveContract)
    .map(h => findDirector(h.talentId)).filter(Boolean)
  const stars = (station.hiredStars || [])
    .filter(isActiveContract)
    .map(h => findStar(h.talentId)).filter(Boolean)
  return { directors: dirs, stars }
}

export function buildMarketRoster(station, scoutLevel = 0) {
  const bonus = scoutLevel * 0.15
  const expose = (list) => list.filter(t => Math.random() < clamp(TIER_EXPOSURE[t.tier] + bonus, 0, 1))
  const hiredD = new Set((station.hiredDirectors || []).map(h => h.talentId))
  const hiredS = new Set((station.hiredStars || []).map(h => h.talentId))
  return {
    directors: expose(DIRECTORS).filter(d => !hiredD.has(d.id)),
    stars:     expose(STARS).filter(s => !hiredS.has(s.id)),
  }
}

// ─── SLOT TYPE + SEASONAL HELPERS ────────────────────────────────────────────
export function getSeasonalPref(slotTypeId, monthIdx) {
  const m = SEASONAL_PREFS[slotTypeId]
  if (!m) return null
  return m[monthIdx] || null
}

function slotTypeBonus(slotTypeId, categoryId) {
  const slot = SLOT_TYPES[slotTypeId]
  if (!slot) return 0
  return slot.prefersCategory.includes(categoryId) ? slot.matchBonus : 0
}

function seasonalBonus(slotTypeId, monthIdx, planned) {
  const pref = getSeasonalPref(slotTypeId, monthIdx)
  if (!pref) return 0
  if (planned.movieId && pref.categoryId === 'movie') return pref.bonusH || 0
  if (planned.sportsRunLeagueId && pref.categoryId === 'sports') return pref.bonusH || 0
  const catMatch = pref.categoryId === planned.categoryId
  const topicMatch = pref.topicId == null || pref.topicId === planned.topicId
  if (catMatch && topicMatch) return pref.bonusH || 0
  return 0
}

// ─── SPORTS RIGHTS ───────────────────────────────────────────────────────────
/** Cost to buy a league's rights for one year in the station's market. */
export function sportsLicenseCost(leagueId, marketId) {
  const lg = findLeague(leagueId)
  if (!lg) return 0
  return r1(lg.cost * (SPORTS_MARKET_COST_MULT[marketId] || 1.0))
}

/** Is this league in-season this month? */
export function isSportsInSeason(leagueId, monthIdx) {
  const lg = findLeague(leagueId)
  if (!lg) return false
  return lg.season.includes(monthIdx)
}

/** Does the station own these rights for this year? */
export function ownsLicense(station, leagueId, year) {
  return (station.sportsLicenses || []).some(l => l.leagueId === leagueId && l.year === year)
}

// ─── COSTS ───────────────────────────────────────────────────────────────────
export function baseProductionCost(categoryId, marketId) {
  const cat = CATEGORIES[categoryId]
  const market = MARKETS[marketId]
  const marketMult = market.id === 'local' ? 0.7 : market.id === 'metro' ? 1.0 : 1.4
  return r1(1.0 * (cat?.cost_mult || 1.0) * marketMult)
}

export function marketingCost(tierId, marketId, research) {
  const tier = MARKETING_TIERS.find(t => t.id === tierId) || MARKETING_TIERS[0]
  const market = MARKETS[marketId]
  const discount = research?.marketingDiscount || 1.0
  return r1(tier.cost * market.marketingMult * discount)
}

export function ipCost(ipId, research) {
  if (!ipId) return 0
  const ip = findIP(ipId)
  if (!ip) return 0
  const discount = research?.ipDiscount || 1.0
  return r1(ip.cost * discount)
}

/** Per-month production cost of one program. */
export function programCost(planned, stationOrMarket, research) {
  const market = stationOrMarket?.market && typeof stationOrMarket.market === 'string'
    ? MARKETS[stationOrMarket.market]
    : stationOrMarket
  const slot = SLOT_TYPES[planned.slotTypeId || 'prime']
  const slotMult = slot?.costMult || 1.0

  if (planned.movieId) {
    const m = findMovie(planned.movieId)
    return r1(((m?.cost || 0) * slotMult) + marketingCost(planned.marketingId || 'none', market.id, research))
  }
  if (planned.sportsRunLeagueId) {
    // Sports rights themselves are licensed yearly. Per-month cost is just
    // the production overhead (small) + marketing.
    const base = 0.4 * slotMult
    const mktg = marketingCost(planned.marketingId || 'none', market.id, research)
    return r1(base + mktg)
  }
  const base = baseProductionCost(planned.categoryId, market.id) * slotMult
  const ip   = ipCost(planned.ipId, research)
  const mktg = marketingCost(planned.marketingId || 'none', market.id, research)
  return r1(base + ip + mktg)
}

/** Total cost across the whole multi-month run (paid upfront-ish via per-month
 *  cash hits, but useful to show "total commitment" in UI). */
export function runTotalCost(planned, station, research) {
  const months = planned.runMonths || 1
  return r1(programCost(planned, station, research) * months)
}

// ─── QUALITY & HYPE ──────────────────────────────────────────────────────────
function matchFactor(talent, categoryId) {
  if (!talent) return 0
  return talent.specialty === categoryId ? 1.0 : 0.4
}

/** Sequel bonus calculator. Applied to seqSeason ≥ 2.
 *  If same dir+star as previous season → full bonus from SEQUEL_BONUSES.
 *  If one changed → half bonus. If both changed → no bonus. */
function sequelBonusFor(planned) {
  if (!planned.seqSeason || planned.seqSeason < 2) return 0
  const idx = Math.min(planned.seqSeason - 1, SEQUEL_BONUSES.length - 1)
  const fullBonus = SEQUEL_BONUSES[idx] * 10  // convert percent to quality points (~)
  // we need to compare to prior season talent: passed via prevDir/prevStar on the planned
  const dirSame = planned.prevDirectorId == null || planned.directorId === planned.prevDirectorId
  const starSame = planned.prevStarId == null || planned.starId === planned.prevStarId
  if (dirSame && starSame) return fullBonus
  if (dirSame || starSame) return fullBonus * 0.5
  return 0
}

/** Project quality/hype for a program (deterministic; airing adds noise). */
export function projectShow(planned, station, research, monthIdx = 0) {
  const slotTypeId = planned.slotTypeId || 'prime'
  const slotBonusH = slotTypeBonus(
    slotTypeId,
    planned.movieId ? 'movie' : (planned.sportsRunLeagueId ? 'sports' : planned.categoryId),
  )
  const seasonBonusH = seasonalBonus(slotTypeId, monthIdx, planned)

  // Sports rights run
  if (planned.sportsRunLeagueId) {
    const lg = findLeague(planned.sportsRunLeagueId)
    if (!lg) return { quality: 1, hype: 1, tier: 'Common', slotBonusH: 0, seasonBonusH: 0 }
    const dir   = findDirector(planned.directorId)
    const star  = findStar(planned.starId)
    const focus = findFocus(station.focus) || {}
    const isPeak = monthIdx === lg.peakMonth
    const peakBonus = isPeak ? lg.peakBonus : 0
    const dMatch = dir  ? matchFactor(dir,  'sports') : 0
    const sMatch = star ? matchFactor(star, 'sports') : 0
    const focusH = (focus.bonusCat === 'sports' && focus.bonusH) ? focus.bonusH : 0
    const focusQ = (focus.bonusCat === 'sports' && focus.bonusQ) ? focus.bonusQ : 0
    const fameH = clamp((station.fame || 0) / 100, 0, 1) * 1.2

    return {
      quality: clamp(lg.baseQ + (dir?.q || 0) * dMatch + (star?.q || 0) * sMatch + focusQ, 1, 10),
      hype:    clamp(lg.baseH + (dir?.h || 0) * dMatch + (star?.h || 0) * sMatch + focusH + fameH + slotBonusH + seasonBonusH + peakBonus, 1, 10),
      tier:    isPeak ? 'Legendary' : 'Rare',
      slotBonusH, seasonBonusH, peakBonus, isPeak,
    }
  }

  if (planned.movieId) {
    const m = findMovie(planned.movieId)
    const mktg = MARKETING_TIERS.find(t => t.id === (planned.marketingId || 'none')) || MARKETING_TIERS[0]
    return {
      quality: clamp(m.q + mktg.q, 1, 10),
      hype:    clamp(m.h + mktg.h + slotBonusH + seasonBonusH, 1, 10),
      tier:    m.tier,
      slotBonusH, seasonBonusH,
    }
  }

  const cat = CATEGORIES[planned.categoryId]
  if (!cat) return { quality: 1, hype: 1, tier: 'Common', slotBonusH: 0, seasonBonusH: 0 }
  const topic = cat.topics.find(t => t.id === planned.topicId) || { q: 0, h: 0 }
  const dir   = findDirector(planned.directorId)
  const star  = findStar(planned.starId)
  const ip    = findIP(planned.ipId)
  const mktg  = MARKETING_TIERS.find(t => t.id === (planned.marketingId || 'none')) || MARKETING_TIERS[0]
  const focus = findFocus(station.focus) || {}

  const dMatch = matchFactor(dir,  planned.categoryId)
  const sMatch = matchFactor(star, planned.categoryId)

  const localBonus = (planned.categoryId === 'news' && planned.topicId === 'local' && station.market === 'local') ? 1.0 : 0
  const seqBonus = sequelBonusFor(planned) + (research?.sequelBonus && planned.seqSeason ? research.sequelBonus : 0)

  const ipFits = ip && ip.fits.includes(planned.categoryId)
  const ipQ = ipFits ? ip.q : (ip ? ip.q * 0.4 : 0)
  const ipH = ipFits ? ip.h : (ip ? ip.h * 0.4 : 0)

  const focusQ = (focus.bonusCat === planned.categoryId && focus.bonusQ) ? focus.bonusQ : 0
  const focusH = (focus.bonusCat === planned.categoryId && focus.bonusH) ? focus.bonusH : 0

  const fameH = clamp((station.fame || 0) / 100, 0, 1) * 1.2

  const quality = clamp(
    cat.base_q + topic.q
    + (dir?.q || 0) * dMatch
    + (star?.q || 0) * sMatch
    + ipQ + mktg.q + focusQ + localBonus + seqBonus,
    1, 10,
  )
  const hype = clamp(
    cat.base_h + topic.h
    + (dir?.h || 0) * dMatch
    + (star?.h || 0) * sMatch
    + ipH + mktg.h + focusH + fameH + slotBonusH + seasonBonusH,
    1, 10,
  )

  const tierIdx = Math.max(
    dir  ? TIERS.indexOf(dir.tier)  : -1,
    star ? TIERS.indexOf(star.tier) : -1,
    ip   ? TIERS.indexOf(ip.tier)   : -1,
    0,
  )
  const tier = TIERS[tierIdx]

  return { quality: r2(quality), hype: r2(hype), tier, slotBonusH, seasonBonusH }
}

// ─── AIRING ──────────────────────────────────────────────────────────────────
/** Air one month of a planned program. Returns the show entry to be logged. */
export function airShow(planned, station, research, monthIdx = 0) {
  const proj = projectShow(planned, station, research, monthIdx)
  const market = MARKETS[station.market]
  const slotType = SLOT_TYPES[planned.slotTypeId || 'prime']

  // Live noise — bigger swing on hype than quality.
  const qLive = clamp(proj.quality + rnd(-1.0, 1.0), 1, 10)
  const hLive = clamp(proj.hype    + rnd(-1.4, 1.4), 1, 10)

  const rating = clamp(qLive * 0.55 + hLive * 0.45 + rnd(-0.3, 0.3), 1, 10)

  const cap = market.audCap
  const next = market.nextFame || 100
  const fameFactor = clamp(0.35 + (station.fame / next) * 0.65, 0.35, 1.0)
  const appealNorm = (qLive * 0.45 + hLive * 0.55) / 10
  const compNoise = rnd(0.7, 1.05)
  const slotMult = slotType?.audienceMult || 1.0
  const audience = clamp(cap * appealNorm * fameFactor * compNoise * slotMult, 0.05, cap)

  const revenue = r2(audience * market.revPerViewer)

  return {
    ...planned,
    quality: r2(qLive),
    hype: r2(hLive),
    rating: r2(rating),
    tier: proj.tier,
    audience: r2(audience),
    revenue,
    monthIdx,
    isPeak: proj.isPeak || false,
    peakBonus: proj.peakBonus || 0,
    slotBonusH: proj.slotBonusH || 0,
    seasonBonusH: proj.seasonBonusH || 0,
  }
}

// ─── COMPETITOR STATIONS — PERSISTENT STATE ──────────────────────────────────
// Each competitor station has its own cash, fame, slots, active runs, history.
// They run a simple AI strategy each month: fill any empty slots with shows
// matching their focusCats (heavy preference) and other allowed categories.

/** Initialize competitor stations for a given market. Called at game start
 *  and on market promotion. Returns array of competitor objects. */
export function initCompetitors(marketId) {
  const defs = COMPETITORS[marketId] || []
  return defs.map(d => ({
    id: d.id,
    name: d.name,
    tier: d.tier,
    strength: d.strength,
    focusCats: d.focusCats || [],
    onlyCats: d.onlyCats || null,            // if set, ONLY these categories allowed
    slotTypeIds: [...d.slotTypeIds],
    cash: d.startCash,
    fame: d.startFame,
    activeRuns: [],                          // shows currently running
    yearAudienceTotal: 0,                    // cumulative audience this year
    yearAudienceLastYear: 0,                 // last year's total (for display)
    historyByYear: {},                       // year → { audienceTotal, showCount }
  }))
}

/** Generate a name for a competitor show given category. */
function generateShowName(categoryId) {
  const pool = SHOW_NAME_POOL[categoryId] || SHOW_NAME_POOL.series
  return pick(pool)
}

/** Pick a category for a competitor's new show, weighted by their focus. */
function pickCompetitorCategory(comp) {
  if (comp.onlyCats && comp.onlyCats.length > 0) {
    return pick(comp.onlyCats)
  }
  // 65% chance to pick from focusCats, 35% from any general category
  if (comp.focusCats.length > 0 && Math.random() < 0.65) {
    return pick(comp.focusCats)
  }
  const others = ['series', 'reality', 'movie', 'family', 'contest', 'sports']
    .filter(c => !comp.focusCats.includes(c))
  return pick(others.length > 0 ? others : comp.focusCats)
}

/** Pick a topic for the chosen category. */
function pickCompetitorTopic(categoryId) {
  const cat = CATEGORIES[categoryId]
  if (!cat || !cat.topics || cat.topics.length === 0) return null
  return pick(cat.topics).id
}

/** Plan a new run for a competitor (used when filling an empty slot). */
function planCompetitorRun(comp, slotTypeId) {
  const catId = pickCompetitorCategory(comp)
  const topicId = pickCompetitorTopic(catId)
  const cat = CATEGORIES[catId]
  // Movies always 1 month; other content random 3/6/12 weighted
  const months = catId === 'movie' ? 1 : pick([3, 3, 6, 6, 6, 12])
  const baseQ = (cat?.base_q || 5) + comp.strength * 1.5 + rnd(-0.5, 1.0)
  const baseH = (cat?.base_h || 4) + comp.strength * 1.4 + rnd(-0.5, 1.2)
  return {
    id: `${comp.id}_${uid()}`,
    slotTypeId,
    name: catId === 'movie' ? `Movie: ${generateShowName('series')}` : generateShowName(catId),
    categoryId: catId,
    topicId,
    runMonths: months,
    monthsAired: 0,
    aiHistory: [],
    baseQ: clamp(baseQ, 1, 10),
    baseH: clamp(baseH, 1, 10),
  }
}

/** Air one month for a competitor: top up empty slots, air all active runs, return airings. */
export function simulateCompetitorMonth(comp, monthIdx, year) {
  // Fill empty slots first
  const occupiedSlots = new Set(comp.activeRuns.filter(r => r.monthsAired < r.runMonths).map(r => r.slotTypeId))
  for (const slotId of comp.slotTypeIds) {
    if (!occupiedSlots.has(slotId)) {
      comp.activeRuns.push(planCompetitorRun(comp, slotId))
    }
  }

  // Air each active run
  const airings = []
  const expiredIds = []
  for (const run of comp.activeRuns) {
    if (run.monthsAired >= run.runMonths) { expiredIds.push(run.id); continue }
    // Compute quality/hype for this month — add small monthly noise
    const qLive = clamp(run.baseQ + rnd(-0.8, 0.8), 1, 10)
    const hLive = clamp(run.baseH + rnd(-1.0, 1.0), 1, 10)
    const rating = clamp(qLive * 0.55 + hLive * 0.45 + rnd(-0.3, 0.3), 1, 10)

    // Audience: similar shape to player but uses competitor's fame
    // Don't use station's market here directly because comp.market not stored — derive
    // we'll look it up by station context when called
    // For simplicity competitor audience is appeal * fame * noise * marketScale (passed in)
    airings.push({
      runId: run.id,
      stationId: comp.id,
      stationName: comp.name,
      slotTypeId: run.slotTypeId,
      categoryId: run.categoryId,
      topicId: run.topicId,
      name: run.name,
      quality: r2(qLive),
      hype: r2(hLive),
      rating: r2(rating),
      month: monthIdx,
      year,
    })
    run.aiHistory.push({ month: monthIdx, year, rating })
    run.monthsAired += 1
    if (run.monthsAired >= run.runMonths) expiredIds.push(run.id)
  }

  // Drop expired runs
  comp.activeRuns = comp.activeRuns.filter(r => !expiredIds.includes(r.id))

  return airings
}

/** Compute competitor audience for a month given their airings + market.
 *  Each show gets an audience based on its appeal + competitor's fame + market.
 *  Mutates the competitor's yearAudienceTotal. */
export function computeCompetitorAudience(comp, airings, market) {
  let totalAudience = 0
  let totalRevenue = 0
  for (const a of airings) {
    const slotType = SLOT_TYPES[a.slotTypeId] || SLOT_TYPES.prime
    const fameFactor = clamp(0.35 + (comp.fame / 100) * 0.65, 0.35, 1.0)
    const appealNorm = (a.quality * 0.45 + a.hype * 0.55) / 10
    const audience = clamp(
      market.audCap * appealNorm * fameFactor * (slotType.audienceMult || 1) * rnd(0.6, 1.0),
      0.05, market.audCap,
    )
    a.audience = r2(audience)
    a.revenue = r2(audience * market.revPerViewer)
    totalAudience += audience
    totalRevenue += audience * market.revPerViewer
  }
  comp.yearAudienceTotal += totalAudience

  // Fame tweak based on best show this month
  const best = airings.reduce((max, a) => Math.max(max, a.rating), 0)
  if (best >= 8.5) comp.fame += 0.4
  else if (best >= 7.0) comp.fame += 0.15
  else if (best <  4.0) comp.fame -= 0.2
  comp.fame = clamp(comp.fame, 0, 200)

  // Cash sim: revenue minus rough "operating cost" tied to slots
  const opCost = comp.slotTypeIds.length * 1.5
  comp.cash = r1(comp.cash + totalRevenue - opCost)
}

/** Record year-end: snapshot competitor's annual totals into history. */
export function rolloverCompetitorYear(comp, year) {
  comp.historyByYear[year] = {
    audienceTotal: r1(comp.yearAudienceTotal),
    fame: r1(comp.fame),
  }
  comp.yearAudienceLastYear = comp.yearAudienceTotal
  comp.yearAudienceTotal = 0
}

// ─── MONTHLY CYCLE ──────────────────────────────────────────────────────────
// A "run" is an active multi-month commitment on a slot:
//   {
//     id, slotTypeId,
//     // Either content fields:
//     name, categoryId, topicId, directorId, starId, ipId, marketingId, seqSeason, prevDirectorId, prevStarId,
//     // ...or movie:
//     movieId,
//     // ...or sports:
//     sportsRunLeagueId,
//     runMonths,         // total length 1/3/6/12
//     monthsAired,       // how many months it's already aired
//     monthlyCost,       // cached cost per month (paid each month it airs)
//   }
//
// Sports runs auto-skip out-of-season months (no cost, no airing); they still
// occupy the slot for the full year of the license.

/** Build a run object from a planned slot. */
export function planToRun(planned, station, research) {
  const monthly = programCost(planned, station, research)
  return {
    id: uid(),
    slotTypeId: planned.slotTypeId,
    name: planned.name || '',
    categoryId: planned.categoryId,
    topicId: planned.topicId,
    directorId: planned.directorId,
    starId: planned.starId,
    ipId: planned.ipId,
    marketingId: planned.marketingId || 'none',
    movieId: planned.movieId || null,
    sportsRunLeagueId: planned.sportsRunLeagueId || null,
    seqSeason: planned.seqSeason || 1,
    prevDirectorId: planned.prevDirectorId || null,
    prevStarId: planned.prevStarId || null,
    runMonths: planned.movieId ? 1 : (planned.sportsRunLeagueId ? 12 : (planned.runMonths || 1)),
    monthsAired: 0,
    monthlyCost: monthly,
    aiHistory: [],   // ratings per month for analytics
  }
}

/** Run one calendar month. Returns:
 *   { airings, totals, comps, expiredRunIds, station } */
export function runMonth(station, research, runs, monthIdx, year) {
  const market = MARKETS[station.market]
  const airings = []
  const expiredRunIds = []
  let totalCost = 0
  let totalRev  = 0
  let totalAud  = 0
  let fameDelta = 0

  // Air each active run
  for (const run of runs) {
    if (run.monthsAired >= run.runMonths) {
      expiredRunIds.push(run.id)
      continue
    }
    // Sports: skip if not in-season
    if (run.sportsRunLeagueId && !isSportsInSeason(run.sportsRunLeagueId, monthIdx)) {
      continue
    }

    const cost = run.monthlyCost
    const aired = airShow(run, station, research, monthIdx)
    aired.runId = run.id
    aired.month = monthIdx
    aired.year = year
    aired.seasonNumber = run.seqSeason || 1
    aired.cost = cost
    aired.net  = r2(aired.revenue - cost)
    airings.push(aired)

    totalCost += cost
    totalRev  += aired.revenue
    totalAud  += aired.audience

    if (aired.rating >= 8.5)      fameDelta += market.famePerWin * 1.0   // monthly, scaled vs old quarterly
    else if (aired.rating >= 7.0) fameDelta += market.famePerWin * 0.45
    else if (aired.rating >= 5.0) fameDelta += market.famePerWin * 0.12
    else if (aired.rating <  4.0) fameDelta -= 0.3

    run.aiHistory.push({ month: monthIdx, year, rating: aired.rating, audience: aired.audience, net: aired.net })
    run.monthsAired += 1
    if (run.monthsAired >= run.runMonths) {
      expiredRunIds.push(run.id)
    }
  }

  return {
    airings,
    totals: {
      cost: r1(totalCost),
      revenue: r1(totalRev),
      audience: r1(totalAud),
      net: r1(totalRev - totalCost),
      fameDelta: r2(fameDelta),
    },
    expiredRunIds,
  }
}

/** Cancel a run mid-flight. Returns refund cost (50% of remaining months' cost). */
export function cancelRunCost(run) {
  const remaining = Math.max(0, (run.runMonths || 1) - (run.monthsAired || 0))
  return r1(remaining * (run.monthlyCost || 0) * CANCEL_REFUND_MULT)
}

// ─── AWARDS ──────────────────────────────────────────────────────────────────
// New formula: best-in-category combines quality (75%), hype (20%), randomness (5%).
// Awards: most-watched (top audience), best-overall (top by formula), and per-category winners.
function awardScore(show) {
  return show.quality * 0.75 + show.hype * 0.20 + rnd(0, 0.5)
}

export function buildAwards(yearShows, station) {
  const market = MARKETS[station.market]
  const fameBar = 7.0 + clamp((station.fame - market.fameThreshold) / 50, 0, 1.5)

  // Score each show
  const scored = yearShows.map(s => ({ ...s, _awardScore: awardScore(s) }))

  // Best per category — using awardScore
  const byCat = {}
  scored.forEach(s => {
    const cat = s.sportsRunLeagueId ? 'sports' : (s.movieId ? 'movie' : s.categoryId)
    if (!cat) return
    if (!byCat[cat] || byCat[cat]._awardScore < s._awardScore) byCat[cat] = s
  })

  const wins = []
  Object.entries(byCat).forEach(([cat, show]) => {
    if (show._awardScore >= fameBar) {
      wins.push({
        category: cat,
        showName: show.name,
        showId: show.id,
        rating: show.rating,
        quality: show.quality,
        hype: show.hype,
        awardScore: r2(show._awardScore),
        fameBonus: 4,
        cashBonus: 6,
      })
    }
  })

  // Best overall — top awardScore
  const topScore = [...scored].sort((a, b) => b._awardScore - a._awardScore)[0]
  const bestOverall = topScore && topScore._awardScore >= fameBar + 0.5
    ? {
        showName: topScore.name, showId: topScore.id,
        rating: topScore.rating, awardScore: r2(topScore._awardScore),
        fameBonus: 8, cashBonus: 12,
      }
    : null

  // Most-watched — top audience (single best month)
  const topAud = [...yearShows].sort((a, b) => b.audience - a.audience)[0]
  const mostWatched = topAud
    ? { showName: topAud.name, showId: topAud.id, audience: topAud.audience, fameBonus: 5, cashBonus: 8 }
    : null

  return { wins, bestOverall, mostWatched, fameBar: r2(fameBar) }
}

// ─── RESEARCH STATE ──────────────────────────────────────────────────────────
export function applyResearch(researchState, researchId) {
  const r = RESEARCH.find(x => x.id === researchId)
  if (!r) return { research: researchState, addSlotType: null, refreshRoster: false }

  const next = { ...researchState }
  next.unlocked = [...(researchState.unlocked || []), researchId]
  next.contentUnlocks = [...(researchState.contentUnlocks || [])]

  let addSlotType = null
  let refreshRoster = false

  Object.entries(r.effect || {}).forEach(([k, v]) => {
    if (k === 'refreshRoster') { refreshRoster = true; return }
    if (k === 'addSlot') { addSlotType = v; return }
    if (k === 'unlockContent') {
      for (const pair of v) {
        const exists = next.contentUnlocks.some(p => p[0] === pair[0] && p[1] === pair[1])
        if (!exists) next.contentUnlocks.push(pair)
      }
      return
    }
    next[k] = v
  })
  return { research: next, addSlotType, refreshRoster }
}

export function canResearch(researchId, researchState) {
  const r = RESEARCH.find(x => x.id === researchId)
  if (!r) return false
  const unlocked = researchState.unlocked || []
  if (!r.repeatable && unlocked.includes(researchId)) return false
  if (r.requires && !r.requires.every(req => unlocked.includes(req))) return false
  return true
}

// ─── MARKETS / PROMOTION ─────────────────────────────────────────────────────
export function canPromote(station) {
  const idx = MARKET_ORDER.indexOf(station.market)
  if (idx === MARKET_ORDER.length - 1) return false
  const next = MARKETS[MARKET_ORDER[idx + 1]]
  return station.fame >= next.fameThreshold
}

export function promotedMarket(station) {
  const idx = MARKET_ORDER.indexOf(station.market)
  if (idx === MARKET_ORDER.length - 1) return station.market
  return MARKET_ORDER[idx + 1]
}

// ─── INIT ────────────────────────────────────────────────────────────────────
function pickStartingTalent(list, focusCat, n) {
  const flexibleCats = ['series', 'reality', 'latenight', 'news', 'family', 'kids']
  const tiers = [
    list.filter(t => t.tier === 'Common'   && t.specialty === focusCat),
    list.filter(t => t.tier === 'Uncommon' && t.specialty === focusCat),
    list.filter(t => t.tier === 'Common'   && flexibleCats.includes(t.specialty) && t.specialty !== focusCat),
  ]
  const picked = []
  const seen = new Set()
  for (const pool of tiers) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    for (const t of shuffled) {
      if (picked.length >= n) break
      if (seen.has(t.id)) continue
      seen.add(t.id)
      picked.push(t)
    }
    if (picked.length >= n) break
  }
  return picked
}

export function initGame(setup) {
  const focus = findFocus(setup.focusId) || FOCUSES[0]
  const startingCash = 40 + (focus.bonusCash || 0)   // bumped up since 12 months/year now

  const focusCat = focus.bonusCat || 'series'
  const startDirs  = pickStartingTalent(DIRECTORS, focusCat, 2)
  const startStars = pickStartingTalent(STARS,    focusCat, 3)

  // Starting contracts: 12 free months (1 year) on standard contract.
  const makeStartContract = (talent, role) => ({
    talentId: talent.id,
    role,
    contractType: 'c12',
    permanent: false,
    monthsLeft: 12,
    perMonthCharge: 0,
    upfrontPaid: 0,
  })

  const station = {
    name: setup.name || 'My Station',
    focus: focus.id,
    market: 'local',
    fame: 5,
    cash: startingCash,
    hiredDirectors: startDirs.map(t => makeStartContract(t, 'director')),
    hiredStars:     startStars.map(t => makeStartContract(t, 'star')),
    slotIds: [...DEFAULT_SLOT_IDS],
    sportsLicenses: [],   // {leagueId, year}
  }

  return {
    phase: 'plan',
    station,
    monthIdx: 0,
    year: 1,
    runs: [],                                            // active multi-month commitments
    plans: station.slotIds.map(id => emptyPlanned(id)),  // per-slot draft for empty slots
    yearShows: [],                                       // all aired (this year) for awards
    allShows: [],                                        // all aired (history, all years) — yours
    competitorAllShows: [],                              // all aired (history, all years) — them
    competitors: initCompetitors('local'),               // persistent competitor stations
    marketRoster: buildMarketRoster(station, 0),
    scoutLevel: 0,
    research: { unlocked: [], contentUnlocks: [] },
    awards: null,
    lastMonthResult: null,
    ownedShows: [],                                      // finished shows, eligible for renewal
    log: [
      `📡 ${station.name} broadcasting on ${MARKETS.local.label}`,
      `Free starting roster: ${startDirs.length} directors, ${startStars.length} stars (12-month contracts)`,
      `Year 1 · January — plan your first month`,
    ],
  }
}

export function emptyPlanned(slotTypeId = 'prime') {
  return {
    slotTypeId,
    name: '',
    categoryId: null,
    topicId: null,
    directorId: null,
    starId: null,
    ipId: null,
    marketingId: 'none',
    movieId: null,
    sportsRunLeagueId: null,
    runMonths: 1,
    seqSeason: 1,
    prevDirectorId: null,
    prevStarId: null,
    fromOwnedId: null,
  }
}

// ─── FAME LABEL ──────────────────────────────────────────────────────────────
export function fameLabel(fame) {
  if (fame < 10) return 'Unknown'
  if (fame < 25) return 'Rising'
  if (fame < 40) return 'Established'
  if (fame < 60) return 'Renowned'
  if (fame < 85) return 'Acclaimed'
  return 'Legendary'
}
