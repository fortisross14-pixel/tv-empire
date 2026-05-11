// ─── RARITY TIERS ────────────────────────────────────────────────────────────
export const TIERS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']

export const TIER_COL = {
  Common:    '#8a8499',
  Uncommon:  '#45c47a',
  Rare:      '#3ecfcf',
  Epic:      '#a855f7',
  Legendary: '#ffd700',
}

// ─── CYCLES ──────────────────────────────────────────────────────────────────
// Months Jan=0 through Dec=11. Awards happen in December.
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTHS_PER_YEAR = 12
// Legacy aliases (some code still says "cycle")
export const CYCLES = MONTHS
export const CYCLES_PER_YEAR = MONTHS_PER_YEAR

// ─── CATEGORIES & TOPICS ─────────────────────────────────────────────────────
export const CATEGORIES = {
  news: {
    label: 'News',
    icon: '📰',
    color: '#3ecfcf',
    base_q: 5.0,
    base_h: 3.0,
    cost_mult: 0.55,
    topics: [
      { id: 'global',    label: 'Global Affairs',     q: 0.4, h: 0.2 },
      { id: 'local',     label: 'Local Beat',         q: 0.0, h: -0.5, localBonus: 1.0 },
      { id: 'reporter',  label: 'Field Reporter',     q: 0.6, h: 0.3 },
      { id: 'bigtopic',  label: 'Big Topic Special',  q: 0.5, h: 0.8 },
    ],
  },
  reality: {
    label: 'Reality',
    icon: '👁',
    color: '#ff69b4',
    base_q: 4.5,
    base_h: 5.0,
    cost_mult: 0.7,
    topics: [
      { id: 'adventure',   label: 'Adventure / Survival', q: 0.4, h: 0.7 },
      { id: 'competition', label: 'Competition',          q: 0.3, h: 0.9 },
      { id: 'love',        label: 'Dating / Love',        q: -0.2, h: 1.0 },
      { id: 'general',     label: 'House / General',      q: 0.0, h: 0.6 },
    ],
  },
  series: {
    label: 'Series',
    icon: '📺',
    color: '#a855f7',
    base_q: 5.5,
    base_h: 4.5,
    cost_mult: 1.8,
    topics: [
      { id: 'action',  label: 'Action / Thriller',  q: 0.3, h: 0.8 },
      { id: 'fantasy', label: 'Fantasy / Sci-Fi',   q: 0.5, h: 1.0 },
      { id: 'drama',   label: 'Prestige Drama',     q: 0.9, h: 0.4 },
      { id: 'comedy',  label: 'Sitcom / Comedy',    q: 0.2, h: 0.5 },
      { id: 'crime',   label: 'Crime / Procedural', q: 0.4, h: 0.6 },
    ],
  },
  latenight: {
    label: 'Late Night',
    icon: '🎤',
    color: '#e8a045',
    base_q: 5.0,
    base_h: 4.0,
    cost_mult: 0.8,
    topics: [
      { id: 'talk',    label: 'Talk Show',     q: 0.3, h: 0.6 },
      { id: 'comedy',  label: 'Stand-Up Hour', q: 0.4, h: 0.5 },
      { id: 'variety', label: 'Variety Hour',  q: 0.2, h: 0.7 },
      { id: 'mature',  label: 'Adult / Edgy',  q: 0.5, h: 1.1 },
    ],
  },
  sports: {
    label: 'Sports',
    icon: '🏆',
    color: '#e84545',
    base_q: 6.0,
    base_h: 5.5,
    cost_mult: 2.0,
    topics: [
      { id: 'live',     label: 'Live Game Coverage', q: 0.5, h: 1.0 },
      { id: 'analysis', label: 'Analysis / Talk',    q: 0.2, h: 0.3 },
      { id: 'doc',      label: 'Sports Documentary', q: 0.6, h: 0.4 },
    ],
  },
  family: {
    label: 'Family',
    icon: '👨‍👩‍👧',
    color: '#ffb84d',
    base_q: 5.0,
    base_h: 4.0,
    cost_mult: 1.0,
    topics: [
      { id: 'animated', label: 'Animated',            q: 0.4, h: 0.7 },
      { id: 'live',     label: 'Live-Action Family',  q: 0.2, h: 0.4 },
      { id: 'edu',      label: 'Educational',         q: 0.5, h: -0.2 },
    ],
  },
  kids: {
    label: 'Kids',
    icon: '🧸',
    color: '#ff8acc',
    base_q: 4.5,
    base_h: 4.5,
    cost_mult: 0.75,
    topics: [
      { id: 'cartoon',     label: 'Cartoons',            q: 0.3, h: 0.7 },
      { id: 'liveaction',  label: 'Live-Action Kids',    q: 0.2, h: 0.5 },
      { id: 'preschool',   label: 'Preschool Block',     q: 0.4, h: 0.2 },
      { id: 'edutain',     label: 'Edutainment',         q: 0.6, h: 0.0 },
      { id: 'toytiein',    label: 'Toy Tie-In Series',   q: 0.0, h: 1.0 },
      { id: 'kidsmovie',   label: 'Kids Movie Hour',     q: 0.4, h: 0.5 },
    ],
  },
  contest: {
    label: 'Contest',
    icon: '🎯',
    color: '#45c47a',
    base_q: 4.8,
    base_h: 4.5,
    cost_mult: 0.65,
    topics: [
      { id: 'quiz',     label: 'Quiz Show',         q: 0.3, h: 0.4 },
      { id: 'physical', label: 'Physical Contest',  q: 0.2, h: 0.7 },
      { id: 'prize',    label: 'Big Prize Show',    q: 0.1, h: 0.9 },
    ],
  },
  movie: {
    label: 'Movie',
    icon: '🎬',
    color: '#ffd700',
    base_q: 6.0,
    base_h: 5.0,
    cost_mult: 1.0,
    topics: [],
    isMovie: true,
  },
}

export const CATEGORY_IDS = ['news', 'reality', 'series', 'latenight', 'sports', 'family', 'kids', 'contest', 'movie']

// ─── STATION FOCUSES ─────────────────────────────────────────────────────────
export const FOCUSES = [
  { id: 'news',    label: 'News & Information',   desc: '+1.0 quality on news. Free common news talent.', bonusCat: 'news',    bonusQ: 1.0 },
  { id: 'reality', label: 'Reality & Lifestyle',  desc: '+1.0 hype on reality. Free common reality star.', bonusCat: 'reality', bonusH: 1.0 },
  { id: 'series',  label: 'Scripted Series',      desc: '+1.0 quality on series. Free common series director.', bonusCat: 'series',  bonusQ: 1.0 },
  { id: 'sports',  label: 'Sports',               desc: '+0.7 quality, +0.5 hype on sports.', bonusCat: 'sports',  bonusQ: 0.7, bonusH: 0.5 },
  { id: 'family',  label: 'Family / Variety',     desc: '+0.8 quality on family programming.', bonusCat: 'family',  bonusQ: 0.8 },
  { id: 'kids',    label: 'Kids',                 desc: '+0.6 quality, +0.6 hype on kids programming.', bonusCat: 'kids',    bonusQ: 0.6, bonusH: 0.6 },
  { id: 'general', label: 'General Entertainment',desc: 'No bonus, but +$10M starting cash.', bonusCash: 10 },
]

// ─── MARKETS ─────────────────────────────────────────────────────────────────
export const MARKETS = {
  local: {
    id: 'local', label: 'Riverside Local',
    desc: 'A mid-size city of 2M. Friendly. Limited reach.',
    pop: 2.0, audCap: 1.6, revPerViewer: 5.5,
    fameThreshold: 0, nextFame: 25, famePerWin: 1.2, marketingMult: 0.6,
  },
  metro: {
    id: 'metro', label: 'Tri-State Metro',
    desc: '20M people across the Northeast corridor. Real competition.',
    pop: 20, audCap: 12, revPerViewer: 6.5,
    fameThreshold: 25, nextFame: 60, famePerWin: 1.0, marketingMult: 1.0,
  },
  national: {
    id: 'national', label: 'National Network',
    desc: '380M Americans. The big leagues.',
    pop: 380, audCap: 90, revPerViewer: 9.0,
    fameThreshold: 60, nextFame: null, famePerWin: 0.7, marketingMult: 1.6,
  },
}

export const MARKET_ORDER = ['local', 'metro', 'national']

