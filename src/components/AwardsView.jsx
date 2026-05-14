import { useState } from 'react'
import { T, FONTS } from '../theme.js'
import { MARKETS, MARKET_ORDER } from '../constants.js'
import { canPromote, fmtM } from '../engine.js'
import { play as playSound } from '../audio.js'

/**
 * Awards Ceremony — multi-step presentation.
 *
 * Step machine:
 *   'welcome'           → hero + host card
 *   'category_N'        → show nominees for category index N
 *   'category_N_winner' → reveal winner for category index N
 *   'networks_summary'  → bar chart of awards per network
 *   'personal_summary'  → player's nominations + wins + fame gain + expansion offer
 *
 * Sound cues kept identical to v1:
 *   - playSound('confirm') on winner reveals + summaries
 *   - playSound('tap') on category advance
 *
 * Editorial migration (stage AM):
 *   The Anton "🏆 THE GOLDEN ANTENNAS" display title was the screen's
 *   signature flourish but didn't fit the editorial system. It's been
 *   replaced with Fraunces 56px display + accent eyebrow + italic-serif
 *   subhead. The purple→gold ContinueButton gradient is gone — replaced
 *   by the standard outline-fills accent CTA. The HostIntro purple-gold
 *   gradient card becomes a gradient-surface editorial card with a gold
 *   stripe. NomineeRow's winning glow (scale 1.02 + box-shadow) preserved.
 */
export function AwardsView({ awards, station, year, onContinue, onPromote }) {
  // Build the linear sequence of steps based on what awards exist this year.
  const allAwards = [
    ...(awards.categories || []),
    ...(awards.fanFavorite ? [awards.fanFavorite] : []),
  ]
  const stepsList = [
    'welcome',
    ...allAwards.flatMap((_, i) => [`category_${i}`, `category_${i}_winner`]),
    'networks_summary',
    'personal_summary',
  ]
  const [stepIdx, setStepIdx] = useState(0)
  const currentStep = stepsList[stepIdx]

  const advance = () => {
    const next = stepIdx + 1
    if (next >= stepsList.length) return
    const nextStep = stepsList[next]
    if (nextStep.endsWith('_winner')) playSound('confirm')
    else if (nextStep === 'networks_summary' || nextStep === 'personal_summary') playSound('confirm')
    else playSound('tap')
    setStepIdx(next)
  }

  // ── WELCOME ─────────────────────────────────────────────────────────
  if (currentStep === 'welcome') {
    return (
      <Stage>
        <CeremonyHero year={year} marketLabel={awards.marketLabel} />
        <HostIntro host={awards.host} />
        <ContinueButton tone="primary" onClick={advance}>
          {allAwards.length > 0 ? 'Go to first award' : 'Continue'}
        </ContinueButton>
      </Stage>
    )
  }

  // ── CATEGORY / WINNER ───────────────────────────────────────────────
  if (currentStep.startsWith('category_')) {
    const parts = currentStep.split('_')
    const catIdx = parseInt(parts[1], 10)
    const award = allAwards[catIdx]
    const showingWinner = parts[2] === 'winner'
    const isLastAward = catIdx === allAwards.length - 1
    const nextLabel = showingWinner
      ? (isLastAward ? 'See network results' : 'Next award')
      : 'And the winner is…'

    return (
      <Stage>
        <CeremonyHero year={year} marketLabel={awards.marketLabel} compact />
        <AwardCard
          award={award}
          showingWinner={showingWinner}
          catIdx={catIdx}
          totalAwards={allAwards.length}
        />
        <ContinueButton tone="primary" onClick={advance}>{nextLabel}</ContinueButton>
      </Stage>
    )
  }

  // ── NETWORKS SUMMARY ────────────────────────────────────────────────
  if (currentStep === 'networks_summary') {
    return (
      <Stage>
        <CeremonyHero year={year} marketLabel={awards.marketLabel} compact />
        <NetworksSummary networkSummary={awards.networkSummary || []} />
        <ContinueButton tone="primary" onClick={advance}>Your year</ContinueButton>
      </Stage>
    )
  }

  // ── PERSONAL SUMMARY (final) ────────────────────────────────────────
  return (
    <Stage>
      <CeremonyHero year={year} marketLabel={awards.marketLabel} compact />
      <PersonalSummary
        awards={awards}
        station={station}
        onPromote={onPromote}
        onContinue={onContinue}
        year={year}
      />
    </Stage>
  )
}

