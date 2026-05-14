import { useState, useMemo, useEffect } from 'react'
import { T, FONTS } from '../theme.js'
import { CATEGORIES, MARKETS, SLOT_TYPES } from '../constants.js'
import { fameLabel, fmtM, findLeague, ratingLabel, ratingLabelColor } from '../engine.js'
import { play as playSound } from '../audio.js'

// Note: HTag/Bar from ./ui.jsx removed in stage AK — the editorial migration
// inlined their roles using mono pills and gradient progress bars.

const SORT_OPTIONS = [
  { id: 'rating',   label: 'Rating' },
  { id: 'audience', label: 'Audience' },
  { id: 'revenue',  label: 'Revenue' },
  { id: 'profit',   label: 'Margin' },
  { id: 'slot',     label: 'Slot' },
]

// ─────────────────────────────────────────────────────────────────────────
// HEADLINE LOGIC
//
// The adaptive headline at the top is the screen's signature. It looks at
// (a) whether net was positive, (b) whether anything was a hit, (c) whether
// the slate flopped, and picks one of a small set of pre-written phrases.
//
// Kept conservative on purpose — no auto-generated cleverness, just a small
// matrix of pre-written headlines that match how a trade-press masthead
// would frame the month. Each headline pairs with a "tone" that drives the
// hero-rule color and the CTA variant downstream.
// ─────────────────────────────────────────────────────────────────────────
function computeHeadline({ net, bestRating, worstRating, hitCount, flopCount, programCount }) {
  // No programs at all — neutral pass.
  if (programCount === 0) {
    return { headline: 'A quiet month.', tone: 'neutral',
      standfirstHint: 'Nothing on the air. The slate was empty.' }
  }
  const banner   = bestRating >= 9
  const hit      = bestRating >= 7
  const allFlops = worstRating < 4 && bestRating < 4
  const positive = net > 0

  if (banner && positive)           return { headline: 'A banner month.',       tone: 'great' }
  if (banner && !positive)          return { headline: 'A hit, and red ink.',   tone: 'mixed' }
  if (hit && positive)              return { headline: 'Solid numbers.',        tone: 'good' }
  if (hit && !positive)             return { headline: 'A hit, costs aside.',   tone: 'mixed' }
  if (allFlops)                     return { headline: 'Rough air.',            tone: 'rough' }
  if (positive)                     return { headline: 'In the black.',         tone: 'good' }
  return { headline: 'A soft month.', tone: 'rough' }
}

