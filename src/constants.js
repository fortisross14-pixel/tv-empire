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
    cost_mult: 1.0,
    topics: [
      { id: 'live',     label: 'Live Game Coverage', q: 0.5, h: 1.0 },
      { id: 'analysis', label: 'Sports News / Analysis', q: 0.2, h: 0.3 },
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
    // Local market econ: rebalanced down ~35% from earlier values. The
    // previous numbers let players swim in cash by month 3 with mediocre
    // play. New floor encourages reinvestment and slower compounding.
    pop: 2.0, audCap: 1.6, revPerViewer: 3.5,
    fameThreshold: 0, nextFame: 25, famePerWin: 1.2, marketingMult: 0.6,
    // Every station has overhead even at local scale — power, transmission,
    // a skeleton crew. Local can't be free anymore.
    monthlyInfra: 1.5,
    prodCostMult: 0.7,
    promoteCost: 0,
  },
  metro: {
    id: 'metro', label: 'Tri-State Metro',
    desc: '20M people across the Northeast corridor. Real competition.',
    pop: 20, audCap: 12, revPerViewer: 5.0,
    fameThreshold: 25, nextFame: 60, famePerWin: 1.0, marketingMult: 1.0,
    // Operating at metro scale costs more. Studios, transmitters, bureaus.
    monthlyInfra: 4.0,
    prodCostMult: 1.25,
    // One-time cost to ascend FROM local TO this tier
    promoteCost: 40,
  },
  national: {
    id: 'national', label: 'National Network',
    desc: '380M Americans. The big leagues.',
    pop: 380, audCap: 90, revPerViewer: 7.5,
    fameThreshold: 60, nextFame: null, famePerWin: 0.7, marketingMult: 1.6,
    monthlyInfra: 9.0,
    prodCostMult: 1.6,
    promoteCost: 120,
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
  { id: 'none',    label: 'No Campaign',     cost: 0,    h: 0,   q: 0,   localOnly: false },
  { id: 'flyers',  label: 'Posters & Fliers',cost: 0.4,  h: 0.5, q: 0,   localOnly: true  },
  { id: 'online',  label: 'Online / Social', cost: 1.5,  h: 1.0, q: 0,   localOnly: false },
  { id: 'medium',  label: 'Standard Ads',    cost: 4,    h: 1.8, q: 0,   localOnly: false },
  { id: 'big',     label: 'TV+Radio+Print',  cost: 10,   h: 2.6, q: 0.2, localOnly: false },
  { id: 'massive', label: 'Disney-Scale',    cost: 28,   h: 3.8, q: 0.4, localOnly: false },
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
  // ── Expanded pool (stage AE) ──────────────────────────
  { id: 'd_maxinekerr_new', name: 'Maxine Kerr', specialty: 'news', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_bensokolov_new', name: 'Ben Sokolov', specialty: 'news', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.0 },
  { id: 'd_patricemwangi_new', name: 'Patrice Mwangi', specialty: 'news', tier: 'Uncommon', q: 0.6, h: 0.6, cost: 1.0 },
  { id: 'd_wolfblitzkin_new', name: 'Wolf Blitzkin', specialty: 'news', tier: 'Rare', q: 1.2, h: 0.9, cost: 2.5 },
  { id: 'd_nailahashemi_new', name: 'Naila Hashemi', specialty: 'news', tier: 'Rare', q: 1.3, h: 0.9, cost: 2.3 },
  { id: 'd_brianwilliamso_new', name: 'Brian Williamson', specialty: 'news', tier: 'Epic', q: 1.7, h: 1.5, cost: 5.0 },
  { id: 'd_marcusakingbad_new', name: 'Marcus Akingbade', specialty: 'news', tier: 'Epic', q: 1.5, h: 1.4, cost: 4.8 },
  { id: 'd_waltercrankrig_new', name: 'Walter Crankright', specialty: 'news', tier: 'Legendary', q: 2.1, h: 1.9, cost: 8.9 },
  { id: 'd_kylebronson_rea', name: 'Kyle Bronson', specialty: 'reality', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_jaxxonreed_rea', name: 'Jaxxon Reed', specialty: 'reality', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.1 },
  { id: 'd_adinapetrescu_rea', name: 'Adina Petrescu', specialty: 'reality', tier: 'Rare', q: 1.2, h: 0.9, cost: 2.3 },
  { id: 'd_reggietatum_rea', name: 'Reggie Tatum', specialty: 'reality', tier: 'Epic', q: 1.6, h: 1.6, cost: 4.9 },
  { id: 'd_miraantoniou_ser', name: 'Mira Antoniou', specialty: 'series', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_ceciliamarchet_ser', name: 'Cecilia Marchetti', specialty: 'series', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.0 },
  { id: 'd_ezrabauerle_ser', name: 'Ezra Bauerle', specialty: 'series', tier: 'Rare', q: 1.2, h: 0.8, cost: 2.4 },
  { id: 'd_damonlindelof_ser', name: 'Damon Lindelof', specialty: 'series', tier: 'Epic', q: 1.6, h: 1.4, cost: 5.3 },
  { id: 'd_bibiokonkwo_lat', name: 'Bibi Okonkwo', specialty: 'latenight', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_devonwhitaker_lat', name: 'Devon Whitaker', specialty: 'latenight', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.1 },
  { id: 'd_lilatan_lat', name: 'Lila Tan', specialty: 'latenight', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.0 },
  { id: 'd_conanobryant_lat', name: 'Conan O\'Bryant', specialty: 'latenight', tier: 'Rare', q: 1.2, h: 0.9, cost: 2.4 },
  { id: 'd_trixiemathers_lat', name: 'Trixie Mathers', specialty: 'latenight', tier: 'Rare', q: 1.2, h: 0.9, cost: 2.5 },
  { id: 'd_samanthabeeer_lat', name: 'Samantha Bee-er', specialty: 'latenight', tier: 'Epic', q: 1.5, h: 1.4, cost: 5.3 },
  { id: 'd_lolaiyengar_spo', name: 'Lola Iyengar', specialty: 'sports', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_hankcalloway_spo', name: 'Hank Calloway', specialty: 'sports', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.0 },
  { id: 'd_mercedesreyes_spo', name: 'Mercedes Reyes', specialty: 'sports', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.0 },
  { id: 'd_dextercheng_spo', name: 'Dexter Cheng', specialty: 'sports', tier: 'Rare', q: 1.1, h: 0.9, cost: 2.3 },
  { id: 'd_jemelehills_spo', name: 'Jemele Hills', specialty: 'sports', tier: 'Epic', q: 1.6, h: 1.5, cost: 5.3 },
  { id: 'd_pedromaldonado_fam', name: 'Pedro Maldonado', specialty: 'family', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_olivierbertran_fam', name: 'Olivier Bertrand', specialty: 'family', tier: 'Uncommon', q: 0.6, h: 0.6, cost: 1.0 },
  { id: 'd_natwexford_fam', name: 'Nat Wexford', specialty: 'family', tier: 'Rare', q: 1.2, h: 0.9, cost: 2.3 },
  { id: 'd_toshiyamazaki_fam', name: 'Toshi Yamazaki', specialty: 'family', tier: 'Epic', q: 1.7, h: 1.5, cost: 4.8 },
  { id: 'd_daisymcmillan_kid', name: 'Daisy McMillan', specialty: 'kids', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_meilinchao_kid', name: 'Mei-Lin Chao', specialty: 'kids', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.1 },
  { id: 'd_yukaonishi_kid', name: 'Yuka Onishi', specialty: 'kids', tier: 'Rare', q: 1.3, h: 0.9, cost: 2.4 },
  { id: 'd_wendellbrooks_kid', name: 'Wendell Brooks', specialty: 'kids', tier: 'Epic', q: 1.5, h: 1.4, cost: 4.8 },
  { id: 'd_brocktempleton_con', name: 'Brock Templeton', specialty: 'contest', tier: 'Common', q: 0.3, h: 0.2, cost: 0.3 },
  { id: 'd_quentinsato_con', name: 'Quentin Sato', specialty: 'contest', tier: 'Uncommon', q: 0.7, h: 0.6, cost: 1.0 },
  { id: 'd_maxineotieno_con', name: 'Maxine Otieno', specialty: 'contest', tier: 'Rare', q: 1.2, h: 0.9, cost: 2.2 },
  { id: 'd_padmalakshmin_con', name: 'Padma Lakshmin', specialty: 'contest', tier: 'Epic', q: 1.6, h: 1.5, cost: 5.0 },

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
  // ── Expanded pool (stage AE) ──────────────────────────
  { id: 's_sandyvance_new', name: 'Sandy Vance', specialty: 'news', tier: 'Common', q: 0.3, h: 0.4, cost: 0.3 },
  { id: 's_renatacho_new', name: 'Renata Cho', specialty: 'news', tier: 'Uncommon', q: 0.6, h: 0.9, cost: 1.0 },
  { id: 's_lianakarpov_new', name: 'Liana Karpov', specialty: 'news', tier: 'Rare', q: 1.0, h: 1.4, cost: 2.2 },
  { id: 's_soledadreyes_new', name: 'Soledad Reyes', specialty: 'news', tier: 'Epic', q: 1.5, h: 2.2, cost: 5.8 },
  { id: 's_ednamireles_new', name: 'Edna Mireles', specialty: 'news', tier: 'Legendary', q: 1.9, h: 3.1, cost: 10.8 },
  { id: 's_trentbeauregar_rea', name: 'Trent Beauregard', specialty: 'reality', tier: 'Common', q: 0.3, h: 0.4, cost: 0.3 },
  { id: 's_trevormcallist_rea', name: 'Trevor McAllister', specialty: 'reality', tier: 'Uncommon', q: 0.6, h: 0.9, cost: 1.0 },
  { id: 's_veroniquelasal_rea', name: 'Veronique LaSalle', specialty: 'reality', tier: 'Rare', q: 1.0, h: 1.6, cost: 2.4 },
  { id: 's_tylerdrake_rea', name: 'Tyler Drake', specialty: 'reality', tier: 'Epic', q: 1.5, h: 2.2, cost: 5.1 },
  { id: 's_ronaldobachelo_rea', name: 'Ronaldo Bachelor', specialty: 'reality', tier: 'Legendary', q: 2.0, h: 3.2, cost: 11.6 },
  { id: 's_reneewalsh_ser', name: 'Renee Walsh', specialty: 'series', tier: 'Common', q: 0.3, h: 0.4, cost: 0.3 },
  { id: 's_beatricevu_ser', name: 'Beatrice Vu', specialty: 'series', tier: 'Uncommon', q: 0.6, h: 1.0, cost: 1.0 },
  { id: 's_matilindqvist_ser', name: 'Mati Lindqvist', specialty: 'series', tier: 'Legendary', q: 2.1, h: 2.9, cost: 10.7 },
  { id: 's_jennafrye_lat', name: 'Jenna Frye', specialty: 'latenight', tier: 'Common', q: 0.3, h: 0.4, cost: 0.3 },
  { id: 's_sashapelletier_lat', name: 'Sasha Pelletier', specialty: 'latenight', tier: 'Uncommon', q: 0.6, h: 0.8, cost: 1.0 },
  { id: 's_wandasykesbeck_lat', name: 'Wanda Sykes-Beckett', specialty: 'latenight', tier: 'Rare', q: 1.0, h: 1.4, cost: 2.4 },
  { id: 's_amberruffinval_lat', name: 'Amber Ruffin-Vale', specialty: 'latenight', tier: 'Epic', q: 1.5, h: 2.1, cost: 5.2 },
  { id: 's_carsontonight_lat', name: 'Carson Tonight', specialty: 'latenight', tier: 'Legendary', q: 1.9, h: 3.2, cost: 11.6 },
  { id: 's_brendasallow_spo', name: 'Brenda Sallow', specialty: 'sports', tier: 'Common', q: 0.3, h: 0.4, cost: 0.3 },
  { id: 's_pitasalesi_spo', name: 'Pita Salesi', specialty: 'sports', tier: 'Uncommon', q: 0.6, h: 1.0, cost: 1.0 },
  { id: 's_lieslvanderber_spo', name: 'Liesl van der Berg', specialty: 'sports', tier: 'Rare', q: 1.0, h: 1.5, cost: 2.5 },
  { id: 's_erinandrewski_spo', name: 'Erin Andrewski', specialty: 'sports', tier: 'Epic', q: 1.5, h: 2.1, cost: 5.6 },
  { id: 's_vinscullys_spo', name: 'Vin Scullys', specialty: 'sports', tier: 'Legendary', q: 2.0, h: 3.1, cost: 10.6 },
  { id: 's_briantanmurray_fam', name: 'Brian Tan-Murray', specialty: 'family', tier: 'Uncommon', q: 0.6, h: 0.9, cost: 1.0 },
  { id: 's_elifriedlander_fam', name: 'Eli Friedlander', specialty: 'family', tier: 'Rare', q: 0.9, h: 1.4, cost: 2.4 },
  { id: 's_rileyparksumne_kid', name: 'Riley Park-Sumner', specialty: 'kids', tier: 'Common', q: 0.3, h: 0.4, cost: 0.3 },
  { id: 's_tesslockhart_kid', name: 'Tess Lockhart', specialty: 'kids', tier: 'Uncommon', q: 0.6, h: 1.0, cost: 1.0 },
  { id: 's_hazelwhitechap_kid', name: 'Hazel Whitechapel', specialty: 'kids', tier: 'Rare', q: 1.0, h: 1.5, cost: 2.6 },
  { id: 's_normhartling_kid', name: 'Norm Hartling', specialty: 'kids', tier: 'Epic', q: 1.3, h: 2.3, cost: 5.5 },
  { id: 's_henriettaspark_kid', name: 'Henrietta Sparkles', specialty: 'kids', tier: 'Legendary', q: 1.9, h: 3.1, cost: 10.8 },
  { id: 's_patsajaklite_con', name: 'Pat Sajak-Lite', specialty: 'contest', tier: 'Common', q: 0.3, h: 0.4, cost: 0.3 },
  { id: 's_dorisvandergri_con', name: 'Doris Vandergriff', specialty: 'contest', tier: 'Uncommon', q: 0.6, h: 0.9, cost: 1.0 },
  { id: 's_fridavespertin_con', name: 'Frida Vespertine', specialty: 'contest', tier: 'Rare', q: 0.9, h: 1.5, cost: 2.3 },
  { id: 's_alextrebung_con', name: 'Alex Trebung', specialty: 'contest', tier: 'Legendary', q: 2.0, h: 3.1, cost: 10.9 },

]

// ─── WRITERS POOL ────────────────────────────────────────────────────────────
// Writers create scripts (1 month to draft). Writers are PERMANENT-CONTRACT
// only — no fixed-length deals. `skill` is 0..1 and feeds script base quality
// & initial hype. Salary tiers: Legendary/Epic = $1.2M/mo, Rare/Uncommon =
// $0.6M/mo, Common = $0.3M/mo. `cost` is the monthly salary for the permanent
// hire (treat it like star.cost when building the contract record).
export const WRITERS = [
  // News writers
  { id: 'w_newsguru',     name: 'Aaron Sorking',       specialty: 'news',     tier: 'Legendary', skill: 0.85, cost: 1.2 },
  { id: 'w_newslead',     name: 'Megan Khoury',        specialty: 'news',     tier: 'Epic',      skill: 0.70, cost: 1.2 },
  { id: 'w_newsrare',     name: 'Daniel Park',         specialty: 'news',     tier: 'Rare',      skill: 0.55, cost: 0.6 },
  { id: 'w_newsuncomm',   name: 'Hannah Cole',         specialty: 'news',     tier: 'Uncommon',  skill: 0.40, cost: 0.6 },
  { id: 'w_newscomm',     name: 'Local Beat Writer',   specialty: 'news',     tier: 'Common',    skill: 0.25, cost: 0.3 },

  // Reality writers
  { id: 'w_realityguru',  name: 'Sasha Vandermeer',    specialty: 'reality',  tier: 'Legendary', skill: 0.80, cost: 1.2 },
  { id: 'w_realitylead',  name: 'Brock Steinman',      specialty: 'reality',  tier: 'Epic',      skill: 0.68, cost: 1.2 },
  { id: 'w_realityrare',  name: 'Quinn Reyes',         specialty: 'reality',  tier: 'Rare',      skill: 0.50, cost: 0.6 },
  { id: 'w_realityuncm',  name: 'Tara Bishop',         specialty: 'reality',  tier: 'Uncommon',  skill: 0.38, cost: 0.6 },
  { id: 'w_realitycomm',  name: 'Reality Stringer',    specialty: 'reality',  tier: 'Common',    skill: 0.22, cost: 0.3 },

  // Series writers (the prestige pool)
  { id: 'w_seriesgod1',   name: 'Vincent Galleria',    specialty: 'series',   tier: 'Legendary', skill: 0.95, cost: 1.2 },
  { id: 'w_seriesgod2',   name: 'Maya Lindqvist',      specialty: 'series',   tier: 'Legendary', skill: 0.90, cost: 1.2 },
  { id: 'w_serieslead1',  name: 'David Chen-Holloway', specialty: 'series',   tier: 'Epic',      skill: 0.75, cost: 1.2 },
  { id: 'w_serieslead2',  name: 'Priya Iyer',          specialty: 'series',   tier: 'Epic',      skill: 0.72, cost: 1.2 },
  { id: 'w_seriesrare',   name: 'Jake Morrison',       specialty: 'series',   tier: 'Rare',      skill: 0.55, cost: 0.6 },
  { id: 'w_seriesuncm',   name: 'Naomi Kessler',       specialty: 'series',   tier: 'Uncommon',  skill: 0.40, cost: 0.6 },
  { id: 'w_seriescomm',   name: 'Spec-Script Writer',  specialty: 'series',   tier: 'Common',    skill: 0.25, cost: 0.3 },

  // Late night writers
  { id: 'w_latelegend',   name: 'Conan Robbie',        specialty: 'latenight',tier: 'Legendary', skill: 0.82, cost: 1.2 },
  { id: 'w_lateepic',     name: 'Lorne Marshall',      specialty: 'latenight',tier: 'Epic',      skill: 0.70, cost: 1.2 },
  { id: 'w_laterare',     name: 'Tina Hsu',            specialty: 'latenight',tier: 'Rare',      skill: 0.52, cost: 0.6 },
  { id: 'w_latecomm',     name: 'Open-Mic Joker',      specialty: 'latenight',tier: 'Common',    skill: 0.25, cost: 0.3 },

  // Sports writers (for docs / analysis — live games don't need scripts)
  { id: 'w_sportslead',   name: 'Bill Simmonsen',      specialty: 'sports',   tier: 'Epic',      skill: 0.70, cost: 1.2 },
  { id: 'w_sportsrare',   name: 'Erika Donovan',       specialty: 'sports',   tier: 'Rare',      skill: 0.50, cost: 0.6 },
  { id: 'w_sportscomm',   name: 'Stat Sheet Reader',   specialty: 'sports',   tier: 'Common',    skill: 0.25, cost: 0.3 },

  // Family writers
  { id: 'w_familylegend', name: 'Bex Goldsmith',       specialty: 'family',   tier: 'Legendary', skill: 0.78, cost: 1.2 },
  { id: 'w_familyepic',   name: 'Rashid Petrov',       specialty: 'family',   tier: 'Epic',      skill: 0.65, cost: 1.2 },
  { id: 'w_familyrare',   name: 'Olivia Tran',         specialty: 'family',   tier: 'Rare',      skill: 0.48, cost: 0.6 },
  { id: 'w_familycomm',   name: 'Family Hour Writer',  specialty: 'family',   tier: 'Common',    skill: 0.22, cost: 0.3 },

  // Kids writers
  { id: 'w_kidslegend',   name: 'Mr. Rogerson',        specialty: 'kids',     tier: 'Legendary', skill: 0.80, cost: 1.2 },
  { id: 'w_kidsepic',     name: 'Tracy Bluebird',      specialty: 'kids',     tier: 'Epic',      skill: 0.65, cost: 1.2 },
  { id: 'w_kidsrare',     name: 'Marcus Lin',          specialty: 'kids',     tier: 'Rare',      skill: 0.48, cost: 0.6 },
  { id: 'w_kidsuncm',     name: 'Puppet-Show Scribe',  specialty: 'kids',     tier: 'Uncommon',  skill: 0.35, cost: 0.6 },
  { id: 'w_kidscomm',     name: 'Cartoon Junior',      specialty: 'kids',     tier: 'Common',    skill: 0.22, cost: 0.3 },

  // Contest writers
  { id: 'w_contestlead',  name: 'Heidi Klamm',         specialty: 'contest',  tier: 'Epic',      skill: 0.68, cost: 1.2 },
  { id: 'w_contestrare',  name: 'Wally Tendulkar',     specialty: 'contest',  tier: 'Rare',      skill: 0.50, cost: 0.6 },
  { id: 'w_contestcomm',  name: 'Game-Show Hack',      specialty: 'contest',  tier: 'Common',    skill: 0.22, cost: 0.3 },
  // ── Expanded pool (stage AE) ──────────────────────────
  { id: 'w_victrillo_new', name: 'Vic Trillo', specialty: 'news', tier: 'Common', skill: 0.30, cost: 0.3 },
  { id: 'w_diegovelasco_new', name: 'Diego Velasco', specialty: 'news', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_jorgeramosvega_new', name: 'Jorge Ramos-Vega', specialty: 'news', tier: 'Rare', skill: 0.60, cost: 0.6 },
  { id: 'w_gretalindgren_new', name: 'Greta Lindgren', specialty: 'news', tier: 'Epic', skill: 0.70, cost: 1.2 },
  { id: 'w_heathervesper_rea', name: 'Heather Vesper', specialty: 'reality', tier: 'Common', skill: 0.20, cost: 0.3 },
  { id: 'w_indigosands_rea', name: 'Indigo Sands', specialty: 'reality', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_crispinvale_rea', name: 'Crispin Vale', specialty: 'reality', tier: 'Rare', skill: 0.50, cost: 0.6 },
  { id: 'w_astridvolkov_rea', name: 'Astrid Volkov', specialty: 'reality', tier: 'Epic', skill: 0.60, cost: 1.1 },
  { id: 'w_ottovogel_ser', name: 'Otto Vogel', specialty: 'series', tier: 'Common', skill: 0.20, cost: 0.3 },
  { id: 'w_henrikdahl_ser', name: 'Henrik Dahl', specialty: 'series', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_imaniolatunji_ser', name: 'Imani Olatunji', specialty: 'series', tier: 'Rare', skill: 0.60, cost: 0.6 },
  { id: 'w_phoebewallercr_ser', name: 'Phoebe Waller-Cross', specialty: 'series', tier: 'Epic', skill: 0.70, cost: 1.2 },
  { id: 'w_charliemarin_lat', name: 'Charlie Marin', specialty: 'latenight', tier: 'Common', skill: 0.20, cost: 0.3 },
  { id: 'w_karimboudjema_lat', name: 'Karim Boudjema', specialty: 'latenight', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_hasanminhajan_lat', name: 'Hasan Minhajan', specialty: 'latenight', tier: 'Rare', skill: 0.50, cost: 0.6 },
  { id: 'w_trevornoahz_lat', name: 'Trevor Noahz', specialty: 'latenight', tier: 'Epic', skill: 0.70, cost: 1.2 },
  { id: 'w_damontritt_spo', name: 'Damon Tritt', specialty: 'sports', tier: 'Common', skill: 0.20, cost: 0.3 },
  { id: 'w_dontayhenson_spo', name: 'Dontay Henson', specialty: 'sports', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_kobiwatanabe_spo', name: 'Kobi Watanabe', specialty: 'sports', tier: 'Rare', skill: 0.50, cost: 0.6 },
  { id: 'w_ianeaglesong_spo', name: 'Ian Eaglesong', specialty: 'sports', tier: 'Epic', skill: 0.70, cost: 1.2 },
  { id: 'w_karenwei_fam', name: 'Karen Wei', specialty: 'family', tier: 'Common', skill: 0.20, cost: 0.3 },
  { id: 'w_sagehopkins_fam', name: 'Sage Hopkins', specialty: 'family', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_mayaokafor_fam', name: 'Maya Okafor', specialty: 'family', tier: 'Rare', skill: 0.50, cost: 0.6 },
  { id: 'w_lindakavanagh_fam', name: 'Linda Kavanagh', specialty: 'family', tier: 'Epic', skill: 0.70, cost: 1.1 },
  { id: 'w_bingovasquez_kid', name: 'Bingo Vasquez', specialty: 'kids', tier: 'Common', skill: 0.20, cost: 0.3 },
  { id: 'w_wesleyakingbad_kid', name: 'Wesley Akingbade', specialty: 'kids', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_theoschreiber_kid', name: 'Theo Schreiber', specialty: 'kids', tier: 'Rare', skill: 0.60, cost: 0.6 },
  { id: 'w_sunnykapoor_kid', name: 'Sunny Kapoor', specialty: 'kids', tier: 'Epic', skill: 0.70, cost: 1.3 },
  { id: 'w_hattieyoon_con', name: 'Hattie Yoon', specialty: 'contest', tier: 'Common', skill: 0.30, cost: 0.3 },
  { id: 'w_julesmarceau_con', name: 'Jules Marceau', specialty: 'contest', tier: 'Uncommon', skill: 0.40, cost: 0.6 },
  { id: 'w_raybonaventura_con', name: 'Ray Bonaventura', specialty: 'contest', tier: 'Rare', skill: 0.50, cost: 0.6 },
  { id: 'w_drewcareylane_con', name: 'Drew Carey-Lane', specialty: 'contest', tier: 'Epic', skill: 0.70, cost: 1.3 },

]

// Cap on simultaneously-employed writers. New game starts with 1 free writer.
export const WRITERS_CAP = 10

// Hype decay multiplier each time a script is used to produce a program.
export const SCRIPT_HYPE_DECAY = 0.80

// Hype clamp
export const SCRIPT_HYPE_MIN = 5
export const SCRIPT_HYPE_MAX = 100

// ─── PRODUCTION DESIGN TIERS ─────────────────────────────────────────────────
// Each program build picks ONE prod-design tier. Affinity per category determines
// quality bonus or penalty. Cost is paid as part of production.
export const PROD_DESIGN_TIERS = [
  {
    id: 'pd_realnormal',
    label: 'Real World Normal',
    desc: 'Existing locations, minimal redress. Cheap and authentic.',
    cost: 0.4,            // M, applied per production cycle
    qBonus: 0.0,
    prefers: ['news', 'reality', 'sports'],     // good fit → +0.6 quality, +0.4 hype
    dislikes: ['series', 'family'],             // bad fit → -0.4 quality, +25% cost
  },
  {
    id: 'pd_realluxury',
    label: 'Real World Luxury',
    desc: 'High-end locations, premium dressing, careful lighting.',
    cost: 2.0,
    qBonus: 0.4,
    prefers: ['series', 'latenight', 'family'],
    dislikes: ['kids', 'reality'],
  },
  {
    id: 'pd_adhoc',
    label: 'Ad-Hoc Design',
    desc: 'Custom-built sets, controlled environment, full creative freedom.',
    cost: 5.5,
    qBonus: 0.7,
    prefers: ['series', 'family', 'kids', 'contest'],
    dislikes: ['news', 'sports'],
    minScriptTier: 'large',
  },
]

// ─── SFX TIERS ───────────────────────────────────────────────────────────────
export const SFX_TIERS = [
  {
    id: 'sfx_none',
    label: 'None',
    desc: 'No special effects. Practical only.',
    cost: 0,
    qBonus: 0,
    prefers: ['news', 'latenight', 'sports'],
    dislikes: [],
  },
  {
    id: 'sfx_punctual',
    label: 'Punctual',
    desc: 'Selective effects for emphasis. Tasteful, restrained.',
    cost: 1.5,
    qBonus: 0.3,
    prefers: ['series', 'reality', 'family', 'contest'],
    dislikes: ['news'],
  },
  {
    id: 'sfx_heavy',
    label: 'Heavy',
    desc: 'Spectacle-driven, CGI-forward, big set pieces.',
    cost: 5.0,
    qBonus: 0.6,
    prefers: ['series', 'family', 'kids'],
    dislikes: ['news', 'latenight', 'reality'],
    minScriptTier: 'large',
    requires: 'tech_sfx_heavy',
  },
]

// Quality / cost penalty/bonus modifiers per affinity outcome
export const AFFINITY_GOOD_Q = 0.6
export const AFFINITY_GOOD_H = 0.4
export const AFFINITY_BAD_Q  = -0.4
export const AFFINITY_BAD_COST_MULT = 1.25
export const AFFINITY_NORMAL_Q = 0
export const AFFINITY_NORMAL_H = 0

// ─── PRODUCTION METHOD per content type ──────────────────────────────────────
// Determines program build timing & cost flow.
//   - 'instant'    → movies. No script. Ready next tick after editing cost.
//   - 'live'       → news, sports, contest. 1 mo prep + live cost each airing.
//   - 'preproduced'→ series, reality, latenight, family, kids. Production runs
//                    for ceil(airingMonths/2), min 1. Full prod cost paid
//                    upfront. Transmission cost during airing is cheap.
export const PRODUCTION_METHODS = {
  news:      'live',
  sports:    'live',
  contest:   'live',
  series:    'preproduced',
  reality:   'preproduced',
  latenight: 'preproduced',
  family:    'preproduced',
  kids:      'preproduced',
  // movies are instant — handled by special case (no categoryId at build)
}

// Cost split — fraction of full programCost that becomes the live/airing recurring cost
// for live-method content vs prep cost.
export const LIVE_PREP_FRACTION    = 0.25  // prep paid once at build start
export const LIVE_AIRING_FRACTION  = 0.75  // split evenly across each airing
// For preproduced content: full cost paid upfront. Transmission cost during airing:
export const PREPRODUCED_TRANSMISSION_FRACTION = 0.10  // very cheap to air after prod done
// For movies (instant): the upfront editing/distribution cost
export const MOVIE_EDITING_FRACTION = 1.00 // movies have a flat cost — full upfront

// Estimation range shown during build (true Q/H is hidden until first airing)
export const ESTIMATION_RANGE = 0.08   // ±8%

// ─── MUSIC TIERS ─────────────────────────────────────────────────────────────
// Music drives ART quality strongly and gives a small NARRATIVE bump (mood,
// pacing). No category affinity — it's a pure quality boost that scales with
// cost.
export const MUSIC_TIERS = [
  {
    id: 'mus_basic',
    label: 'Basic Melodies',
    desc: 'Stock loops and simple cues. Functional, forgettable.',
    cost: 0,
    artBonus: 0,
    narrativeBonus: 0,
  },
  {
    id: 'mus_existing',
    label: 'Existing Music',
    desc: 'License recognizable tracks. Adds character and recall.',
    cost: 1.0,
    artBonus: 0.8,
    narrativeBonus: 0.3,
  },
  {
    id: 'mus_composer',
    label: 'Hire Composer / Band',
    desc: 'Original score commissioned for the program. Distinctive identity.',
    cost: 4.0,
    artBonus: 2.0,
    narrativeBonus: 0.6,
  },
]

// ─── QUALITY COMPONENT WEIGHTS PER CATEGORY ──────────────────────────────────
// Each category weighs the four quality components differently. Weights sum
// to 1.0 so the final quality stays in 0..10.
// Components: narrative, art, innovation, technical.
export const CATEGORY_QUALITY_WEIGHTS = {
  news:      { narrative: 0.50, art: 0.10, innovation: 0.15, technical: 0.25 },
  sports:    { narrative: 0.15, art: 0.15, innovation: 0.35, technical: 0.35 },
  contest:   { narrative: 0.20, art: 0.20, innovation: 0.45, technical: 0.15 },
  reality:   { narrative: 0.30, art: 0.25, innovation: 0.35, technical: 0.10 },
  series:    { narrative: 0.45, art: 0.30, innovation: 0.15, technical: 0.10 },
  latenight: { narrative: 0.40, art: 0.20, innovation: 0.30, technical: 0.10 },
  family:    { narrative: 0.35, art: 0.35, innovation: 0.20, technical: 0.10 },
  kids:      { narrative: 0.40, art: 0.40, innovation: 0.15, technical: 0.05 },
  // movie path doesn't use component breakdown for review purposes (movies
  // skip reviews) but a fallback weight is still useful.
  movie:     { narrative: 0.35, art: 0.30, innovation: 0.15, technical: 0.20 },
}

// ─── REVIEWER OUTLETS ────────────────────────────────────────────────────────
// Each new program gets THREE reviews when it first airs — one per outlet.
// Each outlet specializes in scoring a specific component of the show:
//   tech-mag      → technical
//   script-pod    → narrative
//   art-quarterly → art (with a touch of innovation)
//
// Each outlet has a `lines` pool keyed by score band (0..10). When a review is
// generated we pick a random line from the band that matches the score.
//
// The aggregate score = avg of the three reviewer scores, which closely tracks
// the program's overall rating. A verdict label is attached based on aggregate.
//
// Banding (used for both line selection and verdict):
//   0-3   FLOP        red
//   3-5   SOFT        muted
//   5-7   SOLID       accent
//   7-8.5 HIT         green
//   8.5+  BLOCKBUSTER gold
export const REVIEW_OUTLETS = [
  {
    id: 'tech',
    name: 'TV Technology Magazine',
    icon: '📺',
    scoreFrom: (c) => c.technical,  // 0..10
    description: 'Production tech, audio, visual quality, post-production polish.',
    lines: {
      flop: [
        'Embarrassing technical execution. The mics audibly clip in the cold open.',
        'Looks like it was edited on a dare. Every other cut is a sin.',
        'Audio mix is unforgivable. Couldn\'t finish the pilot.',
        'A masterclass in how NOT to produce television.',
      ],
      soft: [
        'Improvable and basic technology. The gear is fine — the craft isn\'t.',
        'Watchable but rough. Color grading reads like an afterthought.',
        'Production values stuck somewhere around 2009.',
        'Sound design is doing the bare minimum, and you can tell.',
      ],
      solid: [
        'Solid TV technology. Nothing flashy, but it never breaks the spell.',
        'Production is competent throughout — clean image, decent mix.',
        'No shame in the tech here. Just don\'t expect spectacle.',
        'Workmanlike production. Gets the job done without showing off.',
      ],
      hit: [
        'Production values you can feel. The audio mix alone elevates this.',
        'Technically polished — cinematography and sound are in lockstep.',
        'High-end production craft. The grade and mix sing.',
        'A genuine technical achievement for the budget bracket.',
      ],
      blockbuster: [
        'Reference-grade production. Every department firing at maximum.',
        'A technical marvel. They built the future of TV production here.',
        'Best-in-class craft across every technical metric we track.',
        'The most polished broadcast we\'ve reviewed all year.',
      ],
    },
  },
  {
    id: 'script',
    name: 'Scriptwriting Podcast',
    icon: '🎙',
    scoreFrom: (c) => c.narrative,
    description: 'Story structure, dialogue, characters, thematic depth.',
    lines: {
      flop: [
        'The script is incoherent. No structure, no characters worth caring about.',
        'Dialogue so wooden you can hear the splinters.',
        'A first draft that nobody had the heart to revise.',
        'Plot holes you could drive a Mack truck through. And it\'s still boring.',
      ],
      soft: [
        'Improvable script — the bones are there but the meat is missing.',
        'Average writing. Hits expected beats, never deeper.',
        'You can tell the writers\' room ran out of time on act two.',
        'Forgettable dialogue, predictable arcs.',
      ],
      solid: [
        'Decent script. The structure holds together; the characters mostly do too.',
        'Solid writing. Doesn\'t reinvent anything but doesn\'t need to.',
        'Workmanlike storytelling. Sturdy bones, no surprises.',
        'A competent script that knows what it\'s doing.',
      ],
      hit: [
        'Very good script — deep and relevant. Lines you\'ll quote.',
        'Real craft in the writing. Character work is genuinely affecting.',
        'A confident, well-structured story. The themes land.',
        'Writing this thoughtful is rare. Worth the watch on script alone.',
      ],
      blockbuster: [
        'Landmark writing. Future writers\' rooms will study this.',
        'A near-perfect screenplay. Every line earns its place.',
        'The kind of script that makes you fall in love with TV all over again.',
        'Generational writing. We\'ll be talking about this script for years.',
      ],
    },
  },
  {
    id: 'art',
    name: 'Art & Direction Quarterly',
    icon: '🎨',
    scoreFrom: (c) => (c.art * 0.7) + (c.innovation * 0.3),
    description: 'Visual style, art direction, originality, world-building.',
    lines: {
      flop: [
        'Visually inert. The art department seemingly didn\'t show up.',
        'No style, no vision, no point of view. Just frames.',
        'Generic to a fault. Could be any other show on any other network.',
        'Acceptable, can tell art was not a priority for this production. Painful, actually.',
      ],
      soft: [
        'Acceptable — can tell art was not a priority for this production.',
        'Functional visuals, nothing more. The composition rarely surprises.',
        'Set design that screams "we had a budget but no taste."',
        'Forgettable look. The show is over before the visuals register.',
      ],
      solid: [
        'A pleasant visual identity. Nothing radical but never ugly.',
        'Solid art direction. The world feels lived-in.',
        'Honest craft in the design — restrained but considered.',
        'Reliable visual storytelling. The look serves the story.',
      ],
      hit: [
        'Beautifully composed. Frame-by-frame, this is a real production.',
        'Bold visual choices. The art direction is its own character.',
        'A distinct, confident style. Every department in dialogue.',
        'Striking and original. The kind of show you\'ll recognize in stills.',
      ],
      blockbuster: [
        'A visual landmark. The art direction alone justifies the budget.',
        'Every frame a painting. Director and DP at the peak of their powers.',
        'Cinema-grade visuals on a TV schedule. Astonishing.',
        'The most beautiful production we\'ve seen this year, hands down.',
      ],
    },
  },
]

/** Pick a band id for a 0..10 score. */
export function scoreBand(score) {
  if (score >= 8.5) return 'blockbuster'
  if (score >= 7.0) return 'hit'
  if (score >= 5.0) return 'solid'
  if (score >= 3.0) return 'soft'
  return 'flop'
}

/** Verdict labels — same banding as score lines, used on aggregate. */
export const VERDICT_LABELS = {
  blockbuster: { label: 'BLOCKBUSTER', tone: 'gold' },
  hit:         { label: 'HIT',         tone: 'green' },
  solid:       { label: 'SOLID',       tone: 'accent' },
  soft:        { label: 'SOFT',        tone: 'muted' },
  flop:        { label: 'FLOP',        tone: 'red' },
}

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
// ─── MOVIE PACKS ─────────────────────────────────────────────────────────────
// Each entry is a *pack* of films you license as a unit. A pack has a number
// of airings (packSize, default 3) you can use before it's exhausted. After
// the last airing the pack is consumed and goes back to the catalog. If you
// re-buy a consumed pack within 12 months, its hype is reduced (overexposure).
//
// q/h are pack-level — the same numbers apply to every airing from the pack.
// Movie pack catalog. Packs come in three sizes — 6, 9, or 12 airings —
// chosen by tone and breadth of appeal: prestige and niche packs are small
// (you don't binge-air an indie drama), while action/genre/filler packs are
// large (cheap per-movie, lots of slot-filling potential).
//
// Pack cost scales non-linearly: a 12-movie pack costs more than a 6-movie
// pack of the same tier, but the per-movie price drops by ~30% over that
// range. Encourages players to buy bigger packs when they have the cash to
// commit, while small packs stay accessible for variety.
//
// Cost formula reference (rough): Rare tier ~$1.50/movie at pack-6,
// $1.20/movie at pack-9, $1.00/movie at pack-12. Halve for Uncommon, etc.
//
// Scheduling: when a movie program is sent to a slot, the player picks
// "Full Pack" (commits to all remaining airings in one run, then the slot
// frees) or "Just 1 Movie" (single-airing run; legacy behavior).
export const MOVIES = [
  // ── LEGENDARY (premium tentpole movies) ──
  { id: 'mv_titanic',    name: 'Titanic Returns Pack',    tier: 'Legendary', q: 9.0, h: 8.5, cost: 36,  packSize: 6  },
  { id: 'mv_avatar',     name: 'Avatar Trilogy Pack',     tier: 'Legendary', q: 8.5, h: 9.0, cost: 38,  packSize: 6  },
  { id: 'mv_dinos',      name: 'Dinosaur Park Pack',      tier: 'Legendary', q: 8.2, h: 9.2, cost: 52,  packSize: 9  },
  { id: 'mv_bondish',    name: 'Spy Thriller Pack',       tier: 'Legendary', q: 8.5, h: 8.8, cost: 36,  packSize: 6  },

  // ── EPIC (prestige + culturally large) ──
  { id: 'mv_oppen',      name: 'Atomicore Pack',          tier: 'Epic',      q: 9.0, h: 7.0, cost: 22,  packSize: 6  },
  { id: 'mv_barbie',     name: 'Doll House Pack',         tier: 'Epic',      q: 7.5, h: 8.5, cost: 20,  packSize: 6  },
  { id: 'mv_inception',  name: 'Dream Layers Pack',       tier: 'Epic',      q: 8.5, h: 7.5, cost: 20,  packSize: 6  },
  { id: 'mv_warEpic',    name: 'Battlefield Epics Pack',  tier: 'Epic',      q: 8.0, h: 7.2, cost: 20,  packSize: 6  },
  { id: 'mv_disasterB',  name: 'Disaster Blockbuster Pack', tier: 'Epic',    q: 7.0, h: 8.2, cost: 19,  packSize: 6  },

  // ── RARE (genre crowd-pleasers — bigger packs for filler value) ──
  { id: 'mv_marvel1',    name: 'Heroes Unite Pack',       tier: 'Rare',      q: 7.0, h: 7.5, cost: 12,  packSize: 12 },
  { id: 'mv_pixar',      name: 'Animated Adventure Pack', tier: 'Rare',      q: 8.0, h: 6.5, cost: 11,  packSize: 9  },
  { id: 'mv_horror1',    name: 'Cabin Screams Pack',      tier: 'Rare',      q: 6.5, h: 7.0, cost: 12,  packSize: 12 },
  { id: 'mv_action1',    name: 'Fast & Loud Pack',        tier: 'Rare',      q: 6.0, h: 7.5, cost: 12,  packSize: 12 },
  { id: 'mv_kungfu',     name: 'Martial Arts Cinema Pack',tier: 'Rare',      q: 7.2, h: 6.8, cost: 11,  packSize: 9  },
  { id: 'mv_heist',      name: 'Big Heist Pack',          tier: 'Rare',      q: 7.0, h: 7.0, cost: 11,  packSize: 9  },
  { id: 'mv_holiday',    name: 'Holiday Classics Pack',   tier: 'Rare',      q: 6.8, h: 7.4, cost: 12,  packSize: 12 },

  // ── UNCOMMON (festival + niche — small packs by design) ──
  { id: 'mv_indie1',     name: 'Sundance Darling Pack',   tier: 'Uncommon',  q: 7.5, h: 4.5, cost: 3.6, packSize: 6  },
  { id: 'mv_romcom1',    name: 'Coffee Shop Romance Pack',tier: 'Uncommon',  q: 6.0, h: 5.5, cost: 3.6, packSize: 6  },
  { id: 'mv_90sromcom',  name: "90s Rom-Com Revival Pack",tier: 'Uncommon',  q: 6.2, h: 5.8, cost: 3.6, packSize: 6  },
  { id: 'mv_indieDrama', name: 'Indie Drama Pack',        tier: 'Uncommon',  q: 7.8, h: 3.8, cost: 3.6, packSize: 6  },
  { id: 'mv_docfilm',    name: 'Documentary Pack',        tier: 'Uncommon',  q: 7.0, h: 4.0, cost: 3.2, packSize: 6  },
  { id: 'mv_foreign',    name: 'Foreign Cinema Pack',     tier: 'Uncommon',  q: 7.5, h: 3.5, cost: 3.0, packSize: 6  },

  // ── COMMON (filler / late-night — large packs, cheap-per-airing) ──
  { id: 'mv_oldclassic', name: 'Classic Hollywood Pack',  tier: 'Common',    q: 6.5, h: 4.0, cost: 2.2, packSize: 9  },
  { id: 'mv_western',    name: 'Spaghetti Western Pack',  tier: 'Common',    q: 6.2, h: 4.2, cost: 2.2, packSize: 9  },
  { id: 'mv_creature',   name: 'Creature Feature Pack',   tier: 'Common',    q: 4.8, h: 4.5, cost: 2.5, packSize: 12 },
  { id: 'mv_btv1',       name: 'B-Movie Saturday Pack',   tier: 'Common',    q: 4.5, h: 4.0, cost: 2.5, packSize: 12 },
  { id: 'mv_btv2',       name: 'Direct-to-Video Pack',    tier: 'Common',    q: 4.0, h: 3.5, cost: 2.4, packSize: 12 },
  { id: 'mv_madeForTV',  name: 'Made-for-TV Movie Pack',  tier: 'Common',    q: 4.2, h: 3.8, cost: 2.5, packSize: 12 },
]

// Hype penalty applied when a pack is re-bought within MOVIE_PACK_COOLDOWN_MONTHS
// of its previous consumption. After cooldown, full hype is restored.
export const MOVIE_PACK_REBUY_HYPE_PENALTY = 0.40   // −40% hype
export const MOVIE_PACK_COOLDOWN_MONTHS    = 12

// ─── SCRIPT TIERS ────────────────────────────────────────────────────────────
// Scripts come in three flavors. Normal is the always-available default;
// large and super are unlocked via research that requires the metro / national
// market tier respectively. Bigger tiers cost more, take longer, but produce
// scripts with higher quality/hype caps AND unlock richer production options.
//
// Stat caps clamp the rolled (baseQuality, originalHype) at script-completion
// time. A normal script will never exceed Q 7 or H 70 — even with a top
// writer + Legendary IP — so super scripts produce genuinely better content.
//
// Production-side gates: tiers on PROD_DESIGN_TIERS, SFX_TIERS, VIDEO_TIERS,
// SUBTITLE_TIERS that have `minScriptTier` set require the script's tier to
// match or exceed. The "2 stars" mechanic is a super-only feature handled in
// production state directly.
export const SCRIPT_TIERS = [
  {
    id: 'normal',
    label: 'Normal',
    desc: '1-month write. Standard production envelope. Available from day one.',
    months: 1,
    costMult: 1.0,           // ×writer salary
    qCap: 7.0,
    hCap: 70,                // hype is on 0..100 scale
    requiresResearch: null,
    requiresMarket: null,
  },
  {
    id: 'large',
    label: 'Large',
    desc: '2-month write. Unlocks top-tier production design, 4K video, multi-lang subs, heavy SFX. Up to 8.5 quality.',
    months: 2,
    costMult: 2.0,
    qCap: 8.5,
    hCap: 85,
    requiresResearch: 'script_large',
    requiresMarket: 'metro',
  },
  {
    id: 'super',
    label: 'Super',
    desc: '2-month write. Everything Large has, plus cast TWO stars. Up to 10 quality. Required for Legendary stars.',
    months: 2,
    costMult: 4.0,
    qCap: 10.0,
    hCap: 100,
    requiresResearch: 'script_super',
    requiresMarket: 'national',
  },
]

export const findScriptTier = id => SCRIPT_TIERS.find(t => t.id === id) || SCRIPT_TIERS[0]

// Ranking: which tiers does this tier "satisfy" for gating purposes?
// super >= large >= normal. Used to compare production-option requirements.
export const SCRIPT_TIER_RANK = { normal: 0, large: 1, super: 2 }

// Star tier requirements per script tier. A script of tier T can use a star
// up to the highest STAR_TIER_MAX_FOR_SCRIPT[T] tier. Above that → locked.
export const STAR_TIER_MAX_FOR_SCRIPT = {
  normal: ['Common', 'Uncommon', 'Rare'],          // No Epic / Legendary
  large:  ['Common', 'Uncommon', 'Rare', 'Epic'],  // No Legendary
  super:  ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
}

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
    // Local versions of the Big 4. Each fills ALL of the player's default
    // slots so slot-leader achievements can fire from day 1 and the player
    // never sees a "ghost slot" where no one is airing. New slots the player
    // opens later (beyond DEFAULT_SLOT_IDS) only have 1-2 competitors in them.
    {
      id: 'local_kbc',    name: 'KBC Riverside',     tier: 'big4',
      strength: 0.85,     startCash: 50, startFame: 22,
      focusCats: ['news', 'series', 'reality'],
      slotTypeIds: ['morning', 'evening', 'prime', 'weekend_morning', 'weekend_prime'],
    },
    {
      id: 'local_kfb',    name: 'KFB Channel 4',     tier: 'big4',
      strength: 0.80,     startCash: 45, startFame: 18,
      focusCats: ['series', 'reality', 'movie'],
      slotTypeIds: ['morning', 'evening', 'prime', 'weekend_morning', 'weekend_prime'],
    },
    {
      id: 'local_kab',    name: 'KAB News 7',        tier: 'big4',
      strength: 0.75,     startCash: 40, startFame: 16,
      focusCats: ['news', 'family', 'movie'],
      slotTypeIds: ['morning', 'evening', 'prime', 'weekend_morning', 'weekend_prime'],
    },
    {
      id: 'local_kcb',    name: 'KCB Network',       tier: 'big4',
      strength: 0.70,     startCash: 38, startFame: 14,
      focusCats: ['reality', 'sports', 'series'],
      slotTypeIds: ['morning', 'evening', 'prime', 'weekend_morning', 'weekend_prime'],
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
// VP of Innovation discounts both `cost` and `months` (the better the
// VP, the deeper the discount).
//   no VP:         1.00x cost, 1.00x months
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
  {
    id: 'tech_sfx_heavy', group: 'tech', domain: 'sfx',
    label: 'Heavy SFX Pipeline', icon: '💥',
    desc: 'Unlock Heavy SFX option in production. Cinematic spectacle. Requires Director of Technology Innovation.',
    cost: 22, months: 6,
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
    desc: '−25% on all marketing campaign costs (stacks with VP of Marketing).',
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
  {
    id: 'script_large', group: 'ops',
    label: 'Large Script Format', icon: '📝',
    desc: 'Unlock large-format scripts (2 mo write). Higher caps + access to top-tier production (4K, multilingual subs, heavy SFX, ad-hoc design). Requires Metro market.',
    cost: 12, months: 4,
    requiresMarket: 'metro',
    effect: { unlockScriptTier: 'large' },
  },
  {
    id: 'script_super', group: 'ops',
    label: 'Super Script Format', icon: '🏆',
    desc: 'Unlock super-format scripts (2 mo write). Highest caps; cast TWO stars; required for Legendary stars. Requires National market + Large Script Format.',
    cost: 30, months: 6,
    requires: ['script_large'],
    requiresMarket: 'national',
    effect: { unlockScriptTier: 'super' },
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
    // Sports news/analysis is a starter category for everyone — gives you a
    // way to put sports content on the air without buying a (very expensive)
    // league license. Live game coverage still requires owning rights.
    ['sports', 'analysis'],
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
// Sports leagues.
// `cost` is the base annual license cost — multiplied by SPORTS_MARKET_COST_MULT
// based on which market you're broadcasting from. The big pro leagues are
// genuinely expensive — they should feel like a major capital commitment.
//
// `fameOnSign` — fame granted to the station the moment the license is signed.
// This is how big sports rights help you compete with established networks.
// Olympics and World Cup are the biggest (you become a household name just by
// having them); pros are substantial; college and regional are modest.
//
// Optional `yearAvailable(year)` — predicate that gates the league by year.
// Olympics happen in Y4/8/12/...; World Cup in Y2/6/10/... When absent the
// league is available every year.
//
// Optional `marketHypeMult: { local, metro, national }` (default 1.0 everywhere)
// scales the league's base hype by market. College sports and local sports
// run hot in their home markets but underperform at the national tier
// (where they compete with the pros).
//
// Optional `tier` field is informational only — used by the picker UI for grouping.
export const SPORTS_LEAGUES = [
  // ── MEGA EVENTS (quadrennial, fortune cost, huge fame boost) ──
  // These exist purely as prestige plays. The cost is staggering and the
  // active season is short (Olympics is one month, World Cup ~2), but the
  // fame they grant is the only realistic way for a new network to catch
  // up to the major incumbents.
  {
    id: 'olympics', label: 'Olympics', icon: '🥇', tier: 'mega',
    season: [6],          // July only
    peakMonth: 6, peakLabel: 'Olympic Finals',
    cost: 400, baseQ: 9.0, baseH: 9.5, peakBonus: 3.0,
    fameOnSign: 12,
    yearAvailable: (year) => year % 4 === 0,   // Y4, Y8, Y12, ...
  },
  {
    id: 'world_cup', label: 'Soccer World Cup', icon: '🏆', tier: 'mega',
    season: [5, 6],       // June-July
    peakMonth: 6, peakLabel: 'World Cup Final',
    cost: 300, baseQ: 8.8, baseH: 9.5, peakBonus: 3.0,
    fameOnSign: 10,
    yearAvailable: (year) => year % 4 === 2,   // Y2, Y6, Y10, ...
  },

  // ── PROS (expensive, broad national appeal, high fame) ──
  {
    id: 'nfl', label: 'NFL Football', icon: '🏈', tier: 'pro',
    season: [7, 8, 9, 10, 11, 0, 1],
    peakMonth: 1, peakLabel: 'Super Bowl',
    cost: 180, baseQ: 8.5, baseH: 9.0, peakBonus: 2.5,
    fameOnSign: 5,
  },
  {
    id: 'nba', label: 'NBA Basketball', icon: '🏀', tier: 'pro',
    season: [8, 9, 10, 11, 0, 1, 2, 3],
    peakMonth: 5, peakLabel: 'Finals',
    cost: 140, baseQ: 7.5, baseH: 8.0, peakBonus: 2.0,
    fameOnSign: 5,
  },
  {
    id: 'mlb', label: 'MLB Baseball', icon: '⚾', tier: 'pro',
    season: [2, 3, 4, 5, 6, 7, 8, 9],
    peakMonth: 9, peakLabel: 'World Series',
    cost: 110, baseQ: 7.0, baseH: 6.5, peakBonus: 2.0,
    fameOnSign: 4,
  },
  {
    id: 'champions_league', label: 'Champions League', icon: '⚽', tier: 'pro',
    season: [8, 9, 10, 11, 0, 1, 2, 3, 4],   // Sep-May knockout calendar
    peakMonth: 4, peakLabel: 'Final',
    cost: 75, baseQ: 7.5, baseH: 7.5, peakBonus: 2.0,
    fameOnSign: 4,
  },
  {
    id: 'nhl', label: 'NHL Hockey', icon: '🏒', tier: 'pro',
    season: [9, 10, 11, 0, 1, 2, 3, 4, 5],
    peakMonth: 5, peakLabel: 'Stanley Cup',
    cost: 80, baseQ: 7.0, baseH: 6.5, peakBonus: 1.8,
    fameOnSign: 3,
  },
  {
    id: 'soccer', label: 'Pro Soccer League', icon: '⚽', tier: 'pro',
    season: [7, 8, 9, 10, 11, 0, 1, 2, 3, 4],
    peakMonth: 4, peakLabel: 'Championship',
    cost: 58, baseQ: 7.0, baseH: 6.8, peakBonus: 1.8,
    fameOnSign: 3,
  },
  {
    id: 'wwe', label: 'WWE Wrestling', icon: '🤼', tier: 'pro',
    season: [0,1,2,3,4,5,6,7,8,9,10,11],
    peakMonth: 3, peakLabel: 'WrestleMania',
    cost: 65, baseQ: 5.5, baseH: 8.5, peakBonus: 2.5,
    fameOnSign: 3,
  },
  {
    id: 'f1', label: 'Formula 1', icon: '🏎', tier: 'pro',
    season: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],   // Mar-Dec
    peakMonth: 11, peakLabel: 'Abu Dhabi GP',
    cost: 42, baseQ: 7.2, baseH: 6.5, peakBonus: 1.8,
    fameOnSign: 3,
  },
  {
    id: 'tennis', label: 'Tennis Tour', icon: '🎾', tier: 'pro',
    season: [0,1,2,3,4,5,6,7,8,9,10],
    peakMonth: 6, peakLabel: 'Wimbledon',
    cost: 55, baseQ: 7.0, baseH: 6.0, peakBonus: 2.0,
    fameOnSign: 2,
  },
  {
    id: 'golf', label: 'PGA Tour', icon: '⛳', tier: 'pro',
    season: [0,1,2,3,4,5,6,7,8,9,10],
    peakMonth: 3, peakLabel: 'The Masters',
    cost: 48, baseQ: 6.8, baseH: 5.5, peakBonus: 1.8,
    fameOnSign: 2,
  },
  {
    id: 'nascar', label: 'NASCAR', icon: '🏁', tier: 'pro',
    season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],   // Feb-Nov
    peakMonth: 10, peakLabel: 'Championship',
    cost: 30, baseQ: 6.0, baseH: 6.2, peakBonus: 1.8,
    fameOnSign: 2,
    marketHypeMult: { local: 1.2, metro: 1.05, national: 0.9 },
  },

  // ── COLLEGE / REGIONAL (cheap, huge in local/metro, fades nationally) ──
  // marketHypeMult inflates hype where the local audience is invested
  // (alumni, regional pride) and discounts it nationally where pro sports
  // dominate. These are the affordable on-ramp to sports broadcasting.
  {
    id: 'ncaa_fb', label: 'College Football', icon: '🏟', tier: 'college',
    season: [7, 8, 9, 10, 11, 0],
    peakMonth: 0, peakLabel: 'Bowl Season',
    cost: 25, baseQ: 7.0, baseH: 7.5, peakBonus: 2.0,
    fameOnSign: 1.5,
    marketHypeMult: { local: 1.4, metro: 1.25, national: 0.65 },
  },
  {
    id: 'ncaa_bb', label: 'College Basketball', icon: '🎓', tier: 'college',
    season: [10, 11, 0, 1, 2, 3],
    peakMonth: 2, peakLabel: 'March Madness',
    cost: 22, baseQ: 6.5, baseH: 7.2, peakBonus: 2.8,
    fameOnSign: 1.5,
    marketHypeMult: { local: 1.35, metro: 1.2, national: 0.7 },
  },
  {
    id: 'state_champ', label: 'State Championship', icon: '🥎', tier: 'regional',
    season: [0,1,2,3,4,5,6,7,8,9,10,11],   // year-round mixed sports
    peakMonth: 7, peakLabel: 'State Finals',
    cost: 4, baseQ: 4.8, baseH: 5.0, peakBonus: 1.5,
    fameOnSign: 0.5,
    marketHypeMult: { local: 1.3, metro: 1.0, national: 0.5 },
  },
  {
    id: 'local_soccer', label: 'Local Soccer League', icon: '🥅', tier: 'regional',
    season: [3, 4, 5, 6, 7, 8, 9, 10],
    peakMonth: 9, peakLabel: 'Regional Cup',
    cost: 8, baseQ: 5.8, baseH: 6.0, peakBonus: 1.2,
    fameOnSign: 1,
    marketHypeMult: { local: 1.5, metro: 1.1, national: 0.45 },
  },
  {
    id: 'track_field', label: 'Track & Field Events', icon: '🏃', tier: 'niche',
    season: [3, 4, 5, 6, 7, 8],
    peakMonth: 6, peakLabel: 'Championships',
    cost: 6, baseQ: 6.2, baseH: 4.5, peakBonus: 1.5,
    fameOnSign: 0.5,
    marketHypeMult: { local: 1.2, metro: 1.1, national: 0.85 },
  },
  {
    id: 'high_school_fb', label: 'High School Football', icon: '🏈', tier: 'regional',
    season: [7, 8, 9, 10, 11],
    peakMonth: 11, peakLabel: 'State Finals',
    cost: 3, baseQ: 5.0, baseH: 5.8, peakBonus: 1.2,
    fameOnSign: 0.5,
    marketHypeMult: { local: 1.6, metro: 0.9, national: 0.3 },
  },
]
// Cost multipliers by station market — applied to license cost only.
export const SPORTS_MARKET_COST_MULT = { local: 1.0, metro: 2.5, national: 6.0 }

/** Is a sports league available to license in the given year?
 *  Mega events (Olympics, World Cup) are only available on their cycle.
 *  All other leagues are available every year. */
export function leagueAvailableInYear(league, year) {
  if (!league?.yearAvailable) return true
  return league.yearAvailable(year)
}

/** For a league not available this year, how many years until it returns? */
export function leagueYearsUntilReturn(league, year) {
  if (!league?.yearAvailable) return 0
  for (let i = 1; i <= 8; i++) {
    if (league.yearAvailable(year + i)) return i
  }
  return null
}

// ─── STAFF (Directors of …) ──────────────────────────────────────────────────
// 5 roles. Personnel is the gate — until you hire one, you can't hire others.
// Quick search = always available (1 mo, $0.5M, Common-only).
// Normal search = unlocked via research (2 mo, $1M, up to Rare).
// Heavy search = unlocked via research (3 mo, $2M, up to Legendary).
export const STAFF_ROLES = [
  {
    id: 'personnel', label: 'VP of Personnel', icon: '👔',
    desc: 'Required to hire any other VP. Quick searches always available; better searches unlock more.',
  },
  {
    id: 'innovation', label: 'VP of Innovation', icon: '🔬',
    desc: 'Speeds up and discounts research. Common −5%, Legendary −55% cost / −50% time.',
  },
  {
    id: 'operations', label: 'VP of Operations', icon: '⚙️',
    desc: 'Lowers production cost on every show. Common −5%, Legendary −30%.',
  },
  {
    id: 'marketing', label: 'VP of Marketing', icon: '📣',
    desc: 'Discounts marketing campaigns AND boosts their impact. Common −10% / +10% impact, Legendary −40% / +60% impact.',
  },
  {
    id: 'content', label: 'VP of Content', icon: '🎨',
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

// ─── DIRECTOR ROLES (National-only sub-tier under VPs) ────────────────────────
// Directors sit below VPs and have specialized effects. Unlike VPs, they are
// ALWAYS Common tier — no rarity rolling, no searches.
//
// Gating:
//   - Requires station.market === 'national'
//   - Requires the parent VP is hired
//   - Requires Director of Staff is hired, EXCEPT Director of Staff itself
//     (which only requires VP of Personnel — mirrors the personnel-first VP gate)
//
// Special director: 'scheduling' — supports up to 4 simultaneous hires
// (each scheduling director can auto-program one slot focus).
export const DIRECTOR_ROLES = [
  // Personnel branch
  {
    id: 'talent', label: 'Director of Talent', icon: '🧑‍🤝‍🧑',
    parentVP: 'personnel',
    desc: 'Expands talent capacity from 15 to 25 at the National office.',
  },
  {
    id: 'staff', label: 'Director of Staff', icon: '🗂️',
    parentVP: 'personnel',
    desc: 'Required to hire any other Director. Like VP of Personnel — but one level deeper.',
  },

  // Content branch
  {
    id: 'production', label: 'Director of Production', icon: '🎬',
    parentVP: 'content',
    desc: '−15% cost and +15% quality on top production tiers (Ad-Hoc design, Heavy SFX, Surround, 4K UHD, Multilingual subs).',
  },
  {
    id: 'creative', label: 'Creative Director', icon: '✒️',
    parentVP: 'content',
    desc: '+15% quality on scripts your writers create.',
  },

  // Innovation branch
  {
    id: 'techinnov', label: 'Director of Technology Innovation', icon: '🧪',
    parentVP: 'innovation',
    desc: 'Required to research Surround Sound, 4K UHD, and Heavy SFX. Without one, those projects can\'t even be opened.',
  },

  // Marketing branch
  {
    id: 'marketing', label: 'Director of Marketing', icon: '📊',
    parentVP: 'marketing',
    desc: 'Unlocks Standard Ads and TV+Radio+Print campaign tiers. Without this director those tiers are locked.',
  },
  {
    id: 'merchandising', label: 'Director of Merchandising', icon: '🧸',
    parentVP: 'marketing',
    desc: 'Enables "Prepare Merchandising" on Large and Super productions for a chance at large hype-scaled side revenue.',
  },

  // Operations branch (special: up to 4 of these)
  {
    id: 'scheduling', label: 'Director of Scheduling', icon: '🗓️',
    parentVP: 'operations', maxCount: 4,
    desc: 'Auto-schedules a slot with a content focus. Auto-scheduled programs run at 0.9× quality and 0.85× hype vs hand-crafted.',
  },
]

// Common-tier flat salary for every director. Cheap relative to VPs because
// they are narrower in effect and always Common.
export const DIRECTOR_SALARY = 0.5  // $M / month
export const DIRECTOR_FIRE_PENALTY = DIRECTOR_SALARY * STAFF_FIRE_PENALTY_MULT
export const DIRECTOR_HIRE_COST = 1.5  // $M one-time on hire (no search/lottery)

// Effect tuning constants used by engine code.
// (Tier doesn't vary — keep it simple as flat coefficients.)
export const DIRECTOR_EFFECTS = {
  // Director of Production: cost discount + quality boost on top production tiers
  production: {
    topTierCostMult: 0.85,   // 15% off
    topTierQMult:    1.15,   // 15% quality up
    // IDs covered by the boost (cross-axis "top tier" choices):
    topTierIds: ['pd_adhoc', 'sfx_heavy', 'audio_surround', 'video_uhd', 'subs_multi'],
  },
  // Creative Director: writer-written script quality boost
  creative: {
    scriptQMult: 1.15,        // applied when writer-script transitions to 'ready'
  },
  // Director of Talent: bumps national talent cap
  talent: {
    talentCapNational: 25,    // without it, national stays at 15
  },
  // Director of Tech Innovation: gates research starts
  techinnov: {
    gatedResearch: ['tech_audio_surround', 'tech_video_uhd', 'tech_sfx_heavy'],
    gatedSfxTier: 'sfx_heavy',  // production view: lock Heavy SFX without it
  },
  // Director of Marketing: unlocks paid ad tiers
  marketing: {
    unlocksMarketingTiers: ['medium', 'big'],  // Standard Ads + TV+Radio+Print
  },
  // Director of Merchandising: enabler flag for prepare-merchandising option
  merchandising: {
    // Effect is enabling the option in ProductionView; logic itself comes next
    // session. Stub here so the data model is in place.
    enabled: true,
  },
  // Scheduling and Staff have no direct quality/cost effects — pure gates.
  scheduling: {},
  staff: {},
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


// Available only on Large and Super productions with Director of Merchandising.
// Tens of millions upfront; revenue scales as hype^1.8 × quality, so:
//   - mid-range hype + quality → slight loss (the gamble doesn't pay)
//   - high quality + hype → meaningful profit
//   - exceptional → massive profit
// Movies, sports, normal-tier scripted shows: not eligible (toggle hidden).
export const MERCH_PREPARE_COST = { large: 15, super: 40 } // $M upfront on production start
export const MERCH_BASE_REVENUE = { large: 8,  super: 22 } // $M base scalar per airing
export const MERCH_HYPE_EXPONENT = 1.8                     // bend the curve so mid → loss

// ─── AUTO-SCHEDULING (Director of Scheduling) ────────────────────────────────
// When a Director of Scheduling is assigned to a slot with a category focus,
// they spawn one auto-program per month into that slot. The slot is LOCKED —
// manual scheduling is unavailable until the director is canceled.
//
// Quality/hype rolls fresh each month, then multiplied by these factors so
// auto-programs are slightly worse than hand-crafted ones.
export const AUTO_SCHED_Q_MULT = 0.9
export const AUTO_SCHED_H_MULT = 0.85
// Auto-programs roll a base quality + hype from a narrow random band so
// canceling and re-assigning later gives a slightly different rating.
export const AUTO_SCHED_BASE_Q_MIN = 4.5
export const AUTO_SCHED_BASE_Q_MAX = 6.5
export const AUTO_SCHED_BASE_H_MIN = 4.0
export const AUTO_SCHED_BASE_H_MAX = 6.0


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
    { id: 'subs_multi', label: 'Multilingual',     q: 0.7,  h: 0.2, cost: 0.8, requires: 'tech_subs_multi', minScriptTier: 'large' },
  ],
  video: [
    { id: 'video_sd',  label: 'Standard Def',  q: 0,    h: 0,   cost: 0,   requires: null },
    { id: 'video_hd',  label: 'HD',            q: 0.6,  h: 0.3, cost: 0.6, requires: 'tech_video_hd' },
    { id: 'video_uhd', label: '4K UHD',        q: 1.2,  h: 0.5, cost: 1.5, requires: 'tech_video_uhd', minScriptTier: 'large' },
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
// Brand-level campaigns. The tiers form a ladder:
//
//   Local Buzz       — cheap, one-month, modest reach
//   Regional Push    — medium, one-month, regional reach
//   National Campaign — expensive, one-month, full reach
//   Sponsor Event    — partner an industry event (Oscars-style). Multi-month.
//   Sponsor Team     — official partner of a sports team. Long-running.
//   Super Bowl Ad    — one-shot. Massive. But you only get to swing once.
//
// The bottom three (Sponsor Event, Sponsor Team, Super Bowl Ad) are
// "input-driven" campaigns: the player picks a STAR they've hired plus
// TWO of their shows. The campaign's effectiveness scales with the
// quality + hype of those shows and the star's tier — i.e. a Super
// Bowl ad featuring a Legendary star and two blockbuster shows is
// devastating; the same ad with a Common nobody and middling shows is
// money wasted.
//
// Effect fields:
//   cost        — base cash cost (modified by marketing-VP staff effect)
//   fameGain    — fame applied once at launch (also multiplied by inputs)
//   hypeBoost   — added to every player airing each month the campaign is active
//   monthsActive — how many months the campaign sustains its hype boost
//   needsInputs — true if the campaign requires a star + 2 shows
//   minMarket   — minimum station market to be eligible to launch
//
// Multi-campaign stacking is allowed (you can have a Sponsor Team running
// while you also fire off a Super Bowl Ad in a clutch month). Effects add.
export const NETWORK_CAMPAIGNS = [
  {
    id: 'small',
    label: 'Local Buzz', icon: '📻',
    cost: 3,
    fameGain: 0.6,
    hypeBoost: 0.1,
    monthsActive: 1,
    needsInputs: false,
    minMarket: 'local',
    desc: 'Local radio + billboards. Modest reach.',
  },
  {
    id: 'medium',
    label: 'Regional Push', icon: '📰',
    cost: 9,
    fameGain: 1.4,
    hypeBoost: 0.25,
    monthsActive: 1,
    needsInputs: false,
    minMarket: 'local',
    desc: 'Regional ads + media tour.',
  },
  {
    id: 'big',
    label: 'National Campaign', icon: '📺',
    // National was previously $22M — re-tuned up since this is now genuinely
    // the prestige "broad" tier between regional and the mega-campaigns.
    cost: 45,
    fameGain: 3.0,
    hypeBoost: 0.55,
    monthsActive: 1,
    needsInputs: false,
    minMarket: 'metro',
    desc: 'TV + print + digital across the country. One-month saturation.',
  },

  // ── MEGA-CAMPAIGNS (input-driven, star + 2 shows) ─────────────────────
  {
    id: 'sponsor_event',
    label: 'Sponsor Event', icon: '🎭',
    cost: 80,
    fameGain: 4.0,
    hypeBoost: 0.65,
    monthsActive: 3,
    needsInputs: true,
    minMarket: 'metro',
    desc: 'Become the official sponsor of a major industry event (awards show, festival). 3 months of brand integration with a featured star and your tentpole shows.',
  },
  {
    id: 'sponsor_team',
    label: 'Sponsor Sports Team', icon: '🏟',
    cost: 110,
    fameGain: 5.0,
    hypeBoost: 0.45,
    monthsActive: 6,
    needsInputs: true,
    minMarket: 'metro',
    desc: 'Official partner of a pro sports franchise — jersey patches, in-stadium ads, halftime spots. Sustained 6-month presence. Quieter per-month but it adds up.',
  },
  {
    id: 'superbowl',
    label: 'Super Bowl Ad', icon: '🏈',
    cost: 200,
    fameGain: 8.0,
    hypeBoost: 2.0,
    monthsActive: 1,
    needsInputs: true,
    minMarket: 'national',
    desc: 'The biggest stage in advertising. One 60-second spot reaching 100M+ viewers. One month, but the burst is massive.',
  },
]

/** Compute the input-driven multiplier for a mega-campaign.
 *  Takes the chosen star (or null) and the two chosen show programs
 *  (each may be null if the player hasn't selected). Returns a number in
 *  roughly [0.4, 1.7] — multiplied against the base hype/fame effect.
 *
 *  Bad inputs (no star, weak shows) cap the campaign near its floor.
 *  Stacked inputs (Legendary star + two blockbusters) push it toward
 *  the ceiling. The math:
 *
 *     showQ = avg(show1.trueQ, show2.trueQ) / 10        // 0..1
 *     showH = avg(show1.trueH, show2.trueH) / 10        // 0..1
 *     starP = (star.q + star.h) / 6                     // ~0..1 (capped at 1)
 *     mult  = 0.4 + 0.5 * showQ + 0.3 * showH + 0.3 * starP
 *
 *  The 0.4 floor prevents a misfired campaign from being completely worthless
 *  (you still got the ad slot). The coefficients add to 1.5 above the floor
 *  so the ceiling is roughly 1.9.
 */
export function computeCampaignInputMultiplier(star, show1, show2) {
  let qSum = 0, qN = 0, hSum = 0, hN = 0
  if (show1) { qSum += show1.trueQ || 0; hSum += show1.trueH || 0; qN++; hN++ }
  if (show2) { qSum += show2.trueQ || 0; hSum += show2.trueH || 0; qN++; hN++ }
  const showQ = qN > 0 ? (qSum / qN) / 10 : 0
  const showH = hN > 0 ? (hSum / hN) / 10 : 0
  const starP = star ? Math.min(1, ((star.q || 0) + (star.h || 0)) / 6) : 0
  return 0.4 + 0.5 * showQ + 0.3 * showH + 0.3 * starP
}

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
