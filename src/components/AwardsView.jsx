import { useState } from 'react'
import { T } from '../theme.js'
import { MARKETS, MARKET_ORDER } from '../constants.js'
import { canPromote, fmtM } from '../engine.js'
import { play as playSound } from '../audio.js'

/**
 * Awards Ceremony — multi-step presentation.
 *
 * Step machine:
 *   'welcome'           → big intro with host
 *   'category_N'        → show nominees for category index N
 *   'category_N_winner' → reveal winner for category index N
 *   'networks_summary'  → bar chart of awards per network
 *   'personal_summary'  → player's nominations + wins + fame gain + expansion offer
 */
export function AwardsView({ awards, station, year, onContinue, onPromote }) {
  // Build the linear sequence of steps based on what awards exist this year.
  // Fan favorite is appended to categories so the loop handles it uniformly.
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
        <CeremonyHeader year={year} marketLabel={awards.marketLabel} />
        <HostIntro host={awards.host} />
        <ContinueButton onClick={advance}>
          {allAwards.length > 0 ? 'Go to First Award ▸' : 'Continue ▸'}
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
      ? (isLastAward ? 'See Network Results ▸' : 'Next Award ▸')
      : 'And the winner is… ▸'

    return (
      <Stage>
        <CeremonyHeader year={year} marketLabel={awards.marketLabel} compact />
        <AwardCard
          award={award}
          showingWinner={showingWinner}
          catIdx={catIdx}
          totalAwards={allAwards.length}
        />
        <ContinueButton onClick={advance}>{nextLabel}</ContinueButton>
      </Stage>
    )
  }

  // ── NETWORKS SUMMARY ────────────────────────────────────────────────
  if (currentStep === 'networks_summary') {
    return (
      <Stage>
        <CeremonyHeader year={year} marketLabel={awards.marketLabel} compact />
        <NetworksSummary networkSummary={awards.networkSummary || []} />
        <ContinueButton onClick={advance}>Your Year ▸</ContinueButton>
      </Stage>
    )
  }

  // ── PERSONAL SUMMARY (final) ────────────────────────────────────────
  return (
    <Stage>
      <CeremonyHeader year={year} marketLabel={awards.marketLabel} compact />
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

// ─── STAGE / HEADER / HOST ───────────────────────────────────────────────────

function Stage({ children }) {
  return (
    <div className="view-wrap ani" style={{
      maxWidth: 760, margin: '0 auto', padding: '36px 20px 60px',
    }}>
      {children}
    </div>
  )
}

function CeremonyHeader({ year, marketLabel, compact }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: compact ? 24 : 36 }}>
      <div className="mono" style={{
        fontSize: 11, color: T.muted, letterSpacing: '.2em', textTransform: 'uppercase',
      }}>
        Year {year} · {marketLabel} Awards
      </div>
      <div className="display" style={{
        fontSize: compact ? 30 : 48,
        color: T.gold, lineHeight: 1.05, marginTop: 6,
        textShadow: `0 0 30px ${T.gold}40`,
        letterSpacing: '.04em',
      }}>
        🏆 THE GOLDEN ANTENNAS
      </div>
    </div>
  )
}

function HostIntro({ host }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.gold}10 0%, ${T.surface} 100%)`,
      border: `1px solid ${T.gold}55`,
      borderRadius: 8, padding: '28px 22px', marginBottom: 24,
      textAlign: 'center',
    }}>
      <div className="mono" style={{
        fontSize: 10.5, color: T.muted, letterSpacing: '.18em', marginBottom: 12,
      }}>
        TONIGHT'S HOST
      </div>
      <div className="display" style={{
        fontSize: 28, color: T.text, letterSpacing: '.04em', marginBottom: 6,
      }}>
        {host.name}
      </div>
      <div style={{
        fontSize: 12, color: T.muted, fontStyle: 'italic', maxWidth: 380, margin: '0 auto',
        lineHeight: 1.5,
      }}>
        {host.vibe} — welcoming nominees and presenting tonight's awards.
      </div>
    </div>
  )
}

// ─── AWARD CARD ──────────────────────────────────────────────────────────────

function AwardCard({ award, showingWinner, catIdx, totalAwards }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.gold}66`,
      borderRadius: 8, padding: '24px 22px', marginBottom: 22,
    }}>
      {/* Progress pill */}
      <div className="mono" style={{
        display: 'inline-block',
        fontSize: 10, color: T.muted, letterSpacing: '.15em',
        padding: '3px 9px',
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 99, marginBottom: 18,
      }}>
        AWARD {catIdx + 1} OF {totalAwards}
      </div>

      {/* Category title */}
      <div style={{ fontSize: 26, marginBottom: 4, lineHeight: 1 }}>{award.icon}</div>
      <div className="display" style={{
        fontSize: 22, color: T.text, letterSpacing: '.04em', marginBottom: 18,
        lineHeight: 1.2,
      }}>
        {award.label}
      </div>

      {/* Banner: nominees vs winner */}
      <div className="mono" style={{
        fontSize: 10, color: T.muted, letterSpacing: '.15em', marginBottom: 10,
      }}>
        {showingWinner ? 'AND THE WINNER IS…' : 'THE NOMINEES'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
          marginTop: 18, padding: '10px 12px',
          background: T.gold + '10', border: `1px solid ${T.gold}44`,
          borderRadius: 5, fontSize: 11, color: T.gold, textAlign: 'center',
          letterSpacing: '.05em',
        }}>
          +{award.fameBonus.toFixed(1)} fame · +{fmtM(award.cashBonus)} for the winning network
        </div>
      )}
    </div>
  )
}