// Hero-rule color per tone.
function toneAccent(tone) {
  switch (tone) {
    case 'great': return T.gold
    case 'good':  return T.accent
    case 'mixed': return T.accent
    case 'rough': return T.red
    default:      return T.accent
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LEAD STORY LOGIC
//
// If there's a clear winner (rating ≥ 7), feature it in a gold-stripe
// pull-quote card. Otherwise show a red-stripe "Worth a look" advisory
// framing the rough month constructively — same component, different copy.
// ─────────────────────────────────────────────────────────────────────────
function computeLeadStory(rankedAirings, totals) {
  if (rankedAirings.length === 0) return null

  // Pick the best by rating (ties broken by audience)
  const sorted = [...rankedAirings].sort((a, b) =>
    (b.rating || 0) - (a.rating || 0) || (b.audience || 0) - (a.audience || 0)
  )
  const best = sorted[0]
  const flopCount = rankedAirings.filter(a => (a.rating || 0) < 4).length

  // STRONG WINNER — rating ≥ 7. Lead story is celebratory.
  if (best && best.rating >= 7) {
    const slotRankPhrase = best.slotRank === 1 && best.slotTotal > 1
      ? `the #1 spot in slot`
      : best.slotRank > 0 && best.slotTotal > 1
        ? `#${best.slotRank} of ${best.slotTotal} in slot`
        : null
    return {
      kind: 'winner',
      airing: best,
      headline: `${best.name || 'Untitled'} ${best.rating >= 9 ? 'ran the table.' : 'led the slate.'}`,
      standfirst: standfirstForWinner(best, slotRankPhrase),
      slotRankPhrase,
    }
  }

  // ROUGH MONTH — no clear winner. Lead becomes "Worth a look" advisory.
  return {
    kind: 'rough',
    airing: best,
    headline: 'The slate underperformed across the board.',
    standfirst: standfirstForRough(best, flopCount),
    flopCount,
  }
}

function standfirstForWinner(best, slotRankPhrase) {
  const parts = []
  parts.push(`A ${best.rating?.toFixed(1)} rating`)
  if (best.audience > 0) parts.push(`${best.audience.toFixed(1)}M viewers`)
  if (slotRankPhrase)    parts.push(slotRankPhrase)
  return parts.join(', ') + '. The audience showed up.'
}

function standfirstForRough(best, flopCount) {
  const bits = []
  if (best) {
    bits.push(`Highest rating was a ${best.rating?.toFixed(1)} for ${best.name || 'an untitled program'}`)
  }
  if (flopCount > 0) {
    bits.push(`${flopCount} program${flopCount > 1 ? 's' : ''} landed at flop`)
  }
  if (bits.length === 0) return 'Nothing this month moved the needle.'
  return bits.join(' — ') + '. Time to review production allocations.'
}

// ─────────────────────────────────────────────────────────────────────────

export function ResultsView({ results, station, onContinue, cycleLabel }) {
  if (!results) return null
  const airings = results.airings || []
  const competitorAirings = results.competitorAirings || []
  const totals = results.totals || {}
  const market = MARKETS[station.market]

  // After the results-reveal whoosh (played from App on phase change), follow up
  // with one hit or flop accent sound — whichever the headline result was.
  // We pick a single sound rather than spamming one per airing to keep things
  // tasteful: the biggest hit beats the biggest flop, ratings ≥ 8 = hit,
  // ratings < 4 = flop, otherwise silence.
  useEffect(() => {
    const best  = airings.reduce((m, a) => (a.rating > (m?.rating ?? -1) ? a : m), null)
    const worst = airings.reduce((m, a) => (a.rating < (m?.rating ?? 99) ? a : m), null)
    let timer
    if (best && best.rating >= 8) {
      timer = setTimeout(() => playSound('hit'), 700)
    } else if (worst && worst.rating < 4) {
      timer = setTimeout(() => playSound('flop'), 700)
    }
    return () => { if (timer) clearTimeout(timer) }
    // Run once on mount per results set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

  const [slotFilter, setSlotFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating')

  // Compute per-airing slot rank (rank within slot vs competitors)
  const ranked = useMemo(() => {
    const bySlot = {}
    ;[...airings, ...competitorAirings].forEach(a => {
      const sid = a.slotTypeId || 'prime'
      if (!bySlot[sid]) bySlot[sid] = []
      bySlot[sid].push(a)
    })
    Object.values(bySlot).forEach(group => group.sort((a, b) => (b.audience || 0) - (a.audience || 0)))
    return airings.map(a => {
      const sid = a.slotTypeId || 'prime'
      const group = bySlot[sid] || []
      const slotRank = group.findIndex(x => x.id === a.id) + 1
      const slotTotal = group.length
      return { ...a, slotRank, slotTotal, _profit: (a.revenue || 0) - (a.cost || 0) }
    })
  }, [airings, competitorAirings])

  const filtered = useMemo(() => {
    return slotFilter === 'all' ? ranked : ranked.filter(a => a.slotTypeId === slotFilter)
  }, [ranked, slotFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'audience': return (b.audience || 0) - (a.audience || 0)
        case 'revenue':  return (b.revenue  || 0) - (a.revenue  || 0)
        case 'profit':   return (b._profit  || 0) - (a._profit  || 0)
        case 'slot':     return (a.slotTypeId || '').localeCompare(b.slotTypeId || '') || (a.slotRank - b.slotRank)
        case 'rating':
        default:         return (b.rating || 0) - (a.rating || 0)
      }
    })
  }, [filtered, sortBy])

  const usedSlots = useMemo(() => {
    const s = new Set(airings.map(a => a.slotTypeId).filter(Boolean))
    return Array.from(s)
  }, [airings])

  const fameAfter = station.fame
  const fameDelta = totals.fameDelta || 0
  const networkCount = totals.networkCount || 1
  const audRank = totals.audRank || 1
  const revRank = totals.revRank || 1
  const net = totals.net ?? 0
  const netPositive = net >= 0

  // ── Headline + lead story ──────────────────────────────────────────
  const bestRating  = airings.reduce((m, a) => Math.max(m, a.rating || 0), 0)
  const worstRating = airings.length > 0 ? airings.reduce((m, a) => Math.min(m, a.rating || 99), 99) : 0
  const hitCount    = airings.filter(a => (a.rating || 0) >= 7).length
  const flopCount   = airings.filter(a => (a.rating || 0) < 4).length

  const { headline, tone } = computeHeadline({
    net, bestRating, worstRating, hitCount, flopCount, programCount: airings.length,
  })
  const accent = toneAccent(tone)
  const leadStory = useMemo(() => computeLeadStory(ranked, totals), [ranked, totals])

  // Standfirst beneath the hero title — natural-language summary of what
  // happened this month. Built from the actual numbers so it reads as a
  // real summary, not boilerplate.
  const heroStandfirst = useMemo(() => {
    if (airings.length === 0) return 'Nothing on the air this month.'
    const parts = []
    parts.push(`${airings.length} program${airings.length === 1 ? '' : 's'} aired`)
    if (leadStory?.kind === 'winner' && leadStory.airing) {
      const a = leadStory.airing
      parts.push(`${a.name || 'the headline show'} led with a ${a.rating?.toFixed(1)}`)
    } else if (bestRating > 0) {
      parts.push(`top rating was a ${bestRating.toFixed(1)}`)
    }
    if (netPositive) {
      parts.push(`net up ${fmtM(net)}`)
    } else {
      parts.push(`net down ${fmtM(Math.abs(net))}`)
    }
    return parts.join(' · ') + '.'
  }, [airings.length, leadStory, bestRating, net, netPositive])

  return (
    <div className="view-wrap ani" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 60px' }}>

      {/* ─── HERO ───
          Gold rule + accent eyebrow (date · context · market) + Fraunces
          adaptive headline that reflects the data tone. Italic-serif
          standfirst below summarizes the month in prose. */}
      <div style={{ paddingTop: 8, paddingBottom: 28 }}>
        <div style={{
          width: 36, height: 2, marginBottom: 16,
          background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)`,
        }} />
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
          textTransform: 'uppercase', color: accent, marginBottom: 16,
        }}>
          {cycleLabel} · Results · {market.label}
        </div>
        <h1 className="editorial" style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 64, lineHeight: 0.95, letterSpacing: '-.03em',
          color: T.text, marginBottom: 16,
        }}>
          {headline}
        </h1>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 17, color: T.textDim, lineHeight: 1.5, maxWidth: 620,
        }}>
          {heroStandfirst}
        </div>
      </div>

      {/* ─── NET RESULT + RANKINGS ───
          The centerpiece. Net in 88px Fraunces, green or red. Italic-serif
          context line. To the right, the network rankings block in serif.
          On mobile (className hook), the grid collapses to a single column. */}
      <div className="results-net-block" style={{
        display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28,
        padding: '28px 0 32px', alignItems: 'end',
      }}>
        <div>
          <div className="mono" style={{
            fontSize: 10, color: T.muted,
            letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 6,
          }}>Net · this month</div>
          <div className="results-net-value" style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 144, 'wght' 600",
            fontSize: 88, lineHeight: 0.9, letterSpacing: '-.035em',
            color: netPositive ? T.green : T.red,
          }}>
            {netPositive ? '+' : '−'}{fmtM(Math.abs(net))}
          </div>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 14, color: T.muted, lineHeight: 1.5, marginTop: 10,
            maxWidth: 480,
          }}>
            {netContextLine({ netPositive, fameDelta, fameAfter, hitCount, flopCount })}
          </div>
        </div>
        <div>
          <div className="mono" style={{
            fontSize: 10, color: T.muted,
            letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 12,
          }}>Rankings</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <RankingRow label="Audience" rank={audRank} of={networkCount}
              color={rankColor(audRank, networkCount)} />
            <RankingRow label="Revenue"  rank={revRank} of={networkCount}
              color={rankColor(revRank, networkCount)} />
          </div>
        </div>
      </div>

      {/* ─── STAT ROW ───
          Editorial bordered grid. Each block: small-caps mono label,
          Fraunces value, optional mono sub. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 1, background: T.border,
        borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
        marginBottom: 36,
      }}>
        <StatBlock label="Audience"
          value={`${(totals.audience ?? 0).toFixed(1)}M`} color={T.teal}
          sub={`across ${airings.length} program${airings.length === 1 ? '' : 's'}`} />
        <StatBlock label="Revenue"
          value={fmtM(totals.revenue ?? 0)} color={T.green} />
        <StatBlock label="Costs"
          value={fmtM(totals.cost ?? 0)} color={T.red} />
        <StatBlock label="Fame"
          value={fameAfter.toFixed(1)}
          color={fameDelta >= 0 ? T.gold : T.red}
          sub={`${fameDelta >= 0 ? '+' : ''}${fameDelta.toFixed(1)} · ${fameLabel(fameAfter)}`} />
      </div>

      {/* ─── LEAD STORY ───
          When there's a clear winner (rating ≥ 7), feature it. Otherwise
          a "Worth a look" advisory. Same component, different framing. */}
      {leadStory && <LeadStory story={leadStory} totals={totals} airings={airings} />}

      {/* ─── BULLETINS (milestones) ─── */}
      <MilestonesSection
        starUps={results.starUps || []}
        achievementsUnlocked={results.achievements?.unlocked || []}
        achievementsRecurring={results.achievements?.recurring || []}
      />

      {/* ─── CTA ───
          Solid accent (or quieter cream-on-black for rough months) so the
          game doesn't celebrate a bad result. */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
        <ContinueButton tone={tone} cycleLabel={cycleLabel} onClick={onContinue} />
      </div>

      {/* ─── THE SLATE ─── */}
      {airings.length > 0 && (
        <>
          <SectionHead title="The slate" meta={`${airings.length} program${airings.length === 1 ? '' : 's'}`} />

          <FilterBar
            slotFilter={slotFilter} setSlotFilter={setSlotFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            usedSlots={usedSlots} airings={airings}
          />

          {sorted.length === 0 ? (
            <div style={{
              background: T.surface, border: `1px dashed ${T.borderHi}`,
              borderRadius: 6, padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: FONTS.serif,
                fontVariationSettings: "'opsz' 36, 'wght' 500",
                fontStyle: 'italic',
                fontSize: 16, color: T.textDim,
              }}>
                No programs in this filter.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorted.map((a, i) => (
                <ProgramRow key={a.id || i} airing={a} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Net-result context line — short italic-serif standfirst beneath the big
// number. Picks a sensible phrase based on the tone of the month.
function netContextLine({ netPositive, fameDelta, fameAfter, hitCount, flopCount }) {
  const fameUp   = fameDelta > 0.05
  const fameDown = fameDelta < -0.05
  if (netPositive && hitCount > 0) {
    return `${hitCount === 1 ? 'A strong show carried the slate' : `${hitCount} hits carried the slate`}; ` +
           (fameUp ? `Fame ticked up ${fameDelta.toFixed(1)} to "${fameLabel(fameAfter)}".` : `production costs landed under target.`)
  }
  if (netPositive) {
    return `Revenue squeaked past costs. ${fameUp ? `Fame up ${fameDelta.toFixed(1)}.` : ''}`.trim()
  }
  if (flopCount > 0) {
    return `${flopCount} flop${flopCount > 1 ? 's' : ''} dragged the slate. ${fameDown ? `Fame down ${Math.abs(fameDelta).toFixed(1)} to "${fameLabel(fameAfter)}".` : ''}`.trim()
  }
  return `Costs outran the revenue line. ${fameDown ? `Fame down ${Math.abs(fameDelta).toFixed(1)}.` : ''}`.trim()
}

// Map ranking-position → color: green if top half, gold if #1, red if last.
function rankColor(rank, count) {
  if (count <= 1) return T.text
  if (rank === 1) return T.gold
  if (rank <= Math.ceil(count / 2)) return T.teal
  if (rank === count) return T.red
  return T.muted
}

function RankingRow({ label, rank, of, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <span style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 24, 'wght' 500",
        fontSize: 14, color: T.textDim,
      }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="mono" style={{
          fontSize: 22, color, fontWeight: 700, letterSpacing: '-.01em',
        }}>#{rank}</span>
        <span className="mono" style={{ fontSize: 11, color: T.muted, letterSpacing: '.06em' }}>
          of {of}
        </span>
      </span>
    </div>
  )
}

function StatBlock({ label, value, color, sub }) {
  return (
    <div style={{ background: T.bg, padding: '16px 18px' }}>
      <div className="mono" style={{
        fontSize: 9.5, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 36, 'wght' 600",
        fontSize: 22, letterSpacing: '-.015em',
        color: color || T.text,
      }}>{value}</div>
      {sub && (
        <div className="mono" style={{
          fontSize: 9.5, color: T.muted, marginTop: 4, letterSpacing: '.06em',
        }}>{sub}</div>
      )}
    </div>
  )
}

// ─── LEAD STORY ─────────────────────────────────────────────────────────
function LeadStory({ story, totals, airings }) {
  const isWinner = story.kind === 'winner'
  const stripeColor = isWinner ? T.gold : T.red
  const eyebrowText = isWinner ? 'The Lead Story' : 'Worth a look'

  return (
    <div style={{
      padding: '24px 26px', marginBottom: 36,
      background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
      border: `1px solid ${T.borderHi}`,
      borderLeft: `3px solid ${stripeColor}`,
      borderRadius: 6,
    }}>
      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 20, height: 2,
          background: `linear-gradient(90deg, ${stripeColor} 0%, transparent 100%)`,
        }} />
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
          textTransform: 'uppercase', color: stripeColor,
        }}>
          {eyebrowText}
        </div>
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 96, 'wght' 600",
        fontSize: 28, lineHeight: 1.05, letterSpacing: '-.02em',
        color: T.text, marginBottom: 6,
      }}>
        {story.headline}
      </h2>

      {/* Standfirst — italic serif */}
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 15, color: T.textDim, lineHeight: 1.5, maxWidth: 620,
      }}>
        {story.standfirst}
      </div>

      {/* Pill row — depends on winner vs rough */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {isWinner && story.airing ? (
          <>
            <LeadPill color={ratingPillColor(story.airing.rating)}>
              {story.airing.rating?.toFixed(1)} {(ratingLabel(story.airing.rating) || '').toUpperCase()}
            </LeadPill>
            {story.airing.audience > 0 && (
              <LeadPill color={T.teal}>{story.airing.audience.toFixed(1)}M VIEWERS</LeadPill>
            )}
            {story.airing.slotRank > 0 && story.airing.slotTotal > 1 && (
              <LeadPill color={T.gold}>
                #{story.airing.slotRank} OF {story.airing.slotTotal} IN SLOT
              </LeadPill>
            )}
          </>
        ) : (
          <>
            {story.flopCount > 0 && (
              <LeadPill color={T.red}>
                {story.flopCount} FLOP{story.flopCount > 1 ? 'S' : ''}
              </LeadPill>
            )}
            {story.airing && (
              <LeadPill color={T.gold}>BEST {story.airing.rating?.toFixed(1)}</LeadPill>
            )}
            <LeadPill color={T.teal}>
              {(totals.audience ?? 0).toFixed(1)}M TOTAL
            </LeadPill>
          </>
        )}
      </div>
    </div>
  )
}

function LeadPill({ color, children }) {
  return (
    <span className="mono" style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
      padding: '4px 10px', borderRadius: 3,
      background: color + '18',
      color: color,
      border: `1px solid ${color}66`,
    }}>{children}</span>
  )
}

// Rating-tier color for pills. (engine.ratingLabelColor takes a T object;
// I'm wrapping for clarity.)
function ratingPillColor(rating) {
  return ratingLabelColor(rating, T)
}

// ─── PROGRAM ROW (THE SLATE) ───────────────────────────────────────────
function ProgramRow({ airing: a }) {
  const cat = CATEGORIES[a.categoryId]
  const slot = SLOT_TYPES[a.slotTypeId] || SLOT_TYPES.prime
  const league = a.sportsRunLeagueId ? findLeague(a.sportsRunLeagueId) : null
  const ratingColor = ratingLabelColor(a.rating, T)
  const ratingLbl   = ratingLabel(a.rating)
  const profit = (a.revenue || 0) - (a.cost || 0)
  const profitColor = profit >= 0 ? T.green : T.red
  const isMovie = !!a.movieId
  const isSports = !!a.sportsRunLeagueId
  const catColor = cat?.color || T.accent

  const slugline = isMovie  ? 'Movie · licensed feature'
                 : isSports ? `${league?.label || 'Sports'} · live coverage`
                 :            (cat?.label || a.categoryId || 'Program')

  // Slot rank tier — drives color of the # value
  const rankTier = a.slotRank === 1 ? 'gold'
                 : a.slotRank === 2 ? 'silver'
                 : a.slotRank <= Math.ceil(a.slotTotal / 2) ? 'muted'
                 : 'red'
  const rankColors = {
    gold:   T.gold,
    silver: T.text,
    muted:  T.muted,
    red:    T.red,
  }

  return (
    <div className="results-program-row" style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      gap: 18, alignItems: 'center',
      padding: '14px 16px',
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${catColor}`,
      borderRadius: 5,
    }}>
      {/* SLOT — icon + label stacked, centered. Hidden on mobile (moves
          to a slug line in INFO via CSS). */}
      <div className="rp-slot" style={{ textAlign: 'center', minWidth: 56 }}>
        <div style={{ fontSize: 18, lineHeight: 1 }}>{slot.icon}</div>
        <div className="mono" style={{
          fontSize: 8.5, color: T.muted,
          letterSpacing: '.12em', textTransform: 'uppercase',
          marginTop: 4, lineHeight: 1,
        }}>{slot.label}</div>
      </div>

      {/* INFO — name + slug + stat pills */}
      <div className="rp-info" style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 600",
          fontSize: 17, letterSpacing: '-.01em', color: T.text,
          marginBottom: 3,
          display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
        }}>
          {a.name || 'Untitled'}
          {a.isFinale && (
            <span className="mono" style={{
              fontSize: 9, color: T.gold, fontWeight: 700,
              padding: '2px 7px', borderRadius: 3,
              background: T.gold + '14', border: `1px solid ${T.gold}66`,
              letterSpacing: '.14em', textTransform: 'uppercase',
            }}>Finale</span>
          )}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 12.5, color: T.muted, marginBottom: 8, lineHeight: 1.4,
        }}>
          {slugline}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StatPill label="Q" value={(a.quality || 0).toFixed(1)} color={T.qEnd} />
          <StatPill label="H" value={(a.hype || 0).toFixed(1)}    color={T.gold} />
          <StatPill              value={`${(a.audience || 0).toFixed(1)}M`} color={T.teal}  bare />
          <StatPill              value={`${fmtM(a.revenue || 0)} REV`} bare />
          <StatPill              value={`${profit >= 0 ? '+' : '−'}${fmtM(Math.abs(profit))}`}
                                 color={profitColor} bare emphatic />
        </div>
      </div>

      {/* SLOT RANK — Fraunces # + mono "of N" */}
      {a.slotRank > 0 && a.slotTotal > 1 ? (
        <div className="rp-rank" style={{ textAlign: 'center', minWidth: 72 }}>
          <div className="rp-rank-num" style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 36, 'wght' 600",
            fontSize: 24, lineHeight: 1, letterSpacing: '-.02em',
            color: rankColors[rankTier],
          }}>
            {rankTier === 'gold' ? '🏆 ' : ''}#{a.slotRank}
          </div>
          <div className="rp-rank-label mono" style={{
            fontSize: 8.5, color: T.muted,
            letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 5,
          }}>
            of {a.slotTotal}
          </div>
        </div>
      ) : <div className="rp-rank" style={{ minWidth: 72 }} />}

      {/* RATING — big Fraunces score + label */}
      <div className="rp-rating" style={{ textAlign: 'right', minWidth: 80 }}>
        <div className="score" style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 96, 'wght' 600",
          fontSize: 32, lineHeight: 1, letterSpacing: '-.025em',
          color: ratingColor,
        }}>
          {(a.rating ?? 0).toFixed(1)}
        </div>
        {ratingLbl && (
          <div className="mono" style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '.14em',
            textTransform: 'uppercase', marginTop: 5, color: ratingColor,
          }}>
            {ratingLbl}
          </div>
        )}
      </div>
    </div>
  )
}

