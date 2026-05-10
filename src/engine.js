/**
 * engine.js — Pure game logic for the playable TV Empire.
 * No React. Side-effect free. All randomness via Math.random.
 */

import {
  CATEGORIES, MARKETS, MARKET_ORDER, MARKETING_TIERS,
  DIRECTORS, STARS, IPS, MOVIES, COMPETITORS, FOCUSES, RESEARCH,
  TIERS, CYCLES_PER_YEAR,
  SLOT_TYPES, DEFAULT_SLOT_IDS, SEASONAL_PREFS,
  defaultUnlocks, CONTRACT_TYPES, FIRE_PENALTY_MULT,
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

// ─── TALENT LOOKUPS ──────────────────────────────────────────────────────────
export const findDirector = id => DIRECTORS.find(d => d.id === id) || null
export const findStar     = id => STARS.find(s => s.id === id) || null
export const findIP       = id => IPS.find(i => i.id === id) || null
export const findMovie    = id => MOVIES.find(m => m.id === id) || null
export const findFocus    = id => FOCUSES.find(f => f.id === id) || null

// ─── ROSTER GENERATION ───────────────────────────────────────────────────────
/**
 * The full talent universe is large. Each year we expose a "roster" — a
 * fraction of it — to the player. Higher tiers are rarer.
 * Common: 80% chance · Uncommon: 60% · Rare: 40% · Epic: 20% · Legendary: 8%.
 * After research (talent scout) we expose more.
 */
const TIER_EXPOSURE = {
  Common:    0.80,
  Uncommon:  0.60,
  Rare:      0.40,
  Epic:      0.20,
  Legendary: 0.08,
}

export function buildRoster(scoutLevel = 0) {
  const bonus = scoutLevel * 0.15  // each scout level adds 15%
  const expose = (list) => list.filter(t => Math.random() < clamp(TIER_EXPOSURE[t.tier] + bonus, 0, 1))
  return {
    directors: expose(DIRECTORS),
    stars:     expose(STARS),
  }
}

// ─── CONTENT UNLOCKS (focus + research) ──────────────────────────────────────
/**
 * What categories/topics can the player choose? Returns:
 *   { byCat: { [catId]: Set<topicId> | '*' }, hasCat: (id)=>bool, hasTopic: (catId, topicId)=>bool }
 */
export function getUnlocks(station, research) {
  const focusUnlocks = defaultUnlocks(station.focus || 'general')
  const researchUnlocks = research?.contentUnlocks || []   // [[catId, topicId|'*'], ...]
  const all = [...focusUnlocks, ...researchUnlocks]

  const byCat = {}   // catId → Set<topicId> | '*'
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

// ─── HIRED-TALENT HELPERS ────────────────────────────────────────────────────
/** Find a hired record (with contract info) by talent id. */
export const findHired = (station, role, talentId) => {
  const list = role === 'director' ? station.hiredDirectors : station.hiredStars
  return (list || []).find(h => h.talentId === talentId) || null
}

/** Cost to sign a contract right now (one-time charge for fixed-length contracts;
 *  for permanent it returns the per-cycle charge — caller charges that going forward). */
export function contractCost(talent, contractTypeId) {
  const ct = CONTRACT_TYPES.find(c => c.id === contractTypeId)
  if (!ct) return 0
  if (ct.cycles === -1) return r1(talent.cost * ct.costMult)   // permanent: charge per cycle
  return r1(talent.cost * ct.costMult)                         // fixed: pay full upfront
}

/** True if a hired record is still on contract (has cycles left or is permanent) */
export const isActiveContract = (h) => h && (h.permanent || h.cyclesLeft > 0)

/** Tick contracts forward by one cycle. Permanent contracts charge per cycle.
 *  Returns { newDirectors, newStars, perCycleCharge } */
export function tickContracts(station) {
  let charge = 0
  const tick = (list) => list.map(h => {
    if (h.permanent) {
      charge += h.perCycleCharge || 0
      return h
    }
    return { ...h, cyclesLeft: Math.max(0, h.cyclesLeft - 1) }
  }).filter(h => h.permanent || h.cyclesLeft > 0)

  return {
    hiredDirectors: tick(station.hiredDirectors || []),
    hiredStars:     tick(station.hiredStars     || []),
    perCycleCharge: r1(charge),
  }
}

/** Hire a talent on a contract. Returns updated station + immediate cash debit. */
export function hireTalent(station, role, talent, contractTypeId) {
  const ct = CONTRACT_TYPES.find(c => c.id === contractTypeId)
  if (!ct) return { station, charged: 0, error: 'Bad contract type' }
  const list = role === 'director' ? (station.hiredDirectors || []) : (station.hiredStars || [])
  if (list.find(h => h.talentId === talent.id)) {
    return { station, charged: 0, error: 'Already hired' }
  }

  const upfront = ct.cycles === -1 ? talent.cost * ct.costMult : talent.cost * ct.costMult
  if (station.cash < upfront) return { station, charged: 0, error: 'Not enough cash' }

  const record = {
    talentId: talent.id,
    role,
    contractType: contractTypeId,
    permanent: ct.cycles === -1,
    cyclesLeft: ct.cycles === -1 ? null : ct.cycles,
    perCycleCharge: ct.cycles === -1 ? r1(talent.cost * ct.costMult) : 0,
    upfrontPaid: ct.cycles === -1 ? 0 : r1(upfront),
  }
  const newStation = {
    ...station,
    cash: r1(station.cash - upfront),
    hiredDirectors: role === 'director' ? [...(station.hiredDirectors || []), record] : (station.hiredDirectors || []),
    hiredStars:     role === 'star'     ? [...(station.hiredStars     || []), record] : (station.hiredStars || []),
  }
  return { station: newStation, charged: r1(upfront), error: null }
}

/** Fire a hired talent. If permanent: pay 5× per-cycle penalty.
 *  If fixed-length: pay 1× remaining-cycle cost as a kill fee.
 *  Returns updated station + penalty charged. */
export function fireTalent(station, role, talentId) {
  const list = role === 'director' ? (station.hiredDirectors || []) : (station.hiredStars || [])
  const rec = list.find(h => h.talentId === talentId)
  if (!rec) return { station, charged: 0, error: 'Not hired' }

  const talent = role === 'director' ? findDirector(talentId) : findStar(talentId)
  let penalty = 0
  if (rec.permanent) {
    penalty = r1((rec.perCycleCharge || talent?.cost || 0) * FIRE_PENALTY_MULT)
  } else {
    // forfeit a fraction proportional to remaining cycles, but cap at 1× full cost
    penalty = r1(Math.min(talent?.cost || 0, (rec.cyclesLeft || 0) * (talent?.cost || 0) * 0.4))
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

/** The "hired roster" the SlotEditor uses — only talent on active contract. */
export function activeRoster(station) {
  const dirs = (station.hiredDirectors || [])
    .filter(isActiveContract)
    .map(h => findDirector(h.talentId)).filter(Boolean)
  const stars = (station.hiredStars || [])
    .filter(isActiveContract)
    .map(h => findStar(h.talentId)).filter(Boolean)
  return { directors: dirs, stars }
}

/** The "market roster" — talent available to hire this year (not already hired).
 *  This is the year-refreshed pool, biased by tier exposure + scout level. */
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

// ─── SLOT TYPE / SEASONAL HELPERS ────────────────────────────────────────────
/** Get the seasonal pref entry for a slot+quarter. */
export function getSeasonalPref(slotTypeId, cycleIdx) {
  const arr = SEASONAL_PREFS[slotTypeId]
  if (!arr) return null
  return arr[cycleIdx] || null
}

/** Slot-type bonus: matchBonus to hype if slot prefers this category. */
function slotTypeBonus(slotTypeId, categoryId) {
  const slot = SLOT_TYPES[slotTypeId]
  if (!slot) return 0
  return (slot.prefersCategory.includes(categoryId)) ? slot.matchBonus : 0
}

/** Seasonal-pref bonus: matchBonus if planned matches the season for this slot. */
function seasonalBonus(slotTypeId, cycleIdx, planned) {
  const pref = getSeasonalPref(slotTypeId, cycleIdx)
  if (!pref) return 0
  const catMatch = pref.categoryId === planned.categoryId
  const topicMatch = pref.topicId == null || pref.topicId === planned.topicId
  // For movies, treat 'movie' category as a category match; topic ignored.
  if (planned.movieId && pref.categoryId === 'movie') return pref.bonusH || 0
  if (catMatch && topicMatch) return pref.bonusH || 0
  return 0
}


/**
 * Production base cost — the "you printed it on tape" cost before talent.
 * Scales with market complexity.
 */
export function baseProductionCost(categoryId, marketId) {
  const cat = CATEGORIES[categoryId]
  const market = MARKETS[marketId]
  const marketMult = market.id === 'local' ? 0.7 : market.id === 'metro' ? 1.0 : 1.4
  return r1(1.0 * cat.cost_mult * marketMult)
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

/**
 * Total projected cost for a planned program.
 * planned = { categoryId, topicId, directorId?, starId?, ipId?, marketingId?, movieId? }
 */
export function programCost(planned, stationOrMarket, research) {
  // Accept either a station (with .market) or a market object directly.
  const market = stationOrMarket?.market && typeof stationOrMarket.market === 'string'
    ? MARKETS[stationOrMarket.market]
    : stationOrMarket
  const slot = SLOT_TYPES[planned.slotTypeId || 'prime']
  const slotMult = slot?.costMult || 1.0

  if (planned.movieId) {
    const m = findMovie(planned.movieId)
    return r1(((m?.cost || 0) * slotMult) + marketingCost(planned.marketingId || 'none', market.id, research))
  }
  const base   = baseProductionCost(planned.categoryId, market.id) * slotMult
  // NOTE: director/star are NOT charged per-program — you pay them via contracts
  // when you hire them. This is just production base + IP + marketing.
  const ip     = ipCost(planned.ipId, research)
  const mktg   = marketingCost(planned.marketingId || 'none', market.id, research)
  return r1(base + ip + mktg)
}

// ─── QUALITY & HYPE PROJECTION ───────────────────────────────────────────────
/**
 * Specialty match factor.
 *   1.0 — talent specialty == category
 *   0.4 — mismatch (still contributes a little)
 */
function matchFactor(talent, categoryId) {
  if (!talent) return 0
  return talent.specialty === categoryId ? 1.0 : 0.4
}

/**
 * Compute the projected (deterministic) quality+hype for a planned program.
 * Used in the planning UI to preview. Live results add noise (computeAir).
 */
export function projectShow(planned, station, research, cycleIdx = 0) {
  // Slot-type & seasonal bonuses (apply to both movie and scripted)
  const slotTypeId = planned.slotTypeId || 'prime'
  const slotBonusH = slotTypeBonus(slotTypeId, planned.movieId ? 'movie' : planned.categoryId)
  const seasonBonusH = seasonalBonus(slotTypeId, cycleIdx, planned)

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

  const cat   = CATEGORIES[planned.categoryId]
  if (!cat) return { quality: 1, hype: 1, tier: 'Common', slotBonusH: 0, seasonBonusH: 0 }
  const topic = cat.topics.find(t => t.id === planned.topicId) || { q: 0, h: 0 }
  const dir   = findDirector(planned.directorId)
  const star  = findStar(planned.starId)
  const ip    = findIP(planned.ipId)
  const mktg  = MARKETING_TIERS.find(t => t.id === (planned.marketingId || 'none')) || MARKETING_TIERS[0]
  const focus = findFocus(station.focus) || {}

  const dMatch = matchFactor(dir,  planned.categoryId)
  const sMatch = matchFactor(star, planned.categoryId)

  // Local-news topic gives a big quality bump if station is in local market (relevance)
  const localBonus = (planned.categoryId === 'news' && planned.topicId === 'local' && station.market === 'local') ? 1.0 : 0

  // Sequel bonus
  const seqBonus = planned.seqSeason && research?.sequelBonus ? research.sequelBonus : 0

  // IP fits this category?
  const ipFits = ip && ip.fits.includes(planned.categoryId)
  const ipQ = ipFits ? ip.q : (ip ? ip.q * 0.4 : 0)
  const ipH = ipFits ? ip.h : (ip ? ip.h * 0.4 : 0)

  // Focus bonus
  const focusQ = (focus.bonusCat === planned.categoryId && focus.bonusQ) ? focus.bonusQ : 0
  const focusH = (focus.bonusCat === planned.categoryId && focus.bonusH) ? focus.bonusH : 0

  // Fame contribution to hype
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

  // Pick a "tier" badge for display: use the max of director/star/ip/movie tier.
  const tierIdx = Math.max(
    dir  ? TIERS.indexOf(dir.tier)  : -1,
    star ? TIERS.indexOf(star.tier) : -1,
    ip   ? TIERS.indexOf(ip.tier)   : -1,
    0,
  )
  const tier = TIERS[tierIdx]

  return { quality: r2(quality), hype: r2(hype), tier, slotBonusH, seasonBonusH }
}

// ─── AIRING — RUN THE CYCLE ──────────────────────────────────────────────────
/**
 * Compute the live aired version of a show. Adds noise to quality & hype,
 * computes audience, revenue, and a 0-10 rating for awards.
 */
export function airShow(planned, station, research, cycleIdx = 0) {
  const proj = projectShow(planned, station, research, cycleIdx)
  const market = MARKETS[station.market]
  const slotType = SLOT_TYPES[planned.slotTypeId || 'prime']

  // Live noise — this is where Lady Luck lives. Bigger swing on hype than quality.
  // Audience tunes randomness to be felt: a great projection can flop, a mediocre one can hit.
  const qLive = clamp(proj.quality + rnd(-1.2, 1.2), 1, 10)
  const hLive = clamp(proj.hype    + rnd(-1.5, 1.5), 1, 10)

  // Rating = blend
  const rating = clamp(qLive * 0.55 + hLive * 0.45 + rnd(-0.35, 0.35), 1, 10)

  // Audience: appeal × fame_factor × slot_mult × competition_noise
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
    slotBonusH: proj.slotBonusH || 0,
    seasonBonusH: proj.seasonBonusH || 0,
  }
}

/**
 * Compute competitor "shadow" performances for the cycle — for audience
 * leaderboard flavor. Not used for direct ranking yet but useful for ticker.
 */
export function airCompetitors(market) {
  const comps = COMPETITORS[market.id] || []
  return comps.map(c => {
    const audience = r2(market.audCap * c.strength * 0.5 * rnd(0.55, 1.0))
    return { name: c.name, audience, rating: r2(rnd(4, 8)) }
  })
}

// ─── CYCLE RESOLUTION ────────────────────────────────────────────────────────
/**
 * Take a list of planned shows and return:
 *   { shows: [...aired], totals: { cost, revenue, net, fame_delta }, comps: [...] }
 */
export function runCycle(plannedShows, station, research, cycleIdx = 0) {
  const market = MARKETS[station.market]
  const aired = plannedShows.filter(p => p && (p.categoryId || p.movieId)).map(p => {
    const cost = programCost(p, market, research)
    const live = airShow(p, station, research, cycleIdx)
    return { ...live, cost, net: r2(live.revenue - cost) }
  })

  const totalCost    = r1(aired.reduce((a, x) => a + x.cost, 0))
  const totalRev     = r1(aired.reduce((a, x) => a + x.revenue, 0))
  const totalAud     = r1(aired.reduce((a, x) => a + x.audience, 0))
  const net          = r1(totalRev - totalCost)

  // Fame delta — sum per-show fame events
  let fameDelta = 0
  aired.forEach(s => {
    if (s.rating >= 8.5)      fameDelta += market.famePerWin * 2.0
    else if (s.rating >= 7.0) fameDelta += market.famePerWin
    else if (s.rating >= 5.0) fameDelta += market.famePerWin * 0.25
    else if (s.rating <  4.0) fameDelta -= 0.6
  })
  fameDelta = r2(fameDelta)

  const comps = airCompetitors(market)

  return {
    shows: aired,
    totals: { cost: totalCost, revenue: totalRev, audience: totalAud, net, fameDelta },
    comps,
  }
}

// ─── AWARDS ──────────────────────────────────────────────────────────────────
/**
 * Year-end awards based on the year's accumulated shows.
 * Returns awards object with bonuses applied by the caller.
 *
 * Awards in the playable game are STATION-vs-COMPETITORS (we award the player
 * for each category if their best in that category beats a fame-scaled bar).
 */
export function buildAwards(yearShows, station) {
  const market = MARKETS[station.market]
  const fameBar = 7.0 + clamp((station.fame - market.fameThreshold) / 50, 0, 1.5)  // higher fame = higher bar... but you've got more capability too

  const byCat = {}
  yearShows.forEach(s => {
    const cat = s.categoryId
    if (!byCat[cat] || byCat[cat].rating < s.rating) byCat[cat] = s
  })

  const wins = []
  Object.entries(byCat).forEach(([cat, show]) => {
    if (show.rating >= fameBar) {
      wins.push({
        category: cat,
        showName: show.name,
        showId: show.id,
        rating: show.rating,
        fameBonus: 4,
        cashBonus: 6,
      })
    }
  })

  // Best-in-show
  const top = [...yearShows].sort((a, b) => b.rating - a.rating)[0]
  const bestOverall = top && top.rating >= fameBar + 0.5
    ? { showName: top.name, showId: top.id, rating: top.rating, fameBonus: 8, cashBonus: 12 }
    : null

  return { wins, bestOverall, fameBar: r2(fameBar) }
}

// ─── RESEARCH STATE HELPERS ──────────────────────────────────────────────────
export function applyResearch(researchState, researchId) {
  const r = RESEARCH.find(x => x.id === researchId)
  if (!r) return researchState
  const next = { ...researchState }
  next.unlocked = [...(researchState.unlocked || []), researchId]
  Object.entries(r.effect || {}).forEach(([k, v]) => {
    if (k === 'refreshRoster') return  // handled by caller
    next[k] = v
  })
  return next
}

export function canResearch(researchId, researchState) {
  const r = RESEARCH.find(x => x.id === researchId)
  if (!r) return false
  const unlocked = researchState.unlocked || []
  if (!r.repeatable && unlocked.includes(researchId)) return false
  if (r.requires && !r.requires.every(req => unlocked.includes(req))) return false
  return true
}

// ─── MARKET PROMOTION ────────────────────────────────────────────────────────
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

// ─── GAME INIT ────────────────────────────────────────────────────────────────
/** Pick `n` Common-tier talents whose specialty matches the focus category.
 *  Used for the free starting roster. */
function pickStartingTalent(list, focusCat, n) {
  // Strongly prefer Common-tier in the focus specialty. If we still need more,
  // fall back to: Uncommon in focus specialty → Common in flexible categories
  // (latenight/news/movie are decent for any station). If we still don't fill,
  // give up — better to start with fewer than to give the player unusable talent.
  const flexibleCats = ['series', 'reality', 'latenight', 'news', 'family']
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
  const startingCash = 30 + (focus.bonusCash || 0)

  // Starting hired roster: 2 directors + 3 stars in your specialty (or general
  // fallback if your focus is "general"). Each on a free 4-cycle contract.
  const focusCat = focus.bonusCat || 'series'
  const startDirs  = pickStartingTalent(DIRECTORS, focusCat, 2)
  const startStars = pickStartingTalent(STARS,    focusCat, 3)

  const makeStartContract = (talent, role) => ({
    talentId: talent.id,
    role,
    contractType: 'c4',
    permanent: false,
    cyclesLeft: 4,
    perCycleCharge: 0,
    upfrontPaid: 0,         // free starting roster
  })

  const station = {
    name: setup.name || 'My Station',
    focus: focus.id,
    market: 'local',
    fame: 5,
    cash: startingCash,
    hiredDirectors: startDirs.map(t => makeStartContract(t, 'director')),
    hiredStars:     startStars.map(t => makeStartContract(t, 'star')),
    slotIds: [...DEFAULT_SLOT_IDS],   // ['morning', 'prime', 'weekend']
  }

  return {
    phase: 'plan',
    station,
    cycleIdx: 0,
    year: 1,
    plans: station.slotIds.map(id => emptyPlanned(id)),  // per-slot planned program
    cycleHistory: [],
    yearShows: [],
    marketRoster: buildMarketRoster(station, 0),         // talent available to hire
    scoutLevel: 0,
    research: { unlocked: [], contentUnlocks: [] },
    awards: null,
    lastResults: null,
    ownedShows: [],
    log: [
      `📡 ${station.name} broadcasting on ${MARKETS.local.label}`,
      `Free starting roster: ${startDirs.length} directors, ${startStars.length} stars (4-cycle contracts)`,
      `Year 1 · Q1 — plan your first cycle`,
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
    seqSeason: null,
    fromOwnedId: null,
  }
}

// ─── FAME → STATION REPUTATION LABEL ─────────────────────────────────────────
export function fameLabel(fame) {
  if (fame < 10) return 'Unknown'
  if (fame < 25) return 'Rising'
  if (fame < 40) return 'Established'
  if (fame < 60) return 'Renowned'
  if (fame < 85) return 'Acclaimed'
  return 'Legendary'
}
