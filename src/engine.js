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
  DEMOS, DEMO_ORDER, TOPIC_APPEAL_OVERRIDES,
  AUDIO_TIERS, SUBTITLE_TIERS, VIDEO_TIERS,
  STAFF_ROLES, STAFF_EFFECTS, STAFF_FIRST_NAMES, STAFF_LAST_NAMES,
  SEARCH_TIERS, STAFF_MONTHLY_SALARY,
  IP_LICENSE_TERMS, NETWORK_CAMPAIGNS,
  MOVIE_PACK_REBUY_HYPE_PENALTY, MOVIE_PACK_COOLDOWN_MONTHS,
  SCRIPT_TIERS, findScriptTier, SCRIPT_TIER_RANK, STAR_TIER_MAX_FOR_SCRIPT,
  WRITERS, WRITERS_CAP, SCRIPT_HYPE_DECAY, SCRIPT_HYPE_MIN, SCRIPT_HYPE_MAX,
  PROD_DESIGN_TIERS, SFX_TIERS, PRODUCTION_METHODS,
  AFFINITY_GOOD_Q, AFFINITY_GOOD_H, AFFINITY_BAD_Q, AFFINITY_BAD_COST_MULT,
  LIVE_PREP_FRACTION, LIVE_AIRING_FRACTION,
  PREPRODUCED_TRANSMISSION_FRACTION, MOVIE_EDITING_FRACTION,
  ESTIMATION_RANGE,
  MUSIC_TIERS, CATEGORY_QUALITY_WEIGHTS, REVIEW_TEMPLATES,
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
export const findWriter   = id => WRITERS.find(w => w.id === id) || null
export const findIP       = id => IPS.find(i => i.id === id) || null
export const findProdDesign = id => PROD_DESIGN_TIERS.find(p => p.id === id) || null
export const findSfx        = id => SFX_TIERS.find(s => s.id === id) || null
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
  let talentCharge = 0
  let writerCharge = 0
  const tick = (list) => list.map(h => {
    if (h.permanent) {
      talentCharge += h.perMonthCharge || 0
      return h
    }
    return { ...h, monthsLeft: Math.max(0, h.monthsLeft - 1) }
  }).filter(h => h.permanent || h.monthsLeft > 0)

  // Writers are always permanent. Each one always charges its perMonthCharge.
  const tickWriters = (list) => list.map(h => {
    writerCharge += h.perMonthCharge || 0
    return h
  })

  return {
    hiredDirectors: tick(station.hiredDirectors || []),
    hiredStars:     tick(station.hiredStars     || []),
    hiredWriters:   tickWriters(station.hiredWriters || []),
    talentCharge:   r1(talentCharge),
    writerCharge:   r1(writerCharge),
    perMonthCharge: r1(talentCharge + writerCharge),
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

// ─── WRITERS ──────────────────────────────────────────────────────────────────
// Writers are PERMANENT-only contracts. There's a hard cap (WRITERS_CAP = 10).
// Each writer has a `specialty` (matches a category id) and a `skill` (0..1).
// Hiring upfront cost == 1 month of salary (cost). Firing penalty mirrors
// other permanent contracts (perMonthCharge * FIRE_PENALTY_MULT).

export function hireWriter(station, writer) {
  const list = station.hiredWriters || []
  if (list.length >= WRITERS_CAP) {
    return { station, charged: 0, error: `Writer cap reached (${WRITERS_CAP})` }
  }
  if (list.find(h => h.talentId === writer.id)) {
    return { station, charged: 0, error: 'Already hired' }
  }
  const upfront = r1(writer.cost) // 1 month signing
  if (station.cash < upfront) return { station, charged: 0, error: 'Not enough cash' }

  const record = {
    talentId: writer.id,
    role: 'writer',
    contractType: 'permanent',
    permanent: true,
    monthsLeft: null,
    perMonthCharge: r1(writer.cost),
    upfrontPaid: r1(upfront),
  }
  const newStation = {
    ...station,
    cash: r1(station.cash - upfront),
    hiredWriters: [...list, record],
  }
  return { station: newStation, charged: r1(upfront), error: null }
}

export function fireWriter(station, writerId) {
  const list = station.hiredWriters || []
  const rec = list.find(h => h.talentId === writerId)
  if (!rec) return { station, charged: 0, error: 'Not hired' }

  // Refuse to fire if writer is mid-draft
  const busy = (station.scripts || []).some(s => s.writerId === writerId && s.status === 'drafting')
  if (busy) return { station, charged: 0, error: 'Writer is drafting a script — wait or archive it first' }

  const writer = findWriter(writerId)
  const penalty = r1((rec.perMonthCharge || writer?.cost || 0) * FIRE_PENALTY_MULT)
  const newStation = {
    ...station,
    cash: r1(station.cash - penalty),
    hiredWriters: list.filter(h => h.talentId !== writerId),
  }
  return { station: newStation, charged: penalty, error: null }
}

/** Writers currently employed (full writer records, not hire records). */
export function activeWriters(station) {
  return (station.hiredWriters || [])
    .map(h => findWriter(h.talentId)).filter(Boolean)
}

/** Per-month salary total for writers (all permanent). */
export function writerSalaryTotal(station) {
  return r1((station.hiredWriters || []).reduce((a, h) => a + (h.perMonthCharge || 0), 0))
}

/** Builds the public market of writers (those exposed by their tier rarity). */
export function buildWriterMarket(station, scoutLevel = 0) {
  const bonus = scoutLevel * 0.15
  const expose = (list) => list.filter(t => Math.random() < clamp(TIER_EXPOSURE[t.tier] + bonus, 0, 1))
  const hired = new Set((station.hiredWriters || []).map(h => h.talentId))
  return expose(WRITERS).filter(w => !hired.has(w.id))
}

// ─── SCRIPTS ──────────────────────────────────────────────────────────────────
// A script is created by a writer over 1 month. While drafting, the writer is
// locked. On completion, hype is rolled from writer skill + IP bonus + noise.
// Scripts are reusable: every use decays hype by SCRIPT_HYPE_DECAY (×0.80).
// Refreshing a script costs 1 month of writer time (writer locked) and
// restores hype to the original rolled value. Only archived scripts can be
// deleted permanently.
//
// Script shape:
//   { id, name, writerId, categoryId, topicId, ipId,
//     status: 'drafting' | 'ready' | 'archived',
//     monthsRemaining,         // for drafting/refresh; 0 when ready
//     baseQuality,             // 0..10, rolled at creation, used for est Q/H later
//     hype, originalHype,      // 0..100; current vs the value rolled at completion
//     timesUsed,
//     refreshing: bool         // true when monthsRemaining counts down a refresh
//   }

function rollScriptHype(writer, ipId) {
  const skillPart = (writer?.skill || 0.3) * 60       // 18..60
  const ip = findIP(ipId)
  const ipPart = ip ? (ip.h || 0) * 6                 // up to ~20 for legendary
                    : 0
  const noise = rnd(-10, 10)
  const total = skillPart + ipPart + noise + 18       // base offset so even low writers can produce usable scripts
  return r1(clamp(total, SCRIPT_HYPE_MIN, SCRIPT_HYPE_MAX))
}

function rollScriptQuality(writer, ipId) {
  const skillPart = (writer?.skill || 0.3) * 7        // 2.1..7
  const ip = findIP(ipId)
  const ipPart = ip ? (ip.q || 0) * 0.6 : 0           // up to ~1.2
  const noise = rnd(-0.5, 0.5)
  return r1(clamp(skillPart + ipPart + noise + 1.5, 1, 10))
}

/** Begin drafting a new script. Writer must be hired and not already busy.
 *  Optionally takes a tier: 'normal' (default) | 'large' | 'super'. Larger
 *  tiers cost more (×writer salary), take longer to write, and have higher
 *  quality/hype caps. They also unlock richer production options. */
export function beginScript(station, opts) {
  const { writerId, name, categoryId, topicId, ipId = null, tier = 'normal' } = opts || {}
  const writer = findWriter(writerId)
  if (!writer) return { station, error: 'Writer not found' }
  const hired = (station.hiredWriters || []).find(h => h.talentId === writerId)
  if (!hired) return { station, error: 'Writer is not employed' }

  const busy = (station.scripts || []).some(s => s.writerId === writerId && s.status === 'drafting')
  if (busy) return { station, error: 'Writer is already drafting' }

  if (!categoryId || !topicId || !name?.trim()) {
    return { station, error: 'Pick a category, topic, and name' }
  }

  // IP usage gate: must own a current license for that IP. (Validated by UI
  // already, but defensive-check here too.)
  if (ipId) {
    const lic = (station.ipLicenses || []).find(l => l.ipId === ipId)
    if (!lic) return { station, error: 'No active license for that IP' }
  }

  // Tier validation. Larger tiers cost extra writer salary upfront.
  const tierDef = findScriptTier(tier)
  if (!tierDef) return { station, error: 'Unknown script tier' }
  const upfront = r1((writer.cost || 0) * (tierDef.costMult || 1.0))
  if (station.cash < upfront) {
    return { station, error: `Need ${fmtM(upfront)} to begin a ${tierDef.label} script` }
  }

  const script = {
    id: uid(),
    name: name.trim(),
    writerId,
    categoryId,
    topicId,
    ipId,
    tier,
    status: 'drafting',
    monthsRemaining: tierDef.months,
    baseQuality: 0,        // rolled on completion
    hype: 0,
    originalHype: 0,
    timesUsed: 0,
    refreshing: false,
  }
  return {
    station: {
      ...station,
      cash: r1(station.cash - upfront),
      scripts: [...(station.scripts || []), script],
    },
    charged: upfront,
    error: null,
  }
}

/** Refresh a ready (or archived) script — restores hype to original. Costs 1 mo of writer time. */
export function refreshScript(station, scriptId) {
  const scripts = station.scripts || []
  const idx = scripts.findIndex(s => s.id === scriptId)
  if (idx < 0) return { station, error: 'Script not found' }
  const s = scripts[idx]
  if (s.status === 'drafting') return { station, error: 'Already drafting' }

  // Need a free writer specialised in this category (or any free writer? we keep
  // it simple: the *original* writer if free, else any hired writer not busy.)
  const hired = (station.hiredWriters || [])
  if (hired.length === 0) return { station, error: 'No writers employed' }

  const original = hired.find(h => h.talentId === s.writerId)
  const busyIds = new Set(scripts.filter(x => x.status === 'drafting').map(x => x.writerId))

  let useWriterId = null
  if (original && !busyIds.has(s.writerId)) {
    useWriterId = s.writerId
  } else {
    const free = hired.find(h => !busyIds.has(h.talentId))
    if (!free) return { station, error: 'All writers busy' }
    useWriterId = free.talentId
  }

  const next = {
    ...s,
    writerId: useWriterId,
    status: 'drafting',
    monthsRemaining: 1,
    refreshing: true,
  }
  const newScripts = scripts.slice()
  newScripts[idx] = next
  return { station: { ...station, scripts: newScripts }, error: null }
}

/** Move a ready or drafting script to archived. Archived scripts can be deleted later. */
export function archiveScript(station, scriptId) {
  const scripts = station.scripts || []
  const idx = scripts.findIndex(s => s.id === scriptId)
  if (idx < 0) return { station, error: 'Script not found' }
  const s = scripts[idx]
  const next = { ...s, status: 'archived', monthsRemaining: 0, refreshing: false }
  const newScripts = scripts.slice()
  newScripts[idx] = next
  return { station: { ...station, scripts: newScripts }, error: null }
}

/** Permanently remove an archived script. Only allowed from 'archived' state. */
export function deleteArchivedScript(station, scriptId) {
  const scripts = station.scripts || []
  const s = scripts.find(x => x.id === scriptId)
  if (!s) return { station, error: 'Script not found' }
  if (s.status !== 'archived') return { station, error: 'Only archived scripts can be deleted' }
  return { station: { ...station, scripts: scripts.filter(x => x.id !== scriptId) }, error: null }
}

/** Per-month tick: decrement drafting/refresh counters; finish drafts → 'ready'. */
export function tickScripts(station) {
  const scripts = station.scripts || []
  const completed = []
  const newScripts = scripts.map(s => {
    if (s.status !== 'drafting') return s
    const left = Math.max(0, (s.monthsRemaining || 0) - 1)
    if (left > 0) return { ...s, monthsRemaining: left }
    // Completed
    const writer = findWriter(s.writerId)
    const isRefresh = !!s.refreshing
    const tierDef = findScriptTier(s.tier || 'normal')
    let baseQuality = s.baseQuality
    let originalHype = s.originalHype
    if (!isRefresh) {
      // First-time completion: roll base quality & original hype, then clamp
      // to the tier's caps. A normal script will never exceed Q 7 / H 70.
      baseQuality = r1(Math.min(tierDef.qCap, rollScriptQuality(writer, s.ipId)))
      originalHype = r1(Math.min(tierDef.hCap, rollScriptHype(writer, s.ipId)))
    }
    const finished = {
      ...s,
      status: 'ready',
      monthsRemaining: 0,
      refreshing: false,
      baseQuality,
      originalHype,
      hype: originalHype,    // refresh restores to original
    }
    completed.push(finished)
    return finished
  })
  return { scripts: newScripts, completed }
}

/** Apply a "used" event (called when a script is bound into a program build later in stage b).
 *  Decays current hype by SCRIPT_HYPE_DECAY. */
export function consumeScript(station, scriptId) {
  const scripts = station.scripts || []
  const idx = scripts.findIndex(s => s.id === scriptId)
  if (idx < 0) return { station, error: 'Script not found' }
  const s = scripts[idx]
  if (s.status !== 'ready') return { station, error: 'Script not ready' }
  const next = {
    ...s,
    timesUsed: (s.timesUsed || 0) + 1,
    hype: r1(clamp(s.hype * SCRIPT_HYPE_DECAY, SCRIPT_HYPE_MIN, SCRIPT_HYPE_MAX)),
  }
  const newScripts = scripts.slice()
  newScripts[idx] = next
  return { station: { ...station, scripts: newScripts }, error: null }
}

// ─── PROGRAMS ─────────────────────────────────────────────────────────────────
// A program is the built artifact. It sits on the shelf until scheduled into
// a slot. Each program has one of three lifecycles:
//   - 'instant'     → movies. No script. Editing cost upfront. Ready instantly.
//   - 'live'        → news/sports/contest. 1 mo prep + per-airing cost. Script needed.
//   - 'preproduced' → series/reality/etc. ceil(runMonths/2) mo prod, min 1.
//                     Full prod cost upfront. Cheap per-airing transmission cost.
//
// Shape:
// {
//   id, name, type,
//   scriptId | null,                    null only for movies
//   movieId | null,                     for movies
//   sportsLeagueId | null,              if airing live sports
//   categoryId, topicId, ipId,
//   directorId, starId,
//   prodDesignId, sfxId,
//   audioId, subsId, videoId,
//   marketingId,
//   plannedRunMonths,                   how long it was designed to air
//   status: 'producing' | 'shelf' | 'finished',
//   prodMonthsRemaining, prodMonthsTotal,
//   prepCostPaid,                       what's been deducted to start prod
//   airingCost,                         what to charge per airing
//   editingCost,                        for instant (movies)
//   // q/h
//   estQ, estH, estQRange:[lo,hi], estHRange:[lo,hi],
//   trueQ, trueH,                       hidden until first airing
//   revealed: bool,
//   // tracking
//   airingsCount, totalAudience, totalRevenue, totalCost,
// }

/** Affinity outcome for a tier vs a content category: 'good' | 'normal' | 'bad'. */
export function affinityOutcome(tier, categoryId) {
  if (!tier || !categoryId) return 'normal'
  if ((tier.prefers || []).includes(categoryId)) return 'good'
  if ((tier.dislikes || []).includes(categoryId)) return 'bad'
  return 'normal'
}

/** Aggregated affinity modifiers from prod-design + sfx for a given category. */
export function affinityMods(prodDesignId, sfxId, categoryId) {
  const pd = findProdDesign(prodDesignId)
  const sfx = findSfx(sfxId)
  let qDelta = 0, hDelta = 0, costMult = 1
  for (const tier of [pd, sfx]) {
    if (!tier) continue
    qDelta += tier.qBonus || 0
    const outcome = affinityOutcome(tier, categoryId)
    if (outcome === 'good') { qDelta += AFFINITY_GOOD_Q; hDelta += AFFINITY_GOOD_H }
    else if (outcome === 'bad') { qDelta += AFFINITY_BAD_Q; costMult *= AFFINITY_BAD_COST_MULT }
  }
  return { qDelta, hDelta, costMult }
}

/** Production method for a candidate program build. */
export function productionMethodFor(opts) {
  if (opts.movieId) return 'instant'
  return PRODUCTION_METHODS[opts.categoryId] || 'preproduced'
}

/** How many production months a program needs given its method + planned airing length. */
export function productionMonthsFor(method, plannedRunMonths) {
  if (method === 'instant') return 0
  if (method === 'live') return 1
  // preproduced: half the airing, minimum 1
  return Math.max(1, Math.ceil(plannedRunMonths / 2))
}

/** Compute total expected program cost (excluding ongoing live/transmission costs).
 *  Uses existing programCost helper for the bulk number; layered with affinity. */
export function programBuildCost(opts, station, research, year) {
  // Build a "planned" shape compatible with the existing programCost() helper.
  const planned = {
    slotTypeId: opts.slotTypeId || 'prime',
    name: opts.name,
    categoryId: opts.categoryId,
    topicId: opts.topicId,
    directorId: opts.directorId,
    starId: opts.starId,
    ipId: opts.ipId,
    marketingId: opts.marketingId,
    movieId: opts.movieId || null,
    sportsRunLeagueId: opts.sportsLeagueId || null,
    runMonths: opts.plannedRunMonths || 1,
    seqSeason: 1,
    audioId: opts.audioId,
    subsId: opts.subsId,
    videoId: opts.videoId,
  }
  const baseCost = programCost(planned, station, research, year)
  // Movies: licensed films don't carry our production tiers. Cost is just
  // the film cost + marketing + tech (already in baseCost).
  if (opts.movieId) return r1(baseCost)
  // Add the prod-design + SFX + music tier flat costs
  const pd = findProdDesign(opts.prodDesignId)
  const sfx = findSfx(opts.sfxId)
  const music = MUSIC_TIERS.find(m => m.id === opts.musicId)
  const tierCost = (pd?.cost || 0) + (sfx?.cost || 0) + (music?.cost || 0)
  // Apply affinity cost multiplier (bad fits raise cost)
  const aff = affinityMods(opts.prodDesignId, opts.sfxId, opts.categoryId)
  const total = (baseCost + tierCost) * aff.costMult
  return r1(total)
}

/** Find a music tier by id. */
export const findMusic = id => MUSIC_TIERS.find(m => m.id === id) || null

/** Split the affinityMods qDelta into art (prod-design contribution) and
 *  technical (sfx contribution). Both also pump up by tier intrinsic qBonus.
 *  Returns { artDelta, technicalDelta, costMult }. */
function affinityComponents(prodDesignId, sfxId, categoryId) {
  const pd = findProdDesign(prodDesignId)
  const sfx = findSfx(sfxId)
  let artDelta = 0
  let technicalDelta = 0
  let costMult = 1
  if (pd) {
    artDelta += pd.qBonus || 0
    const outcome = affinityOutcome(pd, categoryId)
    if (outcome === 'good') artDelta += AFFINITY_GOOD_Q
    else if (outcome === 'bad') { artDelta += AFFINITY_BAD_Q; costMult *= AFFINITY_BAD_COST_MULT }
  }
  if (sfx) {
    // SFX splits 60/40 between technical and art
    const sfxBoost = (sfx.qBonus || 0)
    technicalDelta += sfxBoost * 0.6
    artDelta += sfxBoost * 0.4
    const outcome = affinityOutcome(sfx, categoryId)
    if (outcome === 'good') { technicalDelta += AFFINITY_GOOD_Q * 0.6; artDelta += AFFINITY_GOOD_Q * 0.4 }
    else if (outcome === 'bad') { technicalDelta += AFFINITY_BAD_Q * 0.6; artDelta += AFFINITY_BAD_Q * 0.4; costMult *= AFFINITY_BAD_COST_MULT }
  }
  return { artDelta, technicalDelta, costMult }
}

/** Roll a program's full quality components + hype.
 *
 *  Components (0..10 each):
 *    - narrative   : writing, script, IP, star performance
 *    - art         : visual + audio appeal — prod-design, music, star, SFX
 *    - innovation  : director vision, writer creativity, format freshness
 *    - technical   : audio/subs/video, SFX rigor
 *
 *  Overall Q is then weighted by CATEGORY_QUALITY_WEIGHTS[categoryId].
 *  Returns { narrative, art, innovation, technical, q, h }.
 *
 *  Movies/sports take a shortcut path because their identity is mostly
 *  predetermined; we still produce components so the UI can display them,
 *  but movies will skip the review modal anyway. */
function rollProgramComponents(opts, station, research) {
  // ── MOVIE PATH ──────────────────────────────────────────────────────────
  // Movies arrive finished. Only marketing + tech tiers can nudge the score;
  // our prod-design/SFX/music tier choices don't apply. Hype is read from the
  // active pack (locked in at purchase, possibly penalized by a cooldown).
  if (opts.movieId) {
    const m = findMovie(opts.movieId)
    const mkt = findMarketing(opts.marketingId)
    const tech = techBonus(opts.audioId, opts.subsId, opts.videoId)
    const baseH = moviePackAiringHype(station, opts.movieId)
    const rawQ = clamp((m?.q || 5) + (mkt?.q || 0) + tech.q, 0, 10)
    const rawH = clamp(baseH + (mkt?.h || 0) + tech.h, 0, 10)
    // Specialization bonus — movies count as 'movie' genre
    const bumped = applySpecBonuses(rawQ, rawH, station, 'movie')
    const q = bumped.q
    const h = bumped.h
    // Synthesize components clustered around q so UI is consistent
    return {
      narrative: r1(clamp(q + rnd(-0.5, 0.5), 0, 10)),
      art: r1(clamp(q + rnd(-0.3, 0.5), 0, 10)),
      innovation: r1(clamp(q + rnd(-0.7, 0.3), 0, 10)),
      technical: r1(clamp(q + tech.q * 0.5 + rnd(-0.4, 0.4), 0, 10)),
      q: r1(q), h: r1(h),
    }
  }

  // ── SPORTS PATH ─────────────────────────────────────────────────────────
  if (opts.sportsLeagueId) {
    const lg = findLeague(opts.sportsLeagueId)
    const mkt = findMarketing(opts.marketingId)
    const tech = techBonus(opts.audioId, opts.subsId, opts.videoId)
    const aff = affinityComponents(opts.prodDesignId, opts.sfxId, opts.categoryId)
    const music = findMusic(opts.musicId)
    const dir = findDirector(opts.directorId)
    const star = findStar(opts.starId)

    // Sports-specific component model
    // Narrative — commentators (star/dir) — small but matters
    const narrative = clamp(
      (lg?.baseQ || 5) * 0.3
      + (star ? star.q * (star.specialty === 'sports' ? 1 : 0.5) * 0.6 : 0)
      + (dir ? dir.q * (dir.specialty === 'sports' ? 1 : 0.5) * 0.4 : 0)
      + rnd(-0.5, 0.5)
    , 0, 10)
    // Art — graphics, themes, music; secondary
    const art = clamp(
      (lg?.baseQ || 5) * 0.3
      + aff.artDelta
      + (music?.artBonus || 0)
      + rnd(-0.4, 0.4)
    , 0, 10)
    // Innovation — director's vision + freshness of format
    const innovation = clamp(
      (lg?.baseQ || 5) * 0.4
      + (dir ? dir.q * (dir.specialty === 'sports' ? 1 : 0.5) * 0.5 : 0)
      + rnd(-0.5, 0.5)
    , 0, 10)
    // Technical — the actual broadcast
    const technical = clamp(
      (lg?.baseQ || 5) * 0.6
      + aff.technicalDelta
      + tech.q * 1.5
      + rnd(-0.3, 0.3)
    , 0, 10)
    const h = clamp((lg?.baseH || 5) + (mkt?.h || 0) + tech.h, 0, 10)
    const rawQ = weightedQuality({ narrative, art, innovation, technical }, opts.categoryId)
    // Specialization bonus — sports broadcasts count as 'sports' genre
    const bumped = applySpecBonuses(rawQ, h, station, 'sports')
    return {
      narrative: r1(narrative), art: r1(art), innovation: r1(innovation), technical: r1(technical),
      q: r1(bumped.q), h: r1(bumped.h),
    }
  }

  // ── STANDARD PATH (script-based) ────────────────────────────────────────
  const script = (station.scripts || []).find(s => s.id === opts.scriptId)
  const cat = CATEGORIES[opts.categoryId]
  const topic = cat?.topics?.find(t => t.id === opts.topicId)
  const dir = findDirector(opts.directorId)
  const star = findStar(opts.starId)
  // Second star: super-only. Contributes at 0.75× weight so casting 2 mid-tier
  // stars beats 1 mid-tier star but a single top-tier + co-star is the real win.
  const star2 = opts.starId2 ? findStar(opts.starId2) : null
  const ip = opts.ipId ? findIP(opts.ipId) : null
  const mkt = findMarketing(opts.marketingId)
  const tech = techBonus(opts.audioId, opts.subsId, opts.videoId)
  const aff = affinityComponents(opts.prodDesignId, opts.sfxId, opts.categoryId)
  const music = findMusic(opts.musicId)
  const writer = script ? findWriter(script.writerId) : null

  const baseQ = (cat?.base_q || 5) + (topic?.q || 0)
  const baseH = (cat?.base_h || 5) + (topic?.h || 0)

  const dirMatch = dir && dir.specialty === opts.categoryId ? 1.0 : 0.5
  const starMatch = star && star.specialty === opts.categoryId ? 1.0 : 0.5
  const star2Match = star2 && star2.specialty === opts.categoryId ? 1.0 : 0.5
  // Combined star contribution: lead at 1.0, co-lead at 0.75.
  const starQContrib = (star ? star.q * starMatch : 0) + (star2 ? star2.q * star2Match * 0.75 : 0)
  const starHContrib = (star ? star.h * starMatch : 0) + (star2 ? star2.h * star2Match * 0.75 : 0)

  // ── NARRATIVE ──────────────────────────────────────────────────────────
  // The writer's skill carries the most weight here, via the script.
  const writerNarr = writer ? writer.skill * 5.5 * (writer.specialty === opts.categoryId ? 1 : 0.6) : 0
  const scriptNarr = script ? (script.baseQuality - 5) * 0.5 : 0
  const starNarr = starQContrib * 0.6
  const ipNarr = ip ? (ip.q || 0) * 0.7 : 0
  const musicNarr = music?.narrativeBonus || 0
  const narrative = clamp(
    baseQ * 0.45 + writerNarr + scriptNarr + starNarr + ipNarr + musicNarr + rnd(-0.4, 0.4)
  , 0, 10)

  // ── ART ─────────────────────────────────────────────────────────────────
  // Prod-design and music drive this most. Star contributes presence.
  const dirArt = dir ? dir.q * dirMatch * 0.4 : 0
  const starArt = starQContrib * 0.4
  const ipArt = ip ? (ip.q || 0) * 0.3 : 0
  const musicArt = music?.artBonus || 0
  const art = clamp(
    baseQ * 0.35 + aff.artDelta + dirArt + starArt + ipArt + musicArt + rnd(-0.4, 0.4)
  , 0, 10)

  // ── INNOVATION ─────────────────────────────────────────────────────────
  // Director's creative vision + writer freshness. New IPs add a touch.
  const dirInnov = dir ? dir.q * dirMatch * 0.7 : 0
  const writerInnov = writer ? writer.skill * 2.5 * (writer.specialty === opts.categoryId ? 1 : 0.6) : 0
  const ipInnov = ip ? (ip.q || 0) * 0.4 : 0
  const innovation = clamp(
    baseQ * 0.35 + dirInnov + writerInnov + ipInnov + rnd(-0.5, 0.5)
  , 0, 10)

  // ── TECHNICAL ──────────────────────────────────────────────────────────
  // Audio/subs/video tiers drive this, plus SFX rigor.
  const technical = clamp(
    baseQ * 0.4 + aff.technicalDelta + tech.q * 1.6 + rnd(-0.3, 0.3)
  , 0, 10)

  // Weighted overall Q
  const rawQ = weightedQuality({ narrative, art, innovation, technical }, opts.categoryId)

  // ── HYPE ───────────────────────────────────────────────────────────────
  // Hype is its own track — script hype, star+director hype, IP hype, marketing.
  const scriptH = script ? (script.hype / 100) * 3 : 0
  const dirH = dir ? dir.h * dirMatch : 0
  const starH = starHContrib
  const ipH = ip ? (ip.h || 0) : 0
  const rawH = clamp(baseH + scriptH + dirH + starH + ipH + (mkt?.h || 0) + tech.h + rnd(-0.4, 0.4), 0, 10)

  // ── SPECIALIZATION BONUS ───────────────────────────────────────────────
  // Apply the station's per-genre star bonus. Stars 0.5+ give Q; stars 3+
  // also give H. Movies/sports paths apply this in their own branches above.
  const bumped = applySpecBonuses(rawQ, rawH, station, opts.categoryId)

  return {
    narrative: r1(narrative),
    art: r1(art),
    innovation: r1(innovation),
    technical: r1(technical),
    q: r1(bumped.q),
    h: r1(bumped.h),
  }
}

/** Compute weighted Q from components using CATEGORY_QUALITY_WEIGHTS. */
function weightedQuality(c, categoryId) {
  const w = CATEGORY_QUALITY_WEIGHTS[categoryId] || CATEGORY_QUALITY_WEIGHTS.movie
  return c.narrative * w.narrative + c.art * w.art + c.innovation * w.innovation + c.technical * w.technical
}

/** Legacy adapter — components-aware. Returns { q, h }. */
function rollProgramQH(opts, station, research) {
  const c = rollProgramComponents(opts, station, research)
  return { q: c.q, h: c.h }
}

// helpers used above
function findMarketing(id) { return MARKETING_TIERS.find(m => m.id === id) || null }
function techBonus(audioId, subsId, videoId) {
  return techBonuses({ audioId, subsId, videoId })
}

/** Estimation range for a planned program — used by build UI live preview.
 *  Does NOT consume a script or modify station state. */
export function estimateProgramQH(opts, station, research) {
  const c = rollProgramComponents(opts, station, research)
  const dq = c.q * ESTIMATION_RANGE
  const dh = c.h * ESTIMATION_RANGE
  return {
    q: c.q, h: c.h,
    components: { narrative: c.narrative, art: c.art, innovation: c.innovation, technical: c.technical },
    qRange: [r1(clamp(c.q - dq, 0, 10)), r1(clamp(c.q + dq, 0, 10))],
    hRange: [r1(clamp(c.h - dh, 0, 10)), r1(clamp(c.h + dh, 0, 10))],
  }
}

/** Start a new program build. Pays upfront cost. Locks script if applicable.
 *  Production months count down each tick (via tickPrograms). */
export function beginProgram(station, research, year, opts) {
  if (!opts.name?.trim()) return { station, error: 'Name required' }

  const method = productionMethodFor(opts)
  const isMovie = method === 'instant'

  // Validate inputs
  if (!isMovie) {
    if (!opts.scriptId) return { station, error: 'Script required (except movies)' }
    const script = (station.scripts || []).find(s => s.id === opts.scriptId)
    if (!script) return { station, error: 'Script not found' }
    if (script.status !== 'ready') return { station, error: 'Script must be ready' }
    if (!opts.directorId) return { station, error: 'Director required' }
    if (!opts.starId) return { station, error: 'Star required' }

    // ── Tier-based gates ────────────────────────────────────────────────
    const tier = script.tier || 'normal'
    const tierRank = SCRIPT_TIER_RANK[tier] ?? 0
    // Star tier must be allowed for this script tier
    const star = findStar(opts.starId)
    if (star) {
      const allowed = STAR_TIER_MAX_FOR_SCRIPT[tier] || []
      if (!allowed.includes(star.tier)) {
        return { station, error: `${star.tier} stars require ${star.tier === 'Legendary' ? 'a Super' : 'a Large or Super'} script` }
      }
    }
    // Second star: super-only
    if (opts.starId2) {
      if (tier !== 'super') {
        return { station, error: 'Second star is only available on Super scripts' }
      }
      if (opts.starId2 === opts.starId) {
        return { station, error: 'Pick two different stars' }
      }
      const star2 = findStar(opts.starId2)
      if (star2) {
        const allowed = STAR_TIER_MAX_FOR_SCRIPT[tier] || []
        if (!allowed.includes(star2.tier)) {
          return { station, error: `Second star: ${star2.tier} requires Super script` }
        }
      }
    }
    // Production tiers — check minScriptTier on each chosen option
    const checks = [
      [opts.prodDesignId, PROD_DESIGN_TIERS, 'Production design'],
      [opts.sfxId, SFX_TIERS, 'SFX'],
      [opts.audioId, AUDIO_TIERS, 'Audio'],
      [opts.subsId, SUBTITLE_TIERS, 'Subtitles'],
      [opts.videoId, VIDEO_TIERS, 'Video'],
    ]
    for (const [chosenId, tierList, label] of checks) {
      if (!chosenId) continue
      const opt = (tierList || []).find(o => o.id === chosenId)
      if (!opt?.minScriptTier) continue
      const need = SCRIPT_TIER_RANK[opt.minScriptTier] ?? 0
      if (tierRank < need) {
        return { station, error: `${label} "${opt.label}" requires a ${opt.minScriptTier} script` }
      }
    }
  } else {
    if (!opts.movieId) return { station, error: 'Movie required' }
  }

  if (opts.sportsLeagueId) {
    if (!ownsLicense(station, opts.sportsLeagueId, year)) {
      return { station, error: 'No active license for that league' }
    }
  }
  if (opts.ipId && !ownsIP(station, opts.ipId, year)) {
    return { station, error: 'No active license for that IP' }
  }

  const plannedRunMonths = opts.plannedRunMonths || 1
  const prodMonths = productionMonthsFor(method, plannedRunMonths)
  const totalCost = programBuildCost(opts, station, research, year)

  // Split into upfront vs ongoing based on method
  let prepCost = 0
  let airingCost = 0
  let editingCost = 0
  if (method === 'instant') {
    editingCost = totalCost
    prepCost = editingCost
    airingCost = 0
  } else if (method === 'live') {
    prepCost = r1(totalCost * LIVE_PREP_FRACTION)
    const airingTotal = totalCost - prepCost
    // Keep airing cost at higher precision so small per-airing values don't round to 0
    airingCost = Math.round((airingTotal / Math.max(1, plannedRunMonths)) * 100) / 100
  } else {
    // preproduced: full cost upfront, transmission is small recurring charge
    prepCost = r1(totalCost * (1 - PREPRODUCED_TRANSMISSION_FRACTION))
    const transTotal = totalCost - prepCost
    airingCost = Math.round((transTotal / Math.max(1, plannedRunMonths)) * 100) / 100
  }

  if (station.cash < prepCost) {
    return { station, error: `Need ${fmtM(prepCost)} upfront (you have ${fmtM(station.cash)})` }
  }

  // Roll the full quality components now (locked in at build, reveal after first airing)
  const rolled = rollProgramComponents(opts, station, research)
  const q = rolled.q
  const h = rolled.h
  const dq = q * ESTIMATION_RANGE
  const dh = h * ESTIMATION_RANGE

  // Inherit tier from script if there is one; otherwise 'normal' as a default
  // (movies/sports don't really need this but it's a safe default).
  let scriptTier = 'normal'
  if (opts.scriptId) {
    const s = (station.scripts || []).find(x => x.id === opts.scriptId)
    if (s?.tier) scriptTier = s.tier
  }

  const program = {
    id: uid(),
    name: opts.name.trim(),
    type: method,
    tier: scriptTier,
    scriptId: opts.scriptId || null,
    movieId: opts.movieId || null,
    sportsLeagueId: opts.sportsLeagueId || null,
    categoryId: opts.categoryId,
    topicId: opts.topicId,
    ipId: opts.ipId || null,
    directorId: opts.directorId || null,
    starId: opts.starId || null,
    starId2: opts.starId2 || null,     // super-only, second lead
    prodDesignId: opts.prodDesignId,
    sfxId: opts.sfxId,
    musicId: opts.musicId || 'mus_basic',
    audioId: opts.audioId,
    subsId: opts.subsId,
    videoId: opts.videoId,
    marketingId: opts.marketingId,
    slotTypeId: opts.slotTypeId || null,
    plannedRunMonths,
    status: prodMonths > 0 ? 'producing' : 'shelf',
    prodMonthsRemaining: prodMonths,
    prodMonthsTotal: prodMonths,
    prepCostPaid: prepCost,
    airingCost,
    editingCost,
    estQ: q, estH: h,
    estQRange: [r1(clamp(q - dq, 0, 10)), r1(clamp(q + dq, 0, 10))],
    estHRange: [r1(clamp(h - dh, 0, 10)), r1(clamp(h + dh, 0, 10))],
    trueQ: q, trueH: h,
    components: {
      narrative: rolled.narrative,
      art: rolled.art,
      innovation: rolled.innovation,
      technical: rolled.technical,
    },
    revealed: false,
    review: null,               // populated on first airing (except movies)
    airingsCount: 0,
    totalAudience: 0,
    totalRevenue: 0,
    totalCost: prepCost,
    bornYear: year,
  }

  // Consume the script (decays hype 20%) if applicable
  let scripts = station.scripts || []
  if (opts.scriptId) {
    const consumed = consumeScript({ ...station, scripts }, opts.scriptId)
    if (consumed.error) return { station, error: consumed.error }
    scripts = consumed.station.scripts
  }

  return {
    station: {
      ...station,
      cash: r1(station.cash - prepCost),
      scripts,
      programs: [...(station.programs || []), program],
    },
    program,
    error: null,
  }
}

/** Tick all programs in production: decrement counters; flip to 'shelf' when done. */
export function tickPrograms(station) {
  const programs = station.programs || []
  const finished = []
  const newPrograms = programs.map(p => {
    if (p.status !== 'producing') return p
    const left = Math.max(0, (p.prodMonthsRemaining || 0) - 1)
    if (left > 0) return { ...p, prodMonthsRemaining: left }
    const ready = { ...p, prodMonthsRemaining: 0, status: 'shelf' }
    finished.push(ready)
    return ready
  })
  return { programs: newPrograms, finished }
}

/** Cancel a producing program. No refund (sunk cost). Removes it. */
export function cancelProgram(station, programId) {
  const programs = station.programs || []
  const p = programs.find(x => x.id === programId)
  if (!p) return { station, error: 'Program not found' }
  if (p.status === 'producing' || p.status === 'shelf') {
    // sunk
    return {
      station: { ...station, programs: programs.filter(x => x.id !== programId) },
      error: null,
    }
  }
  // Airing — must cancel via run cancellation
  return { station, error: 'Program is currently airing; cancel its run instead' }
}

/** Schedule a shelf-program into a slot. Creates a run; updates program status.
 *  Returns { station, run, error }. */
export function scheduleProgram(station, programId, slotTypeId, runMonths) {
  const programs = station.programs || []
  const p = programs.find(x => x.id === programId)
  if (!p) return { station, error: 'Program not found' }
  if (p.status !== 'shelf') return { station, error: `Program not on shelf (status: ${p.status})` }

  // For movies, run length is forced to 1
  // For sports, run length is forced to the remainder of the calendar year (handled by season skip)
  const forced = p.movieId ? 1 : (p.sportsLeagueId ? 12 : runMonths)

  const run = {
    id: uid(),
    programId: p.id,
    slotTypeId,
    name: p.name,
    categoryId: p.categoryId,
    topicId: p.topicId,
    directorId: p.directorId,
    starId: p.starId,
    ipId: p.ipId,
    marketingId: p.marketingId,
    movieId: p.movieId,
    sportsRunLeagueId: p.sportsLeagueId,
    seqSeason: 1,
    prevDirectorId: null,
    prevStarId: null,
    audioId: p.audioId,
    subsId:  p.subsId,
    videoId: p.videoId,
    prodDesignId: p.prodDesignId,
    sfxId: p.sfxId,
    runMonths: forced,
    monthsAired: 0,
    monthlyCost: p.airingCost,
    aiHistory: [],
  }

  // Update program status to airing
  const newPrograms = programs.map(x => x.id === programId ? { ...x, status: 'airing' } : x)

  return {
    station: { ...station, programs: newPrograms },
    run,
    error: null,
  }
}

/** Reveal a program's true Q/H. Called after first airing. */
export function revealProgramOnAir(station, programId) {
  const programs = station.programs || []
  const newPrograms = programs.map(p => {
    if (p.id !== programId) return p
    if (p.revealed) return p
    return { ...p, revealed: true }
  })
  return { ...station, programs: newPrograms }
}

/** Mark a program 'finished' after its run expires (history retained).
 *  Movie packs: a movie program ties to a pack. Each completed airing consumes
 *  one airing from the pack. If airings remain, the program flips back to
 *  'shelf' status (you can air it again). If the pack is exhausted, the
 *  program enters 'finished' and the pack consumption is stamped for the
 *  12-month cooldown. Returns { station, packConsumed, packExhausted }. */
export function finishProgram(station, programId, finalStats, year, month) {
  const programs = station.programs || []
  const p = programs.find(pp => pp.id === programId)
  if (!p) return { station, packConsumed: false, packExhausted: false }

  // ── MOVIE PACK PATH ──────────────────────────────────────────────────
  if (p.movieId) {
    const owned = findOwnedActivePack(station, p.movieId)
    if (!owned) {
      // No pack found (legacy or edge case) — just mark finished
      const newPrograms = programs.map(pp => pp.id === programId
        ? { ...pp, status: 'finished',
            airingsCount: finalStats?.airingsCount ?? pp.airingsCount,
            totalAudience: finalStats?.totalAudience ?? pp.totalAudience,
            totalRevenue: finalStats?.totalRevenue ?? pp.totalRevenue,
            totalCost: finalStats?.totalCost ?? pp.totalCost,
          }
        : pp)
      return { station: { ...station, programs: newPrograms }, packConsumed: false, packExhausted: false }
    }
    // Decrement pack airings
    const consumed = consumeMoviePackAiring(station, p.movieId, year ?? 0, month ?? 0)
    const packExhausted = consumed.consumed
    // Update program: keep stats accumulating across airings; flip status
    // back to 'shelf' if pack has airings left, otherwise 'finished'.
    const newStatus = packExhausted ? 'finished' : 'shelf'
    const newPrograms = programs.map(pp => pp.id === programId
      ? { ...pp,
          status: newStatus,
          airingsCount: finalStats?.airingsCount ?? pp.airingsCount,
          totalAudience: finalStats?.totalAudience ?? pp.totalAudience,
          totalRevenue: finalStats?.totalRevenue ?? pp.totalRevenue,
          totalCost: finalStats?.totalCost ?? pp.totalCost,
        }
      : pp)
    return {
      station: { ...consumed.station, programs: newPrograms },
      packConsumed: true,
      packExhausted,
    }
  }

  // ── NON-MOVIE PATH (unchanged) ───────────────────────────────────────
  const newPrograms = programs.map(pp => {
    if (pp.id !== programId) return pp
    return {
      ...pp,
      status: 'finished',
      airingsCount: finalStats?.airingsCount ?? pp.airingsCount,
      totalAudience: finalStats?.totalAudience ?? pp.totalAudience,
      totalRevenue: finalStats?.totalRevenue ?? pp.totalRevenue,
      totalCost: finalStats?.totalCost ?? pp.totalCost,
    }
  })
  return { station: { ...station, programs: newPrograms }, packConsumed: false, packExhausted: false }
}

/** Helper: aggregate per-airing stats onto a program after each month. */
/** Generate a review for a freshly-aired program.
 *  Picks from REVIEW_TEMPLATES based on the program's components + first
 *  airing rating. Returns { quote, bucket, rating, components } — or null
 *  if the program is a movie (movies skip the review modal).
 */
export function generateReview(program, firstAiring, networkName) {
  if (program.movieId) return null    // movies skip reviews
  const c = program.components
  if (!c) return null
  const rating = firstAiring?.rating || program.trueQ
  const candidates = REVIEW_TEMPLATES.filter(t => {
    try { return t.test(c, rating) } catch (e) { return false }
  })
  // Prefer non-fallback if any matched
  const nonFallback = candidates.filter(t => t.bucket !== 'fallback')
  const pool = nonFallback.length > 0 ? nonFallback : candidates
  const template = pool[Math.floor(Math.random() * pool.length)]
  if (!template) return null
  const cat = CATEGORIES[program.categoryId]
  const kindLabel = cat?.label?.toLowerCase() || 'show'
  const quote = template.quote
    .replaceAll('{network}', networkName || 'The network')
    .replaceAll('{kind}', kindLabel)
  return {
    quote,
    bucket: template.bucket,
    rating: r2(rating),
    components: { ...c },
  }
}

export function updateProgramFromAiring(station, programId, airing, networkName) {
  const programs = station.programs || []
  const newPrograms = programs.map(p => {
    if (p.id !== programId) return p
    // Capture review on first airing (movies skip it)
    let review = p.review
    if (!review && !p.movieId && (p.airingsCount || 0) === 0) {
      review = generateReview(p, airing, networkName || 'The network')
    }
    return {
      ...p,
      airingsCount: (p.airingsCount || 0) + 1,
      totalAudience: r1((p.totalAudience || 0) + (airing.audience || 0)),
      totalRevenue: r1((p.totalRevenue || 0) + (airing.revenue || 0)),
      totalCost: r1((p.totalCost || 0) + (airing.cost || 0)),
      revealed: true,
      review,
    }
  })
  return { ...station, programs: newPrograms }
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

// ─── STAFF (DIRECTORS OF…) ──────────────────────────────────────────────────
// Station has up to 5 staff: personnel, innovation, operations, marketing, content.
// Each is null or { name, tier, hiredMonth, hiredYear }.
// Personnel is the gate — until you hire one, you can't hire others.

const STAFF_FIRE_PENALTY = 3   // fire = pay 3 months salary

/** Get the effect bundle for a staff role from station.staff. Empty {} if vacant.
 *  STAFF_EFFECTS shape: { roleId: { tierName: { effectKey: value } } }. */
export function staffEffect(station, role) {
  const s = station?.staff?.[role]
  if (!s) return {}
  return STAFF_EFFECTS[role]?.[s.tier] || {}
}

/** Per-month salary cost across all hired staff. */
export function staffSalaryTotal(station) {
  if (!station?.staff) return 0
  let total = 0
  for (const role of Object.keys(station.staff)) {
    const s = station.staff[role]
    if (s) total += STAFF_MONTHLY_SALARY[s.tier] || 0
  }
  return r1(total)
}

/** Check if player CAN hire a given role.
 *  Personnel is always hireable (no prereq). All others require Personnel. */
export function canHireStaffRole(station, role) {
  if (role === 'personnel') return true
  return !!station?.staff?.personnel
}

/** Cost to fire a staff member. */
export function staffFireCost(station, role) {
  const s = station?.staff?.[role]
  if (!s) return 0
  return r1((STAFF_MONTHLY_SALARY[s.tier] || 0) * STAFF_FIRE_PENALTY)
}

/** Generate a single staff candidate using a search tier's weights. */
function generateStaffCandidate(role, searchTier) {
  const weights = searchTier.tierWeights
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  let chosenIdx = 0
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) { chosenIdx = i; break }
  }
  const tier = TIERS[chosenIdx]
  const name = `${pick(STAFF_FIRST_NAMES)} ${pick(STAFF_LAST_NAMES)}`
  return { name, tier, role }
}