/** Stat pill on a program row. Three flavors:
 *  - `bare`: just the value (used for Aud, Rev, Margin)
 *  - default: label + space + value (used for Q, H)
 *  - `emphatic`: bolder background tint (used for Margin) */
function StatPill({ label, value, color, bare, emphatic }) {
  const c = color || T.text
  return (
    <span className="mono" style={{
      fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em',
      padding: '2px 8px', borderRadius: 3,
      background: emphatic ? c + '18' : (color ? c + '12' : 'transparent'),
      color: c,
      border: `1px solid ${color ? c + '55' : T.border}`,
    }}>
      {label && <span style={{ opacity: 0.7, marginRight: 3 }}>{label}</span>}
      {value}
    </span>
  )
}

// ─── SECTION HEAD (reused pattern from Operations) ─────────────────────
function SectionHead({ title, meta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 16, paddingBottom: 10, position: 'relative',
    }}>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 500",
        fontSize: 24, letterSpacing: '-.01em', color: T.text,
      }}>
        {title}
      </div>
      {meta && (
        <div className="mono" style={{
          fontSize: 10, color: T.muted,
          letterSpacing: '.08em', textTransform: 'uppercase',
        }}>
          {meta}
        </div>
      )}
      <div className="gradient-rule" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
      }} />
    </div>
  )
}

