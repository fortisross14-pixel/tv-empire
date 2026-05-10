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
export const CYCLES = ['Q1', 'Q2', 'Q3', 'Q4']
export const CYCLES_PER_YEAR = 4

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

export const CATEGORY_IDS = ['news', 'reality', 'series', 'latenight', 'sports', 'family', 'contest', 'movie']

// ─── STATION FOCUSES ─────────────────────────────────────────────────────────
export const FOCUSES = [
  { id: 'news',    label: 'News & Information',   desc: '+1.0 quality on news. Free common news talent.', bonusCat: 'news',    bonusQ: 1.0 },
  { id: 'reality', label: 'Reality & Lifestyle',  desc: '+1.0 hype on reality. Free common reality star.', bonusCat: 'reality', bonusH: 1.0 },
  { id: 'series',  label: 'Scripted Series',      desc: '+1.0 quality on series. Free common series director.', bonusCat: 'series',  bonusQ: 1.0 },
  { id: 'sports',  label: 'Sports',               desc: '+0.7 quality, +0.5 hype on sports.', bonusCat: 'sports',  bonusQ: 0.7, bonusH: 0.5 },
  { id: 'family',  label: 'Family / Variety',     desc: '+0.8 quality on family programming.', bonusCat: 'family',  bonusQ: 0.8 },
  { id: 'general', label: 'General Entertainment',desc: 'No bonus, but +$10M starting cash.', bonusCash: 10 },
]