/** Open a position. Returns updated station + cash debit. Doesn't hire — the
 *  position resolves after `months` and the user picks from candidates. */
export function openStaffPosition(station, role, searchTierId) {
  const tier = SEARCH_TIERS.find(t => t.id === searchTierId)
  if (!tier) return { station, error: 'Bad search tier' }
  if (!canHireStaffRole(station, role)) return { station, error: 'Hire a Personnel Director first' }
  if (station.openPositions?.some(p => p.role === role)) return { station, error: 'Already searching for this role' }
  if (station.cash < tier.cost) return { station, error: 'Not enough cash' }

  const position = {
    role,
    tierId: searchTierId,
    monthsLeft: tier.months,
    monthsTotal: tier.months,
    cost: tier.cost,
  }
  return {
    station: {
      ...station,
      cash: r1(station.cash - tier.cost),
      openPositions: [...(station.openPositions || []), position],
    },
    charged: tier.cost,
    error: null,
  }
}

/** Cancel an open position. Refund 50%. */
export function cancelStaffPosition(station, role) {
  const pos = (station.openPositions || []).find(p => p.role === role)
  if (!pos) return { station, refund: 0 }
  const refund = r1(pos.cost * 0.5)
  return {
    station: {
      ...station,
      cash: r1(station.cash + refund),
      openPositions: (station.openPositions || []).filter(p => p.role !== role),
    },
    refund,
  }
}