// ─── AUDIENCE DEMOGRAPHICS ──────────────────────────────────────────────────
// 7 demo groups. Each has:
//   - popShare: fraction of total market population
//   - watchHours: per-slot fraction of this demo's population that watches in
//     this slot at all (0-1). Sum across slots can exceed 1 (people watch
//     multiple slots a week).
//   - appeal[catId]: per-category multiplier. 1.0 = baseline interest;
//     2.0 = double demand; 0.1 = barely watch; 0 = won't tune in.
//     Topic-level overrides applied via TOPIC_APPEAL_OVERRIDES below.
// Total market audience for a slot/show = sum over demos of:
//     market.pop * popShare * watchHours[slot] * appealNorm * shareOfMarket
// where appealNorm scales the show's quality+hype by demo appeal, and
// shareOfMarket = appeal / (appeal + competitorAppealSum) — competitive split.
export const DEMOS = {
  kids: {
    id: 'kids', label: 'Kids',
    popShare: 0.16,    // ~16% of population is age <16
    watchHours: {
      morning: 0.30, afternoon: 0.55, evening: 0.25,
      prime: 0.20, prime2: 0.10, latenight: 0.02,
      weekend_morning: 0.70, weekend_afternoon: 0.45, weekend_prime: 0.30,
    },
    appeal: {
      kids: 2.5, family: 1.4, movie: 0.9,
      news: 0.05, reality: 0.1, series: 0.4, latenight: 0.0,
      sports: 0.6, contest: 0.7,
    },
  },
  youngM: {
    id: 'youngM', label: 'Young Male (16-30)',
    popShare: 0.12,
    watchHours: {
      morning: 0.10, afternoon: 0.15, evening: 0.30,
      prime: 0.55, prime2: 0.40, latenight: 0.40,
      weekend_morning: 0.15, weekend_afternoon: 0.50, weekend_prime: 0.60,
    },
    appeal: {
      sports: 2.4, series: 1.5, movie: 1.4, latenight: 1.3,
      reality: 0.7, news: 0.5, contest: 0.5, family: 0.4,
      kids: 0.1,
    },
  },
  youngF: {
    id: 'youngF', label: 'Young Female (16-30)',
    popShare: 0.12,
    watchHours: {
      morning: 0.20, afternoon: 0.20, evening: 0.40,
      prime: 0.65, prime2: 0.45, latenight: 0.30,
      weekend_morning: 0.20, weekend_afternoon: 0.30, weekend_prime: 0.55,
    },
    appeal: {
      reality: 2.4, series: 1.7, movie: 1.5, latenight: 1.1,
      family: 0.8, news: 0.6, contest: 0.7, sports: 0.5,
      kids: 0.2,
    },
  },
  adultM: {
    id: 'adultM', label: 'Adult Male (31-60)',
    popShare: 0.20,
    watchHours: {
      morning: 0.20, afternoon: 0.10, evening: 0.50,
      prime: 0.60, prime2: 0.45, latenight: 0.25,
      weekend_morning: 0.20, weekend_afternoon: 0.55, weekend_prime: 0.60,
    },
    appeal: {
      sports: 2.2, news: 1.6, series: 1.5, movie: 1.3,
      latenight: 0.9, reality: 0.5, contest: 0.7, family: 0.6,
      kids: 0.1,
    },
  },
  adultF: {
    id: 'adultF', label: 'Adult Female (31-60)',
    popShare: 0.20,
    watchHours: {
      morning: 0.35, afternoon: 0.20, evening: 0.55,
      prime: 0.70, prime2: 0.50, latenight: 0.15,
      weekend_morning: 0.25, weekend_afternoon: 0.30, weekend_prime: 0.55,
    },
    appeal: {
      reality: 2.2, series: 1.8, movie: 1.6, family: 1.5,
      news: 1.2, contest: 1.0, latenight: 0.8, sports: 0.3,
      kids: 0.3,
    },
  },
  olderM: {
    id: 'olderM', label: 'Older Male (60+)',
    popShare: 0.10,
    watchHours: {
      morning: 0.45, afternoon: 0.45, evening: 0.65,
      prime: 0.65, prime2: 0.50, latenight: 0.10,
      weekend_morning: 0.40, weekend_afternoon: 0.55, weekend_prime: 0.55,
    },
    appeal: {
      news: 2.0, sports: 1.5, series: 1.2, movie: 1.4,
      contest: 1.3, family: 0.8, reality: 0.4, latenight: 0.5,
      kids: 0.1,
    },
  },
  olderF: {
    id: 'olderF', label: 'Older Female (60+)',
    popShare: 0.10,
    watchHours: {
      morning: 0.50, afternoon: 0.45, evening: 0.65,
      prime: 0.65, prime2: 0.55, latenight: 0.10,
      weekend_morning: 0.45, weekend_afternoon: 0.45, weekend_prime: 0.55,
    },
    appeal: {
      contest: 2.2, news: 1.6, family: 1.5, movie: 1.4,
      series: 1.3, reality: 1.0, latenight: 0.5, sports: 0.3,
      kids: 0.4,
    },
  },
}
export const DEMO_ORDER = ['kids', 'youngM', 'youngF', 'adultM', 'adultF', 'olderM', 'olderF']

// Topic-level overrides: when set, REPLACE the category appeal for that demo.
// Useful for things like "true crime documentaries appeal more to adult women
// than other documentaries do", or "competition reality is more male than other reality".
export const TOPIC_APPEAL_OVERRIDES = {
  // catId: { topicId: { demoId: appealMultiplier } }
  reality: {
    competition: { youngM: 1.1, adultM: 1.0 },    // competition reality more male-balanced
    love:        { youngF: 3.0, adultF: 2.6, adultM: 0.3, youngM: 0.4 },
    adventure:   { youngM: 1.5, adultM: 1.2 },
  },
  series: {
    drama:   { adultF: 2.2, olderF: 1.7, youngF: 2.0 },
    action:  { youngM: 2.4, adultM: 2.0 },
    fantasy: { youngM: 1.8, youngF: 1.6 },
    crime:   { adultF: 2.0, olderF: 1.8, olderM: 1.7 },     // CSI / true crime audience
    comedy:  { youngM: 1.7, youngF: 1.7 },
  },
  sports: {
    live:     { adultM: 2.6, youngM: 2.8 },
    analysis: { olderM: 2.0, adultM: 1.8 },
  },
  news: {
    bigtopic: { adultF: 1.6, olderF: 1.5 },
    local:    { olderM: 1.6, olderF: 1.6 },
  },
  movie: {
    // movies vary by genre tag but we don't have movie sub-tags yet;
    // future hook for romcom/action/etc. demo shaping.
  },
  contest: {
    quiz:     { olderF: 2.8, olderM: 2.4 },
    prize:    { youngM: 1.4, adultM: 1.3, youngF: 1.4 },
    physical: { youngM: 1.6 },
  },
  latenight: {
    talk:    { adultF: 1.3, youngF: 1.2 },
    mature:  { youngM: 1.6, adultM: 1.3, adultF: 0.5, olderF: 0.1, olderM: 0.3, kids: 0 },
  },
  family: {
    edu:     { kids: 1.5, adultF: 1.2 },
    animated:{ kids: 2.0, adultM: 0.9, adultF: 0.9 },
  },
  kids: {
    cartoon:  { kids: 2.8 },
    toytiein: { kids: 3.2, adultM: 0.05, adultF: 0.05 },
    edutain:  { kids: 2.0, adultF: 1.0 },
    preschool:{ kids: 2.5, adultF: 0.7 },
  },
}

// ─── MARKETING TIERS ─────────────────────────────────────────────────────────
export const MARKETING_TIERS = [
  { id: 'none',    label: 'No Campaign',     cost: 0,   h: 0,   q: 0   },
  { id: 'online',  label: 'Online / Social', cost: 1.5, h: 1.0, q: 0   },
  { id: 'medium',  label: 'Standard Ads',    cost: 4,   h: 1.8, q: 0   },
  { id: 'big',     label: 'TV+Radio+Print',  cost: 10,  h: 2.6, q: 0.2 },
  { id: 'massive', label: 'Disney-Scale',    cost: 28,  h: 3.8, q: 0.4 },
]

// ─── DIRECTORS POOL ──────────────────────────────────────────────────────────
export const DIRECTORS = [
  // News
  { id: 'd_andersongrover', name: 'Anderson Grover',    specialty: 'news',     tier: 'Legendary', q: 2.4, h: 1.6, cost: 9.0  },
  { id: 'd_rachelmadcow',   name: 'Rachel Madcow',      specialty: 'news',     tier: 'Epic',      q: 1.8, h: 1.2, cost: 5.0  },
  { id: 'd_christsamour',   name: 'Christine Tsamour',  specialty: 'news',     tier: 'Rare',      q: 1.2, h: 0.6, cost: 2.2  },
  { id: 'd_brianstelmar',   name: 'Brian Stelmar',      specialty: 'news',     tier: 'Uncommon',  q: 0.7, h: 0.3, cost: 0.9  },
  { id: 'd_dancetterson',   name: 'Dan Cetterson',      specialty: 'news',     tier: 'Common',    q: 0.3, h: 0.1, cost: 0.3  },

  // Reality
  { id: 'd_markburney',     name: 'Mark Burney',        specialty: 'reality',  tier: 'Legendary', q: 2.0, h: 2.4, cost: 10.0 },
  { id: 'd_andysohn',       name: 'Andy Sohn',          specialty: 'reality',  tier: 'Epic',      q: 1.4, h: 2.0, cost: 5.5  },
  { id: 'd_jeffprovost',    name: 'Jeff Provost',       specialty: 'reality',  tier: 'Rare',      q: 1.1, h: 1.4, cost: 2.4  },
  { id: 'd_kimkard',        name: 'Kim Kardenian',      specialty: 'reality',  tier: 'Uncommon',  q: 0.5, h: 1.1, cost: 1.0  },
  { id: 'd_realtycrew',     name: 'Bobby Calderon',     specialty: 'reality',  tier: 'Common',    q: 0.2, h: 0.4, cost: 0.3  },

  // Series
  { id: 'd_vincegillagain', name: 'Vince Gillagain',    specialty: 'series',   tier: 'Legendary', q: 2.6, h: 1.8, cost: 12.0 },
  { id: 'd_dbweisman',      name: 'D.B. Weisman',       specialty: 'series',   tier: 'Epic',      q: 2.0, h: 1.6, cost: 7.0  },
  { id: 'd_shondarimes',    name: 'Shonda Rimes',       specialty: 'series',   tier: 'Epic',      q: 1.9, h: 1.4, cost: 6.5  },
  { id: 'd_taylersheridan', name: 'Tayler Sheridan',    specialty: 'series',   tier: 'Rare',      q: 1.4, h: 0.9, cost: 3.0  },
  { id: 'd_aaronsorkid',    name: 'Aaron Sorkid',       specialty: 'series',   tier: 'Rare',      q: 1.5, h: 0.7, cost: 3.0  },
  { id: 'd_indiedirector',  name: 'Marcus Holloway',    specialty: 'series',   tier: 'Uncommon',  q: 0.8, h: 0.5, cost: 1.1  },
  { id: 'd_filmschoolgrad', name: 'Philip Smith',       specialty: 'series',   tier: 'Common',    q: 0.3, h: 0.2, cost: 0.4  },

  // Late Night
  { id: 'd_lornemikels',    name: 'Lorne Mikels',       specialty: 'latenight',tier: 'Legendary', q: 2.2, h: 2.0, cost: 8.5  },
  { id: 'd_stephencobert',  name: 'Stephen Cobert',     specialty: 'latenight',tier: 'Epic',      q: 1.6, h: 1.6, cost: 4.5  },
  { id: 'd_conanobryant',   name: "Conan O'Bryant",     specialty: 'latenight',tier: 'Rare',      q: 1.2, h: 1.0, cost: 2.0  },
  { id: 'd_localcomic',     name: 'Tony Reggio',        specialty: 'latenight',tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },

  // Sports
  { id: 'd_bobcostis',      name: 'Bob Costis',         specialty: 'sports',   tier: 'Legendary', q: 2.0, h: 2.2, cost: 9.0  },
  { id: 'd_alroker',        name: 'Al Mikels',          specialty: 'sports',   tier: 'Epic',      q: 1.5, h: 1.6, cost: 5.0  },
  { id: 'd_localsportsguy', name: 'Ron Mahoney',        specialty: 'sports',   tier: 'Rare',      q: 1.0, h: 0.9, cost: 2.0  },
  { id: 'd_collegegrad',    name: 'Mike Patterson',     specialty: 'sports',   tier: 'Common',    q: 0.3, h: 0.3, cost: 0.4  },

  // Family
  { id: 'd_pixarvet',       name: 'Brad Birde',         specialty: 'family',   tier: 'Legendary', q: 2.5, h: 1.8, cost: 9.5  },
  { id: 'd_phineasferb',    name: 'Phineas Ferb',       specialty: 'family',   tier: 'Epic',      q: 1.8, h: 1.4, cost: 5.0  },
  { id: 'd_familychannel',  name: 'Diane Whitlock',     specialty: 'family',   tier: 'Rare',      q: 1.1, h: 0.8, cost: 2.0  },
  { id: 'd_sundayschool',   name: 'Carol Bennett',      specialty: 'family',   tier: 'Common',    q: 0.3, h: 0.2, cost: 0.3  },

  // Kids
  { id: 'd_kidsanimator',   name: 'Maddie Lin',         specialty: 'kids',     tier: 'Legendary', q: 2.2, h: 2.2, cost: 8.5  },
  { id: 'd_cartoonist',     name: 'Greg Tendler',       specialty: 'kids',     tier: 'Epic',      q: 1.5, h: 1.6, cost: 4.0  },
  { id: 'd_kidshow_dir',    name: 'Amber Foster',       specialty: 'kids',     tier: 'Rare',      q: 1.0, h: 1.0, cost: 1.8  },
  { id: 'd_summercamp',     name: 'Doug Hartwell',      specialty: 'kids',     tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },

  // Contest
  { id: 'd_chrishorton',    name: 'Chris Horton',       specialty: 'contest',  tier: 'Legendary', q: 1.8, h: 2.4, cost: 8.5  },
  { id: 'd_steveharvy',     name: 'Steve Harvy',        specialty: 'contest',  tier: 'Epic',      q: 1.4, h: 1.8, cost: 4.5  },
  { id: 'd_aliexttrebek',   name: 'Aliex Trebok',       specialty: 'contest',  tier: 'Rare',      q: 1.4, h: 0.9, cost: 2.5  },
  { id: 'd_localhost',      name: 'Jerry Donato',       specialty: 'contest',  tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },
]