// ─── STAGE WRAPPER ────────────────────────────────────────────────────
function Stage({ children }) {
  return (
    <div className="view-wrap ani" style={{
      maxWidth: 820, margin: '0 auto', padding: '36px 24px 60px',
    }}>
      {children}
    </div>
  )
}

// ─── CEREMONY HERO ────────────────────────────────────────────────────
// The signature flourish of the screen. Compact variant on every step
// after welcome so the title doesn't dominate downstream cards.
function CeremonyHero({ year, marketLabel, compact }) {
  return (
    <div style={{
      textAlign: 'center',
      marginBottom: compact ? 28 : 40,
      paddingTop: compact ? 0 : 8,
    }}>
      {/* Centered gold rule — narrower than the left-aligned screens */}
      <div style={{
        width: 48, height: 2, margin: '0 auto 16px',
        background: `linear-gradient(90deg, transparent 0%, ${T.gold} 50%, transparent 100%)`,
      }} />
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.24em',
        textTransform: 'uppercase', color: T.gold, marginBottom: 14,
      }}>
        Year {year} · {marketLabel} · The Golden Antennas
      </div>
      <h1 className="editorial" style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 600",
        fontSize: compact ? 36 : 56,
        lineHeight: 0.95, letterSpacing: '-.03em',
        color: T.text, marginBottom: compact ? 0 : 14,
        textShadow: compact ? 'none' : `0 0 60px ${T.gold}22`,
      }}>
        {compact ? 'Tonight at the Antennas' : 'A night for the work.'}
      </h1>
      {!compact && (
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 16, color: T.textDim, lineHeight: 1.5,
          maxWidth: 540, margin: '0 auto',
        }}>
          The {marketLabel} broadcasters gather. {year} comes to a close.
        </div>
      )}
    </div>
  )
}

// ─── HOST CARD ────────────────────────────────────────────────────────
function HostIntro({ host }) {
  return (
    <div style={{
      padding: '26px 24px', marginBottom: 28,
      background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
      border: `1px solid ${T.gold}55`,
      borderLeft: `3px solid ${T.gold}`,
      borderRadius: 6,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
        textTransform: 'uppercase', color: T.gold, marginBottom: 14,
      }}>
        Tonight's host
      </div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 600",
        fontSize: 32, lineHeight: 1, letterSpacing: '-.02em',
        color: T.text, marginBottom: 10,
      }}>
        {host.name}
      </div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 14, color: T.textDim, lineHeight: 1.5,
        maxWidth: 420, margin: '0 auto',
      }}>
        {host.vibe} — welcoming nominees and presenting tonight's awards.
      </div>
    </div>
  )
}

