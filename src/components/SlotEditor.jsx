import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, CATEGORY_IDS, MARKETING_TIERS, IPS, TIER_COL, MARKETS,
} from '../constants.js'
import { HTag, Bar, KV, Pill } from './ui.jsx'
import {
  projectShow, programCost, findDirector, findStar, findIP, findMovie,
} from '../engine.js'

export function SlotEditor({
  initial, station, research, roster, movies, takenTalent, ownedShows, onSave, onClear, onClose,
}) {
  const [draft, setDraft] = useState(() => ({ ...initial }))
  const [showRenew, setShowRenew] = useState(false)
  const market = MARKETS[station.market]

  const isMovieMode = !!draft.movieId
  const cat = draft.categoryId ? CATEGORIES[draft.categoryId] : null
  const isMovieCategory = draft.categoryId === 'movie'

  const proj = useMemo(() => {
    if (!draft.categoryId && !draft.movieId) return null
    if (!isMovieMode && !draft.topicId) return null
    return projectShow(draft, station, research)
  }, [draft, station, research, isMovieMode])

  const cost = useMemo(() => {
    if (!draft.categoryId && !draft.movieId) return 0
    return programCost(draft, market, research)
  }, [draft, market, research])

  // Sequel rename — when renewing, name auto-fills with show name and S2/S3
  const update = (patch) => setDraft(d => ({ ...d, ...patch }))

  const renewableShows = ownedShows.filter(s => !s.movieId)

  // Booked-this-cycle filter
  const isBooked = (id) => takenTalent.has(id)

  const valid = useMemo(() => {
    if (isMovieMode) return !!draft.movieId
    return !!(draft.categoryId && draft.topicId && draft.name && draft.name.trim().length > 0)
  }, [draft, isMovieMode])

  function pickCategory(catId) {
    if (catId === 'movie') {
      // Movie mode — clear other choices
      update({
        categoryId: 'movie', topicId: null,
        directorId: null, starId: null, ipId: null,
        movieId: null, name: '',
      })
    } else {
      update({
        categoryId: catId, topicId: null, movieId: null,
        // keep talent if they fit; otherwise clear
        directorId: null, starId: null, ipId: null,
        name: draft.name && !isMovieMode ? draft.name : '',
        seqSeason: null, fromOwnedId: null,
      })
    }
  }

  function pickMovie(movieId) {
    const m = findMovie(movieId)
    update({ movieId, name: m?.name || '' })
  }

  function pickRenewal(ownedId) {
    const sh = ownedShows.find(s => s.id === ownedId)
    if (!sh) return
    update({
      categoryId: sh.categoryId,
      topicId: sh.topicId,
      directorId: null, starId: null, ipId: sh.ipId || null,
      name: sh.name,
      seqSeason: (sh.lastSeqSeason || 1) + 1,
      fromOwnedId: ownedId,
      marketingId: 'none',
      movieId: null,
    })
    setShowRenew(false)
  }

  function clearSlot() {
    if (onClear) onClear()
    onClose()
  }

  function save() {
    onSave(draft)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: T.surface, zIndex: 1,
        }}>
          <div className="bebas" style={{ fontSize: 18, color: T.accent, letterSpacing: '.05em' }}>
            {draft.seqSeason ? `Renew · Season ${draft.seqSeason}` : 'Plan Program'}
          </div>
          <button onClick={onClose} style={{ color: T.muted, fontSize: 18, padding: '0 6px' }}>✕</button>
        </div>

        <div style={{ padding: 18 }}>

          {/* Renew option */}
          {!showRenew && renewableShows.length > 0 && !draft.fromOwnedId && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowRenew(true)}
                style={{
                  background: T.purple + '14',
                  border: `1px solid ${T.purple}55`,
                  color: T.purple,
                  padding: '8px 14px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.05em',
                }}
              >🔄 Renew an Existing Show ({renewableShows.length} eligible)</button>
            </div>
          )}

          {showRenew && (
            <div style={{ marginBottom: 16 }} className="ani">
              <div className="bebas" style={{ fontSize: 13, color: T.purple, marginBottom: 7, letterSpacing: '.1em' }}>
                ELIGIBLE FOR RENEWAL
              </div>
              {renewableShows.map(s => {
                const c = CATEGORIES[s.categoryId]
                return (
                  <div key={s.id} className="pickrow" onClick={() => pickRenewal(s.id)}>
                    <span style={{ fontSize: 16 }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>
                        Last season: rated {s.lastRating?.toFixed(1) || '-'} · S{s.lastSeqSeason || 1}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: T.muted }}>→ S{(s.lastSeqSeason || 1) + 1}</span>
                  </div>
                )
              })}
              <button onClick={() => setShowRenew(false)} style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                ← Back to fresh program
              </button>
            </div>
          )}

          {!showRenew && (
            <>
              {/* CATEGORY */}
              <Section title="1. Category">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORY_IDS.map(id => {
                    const c = CATEGORIES[id]
                    return (
                      <Pill
                        key={id}
                        label={`${c.icon} ${c.label}`}
                        active={draft.categoryId === id}
                        onClick={() => pickCategory(id)}
                        color={c.color}
                        disabled={!!draft.fromOwnedId}
                      />
                    )
                  })}
                </div>
              </Section>

              {/* MOVIE — special path */}
              {isMovieCategory && (
                <Section title="2. Movie Rights">
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
                    Buy the rights to a pre-made film. No director or star needed.
                  </div>
                  {movies.map(m => (
                    <div
                      key={m.id}
                      className={`pickrow${draft.movieId === m.id ? ' selected' : ''}`}
                      onClick={() => pickMovie(m.id)}
                    >
                      <span style={{ fontSize: 16 }}>🎬</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: T.muted, display: 'flex', gap: 8 }}>
                          <span>Q {m.q.toFixed(1)}</span>
                          <span>H {m.h.toFixed(1)}</span>
                        </div>
                      </div>
                      <HTag tier={m.tier} />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.red, minWidth: 50, textAlign: 'right' }}>
                        ${m.cost.toFixed(1)}M
                      </span>
                    </div>
                  ))}
                </Section>
              )}

              {/* SCRIPTED PATH: TOPIC + TALENT + IP */}
              {cat && !isMovieCategory && (
                <>
                  <Section title="2. Topic / Format">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {cat.topics.map(t => (
                        <Pill
                          key={t.id}
                          label={t.label}
                          active={draft.topicId === t.id}
                          onClick={() => update({ topicId: t.id })}
                          disabled={!!draft.fromOwnedId && t.id !== draft.topicId}
                        />
                      ))}
                    </div>
                  </Section>

                  <Section title="3. Director">
                    <TalentList
                      list={roster.directors}
                      categoryId={draft.categoryId}
                      selectedId={draft.directorId}
                      onPick={id => update({ directorId: id })}
                      isBooked={isBooked}
                      role="director"
                    />
                  </Section>

                  <Section title="4. Star Talent">
                    <TalentList
                      list={roster.stars}
                      categoryId={draft.categoryId}
                      selectedId={draft.starId}
                      onPick={id => update({ starId: id })}
                      isBooked={isBooked}
                      role="star"
                    />
                  </Section>

                  <Section title="5. IP License (optional)">
                    <IPList
                      categoryId={draft.categoryId}
                      selectedId={draft.ipId}
                      onPick={id => update({ ipId: id })}
                      research={research}
                    />
                  </Section>
                </>
              )}

              {/* MARKETING — for both movie and scripted */}
              {(draft.categoryId || draft.movieId) && (
                <Section title={isMovieCategory ? '3. Marketing Campaign' : '6. Marketing Campaign'}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {MARKETING_TIERS.map(m => {
                      const mCost = m.cost === 0 ? '—' :
                        `$${(m.cost * market.marketingMult * (research.marketingDiscount || 1)).toFixed(1)}M`
                      return (
                        <Pill
                          key={m.id}
                          label={`${m.label} · ${mCost}`}
                          active={(draft.marketingId || 'none') === m.id}
                          onClick={() => update({ marketingId: m.id })}
                        />
                      )
                    })}
                  </div>
                </Section>
              )}

              {/* NAME — for scripted only; movies use their title */}
              {cat && !isMovieCategory && (
                <Section title="7. Show Name">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={e => update({ name: e.target.value })}
                    placeholder="e.g. Midnight Protocol"
                    maxLength={40}
                    disabled={!!draft.fromOwnedId}
                    style={{ width: '100%', fontSize: 14, padding: '8px 12px' }}
                  />
                </Section>
              )}
            </>
          )}

          {/* PROJECTION */}
          {proj && (
            <div style={{
              background: T.cardHi,
              border: `1px solid ${T.borderHi}`,
              borderRadius: 6,
              padding: 12,
              marginTop: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <div className="bebas" style={{ fontSize: 12, color: T.muted, letterSpacing: '.1em' }}>PROJECTION</div>
                <HTag tier={proj.tier} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 9 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Quality</div>
                  <Bar value={proj.quality} color={T.green} h={6} />
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.green, marginTop: 3 }}>
                    {proj.quality.toFixed(2)} / 10
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Hype</div>
                  <Bar value={proj.hype} color={T.pink} h={6} />
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.pink, marginTop: 3 }}>
                    {proj.hype.toFixed(2)} / 10
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 9, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, color: T.muted }}>Total cost this cycle</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: T.red, fontWeight: 600 }}>
                  ${cost.toFixed(1)}M
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: 14,
          borderTop: `1px solid ${T.border}`,
          display: 'flex', gap: 8,
          background: T.surface,
          position: 'sticky', bottom: 0,
        }}>
          {(initial.categoryId || initial.movieId) && (
            <button
              onClick={clearSlot}
              style={{
                background: 'transparent',
                border: `1px solid ${T.red}66`,
                color: T.red,
                padding: '10px 14px',
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 600,
              }}
            >Clear Slot</button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${T.border}`,
              color: T.muted,
              padding: '10px 14px',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
            }}
          >Cancel</button>
          <button
            className="cta"
            style={{ width: 'auto', padding: '10px 20px', fontSize: 15 }}
            disabled={!valid}
            onClick={save}
          >Save Slot</button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="bebas" style={{ fontSize: 12, color: T.accent, letterSpacing: '.1em', marginBottom: 7 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function TalentList({ list, categoryId, selectedId, onPick, isBooked, role }) {
  // Sort: matching specialty first, then by tier desc
  const sorted = useMemo(() => {
    const tierIdx = (t) => ['Common','Uncommon','Rare','Epic','Legendary'].indexOf(t)
    return [...list].sort((a, b) => {
      const am = a.specialty === categoryId ? 0 : 1
      const bm = b.specialty === categoryId ? 0 : 1
      if (am !== bm) return am - bm
      return tierIdx(b.tier) - tierIdx(a.tier)
    })
  }, [list, categoryId])

  if (sorted.length === 0) {
    return <div style={{ fontSize: 11, color: T.muted, fontStyle: 'italic' }}>No {role}s available — try a Talent Scout in research.</div>
  }

  return (
    <>
      <div
        className={`pickrow${!selectedId ? ' selected' : ''}`}
        onClick={() => onPick(null)}
        style={{ background: !selectedId ? 'rgba(232,160,69,.08)' : undefined }}
      >
        <span style={{ fontSize: 16 }}>—</span>
        <div style={{ flex: 1, fontSize: 12, color: T.muted, fontStyle: 'italic' }}>None / unsigned</div>
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {sorted.map(t => {
          const matches = t.specialty === categoryId
          const booked = isBooked(t.id) && t.id !== selectedId
          return (
            <div
              key={t.id}
              className={`pickrow${selectedId === t.id ? ' selected' : ''}${booked ? ' disabled' : ''}`}
              onClick={() => !booked && onPick(t.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.name}
                  {matches && <span style={{ fontSize: 9, color: T.green, fontWeight: 600 }}>★ FIT</span>}
                  {booked && <span style={{ fontSize: 9, color: T.red, fontWeight: 600 }}>BOOKED</span>}
                </div>
                <div style={{ fontSize: 10, color: T.muted }}>
                  Specialty: {CATEGORIES[t.specialty]?.label || t.specialty}
                  {' · '}Q +{t.q.toFixed(1)} · H +{t.h.toFixed(1)}
                </div>
              </div>
              <HTag tier={t.tier} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.red, minWidth: 48, textAlign: 'right' }}>
                ${t.cost.toFixed(1)}M
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

function IPList({ categoryId, selectedId, onPick, research }) {
  const eligible = IPS.filter(ip => ip.fits.includes(categoryId))
  const discount = research.ipDiscount || 1.0

  if (eligible.length === 0) {
    return <div style={{ fontSize: 11, color: T.muted, fontStyle: 'italic' }}>No IPs available for this category.</div>
  }

  return (
    <>
      <div
        className={`pickrow${!selectedId ? ' selected' : ''}`}
        onClick={() => onPick(null)}
        style={{ background: !selectedId ? 'rgba(232,160,69,.08)' : undefined }}
      >
        <span style={{ fontSize: 16 }}>—</span>
        <div style={{ flex: 1, fontSize: 12, color: T.muted, fontStyle: 'italic' }}>No IP / original</div>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {eligible.map(ip => (
          <div
            key={ip.id}
            className={`pickrow${selectedId === ip.id ? ' selected' : ''}`}
            onClick={() => onPick(ip.id)}
          >
            <span style={{ fontSize: 14 }}>📜</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{ip.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>
                Q +{ip.q.toFixed(1)} · H +{ip.h.toFixed(1)}
              </div>
            </div>
            <HTag tier={ip.tier} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.red, minWidth: 56, textAlign: 'right' }}>
              ${(ip.cost * discount).toFixed(1)}M
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