/** Hire a candidate (called from the position's resolved state).
 *  Returns updated station. */
export function hireStaffCandidate(station, role, candidate, year, month) {
  return {
    ...station,
    staff: {
      ...(station.staff || {}),
      [role]: {
        name: candidate.name,
        tier: candidate.tier,
        hiredYear: year,
        hiredMonth: month,
      },
    },
    openPositions: (station.openPositions || []).filter(p => p.role !== role),
  }
}

/** Fire staff. Returns updated station + penalty paid. */
export function fireStaffMember(station, role) {
  const penalty = staffFireCost(station, role)
  const nextStaff = { ...(station.staff || {}) }
  delete nextStaff[role]
  return {
    station: { ...station, cash: r1(station.cash - penalty), staff: nextStaff },
    penalty,
  }
}

/** Tick all open positions by one month. Returns:
 *   { station, resolvedPositions: [{ role, candidates: [...] }] }
 * Candidates: 3 picks at this tier so the player can choose. */
export function tickStaffSearches(station) {
  const next = []
  const resolved = []
  for (const pos of (station.openPositions || [])) {
    const newMonths = pos.monthsLeft - 1
    if (newMonths <= 0) {
      const tier = SEARCH_TIERS.find(t => t.id === pos.tierId)
      const candidates = [
        generateStaffCandidate(pos.role, tier),
        generateStaffCandidate(pos.role, tier),
        generateStaffCandidate(pos.role, tier),
      ]
      resolved.push({ role: pos.role, candidates })
    } else {
      next.push({ ...pos, monthsLeft: newMonths })
    }
  }
  return {
    station: { ...station, openPositions: next },
    resolvedPositions: resolved,
  }
}