// ─── STARS POOL ──────────────────────────────────────────────────────────────
export const STARS = [
  // News anchors
  { id: 's_andercoop',     name: 'Ander Coop',          specialty: 'news',     tier: 'Legendary', q: 2.6, h: 2.0, cost: 11.0 },
  { id: 's_lestrhold',     name: 'Lester Hold',         specialty: 'news',     tier: 'Epic',      q: 1.8, h: 1.4, cost: 5.5  },
  { id: 's_norareilly',    name: 'Nora Reilly',         specialty: 'news',     tier: 'Rare',      q: 1.4, h: 1.0, cost: 2.6  },
  { id: 's_localanchor1',  name: 'Sandra Reyes',        specialty: 'news',     tier: 'Uncommon',  q: 0.7, h: 0.4, cost: 0.9  },
  { id: 's_freshanchor',   name: 'Eric Park',           specialty: 'news',     tier: 'Common',    q: 0.3, h: 0.2, cost: 0.3  },

  // Reality stars (pure hype)
  { id: 's_zandayya',      name: 'Zandayya',            specialty: 'reality',  tier: 'Legendary', q: 1.4, h: 3.2, cost: 12.0 },
  { id: 's_kourtneyk',     name: 'Kourtney K.',         specialty: 'reality',  tier: 'Epic',      q: 1.0, h: 2.6, cost: 6.0  },
  { id: 's_paulsenheir',   name: 'Paulsen Heir',        specialty: 'reality',  tier: 'Rare',      q: 0.7, h: 1.8, cost: 2.8  },
  { id: 's_instainfluencer',name: 'Brittany Vance',     specialty: 'reality',  tier: 'Uncommon',  q: 0.3, h: 1.2, cost: 1.0  },
  { id: 's_realityrookie', name: 'Madison Cole',        specialty: 'reality',  tier: 'Common',    q: 0.2, h: 0.5, cost: 0.3  },

  // Series leads
  { id: 's_bryancranstein',name: 'Bryan Cranstein',     specialty: 'series',   tier: 'Legendary', q: 3.0, h: 2.0, cost: 13.0 },
  { id: 's_pedropastel',   name: 'Pedro Pastel',        specialty: 'series',   tier: 'Legendary', q: 2.6, h: 2.6, cost: 13.5 },
  { id: 's_jenanniston',   name: 'Jen Anniston',        specialty: 'series',   tier: 'Epic',      q: 2.0, h: 1.8, cost: 6.5  },
  { id: 's_keanureverse',  name: 'Keanu Reverse',       specialty: 'series',   tier: 'Epic',      q: 1.8, h: 2.2, cost: 7.0  },
  { id: 's_zendoyle',      name: 'Zen Doyle',           specialty: 'series',   tier: 'Rare',      q: 1.4, h: 1.4, cost: 3.0  },
  { id: 's_workingactor',  name: 'James Whelan',        specialty: 'series',   tier: 'Uncommon',  q: 0.8, h: 0.4, cost: 1.0  },
  { id: 's_castingcouch',  name: 'Kayla Ortiz',         specialty: 'series',   tier: 'Common',    q: 0.3, h: 0.2, cost: 0.4  },

  // Late night hosts
  { id: 's_jimmyfellone',  name: 'Jimmy Fellone',       specialty: 'latenight',tier: 'Legendary', q: 2.0, h: 2.6, cost: 11.0 },
  { id: 's_jimmykimble',   name: 'Jimmy Kimble',        specialty: 'latenight',tier: 'Epic',      q: 1.6, h: 2.0, cost: 5.5  },
  { id: 's_setmeyors',     name: 'Set Meyors',          specialty: 'latenight',tier: 'Rare',      q: 1.2, h: 1.4, cost: 2.5  },
  { id: 's_openmicnight',  name: 'Vinnie Largo',        specialty: 'latenight',tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },

  // Sports talent
  { id: 's_tombrody',      name: 'Tom Brody',           specialty: 'sports',   tier: 'Legendary', q: 2.4, h: 2.8, cost: 12.0 },
  { id: 's_lebronjeans',   name: 'LeBron Jeans',        specialty: 'sports',   tier: 'Legendary', q: 2.2, h: 3.0, cost: 12.5 },
  { id: 's_payton',        name: 'Peyton M.',           specialty: 'sports',   tier: 'Epic',      q: 1.8, h: 1.8, cost: 5.5  },
  { id: 's_localathlete',  name: 'Local Pro Athlete',   specialty: 'sports',   tier: 'Rare',      q: 1.0, h: 1.2, cost: 2.2  },
  { id: 's_collegehost',   name: 'Drew Halloway',       specialty: 'sports',   tier: 'Common',    q: 0.3, h: 0.4, cost: 0.4  },

  // Family
  { id: 's_dwayneboulder', name: 'Dwayne Boulder',      specialty: 'family',   tier: 'Legendary', q: 1.8, h: 3.0, cost: 11.5 },
  { id: 's_zackefron',     name: 'Zack Efron',          specialty: 'family',   tier: 'Epic',      q: 1.6, h: 2.0, cost: 5.5  },
  { id: 's_disneystar',    name: 'Channel Star',        specialty: 'family',   tier: 'Rare',      q: 1.0, h: 1.4, cost: 2.4  },
  { id: 's_kidshow',       name: 'Becky Sterling',      specialty: 'family',   tier: 'Common',    q: 0.3, h: 0.4, cost: 0.3  },

  // Kids
  { id: 's_steveirwin',    name: 'Steve Erwin Jr.',     specialty: 'kids',     tier: 'Legendary', q: 2.0, h: 2.8, cost: 9.0  },
  { id: 's_blueclues',     name: 'Joey Burgess',        specialty: 'kids',     tier: 'Epic',      q: 1.4, h: 2.0, cost: 4.5  },
  { id: 's_youngstar',     name: 'Lily Adams',          specialty: 'kids',     tier: 'Rare',      q: 1.0, h: 1.3, cost: 2.0  },
  { id: 's_puppeteer',     name: 'Pete the Puppeteer',  specialty: 'kids',     tier: 'Uncommon',  q: 0.7, h: 0.5, cost: 0.9  },
  { id: 's_kidsrookie',    name: 'Sam Tanaka',          specialty: 'kids',     tier: 'Common',    q: 0.3, h: 0.4, cost: 0.3  },

  // Contest hosts
  { id: 's_mistrbeast',    name: 'Mister Feast',        specialty: 'contest',  tier: 'Legendary', q: 1.6, h: 3.4, cost: 12.5 },
  { id: 's_ryanseaprest',  name: 'Ryan Seaprest',       specialty: 'contest',  tier: 'Epic',      q: 1.4, h: 2.2, cost: 5.5  },
  { id: 's_padmalakshmer', name: 'Padma Lakshmer',      specialty: 'contest',  tier: 'Rare',      q: 1.4, h: 1.4, cost: 2.6  },
  { id: 's_localhostess',  name: 'Theresa Gomez',       specialty: 'contest',  tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },
]

