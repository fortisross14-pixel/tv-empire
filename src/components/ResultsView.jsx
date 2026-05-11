import { T } from '../theme.js'
import { CATEGORIES, MARKETS } from '../constants.js'
import { HTag, Bar } from './ui.jsx'
import { fameLabel } from '../engine.js'

export function ResultsView({ results, station, prevFame, onContinue, cycleLabel }) {
  if (!results) return null
  const airings = results.airings || results.shows || []
  const totals = results.totals || {}
  const market = MARKETS[station.market]

  // Sort shows: best rating first
  const sorted = [...airings].sort((a, b) => (b.rating || 0) - (a.rating || 0))

  const fameAfter = station.fame
  const fameDelta = totals.fameDelta || 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 60px' }} className="ani">

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div className="bebas" style={{ fontSize: 32, color: T.text, lineHeight: 1 }}>
          {cycleLabel} Results
          <span style={{ fontSize: 18, color: T.muted, marginLeft: 10 }}>— Ratings In</span>
        </div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>
          {market.label} · {sorted.length} shows aired
        </div>
      </div>

      {/* Bottom-line cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <BigStat label="Total Audience" value={`${(totals.audience ?? 0).toFixed(1)}M`} color={T.teal} sub={`Cap ${market.audCap}M`} />
        <BigStat label="Revenue" value={`$${(totals.revenue ?? 0).toFixed(1)}M`} color={T.green} />
        <BigStat label="Costs" value={`$${(totals.cost ?? 0).toFixed(1)}M`} color={T.red} />
        <BigStat
          label="Net"
          value={`${(totals.net ?? 0) >= 0 ? '+' : ''}$${(totals.net ?? 0).toFixed(1)}M`}
          color={(totals.net ?? 0) >= 0 ? T.green : T.red}
        />
        <BigStat
          label="Fame"
          value={`${fameAfter.toFixed(1)}`}
          color={fameDelta >= 0 ? T.gold : T.red}
          sub={`${fameDelta >= 0 ? '+' : ''}${fameDelta.toFixed(1)} · ${fameLabel(fameAfter)}`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>

        {/* Show ratings */}
        <div>
          <div className="bebas" style={{ fontSize: 13, color: T.accent, letterSpacing: '.1em', marginBottom: 7 }}>
            YOUR LINEUP
          </div>
          {sorted.map((s, i) => (
            <ShowResultRow key={s.id || i} show={s} rank={i + 1} />
          ))}
        </div>

        {/* Sidebar: competitors + continue */}
        <div>
          <button
            className="cta green"
            onClick={onContinue}
            style={{ marginBottom: 14 }}
          >
            Next Cycle ▶
          </button>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12 }}>
            <div className="bebas" style={{ fontSize: 12, color: T.muted, letterSpacing: '.1em', marginBottom: 6 }}>
              REPUTATION
            </div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
              Hits (≥7.0) push fame up. Bombs (&lt;4) push it down. Reach the next-market threshold to expand reach.
              See the <strong>Market tab</strong> for competitor performance.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BigStat({ label, value, color, sub }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      padding: '12px 14px',
      flex: 1,
      minWidth: 130,
    }}>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div className="bebas" style={{ fontSize: 26, color: color || T.text, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function ShowResultRow({ show, rank }) {
  const cat = CATEGORIES[show.categoryId] || CATEGORIES.movie
  const ratingColor = show.rating >= 8 ? T.gold : show.rating >= 7 ? T.green : show.rating >= 5 ? T.accent : T.red
  const verdict = show.rating >= 8.5 ? 'BLOCKBUSTER' :
                  show.rating >= 7.0 ? 'HIT' :
                  show.rating >= 5.5 ? 'OK' :
                  show.rating >= 4.0 ? 'WEAK' : 'FLOP'

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${cat?.color || T.accent}`,
      borderRadius: 6,
      padding: 12,
      marginBottom: 9,
    }} className="ani">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.1em' }}>
            #{rank} · {cat?.icon} {show.movieId ? 'Movie' : cat?.label}
            {show.seqSeason ? <span style={{ color: T.purple, marginLeft: 4 }}>· S{show.seqSeason}</span> : null}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{show.name}</div>
        </div>
        <div style={{
          background: ratingColor + '14',
          border: `1px solid ${ratingColor}`,
          color: ratingColor,
          padding: '3px 9px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.08em',
        }}>{verdict}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 8 }}>
        <Stat label="Rating" value={show.rating.toFixed(2)} color={ratingColor} />
        <Stat label="Audience" value={`${show.audience.toFixed(2)}M`} color={T.teal} />
        <Stat label="Revenue" value={`$${show.revenue.toFixed(1)}M`} color={T.green} />
        <Stat label="Net" value={`${show.net >= 0 ? '+' : ''}$${show.net.toFixed(1)}M`} color={show.net >= 0 ? T.green : T.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.muted, marginBottom: 2 }}>
            <span>QUALITY</span>
            <span>{show.quality.toFixed(1)}</span>
          </div>
          <Bar value={show.quality} color={T.green} h={3} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.muted, marginBottom: 2 }}>
            <span>HYPE</span>
            <span>{show.hype.toFixed(1)}</span>
          </div>
          <Bar value={show.hype} color={T.pink} h={3} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: color || T.text, fontWeight: 600 }}>
        {value}
      </div>
    </div>
  )
}