// ─── FILTER + SORT BAR ─────────────────────────────────────────────────
function FilterBar({ slotFilter, setSlotFilter, sortBy, setSortBy, usedSlots, airings }) {
  return (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center',
      flexWrap: 'wrap', paddingBottom: 12, borderBottom: `1px solid ${T.border}`,
    }}>
      <span className="mono" style={{
        fontSize: 9.5, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase', marginRight: 4,
      }}>Filter</span>
      <Chip label={`All (${airings.length})`}
        active={slotFilter === 'all'} onClick={() => setSlotFilter('all')} />
      {usedSlots.map(sid => {
        const slot = SLOT_TYPES[sid] || { label: sid, icon: '·' }
        const count = airings.filter(a => a.slotTypeId === sid).length
        return (
          <Chip key={sid}
            label={`${slot.icon} ${slot.label} (${count})`}
            active={slotFilter === sid}
            onClick={() => setSlotFilter(sid)} />
        )
      })}
      <span className="mono" style={{
        fontSize: 9.5, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase',
        marginLeft: 'auto', marginRight: 4,
      }}>Sort</span>
      {SORT_OPTIONS.map(o => (
        <Chip key={o.id} label={o.label}
          active={sortBy === o.id} onClick={() => setSortBy(o.id)} />
      ))}
    </div>
  )
}