// ─── IP CATALOG ──────────────────────────────────────────────────────────────
export const IPS = [
  { id: 'ip_galaxywars',  name: 'Galaxy Wars',         tier: 'Legendary', q: 1.5, h: 3.0, cost: 18,  fits: ['series', 'movie', 'family'] },
  { id: 'ip_crowngame',   name: 'Crown of Games',      tier: 'Legendary', q: 2.0, h: 2.5, cost: 16,  fits: ['series', 'movie'] },
  { id: 'ip_wizardsch',   name: 'Wizard School',       tier: 'Legendary', q: 1.4, h: 2.8, cost: 17,  fits: ['series', 'movie', 'family'] },
  { id: 'ip_stelartrek',  name: 'Stelar Trek',         tier: 'Epic',      q: 1.4, h: 2.0, cost: 9,   fits: ['series', 'movie'] },
  { id: 'ip_marvelous',   name: 'Marvelous Heroes',    tier: 'Epic',      q: 1.0, h: 2.4, cost: 10,  fits: ['series', 'movie', 'family'] },
  { id: 'ip_lordrings',   name: 'Lord of the Bands',   tier: 'Epic',      q: 1.6, h: 1.8, cost: 9,   fits: ['series', 'movie'] },
  { id: 'ip_dunesands',   name: 'Dune of Sands',       tier: 'Rare',      q: 1.4, h: 1.2, cost: 4,   fits: ['series', 'movie'] },
  { id: 'ip_zombieland',  name: 'Zombie Apocalypse',   tier: 'Rare',      q: 0.9, h: 1.5, cost: 4,   fits: ['series', 'movie'] },
  { id: 'ip_60min',       name: '60 Min Format',       tier: 'Rare',      q: 1.4, h: 0.4, cost: 2.5, fits: ['news'] },
  { id: 'ip_amazingrace', name: 'Amazing Race Format', tier: 'Rare',      q: 0.7, h: 1.6, cost: 3.5, fits: ['reality', 'contest'] },
  { id: 'ip_oldsitcom',   name: 'Classic Sitcom IP',   tier: 'Uncommon',  q: 0.6, h: 0.8, cost: 1.5, fits: ['series', 'family'] },
  { id: 'ip_indiebook',   name: 'Indie Novel Rights',  tier: 'Uncommon',  q: 1.0, h: 0.4, cost: 1.0, fits: ['series', 'movie'] },
]

// ─── MOVIE CATALOG ───────────────────────────────────────────────────────────
export const MOVIES = [
  { id: 'mv_titanic',    name: 'Titanic Returns',         tier: 'Legendary', q: 9.0, h: 8.5, cost: 22  },
  { id: 'mv_avatar',     name: 'Avatar 3: The Reef',      tier: 'Legendary', q: 8.5, h: 9.0, cost: 24  },
  { id: 'mv_oppen',      name: 'Atomicore',               tier: 'Epic',      q: 9.0, h: 7.0, cost: 12  },
  { id: 'mv_barbie',     name: 'Doll House',              tier: 'Epic',      q: 7.5, h: 8.5, cost: 11  },
  { id: 'mv_inception',  name: 'Dream Layers',            tier: 'Epic',      q: 8.5, h: 7.5, cost: 11  },
  { id: 'mv_marvel1',    name: 'Heroes Unite',            tier: 'Rare',      q: 7.0, h: 7.5, cost: 5.5 },
  { id: 'mv_pixar',      name: 'Animated Adventure',      tier: 'Rare',      q: 8.0, h: 6.5, cost: 5   },
  { id: 'mv_horror1',    name: 'Cabin Screams',           tier: 'Rare',      q: 6.5, h: 7.0, cost: 4.5 },
  { id: 'mv_action1',    name: 'Fast & Loud 12',          tier: 'Rare',      q: 6.0, h: 7.5, cost: 5   },
  { id: 'mv_indie1',     name: 'Sundance Darling',        tier: 'Uncommon',  q: 7.5, h: 4.5, cost: 2   },
  { id: 'mv_romcom1',    name: 'Coffee Shop Romance',     tier: 'Uncommon',  q: 6.0, h: 5.5, cost: 1.8 },
  { id: 'mv_oldclassic', name: 'Classic Hollywood Pack',  tier: 'Common',    q: 6.5, h: 4.0, cost: 1.0 },
  { id: 'mv_btv1',       name: 'B-Movie Saturday',        tier: 'Common',    q: 4.5, h: 4.0, cost: 0.6 },
  { id: 'mv_btv2',       name: 'Direct-to-Video Pack',    tier: 'Common',    q: 4.0, h: 3.5, cost: 0.5 },
]

// ─── COMPETITORS PER MARKET ──────────────────────────────────────────────────
// Each competitor has:
//   - name, label
//   - strength: rough power level (drives base quality/hype of their shows)
//   - focusCats: array of category IDs they air OFTEN (heavy preference)
//   - startCash, startFame
//   - slotTypeIds: their programming slots
//   - tier: 'big4' | 'regional' | 'niche'  — display grouping
// Niche channels (NatGeo etc.) only do one type of content.
export const COMPETITORS = {
  local: [
    // Local versions of the Big 4
    {
      id: 'local_kbc',    name: 'KBC Riverside',     tier: 'big4',
      strength: 0.85,     startCash: 50, startFame: 22,
      focusCats: ['news', 'series', 'reality'],
      slotTypeIds: ['morning', 'prime', 'weekend_prime'],
    },
    {
      id: 'local_kfb',    name: 'KFB Channel 4',     tier: 'big4',
      strength: 0.80,     startCash: 45, startFame: 18,
      focusCats: ['series', 'reality', 'movie'],
      slotTypeIds: ['morning', 'prime', 'weekend_prime'],
    },
    {
      id: 'local_kab',    name: 'KAB News 7',        tier: 'big4',
      strength: 0.75,     startCash: 40, startFame: 16,
      focusCats: ['news', 'family', 'movie'],
      slotTypeIds: ['morning', 'prime', 'weekend_prime'],
    },
    {
      id: 'local_kcb',    name: 'KCB Network',       tier: 'big4',
      strength: 0.70,     startCash: 38, startFame: 14,
      focusCats: ['reality', 'sports', 'series'],
      slotTypeIds: ['morning', 'prime', 'weekend_prime'],
    },
  ],
  metro: [
    // Big 4 at metro scale + 1 additional regional
    {
      id: 'metro_atlas',   name: 'Atlas Broadcasting',   tier: 'big4',
      strength: 1.05,     startCash: 110, startFame: 45,
      focusCats: ['news', 'series'],
      slotTypeIds: ['morning', 'evening', 'prime', 'prime2', 'weekend_prime'],
    },
    {
      id: 'metro_pinnacle',name: 'Pinnacle Networks',     tier: 'big4',
      strength: 1.0,      startCash: 100, startFame: 42,
      focusCats: ['series', 'reality', 'movie'],
      slotTypeIds: ['morning', 'evening', 'prime', 'prime2', 'weekend_prime'],
    },
    {
      id: 'metro_vertex',  name: 'Vertex Media',          tier: 'big4',
      strength: 0.95,     startCash: 95, startFame: 40,
      focusCats: ['news', 'reality', 'family'],
      slotTypeIds: ['morning', 'evening', 'prime', 'weekend_prime', 'weekend_morning'],
    },
    {
      id: 'metro_zenith',  name: 'Zenith TV',             tier: 'big4',
      strength: 0.90,     startCash: 90, startFame: 38,
      focusCats: ['reality', 'sports', 'series'],
      slotTypeIds: ['evening', 'prime', 'prime2', 'weekend_afternoon', 'weekend_prime'],
    },
    {
      id: 'metro_keystone',name: 'Keystone Public',       tier: 'regional',
      strength: 0.75,     startCash: 60, startFame: 28,
      focusCats: ['news', 'family', 'kids'],
      slotTypeIds: ['morning', 'evening', 'weekend_morning', 'weekend_prime'],
    },
  ],
  national: [
    // Big 4 at national scale
    {
      id: 'nat_globalmedia', name: 'Global Media',        tier: 'big4',
      strength: 1.25,     startCash: 250, startFame: 75,
      focusCats: ['series', 'news'],
      slotTypeIds: ['morning', 'afternoon', 'evening', 'prime', 'prime2', 'latenight', 'weekend_morning', 'weekend_afternoon', 'weekend_prime'],
    },
    {
      id: 'nat_summit',    name: 'Summit Networks',       tier: 'big4',
      strength: 1.20,     startCash: 240, startFame: 72,
      focusCats: ['series', 'reality', 'movie'],
      slotTypeIds: ['morning', 'afternoon', 'evening', 'prime', 'prime2', 'latenight', 'weekend_morning', 'weekend_afternoon', 'weekend_prime'],
    },
    {
      id: 'nat_apex',      name: 'Apex Broadcasting',     tier: 'big4',
      strength: 1.15,     startCash: 230, startFame: 70,
      focusCats: ['news', 'reality', 'family'],
      slotTypeIds: ['morning', 'afternoon', 'evening', 'prime', 'prime2', 'weekend_morning', 'weekend_prime'],
    },
    {
      id: 'nat_continental',name: 'Continental TV',       tier: 'big4',
      strength: 1.10,     startCash: 220, startFame: 68,
      focusCats: ['series', 'sports', 'movie'],
      slotTypeIds: ['morning', 'evening', 'prime', 'prime2', 'latenight', 'weekend_afternoon', 'weekend_prime'],
    },
    // Niche national channels — single-purpose
    {
      id: 'nat_natgeo',    name: 'GeoView',               tier: 'niche',
      strength: 0.95,     startCash: 130, startFame: 55,
      focusCats: ['family'],            // documentaries → family/edu
      onlyCats: ['family', 'kids'],
      slotTypeIds: ['evening', 'prime', 'weekend_afternoon', 'weekend_prime'],
    },
    {
      id: 'nat_cnn',       name: 'NewsWire 24',           tier: 'niche',
      strength: 1.0,      startCash: 140, startFame: 60,
      focusCats: ['news'],
      onlyCats: ['news'],
      slotTypeIds: ['morning', 'afternoon', 'evening', 'prime', 'latenight'],
    },
    {
      id: 'nat_espn',      name: 'AllSports Network',     tier: 'niche',
      strength: 1.05,     startCash: 160, startFame: 65,
      focusCats: ['sports'],
      onlyCats: ['sports'],
      slotTypeIds: ['evening', 'prime', 'weekend_morning', 'weekend_afternoon', 'weekend_prime'],
    },
    {
      id: 'nat_hbo',       name: 'Prestige Channel',      tier: 'niche',
      strength: 1.10,     startCash: 180, startFame: 67,
      focusCats: ['series'],
      onlyCats: ['series', 'movie'],
      slotTypeIds: ['evening', 'prime', 'prime2', 'latenight', 'weekend_prime'],
    },
    {
      id: 'nat_kids',      name: 'KidsZone',              tier: 'niche',
      strength: 0.85,     startCash: 110, startFame: 50,
      focusCats: ['kids', 'family'],
      onlyCats: ['kids', 'family'],
      slotTypeIds: ['morning', 'afternoon', 'weekend_morning', 'weekend_afternoon'],
    },
  ],
}

