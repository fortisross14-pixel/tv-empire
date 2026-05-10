/**
 * engine.js — Pure game logic for the playable TV Empire.
 * No React. Side-effect free. All randomness via Math.random.
 */

import {
  CATEGORIES, MARKETS, MARKET_ORDER, MARKETING_TIERS,
  DIRECTORS, STARS, IPS, MOVIES, COMPETITORS, FOCUSES, RESEARCH,
  TIERS, CYCLES_PER_YEAR,
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

// ─── COST HELPERS ────────────────────────────────────────────────────────────
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
export function programCost(planned, market, research) {
  if (planned.movieId) {
    const m = findMovie(planned.movieId)
    return r1((m?.cost || 0) + marketingCost(planned.marketingId || 'none', market.id, research))
  }
  const base   = baseProductionCost(planned.categoryId, market.id)
  const dir    = findDirector(planned.directorId)
  const star   = findStar(planned.starId)
  const ip     = ipCost(planned.ipId, research)
  const mktg   = marketingCost(planned.marketingId || 'none', market.id, research)
  return r1(base + (dir?.cost || 0) + (star?.cost || 0) + ip + mktg)
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
export function projectShow(planned, station, research) {
  if (planned.movieId) {
    const m = findMovie(planned.movieId)
    const focusBonus = (station.focus === 'general' || !m) ? 0 : 0
    const mktg = MARKETING_TIERS.find(t => t.id === (planned.marketingId || 'none')) || MARKETING_TIERS[0]
    return {
      quality: clamp(m.q + mktg.q, 1, 10),
      hype:    clamp(m.h + mktg.h, 1, 10),
      tier:    m.tier,
    }
  }

  const cat   = CATEGORIES[planned.categoryId]
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
    + ipH + mktg.h + focusH + fameH,
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

  return { quality: r2(quality), hype: r2(hype), tier }
}

// ─── AIRING — RUN THE CYCLE ──────────────────────────────────────────────────
/**
 * Compute the live aired version of a show. Adds noise to quality & hype,
 * computes audience, revenue, and a 0-10 rating for awards.
 */
export function airShow(planned, station, research) {
  const proj = projectShow(planned, station, research)
  const market = MARKETS[station.market]

  // Live noise — this is where Lady Luck lives
  const qLive = clamp(proj.quality + rnd(-0.7, 0.7), 1, 10)
  const hLive = clamp(proj.hype    + rnd(-0.9, 0.9), 1, 10)

  // Rating = blend
  const rating = clamp(qLive * 0.55 + hLive * 0.45 + rnd(-0.3, 0.3), 1, 10)

  // Audience: appeal × fame_factor × competition_noise
  // fame_factor: 0.35 → 1.0 as fame goes from 0 → next-tier threshold
  const cap = market.audCap
  const next = market.nextFame || 100
  const fameFactor = clamp(0.35 + (station.fame / next) * 0.65, 0.35, 1.0)
  const appealNorm = (qLive * 0.45 + hLive * 0.55) / 10  // hype matters slightly more for raw audience
  const compNoise = rnd(0.7, 1.05)
  const audience = clamp(cap * appealNorm * fameFactor * compNoise, 0.05, cap)

  const revenue = r2(audience * market.revPerViewer)

  return {
    ...planned,
    quality: r2(qLive),
    hype: r2(hLive),
    rating: r2(rating),
    tier: proj.tier,
    audience: r2(audience),
    revenue,
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
export function runCycle(plannedShows, station, research) {
  const market = MARKETS[station.market]
  const aired = plannedShows.filter(p => p && p.categoryId).map(p => {
    const cost = programCost(p, market, research)
    const live = airShow(p, station, research)
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
export function initGame(setup) {
  const focus = findFocus(setup.focusId) || FOCUSES[0]
  const startingCash = 30 + (focus.bonusCash || 0)
  const station = {
    name: setup.name || 'My Station',
    focus: focus.id,
    market: 'local',
    fame: 5,
    cash: startingCash,
  }

  // Free starting talent for focused stations: mark as "rostered" but at no
  // hire-cost-discount — just guarantee it's exposed.
  const roster = buildRoster(0)

  return {
    phase: 'plan',
    station,
    cycleIdx: 0,
    year: 1,
    numSlots: 3,
    slots: Array(3).fill(null).map(() => emptyPlanned()),
    cycleHistory: [],
    yearShows: [],
    roster,
    scoutLevel: 0,
    research: { unlocked: [] },
    awards: null,
    lastResults: null,
    ownedShows: [],   // shows eligible for renewal { name, categoryId, topicId, lastQuality, lastHype, lastRating, lastSeqSeason }
    log: [`📡 ${station.name} broadcasting on ${MARKETS.local.label}`, 'Year 1 · Q1 — plan your first cycle'],
  }
}

export function emptyPlanned() {
  return {
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