function NomineeRow({ nominee, isWinner, showingWinner }) {
  const playerHighlight = nominee.isPlayer
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      background: isWinner ? T.gold + '22'
                : playerHighlight ? T.accent + '0c'
                : T.card,
      border: isWinner ? `2px solid ${T.gold}`
                       : playerHighlight ? `1px solid ${T.accent}55`
                       : `1px solid ${T.border}`,
      borderRadius: 5,
      transition: 'all .3s ease',
      transform: isWinner ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isWinner ? `0 0 24px ${T.gold}44` : 'none',
    }}>
      <div style={{
        width: 24, textAlign: 'center', fontSize: 16, lineHeight: 1,
      }}>
        {isWinner ? '🏆' : (showingWinner ? '·' : '○')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: isWinner ? 700 : (playerHighlight ? 600 : 500),
          color: isWinner ? T.gold : T.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {nominee.programName}
          {playerHighlight && (
            <span style={{
              fontSize: 9, marginLeft: 7, color: T.accent, fontWeight: 700,
              letterSpacing: '.1em',
            }}>● YOU</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
          {nominee.stationName}
        </div>
      </div>
    </div>
  )
}

// ─── NETWORKS SUMMARY ────────────────────────────────────────────────────────

function NetworksSummary({ networkSummary }) {
  const maxAwards = Math.max(1, ...networkSummary.map(n => n.awardCount))

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '20px 18px', marginBottom: 22,
    }}>
      <div className="display" style={{
        fontSize: 20, color: T.text, letterSpacing: '.04em',
        textAlign: 'center', marginBottom: 6, textTransform: 'uppercase',
      }}>
        Tonight's Tally
      </div>
      <div style={{
        fontSize: 11.5, color: T.muted, textAlign: 'center', marginBottom: 18,
        lineHeight: 1.5,
      }}>
        Awards won by network this evening.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {networkSummary.map(n => {
          const pct = (n.awardCount / maxAwards) * 100
          const isPlayer = n.isPlayer
          const barColor = isPlayer ? T.accent : T.textDim
          return (
            <div key={n.stationId} style={{
              padding: '9px 12px',
              background: isPlayer ? T.accent + '0c' : T.card,
              border: isPlayer ? `1px solid ${T.accent}55` : `1px solid ${T.border}`,
              borderRadius: 5,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 8, marginBottom: 5,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: isPlayer ? 700 : 500, color: T.text,
                }}>
                  {n.stationName}
                  {isPlayer && (
                    <span style={{
                      fontSize: 9, marginLeft: 7, color: T.accent, fontWeight: 700,
                      letterSpacing: '.1em',
                    }}>● YOU</span>
                  )}
                </div>
                <div className="mono" style={{
                  fontSize: 14, fontWeight: 700, color: n.awardCount > 0 ? T.gold : T.muted,
                }}>
                  {n.awardCount} {n.awardCount === 1 ? 'award' : 'awards'}
                </div>
              </div>
              <div style={{
                height: 5, background: T.border, borderRadius: 99, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barColor,
                  borderRadius: 99,
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

// ─── PERSONAL SUMMARY ────────────────────────────────────────────────────────

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

  return (
    <>
      <div style={{
        background: `linear-gradient(135deg, ${T.accent}10 0%, ${T.surface} 100%)`,
        border: `1px solid ${T.accent}55`,
        borderRadius: 8, padding: '24px 20px', marginBottom: 22,
        textAlign: 'center',
      }}>
        <div className="display" style={{
          fontSize: 24, color: T.text, letterSpacing: '.04em', marginBottom: 10,
          textTransform: 'uppercase',
        }}>
          Your Year
        </div>
        {playerAwardsWon.length > 0 ? (
          <>
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>🏆</div>
            <div className="display" style={{
              fontSize: 30, color: T.gold, lineHeight: 1,
              textShadow: `0 0 20px ${T.gold}40`,
            }}>
              {playerAwardsWon.length} {playerAwardsWon.length === 1 ? 'Award' : 'Awards'}
            </div>
          </>
        ) : (
          <div style={{
            fontSize: 14, color: T.muted, lineHeight: 1.5, marginTop: 6,
          }}>
            {playerNominations.length > 0
              ? `${playerNominations.length} nomination${playerNominations.length === 1 ? '' : 's'} — but no wins this year.`
              : 'Your network had no nominations this year.'}
          </div>
        )}

        {(totalFame > 0 || totalCash > 0) && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 22, marginTop: 16,
            flexWrap: 'wrap',
          }}>
            {totalFame > 0 && (
              <div>
                <div className="mono" style={{ fontSize: 10, color: T.muted, letterSpacing: '.12em' }}>
                  FAME GAIN
                </div>
                <div className="mono" style={{ fontSize: 18, color: T.gold, fontWeight: 700, marginTop: 2 }}>
                  +{totalFame.toFixed(1)}
                </div>
              </div>
            )}
            {totalCash > 0 && (
              <div>
                <div className="mono" style={{ fontSize: 10, color: T.muted, letterSpacing: '.12em' }}>
                  CASH BONUS
                </div>
                <div className="mono" style={{ fontSize: 18, color: T.green, fontWeight: 700, marginTop: 2 }}>
                  +{fmtM(totalCash)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nominations list */}
      {playerNominations.length > 0 && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '18px 18px', marginBottom: 22,
        }}>
          <div className="mono" style={{
            fontSize: 10, color: T.muted, letterSpacing: '.15em', marginBottom: 10,
          }}>
            YOUR NOMINATIONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {playerNominations.map((n, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px',
                background: n.won ? T.gold + '14' : T.card,
                border: n.won ? `1px solid ${T.gold}55` : `1px solid ${T.border}`,
                borderRadius: 5,
              }}>
                <div style={{ width: 22, textAlign: 'center', fontSize: 14, lineHeight: 1 }}>
                  {n.won ? '🏆' : '○'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: n.won ? 700 : 500,
                    color: n.won ? T.gold : T.text,
                  }}>
                    {n.programName}
                  </div>
                  <div style={{ fontSize: 10.5, color: T.muted, marginTop: 1 }}>
                    {n.categoryLabel}{n.won && ' · WINNER'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expansion offer (moved here, at end of ceremony) */}
      {promotable && nextMarket && (
        <div style={{
          background: T.teal + '14',
          border: `1px solid ${T.teal}`,
          borderRadius: 6, padding: 14, marginBottom: 22,
        }}>
          <div className="display" style={{
            fontSize: 14, color: T.teal, letterSpacing: '.08em',
            marginBottom: 6, textTransform: 'uppercase',
          }}>
            Expansion Opportunity
          </div>
          <div style={{ fontSize: 12.5, color: T.text, marginBottom: 10, lineHeight: 1.55 }}>
            You've reached the fame threshold to graduate to <b>{nextMarket.label}</b>.
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 8, marginBottom: 12,
            padding: 10, background: 'rgba(0,0,0,.2)', borderRadius: 4,
          }}>
            <Term label="One-time cost"    value={fmtM(expansionCost)}                color={canAffordExpansion ? T.text : T.red} />
            <Term label="Monthly infra"    value={`${fmtM(nextMarket.monthlyInfra)}/mo`} color={T.text} />
            <Term label="Production cost"  value={`×${nextMarket.prodCostMult.toFixed(2)}`} color={T.text} />
            <Term label="Revenue / viewer" value={`$${nextMarket.revPerViewer.toFixed(1)}`} color={T.green} />
          </div>
          <div style={{
            fontSize: 11, color: T.gold, lineHeight: 1.5, marginBottom: 10,
            padding: '8px 10px',
            background: T.gold + '0c', border: `1px dashed ${T.gold}55`, borderRadius: 4,
          }}>
            ⚠ Specialization reset: only your specialty (min 0.5★) and any genre at 4★+ (kept at 1★) carry over.
          </div>
          <button
            onClick={canAffordExpansion ? onPromote : undefined}
            disabled={!canAffordExpansion}
            style={{
              background: canAffordExpansion ? T.teal : T.card,
              color: canAffordExpansion ? T.bg : T.muted,
              border: 'none', borderRadius: 4,
              padding: '10px 16px',
              fontFamily: 'Anton, sans-serif',
              fontSize: 14, letterSpacing: '.08em',
              textTransform: 'uppercase',
              cursor: canAffordExpansion ? 'pointer' : 'not-allowed',
            }}
          >
            {canAffordExpansion ? `Expand for ${fmtM(expansionCost)}` : `Need ${fmtM(expansionCost)} (have ${fmtM(station.cash)})`}
          </button>
        </div>
      )}

      <ContinueButton onClick={onContinue}>
        Begin Year {year + 1} ▸
      </ContinueButton>
    </>
  )
}

// ─── COMMON BITS ─────────────────────────────────────────────────────────────

function ContinueButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 16px',
        background: `linear-gradient(135deg, ${T.gold}dd 0%, ${T.accent}dd 100%)`,
        color: T.bg, border: 'none', borderRadius: 6,
        fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '.1em',
        cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700,
        boxShadow: `0 4px 18px ${T.gold}33`,
      }}
    >
      {children}
    </button>
  )
}

function Term({ label, value, color }) {
  return (
    <div>
      <div className="mono" style={{
        fontSize: 9, color: T.muted, letterSpacing: '.12em',
      }}>{label.toUpperCase()}</div>
      <div className="mono" style={{
        fontSize: 13, color: color || T.text, fontWeight: 700, marginTop: 3,
      }}>{value}</div>
    </div>
  )
}