// ─── AWARD CARD ───────────────────────────────────────────────────────
function AwardCard({ award, showingWinner, catIdx, totalAwards }) {
  return (
    <div style={{
      padding: '28px 24px', marginBottom: 24,
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.gold}66`,
      borderLeft: `3px solid ${T.gold}`,
      borderRadius: 6,
    }}>
      {/* Progress pill — mono caps */}
      <div className="mono" style={{
        display: 'inline-block',
        fontSize: 9.5, fontWeight: 700,
        padding: '3px 10px', borderRadius: 3,
        background: T.surface, border: `1px solid ${T.borderHi}`,
        color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase',
        marginBottom: 20,
      }}>
        Award {catIdx + 1} of {totalAwards}
      </div>

      {/* Category icon + Fraunces title */}
      <div style={{ fontSize: 32, marginBottom: 6, lineHeight: 1 }}>{award.icon}</div>
      <h2 style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 600",
        fontSize: 28, lineHeight: 1.05, letterSpacing: '-.02em',
        color: T.text, marginBottom: 22,
      }}>
        {award.label}
      </h2>

      {/* Section eyebrow */}
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
        textTransform: 'uppercase',
        color: showingWinner ? T.gold : T.accent,
        marginBottom: 12,
      }}>
        {showingWinner ? 'And the winner is…' : 'The nominees'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {award.nominees.map(nom => {
          const isWinner = showingWinner && nom.key === award.winnerKey
          return (
            <NomineeRow
              key={nom.key}
              nominee={nom}
              isWinner={isWinner}
              showingWinner={showingWinner}
            />
          )
        })}
      </div>

      {/* Footer with bonus, only when winner is revealed */}
      {showingWinner && (
        <div style={{
          marginTop: 22, padding: '12px 16px',
          background: `linear-gradient(90deg, ${T.gold}18 0%, transparent 80%)`,
          borderLeft: `2px solid ${T.gold}`,
          borderRadius: 3,
        }}>
          <div className="mono" style={{
            fontSize: 10.5, fontWeight: 700,
            letterSpacing: '.12em', textTransform: 'uppercase',
            color: T.gold,
          }}>
            +{award.fameBonus.toFixed(1)} fame · +{fmtM(award.cashBonus)} to the winning network
          </div>
        </div>
      )}
    </div>
  )
}

function NomineeRow({ nominee, isWinner, showingWinner }) {
  const playerHighlight = nominee.isPlayer
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: isWinner
        ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
        : (playerHighlight
            ? `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`
            : T.surface),
      border: isWinner ? `2px solid ${T.gold}`
                       : playerHighlight ? `1px solid ${T.accent}55`
                       : `1px solid ${T.border}`,
      borderRadius: 5,
      transition: 'all .35s ease',
      transform: isWinner ? 'scale(1.02)' : 'scale(1)',
      // Winner glow — preserved from v1
      boxShadow: isWinner ? `0 0 32px ${T.gold}55` : 'none',
    }}>
      {/* Marker — 🏆 winner, · revealed-not-winner, ○ nominee */}
      <div style={{
        width: 28, textAlign: 'center', fontSize: isWinner ? 20 : 16, lineHeight: 1,
        flexShrink: 0,
      }}>
        {isWinner ? '🏆' : (showingWinner ? '·' : '○')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 600",
          fontSize: 16, letterSpacing: '-.01em',
          color: isWinner ? T.gold : T.text,
          marginBottom: 2,
          display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>{nominee.programName}</span>
          {playerHighlight && (
            <span className="mono" style={{
              fontSize: 9, color: T.accent, fontWeight: 700,
              padding: '1px 7px', borderRadius: 3,
              background: T.accent + '14', border: `1px solid ${T.accent}66`,
              letterSpacing: '.14em', textTransform: 'uppercase',
            }}>You</span>
          )}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 12, color: T.muted,
        }}>
          {nominee.stationName}
        </div>
      </div>
    </div>
  )
}

// ─── NETWORKS SUMMARY ─────────────────────────────────────────────────
function NetworksSummary({ networkSummary }) {
  const maxAwards = Math.max(1, ...networkSummary.map(n => n.awardCount))

  return (
    <div style={{
      padding: '24px 22px', marginBottom: 24,
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.gold}`,
      borderRadius: 6,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
        textTransform: 'uppercase', color: T.gold, marginBottom: 12,
        textAlign: 'center',
      }}>
        Tonight's tally
      </div>
      <h2 style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 600",
        fontSize: 26, lineHeight: 1.05, letterSpacing: '-.02em',
        color: T.text, marginBottom: 6, textAlign: 'center',
      }}>
        Awards by network
      </h2>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 13, color: T.textDim, marginBottom: 22, lineHeight: 1.5,
        textAlign: 'center',
      }}>
        Awards taken home tonight.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {networkSummary.map(n => {
          const pct = (n.awardCount / maxAwards) * 100
          const isPlayer = n.isPlayer
          const barColor = isPlayer ? T.gold : T.textDim
          return (
            <div key={n.stationId} style={{
              padding: '12px 14px',
              background: isPlayer
                ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
                : T.surface,
              border: isPlayer ? `1px solid ${T.gold}55` : `1px solid ${T.border}`,
              borderLeft: `3px solid ${isPlayer ? T.gold : 'transparent'}`,
              borderRadius: 5,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                gap: 12, marginBottom: 8,
              }}>
                <div style={{
                  fontFamily: FONTS.serif,
                  fontVariationSettings: "'opsz' 24, 'wght' 600",
                  fontSize: 15, letterSpacing: '-.005em',
                  color: T.text, minWidth: 0,
                  display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
                }}>
                  <span>{n.stationName}</span>
                  {isPlayer && (
                    <span className="mono" style={{
                      fontSize: 9, color: T.gold, fontWeight: 700,
                      padding: '1px 7px', borderRadius: 3,
                      background: T.gold + '14', border: `1px solid ${T.gold}66`,
                      letterSpacing: '.14em', textTransform: 'uppercase',
                    }}>You</span>
                  )}
                </div>
                <div className="mono" style={{
                  fontSize: 14, fontWeight: 700,
                  color: n.awardCount > 0 ? T.gold : T.muted,
                  letterSpacing: '-.01em', flexShrink: 0,
                }}>
                  {n.awardCount} {n.awardCount === 1 ? 'award' : 'awards'}
                </div>
              </div>
              {/* Gradient progress bar */}
              <div style={{
                height: 4, background: T.border, borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${barColor}aa 0%, ${barColor} 100%)`,
                  borderRadius: 2,
                  transition: 'width .6s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── PERSONAL SUMMARY ─────────────────────────────────────────────────
function PersonalSummary({ awards, station, onPromote, onContinue, year }) {
  const playerNominations = awards.playerNominations || []
  const playerAwardsWon = awards.playerAwardsWon || []
  const totalFame = awards.totalFameGain || 0
  const totalCash = awards.totalCashGain || 0

  const promotable = canPromote(station)
  const idx = MARKET_ORDER.indexOf(station.market)
  const nextMarket = idx < MARKET_ORDER.length - 1 ? MARKETS[MARKET_ORDER[idx + 1]] : null
  const expansionCost = nextMarket?.promoteCost || 0
  const canAffordExpansion = station.cash >= expansionCost

  // Adaptive headline based on the night's outcome
  const headline = playerAwardsWon.length >= 3 ? 'A golden night.'
                 : playerAwardsWon.length >= 1 ? `${playerAwardsWon.length === 1 ? 'A win.' : `${playerAwardsWon.length} wins.`}`
                 : playerNominations.length > 0 ? 'Nominated, no wins.'
                 :                               'No nominations this year.'
  const headlineColor = playerAwardsWon.length > 0 ? T.gold : T.text

  return (
    <>
      {/* ─── HERO PERSONAL CARD ─── */}
      <div style={{
        padding: '32px 26px', marginBottom: 26,
        background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
        border: `1px solid ${playerAwardsWon.length > 0 ? T.gold : T.borderHi}`,
        borderLeft: `3px solid ${playerAwardsWon.length > 0 ? T.gold : T.accent}`,
        borderRadius: 6,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.24em',
          textTransform: 'uppercase',
          color: playerAwardsWon.length > 0 ? T.gold : T.accent,
          marginBottom: 14,
        }}>
          Your year
        </div>
        {playerAwardsWon.length > 0 && (
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14 }}>🏆</div>
        )}
        <h2 style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 600",
          fontSize: 40, lineHeight: 1, letterSpacing: '-.025em',
          color: headlineColor, marginBottom: 10,
          textShadow: playerAwardsWon.length > 0 ? `0 0 40px ${T.gold}33` : 'none',
        }}>
          {headline}
        </h2>
        {playerNominations.length > 0 && playerAwardsWon.length === 0 && (
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 14, color: T.textDim, marginTop: 4,
          }}>
            {playerNominations.length} nomination{playerNominations.length === 1 ? '' : 's'}, but the room went elsewhere.
          </div>
        )}

        {/* Fame + cash gain stat row — editorial bordered grid */}
        {(totalFame > 0 || totalCash > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 1, background: T.border,
            borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
            marginTop: 24,
          }}>
            {totalFame > 0 && (
              <SummaryStat label="Fame gain"  value={`+${totalFame.toFixed(1)}`} color={T.gold} />
            )}
            {totalCash > 0 && (
              <SummaryStat label="Cash bonus" value={`+${fmtM(totalCash)}`} color={T.green} />
            )}
          </div>
        )}
      </div>

      {/* ─── NOMINATIONS LIST ─── */}
      {playerNominations.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <SectionHead title="Your nominations" meta={`${playerNominations.length} this year`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {playerNominations.map((n, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: n.won
                  ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
                  : `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
                border: `1px solid ${n.won ? T.gold + '66' : T.border}`,
                borderLeft: `3px solid ${n.won ? T.gold : T.borderHi}`,
                borderRadius: 5,
              }}>
                <div style={{
                  width: 28, textAlign: 'center', fontSize: n.won ? 18 : 14, lineHeight: 1,
                  flexShrink: 0,
                }}>
                  {n.won ? '🏆' : '○'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: FONTS.serif,
                    fontVariationSettings: "'opsz' 36, 'wght' 600",
                    fontSize: 15, letterSpacing: '-.005em',
                    color: n.won ? T.gold : T.text,
                    marginBottom: 2,
                  }}>
                    {n.programName}
                  </div>
                  <div style={{
                    fontFamily: FONTS.serif,
                    fontVariationSettings: "'opsz' 14, 'wght' 400",
                    fontStyle: 'italic',
                    fontSize: 12, color: T.muted,
                  }}>
                    {n.categoryLabel}
                    {n.won && (
                      <span className="mono" style={{
                        fontStyle: 'normal', color: T.gold,
                        fontSize: 10, fontWeight: 700,
                        marginLeft: 8, letterSpacing: '.14em',
                      }}>· WINNER</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── EXPANSION OFFER ─── */}
      {promotable && nextMarket && (
        <div style={{
          padding: '22px 22px', marginBottom: 26,
          background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
          border: `1px solid ${T.teal}55`,
          borderLeft: `3px solid ${T.teal}`,
          borderRadius: 6,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
            textTransform: 'uppercase', color: T.teal, marginBottom: 14,
          }}>
            Expansion opportunity
          </div>
          <h3 style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 96, 'wght' 600",
            fontSize: 22, lineHeight: 1.1, letterSpacing: '-.015em',
            color: T.text, marginBottom: 10,
          }}>
            You're ready for {nextMarket.label}.
          </h3>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 14, color: T.textDim, lineHeight: 1.55, marginBottom: 16,
          }}>
            You've reached the fame threshold to graduate. A bigger market, bigger budgets, bigger viewers — and tighter margins.
          </div>

          {/* Stat grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 1, background: T.border,
            borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
            marginBottom: 14,
          }}>
            <ExpansionStat label="One-time cost"    value={fmtM(expansionCost)}                color={canAffordExpansion ? T.text : T.red} />
            <ExpansionStat label="Monthly infra"    value={`${fmtM(nextMarket.monthlyInfra)}/mo`} color={T.text} />
            <ExpansionStat label="Production cost"  value={`×${nextMarket.prodCostMult.toFixed(2)}`} color={T.text} />
            <ExpansionStat label="Revenue / viewer" value={`$${nextMarket.revPerViewer.toFixed(1)}`} color={T.green} />
          </div>

          {/* Warning callout — italic-serif on dashed gold */}
          <div style={{
            padding: '10px 14px', marginBottom: 16,
            background: T.gold + '0c',
            borderLeft: `2px solid ${T.gold}`,
            borderRadius: 3,
          }}>
            <div className="mono" style={{
              fontSize: 9, fontWeight: 700,
              letterSpacing: '.16em', textTransform: 'uppercase',
              color: T.gold, marginBottom: 4,
            }}>
              Heads up · specialization reset
            </div>
            <div style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 14, 'wght' 400",
              fontStyle: 'italic',
              fontSize: 12.5, color: T.textDim, lineHeight: 1.5,
            }}>
              Only your specialty (min 0.5★) and any genre at 4★+ (kept at 1★) carry over.
            </div>
          </div>

          {/* Expansion button — outline-fills teal, or red dashed if can't afford */}
          <ExpandButton
            canAfford={canAffordExpansion}
            cost={expansionCost}
            cash={station.cash}
            onClick={onPromote}
          />
        </div>
      )}

      {/* Final continue */}
      <ContinueButton tone="primary" onClick={onContinue}>
        Begin Year {year + 1}
      </ContinueButton>
    </>
  )
}