// ─── RESEARCH TREE ───────────────────────────────────────────────────────────
// Three groups: SLOTS (add a programming slot of a specific type), CONTENT
// (unlock new categories & topics), OPERATIONS (passive economic boosts).
//
// `effect` keys handled by the engine:
//   addSlot: 'slotTypeId'              → push a new slot of that type
//   unlockContent: [[catId, topicId], ...] → add to research.contentUnlocks
//   marketingDiscount: number          → multiply marketing costs
//   ipDiscount: number                 → multiply IP licensing costs
//   sequelBonus: number                → +X quality on renewed shows
//   refreshRoster: true                → handled by App.jsx (reroll market roster)
// RESEARCH ITEMS now have `months` field — they take time to complete.
// Innovation Director discounts both `cost` and `months` (the better the
// director, the deeper the discount).
//   no director:   1.00x cost, 1.00x months
//   Common:        0.95x cost, 0.92x months
//   Uncommon:      0.85x cost, 0.85x months
//   Rare:          0.75x cost, 0.75x months
//   Epic:          0.60x cost, 0.60x months
//   Legendary:     0.45x cost, 0.50x months
//
// Affinity bonus: if the player already has heavy experience in a domain
// (e.g. already unlocked some content_reality_*), follow-up research in
// the same domain is 25% cheaper and 25% faster. The engine handles this.
export const RESEARCH = [
  // ─── SLOTS ─────────────────────────────────────────────────────────────────
  {
    id: 'slot_afternoon', group: 'slots',
    label: 'Weekday Afternoon Slot', icon: '🌤',
    desc: 'Add an afternoon slot. Kids audience + sports pulls all ages.',
    cost: 8,  months: 3,
    effect: { addSlot: 'afternoon' },
  },
  {
    id: 'slot_prime2', group: 'slots',
    label: 'Prime Time 2', icon: '🌃',
    desc: 'A second prime window. Almost as big an audience as Prime 1.',
    cost: 24, months: 6,
    effect: { addSlot: 'prime2' },
  },
  {
    id: 'slot_latenight', group: 'slots',
    label: 'Weekday Late Night', icon: '🌙',
    desc: 'Adults & mature content. Lower audience but cheap.',
    cost: 12, months: 3,
    effect: { addSlot: 'latenight' },
  },
  {
    id: 'slot_weekend_afternoon', group: 'slots',
    label: 'Weekend Afternoon Slot', icon: '🏟',
    desc: 'Sports, documentaries, leisure viewing.',
    cost: 14, months: 4,
    effect: { addSlot: 'weekend_afternoon' },
  },

  // ─── CONTENT — ENTER NEW CATEGORIES (slow if you have no experience) ──────
  {
    id: 'content_news_dept', group: 'content', domain: 'news',
    label: 'News Department', icon: '📰',
    desc: 'Unlock News (local + global) if you don\'t have it.',
    cost: 6,  months: 4,
    effect: { unlockContent: [['news', 'local'], ['news', 'global']] },
  },
  {
    id: 'content_reality_dept', group: 'content', domain: 'reality',
    label: 'Reality Department', icon: '👁',
    desc: 'Unlock Reality (general + competition).',
    cost: 8,  months: 4,
    effect: { unlockContent: [['reality', 'general'], ['reality', 'competition']] },
  },
  {
    id: 'content_series_dept', group: 'content', domain: 'series',
    label: 'Series Department', icon: '📺',
    desc: 'Unlock Scripted Series (drama + comedy).',
    cost: 12, months: 6,
    effect: { unlockContent: [['series', 'drama'], ['series', 'comedy']] },
  },
  {
    id: 'content_latenight_dept', group: 'content', domain: 'latenight',
    label: 'Late Night Department', icon: '🎤',
    desc: 'Unlock Late Night (talk + comedy + variety).',
    cost: 7,  months: 3,
    effect: { unlockContent: [['latenight', 'talk'], ['latenight', 'comedy'], ['latenight', 'variety']] },
  },
  {
    id: 'content_sports_dept', group: 'content', domain: 'sports',
    label: 'Sports Department', icon: '🏆',
    desc: 'Unlock Sports analysis + documentaries. Live coverage requires further research.',
    cost: 15, months: 5,
    effect: { unlockContent: [['sports', 'analysis'], ['sports', 'doc']] },
  },
  {
    id: 'content_family_dept', group: 'content', domain: 'family',
    label: 'Family Department', icon: '👨‍👩‍👧',
    desc: 'Unlock Family programming (animated + live-action).',
    cost: 6,  months: 3,
    effect: { unlockContent: [['family', 'animated'], ['family', 'live']] },
  },
  {
    id: 'content_kids_dept', group: 'content', domain: 'kids',
    label: 'Kids Department', icon: '🧸',
    desc: 'Unlock Kids programming (cartoons + live-action kids + preschool).',
    cost: 7,  months: 3,
    effect: { unlockContent: [['kids', 'cartoon'], ['kids', 'liveaction'], ['kids', 'preschool']] },
  },
  {
    id: 'content_kids_advanced', group: 'content', domain: 'kids',
    label: 'Kids Specialty', icon: '🎈',
    desc: 'Kids: unlocks Edutainment, Toy Tie-In Series, and Kids Movie Hour.',
    cost: 9,  months: 4,
    requires: ['content_kids_dept'],
    effect: { unlockContent: [['kids', 'edutain'], ['kids', 'toytiein'], ['kids', 'kidsmovie']] },
  },
  {
    id: 'content_contest_dept', group: 'content', domain: 'contest',
    label: 'Contest Department', icon: '🎯',
    desc: 'Unlock Contest shows (quiz + physical).',
    cost: 5,  months: 2,
    effect: { unlockContent: [['contest', 'quiz'], ['contest', 'physical']] },
  },

  // ─── CONTENT — DEEPEN AN EXISTING CATEGORY ────────────────────────────────
  {
    id: 'content_news_field', group: 'content', domain: 'news',
    label: 'Field Reporting', icon: '🎙',
    desc: 'News: unlocks Field Reporter and Big-Topic Specials.',
    cost: 8,  months: 3,
    effect: { unlockContent: [['news', 'reporter'], ['news', 'bigtopic']] },
  },
  {
    id: 'content_reality_lifestyle', group: 'content', domain: 'reality',
    label: 'Lifestyle Programming', icon: '💕',
    desc: 'Reality: unlocks Adventure / Survival and Dating / Love.',
    cost: 7,  months: 3,
    effect: { unlockContent: [['reality', 'adventure'], ['reality', 'love']] },
  },
  {
    id: 'content_series_genres', group: 'content', domain: 'series',
    label: 'Genre Expansion', icon: '🎭',
    desc: 'Series: unlocks Action, Fantasy/Sci-Fi, and Crime/Procedural.',
    cost: 14, months: 5,
    effect: { unlockContent: [['series', 'action'], ['series', 'fantasy'], ['series', 'crime']] },
  },
  {
    id: 'content_latenight_mature', group: 'content', domain: 'latenight',
    label: 'Mature Content License', icon: '🔞',
    desc: 'Late Night: unlocks Adult / Edgy comedy. Big hype, small audience.',
    cost: 10, months: 3,
    effect: { unlockContent: [['latenight', 'mature']] },
  },
  {
    id: 'content_sports_live', group: 'content', domain: 'sports',
    label: 'Live Coverage Rights', icon: '🏟',
    desc: 'Sports: unlocks LIVE GAME COVERAGE — the highest revenue sports content.',
    cost: 35, months: 6,
    requires: ['content_sports_dept'],
    effect: { unlockContent: [['sports', 'live']] },
  },
  {
    id: 'content_family_edu', group: 'content', domain: 'family',
    label: 'Educational Programming', icon: '🎓',
    desc: 'Family: unlocks Educational shows (high quality, lower hype).',
    cost: 5,  months: 2,
    effect: { unlockContent: [['family', 'edu']] },
  },
  {
    id: 'content_contest_prize', group: 'content', domain: 'contest',
    label: 'Big-Prize Productions', icon: '💰',
    desc: 'Contest: unlocks Big Prize Show — high hype, expensive prizes.',
    cost: 8,  months: 3,
    effect: { unlockContent: [['contest', 'prize']] },
  },

  // ─── TECH — AUDIO / SUBTITLES / VIDEO ──────────────────────────────────────
  // Each unlocks a higher tier of broadcast quality. Set in show editor.
  {
    id: 'tech_audio_stereo', group: 'tech', domain: 'audio',
    label: 'Stereo Audio', icon: '🎧',
    desc: 'Unlock Stereo audio option for shows. +0.4 quality, +0.1 hype.',
    cost: 6,  months: 3,
    effect: {},
  },
  {
    id: 'tech_audio_surround', group: 'tech', domain: 'audio',
    label: 'Surround Sound', icon: '🔊',
    desc: 'Unlock 5.1 Surround audio. +0.9 quality, +0.3 hype. Requires Stereo.',
    cost: 14, months: 4,
    requires: ['tech_audio_stereo'],
    effect: {},
  },
  {
    id: 'tech_subs_basic', group: 'tech', domain: 'subtitles',
    label: 'Basic Subtitles', icon: '💬',
    desc: 'Add subtitle option for shows. +0.3 quality, +0.05 hype.',
    cost: 5,  months: 2,
    effect: {},
  },
  {
    id: 'tech_subs_multi', group: 'tech', domain: 'subtitles',
    label: 'Multilingual Subtitles', icon: '🌐',
    desc: 'Add multi-lang subtitles. +0.7 quality, +0.2 hype. Requires basic.',
    cost: 10, months: 4,
    requires: ['tech_subs_basic'],
    effect: {},
  },
  {
    id: 'tech_video_hd', group: 'tech', domain: 'video',
    label: 'HD Broadcast', icon: '📺',
    desc: 'Unlock HD video option. +0.6 quality, +0.3 hype.',
    cost: 10, months: 4,
    effect: {},
  },
  {
    id: 'tech_video_uhd', group: 'tech', domain: 'video',
    label: '4K UHD Broadcast', icon: '🎞',
    desc: '4K Ultra HD. +1.2 quality, +0.5 hype. Requires HD.',
    cost: 25, months: 7,
    requires: ['tech_video_hd'],
    effect: {},
  },

  // ─── OPERATIONS — PASSIVE BOOSTS ──────────────────────────────────────────
  {
    id: 'ops_scout', group: 'ops',
    label: 'Talent Scout', icon: '🔍',
    desc: 'Refresh the market talent roster with new options. Repeatable.',
    cost: 4,  months: 1,
    repeatable: true,
    effect: { refreshRoster: true },
  },
  {
    id: 'staff_search_normal', group: 'ops',
    label: 'Standard Staff Search', icon: '📋',
    desc: 'Unlock "Standard" tier staff searches (2 mo, finds up to Rare).',
    cost: 8,  months: 2,
    effect: { unlockSearchTier: 'normal' },
  },
  {
    id: 'staff_search_heavy', group: 'ops',
    label: 'Heavy Staff Search', icon: '🎯',
    desc: 'Unlock "Heavy" tier staff searches (3 mo, finds up to Legendary).',
    cost: 18, months: 4,
    requires: ['staff_search_normal'],
    effect: { unlockSearchTier: 'heavy' },
  },
  {
    id: 'ops_mktg_eff', group: 'ops',
    label: 'Marketing Efficiency', icon: '📢',
    desc: '−25% on all marketing campaign costs (stacks with Marketing Director).',
    cost: 10, months: 3,
    effect: { marketingDiscount: 0.75 },
  },
  {
    id: 'ops_sequel_boost', group: 'ops',
    label: 'Renewal Power', icon: '🔄',
    desc: 'Renewed shows get +0.5 quality on top of the natural sequel bonus.',
    cost: 6,  months: 2,
    effect: { sequelBonus: 0.5 },
  },
  {
    id: 'ops_ip_negot', group: 'ops',
    label: 'IP Negotiators', icon: '📜',
    desc: '−20% on IP licensing costs.',
    cost: 8,  months: 3,
    effect: { ipDiscount: 0.8 },
  },
]

