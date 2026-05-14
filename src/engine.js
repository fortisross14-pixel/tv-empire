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
  DIRECTOR_ROLES, DIRECTOR_EFFECTS, DIRECTOR_SALARY, DIRECTOR_HIRE_COST, DIRECTOR_FIRE_PENALTY,
  MERCH_PREPARE_COST, MERCH_BASE_REVENUE, MERCH_HYPE_EXPONENT,
  AUTO_SCHED_Q_MULT, AUTO_SCHED_H_MULT,
  AUTO_SCHED_BASE_Q_MIN, AUTO_SCHED_BASE_Q_MAX,
  AUTO_SCHED_BASE_H_MIN, AUTO_SCHED_BASE_H_MAX,
  IP_LICENSE_TERMS, NETWORK_CAMPAIGNS, computeCampaignInputMultiplier,
  MOVIE_PACK_REBUY_HYPE_PENALTY, MOVIE_PACK_COOLDOWN_MONTHS,
  SCRIPT_TIERS, findScriptTier, SCRIPT_TIER_RANK, STAR_TIER_MAX_FOR_SCRIPT,
  WRITERS, WRITERS_CAP, SCRIPT_HYPE_DECAY, SCRIPT_HYPE_MIN, SCRIPT_HYPE_MAX,
  PROD_DESIGN_TIERS, SFX_TIERS, PRODUCTION_METHODS,
  AFFINITY_GOOD_Q, AFFINITY_GOOD_H, AFFINITY_BAD_Q, AFFINITY_BAD_COST_MULT,
  LIVE_PREP_FRACTION, LIVE_AIRING_FRACTION,
  PREPRODUCED_TRANSMISSION_FRACTION, MOVIE_EDITING_FRACTION,
  ESTIMATION_RANGE,
  MUSIC_TIERS, CATEGORY_QUALITY_WEIGHTS, REVIEW_OUTLETS, scoreBand, VERDICT_LABELS,
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
  // Talent room cap — refuse hires that would put us over.
  if (talentCount(station) >= talentCapacity(station)) {
    return {
      station, charged: 0,
      error: `Talent room is full (${talentCapacity(station)}). Fire someone or upgrade.`,
    }
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
  // Talent room cap shared across writers + creative directors + stars.
  if (talentCount(station) >= talentCapacity(station)) {
    return {
      station, charged: 0,
      error: `Talent room is full (${talentCapacity(station)}). Fire someone or upgrade.`,
    }
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
      // Creative Director multiplier — only on first-time completion, not
      // refresh. Keep clamped to the tier cap so super-scripts can't escape
      // their natural ceiling.
      const cdMult = creativeDirectorScriptMult(station)
      if (cdMult !== 1.0) {
        baseQuality = r1(Math.min(tierDef.qCap, baseQuality * cdMult))
      }
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
  // Director of Production: −15% on top-tier choices (pd_adhoc, sfx_heavy, etc.).
  const pdMod  = productionDirectorMods(station, opts.prodDesignId)
  const sfxMod = productionDirectorMods(station, opts.sfxId)
  const tierCost = (pd?.cost || 0) * pdMod.costMult
                 + (sfx?.cost || 0) * sfxMod.costMult
                 + (music?.cost || 0)
  // Apply affinity cost multiplier (bad fits raise cost)
  const aff = affinityMods(opts.prodDesignId, opts.sfxId, opts.categoryId)
  // Merchandising upfront prep cost — only for large/super scripts when
  // prepareMerch is on. Resolve script tier from the chosen script.
  let merchCost = 0
  if (opts.prepareMerch && opts.scriptId) {
    const s = (station.scripts || []).find(x => x.id === opts.scriptId)
    if (s?.tier === 'large' || s?.tier === 'super') {
      merchCost = merchPrepareCost(s.tier)
    }
  }
  const total = (baseCost + tierCost) * aff.costMult + merchCost
  return r1(total)
}

/** Find a music tier by id. */
export const findMusic = id => MUSIC_TIERS.find(m => m.id === id) || null

/** Split the affinityMods qDelta into art (prod-design contribution) and
 *  technical (sfx contribution). Both also pump up by tier intrinsic qBonus.
 *  Director of Production adds +15% to the q contribution of top-tier prod
 *  design and SFX choices.
 *  Returns { artDelta, technicalDelta, costMult }. */
function affinityComponents(prodDesignId, sfxId, categoryId, station = null) {
  const pd = findProdDesign(prodDesignId)
  const sfx = findSfx(sfxId)
  const pdMod  = productionDirectorMods(station, prodDesignId)
  const sfxMod = productionDirectorMods(station, sfxId)
  let artDelta = 0
  let technicalDelta = 0
  let costMult = 1
  if (pd) {
    artDelta += (pd.qBonus || 0) * pdMod.qMult
    const outcome = affinityOutcome(pd, categoryId)
    if (outcome === 'good') artDelta += AFFINITY_GOOD_Q
    else if (outcome === 'bad') { artDelta += AFFINITY_BAD_Q; costMult *= AFFINITY_BAD_COST_MULT }
  }
  if (sfx) {
    // SFX splits 60/40 between technical and art
    const sfxBoost = (sfx.qBonus || 0) * sfxMod.qMult
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
function rollProgramComponents(opts, station, research, deterministic = false) {
  // When `deterministic` is true, all `rnd()` noise becomes 0. Used by
  // projectShow / estimateProgramQH to produce stable predictions that match
  // the airing path's *central tendency*. The estimate UI applies ±variance
  // around this stable value to show the player a plausible range.
  const noise = deterministic ? (() => 0) : rnd
  // ── MOVIE PATH ──────────────────────────────────────────────────────────
  // Movies arrive finished. Only marketing + tech tiers can nudge the score;
  // our prod-design/SFX/music tier choices don't apply. Hype is read from the
  // active pack (locked in at purchase, possibly penalized by a cooldown).
  if (opts.movieId) {
    const m = findMovie(opts.movieId)
    const mkt = findMarketing(opts.marketingId)
    const tech = techBonus(opts.audioId, opts.subsId, opts.videoId, station)
    const baseH = moviePackAiringHype(station, opts.movieId)
    const rawQ = clamp((m?.q || 5) + (mkt?.q || 0) + tech.q, 0, 10)
    const rawH = clamp(baseH + (mkt?.h || 0) + tech.h, 0, 10)
    // Specialization bonus — movies count as 'movie' genre
    const bumped = applySpecBonuses(rawQ, rawH, station, 'movie')
    const q = bumped.q
    const h = compressHype(bumped.h)
    // Synthesize components clustered around q so UI is consistent
    return {
      narrative: r1(clamp(q + noise(-0.5, 0.5), 0, 10)),
      art: r1(clamp(q + noise(-0.3, 0.5), 0, 10)),
      innovation: r1(clamp(q + noise(-0.7, 0.3), 0, 10)),
      technical: r1(clamp(q + tech.q * 0.5 + noise(-0.4, 0.4), 0, 10)),
      q: r1(q), h: r1(h),
    }
  }

  // ── SPORTS PATH ─────────────────────────────────────────────────────────
  if (opts.sportsLeagueId) {
    const lg = findLeague(opts.sportsLeagueId)
    const mkt = findMarketing(opts.marketingId)
    const tech = techBonus(opts.audioId, opts.subsId, opts.videoId, station)
    const aff = affinityComponents(opts.prodDesignId, opts.sfxId, opts.categoryId, station)
    const music = findMusic(opts.musicId)
    const dir = findDirector(opts.directorId)
    const star = findStar(opts.starId)

    // Sports-specific component model
    // Narrative — commentators (star/dir) — small but matters
    const narrative = clamp(
      (lg?.baseQ || 5) * 0.3
      + (star ? star.q * (star.specialty === 'sports' ? 1 : 0.5) * 0.6 : 0)
      + (dir ? dir.q * (dir.specialty === 'sports' ? 1 : 0.5) * 0.4 : 0)
      + noise(-0.5, 0.5)
    , 0, 10)
    // Art — graphics, themes, music; secondary
    const art = clamp(
      (lg?.baseQ || 5) * 0.3
      + aff.artDelta
      + (music?.artBonus || 0)
      + noise(-0.4, 0.4)
    , 0, 10)
    // Innovation — director's vision + freshness of format
    const innovation = clamp(
      (lg?.baseQ || 5) * 0.4
      + (dir ? dir.q * (dir.specialty === 'sports' ? 1 : 0.5) * 0.5 : 0)
      + noise(-0.5, 0.5)
    , 0, 10)
    // Technical — the actual broadcast
    const technical = clamp(
      (lg?.baseQ || 5) * 0.6
      + aff.technicalDelta
      + tech.q * 1.5
      + noise(-0.3, 0.3)
    , 0, 10)
    // Per-market hype multiplier — college and regional leagues run hot in
    // local/metro markets but cool at national scale, where they compete with
    // pro leagues. Defaults to 1.0 everywhere if absent.
    const mhm = (lg?.marketHypeMult && lg.marketHypeMult[station.market]) || 1.0
    const h = clamp(((lg?.baseH || 5) * mhm) + (mkt?.h || 0) + tech.h, 0, 10)
    const rawQ = weightedQuality({ narrative, art, innovation, technical }, opts.categoryId)
    // Specialization bonus — sports broadcasts count as 'sports' genre
    const bumped = applySpecBonuses(rawQ, h, station, 'sports')
    return {
      narrative: r1(narrative), art: r1(art), innovation: r1(innovation), technical: r1(technical),
      q: r1(bumped.q), h: r1(compressHype(bumped.h)),
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
  const tech = techBonus(opts.audioId, opts.subsId, opts.videoId, station)
  const aff = affinityComponents(opts.prodDesignId, opts.sfxId, opts.categoryId, station)
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
    baseQ * 0.45 + writerNarr + scriptNarr + starNarr + ipNarr + musicNarr + noise(-0.4, 0.4)
  , 0, 10)

  // ── ART ─────────────────────────────────────────────────────────────────
  // Prod-design and music drive this most. Star contributes presence.
  const dirArt = dir ? dir.q * dirMatch * 0.4 : 0
  const starArt = starQContrib * 0.4
  const ipArt = ip ? (ip.q || 0) * 0.3 : 0
  const musicArt = music?.artBonus || 0
  const art = clamp(
    baseQ * 0.35 + aff.artDelta + dirArt + starArt + ipArt + musicArt + noise(-0.4, 0.4)
  , 0, 10)

  // ── INNOVATION ─────────────────────────────────────────────────────────
  // Director's creative vision + writer freshness. New IPs add a touch.
  const dirInnov = dir ? dir.q * dirMatch * 0.7 : 0
  const writerInnov = writer ? writer.skill * 2.5 * (writer.specialty === opts.categoryId ? 1 : 0.6) : 0
  const ipInnov = ip ? (ip.q || 0) * 0.4 : 0
  const innovation = clamp(
    baseQ * 0.35 + dirInnov + writerInnov + ipInnov + noise(-0.5, 0.5)
  , 0, 10)

  // ── TECHNICAL ──────────────────────────────────────────────────────────
  // Audio/subs/video tiers drive this, plus SFX rigor.
  const technical = clamp(
    baseQ * 0.4 + aff.technicalDelta + tech.q * 1.6 + noise(-0.3, 0.3)
  , 0, 10)

  // Weighted overall Q
  const rawQ = weightedQuality({ narrative, art, innovation, technical }, opts.categoryId)

  // ── HYPE ───────────────────────────────────────────────────────────────
  // Hype is its own track — script hype, star+director hype, IP hype, marketing.
  // scriptH contribution intentionally modest — script hype was previously
  // *3 which let any decent script push hype into the 7-8 range regardless
  // of cast/marketing. Dialed back to *2 so hype reflects the full package
  // (talent, marketing, slot) rather than the script alone.
  const scriptH = script ? (script.hype / 100) * 2 : 0
  const dirH = dir ? dir.h * dirMatch : 0
  const starH = starHContrib
  const ipH = ip ? (ip.h || 0) : 0
  const rawH = clamp(baseH + scriptH + dirH + starH + ipH + (mkt?.h || 0) + tech.h + noise(-0.4, 0.4), 0, 10)

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
    h: r1(compressHype(bumped.h)),
  }
}

/** Compute weighted Q from components using CATEGORY_QUALITY_WEIGHTS. */
function weightedQuality(c, categoryId) {
  const w = CATEGORY_QUALITY_WEIGHTS[categoryId] || CATEGORY_QUALITY_WEIGHTS.movie
  return c.narrative * w.narrative + c.art * w.art + c.innovation * w.innovation + c.technical * w.technical
}

/** Soft compression on hype above 6. Below 6, hype is unchanged. Above 6,
 *  the slope flattens — every "additional" point of raw hype only buys
 *  ~0.5 points of effective hype. Keeps the top end harder to reach.
 *
 *  6  → 6.0     (no change below threshold)
 *  8  → 7.0     (was easy to hit, now needs more inputs)
 *  10 → 8.0     (raw max becomes 8, still reachable with a stacked show)
 *  Above the math: result = 6 + (h - 6) * 0.5 for h > 6.
 *
 *  Applied to the PLAYER's hype roll at production and airing time. AI
 *  competitor shows roll through a separate path and aren't compressed
 *  (they don't have the same lever-stacking problem). */
function compressHype(h) {
  if (h <= 6) return h
  return 6 + (h - 6) * 0.5
}

/** Legacy adapter — components-aware. Returns { q, h }. */
function rollProgramQH(opts, station, research) {
  const c = rollProgramComponents(opts, station, research)
  return { q: c.q, h: c.h }
}

// helpers used above
function findMarketing(id) { return MARKETING_TIERS.find(m => m.id === id) || null }
function techBonus(audioId, subsId, videoId, station = null) {
  const base = techBonuses({ audioId, subsId, videoId })
  // Director of Production: +15% q on top tech tiers (audio_surround, video_uhd, subs_multi)
  if (!station || !hasDirector(station, 'production')) return base
  const top = DIRECTOR_EFFECTS.production.topTierIds
  const qMult = DIRECTOR_EFFECTS.production.topTierQMult
  let bonusQ = 0
  if (top.includes(audioId)) bonusQ += (AUDIO_TIERS.find(o => o.id === audioId)?.q || 0) * (qMult - 1)
  if (top.includes(subsId))  bonusQ += (SUBTITLE_TIERS.find(o => o.id === subsId)?.q  || 0) * (qMult - 1)
  if (top.includes(videoId)) bonusQ += (VIDEO_TIERS.find(o => o.id === videoId)?.q   || 0) * (qMult - 1)
  return { ...base, q: base.q + bonusQ }
}

/** Estimation range for a planned program — used by build UI live preview.
 *  Does NOT consume a script or modify station state. */
// Variance band shown around the central estimate. This must reflect what the
// player will *actually see at airing time*, not just the production roll.
// Live airing adds ±1.0 noise to qLive (airShow), so the Q axis is genuinely
// uncertain by about that much. Hype is rolled at production then has slot/
// seasonal bonuses applied at scheduling, so the H range is slightly tighter.
const ESTIMATE_VARIANCE_Q = 1.0
const ESTIMATE_VARIANCE_H = 0.8

export function estimateProgramQH(opts, station, research) {
  // The estimate the player sees in production must match what
  // `rollProgramComponents` will actually produce at program-creation time —
  // that becomes `program.trueQ`/`trueH`, which the airing then samples from
  // with ±1 live noise. Calling rollProgramComponents with `deterministic=true`
  // gives us the central tendency (no per-component rnd noise), and we surface
  // ±ESTIMATE_VARIANCE around that as the range.
  //
  // Note: projectShow is intentionally NOT used here. It contains its own
  // simplified scripted-path formula that misses things like the script's
  // baseQuality contribution. Going through rollProgramComponents guarantees
  // estimate ↔ actual parity.
  const rolled = rollProgramComponents(opts, station, research, true)
  const q = rolled.q
  const h = rolled.h
  const components = {
    narrative:  rolled.narrative,
    art:        rolled.art,
    innovation: rolled.innovation,
    technical:  rolled.technical,
  }
  return {
    q, h,
    components,
    qRange: [r1(clamp(q - ESTIMATE_VARIANCE_Q, 0, 10)), r1(clamp(q + ESTIMATE_VARIANCE_Q, 0, 10))],
    hRange: [r1(clamp(h - ESTIMATE_VARIANCE_H, 0, 10)), r1(clamp(h + ESTIMATE_VARIANCE_H, 0, 10))],
  }
}

/** Start a new program build. Pays upfront cost. Locks script if applicable.
 *  Production months count down each tick (via tickPrograms). */
export function beginProgram(station, research, year, opts) {
  if (!opts.name?.trim()) return { station, error: 'Name required' }

  const method = productionMethodFor(opts)
  const isMovie = method === 'instant'
  // Sports rights coverage is a third production type — it has a license but
  // no script, no director/star casting, and no production tiers to choose.
  // The "production" is really just allocating airtime to broadcast a live
  // event we already paid the rights for.
  const isSportsRights = !!opts.sportsLeagueId

  // Validate inputs
  if (isSportsRights) {
    // Need an active license for the year we're producing in.
    if (!ownsLicense(station, opts.sportsLeagueId, year)) {
      return { station, error: 'No active license for that league' }
    }
    // Sports rights uses category 'sports' implicitly — make sure that's set.
    // (ProductionView passes categoryId='sports' for the sports buildType.)
  } else if (!isMovie) {
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
      if (!opt) continue
      if (opt.minScriptTier) {
        const need = SCRIPT_TIER_RANK[opt.minScriptTier] ?? 0
        if (tierRank < need) {
          return { station, error: `${label} "${opt.label}" requires a ${opt.minScriptTier} script` }
        }
      }
      // Research-gated options (e.g. Heavy SFX -> tech_sfx_heavy).
      if (opt.requires && !(research?.unlocked || []).includes(opt.requires)) {
        return { station, error: `${label} "${opt.label}" needs a research unlock first` }
      }
    }
  } else {
    if (!opts.movieId) return { station, error: 'Movie required' }
  }

  // IP check applies to all paths if an IP is selected (rare for sports/movies
  // but the option exists).
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
    // Merchandising prepared at production time. The upfront cost was already
    // baked into programBuildCost. Persisted so each airing can produce
    // merch revenue scaled by quality + hype.
    prepareMerch: !!opts.prepareMerch && (scriptTier === 'large' || scriptTier === 'super'),
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
 *  Returns { station, run, error }.
 *
 *  opts (optional):
 *    moviePlayMode: 'full' | 'single'   — for movie programs only.
 *      'full'   → run length = remaining pack airings (slot frees when pack
 *                 exhausts; one airing per month, pack decrements per airing)
 *      'single' → run length = 1 month; airs one movie, consumes 1 from pack
 *                 (legacy default — pack stays on shelf with airings remaining).
 *      Default: 'single' (preserves existing call sites that didn't pass opts).
 */
export function scheduleProgram(station, programId, slotTypeId, runMonths, opts = {}) {
  const programs = station.programs || []
  const p = programs.find(x => x.id === programId)
  if (!p) return { station, error: 'Program not found' }
  if (p.status !== 'shelf') return { station, error: `Program not on shelf (status: ${p.status})` }

  // ── Movie packs: choose full-pack vs single ────────────────────────────
  // For movies, look up how many airings remain in the active pack record.
  // When the player picks 'full', commit the run to that many months so the
  // slot stays locked for the entire pack. When 'single', keep 1 month.
  // For non-movie programs, this entire block is bypassed.
  let moviePlayMode = null
  let movieAiringsLeft = 0
  if (p.movieId) {
    moviePlayMode = opts.moviePlayMode === 'full' ? 'full' : 'single'
    const ownedPack = findOwnedActivePack(station, p.movieId)
    movieAiringsLeft = ownedPack?.airingsLeft || 1
    if (movieAiringsLeft < 1) return { station, error: 'Pack has no airings remaining' }
  }

  // Run length is LOCKED. Sports always 12 (skipping out-of-season months).
  // Movies: 1 in single mode, airingsLeft in full mode. Scripted: planned.
  const forced = p.movieId
    ? (moviePlayMode === 'full' ? movieAiringsLeft : 1)
    : (p.sportsLeagueId
      ? 12
      : (p.plannedRunMonths || runMonths || 1))

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
    // Merchandising carry-through: if production prepared merch, every airing
    // earns side revenue proportional to hype + quality.
    prepareMerch: !!p.prepareMerch,
    scriptTier: p.tier || 'normal',
    // Movie pack play mode — drives per-airing pack decrement in runMonth.
    moviePlayMode,
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
 *  12-month cooldown. Returns { station, packConsumed, packExhausted }.
 *
 *  opts (optional):
 *    moviePlayMode: 'full' | 'single' — only used for movies. When 'full',
 *      pack has already been decremented per-airing during runMonth, so we
 *      skip the decrement here and just inspect the current pack state.
 */
export function finishProgram(station, programId, finalStats, year, month, opts = {}) {
  const programs = station.programs || []
  const p = programs.find(pp => pp.id === programId)
  if (!p) return { station, packConsumed: false, packExhausted: false }

  // ── MOVIE PACK PATH ──────────────────────────────────────────────────
  if (p.movieId) {
    const owned = findOwnedActivePack(station, p.movieId)
    const movieMode = opts.moviePlayMode || 'single'

    // FULL-PACK PATH: pack has already been decremented per-airing in runMonth.
    // The run completed naturally because runMonths == initial airingsLeft.
    // So the pack should be at 0 by now; treat as exhausted.
    if (movieMode === 'full') {
      const newPrograms = programs.map(pp => pp.id === programId
        ? { ...pp, status: 'finished',
            airingsCount: finalStats?.airingsCount ?? pp.airingsCount,
            totalAudience: finalStats?.totalAudience ?? pp.totalAudience,
            totalRevenue: finalStats?.totalRevenue ?? pp.totalRevenue,
            totalCost: finalStats?.totalCost ?? pp.totalCost,
          }
        : pp)
      // Mark cooldown stamp if not already set
      let newPacks = (station.moviePacks || []).map(mp => ({ ...mp }))
      const idx = newPacks.findIndex(mp => mp.packId === p.movieId)
      if (idx >= 0 && (newPacks[idx].airingsLeft || 0) === 0 && newPacks[idx].lastConsumedY == null) {
        newPacks[idx].lastConsumedY = year
        newPacks[idx].lastConsumedM = month
      }
      return {
        station: { ...station, programs: newPrograms, moviePacks: newPacks },
        packConsumed: true,
        packExhausted: true,
      }
    }

    // SINGLE-MODE PATH: legacy behavior — decrement by 1 here.
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
/** Generate a three-outlet review for a freshly-aired program.
 *  Returns an object:
 *    {
 *      rating,            // 0..10 — the live airing rating for context
 *      aggregate,         // 0..10 — average of the three outlet scores
 *      band,              // 'flop'|'soft'|'solid'|'hit'|'blockbuster'
 *      verdict,           // { label, tone } from VERDICT_LABELS
 *      components,        // copy of program.components
 *      outlets: [{ id, name, icon, description, score, band, line }, ...]
 *    }
 *  Returns null for movies (movies skip the review modal).
 */
export function generateReviews(program, firstAiring, networkName) {
  if (program.movieId) return null
  const c = program.components
  if (!c) return null
  const rating = firstAiring?.rating || program.trueQ

  const outlets = REVIEW_OUTLETS.map(o => {
    const score = clamp(o.scoreFrom(c) || 0, 0, 10)
    const band = scoreBand(score)
    const pool = o.lines[band] || o.lines.solid
    const line = pool[Math.floor(Math.random() * pool.length)]
      .replaceAll('{network}', networkName || 'The network')
    return {
      id: o.id, name: o.name, icon: o.icon,
      description: o.description,
      score: r1(score),
      band,
      line,
    }
  })

  const aggregateRaw = outlets.reduce((s, o) => s + o.score, 0) / outlets.length
  const aggregate = r1(aggregateRaw)
  const band = scoreBand(aggregate)
  const verdict = VERDICT_LABELS[band]

  return {
    rating: r2(rating),
    aggregate,
    band,
    verdict,
    components: { ...c },
    outlets,
  }
}

/** Back-compat shim: old call sites might still ask for a single review.
 *  Returns the new 3-outlet shape so callers can adapt. */
export function generateReview(program, firstAiring, networkName) {
  return generateReviews(program, firstAiring, networkName)
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

// ─── STAFF (VPs) ────────────────────────────────────────────────────────────
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

/** Per-month salary cost across all hired staff (VPs + directors). */
export function staffSalaryTotal(station) {
  if (!station?.staff && !station?.directors) return 0
  let total = 0
  for (const role of Object.keys(station.staff || {})) {
    const s = station.staff[role]
    if (s) total += STAFF_MONTHLY_SALARY[s.tier] || 0
  }
  total += directorSalaryTotal(station)
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
  if (!canHireStaffRole(station, role)) return { station, error: 'Hire a VP of Personnel first' }
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

// ─── DIRECTORS (National sub-tier under VPs) ────────────────────────────────
// Stored at station.directors as a flat map:
//   { [roleId]: { tier: 'Common', hiredYear, hiredMonth, count? } }
// `count` exists only for the special 'scheduling' role (up to maxCount).

/** Find a director role definition. */
export function findDirectorRole(roleId) {
  return DIRECTOR_ROLES.find(d => d.id === roleId) || null
}

/** Is the given director role hired (any count >= 1)? */
export function hasDirector(station, roleId) {
  const rec = station?.directors?.[roleId]
  if (!rec) return false
  return (rec.count || 1) >= 1
}

/** How many directors are currently hired for this role (counts the 'scheduling'
 *  special role; everyone else is 0 or 1). */
export function directorCount(station, roleId) {
  const rec = station?.directors?.[roleId]
  if (!rec) return 0
  return rec.count || 1
}

/** Total monthly salary across all hired directors. */
export function directorSalaryTotal(station) {
  if (!station?.directors) return 0
  let total = 0
  for (const roleId of Object.keys(station.directors)) {
    total += DIRECTOR_SALARY * directorCount(station, roleId)
  }
  return r1(total)
}

/** Can the player hire a director of this role right now?
 *  Returns { ok: bool, reason?: string }. Reasons are short and end-user friendly. */
export function canHireDirector(station, roleId) {
  const role = findDirectorRole(roleId)
  if (!role) return { ok: false, reason: 'Unknown role' }
  if (station.market !== 'national') return { ok: false, reason: 'National office required' }
  if (!station.staff?.[role.parentVP]) {
    const vp = STAFF_ROLES.find(r => r.id === role.parentVP)
    return { ok: false, reason: `${vp?.label || role.parentVP} must be hired first` }
  }
  // Director of Staff itself is gated only by VP of Personnel (which we already checked).
  // Every OTHER director requires Director of Staff.
  if (roleId !== 'staff' && !hasDirector(station, 'staff')) {
    return { ok: false, reason: 'Hire a Director of Staff first' }
  }
  // Scheduling supports up to maxCount; others are single-slot.
  if (roleId === 'scheduling') {
    const cur = directorCount(station, 'scheduling')
    const max = role.maxCount || 1
    if (cur >= max) return { ok: false, reason: `Already at ${max} scheduling directors` }
  } else {
    if (hasDirector(station, roleId)) return { ok: false, reason: 'Already hired' }
  }
  return { ok: true }
}

/** Hire a director. No search lottery — Common tier, flat hire cost. */
export function hireDirector(station, roleId, year, month) {
  const check = canHireDirector(station, roleId)
  if (!check.ok) return { station, error: check.reason }
  if (station.cash < DIRECTOR_HIRE_COST) {
    return { station, error: `Need $${DIRECTOR_HIRE_COST}M to hire (you have $${(station.cash || 0).toFixed(1)}M)` }
  }
  const directors = { ...(station.directors || {}) }
  if (roleId === 'scheduling') {
    const rec = directors.scheduling
    if (rec) {
      directors.scheduling = { ...rec, count: (rec.count || 1) + 1 }
    } else {
      directors.scheduling = { tier: 'Common', count: 1, hiredYear: year, hiredMonth: month }
    }
  } else {
    directors[roleId] = { tier: 'Common', hiredYear: year, hiredMonth: month }
  }
  return {
    station: { ...station, cash: r1(station.cash - DIRECTOR_HIRE_COST), directors },
    error: null,
  }
}

/** Fire a director. Pays severance = DIRECTOR_FIRE_PENALTY per head (so firing one
 *  scheduling director out of 3 only pays for that one).
 *  Special case: when firing a scheduling director would leave more assignments
 *  than directors, free the most-recent slot to avoid orphan auto-assignments. */
export function fireDirector(station, roleId) {
  const directors = { ...(station.directors || {}) }
  const rec = directors[roleId]
  if (!rec) return { station, error: 'Not hired' }
  const penalty = DIRECTOR_FIRE_PENALTY
  let slotAuto = station.slotAuto || []
  if (roleId === 'scheduling') {
    if ((rec.count || 1) > 1) {
      directors.scheduling = { ...rec, count: rec.count - 1 }
    } else {
      delete directors.scheduling
    }
    // Reconcile: if assigned > remaining count, free the trailing assignments
    const newCount = (directors.scheduling?.count) || 0
    const assigned = slotAuto.filter(x => x).length
    if (assigned > newCount) {
      let freed = 0
      const target = assigned - newCount
      slotAuto = [...slotAuto]
      for (let i = slotAuto.length - 1; i >= 0 && freed < target; i--) {
        if (slotAuto[i]) { slotAuto[i] = null; freed++ }
      }
    }
  } else {
    delete directors[roleId]
  }
  return {
    station: { ...station, cash: r1(station.cash - penalty), directors, slotAuto },
    penalty,
  }
}

/** Talent capacity (max writers + stars + directors-of-craft allowed) at the
 *  current market. National rises from 15 → 25 when Director of Talent is hired. */
export function talentCapacity(station) {
  if (station.market === 'local') return 10
  if (station.market === 'metro') return 15
  // national
  return hasDirector(station, 'talent')
    ? DIRECTOR_EFFECTS.talent.talentCapNational
    : 15
}

/** Current count of all talent hires (creative directors + stars + writers). */
export function talentCount(station) {
  const d = (station.hiredDirectors || []).length
  const s = (station.hiredStars     || []).length
  const w = (station.hiredWriters   || []).length
  return d + s + w
}

/** Is the talent room full? */
export function talentRoomFull(station) {
  return talentCount(station) >= talentCapacity(station)
}

/** Is a marketing tier currently unlocked for the player? */
export function isMarketingTierUnlocked(station, tierId) {
  // 'none' is always available; 'flyers' depends on market; 'online' always.
  if (tierId === 'none' || tierId === 'online') return true
  if (tierId === 'flyers') return true  // localOnly already handled in UI
  // Standard Ads, TV+Radio+Print, AND Disney-Scale all require Director of
  // Marketing. Money alone is no longer enough to buy Disney-Scale —
  // you need the expertise to spend it well.
  if (tierId === 'medium' || tierId === 'big' || tierId === 'massive') {
    return hasDirector(station, 'marketing')
  }
  return true
}

/** Production-side: is Heavy SFX available?
 *  Locked behind Director of Technology Innovation. */
export function isHeavySfxUnlocked(station) {
  return hasDirector(station, 'techinnov')
}

/** Production-side: is a given research-gated technology open for STARTING research?
 *  (The research itself still requires VP Innovation + prior research as before.)
 *  Surround, 4K UHD, and a new Heavy SFX research are all behind Director of Tech Innovation. */
export function isResearchGatedByTechInnov(researchId) {
  return DIRECTOR_EFFECTS.techinnov.gatedResearch.includes(researchId)
}

/** Director-of-Production tweaks for a given production tier choice.
 *  Returns { costMult, qMult } — both 1.0 if no effect. */
export function productionDirectorMods(station, optionId) {
  if (!hasDirector(station, 'production')) return { costMult: 1.0, qMult: 1.0 }
  if (DIRECTOR_EFFECTS.production.topTierIds.includes(optionId)) {
    return {
      costMult: DIRECTOR_EFFECTS.production.topTierCostMult,
      qMult:    DIRECTOR_EFFECTS.production.topTierQMult,
    }
  }
  return { costMult: 1.0, qMult: 1.0 }
}

/** Creative Director: writer-script quality multiplier. */
export function creativeDirectorScriptMult(station) {
  return hasDirector(station, 'creative')
    ? DIRECTOR_EFFECTS.creative.scriptQMult
    : 1.0
}

// ─── MERCHANDISING ──────────────────────────────────────────────────────────
/** Is merchandising available for this production?
 *  Requires: Director of Merchandising hired AND script tier large/super. */
export function canPrepareMerch(station, scriptTier) {
  if (!hasDirector(station, 'merchandising')) return false
  return scriptTier === 'large' || scriptTier === 'super'
}

/** Upfront merchandising cost for a Large/Super production. */
export function merchPrepareCost(scriptTier) {
  return MERCH_PREPARE_COST[scriptTier] || 0
}

/** Per-airing merchandising revenue.
 *  Returns 0 if the program didn't prepare merch or isn't a large/super script.
 *  Curve: hype^1.8 × quality × baseScalar.
 *  Tuned so mid-range hype+quality slightly loses, high → real profit. */
export function merchRevenuePerAiring(scriptTier, quality, hype, prepared) {
  if (!prepared) return 0
  const base = MERCH_BASE_REVENUE[scriptTier]
  if (!base) return 0
  const hypeT = clamp((hype || 0) / 10, 0, 1)
  const qT    = clamp((quality || 0) / 10, 0, 1)
  return r1(base * Math.pow(hypeT, MERCH_HYPE_EXPONENT) * qT)
}

// ─── AUTO-SCHEDULING (Director of Scheduling) ───────────────────────────────
// Each slot in station.slotIds can be auto-managed by one scheduling director.
// State lives in station.slotAuto, a parallel array of the same length where
// each entry is either null (manual) or { categoryId } (auto-managed).

/** Read the auto-director assignment for a slot index. */
export function slotAutoAt(station, slotIdx) {
  return (station.slotAuto || [])[slotIdx] || null
}

/** How many scheduling directors are currently assigned to slots (not idle). */
export function assignedSchedulingDirectors(station) {
  return (station.slotAuto || []).filter(x => x).length
}

/** Idle scheduling directors = total hired − currently assigned. */
export function idleSchedulingDirectors(station) {
  return directorCount(station, 'scheduling') - assignedSchedulingDirectors(station)
}

/** Assign a scheduling director to a slot index with a category focus.
 *  Returns { station, error? }. */
export function assignSchedulingDirector(station, slotIdx, categoryId) {
  if (idleSchedulingDirectors(station) <= 0) {
    return { station, error: 'No idle scheduling directors. Hire one first.' }
  }
  const slotIds = station.slotIds || []
  if (slotIdx < 0 || slotIdx >= slotIds.length) {
    return { station, error: 'Slot index out of range' }
  }
  const cat = CATEGORIES.find(c => c.id === categoryId)
  if (!cat) return { station, error: 'Bad category' }
  const slotAuto = [...(station.slotAuto || [])]
  while (slotAuto.length < slotIds.length) slotAuto.push(null)
  if (slotAuto[slotIdx]) return { station, error: 'Slot already auto-managed' }
  slotAuto[slotIdx] = { categoryId }
  return { station: { ...station, slotAuto }, error: null }
}

/** Cancel the auto-scheduling on a slot index. Director becomes idle. */
export function cancelSchedulingDirector(station, slotIdx) {
  const slotAuto = [...(station.slotAuto || [])]
  if (!slotAuto[slotIdx]) return { station, error: 'No director on this slot' }
  slotAuto[slotIdx] = null
  return { station: { ...station, slotAuto }, error: null }
}


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
 *  VP of Innovation discounts both. Domain affinity (already unlocked content
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
  // v7: require a VP of Innovation on staff to start any research project.
  // The VP also discounts cost/time (via researchAdjusted), but without
  // one, the R&D function doesn't exist as a department at all.
  if (!station.staff?.innovation) {
    return { error: 'Hire a VP of Innovation first (Operations → Staff)' }
  }
  // Cutting-edge research (Surround, 4K UHD, Heavy SFX) requires a
  // Director of Technology Innovation under VP Innovation.
  if (isResearchGatedByTechInnov(researchId) && !hasDirector(station, 'techinnov')) {
    return { error: 'This requires a Director of Technology Innovation under VP Innovation.' }
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
/** Launch a network-wide marketing campaign.
 *
 *  Campaigns are stored on `station.activeCampaigns` (an array — multiple
 *  campaigns can run concurrently). Each campaign carries its own monthly
 *  hype boost and decrements its `monthsRemaining` each month tick.
 *
 *  opts (mega-campaigns only):
 *    starId    — id of a hired star to feature
 *    showProgramIds — array of up to 2 program ids from the station's catalog
 *
 *  The effectiveness of mega-campaigns scales with `computeCampaignInputMultiplier`
 *  (star + 2 shows). For non-mega tiers, opts is ignored.
 *
 *  Returns { station, cost, label, campaign, error }.
 */
export function launchNetworkCampaign(station, campaignId, research, opts = {}) {
  const camp = NETWORK_CAMPAIGNS.find(c => c.id === campaignId)
  if (!camp) return { station, error: 'Bad campaign' }

  // Market gating — mega-campaigns require larger markets
  const marketOrder = ['local', 'metro', 'national']
  const stationMarketRank = marketOrder.indexOf(station.market || 'local')
  const minMarketRank = marketOrder.indexOf(camp.minMarket || 'local')
  if (stationMarketRank < minMarketRank) {
    return { station, error: `${camp.label} requires ${camp.minMarket} market` }
  }

  // Mega-campaigns need a star + 2 shows
  let star = null, show1 = null, show2 = null, inputMult = 1.0
  if (camp.needsInputs) {
    star = opts.starId ? findStar(opts.starId) : null
    // Verify star is actually hired
    const hiredStarIds = new Set((station.hiredStars || []).map(h => h.talentId))
    if (!star || !hiredStarIds.has(star.id)) {
      return { station, error: 'Pick a star you have under contract' }
    }
    const showIds = (opts.showProgramIds || []).filter(Boolean)
    if (showIds.length !== 2) {
      return { station, error: 'Pick exactly two of your shows to feature' }
    }
    if (showIds[0] === showIds[1]) {
      return { station, error: 'Pick two different shows' }
    }
    const showLookup = id => (station.programs || []).find(p => p.id === id)
    show1 = showLookup(showIds[0])
    show2 = showLookup(showIds[1])
    if (!show1 || !show2) {
      return { station, error: 'One of the chosen shows is no longer in your catalog' }
    }
    inputMult = computeCampaignInputMultiplier(star, show1, show2)
  }

  // Cost — marketing VP discount + research discount applied
  const mktgEff = staffEffect(station, 'marketing')
  const cost = r1(camp.cost * (research?.marketingDiscount || 1.0) * (mktgEff.mktgCost || 1.0))
  if (station.cash < cost) return { station, error: 'Not enough cash' }

  const staffImpact = mktgEff.mktgImpact || 1.0
  const finalHype = r2(camp.hypeBoost * inputMult * staffImpact)
  const finalFame = r2(camp.fameGain * inputMult * staffImpact)

  const campaign = {
    id: uid(),
    tierId: campaignId,
    label: camp.label,
    icon: camp.icon || '📣',
    hypeBoost: finalHype,
    fameGain: finalFame,                       // applied immediately, also recorded for UI
    monthsRemaining: camp.monthsActive || 1,
    monthsTotal: camp.monthsActive || 1,
    inputMultiplier: r2(inputMult),
    starId: star?.id || null,
    starName: star?.name || null,
    showProgramIds: camp.needsInputs ? [show1.id, show2.id] : [],
    showNames: camp.needsInputs ? [show1.name, show2.name] : [],
    launchedYear: null,                        // App fills in when persisting
    launchedMonth: null,
  }

  return {
    station: {
      ...station,
      cash: r1(station.cash - cost),
      fame: r2((station.fame || 0) + finalFame),
      // Append to the campaigns array. Migration: if old `activeCampaign`
      // exists (singular), it's already been migrated by `migrateStation`.
      activeCampaigns: [...(station.activeCampaigns || []), campaign],
    },
    cost,
    label: camp.label,
    campaign,
    error: null,
  }
}

/** Tick all active campaigns at month end. Decrements monthsRemaining;
 *  drops expired ones. Returns { campaigns, expired }. */
export function tickCampaigns(activeCampaigns) {
  const next = []
  const expired = []
  for (const c of (activeCampaigns || [])) {
    if (c.monthsRemaining <= 1) {
      expired.push(c)
    } else {
      next.push({ ...c, monthsRemaining: c.monthsRemaining - 1 })
    }
  }
  return { campaigns: next, expired }
}

/** Sum the hype boost across all active campaigns. Used at airing time
 *  so multi-campaign stacking works correctly. */
export function totalCampaignHypeBoost(station) {
  // Back-compat: if a save still has the singular `activeCampaign`, count it.
  let total = 0
  if (station?.activeCampaign?.hypeBoost) total += station.activeCampaign.hypeBoost
  for (const c of (station?.activeCampaigns || [])) {
    total += c.hypeBoost || 0
  }
  return total
}

/** One-time migration: if a station has the old singular `activeCampaign`
 *  but no `activeCampaigns` array, fold it into the new array. Safe to
 *  call repeatedly. */
export function migrateCampaignState(station) {
  if (!station) return station
  if (Array.isArray(station.activeCampaigns)) return station   // already migrated
  const carry = station.activeCampaign
  return {
    ...station,
    activeCampaigns: carry ? [{
      id: uid(),
      tierId: carry.tierId || 'unknown',
      label: carry.label || 'Active campaign',
      icon: '📣',
      hypeBoost: carry.hypeBoost || 0,
      fameGain: carry.fameGain || 0,
      monthsRemaining: 1,
      monthsTotal: 1,
      inputMultiplier: 1.0,
      starId: null, starName: null,
      showProgramIds: [], showNames: [],
    }] : [],
    activeCampaign: null,
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
    const campHype = totalCampaignHypeBoost(station)

    const rawQ = clamp(lg.baseQ + (dir?.q || 0) * dMatch + (star?.q || 0) * sMatch + focusQ + contentQ + tech.q, 1, 10)
    // Per-market hype multiplier — college/regional sports peak in local
    // markets and fade nationally. See SPORTS_LEAGUES.marketHypeMult.
    const mhm = (lg.marketHypeMult && lg.marketHypeMult[station.market]) || 1.0
    const rawH = clamp((lg.baseH * mhm) + (dir?.h || 0) * dMatch + (star?.h || 0) * sMatch + focusH + fameH + slotBonusH + seasonBonusH + peakBonus + tech.h + campHype, 1, 10)
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
    const campHype = totalCampaignHypeBoost(station)
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
  const campHype = totalCampaignHypeBoost(station)

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

  // ── FINALE HYPE BOOST ─────────────────────────────────────────────────
  // The last airing of a multi-month scripted/reality run gets a +25%
  // boost on its base hype — that's the "series finale" effect. Sports
  // rights runs ALREADY have peakBonus on the championship month, so
  // we skip the finale boost for them to avoid double-counting.
  //
  // Only applies when:
  //   - runMonths >= 2 (1-month "runs" have no real finale concept)
  //   - this is the final airing (monthsAired = runMonths - 1, since
  //     runMonth increments monthsAired AFTER calling airShow)
  //   - not a sports rights run (peak already handles that)
  let isFinale = false
  if (!planned.sportsRunLeagueId &&
      (planned.runMonths || 1) >= 2 &&
      (planned.monthsAired || 0) === (planned.runMonths - 1)) {
    isFinale = true
    baseH = clamp(baseH * 1.25, 0, 10)
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
    isFinale,
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
    const adRev = r2(a.audience * market.revPerViewer)
    const merchRev = a.merchRevenue || 0
    a.revenue = r2(adRev + merchRev)
    a.adRevenue = adRev  // keep split available for financials display
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
  // Movie packs that get decremented per-airing for full-pack runs. We mirror
  // them into a working copy and surface as `moviePacksAfter` so the caller
  // can fold this back into station state. Single-mode movie runs continue
  // to decrement via finishProgram (preserves the old end-of-run behavior).
  let moviePacks = (station.moviePacks || []).map(p => ({ ...p }))

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
    // Full-pack movie runs: defensively skip if the pack ran out under us
    // (e.g. some external cancellation logic mid-month). Mark expired.
    if (run.movieId && run.moviePlayMode === 'full') {
      const idx = moviePacks.findIndex(mp => mp.packId === run.movieId && (mp.airingsLeft || 0) > 0)
      if (idx < 0) {
        expiredRunIds.push(run.id)
        continue
      }
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
    // Merchandising revenue is independent of audience — it scales with how
    // much the show has cultural traction (hype) and how well it's made
    // (quality). Computed here so it's already on the airing before
    // assignAudiences runs.
    aired.merchRevenue = run.prepareMerch
      ? merchRevenuePerAiring(run.scriptTier, aired.quality, aired.hype, true)
      : 0
    airings.push(aired)

    totalCost += cost

    if (aired.rating >= 8.5)      fameDelta += market.famePerWin * 1.0
    else if (aired.rating >= 7.0) fameDelta += market.famePerWin * 0.45
    else if (aired.rating >= 5.0) fameDelta += market.famePerWin * 0.12
    else if (aired.rating <  4.0) fameDelta -= 0.3

    // ── Full-pack movie: consume one airing from the pack right now ────
    // Single-mode movie runs decrement at finishProgram-time as before.
    if (run.movieId && run.moviePlayMode === 'full') {
      const idx = moviePacks.findIndex(mp => mp.packId === run.movieId && (mp.airingsLeft || 0) > 0)
      if (idx >= 0) {
        moviePacks[idx].airingsLeft -= 1
        if (moviePacks[idx].airingsLeft <= 0) {
          moviePacks[idx].airingsLeft = 0
          moviePacks[idx].lastConsumedY = year
          moviePacks[idx].lastConsumedM = monthIdx
        }
      }
    }

    // Update run history — audience filled in after assignAudiences
    run._currentAired = aired
    run.monthsAired += 1
    if (run.monthsAired >= run.runMonths) {
      expiredRunIds.push(run.id)
    }
  }

  // ── Auto-scheduling: spawn one airing per assigned slot ──────────────────
  // For each slot index with an autoDirector and no active run, the director
  // produces a 1-month show in their chosen category. Quality and hype roll
  // each month from a narrow random band, then are penalized by
  // AUTO_SCHED_Q_MULT / AUTO_SCHED_H_MULT vs hand-crafted shows.
  const slotIds = station.slotIds || []
  const slotAuto = station.slotAuto || []
  for (let slotIdx = 0; slotIdx < slotIds.length; slotIdx++) {
    const auto = slotAuto[slotIdx]
    if (!auto) continue
    const slotTypeId = slotIds[slotIdx]

    // If a manual run is already there this month, skip (shouldn't normally
    // happen because UI blocks manual scheduling on auto slots, but be safe).
    const occupied = runs.some(r => {
      if (r._isAuto) return false
      if (r.monthsAired >= r.runMonths) return false
      // Multiple slots can share a typeId — match by index inside slotIds, using
      // the first occurrence of this typeId. If runs were properly indexed this
      // would be exact; this is the best we can do with the existing model.
      return r.slotTypeId === slotTypeId && slotIds.indexOf(r.slotTypeId) === slotIdx
    })
    if (occupied) continue

    const categoryId = auto.categoryId
    const cat = CATEGORIES.find(c => c.id === categoryId)
    if (!cat) continue

    // Roll a base quality + hype from the narrow band, then apply the auto mults.
    const baseQ = rnd(AUTO_SCHED_BASE_Q_MIN, AUTO_SCHED_BASE_Q_MAX)
    const baseH = rnd(AUTO_SCHED_BASE_H_MIN, AUTO_SCHED_BASE_H_MAX)
    const q = clamp(baseQ * AUTO_SCHED_Q_MULT, 0, 10)
    const h = clamp(baseH * AUTO_SCHED_H_MULT, 0, 10)
    const rating = r2((q * 0.6 + h * 0.4))

    // Production cost: base for the category at this market, per spec.
    const cost = r1(baseProductionCost(categoryId, station.market, station))
    totalCost += cost

    const autoAiring = {
      id: `auto_${slotIdx}_${year}_${monthIdx}`,
      runId: `auto_${slotIdx}`,
      // Synthetic programId so all of this director's airings group together
      // as one financial line. Tied to slot index so reassigning to a new
      // category gives a fresh line.
      programId: `auto:${slotIdx}:${categoryId}`,
      slotTypeId,
      categoryId,
      topicId: null,
      name: `Director-managed: ${cat.label.toLowerCase()}`,
      quality: r2(q),
      hype: r2(h),
      rating,
      audience: 0,
      revenue: 0,
      adRevenue: 0,
      merchRevenue: 0,
      cost,
      month: monthIdx,
      year,
      stationId: '__player__',
      stationName: station.name,
      _stationFame: station.fame,
      _isAuto: true,
      autoCategory: cat.label,
    }
    airings.push(autoAiring)

    // Fame nudge — same scale as regular airings but de-rated since q is bounded.
    if (rating >= 7.0) fameDelta += market.famePerWin * 0.25
    else if (rating >= 5.0) fameDelta += market.famePerWin * 0.08
    else if (rating < 4.0) fameDelta -= 0.1
  }

  return {
    airings,
    expiredRunIds,
    totalProductionCost: r1(totalCost),
    fameDeltaFromRatings: r2(fameDelta),
    // Surface mutated movie pack state for the caller (full-pack runs
    // decrement per airing). Single-mode runs continue to decrement via
    // finishProgram, so this only differs from station.moviePacks when at
    // least one full-pack movie run aired this month.
    moviePacksAfter: moviePacks,
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

/** Cancel a run mid-flight. Returns refund cost (50% of remaining months' cost).
 *  Full-pack movie runs have NO cancellation penalty — the pack already
 *  accurately reflects what was consumed (per-airing decrement during the
 *  run), so the player gets a clean exit and keeps the unused airings.
 */
export function cancelRunCost(run) {
  if (run?.movieId && run.moviePlayMode === 'full') return 0
  const remaining = Math.max(0, (run.runMonths || 1) - (run.monthsAired || 0))
  return r1(remaining * (run.monthlyCost || 0) * CANCEL_REFUND_MULT)
}

// ─── AWARDS ──────────────────────────────────────────────────────────────────
// New ceremony model: one award per category (News, Reality, Series, …) plus
// a Fan Favorite (most-watched program of the year regardless of category).
// Nominees are the top 3 programs in each category by award score; winner is
// the top nominee, audience as tiebreaker.
//
// Score formula: average across the program's airings of (Q * 0.8 + H * 0.2).
// Deterministic — no random component, so re-rendering doesn't change winners.

/** Compute a single airing's award contribution: 80% quality + 20% hype. */
function airingAwardScore(airing) {
  return (airing.quality || 0) * 0.8 + (airing.hype || 0) * 0.2
}

/** Group a list of airings by their underlying program. Returns an array of
 *  program-level aggregates with the metrics needed for nomination. */
function aggregateByProgram(airings) {
  const map = new Map()
  for (const a of airings) {
    // Programs are identified by (stationId, runId|programId|name). Sports
    // and movies don't have programId, so fall back to runId or name.
    const key = `${a.stationId || ''}::${a.runId || a.programId || a.name}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        stationId: a.stationId,
        stationName: a.stationName,
        name: a.name,
        // For category we take the first airing's value — they're all the same.
        categoryId: a.sportsRunLeagueId ? 'sports'
                  : (a.movieId ? 'movie' : a.categoryId),
        airings: [],
        totalAudience: 0,
        totalScore: 0,
        totalRating: 0,
        airingCount: 0,
      })
    }
    const e = map.get(key)
    e.airings.push(a)
    e.totalAudience += a.audience || 0
    e.totalScore    += airingAwardScore(a)
    e.totalRating   += a.rating || 0
    e.airingCount   += 1
  }
  // Compute averages
  for (const e of map.values()) {
    e.avgScore  = e.airingCount > 0 ? e.totalScore  / e.airingCount : 0
    e.avgRating = e.airingCount > 0 ? e.totalRating / e.airingCount : 0
  }
  return Array.from(map.values())
}

/** Pick a "host" star — someone from a popular show this year on any network.
 *  Falls back to a generic name if no qualifying star exists. */
function pickAwardsHost(allAirings, getStarNameById) {
  const popularStars = new Set()
  for (const a of allAirings) {
    if ((a.rating || 0) >= 7.0 && a.starId) popularStars.add(a.starId)
  }
  const arr = Array.from(popularStars)
  if (arr.length === 0) {
    return { name: 'Damon Bridges', vibe: 'tonight\'s host' }
  }
  // Deterministic-ish pick based on the year (so the host is stable across
  // re-renders within the ceremony, but changes year to year).
  const pickIdx = Math.abs(arr.length * 7 + arr.length) % arr.length
  const starId = arr[pickIdx]
  const name = getStarNameById ? getStarNameById(starId) : null
  return {
    name: name || 'A celebrated star',
    vibe: 'fresh off a hit season',
  }
}

/** Build the awards ceremony for a year.
 *
 *  @param playerYearShows  Array of player airings this year (must have stationId='__player__')
 *  @param competitorYearShows  Array of competitor airings this year
 *  @param station  The player's station (for market + fame floor)
 *  @param year  Current year
 *  @param resolveStarName  (id) => string  Optional, resolves star id to name for host
 *  @returns {
 *    year, marketLabel, host: {name, vibe},
 *    categories: [
 *      { id, label, icon, color, nominees: [{program, isPlayer}], winnerKey, fameBonus, cashBonus }
 *    ],
 *    fanFavorite: { nominees, winnerKey, fameBonus, cashBonus } | null,
 *    networkSummary: [{ stationId, stationName, isPlayer, awardCount }],
 *    playerAwardsWon: [{categoryId, programName, fameBonus, cashBonus}],
 *    playerNominations: [{categoryId, programName, won}],
 *    totalFameGain: number,
 *    totalCashGain: number,
 *    // Legacy compat for old code paths:
 *    wins: [...], bestOverall: null, mostWatched: null, fameBar,
 *  } */
export function buildAwards(playerYearShows, competitorYearShows, station, year, resolveStarName) {
  const market = MARKETS[station.market]
  const fameBar = 7.0 + clamp((station.fame - market.fameThreshold) / 50, 0, 1.5)

  // Merge all airings into one pool, then aggregate per-program
  const allAirings = [...(playerYearShows || []), ...(competitorYearShows || [])]
  const allPrograms = aggregateByProgram(allAirings)

  // Pick host
  const host = pickAwardsHost(allAirings, resolveStarName)

  // Categories that actually had airings this year
  const allCatIds = new Set(allPrograms.map(p => p.categoryId).filter(Boolean))

  // Build per-category nominees + winner
  const CATEGORY_DEFS = [
    { id: 'news',      label: 'Best News Program',         icon: '📰' },
    { id: 'reality',   label: 'Best Reality Show',         icon: '👁' },
    { id: 'series',    label: 'Best Scripted Series',      icon: '📺' },
    { id: 'latenight', label: 'Best Late-Night Program',   icon: '🎤' },
    { id: 'sports',    label: 'Best Sports Broadcast',     icon: '🏆' },
    { id: 'family',    label: 'Best Family Program',       icon: '🏡' },
    { id: 'kids',      label: 'Best Kids Show',            icon: '🧒' },
    { id: 'movie',     label: 'Best Motion Picture',       icon: '🎞' },
  ]

  const categories = []
  for (const catDef of CATEGORY_DEFS) {
    if (!allCatIds.has(catDef.id)) continue
    const inCat = allPrograms.filter(p => p.categoryId === catDef.id)
    // Sort: avgScore desc, tiebreak by totalAudience desc
    inCat.sort((a, b) =>
      (b.avgScore - a.avgScore) || (b.totalAudience - a.totalAudience)
    )
    const nominees = inCat.slice(0, 3).map(p => ({
      key: p.key,
      programName: p.name,
      stationName: p.stationName,
      isPlayer: p.stationId === '__player__',
      avgScore: r2(p.avgScore),
      totalAudience: r2(p.totalAudience),
      airingCount: p.airingCount,
    }))
    if (nominees.length === 0) continue
    const winner = nominees[0]
    categories.push({
      id: catDef.id,
      label: catDef.label,
      icon: catDef.icon,
      color: (CATEGORIES[catDef.id] || {}).color || '#f0a347',
      nominees,
      winnerKey: winner.key,
      fameBonus: 1.5,
      cashBonus: 4,
    })
  }

  // Fan Favorite — top by total audience, any category
  let fanFavorite = null
  if (allPrograms.length > 0) {
    const sortedByAud = [...allPrograms].sort((a, b) => b.totalAudience - a.totalAudience)
    const top3 = sortedByAud.slice(0, 3)
    const nominees = top3.map(p => ({
      key: p.key,
      programName: p.name,
      stationName: p.stationName,
      isPlayer: p.stationId === '__player__',
      totalAudience: r2(p.totalAudience),
      airingCount: p.airingCount,
    }))
    fanFavorite = {
      id: 'fan_favorite',
      label: 'Fan Favorite of the Year',
      icon: '⭐',
      color: '#ffd166',
      nominees,
      winnerKey: nominees[0].key,
      fameBonus: 3,
      cashBonus: 8,
    }
  }

  // Network summary — count awards won per network
  const networkAwards = new Map()
  const tallyWin = (programKey) => {
    const prog = allPrograms.find(p => p.key === programKey)
    if (!prog) return
    const key = prog.stationId
    if (!networkAwards.has(key)) {
      networkAwards.set(key, {
        stationId: prog.stationId,
        stationName: prog.stationName,
        isPlayer: prog.stationId === '__player__',
        awardCount: 0,
        awardsWon: [],
      })
    }
    const entry = networkAwards.get(key)
    entry.awardCount += 1
    entry.awardsWon.push(programKey)
  }
  categories.forEach(c => tallyWin(c.winnerKey))
  if (fanFavorite) tallyWin(fanFavorite.winnerKey)

  // Ensure every known network shows up (even if 0 awards)
  const allStationIds = new Set(allPrograms.map(p => p.stationId))
  for (const sid of allStationIds) {
    if (!networkAwards.has(sid)) {
      const sample = allPrograms.find(p => p.stationId === sid)
      networkAwards.set(sid, {
        stationId: sid,
        stationName: sample.stationName,
        isPlayer: sid === '__player__',
        awardCount: 0,
        awardsWon: [],
      })
    }
  }
  const networkSummary = Array.from(networkAwards.values()).sort((a, b) =>
    b.awardCount - a.awardCount
  )

  // Player view: which awards did the player win? Which were they nominated for?
  const playerAwardsWon = []
  const playerNominations = []
  const allCeremonyAwards = [...categories, ...(fanFavorite ? [fanFavorite] : [])]
  for (const award of allCeremonyAwards) {
    for (const nom of award.nominees) {
      if (nom.isPlayer) {
        const won = award.winnerKey === nom.key
        playerNominations.push({
          categoryId: award.id,
          categoryLabel: award.label,
          programName: nom.programName,
          won,
        })
        if (won) {
          playerAwardsWon.push({
            categoryId: award.id,
            categoryLabel: award.label,
            programName: nom.programName,
            fameBonus: award.fameBonus,
            cashBonus: award.cashBonus,
          })
        }
      }
    }
  }
  const totalFameGain = playerAwardsWon.reduce((a, w) => a + w.fameBonus, 0)
  const totalCashGain = playerAwardsWon.reduce((a, w) => a + w.cashBonus, 0)

  // ── Legacy-shape fields for older code paths ─────────────────────────
  // The old `wins`/`bestOverall`/`mostWatched` shape was used in advanceMonth
  // to apply cash + fame. We translate the new structure back into the same
  // shape so existing engine flow keeps working without refactor.
  const wins = playerAwardsWon.map(w => ({
    category: w.categoryId,
    label: w.categoryLabel,
    showName: w.programName,
    fameBonus: w.fameBonus,
    cashBonus: w.cashBonus,
  }))
  const fanFavWonByPlayer = fanFavorite && fanFavorite.nominees.find(n => n.key === fanFavorite.winnerKey)?.isPlayer
  const mostWatched = fanFavWonByPlayer ? {
    showName: fanFavorite.nominees.find(n => n.key === fanFavorite.winnerKey).programName,
    fameBonus: fanFavorite.fameBonus,
    cashBonus: fanFavorite.cashBonus,
  } : null

  return {
    year,
    marketLabel: market.label,
    host,
    categories,
    fanFavorite,
    networkSummary,
    playerAwardsWon,
    playerNominations,
    totalFameGain,
    totalCashGain,
    fameBar: r2(fameBar),
    // Legacy:
    wins,
    bestOverall: null, // retired — not used in the new ceremony
    mostWatched,
  }
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
    slotAuto: [],               // parallel array — each entry null or { categoryId }
    sportsLicenses: [],         // {leagueId, year}
    ipLicenses: [],             // {ipId, expiresYear}
    staff: {                    // { roleId: {name,tier,...} | null }
      personnel: null, innovation: null, operations: null, marketing: null, content: null,
    },
    directors: {},              // { roleId: { tier:'Common', count? } } — National-only
    openPositions: [],          // [{role, tierId, monthsLeft, monthsTotal, cost}]
    activeCampaign: null,       // legacy field — kept null; new code uses activeCampaigns
    activeCampaigns: [],        // array of active brand campaigns w/ monthsRemaining
    moviePacks: [],             // [{packId, airingsLeft, purchasedY/M, purchaseHype, ...}]
    specStars: SPEC_GENRES.reduce((acc, g) => {
      acc[g] = g === focusCat ? 1 : 0
      return acc
    }, {}),
    specXP: SPEC_GENRES.reduce((acc, g) => { acc[g] = 0; return acc }, {}),
    achievements: { unlocked: {} },
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
    // Tutorial state — initialized here so the App can read it from day 1.
    // `enabled` is set by the setup screen's radio choice.
    tutorial: {
      enabled: !!setup.tutorialEnabled,
      skipped: false,
      currentStepIdx: 0,
      visited: {},
      initialTalentCount: startDirs.length + startStars.length,
    },
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

// ─── RATING QUALITY LABEL ────────────────────────────────────────────────────
// The numeric rating (0..10) is what audiences and revenue keys off, but humans
// think in terms like "hit" / "flop". This pair of helpers maps the number to a
// short qualitative label + a semantic color.
export function ratingLabel(rating) {
  if (rating == null) return null
  if (rating >= 9.0) return 'MASTERPIECE'
  if (rating >= 8.0) return 'BLOCKBUSTER'
  if (rating >= 7.0) return 'HIT'
  if (rating >= 6.0) return 'SOLID'
  if (rating >= 5.0) return 'DECENT'
  if (rating >= 3.5) return 'SOFT'
  return 'FLOP'
}

export function ratingLabelColor(rating, T) {
  // T is the theme palette. We accept it as a param so the engine stays
  // theme-agnostic — caller passes its imported theme object.
  if (rating == null) return T.muted
  if (rating >= 9.0) return T.gold
  if (rating >= 8.0) return T.purple || T.accent
  if (rating >= 7.0) return T.green
  if (rating >= 6.0) return T.teal
  if (rating >= 5.0) return T.text
  if (rating >= 3.5) return T.muted
  return T.red
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

// ─── ACHIEVEMENTS ────────────────────────────────────────────────────────────
// A small catalog of one-shot accomplishments + recurring "bests". Each
// achievement has an id, a category (label group), a title, a description,
// and a tone (gold / silver / bronze) for visual treatment.
//
// FIRSTS unlock once per game. BESTS fire whenever your performance leads.
//
// Stored on station as:
//   station.achievements = {
//     unlocked: { [id]: { year, month, context } },  // firsts
//   }
//
// "Best in market this month" is computed at runtime per month — not stored
// (it's an "event" rather than a permanent unlock, so it fires each time).

// ─── ACHIEVEMENT CATALOG ────────────────────────────────────────────────────
// A curated list of milestones. Each entry has:
//   id       — stable identifier saved on station.achievements.unlocked
//   group    — bucket for screen organization
//   tone     — visual tier (bronze | silver | gold)
//   icon     — short emoji shown in lists/popups
//   title    — display name
//   desc     — one-line description (always visible — players can see what to aim for)
//   reward   — cash bonus in $M (granted on unlock; 0 for purely recurring)
//   recurring — true means it fires every time the condition holds, doesn't add to X/Y total
//   evalKind — 'airing'  → unlocked from the month's airing list (existing behavior)
//            — 'state'   → unlocked by check(station, game) returning true
//   check    — function (only used when evalKind === 'state')
//
// Cash buckets:
//   $2M  = easy / early
//   $5M  = mid (first VP, first IP, first hit, first research)
//   $15M = hard / late (national, super, critical darling, all techs)
//   $40M = capstone (boardroom full, empire, completionist)
const ACHIEVEMENT_CATALOG = [
  // ── GENRE FIRSTS ──
  { id: 'first_news',      group: 'firsts', tone: 'silver', icon: '📰', title: 'First News Bulletin',     desc: 'Aired your first News program.',     reward: 0.5, fame: 0.5, evalKind: 'airing' },
  { id: 'first_reality',   group: 'firsts', tone: 'silver', icon: '👁',  title: 'First Reality Show',      desc: 'Aired your first Reality program.',  reward: 0.5, fame: 0.5, evalKind: 'airing' },
  { id: 'first_series',    group: 'firsts', tone: 'silver', icon: '🎬', title: 'First Scripted Series',   desc: 'Aired your first scripted Series.',  reward: 0.5, fame: 0.5, evalKind: 'airing' },
  { id: 'first_latenight', group: 'firsts', tone: 'silver', icon: '🌙', title: 'First Late-Night',        desc: 'Aired your first Late-Night program.', reward: 0.5, fame: 0.5, evalKind: 'airing' },
  { id: 'first_sports',    group: 'firsts', tone: 'silver', icon: '🏆', title: 'First Sports Broadcast',  desc: 'Aired your first Sports rights coverage.', reward: 0.5, fame: 0.5, evalKind: 'airing' },
  { id: 'first_family',    group: 'firsts', tone: 'silver', icon: '🏡', title: 'First Family Program',    desc: 'Aired your first Family program.',   reward: 0.5, fame: 0.5, evalKind: 'airing' },
  { id: 'first_kids',      group: 'firsts', tone: 'silver', icon: '🧒', title: 'First Kids Show',         desc: 'Aired your first Kids program.',     reward: 0.5, fame: 0.5, evalKind: 'airing' },
  { id: 'first_movie',     group: 'firsts', tone: 'silver', icon: '🎞', title: 'First Movie',             desc: 'Aired your first licensed Movie.',   reward: 0.5, fame: 0.5, evalKind: 'airing' },

  // ── PROGRAM QUALITY FIRSTS ──
  { id: 'lights_on',         group: 'programs', tone: 'bronze', icon: '💡', title: 'Lights On',         desc: 'Air your first program.',
    reward: 0.5, fame: 0.5, evalKind: 'state', check: ({ game }) => (game.runs || []).some(r => (r.aiHistory || []).length >= 1) || hasAnyAiredProgram(game) },
  { id: 'first_hit',         group: 'programs', tone: 'silver', icon: '⭐', title: 'First Hit',         desc: 'Air a program with rating 7.0+.', reward: 1, fame: 1, evalKind: 'airing' },
  { id: 'first_blockbuster', group: 'programs', tone: 'gold',   icon: '💥', title: 'First Blockbuster', desc: 'Air a program with rating 8.0+.', reward: 15.0, fame: 5, evalKind: 'airing' },
  { id: 'first_masterpiece', group: 'programs', tone: 'gold',   icon: '👑', title: 'First Masterpiece', desc: 'Air a program with rating 9.0+.', reward: 15.0, fame: 5, evalKind: 'airing' },
  { id: 'hits_factory',      group: 'programs', tone: 'gold',   icon: '🏭', title: 'Hits Factory',      desc: 'Score 5 different programs at 8.0+.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game }) => countDistinctHitPrograms(game, 8.0) >= 5 },
  { id: 'big_production',    group: 'programs', tone: 'silver', icon: '🎥', title: 'Big Production',    desc: 'Air a Large-tier production.',
    reward: 5.0, fame: 2, evalKind: 'state', check: ({ station, game }) => airedProgramsByTier(station, game, 'large') >= 1 },
  { id: 'super_sized',       group: 'programs', tone: 'gold',   icon: '🦣', title: 'Super-Sized',       desc: 'Air a Super-tier production.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station, game }) => airedProgramsByTier(station, game, 'super') >= 1 },
  { id: 'franchise',         group: 'programs', tone: 'gold',   icon: '🔁', title: 'Franchise',         desc: 'Take a program through 3 sequel seasons.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game, station }) => maxSeqSeasonSeen(game, station) >= 3 },
  { id: 'year_of_hits',      group: 'programs', tone: 'gold',   icon: '📈', title: 'Year of Hits',      desc: '6 programs at 8.0+ in a single year.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game }) => bestYearOfHits(game, 8.0) >= 6 },

  // ── SLOT LEADERSHIP ──
  { id: 'slot_lead_weekday_morning', group: 'slot', tone: 'bronze', icon: '🌅', title: 'Morning Champion',         desc: 'First time #1 in Weekday Morning.', reward: 5.0, fame: 2, evalKind: 'airing' },
  { id: 'slot_lead_weekday_evening', group: 'slot', tone: 'bronze', icon: '🌆', title: 'Evening Champion',         desc: 'First time #1 in Weekday Evening.', reward: 5.0, fame: 2, evalKind: 'airing' },
  { id: 'slot_lead_prime',           group: 'slot', tone: 'gold',   icon: '🌟', title: 'Prime-Time Champion',      desc: 'First time #1 in Prime Time.',      reward: 15.0, fame: 5, evalKind: 'airing' },
  { id: 'slot_lead_lateprime',       group: 'slot', tone: 'bronze', icon: '🌃', title: 'Late-Prime Champion',      desc: 'First time #1 in Late Prime.',      reward: 5.0, fame: 2, evalKind: 'airing' },
  { id: 'slot_lead_weekend_morning', group: 'slot', tone: 'bronze', icon: '🧒', title: 'Weekend Morning Champion', desc: 'First time #1 in Weekend Morning.', reward: 5.0, fame: 2, evalKind: 'airing' },
  { id: 'slot_lead_weekend_prime',   group: 'slot', tone: 'gold',   icon: '🎯', title: 'Weekend Prime Champion',   desc: 'First time #1 in Weekend Prime.',   reward: 15.0, fame: 5, evalKind: 'airing' },

  // ── MARKET / OFFICE ──
  { id: 'open_for_business', group: 'office', tone: 'bronze', icon: '📡', title: 'Open for Business', desc: 'Survive your first month.',
    reward: 0.5, fame: 0.5, evalKind: 'state', check: ({ game }) => (game.year || 1) > 1 || (game.monthIdx || 0) >= 1 },
  { id: 'market_metro',      group: 'office', tone: 'gold',   icon: '🏙', title: 'Welcome to the Metro',  desc: 'Promote your station to Metro.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ station }) => station.market === 'metro' || station.market === 'national' },
  { id: 'market_national',   group: 'office', tone: 'gold',   icon: '🇺🇸', title: 'Going National',        desc: 'Promote your station to National.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station }) => station.market === 'national' },
  { id: 'empire',            group: 'office', tone: 'gold',   icon: '💰', title: 'Empire',                desc: 'Hold $500M cash on hand.',
    reward: 40.0, fame: 10, evalKind: 'state', check: ({ station }) => (station.cash || 0) >= 500 },

  // ── STAFFING ──
  { id: 'first_vp',         group: 'staff', tone: 'silver', icon: '👔', title: 'First Lieutenant',  desc: 'Hire your first VP.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ station }) => Object.values(station.staff || {}).filter(Boolean).length >= 1 },
  { id: 'full_cabinet',     group: 'staff', tone: 'gold',   icon: '🏛', title: 'Full Cabinet',      desc: 'Hire all 5 VPs at once.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station }) => Object.values(station.staff || {}).filter(Boolean).length >= 5 },
  { id: 'first_director',   group: 'staff', tone: 'silver', icon: '🪪', title: 'Inner Circle',      desc: 'Hire your first Director.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ station }) => Object.keys(station.directors || {}).length >= 1 },
  { id: 'directors_cut',    group: 'staff', tone: 'gold',   icon: '✂', title: "Director's Cut",    desc: 'Hire 4 Directors at once.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station }) => totalDirectorHeadcount(station) >= 4 },
  { id: 'boardroom_full',   group: 'staff', tone: 'gold',   icon: '🏢', title: 'Boardroom Full',    desc: 'Hire all 8 Director role types.',
    reward: 40.0, fame: 10, evalKind: 'state', check: ({ station }) => Object.keys(station.directors || {}).length >= 8 },
  { id: 'auto_pilot',       group: 'staff', tone: 'silver', icon: '🗓', title: 'Auto-Pilot',        desc: 'Assign a Director of Scheduling.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ station }) => (station.slotAuto || []).some(Boolean) },
  { id: 'mission_control',  group: 'staff', tone: 'gold',   icon: '🛰', title: 'Mission Control',   desc: '4 Directors of Scheduling assigned.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station }) => (station.slotAuto || []).filter(Boolean).length >= 4 },
  { id: 'the_bench',        group: 'staff', tone: 'gold',   icon: '🪑', title: 'The Bench',         desc: 'Fill National talent to 25/25.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station }) => {
      if (station.market !== 'national') return false
      const cap = (station.directors || {}).talent ? 25 : 15
      const cnt = (station.hiredDirectors || []).length + (station.hiredStars || []).length + (station.hiredWriters || []).length
      return cap === 25 && cnt >= 25
    }},

  // ── TALENT ──
  { id: 'first_hire',  group: 'talent', tone: 'bronze', icon: '✍', title: 'First Hire',  desc: 'Sign your first creative talent.',
    reward: 0.5, fame: 0.5, evalKind: 'state', check: ({ station }) => ((station.hiredDirectors || []).length + (station.hiredStars || []).length + (station.hiredWriters || []).length) >= 1 },
  { id: 'star_power',  group: 'talent', tone: 'gold',   icon: '🌟', title: 'Star Power',  desc: 'Sign a Legendary star.',
    reward: 5.0, fame: 2, evalKind: 'state', check: ({ station }) => hasLegendaryHire(station, 'hiredStars') },
  { id: 'auteur',      group: 'talent', tone: 'gold',   icon: '🎬', title: 'Auteur',      desc: 'Sign a Legendary creative director.',
    reward: 5.0, fame: 2, evalKind: 'state', check: ({ station }) => hasLegendaryHire(station, 'hiredDirectors') },
  { id: 'pen_mightier',group: 'talent', tone: 'silver', icon: '✒', title: 'Pen Mightier', desc: 'Have 3 writers on contract.',
    reward: 5.0, fame: 2, evalKind: 'state', check: ({ station }) => (station.hiredWriters || []).length >= 3 },
  { id: 'hot_streak',  group: 'talent', tone: 'silver', icon: '🔥', title: 'Hot Streak',   desc: 'Same star on contract 24 months.',
    reward: 5.0, fame: 2, evalKind: 'state', check: ({ station }) => (station.hiredStars || []).some(s => (s.monthsOn || s.monthsLogged || 0) >= 24) },

  // ── RESEARCH / TECH ──
  { id: 'bookworm',     group: 'research', tone: 'bronze', icon: '📚', title: 'Bookworm',    desc: 'Complete your first research project.',
    reward: 0.5, fame: 0.5, evalKind: 'state', check: ({ game }) => (game.research?.unlocked || []).length >= 1 },
  { id: 'beyond_hd',    group: 'research', tone: 'gold',   icon: '📺', title: 'Beyond HD',   desc: 'Complete 4K UHD research.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game }) => (game.research?.unlocked || []).includes('tech_video_uhd') },
  { id: 'full_spectrum',group: 'research', tone: 'gold',   icon: '🎧', title: 'Full Spectrum', desc: 'Complete Surround Sound research.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game }) => (game.research?.unlocked || []).includes('tech_audio_surround') },
  { id: 'tech_stack',   group: 'research', tone: 'gold',   icon: '🧪', title: 'Tech Stack',  desc: 'Complete Heavy SFX, Surround, 4K UHD.',
    reward: 40.0, fame: 10, evalKind: 'state', check: ({ game }) => {
      const u = game.research?.unlocked || []
      return u.includes('tech_video_uhd') && u.includes('tech_audio_surround') && u.includes('tech_sfx_heavy')
    }},

  // ── RIGHTS / IP ──
  { id: 'pop_culture',    group: 'rights', tone: 'silver', icon: '🎭', title: 'Pop Culture',    desc: 'License your first IP.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ station }) => (station.ipLicenses || []).length >= 1 },
  { id: 'big_league',     group: 'rights', tone: 'silver', icon: '⚾', title: 'Big League',     desc: 'Sign your first sports rights.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ station }) => (station.sportsLicenses || []).length >= 1 },
  { id: 'studio_catalog', group: 'rights', tone: 'gold',   icon: '📚', title: 'Studio Catalog', desc: 'Hold 3 active IP licenses.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station, game }) => (station.ipLicenses || []).filter(l => (l.expiresYear || 0) >= (game.year || 1)).length >= 3 },

  // ── FINANCE ──
  { id: 'in_the_black',     group: 'finance', tone: 'bronze', icon: '✅', title: 'In the Black',    desc: 'Finish a month with positive profit.',
    reward: 0.5, fame: 0.5,  evalKind: 'state', check: ({ game }) => maxMonthlyProfit(game) > 0 },
  { id: 'cash_machine',     group: 'finance', tone: 'silver', icon: '🪙', title: 'Cash Machine',    desc: 'Earn $50M revenue in one month.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ game }) => maxMonthlyRevenue(game) >= 50 },
  { id: 'whale',            group: 'finance', tone: 'gold',   icon: '🐋', title: 'Whale',           desc: 'Earn $100M revenue in one month.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game }) => maxMonthlyRevenue(game) >= 100 },
  { id: 'self_sustaining',  group: 'finance', tone: 'gold',   icon: '♻', title: 'Self-Sustaining', desc: 'Profitable 12 months in a row.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game }) => longestProfitableStreak(game) >= 12 },

  // ── MERCHANDISING ──
  { id: 'brand_builder', group: 'merch', tone: 'silver', icon: '🧸', title: 'Brand Builder', desc: 'Prepare merchandising on a program.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ station }) => (station.programs || []).some(p => p.prepareMerch) },
  { id: 'cha_ching',     group: 'merch', tone: 'gold',   icon: '💸', title: 'Cha-Ching',     desc: '$100M total merchandising revenue.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ station }) => totalMerchRevenue(station) >= 100 },

  // ── AWARDS ──
  { id: 'recognition', group: 'awards', tone: 'gold', icon: '🏅', title: 'Recognition', desc: 'Win your first award.',
    reward: 5.0, fame: 2,  evalKind: 'state', check: ({ game }) => anyAwardWon(game) },
  { id: 'sweep',       group: 'awards', tone: 'gold', icon: '🎖', title: 'Sweep',       desc: 'Win 3+ awards in one ceremony.',
    reward: 15.0, fame: 5, evalKind: 'state', check: ({ game }) => maxAwardsOneCeremony(game) >= 3 },

  // ── CAPSTONE ──
  { id: 'completionist', group: 'meta', tone: 'gold', icon: '🏁', title: 'Completionist', desc: 'Unlock every other achievement.',
    reward: 40.0, fame: 10, evalKind: 'state', check: ({ station }) => {
      const unlocked = Object.keys(station.achievements?.unlocked || {})
      const total = ACHIEVEMENT_CATALOG.filter(a => a.id !== 'completionist' && !a.recurring).length
      return unlocked.filter(id => id !== 'completionist').length >= total
    }},

  // ── RECURRING (does NOT count toward X/Y) ──
  { id: 'month_top', group: 'recurring', tone: 'gold', icon: '🏆', title: 'Most-Watched This Month',
    desc: 'Had the #1 program across all networks.', reward: 0.0, fame: 0.5, recurring: true, evalKind: 'airing' },
]

// ─── ACHIEVEMENT CHECK HELPERS ──────────────────────────────────────────────
// These walk over game/station state to support the catalog's check() lambdas.

function hasAnyAiredProgram(game) {
  // Check current runs OR any program that's already been on air at some point.
  if ((game.runs || []).some(r => (r.aiHistory || []).length >= 1)) return true
  return (game.station?.programs || []).some(p => p.aiHistory && p.aiHistory.length >= 1)
}

function countDistinctHitPrograms(game, threshold) {
  // Walk currently-tracked programs + active runs. A program counts if any
  // of its airings hit the threshold. We dedupe by programId.
  const seen = new Set()
  for (const p of (game.station?.programs || [])) {
    const hits = (p.aiHistory || []).some(a => (a.rating || 0) >= threshold)
    if (hits) seen.add(p.id)
  }
  for (const r of (game.runs || [])) {
    const hits = (r.aiHistory || []).some(a => (a.rating || 0) >= threshold)
    if (hits && r.programId) seen.add(r.programId)
  }
  return seen.size
}

function airedProgramsByTier(station, game, tier) {
  // A program at this tier with at least one airing.
  for (const p of (station.programs || [])) {
    if (p.tier === tier && (p.aiHistory || []).length >= 1) return true
  }
  for (const r of (game.runs || [])) {
    if (r.tier === tier && (r.aiHistory || []).length >= 1) return true
  }
  return false
}

function maxSeqSeasonSeen(game, station) {
  let best = 1
  for (const r of (game.runs || [])) if ((r.seqSeason || 1) > best) best = r.seqSeason
  for (const o of (station.ownedShows || [])) if ((o.lastSeqSeason || 1) > best) best = o.lastSeqSeason
  return best
}

function bestYearOfHits(game, threshold) {
  // Count airings ≥ threshold per year, across all known program histories.
  const byYear = new Map()
  const addAirings = (airings) => {
    for (const a of airings || []) {
      if ((a.rating || 0) >= threshold) {
        byYear.set(a.year, (byYear.get(a.year) || 0) + 1)
      }
    }
  }
  for (const p of (game.station?.programs || [])) addAirings(p.aiHistory)
  for (const r of (game.runs || [])) addAirings(r.aiHistory)
  let best = 0
  for (const n of byYear.values()) if (n > best) best = n
  return best
}

function totalDirectorHeadcount(station) {
  let n = 0
  for (const r of Object.values(station.directors || {})) n += (r.count || 1)
  return n
}

function hasLegendaryHire(station, key) {
  // hiredDirectors / hiredStars records carry talent records with a tier.
  return (station[key] || []).some(h => {
    const t = h.talent?.tier || h.tier
    return t === 'Legendary'
  })
}

function maxMonthlyRevenue(game) {
  return (game.monthlyPnL || []).reduce((best, m) => Math.max(best, m.revenue || 0), 0)
}
function maxMonthlyProfit(game) {
  return (game.monthlyPnL || []).reduce((best, m) => Math.max(best, m.profit || 0), -Infinity)
}
function longestProfitableStreak(game) {
  let best = 0, cur = 0
  for (const m of (game.monthlyPnL || [])) {
    if ((m.profit || 0) > 0) { cur++; if (cur > best) best = cur } else cur = 0
  }
  return best
}

function totalMerchRevenue(station) {
  let total = 0
  for (const e of (station.ledger || [])) {
    if (e.kind === 'program_revenue' && e.label === 'Merchandising revenue') total += (e.amount || 0)
  }
  return r1(total)
}

function anyAwardWon(game) {
  const byYear = game.awardsByYear || {}
  for (const yr of Object.keys(byYear)) {
    if ((byYear[yr] || []).some(a => a.winner)) return true
  }
  return false
}
function maxAwardsOneCeremony(game) {
  const byYear = game.awardsByYear || {}
  let best = 0
  for (const yr of Object.keys(byYear)) {
    const n = (byYear[yr] || []).filter(a => a.winner).length
    if (n > best) best = n
  }
  return best
}

const SLOT_TO_ACHIEVEMENT_ID = {
  weekday_morning: 'slot_lead_weekday_morning',
  weekday_evening: 'slot_lead_weekday_evening',
  prime:           'slot_lead_prime',
  lateprime:       'slot_lead_lateprime',
  weekend_morning: 'slot_lead_weekend_morning',
  weekend_prime:   'slot_lead_weekend_prime',
}

const CATEGORY_TO_ACHIEVEMENT_ID = {
  news:      'first_news',
  reality:   'first_reality',
  series:    'first_series',
  latenight: 'first_latenight',
  // 'sports' intentionally omitted — scripted Sports News doesn't count as a
  // "Sports Broadcast" achievement. That achievement fires only when the
  // player airs actual sports-rights coverage (handled in the explicit
  // sportsRunLeagueId branch in applyUnlockedAchievements).
  family:    'first_family',
  kids:      'first_kids',
  movie:     'first_movie',
}

export function findAchievement(id) {
  return ACHIEVEMENT_CATALOG.find(a => a.id === id) || null
}

export function getAchievementCatalog() {
  return ACHIEVEMENT_CATALOG
}

/** Count of one-shot (non-recurring) achievements total. The X in X/Y. */
export function totalCountableAchievements() {
  return ACHIEVEMENT_CATALOG.filter(a => !a.recurring).length
}

/** Count of one-shot achievements the player has unlocked. */
export function unlockedCountableAchievements(station) {
  const map = station?.achievements?.unlocked || {}
  let n = 0
  for (const id of Object.keys(map)) {
    const a = findAchievement(id)
    if (a && !a.recurring) n++
  }
  return n
}

/** Scan a month's worth of player airings + competitor airings, find newly
 *  unlocked achievements + any recurring events. Returns:
 *   {
 *     unlocked: [{id, achievement, context}],  // one-shot, will be saved
 *     recurring: [{id, achievement, context}], // fires this month, NOT saved
 *   }
 *  Pure: doesn't mutate station. Caller merges unlocked into station.achievements. */
export function scanAchievements(station, airings, competitorAirings, market, year, month, game) {
  const already = (station?.achievements?.unlocked) || {}
  const newlyUnlocked = []
  const recurring = []

  // Helper to register a first
  const tryFirst = (id, context = {}) => {
    if (already[id]) return
    if (newlyUnlocked.some(u => u.id === id)) return  // don't double-fire within same month
    const a = findAchievement(id)
    if (!a) return
    newlyUnlocked.push({ id, achievement: a, context })
  }

  // ── Genre firsts ──
  for (const a of (airings || [])) {
    if (a.movieId) {
      tryFirst('first_movie', { programName: a.name })
    } else if (a.sportsRunLeagueId) {
      tryFirst('first_sports', { programName: a.name })
    } else {
      const catFirstId = CATEGORY_TO_ACHIEVEMENT_ID[a.categoryId]
      if (catFirstId) tryFirst(catFirstId, { programName: a.name })
    }
  }

  // ── Quality firsts (ordered cheapest → highest) ──
  let bestRating = 0
  let bestRatingProgram = null
  for (const a of (airings || [])) {
    if ((a.rating || 0) > bestRating) {
      bestRating = a.rating
      bestRatingProgram = a
    }
  }
  if (bestRating >= 7.0) tryFirst('first_hit',         { rating: bestRating, programName: bestRatingProgram?.name })
  if (bestRating >= 8.0) tryFirst('first_blockbuster', { rating: bestRating, programName: bestRatingProgram?.name })
  if (bestRating >= 9.0) tryFirst('first_masterpiece', { rating: bestRating, programName: bestRatingProgram?.name })

  // ── Slot leadership firsts ──
  //   "Lead" = slotRank === 1 with at least one competitor in the same slot.
  for (const a of (airings || [])) {
    if (a.slotRank === 1 && (a.slotTotal || 1) > 1) {
      const slotAchId = SLOT_TO_ACHIEVEMENT_ID[a.slotTypeId]
      if (slotAchId) tryFirst(slotAchId, { programName: a.name, slot: a.slotTypeId })
    }
  }

  // ── State-based checks (catalog items with evalKind: 'state') ──
  // These read game/station rather than this month's airings — they catch
  // milestones like office promotions, total cash, full cabinet, etc.
  // We defer the completionist check to a second pass so it sees the OTHER
  // unlocks added this month.
  const stateCtx = { game: game || {}, station }
  const stateItems = ACHIEVEMENT_CATALOG.filter(a => a.evalKind === 'state' && a.id !== 'completionist')
  for (const a of stateItems) {
    if (already[a.id]) continue
    if (newlyUnlocked.some(u => u.id === a.id)) continue
    try {
      if (a.check && a.check(stateCtx)) {
        newlyUnlocked.push({ id: a.id, achievement: a, context: {} })
      }
    } catch (e) {
      // Defensive — bad check shouldn't crash the whole tick.
    }
  }
  // Completionist — eval against (already + newly unlocked) so the 41st fires
  // in the same month that completes the set.
  const completionist = findAchievement('completionist')
  if (completionist && !already.completionist) {
    const simulated = {
      ...stateCtx,
      station: {
        ...station,
        achievements: {
          unlocked: {
            ...already,
            ...Object.fromEntries(newlyUnlocked.map(u => [u.id, true])),
          },
        },
      },
    }
    try {
      if (completionist.check(simulated)) {
        newlyUnlocked.push({ id: 'completionist', achievement: completionist, context: {} })
      }
    } catch (e) {}
  }

  // ── Recurring: most-watched of the month ──
  // We compare the player's best-audience airing vs. the best competitor airing.
  // Ties are resolved in the player's favor.
  let playerTop = null
  let competitorTop = null
  for (const a of (airings || [])) {
    if (!playerTop || (a.audience || 0) > (playerTop.audience || 0)) playerTop = a
  }
  for (const a of (competitorAirings || [])) {
    if (!competitorTop || (a.audience || 0) > (competitorTop.audience || 0)) competitorTop = a
  }
  if (playerTop && (!competitorTop || (playerTop.audience || 0) >= (competitorTop.audience || 0))) {
    const a = findAchievement('month_top')
    if (a) recurring.push({
      id: 'month_top',
      achievement: a,
      context: { programName: playerTop.name, audience: playerTop.audience, market },
    })
  }

  return { unlocked: newlyUnlocked, recurring }
}

/** Apply newly unlocked achievements to a station. Grants the cash reward and
 *  appends a ledger entry. Records year/month per achievement. Pure. */
export function applyUnlockedAchievements(station, unlocked, year, month) {
  if (!unlocked || unlocked.length === 0) return station
  const achievements = { ...(station.achievements || { unlocked: {} }) }
  achievements.unlocked = { ...(achievements.unlocked || {}) }
  let cashBonus = 0
  let fameBonus = 0
  const ledgerAdds = []
  for (const u of unlocked) {
    achievements.unlocked[u.id] = { year, month, context: u.context }
    const a = u.achievement
    const reward = a?.reward || 0
    const fame = a?.fame || 0
    if (reward > 0) {
      cashBonus += reward
      ledgerAdds.push({
        year, month,
        kind: 'achievement_bonus',
        label: `Achievement: ${a.title}`,
        amount: reward,
      })
    }
    if (fame > 0) fameBonus += fame
  }
  return {
    ...station,
    cash: r1((station.cash || 0) + cashBonus),
    fame: r2((station.fame || 0) + fameBonus),
    achievements,
    ledger: [...(station.ledger || []), ...ledgerAdds],
  }
}

/** Record a market-tier first when the player promotes. Called from promote flow. */
export function recordMarketAchievement(station, newMarketId, year, month) {
  const id = newMarketId === 'metro' ? 'market_metro'
           : newMarketId === 'national' ? 'market_national'
           : null
  if (!id) return { station, unlocked: null }
  const already = station?.achievements?.unlocked?.[id]
  if (already) return { station, unlocked: null }
  const a = findAchievement(id)
  if (!a) return { station, unlocked: null }
  const next = applyUnlockedAchievements(station, [{ id, context: { market: newMarketId } }], year, month)
  return { station: next, unlocked: { id, achievement: a, context: { market: newMarketId } } }
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
      case 'achievement_bonus': other.awards.push({ label: e.label, amount: e.amount }); break
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

