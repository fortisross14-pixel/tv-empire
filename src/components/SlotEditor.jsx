import { useState, useMemo, useEffect } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, CATEGORY_IDS, MARKETING_TIERS, IPS, MARKETS, SLOT_TYPES,
} from '../constants.js'
import { HTag, Bar, Pill } from './ui.jsx'
import {
  projectShow, programCost, findDirector, findStar, findIP, findMovie,
  getUnlocks, getSeasonalPref,
} from '../engine.js'

export function SlotEditor({
  initial, slotTypeId, cycleIdx,
  station, research, roster, movies, takenTalent, ownedShows,
  onSave, onClear, onClose,
}) {
  const [draft, setDraft] = useState(() => ({ ...initial, slotTypeId }))
  const [showRenew, setShowRenew] = useState(false)

  // Defensive defaults so missing props don't crash the editor
  const safeRoster = {
    directors: roster?.directors || [],
    stars:     roster?.stars     || [],
  }
  const safeOwned = ownedShows || []
  const safeTaken = takenTalent || new Set()

  const slotType = SLOT_TYPES[slotTypeId] || SLOT_TYPES.prime
  const seasonal = getSeasonalPref(slotTypeId, cycleIdx)
  const market = MARKETS[station.market]
  const unlocks = useMemo(() => getUnlocks(station, research), [station, research])

  const isMovieMode = !!draft.movieId
  const cat = draft.categoryId ? CATEGORIES[draft.categoryId] : null
  const isMovieCategory = draft.categoryId === 'movie'

  const proj = useMemo(() => {
    if (!draft.categoryId && !draft.movieId) return null
    if (!isMovieMode && !isMovieCategory && !draft.topicId) return null
    return projectShow(draft, station, research, cycleIdx)
  }, [draft, station, research, isMovieMode, isMovieCategory, cycleIdx])

  const cost = useMemo(() => {
    if (!draft.categoryId && !draft.movieId) return 0
    return programCost(draft, market, research)
  }, [draft, market, research])

  const update = (patch) => setDraft(d => ({ ...d, ...patch }))

  const renewableShows = safeOwned.filter(s => !s.movieId)

  // Booked-this-cycle filter (excluding the slot we're editing)
  const isBooked = (id) => safeTaken.has(id)

  // Validation: name optional now (auto-fills with "Untitled" or category label)
  const valid = useMemo(() => {
    if (isMovieMode) return !!draft.movieId
    return !!(draft.categoryId && draft.topicId)
  }, [draft, isMovieMode])

  // Auto-fill name if empty when saving — friendlier
  function save() {
    let finalDraft = { ...draft, slotTypeId }
    if (!isMovieMode && !finalDraft.name?.trim()) {
      const c = CATEGORIES[finalDraft.categoryId]
      finalDraft.name = `Untitled ${c?.label || 'Show'}`
    }
    onSave(finalDraft)
    onClose()
  }

  function clearSlot() {
    if (onClear) onClear()
    onClose()
  }

  function pickCategory(catId) {
    if (catId === 'movie') {
      update({
        categoryId: 'movie', topicId: null,
        directorId: null, starId: null, ipId: null,
        movieId: null, name: '',
      })
    } else {
      // Auto-suggest best fit director/star from roster (specialty match, not booked, highest tier)
      const tierIdx = (t) => ['Common','Uncommon','Rare','Epic','Legendary'].indexOf(t)
      const bestFit = (list) => {
        const fits = (list || [])
          .filter(t => t.specialty === catId && !safeTaken.has(t.id))
          .sort((a, b) => tierIdx(b.tier) - tierIdx(a.tier))
        return fits[0]?.id || null
      }
      update({
        categoryId: catId, topicId: null, movieId: null,
        directorId: bestFit(safeRoster.directors),
        starId:     bestFit(safeRoster.stars),
        ipId: null,
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
    const sh = safeOwned.find(s => s.id === ownedId)
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

  // Filter category list to only unlocked categories
  const unlockedCategoryIds = CATEGORY_IDS.filter(id =>
    id === 'movie' || unlocks.hasCat(id)
  )
  const lockedCategoryIds = CATEGORY_IDS.filter(id =>
    id !== 'movie' && !unlocks.hasCat(id)
  )

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
          <div>
            <div className="bebas" style={{ fontSize: 18, color: T.accent, letterSpacing: '.05em' }}>
              {slotType.icon} {slotType.label} Slot
              {draft.seqSeason ? ` · Season ${draft.seqSeason}` : ''}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              Prefers: {slotType.prefersCategory.map(c => CATEGORIES[c]?.label || c).join(' · ')}
            </div>
          </div>
          <button onClick={onClose} style={{ color: T.muted, fontSize: 18, padding: '0 6px', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 18 }}>

          {/* Seasonal hint banner */}
          {seasonal && (
            <div style={{
              padding: '10px 12px', marginBottom: 14,
              background: T.gold + '14',
              border: `1px solid ${T.gold}55`,
              borderRadius: 5,
              fontSize: 11, color: T.gold, lineHeight: 1.5,
            }}>
              ⭐ <strong>This quarter: {seasonal.label}</strong>
              <div style={{ marginTop: 3, color: T.text, opacity: 0.85 }}>
                Match the suggested category/topic for +{seasonal.bonusH?.toFixed(1)} hype bonus.
              </div>
            </div>
          )}

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
                  cursor: 'pointer',
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
                    <span style={{ fontSize: 16 }}>{c?.icon}</span>
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
              <button onClick={() => setShowRenew(false)} style={{
                fontSize: 11, color: T.muted, marginTop: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}>← Back to fresh program</button>
            </div>
          )}

          {!showRenew && (
            <>
              {/* CATEGORY */}
              <Section title="1. Category">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {unlockedCategoryIds.map(id => {
                    const c = CATEGORIES[id]
                    const isPreferred = slotType.prefersCategory.includes(id)
                    return (
                      <Pill
                        key={id}
                        label={`${c.icon} ${c.label}${isPreferred ? ' ★' : ''}`}
                        active={draft.categoryId === id}
                        onClick={() => pickCategory(id)}
                        color={c.color}
                        disabled={!!draft.fromOwnedId}
                      />
                    )
                  })}
                </div>
                {lockedCategoryIds.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 10, color: T.muted, fontStyle: 'italic' }}>
                    🔒 Locked (research to unlock):{' '}
                    {lockedCategoryIds.map(id => CATEGORIES[id]?.label).join(', ')}
                  </div>
                )}
              </Section>

              {/* MOVIE — special path */}
              {isMovieCategory && (
                <Section title="2. Movie Rights">
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
                    License a pre-made film. No director or star needed.
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
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
                  </div>
                </Section>
              )}

              {/* SCRIPTED PATH */}
              {cat && !isMovieCategory && (
                <>
                  <Section title="2. Topic / Format">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {cat.topics.map(t => {
                        const unlocked = unlocks.hasTopic(draft.categoryId, t.id)
                        return (
                          <Pill
                            key={t.id}
                            label={unlocked ? t.label : `🔒 ${t.label}`}
                            active={draft.topicId === t.id}
                            onClick={() => unlocked && update({ topicId: t.id })}
                            disabled={!unlocked || (!!draft.fromOwnedId && t.id !== draft.topicId)}
                          />
                        )
                      })}
                    </div>
                  </Section>

                  <Section title="3. Director (from your roster)">
                    <TalentList
                      list={safeRoster.directors}
                      categoryId={draft.categoryId}
                      selectedId={draft.directorId}
                      onPick={id => update({ directorId: id })}
                      isBooked={isBooked}
                      role="director"
                    />
                  </Section>

                  <Section title="4. Star (from your roster)">
                    <TalentList
                      list={safeRoster.stars}
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

              {/* MARKETING */}
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

              {/* NAME */}
              {cat && !isMovieCategory && (
                <Section title="7. Show Name (optional)">
                  <input
                    type="text"
                    value={draft.name || ''}
                    onChange={e => update({ name: e.target.value })}
                    placeholder="e.g. Midnight Protocol"
                    maxLength={40}
                    disabled={!!draft.fromOwnedId}
                    style={{
                      width: '100%', fontSize: 14, padding: '8px 12px',
                      background: T.cardHi, border: `1px solid ${T.border}`,
                      color: T.text, borderRadius: 4,
                    }}
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

              {/* Bonus breakdown */}
              {((proj.slotBonusH || 0) > 0 || (proj.seasonBonusH || 0) > 0) && (
                <div style={{
                  fontSize: 10, color: T.gold, marginBottom: 8,
                  padding: 6, background: T.gold + '0a', borderRadius: 3,
                }}>
                  {(proj.slotBonusH || 0) > 0 && <div>✓ Slot fit: +{proj.slotBonusH.toFixed(1)} hype</div>}
                  {(proj.seasonBonusH || 0) > 0 && <div>✓ Seasonal match: +{proj.seasonBonusH.toFixed(1)} hype</div>}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 9, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, color: T.muted }}>Total cost this cycle</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: T.red, fontWeight: 600 }}>
                  ${cost.toFixed(1)}M
                </div>
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 4, fontStyle: 'italic' }}>
                Live results swing ±1.2 quality / ±1.5 hype — anything can happen on air.
              </div>
            </div>
          )}

          {!proj && draft.categoryId && !isMovieCategory && !draft.topicId && (
            <div style={{
              marginTop: 14, padding: 12, fontSize: 11, color: T.muted,
              background: T.cardHi, borderRadius: 5, fontStyle: 'italic',
            }}>
              Pick a topic to see the projection.
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: 14,
          borderTop: `1px solid ${T.border}`,
          display: 'flex', gap: 8, flexWrap: 'wrap',
          background: T.surface,
          position: 'sticky', bottom: 0,
        }}>
          {!valid && (
            <div style={{
              flex: '1 1 100%',
              fontSize: 11, color: T.muted, marginBottom: 4,
              padding: '8px 10px', background: T.cardHi,
              borderRadius: 4, border: `1px dashed ${T.border}`,
            }}>
              <strong style={{ color: T.accent }}>To save this slot:</strong>{' '}
              {!draft.categoryId && !draft.movieId && 'pick a category.'}
              {draft.categoryId === 'movie' && !draft.movieId && 'pick a movie to license.'}
              {draft.categoryId && draft.categoryId !== 'movie' && !draft.topicId && 'pick a topic / format.'}
            </div>
          )}
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
                cursor: 'pointer',
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
              cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            className="cta"
            style={{ width: 'auto', padding: '10px 20px', fontSize: 15, opacity: valid ? 1 : 0.55 }}
            disabled={!valid}
            onClick={save}
          >{valid ? 'Save Slot' : (isMovieMode ? 'Pick a movie' : !draft.categoryId ? 'Pick a category' : 'Pick a topic')}</button>
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
  const sorted = useMemo(() => {
    const tierIdx = (t) => ['Common','Uncommon','Rare','Epic','Legendary'].indexOf(t)
    return [...(list || [])].sort((a, b) => {
      const am = a.specialty === categoryId ? 0 : 1
      const bm = b.specialty === categoryId ? 0 : 1
      if (am !== bm) return am - bm
      return tierIdx(b.tier) - tierIdx(a.tier)
    })
  }, [list, categoryId])

  if (sorted.length === 0) {
    return (
      <div style={{
        fontSize: 11, color: T.muted, fontStyle: 'italic',
        padding: 10, background: T.cardHi, borderRadius: 5, lineHeight: 1.5,
      }}>
        No {role}s under contract.<br />
        Go to the Talent tab to hire someone — or skip this {role} (program will still air).
      </div>
    )
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
                  {CATEGORIES[t.specialty]?.label || t.specialty}
                  {' · '}Q +{t.q.toFixed(1)} · H +{t.h.toFixed(1)}
                </div>
              </div>
              <HTag tier={t.tier} />
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
