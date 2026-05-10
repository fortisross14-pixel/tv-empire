import { T } from '../theme.js'
import { RESEARCH } from '../constants.js'
import { canResearch } from '../engine.js'

export function ResearchPanel({ research, cash, onBuy }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      padding: 12,
      marginBottom: 13,
    }}>
      <div className="bebas" style={{ fontSize: 12, color: T.muted, letterSpacing: '.1em', marginBottom: 8 }}>
        RESEARCH
      </div>
      {RESEARCH.map(r => {
        const owned = (research.unlocked || []).includes(r.id) && !r.repeatable
        const available = canResearch(r.id, research)
        const affordable = cash >= r.cost
        return (
          <div key={r.id} style={{
            background: T.surface,
            border: `1px solid ${owned ? T.green : (available ? T.border : T.border)}`,
            borderRadius: 4,
            padding: '8px 10px',
            marginBottom: 6,
            opacity: !available && !owned ? 0.5 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: owned ? T.green : T.text }}>
                  {r.label} {owned && '✓'}
                </div>
                <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.4, marginTop: 2 }}>
                  {r.desc}
                </div>
              </div>
              <button
                onClick={() => onBuy(r)}
                disabled={owned || !available || !affordable}
                style={{
                  background: owned ? T.green + '22' : (affordable && available ? T.accent : T.border),
                  color: owned ? T.green : (affordable && available ? T.bg : T.muted),
                  padding: '4px 9px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  cursor: owned || !available || !affordable ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {owned ? 'OWNED' : `$${r.cost}M`}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