// ─── SLOT TYPES ──────────────────────────────────────────────────────────────
// Each station's lineup is a list of typed slots. Each slot has a focus
// audience and "preferred" categories that get a small audience boost when
// you program something matching. Mismatches don't fail — they just don't
// get the bonus.
//
// 9 slot types total: 6 weekday + 3 weekend. New stations start with 3
// (Morning, Prime, Weekend Prime). The rest are researched.
export const SLOT_TYPES = {
  // ─── WEEKDAYS ────────────────────────────────────────────────────────────
  morning: {
    id: 'morning',
    label: 'Weekday Morning',
    icon: '☀',
    desc: 'Family audience starting the day. Light news, family-friendly.',
    prefersCategory: ['family', 'news', 'kids'],
    audienceMult: 0.85,
    costMult: 0.85,
    matchBonus: 0.6,
  },
  afternoon: {
    id: 'afternoon',
    label: 'Weekday Afternoon',
    icon: '🌤',
    desc: 'Kids home from school — kids programming dominates. Sports here pulls fans from all ages.',
    prefersCategory: ['kids', 'family', 'sports'],
    audienceMult: 0.75,
    costMult: 0.7,
    matchBonus: 0.7,
  },
  evening: {
    id: 'evening',
    label: 'Weekday Evening',
    icon: '🌇',
    desc: 'Pre-prime: news + lead-in series. Audience is settling in.',
    prefersCategory: ['news', 'series', 'family'],
    audienceMult: 0.95,
    costMult: 0.9,
    matchBonus: 0.7,
  },
  prime: {
    id: 'prime',
    label: 'Prime Time 1',
    icon: '🌆',
    desc: 'The premium window. Series, reality, movies thrive. Big audience.',
    prefersCategory: ['series', 'reality', 'movie'],
    audienceMult: 1.20,
    costMult: 1.0,
    matchBonus: 0.9,
  },
  prime2: {
    id: 'prime2',
    label: 'Prime Time 2',
    icon: '🌃',
    desc: 'A second prime window — series, reality, movies. Slightly smaller than Prime 1.',
    prefersCategory: ['series', 'reality', 'movie', 'sports'],
    audienceMult: 1.10,
    costMult: 1.0,
    matchBonus: 0.9,
  },
  latenight: {
    id: 'latenight',
    label: 'Weekday Late Night',
    icon: '🌙',
    desc: 'Adults, mature content, talk shows, movies. Smaller audience but cheap to run.',
    prefersCategory: ['latenight', 'movie', 'series'],
    audienceMult: 0.55,
    costMult: 0.7,
    matchBonus: 1.0,
  },

  // ─── WEEKENDS ────────────────────────────────────────────────────────────
  weekend_morning: {
    id: 'weekend_morning',
    label: 'Weekend Morning',
    icon: '🧸',
    desc: 'Kids own Saturday morning. Cartoons, family fare.',
    prefersCategory: ['kids', 'family'],
    audienceMult: 0.80,
    costMult: 0.75,
    matchBonus: 1.0,
  },
  weekend_afternoon: {
    id: 'weekend_afternoon',
    label: 'Weekend Afternoon',
    icon: '🏟',
    desc: 'Sports, documentaries, lazy-day viewing. Sports gets a big bump here.',
    prefersCategory: ['sports', 'family', 'movie'],
    audienceMult: 0.95,
    costMult: 0.9,
    matchBonus: 0.9,
  },
  weekend_prime: {
    id: 'weekend_prime',
    label: 'Weekend Prime',
    icon: '⭐',
    desc: 'The best of the best lives here. Movies, big sports, blockbuster events.',
    prefersCategory: ['movie', 'sports', 'series'],
    audienceMult: 1.25,
    costMult: 1.05,
    matchBonus: 1.0,
  },
}

// Default slots a brand-new station has (pre-research)
export const DEFAULT_SLOT_IDS = ['morning', 'evening', 'prime', 'weekend_morning', 'weekend_prime']

// Slot groupings for UI display
export const SLOT_GROUPS = [
  {
    id: 'weekday',
    label: 'Weekdays',
    slots: ['morning', 'afternoon', 'evening', 'prime', 'prime2', 'latenight'],
  },
  {
    id: 'weekend',
    label: 'Weekends',
    slots: ['weekend_morning', 'weekend_afternoon', 'weekend_prime'],
  },
]

// ─── SEASONAL PREFERENCES ────────────────────────────────────────────────────
// Per-slot, per-month bonus when you match the recommended content.
// Format: `SEASONAL_PREFS[slotTypeId][monthIdx]` (0=Jan ... 11=Dec) → preference
// or `null` if no preference that month. The active preference shows on the
// slot card as "this month wants…" and gives a hype bonus when matched.
export const SEASONAL_PREFS = {
  morning: {
    0:  { categoryId: 'news',    topicId: 'local',    label: 'New Year news cycle',     bonusH: 0.6 },
    3:  { categoryId: 'family',  topicId: 'edu',      label: 'Spring kids programming', bonusH: 0.7 },
    6:  { categoryId: 'family',  topicId: 'animated', label: 'Summer family hits',      bonusH: 0.8 },
    11: { categoryId: 'family',  topicId: 'live',     label: 'Holiday family',          bonusH: 0.9 },
  },
  afternoon: {
    5:  { categoryId: 'kids',    topicId: 'cartoon',  label: 'Summer break cartoons',   bonusH: 1.0 },
    8:  { categoryId: 'kids',    topicId: 'liveaction', label: 'Back-to-school kids',   bonusH: 0.7 },
    11: { categoryId: 'kids',    topicId: 'toytiein', label: 'Toy-tie-in Xmas',         bonusH: 1.1 },
  },
  evening: {
    0:  { categoryId: 'news',    topicId: 'global',   label: 'Year-ahead analysis',     bonusH: 0.5 },
    10: { categoryId: 'news',    topicId: 'bigtopic', label: 'Election specials',       bonusH: 0.9 },
  },
  prime: {
    0:  { categoryId: 'series',  topicId: 'drama',    label: 'Prestige drama season',   bonusH: 0.8 },
    1:  { categoryId: 'series',  topicId: 'drama',    label: 'Awards-bait drama',       bonusH: 0.9 },
    4:  { categoryId: 'reality', topicId: 'love',     label: 'Spring romance reality',  bonusH: 0.7 },
    6:  { categoryId: 'reality', topicId: 'adventure',label: 'Summer adventure',        bonusH: 0.9 },
    11: { categoryId: 'movie',   topicId: null,       label: 'Holiday movie events',    bonusH: 1.0 },
  },
  prime2: {
    1:  { categoryId: 'series',  topicId: 'crime',    label: 'Crime drama February',    bonusH: 0.7 },
    4:  { categoryId: 'series',  topicId: 'comedy',   label: 'Spring sitcom premiere',  bonusH: 0.6 },
    7:  { categoryId: 'reality', topicId: 'competition', label: 'Summer competitions',  bonusH: 0.9 },
    11: { categoryId: 'series',  topicId: 'fantasy',  label: 'Holiday fantasy event',   bonusH: 1.0 },
  },
  latenight: {
    1:  { categoryId: 'latenight', topicId: 'talk',    label: 'Awards-season talk',     bonusH: 0.8 },
    9:  { categoryId: 'latenight', topicId: 'comedy',  label: 'Stand-up tour season',   bonusH: 0.7 },
    11: { categoryId: 'latenight', topicId: 'talk',    label: 'Year-end interviews',    bonusH: 0.9 },
  },
  weekend_morning: {
    11: { categoryId: 'kids',    topicId: 'cartoon',   label: 'Holiday cartoon block',   bonusH: 0.9 },
  },
  weekend_afternoon: {
    1:  { categoryId: 'sports',  topicId: 'live',      label: 'Super Bowl + playoffs',   bonusH: 1.2 },
    3:  { categoryId: 'sports',  topicId: 'live',      label: 'NBA Playoffs / Masters',  bonusH: 1.0 },
    6:  { categoryId: 'movie',   topicId: null,        label: 'Summer blockbusters',     bonusH: 0.9 },
    8:  { categoryId: 'sports',  topicId: 'live',      label: 'NFL kickoff',             bonusH: 1.1 },
  },
  weekend_prime: {
    1:  { categoryId: 'sports',  topicId: 'live',      label: 'Super Bowl Sunday',       bonusH: 1.4 },
    5:  { categoryId: 'movie',   topicId: null,        label: 'Blockbuster premieres',   bonusH: 1.0 },
    9:  { categoryId: 'sports',  topicId: 'live',      label: 'World Series + NFL',      bonusH: 1.1 },
    11: { categoryId: 'movie',   topicId: null,        label: 'Holiday movie marathon',  bonusH: 1.1 },
  },
}