function Chip({ label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active ? T.accent : 'transparent',
        border: `1px solid ${active ? T.accent : (hover ? T.borderHi : T.border)}`,
        color: active ? T.bg : (hover ? T.text : T.muted),
        padding: '5px 11px', borderRadius: 3,
        fontSize: 10, fontWeight: 600,
        letterSpacing: '.08em', textTransform: 'uppercase',
        fontFamily: FONTS.sans,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background .15s, border-color .15s, color .15s',
      }}
    >{label}</button>
  )
}

// ─── CONTINUE CTA ──────────────────────────────────────────────────────
// Tone-aware: solid accent for celebratory months, cream-on-black for
// rough ones so the game doesn't feel like it's celebrating a bad result.
function ContinueButton({ tone, cycleLabel, onClick }) {
  const [hover, setHover] = useState(false)
  const isRough = tone === 'rough'
  // The next cycle label: roughly opposite of cycleLabel. We don't actually
  // know what's next from props, so we keep the CTA copy neutral.
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        padding: '16px 22px',
        background: isRough
          ? (hover ? T.textDim : T.text)
          : (hover ? T.accentHi : T.accent),
        color: T.bg,
        border: 'none', borderRadius: 4,
        fontFamily: FONTS.sans,
        fontSize: 12, fontWeight: 700,
        letterSpacing: '.18em', textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background .15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}
    >
      <span>Continue</span>
      <span style={{ fontSize: 16, letterSpacing: 0, lineHeight: 1 }}>→</span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────