// ─── IP LICENSING ────────────────────────────────────────────────────────────
/** Cost to license an IP for a given term, with discounts applied. */
export function ipLicenseCost(ipId, termId, research) {
  const ip = findIP(ipId)
  if (!ip) return 0
  const term = IP_LICENSE_TERMS.find(t => t.id === termId)
  if (!term) return 0
  const discount = research?.ipDiscount || 1.0
  return r1(ip.cost * term.costMult * discount)
}

/** Does the station currently own a license on this IP (and it hasn't expired)? */
export function ownsIP(station, ipId, currentYear) {
  return (station?.ipLicenses || []).some(l => l.ipId === ipId && l.expiresYear >= currentYear)
}

/** Buy an IP license. */
export function buyIPLicense(station, ipId, termId, year, research) {
  const term = IP_LICENSE_TERMS.find(t => t.id === termId)
  if (!term) return { station, error: 'Bad term' }
  const cost = ipLicenseCost(ipId, termId, research)
  if (station.cash < cost) return { station, error: 'Not enough cash' }

  // If renewing an existing license, push out its expiry; otherwise add new
  const licenses = [...(station.ipLicenses || [])]
  const existingIdx = licenses.findIndex(l => l.ipId === ipId)
  if (existingIdx >= 0) {
    licenses[existingIdx] = {
      ...licenses[existingIdx],
      expiresYear: Math.max(licenses[existingIdx].expiresYear, year + term.years - 1),
    }
  } else {
    licenses.push({ ipId, expiresYear: year + term.years - 1 })
  }
  return {
    station: { ...station, cash: r1(station.cash - cost), ipLicenses: licenses },
    cost,
    charged: cost,
    ipName: findIP(ipId)?.name || ipId,
    error: null,
  }
}