// ─── DEFAULT-AVAILABLE TOPICS PER FOCUS ──────────────────────────────────────
// At game start you only have a SLICE of your focus category — enough to
// program shows, but expansion (advanced topics, other categories) requires
// research. Movies are always available (you license each one individually).
// Returns array of [categoryId, topicId | '*' for all topics].
export function defaultUnlocks(focusId) {
  const baseAll = [
    ['movie', '*'],   // movies always available — they're licensed per-film
  ]
  const byFocus = {
    // News stations: local + global. Field reporting and big-topic specials need research.
    news:    [['news', 'local'], ['news', 'global']],
    // Reality: general + competition. Adventure and dating are lifestyle expansions.
    reality: [['reality', 'general'], ['reality', 'competition']],
    // Series: drama + comedy. Crime, action, fantasy need research (genre expansion).
    series:  [['series', 'drama'], ['series', 'comedy']],
    // Sports: analysis + docs only. Live game rights are EXPENSIVE and require research.
    sports:  [['sports', 'analysis'], ['sports', 'doc']],
    // Family: animated + live. Educational requires research.
    family:  [['family', 'animated'], ['family', 'live']],
    // Kids: cartoons + live-action. Advanced (edutainment, toy-tie-in, kids movies) need research.
    kids:    [['kids', 'cartoon'], ['kids', 'liveaction']],
    // General: a small dish from each — nothing deep. Player must specialize via research.
    general: [['series', 'comedy'], ['reality', 'general'], ['contest', 'quiz']],
  }
  return [...baseAll, ...(byFocus[focusId] || [])]
}

// ─── TALENT CONTRACT TYPES ───────────────────────────────────────────────────
// `costMult` is a multiplier on talent's base cost. Total cost is paid upfront.
// "Permanent" charges base cost every month they're on the roster. Firing them
// costs 5× one month's pay as severance.
export const CONTRACT_TYPES = [
  { id: 'c1',  label: '1 month',    months: 1,   costMult: 1.0,  desc: 'One-shot. Pay one month upfront.' },
  { id: 'c3',  label: '3 months',   months: 3,   costMult: 2.7,  desc: '−10% per month.' },
  { id: 'c6',  label: '6 months',   months: 6,   costMult: 5.1,  desc: '−15% per month.' },
  { id: 'c12', label: '12 months',  months: 12,  costMult: 9.6,  desc: '−20% per month.' },
  { id: 'cP',  label: 'Permanent',  months: -1,  costMult: 0.85, desc: 'Pay each month they\'re hired. Firing costs 5× one month.' },
]
export const FIRE_PENALTY_MULT = 5

// ─── PROGRAM RUN COMMITMENTS ─────────────────────────────────────────────────
// When you save a slot, you commit to a run length. Each month of the run
// pays the production cost again and (re-)airs the show.
// Movies always run for 1 month only.
export const RUN_LENGTHS = [
  { id: 'r1',  months: 1,  label: '1 month',  desc: 'Limited / pilot.' },
  { id: 'r3',  months: 3,  label: '3 months', desc: 'Mini-season.' },
  { id: 'r6',  months: 6,  label: '6 months', desc: 'Half-year run.' },
  { id: 'r12', months: 12, label: 'Full year',desc: 'Year-long commitment.' },
]
// Cancellation: pay 50% of remaining months' cost; free slot+talent.
export const CANCEL_REFUND_MULT = 0.5

// Sequel quality bonus by season number (S2=+10%, S3=+8%, S4=+6%, S5=+4%, then +3%)
// Requires same director AND same star to apply the full bonus. If either
// changed, bonus halves. If both changed, no bonus.
export const SEQUEL_BONUSES = [0, 0.10, 0.08, 0.06, 0.04, 0.03, 0.03, 0.02, 0.02, 0.02]

// ─── SPORTS LICENSE RIGHTS ───────────────────────────────────────────────────
// Buy rights for one full year (Jan–Dec, runs through its in-season months only).
// At end of year you re-license. Each league has:
//   - season: array of month indices it runs (0=Jan ... 11=Dec)
//   - peakMonth: month idx with peak event (playoffs/finals/major)
//   - peakBonus: extra hype for peak month
//   - baseQ, baseH: quality + hype baseline (live games)
//   - cost: full-year rights cost, scales 1.0× local / 2.5× metro / 6× national
export const SPORTS_LEAGUES = [
  {
    id: 'nfl', label: 'NFL Football', icon: '🏈',
    season: [7, 8, 9, 10, 11, 0, 1], // Aug-Feb (wraps)
    peakMonth: 1, peakLabel: 'Super Bowl',
    cost: 35, baseQ: 8.5, baseH: 9.0, peakBonus: 2.5,
  },
  {
    id: 'nba', label: 'NBA Basketball', icon: '🏀',
    season: [8, 9, 10, 11, 0, 1, 2, 3], // Sep-Apr
    peakMonth: 5, peakLabel: 'Finals',
    cost: 28, baseQ: 7.5, baseH: 8.0, peakBonus: 2.0,
  },
  {
    id: 'mlb', label: 'MLB Baseball', icon: '⚾',
    season: [2, 3, 4, 5, 6, 7, 8, 9], // Mar-Oct
    peakMonth: 9, peakLabel: 'World Series',
    cost: 22, baseQ: 7.0, baseH: 6.5, peakBonus: 2.0,
  },
  {
    id: 'wwe', label: 'WWE Wrestling', icon: '🤼',
    season: [0,1,2,3,4,5,6,7,8,9,10,11], // year-round
    peakMonth: 3, peakLabel: 'WrestleMania',
    cost: 14, baseQ: 5.5, baseH: 8.5, peakBonus: 2.5,
  },
  {
    id: 'tennis', label: 'Tennis Tour', icon: '🎾',
    season: [0,1,2,3,4,5,6,7,8,9,10], // year-round (mostly)
    peakMonth: 6, peakLabel: 'Wimbledon',
    cost: 12, baseQ: 7.0, baseH: 6.0, peakBonus: 2.0,
  },
  {
    id: 'golf', label: 'PGA Tour', icon: '⛳',
    season: [0,1,2,3,4,5,6,7,8,9,10], // year-round
    peakMonth: 3, peakLabel: 'The Masters',
    cost: 10, baseQ: 6.8, baseH: 5.5, peakBonus: 1.8,
  },
  {
    id: 'nhl', label: 'NHL Hockey', icon: '🏒',
    season: [9, 10, 11, 0, 1, 2, 3, 4, 5], // Oct-Jun
    peakMonth: 5, peakLabel: 'Stanley Cup',
    cost: 18, baseQ: 7.0, baseH: 6.5, peakBonus: 1.8,
  },
  {
    id: 'soccer', label: 'Soccer League', icon: '⚽',
    season: [7, 8, 9, 10, 11, 0, 1, 2, 3, 4], // Aug-May
    peakMonth: 4, peakLabel: 'Championship',
    cost: 15, baseQ: 7.2, baseH: 7.0, peakBonus: 1.8,
  },
]
// Cost multipliers by station market
export const SPORTS_MARKET_COST_MULT = { local: 1.0, metro: 2.5, national: 6.0 }

// ─── STAFF (Directors of …) ──────────────────────────────────────────────────
// 5 roles. Personnel is the gate — until you hire one, you can't hire others.
// Quick search = always available (1 mo, $0.5M, Common-only).
// Normal search = unlocked via research (2 mo, $1M, up to Rare).
// Heavy search = unlocked via research (3 mo, $2M, up to Legendary).
export const STAFF_ROLES = [
  {
    id: 'personnel', label: 'Personnel Director', icon: '👔',
    desc: 'Required to hire any other director. Quick searches always available; better searches unlock more.',
  },
  {
    id: 'innovation', label: 'Innovation Director', icon: '🔬',
    desc: 'Speeds up and discounts research. Common −5%, Legendary −55% cost / −50% time.',
  },
  {
    id: 'operations', label: 'Operations Director', icon: '⚙️',
    desc: 'Lowers production cost on every show. Common −5%, Legendary −30%.',
  },
  {
    id: 'marketing', label: 'Marketing Director', icon: '📣',
    desc: 'Discounts marketing campaigns AND boosts their impact. Common −10% / +10% impact, Legendary −40% / +60% impact.',
  },
  {
    id: 'content', label: 'Content Director', icon: '🎨',
    desc: 'Permanent quality bonus on every show. Common +0.3, Legendary +1.2.',
  },
]