// ─── ATOMIC COMPONENTS ────────────────────────────────────────────────

/** SectionHead — Fraunces + mono meta + gradient-rule. */
function SectionHead({ title, meta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 16, paddingBottom: 10, position: 'relative',
    }}>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 500",
        fontSize: 22, letterSpacing: '-.01em', color: T.text,
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

/** SummaryStat — for fame/cash gain row at top of personal summary. */
function SummaryStat({ label, value, color }) {
  return (
    <div style={{ background: T.bg, padding: '14px 16px', textAlign: 'left' }}>
      <div className="mono" style={{
        fontSize: 9.5, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 96, 'wght' 600",
        fontSize: 24, letterSpacing: '-.02em',
        color: color || T.text,
      }}>{value}</div>
    </div>
  )
}

/** ExpansionStat — for the expansion-offer detail grid. */
function ExpansionStat({ label, value, color }) {
  return (
    <div style={{ background: T.bg, padding: '12px 14px' }}>
      <div className="mono" style={{
        fontSize: 9, color: T.muted,
        letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 36, 'wght' 600",
        fontSize: 17, letterSpacing: '-.01em',
        color: color || T.text,
      }}>{value}</div>
    </div>
  )
}

/** Outline-fills-teal expansion button, or red dashed disabled state. */
function ExpandButton({ canAfford, cost, cash, onClick }) {
  const [hover, setHover] = useState(false)
  if (!canAfford) {
    return (
      <div style={{
        padding: '12px 16px',
        background: T.surface,
        border: `1px dashed ${T.red}55`,
        borderRadius: 4,
        textAlign: 'center',
      }}>
        <div className="mono" style={{
          fontSize: 11, color: T.red, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase',
        }}>
          Need {fmtM(cost)} · have {fmtM(cash)}
        </div>
      </div>
    )
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        padding: '14px 18px',
        background: hover ? T.teal : 'transparent',
        color: hover ? T.bg : T.teal,
        border: `1px solid ${T.teal}`,
        borderRadius: 4,
        fontFamily: FONTS.sans,
        fontSize: 12, fontWeight: 700,
        letterSpacing: '.18em', textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background .15s, color .15s',
      }}
    >
      Expand for {fmtM(cost)}
    </button>
  )
}

/** Editorial CTA — replaces v1's purple→gold Anton gradient. Solid accent
 *  for "primary" tone (forward progression). */
function ContinueButton({ tone = 'primary', onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '16px 22px',
        background: hover ? T.accentHi : T.accent,
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
      <span>{children}</span>
      <span style={{ fontSize: 16, letterSpacing: 0, lineHeight: 1 }}>→</span>
    </button>
  )
}