export function activeIPLicenses(station, currentYear) {
  return (station?.ipLicenses || []).filter(l => l.expiresYear >= currentYear)
}

// ─── MOVIE PACKS ─────────────────────────────────────────────────────────────
// A movie pack is bought as a unit and grants `packSize` airings (default 3).
// Each airing decrements `airingsLeft`. When airingsLeft hits 0 the pack is
// "consumed" (lastConsumedY/M recorded) and the entry stays in the station's
// history so the cooldown logic can find it on a re-buy attempt.
//
// Station-side shape: station.moviePacks = [{
//   packId,           // matches MOVIES[i].id
//   airingsLeft,      // remaining airings (decrements from packSize)
//   purchasedY, purchasedM,
//   purchaseHype,     // hype value used at purchase (after any rebuy penalty)
//   lastConsumedY, lastConsumedM,   // only set after airingsLeft hits 0
// }]

const MONTHS_PER_YEAR_LOCAL = 12

function monthsBetween(y1, m1, y2, m2) {
  return (y2 - y1) * MONTHS_PER_YEAR_LOCAL + (m2 - m1)
}

/** Find a currently active (not yet consumed) pack on the shelf. */
export function findOwnedActivePack(station, packId) {
  return (station?.moviePacks || []).find(p => p.packId === packId && (p.airingsLeft || 0) > 0) || null
}

/** Most recent consumed entry for this pack (used to compute cooldown). */
export function findLastConsumedPack(station, packId) {
  const consumed = (station?.moviePacks || []).filter(p =>
    p.packId === packId && (p.airingsLeft || 0) === 0 && p.lastConsumedY != null
  )
  if (consumed.length === 0) return null
  // Sort by (year, month) desc, return the latest
  consumed.sort((a, b) => (b.lastConsumedY - a.lastConsumedY) || (b.lastConsumedM - a.lastConsumedM))
  return consumed[0]
}

/** Effective hype for a pack purchase right now. If the pack was consumed
 *  within MOVIE_PACK_COOLDOWN_MONTHS, hype is reduced by the penalty.
 *  Returns { hype, penaltyApplied, monthsUntilRestore }. */
export function moviePackPurchaseHype(station, packId, currentYear, currentMonth) {
  const pack = MOVIES.find(m => m.id === packId)
  if (!pack) return { hype: 0, penaltyApplied: false, monthsUntilRestore: 0 }
  const baseHype = pack.h || 0
  const last = findLastConsumedPack(station, packId)
  if (!last) return { hype: baseHype, penaltyApplied: false, monthsUntilRestore: 0 }
  const elapsed = monthsBetween(last.lastConsumedY, last.lastConsumedM, currentYear, currentMonth)
  if (elapsed >= MOVIE_PACK_COOLDOWN_MONTHS) {
    return { hype: baseHype, penaltyApplied: false, monthsUntilRestore: 0 }
  }
  return {
    hype: r1(baseHype * (1 - MOVIE_PACK_REBUY_HYPE_PENALTY)),
    penaltyApplied: true,
    monthsUntilRestore: MOVIE_PACK_COOLDOWN_MONTHS - elapsed,
  }
}

/** Can we buy this pack right now? Always yes unless it's already on the
 *  shelf with airings remaining (you don't need two copies). */
export function canBuyMoviePack(station, packId) {
  const owned = findOwnedActivePack(station, packId)
  return !owned
}

/** Buy a movie pack. Pays the pack's cost upfront, locks in current hype
 *  (which may be penalized by an active cooldown). */
export function buyMoviePack(station, packId, year, month) {
  const pack = MOVIES.find(m => m.id === packId)
  if (!pack) return { station, error: 'Unknown pack' }
  if (!canBuyMoviePack(station, packId)) {
    return { station, error: 'Already on shelf' }
  }
  if (station.cash < pack.cost) {
    return { station, error: 'Not enough cash' }
  }
  const hypeInfo = moviePackPurchaseHype(station, packId, year, month)
  const newEntry = {
    packId,
    airingsLeft: pack.packSize || 3,
    purchasedY: year, purchasedM: month,
    purchaseHype: hypeInfo.hype,
    penaltyApplied: hypeInfo.penaltyApplied,
  }
  return {
    station: {
      ...station,
      cash: r1(station.cash - pack.cost),
      moviePacks: [...(station.moviePacks || []), newEntry],
    },
    cost: pack.cost,
    pack,
    penaltyApplied: hypeInfo.penaltyApplied,
    error: null,
  }
}

/** Decrement airings on a pack. If it hits zero, stamp lastConsumedY/M. */
export function consumeMoviePackAiring(station, packId, year, month) {
  const packs = (station?.moviePacks || []).map(p => ({ ...p }))
  // Find the active entry for this packId
  const idx = packs.findIndex(p => p.packId === packId && (p.airingsLeft || 0) > 0)
  if (idx < 0) return { station, consumed: false }
  packs[idx].airingsLeft -= 1
  let consumed = false
  if (packs[idx].airingsLeft <= 0) {
    packs[idx].airingsLeft = 0
    packs[idx].lastConsumedY = year
    packs[idx].lastConsumedM = month
    consumed = true
  }
  return { station: { ...station, moviePacks: packs }, consumed }
}

/** Effective hype for a movie airing — looks up the active pack's locked-in
 *  purchase hype. Falls back to MOVIES base hype if no pack is found (legacy
 *  saves or edge cases). */
export function moviePackAiringHype(station, packId) {
  const owned = findOwnedActivePack(station, packId)
  if (owned?.purchaseHype != null) return owned.purchaseHype
  const pack = MOVIES.find(m => m.id === packId)
  return pack?.h || 0
}

// ─── RESEARCH IN PROGRESS ────────────────────────────────────────────────────
/** Compute adjusted cost + months for a research item given station state.
 *  Innovation Director discounts both. Domain affinity (already unlocked content
 *  in the same domain) gives an additional 25% off both. */
export function researchAdjusted(researchId, station, research) {
  const r = RESEARCH.find(x => x.id === researchId)
  if (!r) return { cost: 0, months: 0 }
  const innovEff = staffEffect(station, 'innovation')
  let costMult = innovEff.cost || 1.0
  let monthsMult = innovEff.months || 1.0

  // Domain affinity: if the player already has unlocked content in the same domain,
  // give an extra 25% off cost + time.
  if (r.domain) {
    const unlocked = research?.unlocked || []
    const hasDomainExp = RESEARCH.some(x =>
      x.id !== r.id &&
      x.domain === r.domain &&
      unlocked.includes(x.id)
    )
    if (hasDomainExp) {
      costMult *= 0.75
      monthsMult *= 0.75
    }
  }

  return {
    cost: Math.max(1, r1(r.cost * costMult)),
    months: Math.max(1, Math.round(r.months * monthsMult)),
  }
}

/** Begin a research project. Returns updated state + cash debit. */
export function beginResearch(researchId, station, research, year, month) {
  const r = RESEARCH.find(x => x.id === researchId)
  if (!r) return { error: 'No such research' }
  // v7: require an Innovation Director on staff to start any research project.
  // The director also discounts cost/time (via researchAdjusted), but without
  // one, the R&D function doesn't exist as a department at all.
  if (!station.staff?.innovation) {
    return { error: 'Hire an Innovation Director first (Operations → Staff)' }
  }
  if (!canResearch(researchId, research, station)) return { error: 'Cannot research now' }
  if ((research.inProgress || []).some(p => p.id === researchId)) {
    return { error: 'Already in progress' }
  }
  const adj = researchAdjusted(researchId, station, research)
  if (station.cash < adj.cost) return { error: 'Not enough cash' }

  return {
    station: { ...station, cash: r1(station.cash - adj.cost) },
    research: {
      ...research,
      inProgress: [
        ...(research.inProgress || []),
        { id: researchId, monthsLeft: adj.months, monthsTotal: adj.months, cost: adj.cost },
      ],
    },
    cost: adj.cost,
    error: null,
  }
}

/** Tick all in-progress research by one month. Returns:
 *   { research, completed: [...researchIds] } */
export function tickResearch(research) {
  const next = []
  const completed = []
  for (const p of (research.inProgress || [])) {
    if (p.monthsLeft <= 1) {
      completed.push(p.id)
    } else {
      next.push({ ...p, monthsLeft: p.monthsLeft - 1 })
    }
  }
  return { research: { ...research, inProgress: next }, completed }
}

// ─── NETWORK CAMPAIGNS ───────────────────────────────────────────────────────
/** Run a network-wide marketing campaign. Costs upfront. Hype boost applies
 *  to all of THIS month's shows; fame gain applies immediately. */
export function launchNetworkCampaign(station, campaignId, research) {
  const camp = NETWORK_CAMPAIGNS.find(c => c.id === campaignId)
  if (!camp) return { station, error: 'Bad campaign' }
  const mktgEff = staffEffect(station, 'marketing')
  const cost = r1(camp.cost * (research?.marketingDiscount || 1.0) * (mktgEff.mktgCost || 1.0))
  if (station.cash < cost) return { station, error: 'Not enough cash' }
  const impactMult = mktgEff.mktgImpact || 1.0
  return {
    station: {
      ...station,
      cash: r1(station.cash - cost),
      fame: r2(station.fame + camp.fameGain * impactMult),
      activeCampaign: { tierId: campaignId, hypeBoost: camp.hypeBoost * impactMult },
    },
    cost,
    label: camp.label,
    error: null,
  }
}

// ─── TECH QUALITY HELPERS ────────────────────────────────────────────────────
const TECH_BY_DIM = {
  audio: AUDIO_TIERS,
  subtitles: SUBTITLE_TIERS,
  video: VIDEO_TIERS,
}
const TECH_DEFAULT_ID = { audio: 'audio_mono', subtitles: 'subs_none', video: 'video_sd' }

/** Get the tech quality options unlocked for a dimension based on research. */
export function unlockedTechFor(dimension, research) {
  const all = TECH_BY_DIM[dimension] || []
  const unlocked = research?.unlocked || []
  return all.filter(opt => !opt.requires || unlocked.includes(opt.requires))
}

export function findTechOption(dimension, id) {
  const all = TECH_BY_DIM[dimension] || []
  return all.find(o => o.id === id) || all.find(o => o.id === TECH_DEFAULT_ID[dimension]) || all[0]
}