// MILESTONES (now: BULLETINS)
// ─────────────────────────────────────────────────────────────────────
// Same three classes as before — star-ups, unlocked achievements,
// recurring events — but reframed as a list of newspaper bulletins
// rather than a celebratory "milestones this month" gold box.
function MilestonesSection({ starUps, achievementsUnlocked, achievementsRecurring }) {
  const total = (starUps?.length || 0)
              + (achievementsUnlocked?.length || 0)
              + (achievementsRecurring?.length || 0)
  if (total === 0) return null

  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHead title="Bulletins" meta={`${total} this month`} />
      <div style={{ display: 'grid', gap: 8 }}>
        {/* Star-ups */}
        {(starUps || []).map((s, i) => {
          const cat = CATEGORIES[s.categoryId]
          return (
            <Bulletin
              key={`star-${i}`}
              marker="★"
              variant="star"
              title={`Specialty up · ${cat?.label || s.categoryId}`}
              desc={`Now ${s.newStars.toFixed(1)}★ — your productions in this genre get bigger quality and hype bonuses.`}
            />
          )
        })}

        {/* Unlocked achievements */}
        {(achievementsUnlocked || []).map((u, i) => (
          <Bulletin
            key={`ach-${i}`}
            marker={u.achievement.icon}
            variant={u.achievement.tone === 'silver' ? 'silver' : 'gold'}
            title={u.achievement.title}
            desc={u.achievement.desc}
            context={u.context?.programName}
          />
        ))}

        {/* Recurring events */}
        {(achievementsRecurring || []).map((r, i) => (
          <Bulletin
            key={`rec-${i}`}
            marker={r.achievement.icon}
            variant="gold"
            title={r.achievement.title}
            desc={
              r.context?.programName
                ? `"${r.context.programName}" reached ${r.context.audience?.toFixed(1) || '?'}M viewers — leading the market.`
                : r.achievement.desc
            }
          />
        ))}
      </div>
    </div>
  )
}

function Bulletin({ marker, variant, title, desc, context }) {
  // variant → stripe + marker tile color
  const color = variant === 'star'   ? T.accent
              : variant === 'silver' ? T.textDim
              :                        T.gold
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 16px',
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 5,
    }}>
      <div style={{
        flexShrink: 0,
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15,
        background: color + '1a',
        border: `1px solid ${color}66`,
        borderRadius: 4,
        marginTop: 2,
        color: color,
      }}>{marker}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 24, 'wght' 600",
          fontSize: 15, color: T.text, letterSpacing: '-.005em',
          marginBottom: 3,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 12.5, color: T.muted, lineHeight: 1.5,
        }}>
          {desc}
          {context && (
            <span className="mono" style={{
              fontStyle: 'normal',
              color: T.textDim,
              fontSize: 11,
              marginLeft: 6,
            }}>
              — "{context}"
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