// ─── MARKETS ─────────────────────────────────────────────────────────────────
export const MARKETS = {
  local: {
    id: 'local', label: 'Riverside Local',
    desc: 'A mid-size city of 2M. Friendly. Limited reach.',
    pop: 2.0, audCap: 1.6, revPerViewer: 4.5,
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
  { id: 'd_realtycrew',     name: 'The Reality Crew',   specialty: 'reality',  tier: 'Common',    q: 0.2, h: 0.4, cost: 0.3  },

  // Series
  { id: 'd_vincegillagain', name: 'Vince Gillagain',    specialty: 'series',   tier: 'Legendary', q: 2.6, h: 1.8, cost: 12.0 },
  { id: 'd_dbweisman',      name: 'D.B. Weisman',       specialty: 'series',   tier: 'Epic',      q: 2.0, h: 1.6, cost: 7.0  },
  { id: 'd_shondarimes',    name: 'Shonda Rimes',       specialty: 'series',   tier: 'Epic',      q: 1.9, h: 1.4, cost: 6.5  },
  { id: 'd_taylersheridan', name: 'Tayler Sheridan',    specialty: 'series',   tier: 'Rare',      q: 1.4, h: 0.9, cost: 3.0  },
  { id: 'd_aaronsorkid',    name: 'Aaron Sorkid',       specialty: 'series',   tier: 'Rare',      q: 1.5, h: 0.7, cost: 3.0  },
  { id: 'd_indiedirector',  name: 'Indie Up-and-Comer', specialty: 'series',   tier: 'Uncommon',  q: 0.8, h: 0.5, cost: 1.1  },
  { id: 'd_filmschoolgrad', name: 'Film School Grad',   specialty: 'series',   tier: 'Common',    q: 0.3, h: 0.2, cost: 0.4  },

  // Late Night
  { id: 'd_lornemikels',    name: 'Lorne Mikels',       specialty: 'latenight',tier: 'Legendary', q: 2.2, h: 2.0, cost: 8.5  },
  { id: 'd_stephencobert',  name: 'Stephen Cobert',     specialty: 'latenight',tier: 'Epic',      q: 1.6, h: 1.6, cost: 4.5  },
  { id: 'd_conanobryant',   name: "Conan O'Bryant",     specialty: 'latenight',tier: 'Rare',      q: 1.2, h: 1.0, cost: 2.0  },
  { id: 'd_localcomic',     name: 'Local Comic',        specialty: 'latenight',tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },

  // Sports
  { id: 'd_bobcostis',      name: 'Bob Costis',         specialty: 'sports',   tier: 'Legendary', q: 2.0, h: 2.2, cost: 9.0  },
  { id: 'd_alroker',        name: 'Al Mikels',          specialty: 'sports',   tier: 'Epic',      q: 1.5, h: 1.6, cost: 5.0  },
  { id: 'd_localsportsguy', name: 'Sports Desk Vet',    specialty: 'sports',   tier: 'Rare',      q: 1.0, h: 0.9, cost: 2.0  },
  { id: 'd_collegegrad',    name: 'College Sportscaster',specialty: 'sports',  tier: 'Common',    q: 0.3, h: 0.3, cost: 0.4  },

  // Family
  { id: 'd_pixarvet',       name: 'Pixarian Veteran',   specialty: 'family',   tier: 'Legendary', q: 2.5, h: 1.8, cost: 9.5  },
  { id: 'd_phineasferb',    name: 'Phineas Ferb',       specialty: 'family',   tier: 'Epic',      q: 1.8, h: 1.4, cost: 5.0  },
  { id: 'd_familychannel',  name: 'Family Channel Vet', specialty: 'family',   tier: 'Rare',      q: 1.1, h: 0.8, cost: 2.0  },
  { id: 'd_sundayschool',   name: 'Sunday School Crew', specialty: 'family',   tier: 'Common',    q: 0.3, h: 0.2, cost: 0.3  },

  // Contest
  { id: 'd_chrishorton',    name: 'Chris Horton',       specialty: 'contest',  tier: 'Legendary', q: 1.8, h: 2.4, cost: 8.5  },
  { id: 'd_steveharvy',     name: 'Steve Harvy',        specialty: 'contest',  tier: 'Epic',      q: 1.4, h: 1.8, cost: 4.5  },
  { id: 'd_aliexttrebek',   name: 'Aliex Trebok',       specialty: 'contest',  tier: 'Rare',      q: 1.4, h: 0.9, cost: 2.5  },
  { id: 'd_localhost',      name: 'Local Game Host',    specialty: 'contest',  tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },
]

// ─── STARS POOL ──────────────────────────────────────────────────────────────
export const STARS = [
  // News anchors
  { id: 's_andercoop',     name: 'Ander Coop',          specialty: 'news',     tier: 'Legendary', q: 2.6, h: 2.0, cost: 11.0 },
  { id: 's_lestrhold',     name: 'Lester Hold',         specialty: 'news',     tier: 'Epic',      q: 1.8, h: 1.4, cost: 5.5  },
  { id: 's_norareilly',    name: 'Nora Reilly',         specialty: 'news',     tier: 'Rare',      q: 1.4, h: 1.0, cost: 2.6  },
  { id: 's_localanchor1',  name: 'Local Anchor Vet',    specialty: 'news',     tier: 'Uncommon',  q: 0.7, h: 0.4, cost: 0.9  },
  { id: 's_freshanchor',   name: 'Fresh-Faced Reporter',specialty: 'news',     tier: 'Common',    q: 0.3, h: 0.2, cost: 0.3  },

  // Reality stars (pure hype)
  { id: 's_zandayya',      name: 'Zandayya',            specialty: 'reality',  tier: 'Legendary', q: 1.4, h: 3.2, cost: 12.0 },
  { id: 's_kourtneyk',     name: 'Kourtney K.',         specialty: 'reality',  tier: 'Epic',      q: 1.0, h: 2.6, cost: 6.0  },
  { id: 's_paulsenheir',   name: 'Paulsen Heir',        specialty: 'reality',  tier: 'Rare',      q: 0.7, h: 1.8, cost: 2.8  },
  { id: 's_instainfluencer',name: 'Insta Influencer',   specialty: 'reality',  tier: 'Uncommon',  q: 0.3, h: 1.2, cost: 1.0  },
  { id: 's_realityrookie', name: 'Reality Rookie',      specialty: 'reality',  tier: 'Common',    q: 0.2, h: 0.5, cost: 0.3  },

  // Series leads
  { id: 's_bryancranstein',name: 'Bryan Cranstein',     specialty: 'series',   tier: 'Legendary', q: 3.0, h: 2.0, cost: 13.0 },
  { id: 's_pedropastel',   name: 'Pedro Pastel',        specialty: 'series',   tier: 'Legendary', q: 2.6, h: 2.6, cost: 13.5 },
  { id: 's_jenanniston',   name: 'Jen Anniston',        specialty: 'series',   tier: 'Epic',      q: 2.0, h: 1.8, cost: 6.5  },
  { id: 's_keanureverse',  name: 'Keanu Reverse',       specialty: 'series',   tier: 'Epic',      q: 1.8, h: 2.2, cost: 7.0  },
  { id: 's_zendoyle',      name: 'Zen Doyle',           specialty: 'series',   tier: 'Rare',      q: 1.4, h: 1.4, cost: 3.0  },
  { id: 's_workingactor',  name: 'Working Actor',       specialty: 'series',   tier: 'Uncommon',  q: 0.8, h: 0.4, cost: 1.0  },
  { id: 's_castingcouch',  name: 'Up-and-Comer',        specialty: 'series',   tier: 'Common',    q: 0.3, h: 0.2, cost: 0.4  },

  // Late night hosts
  { id: 's_jimmyfellone',  name: 'Jimmy Fellone',       specialty: 'latenight',tier: 'Legendary', q: 2.0, h: 2.6, cost: 11.0 },
  { id: 's_jimmykimble',   name: 'Jimmy Kimble',        specialty: 'latenight',tier: 'Epic',      q: 1.6, h: 2.0, cost: 5.5  },
  { id: 's_setmeyors',     name: 'Set Meyors',          specialty: 'latenight',tier: 'Rare',      q: 1.2, h: 1.4, cost: 2.5  },
  { id: 's_openmicnight',  name: 'Open-Mic Night',      specialty: 'latenight',tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },

  // Sports talent
  { id: 's_tombrody',      name: 'Tom Brody',           specialty: 'sports',   tier: 'Legendary', q: 2.4, h: 2.8, cost: 12.0 },
  { id: 's_lebronjeans',   name: 'LeBron Jeans',        specialty: 'sports',   tier: 'Legendary', q: 2.2, h: 3.0, cost: 12.5 },
  { id: 's_payton',        name: 'Peyton M.',           specialty: 'sports',   tier: 'Epic',      q: 1.8, h: 1.8, cost: 5.5  },
  { id: 's_localathlete',  name: 'Local Pro Athlete',   specialty: 'sports',   tier: 'Rare',      q: 1.0, h: 1.2, cost: 2.2  },
  { id: 's_collegehost',   name: 'College Sports Host', specialty: 'sports',   tier: 'Common',    q: 0.3, h: 0.4, cost: 0.4  },

  // Family
  { id: 's_dwayneboulder', name: 'Dwayne Boulder',      specialty: 'family',   tier: 'Legendary', q: 1.8, h: 3.0, cost: 11.5 },
  { id: 's_zackefron',     name: 'Zack Efron',          specialty: 'family',   tier: 'Epic',      q: 1.6, h: 2.0, cost: 5.5  },
  { id: 's_disneystar',    name: 'Channel Star',        specialty: 'family',   tier: 'Rare',      q: 1.0, h: 1.4, cost: 2.4  },
  { id: 's_kidshow',       name: 'Kid Show Veteran',    specialty: 'family',   tier: 'Common',    q: 0.3, h: 0.4, cost: 0.3  },

  // Contest hosts
  { id: 's_mistrbeast',    name: 'Mister Feast',        specialty: 'contest',  tier: 'Legendary', q: 1.6, h: 3.4, cost: 12.5 },
  { id: 's_ryanseaprest',  name: 'Ryan Seaprest',       specialty: 'contest',  tier: 'Epic',      q: 1.4, h: 2.2, cost: 5.5  },
  { id: 's_padmalakshmer', name: 'Padma Lakshmer',      specialty: 'contest',  tier: 'Rare',      q: 1.4, h: 1.4, cost: 2.6  },
  { id: 's_localhostess',  name: 'Local TV Personality',specialty: 'contest',  tier: 'Common',    q: 0.3, h: 0.3, cost: 0.3  },
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
export const COMPETITORS = {
  local: [
    { name: 'Riverside 12',   strength: 0.7 },
    { name: 'KRVS Local',     strength: 0.5 },
    { name: 'Public Channel', strength: 0.4 },
  ],
  metro: [
    { name: 'Tri-State NBC',  strength: 1.0 },
    { name: 'Metro CBS',      strength: 0.95 },
    { name: 'Empire FOX',     strength: 0.9 },
    { name: 'Liberty ABC',    strength: 0.85 },
  ],
  national: [
    { name: 'Galaxy Network',  strength: 1.2 },
    { name: 'Apex Broadcast',  strength: 1.15 },
    { name: 'Olympus TV',      strength: 1.1 },
    { name: 'Continental',     strength: 1.05 },
    { name: 'Sovereign Media', strength: 1.0 },
  ],
}

// ─── RESEARCH TREE ───────────────────────────────────────────────────────────
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
export const RESEARCH = [
  // ─── SLOTS ─────────────────────────────────────────────────────────────────
  {
    id: 'slot_news', group: 'slots',
    label: 'News Slot', icon: '📰',
    desc: 'Add a daily news block. High match bonus for news.',
    cost: 10,
    effect: { addSlot: 'news' },
  },
  {
    id: 'slot_prime2', group: 'slots',
    label: 'Prime Time II', icon: '🌃',
    desc: 'Add a second prime-time window — series, reality, movies thrive here.',
    cost: 22,
    effect: { addSlot: 'prime2' },
  },
  {
    id: 'slot_latenight', group: 'slots',
    label: 'Late Night Slot', icon: '🌙',
    desc: 'A small late-night slot — adults, talk, edgy content. Lower audience but cheap.',
    cost: 12,
    effect: { addSlot: 'latenight' },
  },
  {
    id: 'slot_weekend2', group: 'slots',
    label: 'Weekend II', icon: '🎬',
    desc: 'A second weekend slot — sports, movies, family events.',
    cost: 18,
    effect: { addSlot: 'weekend2' },
  },

  // ─── CONTENT — ENTER NEW CATEGORIES ────────────────────────────────────────
  {
    id: 'content_news_dept', group: 'content',
    label: 'News Department', icon: '📰',
    desc: 'Unlock News (local + global) if you don\'t have it.',
    cost: 6,
    effect: { unlockContent: [['news', 'local'], ['news', 'global']] },
  },
  {
    id: 'content_reality_dept', group: 'content',
    label: 'Reality Department', icon: '👁',
    desc: 'Unlock Reality (general + competition).',
    cost: 8,
    effect: { unlockContent: [['reality', 'general'], ['reality', 'competition']] },
  },
  {
    id: 'content_series_dept', group: 'content',
    label: 'Series Department', icon: '📺',
    desc: 'Unlock Scripted Series (drama + comedy).',
    cost: 12,
    effect: { unlockContent: [['series', 'drama'], ['series', 'comedy']] },
  },
  {
    id: 'content_latenight_dept', group: 'content',
    label: 'Late Night Department', icon: '🎤',
    desc: 'Unlock Late Night (talk + comedy + variety).',
    cost: 7,
    effect: { unlockContent: [['latenight', 'talk'], ['latenight', 'comedy'], ['latenight', 'variety']] },
  },
  {
    id: 'content_sports_dept', group: 'content',
    label: 'Sports Department', icon: '🏆',
    desc: 'Unlock Sports analysis + documentaries. Live coverage requires further research.',
    cost: 15,
    effect: { unlockContent: [['sports', 'analysis'], ['sports', 'doc']] },
  },
  {
    id: 'content_family_dept', group: 'content',
    label: 'Family Department', icon: '👨‍👩‍👧',
    desc: 'Unlock Family programming (animated + live-action).',
    cost: 6,
    effect: { unlockContent: [['family', 'animated'], ['family', 'live']] },
  },
  {
    id: 'content_contest_dept', group: 'content',
    label: 'Contest Department', icon: '🎯',
    desc: 'Unlock Contest shows (quiz + physical).',
    cost: 5,
    effect: { unlockContent: [['contest', 'quiz'], ['contest', 'physical']] },
  },

  // ─── CONTENT — DEEPEN AN EXISTING CATEGORY ────────────────────────────────
  {
    id: 'content_news_field', group: 'content',
    label: 'Field Reporting', icon: '🎙',
    desc: 'News: unlocks Field Reporter and Big-Topic Specials.',
    cost: 8,
    effect: { unlockContent: [['news', 'reporter'], ['news', 'bigtopic']] },
  },
  {
    id: 'content_reality_lifestyle', group: 'content',
    label: 'Lifestyle Programming', icon: '💕',
    desc: 'Reality: unlocks Adventure / Survival and Dating / Love.',
    cost: 7,
    effect: { unlockContent: [['reality', 'adventure'], ['reality', 'love']] },
  },
  {
    id: 'content_series_genres', group: 'content',
    label: 'Genre Expansion', icon: '🎭',
    desc: 'Series: unlocks Action, Fantasy/Sci-Fi, and Crime/Procedural.',
    cost: 14,
    effect: { unlockContent: [['series', 'action'], ['series', 'fantasy'], ['series', 'crime']] },
  },
  {
    id: 'content_latenight_mature', group: 'content',
    label: 'Mature Content License', icon: '🔞',
    desc: 'Late Night: unlocks Adult / Edgy comedy. Big hype, small audience.',
    cost: 10,
    effect: { unlockContent: [['latenight', 'mature']] },
  },
  {
    id: 'content_sports_live', group: 'content',
    label: 'Live Coverage Rights', icon: '🏟',
    desc: 'Sports: unlocks LIVE GAME COVERAGE — the highest revenue sports content.',
    cost: 35,
    requires: ['content_sports_dept'],
    effect: { unlockContent: [['sports', 'live']] },
  },
  {
    id: 'content_family_edu', group: 'content',
    label: 'Educational Programming', icon: '🎓',
    desc: 'Family: unlocks Educational shows (high quality, lower hype).',
    cost: 5,
    effect: { unlockContent: [['family', 'edu']] },
  },
  {
    id: 'content_contest_prize', group: 'content',
    label: 'Big-Prize Productions', icon: '💰',
    desc: 'Contest: unlocks Big Prize Show — high hype, expensive prizes.',
    cost: 8,
    effect: { unlockContent: [['contest', 'prize']] },
  },

  // ─── OPERATIONS — PASSIVE BOOSTS ──────────────────────────────────────────
  {
    id: 'ops_scout', group: 'ops',
    label: 'Talent Scout', icon: '🔍',
    desc: 'Refresh the market talent roster with new options. Repeatable.',
    cost: 4,
    repeatable: true,
    effect: { refreshRoster: true },
  },
  {
    id: 'ops_mktg_eff', group: 'ops',
    label: 'Marketing Efficiency', icon: '📢',
    desc: '−25% on all marketing campaign costs.',
    cost: 10,
    effect: { marketingDiscount: 0.75 },
  },
  {
    id: 'ops_sequel_boost', group: 'ops',
    label: 'Renewal Power', icon: '🔄',
    desc: 'Renewed shows get +0.5 quality.',
    cost: 6,
    effect: { sequelBonus: 0.5 },
  },
  {
    id: 'ops_ip_negot', group: 'ops',
    label: 'IP Negotiators', icon: '📜',
    desc: '−20% on IP licensing costs.',
    cost: 8,
    effect: { ipDiscount: 0.8 },
  },
]

// ─── SLOT TYPES ──────────────────────────────────────────────────────────────
// Each station's lineup is a list of typed slots. Each slot has a focus
// audience and "preferred" categories that get a small audience boost when
// you program something matching. Mismatches don't fail — they just don't
// get the bonus. Slot types are unlocked via research (Pass 2).
export const SLOT_TYPES = {
  morning: {
    id: 'morning',
    label: 'Morning',
    icon: '☀',
    desc: 'Pre-work, kids, casual viewers. Family + light news land best.',
    prefersCategory: ['family', 'news', 'contest'],
    audienceMult: 0.85,           // smaller audience pool, but cheaper
    costMult: 0.85,
    matchBonus: 0.6,              // hype bonus when you match a preferred category
  },
  prime: {
    id: 'prime',
    label: 'Prime Time',
    icon: '🌆',
    desc: 'The big window. Series, reality, and movies thrive here.',
    prefersCategory: ['series', 'reality', 'movie'],
    audienceMult: 1.15,
    costMult: 1.0,
    matchBonus: 0.9,
  },
  weekend: {
    id: 'weekend',
    label: 'Weekend',
    icon: '🏈',
    desc: 'Sports and movies own the weekend. Big events, casual viewing.',
    prefersCategory: ['sports', 'movie', 'family'],
    audienceMult: 1.05,
    costMult: 0.95,
    matchBonus: 0.8,
  },
  // — Researchable slots (unlocked in Pass 2 research tree) —
  news: {
    id: 'news',
    label: 'Daily News',
    icon: '📰',
    desc: 'A nightly news block. Heavy news preference; reality flops here.',
    prefersCategory: ['news'],
    audienceMult: 0.9,
    costMult: 0.8,
    matchBonus: 1.2,
  },
  prime2: {
    id: 'prime2',
    label: 'Prime Time II',
    icon: '🌃',
    desc: 'A second prime window — same audience as prime.',
    prefersCategory: ['series', 'reality', 'movie'],
    audienceMult: 1.1,
    costMult: 1.0,
    matchBonus: 0.9,
  },
  latenight: {
    id: 'latenight',
    label: 'Late Night',
    icon: '🌙',
    desc: 'Adults-only window. Talk shows, mature comedy, edgy content.',
    prefersCategory: ['latenight', 'series'],
    audienceMult: 0.65,
    costMult: 0.7,
    matchBonus: 1.1,
  },
  weekend2: {
    id: 'weekend2',
    label: 'Weekend II',
    icon: '🎬',
    desc: 'A second weekend slot — sports, movies, family events.',
    prefersCategory: ['sports', 'movie', 'family'],
    audienceMult: 1.0,
    costMult: 0.95,
    matchBonus: 0.8,
  },
}

// Default slots a brand-new station has (pre-research)
export const DEFAULT_SLOT_IDS = ['morning', 'prime', 'weekend']

// ─── SEASONAL PREFERENCES ────────────────────────────────────────────────────
// `[slotTypeId][quarterIdx]` → { categoryId? topicId? bonusH? bonusQ?, label }
// Drives the "this quarter wants…" hint shown on each slot card. If the player
// programs something matching, they get a hype bonus that quarter.
// quarterIdx: 0=Q1 winter, 1=Q2 spring, 2=Q3 summer, 3=Q4 holiday.
export const SEASONAL_PREFS = {
  morning: [
    { categoryId: 'news',    topicId: 'local',     label: 'New Year news cycle',         bonusH: 0.6 },
    { categoryId: 'family',  topicId: 'edu',       label: 'Spring kids programming',     bonusH: 0.7 },
    { categoryId: 'family',  topicId: 'animated',  label: 'Summer family content',       bonusH: 0.8 },
    { categoryId: 'family',  topicId: 'live',      label: 'Holiday family specials',     bonusH: 0.9 },
  ],
  prime: [
    { categoryId: 'series',  topicId: 'drama',     label: 'Prestige drama season',       bonusH: 0.8 },
    { categoryId: 'reality', topicId: 'love',      label: 'Spring romance reality',      bonusH: 0.7 },
    { categoryId: 'reality', topicId: 'adventure', label: 'Summer adventure reality',    bonusH: 0.9 },
    { categoryId: 'movie',   topicId: null,        label: 'Holiday movie specials',      bonusH: 1.0 },
  ],
  weekend: [
    { categoryId: 'sports',  topicId: 'live',      label: 'Winter sports season',        bonusH: 0.9 },
    { categoryId: 'sports',  topicId: 'live',      label: 'Spring playoff fever',        bonusH: 1.0 },
    { categoryId: 'sports',  topicId: 'doc',       label: 'Summer doc marathon',         bonusH: 0.6 },
    { categoryId: 'movie',   topicId: null,        label: 'Holiday romantic movies',     bonusH: 0.9 },
  ],
  news: [
    { categoryId: 'news', topicId: 'global',   label: 'World affairs focus',     bonusH: 0.5 },
    { categoryId: 'news', topicId: 'local',    label: 'Local elections',         bonusH: 0.7 },
    { categoryId: 'news', topicId: 'reporter', label: 'Summer field stories',    bonusH: 0.5 },
    { categoryId: 'news', topicId: 'bigtopic', label: 'Year-in-review specials', bonusH: 0.9 },
  ],
  prime2: [
    { categoryId: 'series',  topicId: 'crime',     label: 'Crime drama winter',     bonusH: 0.7 },
    { categoryId: 'series',  topicId: 'comedy',    label: 'Spring comedies',        bonusH: 0.6 },
    { categoryId: 'reality', topicId: 'competition', label: 'Summer competitions',  bonusH: 0.9 },
    { categoryId: 'series',  topicId: 'fantasy',   label: 'Holiday fantasy event',  bonusH: 1.0 },
  ],
  latenight: [
    { categoryId: 'latenight', topicId: 'talk',    label: 'Awards season talk',     bonusH: 0.7 },
    { categoryId: 'latenight', topicId: 'comedy',  label: 'Spring stand-up tour',   bonusH: 0.8 },
    { categoryId: 'latenight', topicId: 'variety', label: 'Summer variety',         bonusH: 0.7 },
    { categoryId: 'latenight', topicId: 'talk',    label: 'Year-end interviews',    bonusH: 0.9 },
  ],
  weekend2: [
    { categoryId: 'sports', topicId: 'analysis', label: 'Winter sports analysis',  bonusH: 0.6 },
    { categoryId: 'sports', topicId: 'live',     label: 'Spring tournaments',      bonusH: 1.0 },
    { categoryId: 'movie',  topicId: null,       label: 'Summer blockbusters',     bonusH: 0.9 },
    { categoryId: 'family', topicId: 'animated', label: 'Holiday animated event',  bonusH: 0.8 },
  ],
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
    // General: a small dish from each — nothing deep. Player must specialize via research.
    general: [['series', 'comedy'], ['reality', 'general'], ['contest', 'quiz']],
  }
  return [...baseAll, ...(byFocus[focusId] || [])]
}

// ─── TALENT CONTRACT TYPES ───────────────────────────────────────────────────
// `cost` here is a multiplier on talent's base cost-per-cycle.
// "Permanent" charges base cost every cycle but if you fire them you pay 5×.
export const CONTRACT_TYPES = [
  { id: 'c1',  label: '1 cycle',     cycles: 1,  costMult: 1.0,  desc: 'One-shot. Pay once.' },
  { id: 'c2',  label: '2 cycles',    cycles: 2,  costMult: 1.9,  desc: 'Slight discount.' },
  { id: 'c4',  label: '4 cycles',    cycles: 4,  costMult: 3.6,  desc: '−10% per cycle.' },
  { id: 'c8',  label: '8 cycles',    cycles: 8,  costMult: 6.8,  desc: '−15% per cycle.' },
  { id: 'cP',  label: 'Permanent',   cycles: -1, costMult: 0.85, desc: 'Pay each cycle. Firing costs 5× one cycle.' },
]
export const FIRE_PENALTY_MULT = 5