/** Total per-month tech cost added to a show. */
export function techMonthlyCost(planned) {
  const audio = findTechOption('audio', planned.audioId)
  const subs  = findTechOption('subtitles', planned.subsId)
  const video = findTechOption('video', planned.videoId)
  return r2((audio?.cost || 0) + (subs?.cost || 0) + (video?.cost || 0))
}

/** Total q/h bonuses from tech selections. */
export function techBonuses(planned) {
  const audio = findTechOption('audio', planned.audioId)
  const subs  = findTechOption('subtitles', planned.subsId)
  const video = findTechOption('video', planned.videoId)
  return {
    q: (audio?.q || 0) + (subs?.q || 0) + (video?.q || 0),
    h: (audio?.h || 0) + (subs?.h || 0) + (video?.h || 0),
  }
}

export function buildMarketRoster(station, scoutLevel = 0) {
  const bonus = scoutLevel * 0.15
  const expose = (list) => list.filter(t => Math.random() < clamp(TIER_EXPOSURE[t.tier] + bonus, 0, 1))
  const hiredD = new Set((station.hiredDirectors || []).map(h => h.talentId))
  const hiredS = new Set((station.hiredStars || []).map(h => h.talentId))
  const hiredW = new Set((station.hiredWriters || []).map(h => h.talentId))
  return {
    directors: expose(DIRECTORS).filter(d => !hiredD.has(d.id)),
    stars:     expose(STARS).filter(s => !hiredS.has(s.id)),
    writers:   expose(WRITERS).filter(w => !hiredW.has(w.id)),
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
export function baseProductionCost(categoryId, marketId, station) {
  const cat = CATEGORIES[categoryId]
  const market = MARKETS[marketId]
  // Production scales with market tier: local is cheap, metro mid, national
  // expensive. Sourced from MARKETS.prodCostMult so promotion costs / infra /
  // production scaling all live in one place.
  const marketMult = market?.prodCostMult ?? 1.0
  const opsEff = staffEffect(station, 'operations')
  const opsMult = opsEff.prodCost || 1.0
  return r1(1.0 * (cat?.cost_mult || 1.0) * marketMult * opsMult)
}

export function marketingCost(tierId, marketId, research, station) {
  const tier = MARKETING_TIERS.find(t => t.id === tierId) || MARKETING_TIERS[0]
  const market = MARKETS[marketId]
  const discount = research?.marketingDiscount || 1.0
  const mktgEff = staffEffect(station, 'marketing')
  const mktgMult = mktgEff.mktgCost || 1.0
  return r1(tier.cost * market.marketingMult * discount * mktgMult)
}

export function ipCost(ipId, research, station, currentYear) {
  if (!ipId) return 0
  // If station owns an active license, IP is free
  if (station && currentYear && ownsIP(station, ipId, currentYear)) return 0
  const ip = findIP(ipId)
  if (!ip) return 0
  const discount = research?.ipDiscount || 1.0
  return r1(ip.cost * discount)
}

/** Per-month production cost of one program. */
export function programCost(planned, stationOrMarket, research, year) {
  const isFullStation = stationOrMarket?.market && typeof stationOrMarket.market === 'string'
  const station = isFullStation ? stationOrMarket : null
  const market = isFullStation ? MARKETS[stationOrMarket.market] : stationOrMarket
  const slot = SLOT_TYPES[planned.slotTypeId || 'prime']
  const slotMult = slot?.costMult || 1.0
  const techCost = techMonthlyCost(planned)

  if (planned.movieId) {
    // Pack license was paid upfront at purchase. Each airing only pays
    // transmission + marketing + tech. Use a small fixed transmission slice
    // proportional to the pack price for cost-visibility purposes.
    const m = findMovie(planned.movieId)
    const transmission = r1(((m?.cost || 0) * 0.05) * slotMult)
    return r1(transmission + marketingCost(planned.marketingId || 'none', market.id, research, station) + techCost)
  }
  if (planned.sportsRunLeagueId) {
    const opsEff = staffEffect(station, 'operations')
    const opsMult = opsEff.prodCost || 1.0
    const base = 0.4 * slotMult * opsMult
    const mktg = marketingCost(planned.marketingId || 'none', market.id, research, station)
    return r1(base + mktg + techCost)
  }
  const base = baseProductionCost(planned.categoryId, market.id, station) * slotMult
  const ip   = ipCost(planned.ipId, research, station, year)
  const mktg = marketingCost(planned.marketingId || 'none', market.id, research, station)
  return r1(base + ip + mktg + techCost)
}

/** Total cost across the whole multi-month run. */
export function runTotalCost(planned, station, research, year) {
  const months = planned.runMonths || 1
  return r1(programCost(planned, station, research, year) * months)
}

// ─── QUALITY & HYPE ──────────────────────────────────────────────────────────
// Talent-category match: 1.0 = on-specialty, 0.15-0.4 = mismatch.
// Some pairings are actively HARMFUL: a sports star fronting a kids show
// brings the wrong vibe, so the show gets a small NEGATIVE pull rather than
// nothing. Reflected in ANTI_AFFINITY.
const ANTI_AFFINITY = {
  // talent specialty → category they should not touch
  sports:    { kids: -0.3, family: -0.1 },
  latenight: { kids: -0.5, family: -0.2 },
  news:      { kids: -0.2 },
  reality:   { kids: -0.3, news: -0.2 },
  kids:      { latenight: -0.4, sports: -0.2 },
  family:    { latenight: -0.2 },
}

function matchFactor(talent, categoryId) {
  if (!talent) return 0
  if (talent.specialty === categoryId) return 1.0
  const anti = ANTI_AFFINITY[talent.specialty]?.[categoryId]
  if (anti !== undefined) return anti  // negative — actively hurts the show
  return 0.25  // unrelated specialty — contributes a little
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

    // Staff + tech + campaign bonuses
    const contentQ = (staffEffect(station, 'content').qBonus) || 0
    const tech = techBonuses(planned)
    const campHype = station.activeCampaign?.hypeBoost || 0

    const rawQ = clamp(lg.baseQ + (dir?.q || 0) * dMatch + (star?.q || 0) * sMatch + focusQ + contentQ + tech.q, 1, 10)
    const rawH = clamp(lg.baseH + (dir?.h || 0) * dMatch + (star?.h || 0) * sMatch + focusH + fameH + slotBonusH + seasonBonusH + peakBonus + tech.h + campHype, 1, 10)
    // Specialization bonus — sports broadcasts use 'sports' genre
    const bumped = applySpecBonuses(rawQ, rawH, station, 'sports')

    return {
      quality: bumped.q,
      hype:    bumped.h,
      tier:    isPeak ? 'Legendary' : 'Rare',
      slotBonusH, seasonBonusH, peakBonus, isPeak,
    }
  }

  if (planned.movieId) {
    const m = findMovie(planned.movieId)
    const mktg = MARKETING_TIERS.find(t => t.id === (planned.marketingId || 'none')) || MARKETING_TIERS[0]
    const mktgEff = staffEffect(station, 'marketing')
    const mktgImpact = mktgEff.mktgImpact || 1.0
    const contentQ = (staffEffect(station, 'content').qBonus) || 0
    const tech = techBonuses(planned)
    const campHype = station.activeCampaign?.hypeBoost || 0
    const rawQ = clamp(m.q + mktg.q + contentQ + tech.q, 1, 10)
    const rawH = clamp(m.h + mktg.h * mktgImpact + slotBonusH + seasonBonusH + tech.h + campHype, 1, 10)
    // Specialization bonus — movies use 'movie' genre
    const bumped = applySpecBonuses(rawQ, rawH, station, 'movie')
    return {
      quality: bumped.q,
      hype:    bumped.h,
      tier:    m.tier,
      slotBonusH, seasonBonusH,
    }
  }

  const cat = CATEGORIES[planned.categoryId]
  if (!cat) return { quality: 1, hype: 1, tier: 'Common', slotBonusH: 0, seasonBonusH: 0 }
  const topic = cat.topics.find(t => t.id === planned.topicId) || { q: 0, h: 0 }
  const dir   = findDirector(planned.directorId)
  const star  = findStar(planned.starId)
  const star2 = planned.starId2 ? findStar(planned.starId2) : null
  const ip    = findIP(planned.ipId)
  const mktg  = MARKETING_TIERS.find(t => t.id === (planned.marketingId || 'none')) || MARKETING_TIERS[0]
  const focus = findFocus(station.focus) || {}

  const dMatch = matchFactor(dir,  planned.categoryId)
  const sMatch = matchFactor(star, planned.categoryId)
  const s2Match = matchFactor(star2, planned.categoryId)

  const localBonus = (planned.categoryId === 'news' && planned.topicId === 'local' && station.market === 'local') ? 1.0 : 0
  const seqBonus = sequelBonusFor(planned) + (research?.sequelBonus && planned.seqSeason ? research.sequelBonus : 0)

  const ipFits = ip && ip.fits.includes(planned.categoryId)
  const ipQ = ipFits ? ip.q : (ip ? ip.q * 0.4 : 0)
  const ipH = ipFits ? ip.h : (ip ? ip.h * 0.4 : 0)

  const focusQ = (focus.bonusCat === planned.categoryId && focus.bonusQ) ? focus.bonusQ : 0
  const focusH = (focus.bonusCat === planned.categoryId && focus.bonusH) ? focus.bonusH : 0

  const fameH = clamp((station.fame || 0) / 100, 0, 1) * 1.2

  // Staff effects
  const contentQ = (staffEffect(station, 'content').qBonus) || 0
  const mktgEff = staffEffect(station, 'marketing')
  const mktgImpact = mktgEff.mktgImpact || 1.0
  const tech = techBonuses(planned)
  const campHype = station.activeCampaign?.hypeBoost || 0

  const rawQuality = clamp(
    cat.base_q + topic.q
    + (dir?.q || 0) * dMatch
    + (star?.q || 0) * sMatch
    + (star2?.q || 0) * s2Match * 0.75
    + ipQ + mktg.q + focusQ + localBonus + seqBonus
    + contentQ + tech.q,
    1, 10,
  )
  const rawHype = clamp(
    cat.base_h + topic.h
    + (dir?.h || 0) * dMatch
    + (star?.h || 0) * sMatch
    + (star2?.h || 0) * s2Match * 0.75
    + ipH + mktg.h * mktgImpact + focusH + fameH + slotBonusH + seasonBonusH
    + tech.h + campHype,
    1, 10,
  )

  // Specialization bonus (per category). Keeps projections consistent with
  // what the airing roll will actually produce.
  const bumped = applySpecBonuses(rawQuality, rawHype, station, planned.categoryId)
  const quality = bumped.q
  const hype = bumped.h

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
/** Air one month of a planned program — produces quality/hype/rating + metadata.
 *  Audience is NOT computed here. Use assignAudiences() afterwards to fill in
 *  audience & revenue across all airings in a given month with competition.
 *
 *  When `planned` is a run linked to a program (programId set), we use the
 *  program's locked-in trueQ/trueH as the base instead of recomputing from
 *  director+star+IP. This makes a built show's identity stable across airings;
 *  only the live noise + seasonal/slot bonuses vary month to month. */
export function airShow(planned, station, research, monthIdx = 0) {
  // Try the program-anchored path first
  let baseQ, baseH, tier, slotBonusH = 0, seasonBonusH = 0, isPeak = false, peakBonus = 0
  const proj = projectShow(planned, station, research, monthIdx)

  if (planned.programId) {
    const prog = (station.programs || []).find(p => p.id === planned.programId)
    if (prog) {
      baseQ = prog.trueQ
      // Use the locked H but layer in slot+seasonal bonuses (those vary by month)
      baseH = clamp((prog.trueH + (proj.slotBonusH || 0) + (proj.seasonBonusH || 0)), 0, 10)
      tier = proj.tier
      slotBonusH = proj.slotBonusH || 0
      seasonBonusH = proj.seasonBonusH || 0
      isPeak = proj.isPeak || false
      peakBonus = proj.peakBonus || 0
    }
  }

  if (baseQ == null) {
    baseQ = proj.quality
    baseH = proj.hype
    tier = proj.tier
    slotBonusH = proj.slotBonusH || 0
    seasonBonusH = proj.seasonBonusH || 0
    isPeak = proj.isPeak || false
    peakBonus = proj.peakBonus || 0
  }

  // Live noise — bigger swing on hype than quality.
  const qLive = clamp(baseQ + rnd(-1.0, 1.0), 1, 10)
  const hLive = clamp(baseH + rnd(-1.4, 1.4), 1, 10)

  const rating = clamp(qLive * 0.55 + hLive * 0.45 + rnd(-0.3, 0.3), 1, 10)

  return {
    ...planned,
    quality: r2(qLive),
    hype: r2(hLive),
    rating: r2(rating),
    tier,
    monthIdx,
    isPeak,
    peakBonus,
    slotBonusH,
    seasonBonusH,
    audience: 0,        // assigned later by assignAudiences()
    revenue: 0,
    demoBreakdown: null,
  }
}

// ─── DEMOGRAPHIC AUDIENCE MODEL ──────────────────────────────────────────────
/** Get effective per-demo appeal for a show.
 *  Returns { kids: 1.4, youngM: 0.8, ... } mapping demo id → appeal multiplier.
 *  Topic-level overrides REPLACE category appeal for specified demos. */
export function showAppealByDemo(show) {
  // Sports rights → treat as live sports
  const catId = show.sportsRunLeagueId ? 'sports'
              : show.movieId ? 'movie'
              : show.categoryId
  const topicId = show.sportsRunLeagueId ? 'live' : show.topicId

  const out = {}
  for (const demoId of DEMO_ORDER) {
    const demo = DEMOS[demoId]
    let baseAppeal = demo.appeal[catId] ?? 0.3
    // Topic override?
    const topicOver = TOPIC_APPEAL_OVERRIDES[catId]?.[topicId]?.[demoId]
    if (topicOver !== undefined) baseAppeal = topicOver
    out[demoId] = baseAppeal
  }
  return out
}

/** Given all airings happening this month in this market (player + competitors),
 *  fill in each airing's `audience` field based on the demographic model and
 *  competition for each demo's available eyeballs. Returns nothing — mutates
 *  airings in place. */
export function assignAudiences(airings, market, stationFameById, monthIdx) {
  if (!airings || airings.length === 0) return

  // Group airings by slot — each slot only competes against other airings in
  // the same slot at the same time.
  const bySlot = {}
  for (const a of airings) {
    const sid = a.slotTypeId || 'prime'
    if (!bySlot[sid]) bySlot[sid] = []
    bySlot[sid].push(a)
  }

  // For each slot, compute per-demo competition
  for (const [slotId, slotAirings] of Object.entries(bySlot)) {
    const slotType = SLOT_TYPES[slotId] || SLOT_TYPES.prime

    // Precompute each airing's appeal+pull per demo
    const pulls = slotAirings.map(a => {
      const appeal = showAppealByDemo(a)
      const stationFame = stationFameById[a.stationId] ?? a._stationFame ?? 10
      const fameFactor = clamp(0.35 + (stationFame / 100) * 0.65, 0.35, 1.0)
      const appealNorm = (a.quality * 0.4 + a.hype * 0.6) / 10
      const pullByDemo = {}
      for (const demoId of DEMO_ORDER) {
        pullByDemo[demoId] = appeal[demoId] * appealNorm * fameFactor
      }
      return { airing: a, appeal, pullByDemo }
    })

    // For each demo, compute total available eyeballs and split among airings
    for (const demoId of DEMO_ORDER) {
      const demo = DEMOS[demoId]
      const demoPop = market.pop * demo.popShare
      const watchShare = demo.watchHours[slotId] ?? 0
      const availableEyeballs = demoPop * watchShare
      if (availableEyeballs <= 0) continue

      // Sum of all pulls in this slot for this demo
      const totalPull = pulls.reduce((s, p) => s + p.pullByDemo[demoId], 0)
      // Ambient noise: a base "other entertainment" sink so very weak shows
      // don't capture 100% of an empty market
      const ambient = Math.max(0.15, totalPull * 0.10)
      const denom = totalPull + ambient

      // Each airing gets share of available eyeballs
      for (const p of pulls) {
        const share = denom > 0 ? p.pullByDemo[demoId] / denom : 0
        const aud = availableEyeballs * share * rnd(0.85, 1.15)  // small noise
        if (!p.airing.demoBreakdown) p.airing.demoBreakdown = {}
        p.airing.demoBreakdown[demoId] = r2(aud)
        p.airing.audience = r2((p.airing.audience || 0) + aud)
      }
    }
  }

  // Cap audience to market.audCap and compute revenue
  for (const a of airings) {
    a.audience = r2(Math.min(a.audience, market.audCap))
    a.revenue = r2(a.audience * market.revPerViewer)
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

/** Air one month for a competitor: top up empty slots, air all active runs, return airings.
 *  Audience is NOT yet computed — caller will call assignAudiences with the full month's airings. */
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

    airings.push({
      runId: run.id,
      stationId: comp.id,
      stationName: comp.name,
      _stationFame: comp.fame,
      slotTypeId: run.slotTypeId,
      categoryId: run.categoryId,
      topicId: run.topicId,
      name: run.name,
      quality: r2(qLive),
      hype: r2(hLive),
      rating: r2(rating),
      audience: 0,        // assigned later
      revenue: 0,
      month: monthIdx,
      year,
    })
    run.aiHistory.push({ month: monthIdx, year, rating })
    run.monthsAired += 1
    if (run.monthsAired >= run.runMonths) expiredIds.push(run.id)
  }

  comp.activeRuns = comp.activeRuns.filter(r => !expiredIds.includes(r.id))
  return airings
}

/** Update competitor station state after their month's airings have audience assigned.
 *  Mutates the competitor in place. */
export function applyCompetitorMonth(comp, airings, market) {
  let totalAudience = 0
  let totalRevenue = 0
  let bestRating = 0
  for (const a of airings) {
    totalAudience += a.audience || 0
    totalRevenue += a.revenue || 0
    if (a.rating > bestRating) bestRating = a.rating
  }
  comp.yearAudienceTotal += totalAudience

  // Fame change based on best show this month
  if (bestRating >= 8.5) comp.fame += 0.4
  else if (bestRating >= 7.0) comp.fame += 0.15
  else if (bestRating <  4.0) comp.fame -= 0.2
  comp.fame = clamp(comp.fame, 0, 200)

  // Cash sim: revenue minus rough operating cost
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
export function planToRun(planned, station, research, year) {
  const monthly = programCost(planned, station, research, year)
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
    audioId: planned.audioId || 'audio_mono',
    subsId:  planned.subsId  || 'subs_none',
    videoId: planned.videoId || 'video_sd',
    runMonths: planned.movieId ? 1 : (planned.sportsRunLeagueId ? 12 : (planned.runMonths || 1)),
    monthsAired: 0,
    monthlyCost: monthly,
    aiHistory: [],
  }
}

/** Run one calendar month — produce airings for all active player runs.
 *  Audience is NOT yet assigned (caller should call assignAudiences afterward
 *  with competitor airings included). Returns:
 *   { airings, expiredRunIds, totalProductionCost, fameDeltaFromRatings } */
export function runMonth(station, research, runs, monthIdx, year) {
  const market = MARKETS[station.market]
  const airings = []
  const expiredRunIds = []
  let totalCost = 0
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
    aired.programId = run.programId || null
    aired.month = monthIdx
    aired.year = year
    aired.seasonNumber = run.seqSeason || 1
    aired.cost = cost
    aired.stationId = '__player__'
    aired.stationName = station.name
    aired._stationFame = station.fame
    airings.push(aired)

    totalCost += cost

    if (aired.rating >= 8.5)      fameDelta += market.famePerWin * 1.0
    else if (aired.rating >= 7.0) fameDelta += market.famePerWin * 0.45
    else if (aired.rating >= 5.0) fameDelta += market.famePerWin * 0.12
    else if (aired.rating <  4.0) fameDelta -= 0.3

    // Update run history — audience filled in after assignAudiences
    run._currentAired = aired
    run.monthsAired += 1
    if (run.monthsAired >= run.runMonths) {
      expiredRunIds.push(run.id)
    }
  }

  return {
    airings,
    expiredRunIds,
    totalProductionCost: r1(totalCost),
    fameDeltaFromRatings: r2(fameDelta),
  }
}

/** Finalize a month: fold audience into totals, push to aiHistory.
 *  Call after assignAudiences. */
export function finalizeMonthForRuns(runs, monthIdx, year) {
  for (const run of runs) {
    if (run._currentAired) {
      run.aiHistory.push({
        month: monthIdx, year,
        rating: run._currentAired.rating,
        audience: run._currentAired.audience,
        net: run._currentAired.net,
      })
      delete run._currentAired
    }
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
  let unlockSearchTier = null

  Object.entries(r.effect || {}).forEach(([k, v]) => {
    if (k === 'refreshRoster') { refreshRoster = true; return }
    if (k === 'addSlot') { addSlotType = v; return }
    if (k === 'unlockSearchTier') { unlockSearchTier = v; return }
    if (k === 'unlockContent') {
      for (const pair of v) {
        const exists = next.contentUnlocks.some(p => p[0] === pair[0] && p[1] === pair[1])
        if (!exists) next.contentUnlocks.push(pair)
      }
      return
    }
    if (k === 'unlockTech') {
      // Already tracked via the `unlocked` array
      return
    }
    if (k === 'unlockScriptTier') {
      // Track which script tiers are unlocked. Normal is always available;
      // large / super are gated.
      next.scriptTiersUnlocked = Array.from(new Set([...(next.scriptTiersUnlocked || []), v]))
      return
    }
    next[k] = v
  })
  return { research: next, addSlotType, refreshRoster, unlockSearchTier }
}

/** Which script tiers can the station use right now? Normal always; large/super
 *  if their respective research has unlocked them. */
export function availableScriptTiers(research) {
  const unlocked = new Set(research?.scriptTiersUnlocked || [])
  unlocked.add('normal')
  return SCRIPT_TIERS.filter(t => unlocked.has(t.id))
}

export function canResearch(researchId, researchState, station) {
  const r = RESEARCH.find(x => x.id === researchId)
  if (!r) return false
  const unlocked = researchState.unlocked || []
  const inProgress = (researchState.inProgress || []).map(p => p.id)
  if (!r.repeatable && unlocked.includes(researchId)) return false
  if (inProgress.includes(researchId)) return false
  if (r.requires && !r.requires.every(req => unlocked.includes(req))) return false
  // Market-tier gate: some research items only unlock at metro / national.
  // If station is provided, enforce; if not (legacy callers), skip the check.
  if (r.requiresMarket && station) {
    const need = MARKET_ORDER.indexOf(r.requiresMarket)
    const have = MARKET_ORDER.indexOf(station.market)
    if (have < need) return false
  }
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

  // Free starting writer: pick a Common-tier writer matching the focus
  // category if possible, otherwise any Common writer.
  const startWriter =
    WRITERS.find(w => w.specialty === focusCat && w.tier === 'Common') ||
    WRITERS.find(w => w.tier === 'Common') ||
    WRITERS[0]

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
    brandId: setup.brandId || 'ember',
    focus: focus.id,
    market: 'local',
    fame: 5,
    cash: startingCash,
    hiredDirectors: startDirs.map(t => makeStartContract(t, 'director')),
    hiredStars:     startStars.map(t => makeStartContract(t, 'star')),
    hiredWriters: startWriter ? [{
      talentId: startWriter.id,
      role: 'writer',
      contractType: 'permanent',
      permanent: true,
      monthsLeft: null,
      perMonthCharge: 0,           // free starter — no salary
      upfrontPaid: 0,
      freeStarter: true,
    }] : [],
    scripts: [],
    programs: [],
    slotIds: [...DEFAULT_SLOT_IDS],
    sportsLicenses: [],         // {leagueId, year}
    ipLicenses: [],             // {ipId, expiresYear}
    staff: {                    // { roleId: {name,tier,...} | null }
      personnel: null, innovation: null, operations: null, marketing: null, content: null,
    },
    openPositions: [],          // [{role, tierId, monthsLeft, monthsTotal, cost}]
    activeCampaign: null,       // {tierId, hypeBoost}
    moviePacks: [],             // [{packId, airingsLeft, purchasedY/M, purchaseHype, ...}]
    specStars: SPEC_GENRES.reduce((acc, g) => {
      acc[g] = g === focusCat ? 1 : 0
      return acc
    }, {}),
    specXP: SPEC_GENRES.reduce((acc, g) => { acc[g] = 0; return acc }, {}),
  }

  return {
    phase: 'plan',
    station,
    monthIdx: 0,
    year: 1,
    runs: [],
    plans: station.slotIds.map(id => emptyPlanned(id)),
    yearShows: [],
    allShows: [],
    competitorAllShows: [],
    competitors: initCompetitors('local'),
    marketRoster: buildMarketRoster(station, 0),
    scoutLevel: 0,
    research: { unlocked: [], contentUnlocks: [], inProgress: [] },
    awards: null,
    lastMonthResult: null,
    ownedShows: [],
    pendingHires: [],            // resolved positions waiting for player to pick a candidate
    ledger: [],                  // [{ year, month, kind, label, amount, programId?, programName? }]
    log: [
      `📡 ${station.name} broadcasting on ${MARKETS.local.label}`,
      `Free starting roster: ${startDirs.length} directors, ${startStars.length} stars (12-month contracts)${startWriter ? `, 1 writer (${startWriter.name}, free)` : ''}`,
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
    // tech quality defaults to baseline
    audioId: 'audio_mono',
    subsId:  'subs_none',
    videoId: 'video_sd',
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

// ─── SPECIALIZATION ──────────────────────────────────────────────────────────
// Stations level up in each genre by airing programs there. Each airing's
// rating is added to that genre's XP. Crossing a threshold awards a half-star.
// Range: 0 → 5 stars, in 0.5 increments → 10 tiers.
//
// XP threshold to advance from star tier N (0..9, where N=0 is "0 stars") to
// star tier N+1 (so N=0 means earning the FIRST half-star, requiring 10 XP):
export const SPEC_THRESHOLDS_LOCAL = [10, 20, 30, 40, 55, 70, 85, 100, 120, 140]

// Metro and national tiers raise the bar — same content earns less progress.
// Once stars actually impact production (v8), the curves will matter more.
export const SPEC_THRESHOLDS_METRO    = SPEC_THRESHOLDS_LOCAL.map(t => Math.round(t * 1.4))
export const SPEC_THRESHOLDS_NATIONAL = SPEC_THRESHOLDS_LOCAL.map(t => Math.round(t * 1.9))

// Genres that participate in the specialization system (8 total).
export const SPEC_GENRES = ['news', 'reality', 'series', 'latenight', 'sports', 'movie', 'family', 'kids']

/** Convert star count (0..5 in 0.5 steps) to current tier-index (0..9). */
export function specTierIndex(stars) {
  return Math.max(0, Math.min(9, Math.round(stars * 2)))
}

/** Look up the XP needed to climb FROM the current star tier to the next.
 *  Returns null when already at the cap (5 stars). */
export function specThresholdFor(stars, market) {
  if (stars >= 5) return null
  const table = market === 'national' ? SPEC_THRESHOLDS_NATIONAL
              : market === 'metro'    ? SPEC_THRESHOLDS_METRO
              :                         SPEC_THRESHOLDS_LOCAL
  return table[specTierIndex(stars)]
}

/** Apply an airing's XP gain to the station's specialization state.
 *  Mutates a new station object (pure: returns new state).
 *  Returns { station, starUps: [{categoryId, oldStars, newStars}] }.
 *
 *  XP rule: each airing contributes max(1, rating) per airing. A flop floors
 *  to 1, so you learn slowly even from bad shows. A hit (9 rating) gives 9.
 *  Sports leagues and movies have categoryIds 'sports' and 'movie' so they
 *  count too.
 */
export function applySpecXP(station, categoryId, rating) {
  if (!categoryId || !SPEC_GENRES.includes(categoryId)) {
    return { station, starUps: [] }
  }
  const xpGain = Math.max(1, rating || 0)
  const specXP = { ...(station.specXP || {}) }
  const specStars = { ...(station.specStars || {}) }
  const cur = specStars[categoryId] || 0
  const accumulated = (specXP[categoryId] || 0) + xpGain

  // Climb as many tiers as the accumulated XP allows (handle very high ratings
  // spanning a tier; in practice unlikely with rating ≤ 10).
  let stars = cur
  let pool = accumulated
  const starUps = []
  while (stars < 5) {
    const need = specThresholdFor(stars, station.market)
    if (need == null || pool < need) break
    pool -= need
    const newStars = Math.round((stars + 0.5) * 10) / 10
    starUps.push({ categoryId, oldStars: stars, newStars })
    stars = newStars
  }
  specXP[categoryId] = pool
  specStars[categoryId] = stars

  return {
    station: { ...station, specXP, specStars },
    starUps,
  }
}

/** Apply market promotion to specialization state (v8 will call this).
 *  Local → Metro:    keep specialty (min 0.5) + any star ≥ 4 (clamped to 1),
 *                    everything else resets.
 *  Metro → National: same rule.
 */
export function specOnMarketPromotion(station, oldMarket, newMarket) {
  const oldStars = station.specStars || {}
  const next = {}
  for (const g of SPEC_GENRES) {
    const s = oldStars[g] || 0
    if (g === station.focus) {
      next[g] = Math.max(0.5, s >= 4 ? 1 : 0.5)
    } else if (s >= 4) {
      next[g] = 1
    } else {
      next[g] = 0
    }
  }
  return { ...station, specStars: next, specXP: {} }
}

// ─── SPECIALIZATION BONUSES ──────────────────────────────────────────────────
// Lookup tables — index by half-star tier (0..10, where 10 = 5 stars).
// Quality bonus applies from the very first half-star and grows mildly
// accelerated (each star is slightly more than the last). Hype bonus is zero
// until 3 stars — at that point your network is known enough that audiences
// anticipate something new in that genre.
//
//   stars  | q bonus | h bonus
//   0      |  0      |  0
//   0.5    | +0.1    |  0
//   1.0    | +0.2    |  0
//   1.5    | +0.35   |  0
//   2.0    | +0.5    |  0
//   2.5    | +0.7    |  0
//   3.0    | +0.9    | +0.3
//   3.5    | +1.1    | +0.5
//   4.0    | +1.3    | +0.7
//   4.5    | +1.5    | +1.0
//   5.0    | +1.8    | +1.3
const SPEC_Q_BONUS = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.8]
const SPEC_H_BONUS = [0, 0,   0,   0,    0,   0,   0.3, 0.5, 0.7, 1.0, 1.3]

/** Lookup the quality bonus for a given star count. Star count is in 0.5
 *  increments. Out-of-range values clamp to bounds. */
export function specQualityBonus(stars) {
  if (!stars || stars <= 0) return 0
  const idx = Math.max(0, Math.min(10, Math.round(stars * 2)))
  return SPEC_Q_BONUS[idx] || 0
}

/** Lookup the hype bonus for a given star count. Zero below 3 stars. */
export function specHypeBonus(stars) {
  if (!stars || stars <= 0) return 0
  const idx = Math.max(0, Math.min(10, Math.round(stars * 2)))
  return SPEC_H_BONUS[idx] || 0
}

/** Apply specialization bonuses to a rolled (q, h) pair given a station +
 *  category. Returns { q, h, qBonus, hBonus } with the bonuses already
 *  folded into q and h (still clamped to 0..10). The raw bonuses are exposed
 *  so the UI can show the player what they earned. */
export function applySpecBonuses(q, h, station, categoryId) {
  if (!categoryId || !SPEC_GENRES.includes(categoryId)) {
    return { q, h, qBonus: 0, hBonus: 0 }
  }
  const stars = (station?.specStars || {})[categoryId] || 0
  const qBonus = specQualityBonus(stars)
  const hBonus = specHypeBonus(stars)
  return {
    q: clamp(q + qBonus, 0, 10),
    h: clamp(h + hBonus, 0, 10),
    qBonus,
    hBonus,
  }
}

// ─── LEDGER ──────────────────────────────────────────────────────────────────
// A flat array of cash-flow events. Pushed to game.ledger throughout the month.
// At month-end, the Financials screen filters/groups these for the prior month.
//
// kind values:
//   'program_revenue'   — money earned from an airing (positive)
//   'program_airing'    — recurring airing/transmission cost (negative)
//   'program_build'     — upfront program build cost (negative; only when paid)
//   'rights_sports'     — sports league rights purchase
//   'rights_ip'         — IP license purchase
//   'salary_talent'     — permanent talent monthly salary (negative)
//   'salary_writer'     — writer monthly salary (negative)
//   'salary_staff'      — staff monthly salary (negative)
//   'research'          — research project paid upfront
//   'marketing'         — network marketing campaign
//   'hire_signing'      — upfront signing payment for talent/writer/position
//   'fire_penalty'      — penalty paid when firing
//   'award_bonus'       — cash awarded at year-end (positive)
//
// Sign convention: amount is the cash delta (revenue positive, expense negative).
export function ledgerEntry({ year, month, kind, label, amount, programId, programName, meta }) {
  return {
    year, month, kind, label,
    amount: r1(amount),
    programId: programId || null,
    programName: programName || null,
    ...(meta ? { meta } : {}),
  }
}

/** Filter ledger to a specific (year, month). */
export function ledgerForMonth(ledger, year, month) {
  return (ledger || []).filter(e => e.year === year && e.month === month)
}

/** Group ledger entries by program for "Direct programming margin" view.
 *  Returns { byProgram: Map<programId, {name, revenue, airingCost, buildCost}>,
 *            other: {sportsRights, ipRights, salaries: {talent,writer,staff,total}, research, marketing, hires, firePenalties, awards, totalOther},
 *            totals: {programRevenue, programExpense, otherNet, net} }
 */
export function summarizeLedger(entries) {
  const byProgram = new Map()
  const ensure = (id, name) => {
    if (!byProgram.has(id)) byProgram.set(id, {
      programId: id, name: name || '(unknown)',
      revenue: 0, airingCost: 0, buildCost: 0,
    })
    return byProgram.get(id)
  }

  const other = {
    sportsRights: [],   // [{label, amount}]
    ipRights: [],
    salaries: { talent: 0, writer: 0, staff: 0, total: 0 },
    research: [],
    marketing: [],
    hires: [],
    firePenalties: [],
    awards: [],
    infrastructure: [],
    promotion: [],
    misc: [],
  }

  for (const e of entries || []) {
    switch (e.kind) {
      case 'program_revenue': {
        const slot = ensure(e.programId, e.programName)
        slot.revenue += e.amount
        break
      }
      case 'program_airing': {
        const slot = ensure(e.programId, e.programName)
        slot.airingCost += e.amount
        break
      }
      case 'program_build': {
        const slot = ensure(e.programId, e.programName)
        slot.buildCost += e.amount
        break
      }
      case 'rights_sports': other.sportsRights.push({ label: e.label, amount: e.amount }); break
      case 'rights_ip':     other.ipRights.push({ label: e.label, amount: e.amount }); break
      case 'salary_talent': other.salaries.talent += e.amount; other.salaries.total += e.amount; break
      case 'salary_writer': other.salaries.writer += e.amount; other.salaries.total += e.amount; break
      case 'salary_staff':  other.salaries.staff  += e.amount; other.salaries.total += e.amount; break
      case 'research':      other.research.push({ label: e.label, amount: e.amount }); break
      case 'marketing':     other.marketing.push({ label: e.label, amount: e.amount }); break
      case 'hire_signing':  other.hires.push({ label: e.label, amount: e.amount }); break
      case 'fire_penalty':  other.firePenalties.push({ label: e.label, amount: e.amount }); break
      case 'award_bonus':   other.awards.push({ label: e.label, amount: e.amount }); break
      case 'infrastructure': other.infrastructure.push({ label: e.label, amount: e.amount }); break
      case 'market_promotion': other.promotion.push({ label: e.label, amount: e.amount }); break
      default:              other.misc.push({ label: e.label, amount: e.amount })
    }
  }

  // Programs totals
  let programRevenue = 0
  let programAiringCost = 0
  let programBuildCost = 0
  for (const p of byProgram.values()) {
    programRevenue += p.revenue
    programAiringCost += p.airingCost
    programBuildCost += p.buildCost
    p.revenue = r1(p.revenue)
    p.airingCost = r1(p.airingCost)
    p.buildCost = r1(p.buildCost)
    p.margin = r1(p.revenue + p.airingCost + p.buildCost) // costs are negative
  }

  // Round salary buckets
  other.salaries.talent = r1(other.salaries.talent)
  other.salaries.writer = r1(other.salaries.writer)
  other.salaries.staff  = r1(other.salaries.staff)
  other.salaries.total  = r1(other.salaries.total)

  // Sum "other" net
  const sum = (arr) => arr.reduce((a, x) => a + (x.amount || 0), 0)
  const otherNet = r1(
    sum(other.sportsRights) +
    sum(other.ipRights) +
    other.salaries.total +
    sum(other.research) +
    sum(other.marketing) +
    sum(other.hires) +
    sum(other.firePenalties) +
    sum(other.awards) +
    sum(other.infrastructure) +
    sum(other.promotion) +
    sum(other.misc)
  )

  const programExpense = r1(programAiringCost + programBuildCost) // already negative
  const programMargin  = r1(programRevenue + programExpense)
  const net            = r1(programMargin + otherNet)

  return {
    byProgram: Array.from(byProgram.values()).sort((a, b) => (b.revenue + b.airingCost + b.buildCost) - (a.revenue + a.airingCost + a.buildCost)),
    other,
    totals: {
      programRevenue: r1(programRevenue),
      programAiringCost: r1(programAiringCost),
      programBuildCost: r1(programBuildCost),
      programExpense,
      programMargin,
      otherNet,
      net,
    },
  }
}

