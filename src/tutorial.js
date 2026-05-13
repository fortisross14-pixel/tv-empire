// Tutorial system — declarative step machine.
//
// Each step describes a single action the player should take. The coach
// observes game state after every change; when the current step's `isDone`
// predicate returns true, the system auto-advances. If a step's predicate
// is *already* true when reached (player did it out of order), we advance
// silently — no penalty for getting ahead.
//
// `pointTo` is the DOM `id` of a UI element the pointer arrow should anchor
// to. App.jsx and components tag their nav tabs / key buttons with these ids.
// If null, no pointer is rendered for that step.
//
// `allowedTargets` is the list of DOM ids whose interactions are NOT dimmed
// during this step. Anything else in the UI gets a soft "out of focus" treatment.
// Round 1: we only use this to dim nav tabs the player shouldn't be visiting.
//
// `lockContinue` — if true, the top-bar "Air Month" button is disabled while
// this step is active. Used to keep the player from skipping past a required
// action by just hitting Continue.

/** All steps in order. Round 1 uses 1-7; rest is wired up but Round 2
 *  will add the visited-tracking that makes step 11 (financials/achievements)
 *  detectable. */
export const TUTORIAL_STEPS = [
  // ─── TURN 1 ────────────────────────────────────────────────────────────
  {
    id: 'turn1_script',
    turn: 1, ordinal: 1,
    title: 'Prepare your first script',
    body: 'Open the Content tab. Inside, find Scripts and start a Normal-tier script. It takes one month to write.',
    why: 'Scripts are the seed for scripted programs. A Normal script unlocks small productions; bigger scripts unlock more later.',
    pointTo: 'nav-content',
    allowedNavs: ['plan', 'content'],
    lockContinue: true,
    isDone: (game) => (game.station.scripts || []).length >= 1,
  },
  {
    id: 'turn1_buy_movie',
    turn: 1, ordinal: 2,
    title: 'Buy a movie pack',
    body: 'Still in Content, switch to Rights and buy a movie pack. Pick a small Common or Uncommon one — those are cheap.',
    why: 'Movie packs let you license a bundle of films at once. They air immediately, no production needed.',
    pointTo: 'nav-content',
    allowedNavs: ['plan', 'content'],
    lockContinue: true,
    isDone: (game) => (game.station.moviePacks || []).length >= 1,
  },
  {
    id: 'turn1_produce_movie',
    turn: 1, ordinal: 3,
    title: 'Send the movie to production',
    body: 'In Content → Production, choose "Movie", pick your pack, name the program, and start it. Movies are pre-produced — they\'re ready to schedule immediately.',
    why: 'Programs are the on-air units. A movie program wraps a pack and lets you assign it to a slot.',
    pointTo: 'nav-content',
    allowedNavs: ['plan', 'content'],
    lockContinue: true,
    isDone: (game) => (game.station.programs || []).some(p => p.movieId),
  },
  {
    id: 'turn1_schedule_movie',
    turn: 1, ordinal: 4,
    title: 'Schedule your movie',
    body: 'Go to Programming. Click an empty slot, pick your movie program, choose "Just 1 Movie" to air it once.',
    why: 'Scheduling puts a program on the air. Empty slots earn nothing — you want them filled every month.',
    pointTo: 'nav-plan',
    allowedNavs: ['plan'],
    lockContinue: true,
    isDone: (game) => (game.runs || []).some(r => r.movieId),
  },
  {
    id: 'turn1_personnel',
    turn: 1, ordinal: 5,
    title: 'Hire a VP of Personnel',
    body: 'Go to Operations → Staff. Click "Quick Search" on VP of Personnel. They\'ll arrive next month and unlock hiring other VPs.',
    why: 'VPs are department heads with global bonuses. Personnel is the gatekeeper — until they\'re hired, you can\'t hire other VPs.',
    pointTo: 'nav-operations',
    allowedNavs: ['plan', 'operations'],
    lockContinue: true,
    isDone: (game) =>
      (game.station.staff?.personnel != null) ||
      (game.station.openPositions || []).some(p => p.role === 'personnel') ||
      (game.station.pendingHires || []).some(h => h.role === 'personnel'),
  },
  {
    id: 'turn1_continue',
    turn: 1, ordinal: 6,
    title: 'Air the month',
    body: 'You\'ve set up your first month. Hit "Air Month" in the top bar to advance time. Your movie airs, your writer drafts, and your VP search progresses.',
    why: 'Each month, scheduled programs air and earn revenue based on audience and ratings. Months drive everything forward.',
    pointTo: 'topbar-continue',
    allowedNavs: ['plan', 'content', 'operations'],
    lockContinue: false,  // this step needs Continue to BE clickable
    isDone: (game) => (game.year > 1 || game.monthIdx > 0),
  },

  // ─── TURN 2 ────────────────────────────────────────────────────────────
  {
    id: 'turn2_use_script',
    turn: 2, ordinal: 1,
    title: 'Produce a scripted show',
    body: 'Your script is ready. Go to Content → Production, choose "Script", pick your script, assign a director and a star, set the planned run to 1 month, and start.',
    why: 'Scripted shows take 1+ months to produce. Cast and crew choices shape the final quality and hype.',
    pointTo: 'nav-content',
    allowedNavs: ['plan', 'content', 'operations'],
    lockContinue: true,
    isDone: (game) => (game.station.programs || []).some(p =>
      !p.movieId && !p.sportsLeagueId && (p.status === 'producing' || p.status === 'shelf' || p.status === 'finished')
    ),
  },
  {
    id: 'turn2_second_vp',
    turn: 2, ordinal: 2,
    title: 'Hire another VP (try Innovation)',
    body: 'Operations → Staff. Now that Personnel is on board, you can search for other VPs. Innovation discounts research and is a great early pick.',
    why: 'Innovation, Operations, Marketing, and Content are the four "specialist" VPs — each gives a permanent bonus in their domain.',
    pointTo: 'nav-operations',
    allowedNavs: ['plan', 'content', 'operations'],
    lockContinue: true,
    isDone: (game) => {
      const staff = game.station.staff || {}
      const filled = Object.values(staff).filter(Boolean).length
      const openNonPersonnel = (game.station.openPositions || []).filter(p => p.role !== 'personnel').length
      return filled >= 2 || openNonPersonnel >= 1
    },
  },
  {
    id: 'turn2_schedule_movie_again',
    turn: 2, ordinal: 3,
    title: 'Air your movie again',
    body: 'Open the empty slot from last month and re-air your movie. The pack still has airings left.',
    why: 'Movie packs have multiple airings. You can use them across many months — they only "expire" when the pack runs out.',
    pointTo: 'nav-plan',
    allowedNavs: ['plan', 'content', 'operations'],
    lockContinue: true,
    isDone: (game) => {
      // Count total movie airings across all programs
      const movieAirings = (game.station.programs || [])
        .filter(p => p.movieId)
        .reduce((sum, p) => sum + (p.airingsCount || 0), 0)
      // Or a fresh movie run was just scheduled (for the 2nd month)
      const movieRuns = (game.runs || []).filter(r => r.movieId).length
      return movieAirings >= 2 || movieRuns >= 1
    },
  },
  {
    id: 'turn2_peek_data',
    turn: 2, ordinal: 4,
    title: 'Peek at your finances & achievements',
    body: 'Visit Financials in the nav, then open Settings → Achievements. Just to see what\'s there.',
    why: 'Financials tracks every dollar. Achievements reward milestones with cash + fame. Worth checking in regularly.',
    pointTo: 'nav-financials',
    allowedNavs: ['plan', 'content', 'operations', 'financials'],
    lockContinue: true,
    // Round 2 will track visits with game.tutorial.visited.financials etc.
    // For now, just auto-complete after they visit financials.
    isDone: (game) => !!(game.tutorial?.visited?.financials && game.tutorial?.visited?.achievements),
  },
  {
    id: 'turn2_sign_talent',
    turn: 2, ordinal: 5,
    title: 'Sign a creative talent',
    body: 'Operations → Talent. Pick Stars or Directors and sign one. They boost productions you cast them in.',
    why: 'Stars boost narrative + hype. Directors boost quality and innovation. Both matter for ratings.',
    pointTo: 'nav-operations',
    allowedNavs: ['plan', 'content', 'operations', 'financials'],
    lockContinue: true,
    isDone: (game) => {
      // The player starts with some talent. Count NEW signings vs initial.
      // Initial: ~5 (2 directors + 3 stars). Anything above counts.
      const total = (game.station.hiredDirectors || []).length + (game.station.hiredStars || []).length
      const initial = game.tutorial?.initialTalentCount || 5
      return total > initial
    },
  },
  {
    id: 'turn2_continue',
    turn: 2, ordinal: 6,
    title: 'Air the month',
    body: 'Hit "Air Month" again. Your scripted show keeps producing; your movie airs; your new VP and talent arrive.',
    why: 'You\'ll see results after each month — what aired, what each show earned, and how audience reacted.',
    pointTo: 'topbar-continue',
    allowedNavs: ['plan', 'content', 'operations', 'financials'],
    lockContinue: false,
    isDone: (game) => (game.year > 1 || game.monthIdx > 1),
  },

  // ─── TURN 3 ────────────────────────────────────────────────────────────
  {
    id: 'turn3_schedule_scripted',
    turn: 3, ordinal: 1,
    title: 'Schedule your scripted show',
    body: 'Your scripted program is ready! Open an empty slot in Programming and schedule it.',
    why: 'Scripted shows can run for multiple months on the same slot. Long runs build audience habit.',
    pointTo: 'nav-plan',
    allowedNavs: ['plan', 'content', 'operations', 'financials'],
    lockContinue: true,
    isDone: (game) => (game.runs || []).some(r => !r.movieId && !r.sportsRunLeagueId),
  },
  {
    id: 'turn3_research',
    turn: 3, ordinal: 2,
    title: 'Start a research project',
    body: 'Open the Research tab and start any project. Research unlocks new tech, bigger scripts, and more.',
    why: 'Research is your long-term progression track. Each unlock opens new options. Innovation VPs make them cheaper.',
    pointTo: 'nav-research',
    allowedNavs: ['plan', 'content', 'operations', 'research', 'financials'],
    lockContinue: true,
    isDone: (game) => (game.research?.inProgress || []).length >= 1 || (game.research?.unlocked || []).length >= 1,
  },
  {
    id: 'turn3_done',
    turn: 3, ordinal: 3,
    title: 'You\'re ready',
    body: 'That\'s the core loop: produce → schedule → air → reinvest. Chase achievements, watch ratings, grow your audience. Good luck.',
    why: null,
    pointTo: null,
    allowedNavs: null,  // null = all unlocked
    lockContinue: false,
    isDone: () => false,  // never auto-advances; player dismisses via Skip/Done
    isFinal: true,
  },
]

