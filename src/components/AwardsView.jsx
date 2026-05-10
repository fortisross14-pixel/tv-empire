import { T } from '../theme.js'
import { CATEGORIES, MARKETS, MARKET_ORDER } from '../constants.js'
import { canPromote, fameLabel } from '../engine.js'

export function AwardsView({ awards, station, year, onContinue, onPromote }) {
  const { wins, bestOverall, fameBar } = awards
  const promotable = canPromote(station)
  const market = MARKETS[station.market]
  const idx = MARKET_ORDER.indexOf(station.market)
  const nextMarket = idx < MARKET_ORDER.length - 1 ? MARKETS[MARKET_ORDER[idx + 1]] : null

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px' }} className="ani">

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 14, color: T.muted, letterSpacing: '.2em', textTransform: 'uppercase' }}>
          Year {year} · Awards Ceremony
        </div>
        <div className="bebas" style={{
          fontSize: 56, color: T.gold, lineHeight: 1, marginTop: 4,
          textShadow: `0 0 30px ${T.gold}40`,
        }}>
          🏆 THE EMMIES
        </div>
      </div>

      {/* Best overall */}
      {bestOverall && (
        <div className="pop" style={{
          background: `linear-gradient(135deg, ${T.gold}22 0%, ${T.gold}05 100%)`,
          border: `2px solid ${T.gold}`,
          borderRadius: 8,
          padding: 22,
          textAlign: 'center',
          marginBottom: 22,
        }}>
          <div style={{ fontSize: 12, color: T.gold, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            ★ Best in Show ★
          </div>
          <div className="bebas" style={{ fontSize: 32, color: T.gold, lineHeight: 1, marginBottom: 5 }}>
            "{bestOverall.showName}"
          </div>
          <div style={{ fontSize: 14, color: T.text }}>
            Rating: {bestOverall.rating.toFixed(2)} · +{bestOverall.fameBonus} fame · +${bestOverall.cashBonus}M
          </div>
        </div>
      )}

      {/* Category wins */}
      <div style={{ marginBottom: 22 }}>
        <div className="bebas" style={{ fontSize: 16, color: T.accent, letterSpacing: '.1em', marginBottom: 10 }}>
          CATEGORY WINNERS
        </div>
        {wins.length === 0 ? (
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: 20,
            textAlign: 'center',
            color: T.muted,
            fontStyle: 'italic',
          }}>
            No awards won this year. The bar was {fameBar.toFixed(2)}. Keep grinding!
          </div>
        ) : (
          wins.map((w, i) => {
            const cat = CATEGORIES[w.category]
            return (
              <div key={i} className="pop" style={{
                background: T.card,
                border: `1px solid ${cat?.color || T.accent}`,
                borderLeft: `4px solid ${cat?.color || T.accent}`,
                borderRadius: 6,
                padding: 14,
                marginBottom: 8,
                animationDelay: `${i * 0.1}s`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>
                      Best {cat?.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>"{w.showName}"</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      Rating: {w.rating.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>
                      +{w.fameBonus} fame
                    </div>
                    <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>
                      +${w.cashBonus}M
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Status / promotion */}
      <div style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        padding: 16,
        marginBottom: 20,
      }}>
        <div className="bebas" style={{ fontSize: 14, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
          STATION STATUS
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span>{station.name}</span>
          <span style={{ color: T.gold, fontWeight: 600 }}>
            Fame: {station.fame.toFixed(1)} · {fameLabel(station.fame)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
          Currently on {market.label}
        </div>

        {promotable && nextMarket && (
          <div style={{
            background: T.teal + '14',
            border: `1px solid ${T.teal}`,
            borderRadius: 5,
            padding: 12,
            marginTop: 12,
          }}>
            <div className="bebas" style={{ fontSize: 14, color: T.teal, letterSpacing: '.1em', marginBottom: 4 }}>
              EXPANSION OPPORTUNITY
            </div>
            <div style={{ fontSize: 12, color: T.text, marginBottom: 8 }}>
              You've reached the fame threshold to graduate to <b>{nextMarket.label}</b>. {nextMarket.desc}
            </div>
            <button
              className="cta teal"
              onClick={onPromote}
              style={{ width: 'auto', padding: '8px 16px', fontSize: 14 }}
            >Expand to {nextMarket.label}</button>
          </div>
        )}
      </div>

      <button className="cta" onClick={onContinue}>
        Begin Year {year + 1} →
      </button>
    </div>
  )
}
