import { useState, useMemo, useEffect } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, CATEGORY_IDS, MARKETING_TIERS, IPS, MARKETS, SLOT_TYPES,
  MONTHS, RUN_LENGTHS, SPORTS_LEAGUES,
} from '../constants.js'
import { HTag, Bar, Pill } from './ui.jsx'
import {
  projectShow, programCost, findDirector, findStar, findIP, findMovie, findLeague,
  getUnlocks, getSeasonalPref, ownsLicense, isSportsInSeason,
  unlockedTechFor, findTechOption, activeIPLicenses,
} from '../engine.js'

export function SlotEditor({
  initial, slotTypeId, cycleIdx,
  station, research, roster, movies, takenTalent, ownedShows, year,
  onSave, onClear, onClose,
}) {
  const [draft, setDraft] = useState(() => ({ ...initial, slotTypeId }))
  const [showRenew, setShowRenew] = useState(false)
  const [showSports, setShowSports] = useState(false)

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
  const isSportsMode = !!draft.sportsRunLeagueId
  const cat = draft.categoryId ? CATEGORIES[draft.categoryId] : null
  const isMovieCategory = draft.categoryId === 'movie'

  // Available sports licenses owned this year and not used in another run
  const ownedSportsThisYear = (station.sportsLicenses || [])
    .filter(l => l.year === year)
    .map(l => findLeague(l.leagueId))
    .filter(Boolean)

  const proj = useMemo(() => {
    if (!draft.categoryId && !draft.movieId && !draft.sportsRunLeagueId) return null
    if (!isMovieMode && !isSportsMode && !isMovieCategory && !draft.topicId) return null
    return projectShow(draft, station, research, cycleIdx)
  }, [draft, station, research, isMovieMode, isSportsMode, isMovieCategory, cycleIdx])

  const cost = useMemo(() => {
    if (!draft.categoryId && !draft.movieId && !draft.sportsRunLeagueId) return 0
    return programCost(draft, market, research)
  }, [draft, market, research])

  const totalCommitment = useMemo(() => cost * (draft.runMonths || 1), [cost, draft.runMonths])

  const update = (patch) => setDraft(d => ({ ...d, ...patch }))

  const renewableShows = safeOwned.filter(s => !s.movieId)

  // Booked-this-cycle filter (excluding the slot we're editing)
  const isBooked = (id) => safeTaken.has(id)

  // Validation: needs category+topic OR movie OR sports
  const valid = useMemo(() => {
    if (isSportsMode) return !!draft.sportsRunLeagueId
    if (isMovieMode) return !!draft.movieId
    return !!(draft.categoryId && draft.topicId)
  }, [draft, isMovieMode, isSportsMode])

  function pickSportsLeague(leagueId) {
    update({
      sportsRunLeagueId: leagueId,
      categoryId: null, topicId: null,
      movieId: null, ipId: null,
      runMonths: 12,  // sports always run the full year
      name: '',
      seqSeason: 1,
    })
    setShowSports(false)
  }

  // Auto-fill name if empty when saving — friendlier
  function save() {
    let finalDraft = { ...draft, slotTypeId }
    if (isSportsMode) {
      const lg = findLeague(finalDraft.sportsRunLeagueId)
      finalDraft.name = `${lg?.label || 'Sports'} Coverage`
      finalDraft.runMonths = 12
    } else if (!isMovieMode && !finalDraft.name?.trim()) {
      const c = CATEGORIES[finalDraft.categoryId]
      finalDraft.name = `Untitled ${c?.label || 'Show'}`
    }
    if (isMovieMode) finalDraft.runMonths = 1
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
        movieId: null,
        sportsRunLeagueId: null,
        runMonths: 1,    // movies are always 1 month
        name: '',
        seqSeason: 1,
        fromOwnedId: null,
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
        sportsRunLeagueId: null,
        directorId: bestFit(safeRoster.directors),
        starId:     bestFit(safeRoster.stars),
        ipId: null,
        name: draft.name && !isMovieMode ? draft.name : '',
        seqSeason: 1, fromOwnedId: null,
        prevDirectorId: null, prevStarId: null,
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
      directorId: sh.lastDirectorId || null,
      starId: sh.lastStarId || null,
      ipId: sh.ipId || null,
      name: sh.name,
      seqSeason: (sh.lastSeqSeason || 1) + 1,
      prevDirectorId: sh.lastDirectorId || null,
      prevStarId: sh.lastStarId || null,
      fromOwnedId: ownedId,
      marketingId: 'none',
      movieId: null,
      sportsRunLeagueId: null,
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 14, 23, .85)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 12,
        overflowY: 'auto',
        animation: 'slide-in .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          maxWidth: 720,
          width: '100%',
          marginTop: 20,
          marginBottom: 20,
        }}
      >

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
              ⭐ <strong>{MONTHS[cycleIdx]} wants: {seasonal.label}</strong>
              <div style={{ marginTop: 3, color: T.text, opacity: 0.85 }}>
                Match the suggested category/topic for +{seasonal.bonusH?.toFixed(1)} hype bonus.
              </div>
            </div>
          )}

          {/* Renew option */}
          {!showRenew && !showSports && renewableShows.length > 0 && !draft.fromOwnedId && (
            <div style={{ marginBottom: 10 }}>
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

          {/* Sports rights option */}
          {!showRenew && !showSports && !isSportsMode && ownedSportsThisYear.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowSports(true)}
                style={{
                  background: T.red + '14',
                  border: `1px solid ${T.red}55`,
                  color: T.red,
                  padding: '8px 14px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.05em',
                  cursor: 'pointer',
                }}
              >🏆 Use Sports Rights ({ownedSportsThisYear.length} owned)</button>
            </div>
          )}

          {showSports && (
            <div style={{ marginBottom: 16 }} className="ani">
              <div className="bebas" style={{ fontSize: 13, color: T.red, marginBottom: 7, letterSpacing: '.1em' }}>
                YOUR SPORTS RIGHTS — PICK A LEAGUE TO BROADCAST
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>
                Will lock the slot for 12 months — auto-airs during the league's season window.
              </div>
              {ownedSportsThisYear.map(lg => (
                <div
                  key={lg.id}
                  onClick={() => pickSportsLeague(lg.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 11px', marginBottom: 5,
                    background: T.card,
                    border: `2px solid ${T.border}`,
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{lg.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{lg.label}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>
                      In-season: {lg.season.map(m => MONTHS[m]).join(', ')} · Peak: {MONTHS[lg.peakMonth]} ({lg.peakLabel})
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>BROADCAST</span>
                </div>
              ))}
              <button onClick={() => setShowSports(false)} style={{
                fontSize: 11, color: T.muted, marginTop: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}>← Back to fresh program</button>
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
                        Last season: avg rating {s.lastAvgRating?.toFixed(1) || '-'} · S{s.lastSeqSeason || 1}
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

          {!showRenew && !showSports && !isSportsMode && (
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

                  <Section title="5. IP License (from owned inventory)">
                    <IPList
                      categoryId={draft.categoryId}
                      selectedId={draft.ipId}
                      onPick={id => update({ ipId: id })}
                      station={station}
                      year={year}
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

              {/* PRODUCTION QUALITY (audio / subs / video) */}
              {(draft.categoryId || draft.movieId) && (
                <Section title="Production Quality">
                  <TechPicker
                    label="🎧 Audio"
                    dimension="audio"
                    selectedId={draft.audioId || 'audio_mono'}
                    onPick={id => update({ audioId: id })}
                    research={research}
                  />
                  <TechPicker
                    label="💬 Subtitles"
                    dimension="subtitles"
                    selectedId={draft.subsId || 'subs_none'}
                    onPick={id => update({ subsId: id })}
                    research={research}
                  />
                  <TechPicker
                    label="📺 Video"
                    dimension="video"
                    selectedId={draft.videoId || 'video_sd'}
                    onPick={id => update({ videoId: id })}
                    research={research}
                  />
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

          {/* SPORTS MODE BLOCK */}
          {isSportsMode && !showSports && (() => {
            const lg = findLeague(draft.sportsRunLeagueId)
            if (!lg) return null
            return (
              <div className="ani">
                <div style={{
                  padding: '12px 14px', marginBottom: 14,
                  background: T.red + '10', border: `1px solid ${T.red}55`, borderRadius: 6,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.red, marginBottom: 4 }}>
                    {lg.icon} {lg.label} — Year {year}
                  </div>
                  <div style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>
                    Auto-airs each in-season month: {lg.season.map(m => MONTHS[m]).join(', ')}.{' '}
                    Peak <strong>{MONTHS[lg.peakMonth]}</strong> ({lg.peakLabel}) gets +{lg.peakBonus.toFixed(1)} hype.
                  </div>
                  <button
                    onClick={() => update({
                      sportsRunLeagueId: null, directorId: null, starId: null,
                      runMonths: 1,
                    })}
                    style={{
                      marginTop: 8, fontSize: 10, color: T.muted,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                    }}
                  >← Pick a different league</button>
                </div>

                <Section title="Director (live producer)">
                  <TalentList
                    list={safeRoster.directors}
                    categoryId="sports"
                    selectedId={draft.directorId}
                    onPick={id => update({ directorId: id })}
                    isBooked={isBooked}
                    role="director"
                  />
                </Section>

                <Section title="Star (on-air presenter)">
                  <TalentList
                    list={safeRoster.stars}
                    categoryId="sports"
                    selectedId={draft.starId}
                    onPick={id => update({ starId: id })}
                    isBooked={isBooked}
                    role="star"
                  />
                </Section>

                <Section title="Production Quality">
                  <TechPicker
                    label="🎧 Audio"
                    dimension="audio"
                    selectedId={draft.audioId || 'audio_mono'}
                    onPick={id => update({ audioId: id })}
                    research={research}
                  />
                  <TechPicker
                    label="💬 Subtitles"
                    dimension="subtitles"
                    selectedId={draft.subsId || 'subs_none'}
                    onPick={id => update({ subsId: id })}
                    research={research}
                  />
                  <TechPicker
                    label="📺 Video"
                    dimension="video"
                    selectedId={draft.videoId || 'video_sd'}
                    onPick={id => update({ videoId: id })}
                    research={research}
                  />
                </Section>
              </div>
            )
          })()}

          {/* RUN LENGTH PICKER (hidden for movies + sports — fixed) */}
          {(valid && !isMovieMode && !isSportsMode) && (
            <Section title={`Commitment: How many months will this run?`}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {RUN_LENGTHS.map(r => (
                  <Pill
                    key={r.id}
                    label={`${r.label} · $${(cost * r.months).toFixed(1)}M total`}
                    active={(draft.runMonths || 1) === r.months}
                    onClick={() => update({ runMonths: r.months })}
                  />
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: T.muted, fontStyle: 'italic' }}>
                The slot is locked for this duration. Cancel mid-run for 50% of remaining cost.
              </div>
            </Section>
          )}
          {isMovieMode && (
            <div style={{
              padding: 10, marginTop: 4, marginBottom: 10,
              fontSize: 11, color: T.muted, fontStyle: 'italic',
              background: T.cardHi, borderRadius: 4,
            }}>
              Movies run for 1 month only.
            </div>
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
                <div style={{ fontSize: 11, color: T.muted }}>Cost per month</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: T.red, fontWeight: 600 }}>
                  ${cost.toFixed(1)}M
                </div>
              </div>
              {(draft.runMonths || 1) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: T.muted }}>Total run commitment ({draft.runMonths} mo)</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>
                    ${totalCommitment.toFixed(1)}M
                  </div>
                </div>
              )}
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
              {!draft.categoryId && !draft.movieId && !draft.sportsRunLeagueId && 'pick a category or use sports rights.'}
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
          >{valid ? 'Save Slot' : (
            isSportsMode ? 'Pick director/star' :
            isMovieMode ? 'Pick a movie' :
            !draft.categoryId && !draft.sportsRunLeagueId ? 'Pick a category' :
            'Pick a topic'
          )}</button>
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
        onClick={() => onPick(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 11px', marginBottom: 5,
          background: !selectedId ? 'rgba(232,160,69,.18)' : T.card,
          border: `2px solid ${!selectedId ? T.accent : T.border}`,
          borderRadius: 5,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 16 }}>{!selectedId ? '✓' : '—'}</span>
        <div style={{ flex: 1, fontSize: 12, color: !selectedId ? T.accent : T.muted, fontStyle: 'italic', fontWeight: !selectedId ? 600 : 400 }}>
          None / unsigned
        </div>
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {sorted.map(t => {
          const matches = t.specialty === categoryId
          const booked = isBooked(t.id) && t.id !== selectedId
          const isSelected = selectedId === t.id
          return (
            <div
              key={t.id}
              onClick={() => !booked && onPick(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '10px 11px', marginBottom: 5,
                background: isSelected ? 'rgba(232,160,69,.20)' : T.card,
                border: `2px solid ${isSelected ? T.accent : T.border}`,
                borderRadius: 5,
                cursor: booked ? 'not-allowed' : 'pointer',
                opacity: booked ? 0.4 : 1,
                boxShadow: isSelected ? `0 0 0 1px ${T.accent}55` : 'none',
              }}
            >
              {isSelected && <span style={{ fontSize: 14, color: T.accent, fontWeight: 700 }}>✓</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? T.accent : T.text,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {t.name}
                  {isSelected && <span style={{ fontSize: 9, color: T.accent, fontWeight: 700, letterSpacing: '.1em' }}>SELECTED</span>}
                  {matches && !isSelected && <span style={{ fontSize: 9, color: T.green, fontWeight: 600 }}>★ FIT</span>}
                  {booked && <span style={{ fontSize: 9, color: T.red, fontWeight: 600 }}>BOOKED</span>}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
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

function IPList({ categoryId, selectedId, onPick, station, year }) {
  const owned = activeIPLicenses(station, year)
    .map(l => ({ ip: findIP(l.ipId), license: l }))
    .filter(x => x.ip && x.ip.fits.includes(categoryId))

  if (owned.length === 0) {
    return (
      <div style={{
        fontSize: 11, color: T.muted, fontStyle: 'italic',
        padding: 10, background: T.cardHi, borderRadius: 4, border: `1px dashed ${T.border}`,
      }}>
        You don't own any IP licenses that fit this category.
        Buy IPs in <strong>Operations → Purchase Rights</strong>.
      </div>
    )
  }

  return (
    <>
      <div
        onClick={() => onPick(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 11px', marginBottom: 5,
          background: !selectedId ? 'rgba(232,160,69,.18)' : T.card,
          border: `2px solid ${!selectedId ? T.accent : T.border}`,
          borderRadius: 5,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 16 }}>{!selectedId ? '✓' : '—'}</span>
        <div style={{ flex: 1, fontSize: 12, color: !selectedId ? T.accent : T.muted, fontStyle: 'italic', fontWeight: !selectedId ? 600 : 400 }}>
          No IP / original content
        </div>
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {owned.map(({ ip, license }) => {
          const isSelected = selectedId === ip.id
          const yearsLeft = license.expiresYear - year + 1
          return (
            <div
              key={ip.id}
              onClick={() => onPick(ip.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '10px 11px', marginBottom: 5,
                background: isSelected ? 'rgba(232,160,69,.20)' : T.card,
                border: `2px solid ${isSelected ? T.accent : T.border}`,
                borderRadius: 5,
                cursor: 'pointer',
                boxShadow: isSelected ? `0 0 0 1px ${T.accent}55` : 'none',
              }}
            >
              <span style={{ fontSize: 14 }}>{isSelected ? '✓' : '📜'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 600, color: isSelected ? T.accent : T.text }}>
                  {ip.name}
                  {isSelected && <span style={{ fontSize: 9, color: T.accent, fontWeight: 700, letterSpacing: '.1em', marginLeft: 6 }}>SELECTED</span>}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                  Q +{ip.q.toFixed(1)} · H +{ip.h.toFixed(1)} · {yearsLeft}y left
                </div>
              </div>
              <HTag tier={ip.tier} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.green, minWidth: 56, textAlign: 'right' }}>
                OWNED
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── TECH PICKER (audio/subs/video tier row) ─────────────────────────────────
function TechPicker({ label, dimension, selectedId, onPick, research }) {
  const unlocked = unlockedTechFor(dimension, research)
  const allOptions = dimension === 'audio' ? [
    { id: 'audio_mono', label: 'Mono' },
    { id: 'audio_stereo', label: 'Stereo' },
    { id: 'audio_surround', label: 'Surround 5.1' },
  ] : dimension === 'subtitles' ? [
    { id: 'subs_none', label: 'None' },
    { id: 'subs_basic', label: 'Basic' },
    { id: 'subs_multi', label: 'Multi-Lang' },
  ] : [
    { id: 'video_sd', label: 'SD' },
    { id: 'video_hd', label: 'HD' },
    { id: 'video_uhd', label: '4K UHD' },
  ]
  const unlockedIds = new Set(unlocked.map(o => o.id))

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {allOptions.map(opt => {
          const isUnlocked = unlockedIds.has(opt.id)
          const isSelected = selectedId === opt.id
          const fullOpt = unlocked.find(u => u.id === opt.id)
          const qHTag = fullOpt && (fullOpt.q > 0 || fullOpt.h > 0)
            ? ` (+${fullOpt.q.toFixed(1)}Q +${fullOpt.h.toFixed(1)}H · $${fullOpt.cost.toFixed(1)}M/mo)`
            : ''
          return (
            <button
              key={opt.id}
              onClick={() => isUnlocked && onPick(opt.id)}
              disabled={!isUnlocked}
              style={{
                background: isSelected ? T.accent + '22' : T.card,
                border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                borderRadius: 4, padding: '5px 9px',
                fontSize: 10, color: isUnlocked ? (isSelected ? T.accent : T.text) : T.muted,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                fontWeight: isSelected ? 700 : 500,
              }}
            >{isUnlocked ? '' : '🔒 '}{opt.label}{qHTag}</button>
          )
        })}
      </div>
    </div>
  )
}
