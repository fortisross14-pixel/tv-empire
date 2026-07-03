import { R } from '../theme.js'

/**
 * RetroRoomHero — shared hero pattern for room-modal screens.
 *
 * Replaces the editorial Fraunces hero (52px serif title) used by
 * AJ→AN migrated screens. Consistent brass/gold visual identity across
 * every room now.
 *
 * Usage:
 *   <RetroRoomHero
 *     iconClass="fa-solid fa-scroll"
 *     eyebrow="Content"
 *     title="Writers Room"
 *     subtitle="Scripts in draft. Ready to produce."
 *     accent={R.gold}
 *     onBack={onBack}
 *     rightSlot={<SomeStat />}
 *   />
 */
export function RetroRoomHero({
  iconClass = 'fa-solid fa-square',
  eyebrow = '',
  title = '',
  subtitle = '',
  accent = R.gold,
  onBack,
  rightSlot = null,
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 20, gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Icon block with accent tint */}
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: `linear-gradient(145deg, ${accent}33, ${accent}11)`,
          border: `2px solid ${accent}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${accent}44`,
          flexShrink: 0,
        }}>
          <i className={iconClass} style={{ color: accent, fontSize: 24 }} />
        </div>

        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div style={{
              fontSize: 10, color: accent, letterSpacing: 3,
              fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
            }}>
              {eyebrow}
            </div>
          )}
          <div className="section-title" style={{
            fontSize: 28, color: '#fff', letterSpacing: 2, lineHeight: 1,
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: 12, color: R.textDim, marginTop: 4,
              lineHeight: 1.4, maxWidth: 500,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right side: back button + optional stat slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {rightSlot}
        {onBack && (
          <button onClick={onBack} className="retro-button-secondary" style={{ fontSize: 11 }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
            Back
          </button>
        )}
      </div>
    </div>
  )
}
