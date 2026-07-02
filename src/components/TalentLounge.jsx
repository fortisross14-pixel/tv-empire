import { R } from '../theme.js'
import { findWriter, findDirector, findStar } from '../engine.js'
import { CATEGORIES } from '../constants.js'

/**
 * TalentLounge — left sidebar in the floor plan.
 *
 * Read-only for Stage AO: shows every hired writer / director / star on
 * a scrollable list. Clicking anywhere opens the Talent room
 * (Operations screen) where the player manages them.
 *
 * Stage AQ will make individual talent cards draggable onto studios
 * for production assignment. For now they're informational.
 */
export function TalentLounge({ station, onOpenTalent }) {
  const writers   = (station?.hiredWriters   || []).map(h => ({ type: 'writer',   ...findWriter(h.talentId)   })).filter(t => t?.name)
  const directors = (station?.hiredDirectors || []).map(h => ({ type: 'director', ...findDirector(h.talentId) })).filter(t => t?.name)
  const stars     = (station?.hiredStars     || []).map(h => ({ type: 'star',     ...findStar(h.talentId)     })).filter(t => t?.name)
  const total = writers.length + directors.length + stars.length

  return (
    <div className="retro-panel" style={{
      padding: 18, height: '100%',
      display: 'flex', flexDirection: 'column',
      minHeight: 520,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div>
          <div className="section-title" style={{
            fontSize: 15, color: '#fff', letterSpacing: 1.5,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className="fa-solid fa-users" style={{ color: R.gold }} />
            <span>Talent Lounge</span>
          </div>
          <div style={{ fontSize: 10, color: R.textDim, marginTop: 2 }}>
            {total} under contract
          </div>
        </div>
        <button
          onClick={onOpenTalent}
          className="retro-button"
          style={{ fontSize: 10, padding: '5px 10px' }}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: 9 }} />
          <span>Recruit</span>
        </button>
      </div>

      {/* Scroll region */}
      <div
        className="custom-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 4,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
      >
        {total === 0 && (
          <div style={{
            padding: '20px 12px', textAlign: 'center',
            color: R.textDim, fontSize: 11,
          }}>
            No talent signed yet.<br/>
            Recruit writers, directors, and stars to build your roster.
          </div>
        )}

        {writers.length > 0 && (
          <>
            <SectionLabel label="Writers" count={writers.length} color={R.gold} />
            {writers.map(w => <TalentCard key={`w${w.id}`} talent={w} onClick={onOpenTalent} />)}
          </>
        )}

        {directors.length > 0 && (
          <>
            <SectionLabel label="Directors" count={directors.length} color={R.viewers} />
            {directors.map(d => <TalentCard key={`d${d.id}`} talent={d} onClick={onOpenTalent} />)}
          </>
        )}

        {stars.length > 0 && (
          <>
            <SectionLabel label="On-camera stars" count={stars.length} color={R.red} />
            {stars.map(s => <TalentCard key={`s${s.id}`} talent={s} onClick={onOpenTalent} />)}
          </>
        )}
      </div>

      <div style={{
        paddingTop: 10, marginTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: 9, textAlign: 'center', color: R.textDim,
        letterSpacing: 1,
      }}>
        <i className="fa-solid fa-info-circle" style={{ marginRight: 4 }} />
        Higher-tier talent = better shows
      </div>
    </div>
  )
}

function SectionLabel({ label, count, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginTop: 8, marginBottom: 2,
      fontSize: 9, color, letterSpacing: 1.5,
      textTransform: 'uppercase', fontFamily: 'monospace',
    }}>
      <span style={{ flex: 1, height: 1, background: `${color}44` }} />
      <span>{label} · {count}</span>
      <span style={{ flex: 1, height: 1, background: `${color}44` }} />
    </div>
  )
}

function TalentCard({ talent, onClick }) {
  const iconClass = talent.type === 'writer'   ? 'fa-solid fa-feather'
                  : talent.type === 'director' ? 'fa-solid fa-clapperboard'
                  :                              'fa-solid fa-star'
  const iconColor = talent.type === 'writer'   ? R.gold
                  : talent.type === 'director' ? R.viewers
                  :                              R.red
  const specialty = CATEGORIES[talent.specialty]?.label || talent.specialty

  return (
    <div className="talent-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: `${iconColor}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={iconClass} style={{ color: iconColor, fontSize: 12 }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 12, color: '#fff', fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.2,
        }}>
          {talent.name}
        </div>
        <div style={{
          fontSize: 9, color: R.textDim,
          letterSpacing: 0.5,
        }}>
          {(talent.tier || '?').toUpperCase()} · {specialty || 'general'}
        </div>
      </div>
    </div>
  )
}