// Search tier definitions
export const STAFF_SEARCHES = [
  {
    id: 'quick',  label: 'Quick',  desc: 'Always available. 1 month. Finds Common only.',
    months: 1, cost: 0.5, maxTier: 'Common',
  },
  {
    id: 'normal', label: 'Normal', desc: 'Unlock via research. 2 months. Up to Rare.',
    months: 2, cost: 1.0, maxTier: 'Rare', requiresResearch: 'ops_search_normal',
  },
  {
    id: 'heavy',  label: 'Heavy',  desc: 'Unlock via research. 3 months. Up to Legendary.',
    months: 3, cost: 2.0, maxTier: 'Legendary', requiresResearch: 'ops_search_heavy',
  },
]

// Staff director per-month salary & tier discount tables
// Salary is per-month, paid each month (no upfront).
// Fire penalty: 3× one month's salary.
export const STAFF_SALARY_BY_TIER = {
  Common:    0.4,
  Uncommon:  0.9,
  Rare:      1.8,
  Epic:      3.5,
  Legendary: 6.5,
}
export const STAFF_FIRE_PENALTY_MULT = 3

// Aliases so engine can import nicer names
export const STAFF_MONTHLY_SALARY = STAFF_SALARY_BY_TIER
export const STAFF_FIRE_PENALTY = STAFF_FIRE_PENALTY_MULT
export const SEARCH_TIERS = [
  { id: 'quick',  label: 'Quick',  months: 1, cost: 0.5,  tierWeights: [1.0, 0, 0, 0, 0] },
  { id: 'normal', label: 'Normal', months: 2, cost: 1.0,  tierWeights: [0.35, 0.40, 0.20, 0.05, 0], requiresResearch: 'ops_search_normal' },
  { id: 'heavy',  label: 'Heavy',  months: 3, cost: 2.0,  tierWeights: [0.10, 0.20, 0.30, 0.25, 0.15], requiresResearch: 'ops_search_heavy' },
]

// Effect coefficients by role+tier
//   innovation: { cost: 0.95, months: 0.92 }  → multipliers on research
//   operations: { prodCost: 0.95 }            → mult on baseProductionCost
//   marketing:  { mktgCost: 0.90, mktgImpact: 1.10 }  → mult on cost, mult on hype
//   content:    { qBonus: 0.3 }              → flat quality additive
export const STAFF_EFFECTS = {
  innovation: {
    Common:    { cost: 0.95, months: 0.92 },
    Uncommon:  { cost: 0.85, months: 0.85 },
    Rare:      { cost: 0.75, months: 0.75 },
    Epic:      { cost: 0.60, months: 0.60 },
    Legendary: { cost: 0.45, months: 0.50 },
  },
  operations: {
    Common:    { prodCost: 0.95 },
    Uncommon:  { prodCost: 0.90 },
    Rare:      { prodCost: 0.85 },
    Epic:      { prodCost: 0.78 },
    Legendary: { prodCost: 0.70 },
  },
  marketing: {
    Common:    { mktgCost: 0.90, mktgImpact: 1.10 },
    Uncommon:  { mktgCost: 0.82, mktgImpact: 1.20 },
    Rare:      { mktgCost: 0.75, mktgImpact: 1.30 },
    Epic:      { mktgCost: 0.65, mktgImpact: 1.45 },
    Legendary: { mktgCost: 0.60, mktgImpact: 1.60 },
  },
  content: {
    Common:    { qBonus: 0.3 },
    Uncommon:  { qBonus: 0.5 },
    Rare:      { qBonus: 0.7 },
    Epic:      { qBonus: 0.95 },
    Legendary: { qBonus: 1.2 },
  },
  personnel: {
    // Personnel has no direct effects on shows — they just unlock other staff hires.
    Common:    {},
    Uncommon:  {},
    Rare:      {},
    Epic:      {},
    Legendary: {},
  },
}

// Name pool for randomly-generated staff candidates
export const STAFF_NAME_POOL = {
  first: ['Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Avery', 'Quinn', 'Cameron',
          'David', 'Sarah', 'Michael', 'Jessica', 'Robert', 'Linda', 'James', 'Patricia', 'Mary', 'John',
          'Karen', 'Rachel', 'Marcus', 'Elena', 'Diego', 'Priya', 'Yuki', 'Omar', 'Naomi', 'Ahmed'],
  last: ['Chen', 'Patel', 'Rodriguez', 'Smith', 'Garcia', 'Kim', 'Johnson', 'Brown', 'Davis', 'Miller',
         'Anderson', 'Wilson', 'Martinez', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright',
         'Lopez', 'Hill', 'Scott', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Phillips'],
}
export const STAFF_FIRST_NAMES = STAFF_NAME_POOL.first
export const STAFF_LAST_NAMES = STAFF_NAME_POOL.last

// ─── AUDIO / SUBTITLES / VIDEO QUALITY ───────────────────────────────────────
// 3 independent dimensions, 3 levels each. Better levels unlocked via research.
// Per-month cost added to show, quality + hype bonuses.
export const TECH_QUALITY = {
  audio: [
    { id: 'audio_mono',     label: 'Mono',           q: 0,    h: 0,   cost: 0,   requires: null },
    { id: 'audio_stereo',   label: 'Stereo',         q: 0.4,  h: 0.1, cost: 0.4, requires: 'tech_audio_stereo' },
    { id: 'audio_surround', label: 'Surround 5.1',   q: 0.9,  h: 0.3, cost: 1.0, requires: 'tech_audio_surround' },
  ],
  subtitles: [
    { id: 'subs_none',  label: 'No Subtitles',     q: 0,    h: 0,   cost: 0,   requires: null },
    { id: 'subs_basic', label: 'Basic Subtitles',  q: 0.3,  h: 0.05,cost: 0.3, requires: 'tech_subs_basic' },
    { id: 'subs_multi', label: 'Multilingual',     q: 0.7,  h: 0.2, cost: 0.8, requires: 'tech_subs_multi' },
  ],
  video: [
    { id: 'video_sd',  label: 'Standard Def',  q: 0,    h: 0,   cost: 0,   requires: null },
    { id: 'video_hd',  label: 'HD',            q: 0.6,  h: 0.3, cost: 0.6, requires: 'tech_video_hd' },
    { id: 'video_uhd', label: '4K UHD',        q: 1.2,  h: 0.5, cost: 1.5, requires: 'tech_video_uhd' },
  ],
}
export const AUDIO_TIERS    = TECH_QUALITY.audio
export const SUBTITLE_TIERS = TECH_QUALITY.subtitles
export const VIDEO_TIERS    = TECH_QUALITY.video

// ─── IP LICENSE TERMS ────────────────────────────────────────────────────────
// You now BUY an IP for 1/3/5 years (price scales with duration). After
// purchase, you can use it on any show for free during the term. Optional
// renewal at expiry.
export const IP_LICENSE_TERMS = [
  { id: '1y', years: 1, label: '1 year',  costMult: 1.0 },
  { id: '3y', years: 3, label: '3 years', costMult: 2.6 },
  { id: '5y', years: 5, label: '5 years', costMult: 4.0 },
]

// ─── NETWORK MARKETING CAMPAIGNS ─────────────────────────────────────────────
// Brand-level campaigns (not tied to a single show). Raise station fame
// AND give a small hype bump to every show airing this month.
export const NETWORK_CAMPAIGNS = [
  { id: 'small',   label: 'Local Buzz',         cost: 3,   fameGain: 0.6, hypeBoost: 0.1, desc: 'Local radio + billboards. Modest reach.' },
  { id: 'medium',  label: 'Regional Push',      cost: 9,   fameGain: 1.4, hypeBoost: 0.25, desc: 'Regional ads + media tour.' },
  { id: 'big',     label: 'National Campaign',  cost: 22,  fameGain: 2.8, hypeBoost: 0.5, desc: 'TV + print + digital across the country.' },
  { id: 'huge',    label: 'Brand Takeover',     cost: 50,  fameGain: 5.5, hypeBoost: 0.9, desc: 'Multi-channel saturation. Station-defining.' },
]

// ─── COMPETITOR SHOW NAME POOL ───────────────────────────────────────────────
// Used by the AI competitor sim to generate show names per category.
export const SHOW_NAME_POOL = {
  news: ['Morning Briefing', 'The Daily Wire', 'Wake Up America', 'Top of the Hour', 'Front Page Tonight', 'Beat Report', 'Newsline', 'World Update', 'Capital Report', 'Daybreak'],
  reality: ['House Wars', 'Survive the Island', 'The Bachelor Mansion', 'Real Lives', 'Singles Beach', 'Fame Quest', 'My Big Family', 'Catfight Bay', 'The Drama House', 'Truth or Dare'],
  series: ['Midnight Protocol', 'Crown of Ashes', 'The Westwing Files', 'Bay City Blues', 'Echoes', 'Hollow Crown', 'The Shoreline', 'Crossfire', 'Glass Houses', 'After Dark', 'Pioneers', 'Verdict'],
  latenight: ['Tonight with the Crew', 'After Midnight', 'The Late Lineup', 'Stand-Up Hour', 'Late Show Variety', 'Friday Bumpers', 'The Comedy Wire'],
  sports: ['Sports Wrap', 'Game Day Tonight', 'Score Center', 'Playmakers', 'The Sports Desk', 'Pre-Game Live'],
  family: ['Sunday Family Hour', 'Home & Hearth', 'The Family Variety', 'Wholesome Stories', 'Heartland Tales'],
  kids: ['Cartoon Express', 'Adventures of Bunny Bop', 'Robot Friends', 'Imagination Hour', 'Animal Pals', 'Storytime Castle', 'The Toy Box'],
  contest: ['Wheel of Cash', 'The Big Question', 'Beat the Clock', 'Trivia Bowl', 'Last Standing'],
}