/** Initial tutorial state. Stored on `game.tutorial`. */
export function initTutorialState(enabled, station) {
  return {
    enabled,
    skipped: false,
    currentStepIdx: 0,
    visited: {},
    // Snapshot what the player started with — used by predicates that check
    // "did the player do X since starting" (e.g. signing a NEW talent, not
    // counting the ones they got for free at setup).
    initialTalentCount: (station.hiredDirectors || []).length + (station.hiredStars || []).length,
  }
}

/** Returns the current step, or null if tutorial is off / skipped / finished. */
export function currentTutorialStep(game) {
  const t = game.tutorial
  if (!t || !t.enabled || t.skipped) return null
  if (t.currentStepIdx >= TUTORIAL_STEPS.length) return null
  return TUTORIAL_STEPS[t.currentStepIdx]
}

/** Should this nav target be clickable right now?
 *  Returns true if no tutorial is active, or the target is in allowedNavs,
 *  or the current step has allowedNavs === null (final step). */
export function isNavAllowed(game, navId) {
  const step = currentTutorialStep(game)
  if (!step) return true
  if (step.allowedNavs == null) return true
  return step.allowedNavs.includes(navId)
}

/** Is the top-bar "Air Month" button currently locked by the tutorial? */
export function isContinueLocked(game) {
  const step = currentTutorialStep(game)
  if (!step) return false
  return !!step.lockContinue
}

/** Total number of steps (for progress dots). */
export const TOTAL_TUTORIAL_STEPS = TUTORIAL_STEPS.length

/** Look up a step by id (used by Round 2 visited tracking). */
export function tutorialStepById(id) {
  return TUTORIAL_STEPS.find(s => s.id === id) || null
}
