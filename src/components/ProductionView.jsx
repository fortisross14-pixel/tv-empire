import { useState, useMemo, useEffect } from 'react'
import { T, FONTS } from '../theme.js'
import {
  CATEGORIES, MARKETING_TIERS, RUN_LENGTHS, MOVIES, MONTHS,
  PROD_DESIGN_TIERS, SFX_TIERS, MUSIC_TIERS, AUDIO_TIERS, SUBTITLE_TIERS, VIDEO_TIERS,
  SPORTS_LEAGUES,
  SCRIPT_TIER_RANK, STAR_TIER_MAX_FOR_SCRIPT,
} from '../constants.js'
// Note: HTag/SectionTitle/Card from ./ui.jsx removed in stage AN — replaced
// with inline editorial form vocabulary.
import {
  findDirector, findStar, findIP, findLeague, findMovie,
  activeRoster, activeIPLicenses, ownsLicense,
  estimateProgramQH, programBuildCost,
  productionMethodFor, productionMonthsFor,
  unlockedTechFor, findTechOption,
  hasDirector,
  canPrepareMerch, merchPrepareCost,
  fmtM,
} from '../engine.js'

/**
 * ProductionView — the program build pipeline.
 *
 * Flow:
 *   1) Pick what to build: Script (default) | Movie | Sports
 *   2) Pick crew: director + star (skipped for movies)
 *   3) Pick tiers: prod-design + SFX (BLIND — no good/bad badges)
 *   4) Pick tech: audio + subs + video
 *   5) Pick marketing
 *   6) Pick run length (drives prod time + per-airing split)
 *   7) Confirm — shows total cost & upfront cost; "Begin production"
 *
 * Estimated Q/H range stays visible at the bottom and re-rolls every time the
 * player toggles a meaningful field. They're not told *why* their pick raised
 * or lowered it — they have to read the numbers.
 *
 * Stage AN: full editorial migration. ALL state/effects/opts assembly is
 * preserved verbatim — only the render layer is editorialized.
 */
export function ProductionView({
  station, research, year, monthIdx,
  onBegin, onClose,
}) {
  // ── BUILD TYPE: script | movie | sports ─────────────────────────────
  const readyScripts = (station.scripts || []).filter(s => s.status === 'ready')
  const [buildType, setBuildType] = useState(readyScripts.length > 0 ? 'script' : 'movie')

  // ── PRIMARY SELECTION ──────────────────────────────────────────────
  const [scriptId, setScriptId] = useState(readyScripts[0]?.id || null)
  const [movieId, setMovieId] = useState(null)
  const [sportsLeagueId, setSportsLeagueId] = useState(null)

  // ── NAME ───────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const script = scriptId ? readyScripts.find(s => s.id === scriptId) : null
  const movie = movieId ? findMovie(movieId) : null
  const league = sportsLeagueId ? findLeague(sportsLeagueId) : null

  useEffect(() => {
    if (nameTouched) return
    if (buildType === 'script' && script) setName(script.name)
    else if (buildType === 'movie' && movie) setName(movie.name)
    else if (buildType === 'sports' && league) setName(`${league.label} ${year}`)
    else setName('')
  }, [buildType, scriptId, movieId, sportsLeagueId, script?.name, movie?.name, league?.label])

  // ── DERIVED CATEGORY/TOPIC/IP ──────────────────────────────────────
  const categoryId =
    buildType === 'script' ? script?.categoryId
    : buildType === 'movie' ? 'movie'
    : 'sports'
  const topicId =
    buildType === 'script' ? script?.topicId
    : buildType === 'movie' ? 'movie'
    : 'live'
  const ipId = buildType === 'script' ? (script?.ipId || null) : null

  // ── CREW ───────────────────────────────────────────────────────────
  const roster = useMemo(() => activeRoster(station), [station.hiredDirectors, station.hiredStars])
  const needsCrew = buildType !== 'movie'

  const dirsSorted = useMemo(() => sortBySpecialty(roster.directors, categoryId), [roster.directors, categoryId])
  const starsSorted = useMemo(() => sortBySpecialty(roster.stars, categoryId), [roster.stars, categoryId])
  const [directorId, setDirectorId] = useState(dirsSorted[0]?.id || null)
  const [starId, setStarId] = useState(starsSorted[0]?.id || null)
  const [starId2, setStarId2] = useState(null)

  const scriptTier = script?.tier || 'normal'
  const scriptTierRank = SCRIPT_TIER_RANK[scriptTier] ?? 0
  const allowedStarTiers = STAR_TIER_MAX_FOR_SCRIPT[scriptTier] || []

  useEffect(() => {
    if (!needsCrew) return
    if (!directorId || !roster.directors.find(d => d.id === directorId)) {
      setDirectorId(dirsSorted[0]?.id || null)
    }
    if (!starId || !roster.stars.find(s => s.id === starId)) {
      setStarId(starsSorted[0]?.id || null)
    }
  }, [categoryId, needsCrew])

  useEffect(() => {
    if (!needsCrew) return
    if (scriptTier !== 'super') setStarId2(null)
    const curStar = roster.stars.find(s => s.id === starId)
    if (curStar && !allowedStarTiers.includes(curStar.tier)) {
      const firstAllowed = starsSorted.find(s => allowedStarTiers.includes(s.tier))
      setStarId(firstAllowed?.id || null)
    }
  }, [scriptTier, needsCrew])

  useEffect(() => {
    const isLocked = (id, list) => {
      const o = list.find(x => x.id === id)
      const need = SCRIPT_TIER_RANK[o?.minScriptTier] ?? 0
      return need > scriptTierRank
    }
    if (isLocked(prodDesignId, PROD_DESIGN_TIERS)) setProdDesignId('pd_realnormal')
    if (isLocked(sfxId, SFX_TIERS))                setSfxId('sfx_none')
    if (isLocked(subsId, SUBTITLE_TIERS))          setSubsId('subs_none')
    if (isLocked(videoId, VIDEO_TIERS))            setVideoId('video_sd')
  }, [scriptTierRank])

  // ── TIERS (blind — no good/bad badges) ─────────────────────────────
  const [prodDesignId, setProdDesignId] = useState('pd_realnormal')
  const [sfxId, setSfxId] = useState('sfx_none')
  const [musicId, setMusicId] = useState('mus_basic')

  // ── TECH ───────────────────────────────────────────────────────────
  const audioOpts = unlockedTechFor('audio', research)
  const subsOpts  = unlockedTechFor('subtitles', research)
  const videoOpts = unlockedTechFor('video', research)
  const [audioId, setAudioId] = useState(audioOpts[0]?.id || 'audio_mono')
  const [subsId,  setSubsId]  = useState(subsOpts[0]?.id  || 'subs_none')
  const [videoId, setVideoId] = useState(videoOpts[0]?.id || 'video_sd')

  // ── MARKETING ──────────────────────────────────────────────────────
  const [marketingId, setMarketingId] = useState('none')
  const [prepareMerch, setPrepareMerch] = useState(false)
  const merchAvailable = canPrepareMerch(station, scriptTier)
  useEffect(() => {
    if (!merchAvailable && prepareMerch) setPrepareMerch(false)
  }, [merchAvailable, prepareMerch])

  // ── PLANNED RUN LENGTH ─────────────────────────────────────────────
  const [plannedRunMonths, setPlannedRunMonths] = useState(
    buildType === 'movie' ? 1 : (buildType === 'sports' ? 12 : 1)
  )
  useEffect(() => {
    if (buildType === 'movie') setPlannedRunMonths(1)
    else if (buildType === 'sports') setPlannedRunMonths(12)
  }, [buildType])

  // ── BUILD OPTS ASSEMBLY ────────────────────────────────────────────
  const opts = useMemo(() => ({
    name: name.trim(),
    scriptId: buildType === 'script' ? scriptId : null,
    movieId: buildType === 'movie' ? movieId : null,
    sportsLeagueId: buildType === 'sports' ? sportsLeagueId : null,
    categoryId, topicId, ipId,
    directorId: needsCrew ? directorId : null,
    starId: needsCrew ? starId : null,
    starId2: needsCrew && scriptTier === 'super' ? starId2 : null,
    prodDesignId, sfxId, musicId,
    audioId, subsId, videoId,
    marketingId,
    plannedRunMonths,
    prepareMerch: merchAvailable && prepareMerch,
  }), [name, buildType, scriptId, movieId, sportsLeagueId, categoryId, topicId, ipId,
       needsCrew, directorId, starId, starId2, scriptTier,
       prodDesignId, sfxId, musicId,
       audioId, subsId, videoId, marketingId, plannedRunMonths,
       merchAvailable, prepareMerch])

  // ── LIVE ESTIMATE ──────────────────────────────────────────────────
  const [estVersion, setEstVersion] = useState(0)
  const estimate = useMemo(() => {
    if (buildType === 'script' && !scriptId) return null
    if (buildType === 'movie' && !movieId) return null
    if (buildType === 'sports' && !sportsLeagueId) return null
    try {
      return estimateProgramQH(opts, station, research)
    } catch (e) {
      return null
    }
  }, [opts, station, research, estVersion])

  // ── COST ───────────────────────────────────────────────────────────
  const totalCost = useMemo(() => {
    if (buildType === 'script' && !scriptId) return 0
    if (buildType === 'movie' && !movieId) return 0
    if (buildType === 'sports' && !sportsLeagueId) return 0
    try { return programBuildCost(opts, station, research, year) }
    catch (e) { return 0 }
  }, [opts, station, research, year])

  // ── PRODUCTION TIMING ──────────────────────────────────────────────
  const method = useMemo(() => productionMethodFor(opts), [opts])
  const prodMonths = useMemo(() => productionMonthsFor(method, plannedRunMonths), [method, plannedRunMonths])

  const { prepCost, perAiring } = useMemo(() => {
    if (totalCost <= 0) return { prepCost: 0, perAiring: 0 }
    if (method === 'instant') return { prepCost: totalCost, perAiring: 0 }
    if (method === 'live') {
      const prep = Math.round(totalCost * 0.25 * 10) / 10
      const remain = totalCost - prep
      return { prepCost: prep, perAiring: Math.round((remain / Math.max(1, plannedRunMonths)) * 100) / 100 }
    }
    const prep = Math.round(totalCost * 0.9 * 10) / 10
    const remain = totalCost - prep
    return { prepCost: prep, perAiring: Math.round((remain / Math.max(1, plannedRunMonths)) * 100) / 100 }
  }, [totalCost, method, plannedRunMonths])

  // ── VALIDATION ─────────────────────────────────────────────────────
  const canBegin = useMemo(() => {
    if (!name.trim() || name.trim().length < 2) return false
    if (buildType === 'script' && !scriptId) return false
    if (buildType === 'movie' && !movieId) return false
    if (buildType === 'sports') {
      if (!sportsLeagueId) return false
      if (!ownsLicense(station, sportsLeagueId, year)) return false
    }
    if (needsCrew && (!directorId || !starId)) return false
    if (station.cash < prepCost) return false
    return true
  }, [name, buildType, scriptId, movieId, sportsLeagueId, station, year, needsCrew, directorId, starId, prepCost])

  const insufficient = station.cash < prepCost

  const sportsLeadMsg = useMemo(() => {
    if (buildType !== 'sports' || !sportsLeagueId) return null
    const lg = findLeague(sportsLeagueId)
    if (!lg) return null
    const nextAir = (monthIdx + 1) % 12
    const inSeason = lg.season.includes(nextAir)
    if (inSeason) {
      return { ok: true, msg: `Production ready by ${MONTHS[nextAir]} — ${lg.label} is in-season then.` }
    }
    let m = nextAir
    let count = 0
    while (count < 12 && !lg.season.includes(m)) { m = (m + 1) % 12; count++ }
    return {
      ok: false,
      msg: `Production ready by ${MONTHS[nextAir]}, but ${lg.label}'s next in-season month is ${MONTHS[m]} — you'll miss earlier games.`,
    }
  }, [buildType, sportsLeagueId, monthIdx])

  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <EditorialModal onClose={onClose}>
      {/* ─── STICKY HEADER ─── */}
      <div style={{
        position: 'sticky', top: -26, marginTop: -26, marginLeft: -26, marginRight: -26,
        padding: '16px 26px',
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '.2em',
              textTransform: 'uppercase', color: T.accent,
            }}>
              Production
            </div>
            <h2 style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 144, 'wght' 600",
              fontSize: 22, lineHeight: 1.05, letterSpacing: '-.015em',
              color: T.text, marginTop: 2,
            }}>
              New production
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: T.muted,
            fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1,
            transition: 'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >✕</button>
        </div>
      </div>

      <div style={{ paddingTop: 18 }}>

        {/* ── BUILD TYPE ─── */}
        <EditorialField label="Source">
          <div style={{ display: 'flex', gap: 6 }}>
            <TypeChip label="📝 From script" active={buildType === 'script'}
              disabled={readyScripts.length === 0}
              onClick={() => { setBuildType('script'); setEstVersion(v => v+1) }} />
            <TypeChip label="🎞 Movie" active={buildType === 'movie'}
              onClick={() => { setBuildType('movie'); setEstVersion(v => v+1) }} />
            <TypeChip label="🏆 Sports rights" active={buildType === 'sports'}
              disabled={(station.sportsLicenses || []).filter(l => l.year === year).length === 0}
              onClick={() => { setBuildType('sports'); setEstVersion(v => v+1) }} />
          </div>
          {readyScripts.length === 0 && buildType === 'script' && (
            <FieldNote tone="gold">
              No ready scripts. Commission one in Content → Scripts first.
            </FieldNote>
          )}
        </EditorialField>

        {/* ── PRIMARY SELECTION ─── */}
        {buildType === 'script' && readyScripts.length > 0 && (
          <EditorialField label="Script">
            <EditorialSelect value={scriptId || ''} onChange={e => { setScriptId(e.target.value); setEstVersion(v => v+1) }}>
              {readyScripts.map(s => {
                const cat = CATEGORIES[s.categoryId]
                const tierLabel = (s.tier && s.tier !== 'normal') ? ` [${s.tier.toUpperCase()}]` : ''
                return (
                  <option key={s.id} value={s.id}>
                    {s.name}{tierLabel} · {cat?.label || s.categoryId} · hype {Math.round(s.hype)}
                    {s.timesUsed > 0 ? ` (${s.timesUsed} uses)` : ''}
                  </option>
                )
              })}
            </EditorialSelect>
            {script && (
              <FieldNote tone={scriptTier === 'super' ? 'gold' : scriptTier === 'large' ? 'teal' : 'muted'}>
                {scriptTier === 'super' ? '★ Super script — top-tier production unlocked, cast 2 stars'
                  : scriptTier === 'large' ? '★ Large script — top-tier production unlocked'
                  : 'Normal script — Common/Uncommon/Rare stars only, mid-tier production max'}
              </FieldNote>
            )}
            {script && script.timesUsed > 0 && (
              <FieldNote tone="gold">
                Already used {script.timesUsed} time{script.timesUsed > 1 ? 's' : ''} — each use decays hype 20%.
              </FieldNote>
            )}
          </EditorialField>
        )}

        {buildType === 'movie' && (
          <EditorialField label="Movie pack">
            {(() => {
              const ownedActivePacks = (station.moviePacks || [])
                .filter(p => (p.airingsLeft || 0) > 0)
                .map(p => {
                  const pack = MOVIES.find(m => m.id === p.packId)
                  return pack ? { ...p, pack } : null
                })
                .filter(Boolean)

              if (ownedActivePacks.length === 0) {
                return (
                  <div style={{
                    padding: '12px 14px',
                    background: T.surface,
                    border: `1px dashed ${T.red}55`,
                    borderLeft: `2px solid ${T.red}`,
                    borderRadius: 4,
                  }}>
                    <div style={{
                      fontFamily: FONTS.serif,
                      fontVariationSettings: "'opsz' 14, 'wght' 400",
                      fontStyle: 'italic',
                      fontSize: 13, color: T.text, lineHeight: 1.5,
                    }}>
                      No movie packs on shelf. Buy one in <span className="mono" style={{ fontStyle: 'normal', fontSize: 11.5, color: T.text }}>Operations → Rights</span> first.
                    </div>
                  </div>
                )
              }

              return (
                <EditorialSelect
                  value={movieId || ''}
                  onChange={e => { setMovieId(e.target.value); setEstVersion(v => v+1) }}
                >
                  <option value="">— pick a pack —</option>
                  {ownedActivePacks.map(p => (
                    <option key={p.packId} value={p.packId}>
                      {p.pack.name} · {p.pack.tier} · {p.airingsLeft}/{p.pack.packSize || 3} airings left
                    </option>
                  ))}
                </EditorialSelect>
              )
            })()}
          </EditorialField>
        )}

        {buildType === 'sports' && (
          <EditorialField label="Sports rights">
            <EditorialSelect value={sportsLeagueId || ''} onChange={e => { setSportsLeagueId(e.target.value); setEstVersion(v => v+1) }}>
              <option value="">— pick a league —</option>
              {(station.sportsLicenses || [])
                .filter(l => l.year === year)
                .map(l => {
                  const lg = findLeague(l.leagueId)
                  return <option key={l.leagueId} value={l.leagueId}>{lg?.icon} {lg?.label}</option>
                })}
            </EditorialSelect>
            {sportsLeadMsg && (
              <div style={{
                marginTop: 8, padding: '10px 12px',
                background: sportsLeadMsg.ok
                  ? `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`
                  : T.surface,
                border: `1px solid ${sportsLeadMsg.ok ? T.green + '55' : T.gold + '55'}`,
                borderLeft: `2px solid ${sportsLeadMsg.ok ? T.green : T.gold}`,
                borderRadius: 3,
              }}>
                <div className="mono" style={{
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '.14em', textTransform: 'uppercase',
                  color: sportsLeadMsg.ok ? T.green : T.gold,
                  marginBottom: 3,
                }}>
                  {sportsLeadMsg.ok ? 'In season' : 'Out of season'}
                </div>
                <div style={{
                  fontFamily: FONTS.serif,
                  fontVariationSettings: "'opsz' 14, 'wght' 400",
                  fontStyle: 'italic',
                  fontSize: 12.5, color: T.textDim, lineHeight: 1.5,
                }}>
                  {sportsLeadMsg.msg}
                </div>
              </div>
            )}
          </EditorialField>
        )}

        {/* ── NAME ─── */}
        <EditorialField label="Program title">
          <EditorialInput
            value={name}
            onChange={e => { setName(e.target.value); setNameTouched(true) }}
            placeholder="e.g. The Last Frontier"
            maxLength={48}
          />
        </EditorialField>

        {/* ── CREW ─── */}
        {needsCrew && (
          <>
            <EditorialField label="Director">
              <EditorialSelect value={directorId || ''} onChange={e => { setDirectorId(e.target.value); setEstVersion(v => v+1) }}>
                {dirsSorted.length === 0 && <option value="">— no directors on roster —</option>}
                {dirsSorted.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.tier} · best at {d.specialty}{d.specialty === categoryId ? ' ✓' : ''}
                  </option>
                ))}
              </EditorialSelect>
            </EditorialField>

            <EditorialField label={scriptTier === 'super' ? 'Lead star' : 'Star'}>
              <EditorialSelect value={starId || ''} onChange={e => { setStarId(e.target.value); setEstVersion(v => v+1) }}>
                {starsSorted.length === 0 && <option value="">— no stars on roster —</option>}
                {starsSorted.map(s => {
                  const allowed = allowedStarTiers.includes(s.tier)
                  return (
                    <option key={s.id} value={s.id} disabled={!allowed}>
                      {s.name} · {s.tier} · best at {s.specialty}{s.specialty === categoryId ? ' ✓' : ''}{!allowed ? ' 🔒' : ''}
                    </option>
                  )
                })}
              </EditorialSelect>
              {scriptTier !== 'super' && scriptTier !== 'large' && (
                <FieldNote tone="muted">
                  Epic/Legendary stars need Large/Super scripts.
                </FieldNote>
              )}
            </EditorialField>

            {scriptTier === 'super' && (
              <EditorialField label="Co-star · Super scripts only">
                <EditorialSelect value={starId2 || ''} onChange={e => { setStarId2(e.target.value || null); setEstVersion(v => v+1) }}>
                  <option value="">— none —</option>
                  {starsSorted.filter(s => s.id !== starId).map(s => {
                    const allowed = allowedStarTiers.includes(s.tier)
                    return (
                      <option key={s.id} value={s.id} disabled={!allowed}>
                        {s.name} · {s.tier} · best at {s.specialty}{s.specialty === categoryId ? ' ✓' : ''}{!allowed ? ' 🔒' : ''}
                      </option>
                    )
                  })}
                </EditorialSelect>
                <FieldNote tone="muted">
                  Adds a second lead at 75% weight — meaningful Q + H boost.
                </FieldNote>
              </EditorialField>
            )}
          </>
        )}

        {/* ── TIERS (BLIND) ─── */}
        {buildType !== 'movie' ? (
          <>
            <EditorialField label="Production design">
              <TierPicker
                tiers={PROD_DESIGN_TIERS}
                selectedId={prodDesignId}
                onPick={(id) => { setProdDesignId(id); setEstVersion(v => v+1) }}
                scriptTierRank={scriptTierRank}
              />
            </EditorialField>

            <EditorialField label="Special effects">
              <TierPicker
                tiers={SFX_TIERS}
                selectedId={sfxId}
                onPick={(id) => { setSfxId(id); setEstVersion(v => v+1) }}
                scriptTierRank={scriptTierRank}
                research={research}
              />
            </EditorialField>

            <EditorialField label="Music">
              <TierPicker
                tiers={MUSIC_TIERS}
                selectedId={musicId}
                onPick={(id) => { setMusicId(id); setEstVersion(v => v+1) }}
                scriptTierRank={scriptTierRank}
              />
            </EditorialField>
          </>
        ) : (
          <div style={{
            padding: '12px 14px', marginBottom: 14,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderLeft: `2px solid ${T.accent}`,
            borderRadius: 3,
          }}>
            <div style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 14, 'wght' 400",
              fontStyle: 'italic',
              fontSize: 13, color: T.textDim, lineHeight: 1.55,
            }}>
              Movies arrive already finished. You're just licensing the film and packaging it for air — pick marketing & tech below.
            </div>
          </div>
        )}

        {/* ── TECH (collapsed by default) ─── */}
        <details style={{ marginBottom: 14 }}>
          <summary className="mono" style={{
            fontSize: 9.5, color: T.muted, fontWeight: 700,
            letterSpacing: '.16em', textTransform: 'uppercase',
            cursor: 'pointer', userSelect: 'none', padding: '6px 0',
          }}>
            Technical quality · expand
          </summary>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <TechRow label="Audio"     options={audioOpts}  selectedId={audioId} onPick={(id) => { setAudioId(id); setEstVersion(v => v+1) }} scriptTierRank={scriptTierRank} />
            <TechRow label="Subtitles" options={subsOpts}   selectedId={subsId}  onPick={(id) => { setSubsId(id);  setEstVersion(v => v+1) }} scriptTierRank={scriptTierRank} />
            <TechRow label="Video"     options={videoOpts}  selectedId={videoId} onPick={(id) => { setVideoId(id); setEstVersion(v => v+1) }} scriptTierRank={scriptTierRank} />
          </div>
        </details>

        {/* ── MARKETING ─── */}
        <EditorialField label="Launch marketing">
          <EditorialSelect value={marketingId} onChange={e => { setMarketingId(e.target.value); setEstVersion(v => v+1) }}>
            {MARKETING_TIERS
              .filter(m => !m.localOnly || station.market === 'local')
              .map(m => {
                const lockedByDir = (m.id === 'medium' || m.id === 'big' || m.id === 'massive') && !hasDirector(station, 'marketing')
                return (
                  <option key={m.id} value={m.id} disabled={lockedByDir}>
                    {m.label} {m.cost > 0 ? `· ${fmtM(m.cost)}` : '· free'}{lockedByDir ? ' 🔒 needs Dir. of Marketing' : ''}
                  </option>
                )
              })}
          </EditorialSelect>
        </EditorialField>

        {/* ── MERCHANDISING ─── */}
        {merchAvailable && (
          <EditorialField label="Merchandising">
            <MerchToggle
              active={prepareMerch}
              cost={merchPrepareCost(scriptTier)}
              onToggle={() => { setPrepareMerch(v => !v); setEstVersion(v => v+1) }}
            />
          </EditorialField>
        )}

        {/* ── RUN LENGTH ─── */}
        {buildType === 'script' && (
          <EditorialField label="Planned airing length">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RUN_LENGTHS.map(rl => (
                <Chip key={rl.id}
                  label={rl.label}
                  active={plannedRunMonths === rl.months}
                  onClick={() => { setPlannedRunMonths(rl.months); setEstVersion(v => v+1) }} />
              ))}
            </div>
          </EditorialField>
        )}

        {/* ── ESTIMATE ─── */}
        <EstimateCard
          estimate={estimate}
          method={method}
          prodMonths={prodMonths}
          prepCost={prepCost}
          perAiring={perAiring}
          totalCost={totalCost}
          insufficient={insufficient}
        />

        {insufficient && (
          <div style={{
            marginTop: 10, padding: '10px 12px',
            background: T.surface,
            border: `1px dashed ${T.red}55`,
            borderLeft: `2px solid ${T.red}`,
            borderRadius: 3,
          }}>
            <div className="mono" style={{
              fontSize: 10, color: T.red, fontWeight: 700,
              letterSpacing: '.14em', textTransform: 'uppercase',
            }}>
              Need {fmtM(prepCost)} upfront · have {fmtM(station.cash)}
            </div>
          </div>
        )}

        {/* ── BUTTONS ─── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton
            onClick={() => canBegin && onBegin(opts)}
            disabled={!canBegin}
          >
            Begin production {prodMonths > 0 && `· ${prodMonths} mo`}
          </PrimaryButton>
        </div>
      </div>
    </EditorialModal>
  )
}

// ─── SUBCOMPONENTS ──────────────────────────────────────────────────

/** Tier picker for prod-design/SFX/music — gradient surface, locked = dashed.
 *  Blind picker (no good/bad labels — player has to read the cost). */
function TierPicker({ tiers, selectedId, onPick, scriptTierRank = 0, research = {} }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 6,
    }}>
      {tiers.map(t => {
        const isSel = t.id === selectedId
        const needRank = SCRIPT_TIER_RANK[t.minScriptTier] ?? 0
        const lockedScript = needRank > scriptTierRank
        const needsResearch = t.requires && !(research?.unlocked || []).includes(t.requires)
        const locked = lockedScript || needsResearch
        return (
          <TierPickerCard
            key={t.id}
            tier={t}
            isSel={isSel}
            locked={locked}
            lockedScript={lockedScript}
            needsResearch={needsResearch}
            onClick={() => !locked && onPick(t.id)}
          />
        )
      })}
    </div>
  )
}

function TierPickerCard({ tier, isSel, locked, lockedScript, needsResearch, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={locked}
      style={{
        background: isSel
          ? T.accent + '18'
          : (hover && !locked
              ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
              : T.surface),
        border: isSel
          ? `1px solid ${T.accent}`
          : `1px ${locked ? 'dashed' : 'solid'} ${locked ? T.border : (hover ? T.borderHi : T.border)}`,
        borderRadius: 5,
        padding: '9px 11px',
        textAlign: 'left',
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.55 : 1,
        color: T.text,
        fontFamily: FONTS.sans,
        transition: 'background .15s, border-color .15s',
      }}
    >
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 24, 'wght' 600",
        fontSize: 13, letterSpacing: '-.005em',
        color: isSel ? T.accent : T.text,
        marginBottom: 4, lineHeight: 1.2,
      }}>
        {tier.label}{locked && ' 🔒'}
      </div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 11, color: T.muted, lineHeight: 1.4, marginBottom: 6,
      }}>
        {tier.desc}
      </div>
      <div className="mono" style={{
        fontSize: 10.5, color: T.text, fontWeight: 700, letterSpacing: '-.005em',
      }}>
        {tier.cost > 0 ? fmtM(tier.cost) : 'free'}
      </div>
      {lockedScript && (
        <div className="mono" style={{
          fontSize: 9, color: T.red, fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 5,
        }}>
          Needs {tier.minScriptTier} script
        </div>
      )}
      {!lockedScript && needsResearch && (
        <div className="mono" style={{
          fontSize: 9, color: T.red, fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 5,
        }}>
          Needs research
        </div>
      )}
    </button>
  )
}

/** Tech row (audio / subs / video) — small mono label + editorial select. */
function TechRow({ label, options, selectedId, onPick, scriptTierRank = 0 }) {
  return (
    <div>
      <div className="mono" style={{
        fontSize: 9, color: T.muted, fontWeight: 700,
        letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      <EditorialSelect value={selectedId} onChange={e => onPick(e.target.value)}>
        {options.map(o => {
          const needRank = SCRIPT_TIER_RANK[o.minScriptTier] ?? 0
          const locked = needRank > scriptTierRank
          return (
            <option key={o.id} value={o.id} disabled={locked}>
              {o.label} {o.cost ? `· ${fmtM(o.cost)}` : ''}{locked ? ` 🔒 needs ${o.minScriptTier}` : ''}
            </option>
          )
        })}
      </EditorialSelect>
    </div>
  )
}

/** Type chip — used for the source picker (script/movie/sports). */
function TypeChip({ label, active, disabled, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, padding: '10px 8px',
        background: active
          ? T.accent + '18'
          : (hover && !disabled
              ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
              : T.surface),
        border: active
          ? `1px solid ${T.accent}`
          : `1px ${disabled ? 'dashed' : 'solid'} ${disabled ? T.border : (hover ? T.borderHi : T.border)}`,
        borderRadius: 5,
        color: active ? T.accent : (disabled ? T.muted : T.text),
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: active ? 700 : 600,
        letterSpacing: '.06em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .15s, border-color .15s, color .15s',
      }}
    >
      {label}
    </button>
  )
}

/** Merchandising toggle — large editorial button with cost callout. */
function MerchToggle({ active, cost, onToggle }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', textAlign: 'left',
        padding: '14px 16px',
        background: active
          ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
          : (hover
              ? `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`
              : T.surface),
        border: `1px solid ${active ? T.accent : (hover ? T.borderHi : T.border)}`,
        borderLeft: `3px solid ${active ? T.accent : T.borderHi}`,
        borderRadius: 5,
        color: T.text,
        cursor: 'pointer',
        fontFamily: FONTS.sans,
        transition: 'background .15s, border-color .15s',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6, gap: 12,
      }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 24, 'wght' 600",
          fontSize: 15, letterSpacing: '-.005em',
          color: active ? T.accent : T.text,
        }}>
          {active ? '✓ ' : ''}Prepare merchandising
        </div>
        <div className="mono" style={{
          fontSize: 11, color: T.red, fontWeight: 700, letterSpacing: '-.005em',
        }}>
          +{fmtM(cost)} upfront
        </div>
      </div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 14, 'wght' 400",
        fontStyle: 'italic',
        fontSize: 12, color: T.muted, lineHeight: 1.5,
      }}>
        Heavy upfront bet. Per-airing revenue scales with hype<sup>1.8</sup> × quality — mid-range performance loses money, but a hit returns it many times over.
      </div>
    </button>
  )
}

/** The Q/H + cost estimate panel — accent-stripe gradient card. */
function EstimateCard({ estimate, method, prodMonths, prepCost, perAiring, totalCost, insufficient }) {
  return (
    <div style={{
      marginTop: 16, padding: '16px 18px',
      background: `linear-gradient(180deg, ${T.cardHiGradTop} 0%, ${T.cardHiGradBot} 100%)`,
      border: `1px solid ${T.accent}55`,
      borderLeft: `3px solid ${T.accent}`,
      borderRadius: 5,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
        textTransform: 'uppercase', color: T.accent, marginBottom: 12,
      }}>
        Estimate
      </div>

      {!estimate ? (
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 14, 'wght' 400",
          fontStyle: 'italic',
          fontSize: 13, color: T.muted,
        }}>
          Pick a source to see the estimate.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 1, background: T.border,
          borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
        }}>
          <EstStat label="Quality range"
            value={`${estimate.qRange[0]}–${estimate.qRange[1]}`}
            color={T.text} />
          <EstStat label="Hype range"
            value={`${estimate.hRange[0]}–${estimate.hRange[1]}`}
            color={T.gold} />
          <EstStat label="Production"
            value={method === 'instant' ? 'Instant' : `${prodMonths} mo`}
            sub={method === 'instant' ? 'Movie' : method === 'live' ? 'Live · per-airing' : 'Pre-produced'} />
        </div>
      )}

      {/* Cost row — same bordered grid */}
      <div style={{
        marginTop: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 1, background: T.border,
        borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
      }}>
        <EstStat label="Upfront"
          value={fmtM(prepCost)}
          color={insufficient ? T.red : T.text} />
        <EstStat label="Per airing"
          value={perAiring > 0 ? fmtM(perAiring) : '—'}
          color={T.text} />
        <EstStat label="Total cost"
          value={fmtM(totalCost)}
          color={T.text} />
      </div>
    </div>
  )
}

function EstStat({ label, value, color, sub }) {
  return (
    <div style={{ background: T.bg, padding: '12px 14px' }}>
      <div className="mono" style={{
        fontSize: 9, color: T.muted, fontWeight: 700,
        letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 36, 'wght' 600",
        fontSize: 18, letterSpacing: '-.01em',
        color: color || T.text,
      }}>{value}</div>
      {sub && (
        <div className="mono" style={{
          fontSize: 9, color: T.muted, marginTop: 3, letterSpacing: '.04em',
        }}>{sub}</div>
      )}
    </div>
  )
}

function sortBySpecialty(list, categoryId) {
  return [...list].sort((a, b) => {
    const aMatch = a.specialty === categoryId ? 0 : 1
    const bMatch = b.specialty === categoryId ? 0 : 1
    if (aMatch !== bMatch) return aMatch - bMatch
    return (b.q + b.h) - (a.q + a.h)
  })
}

// ─── SHARED EDITORIAL FORM PRIMITIVES ─────────────────────────────────
// Same vocabulary as ContentScreen's NewScriptModal. Kept inline rather
// than imported from there since ContentScreen doesn't export them.

function EditorialModal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
          border: `1px solid ${T.borderHi}`,
          borderRadius: 6,
          padding: '26px 26px',
          width: '100%',
          maxWidth: 620,
          maxHeight: '95vh',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function EditorialField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="mono" style={{
        display: 'block', marginBottom: 6,
        fontSize: 9.5, color: T.muted, fontWeight: 700,
        letterSpacing: '.16em', textTransform: 'uppercase',
      }}>{label}</label>
      {children}
    </div>
  )
}

function EditorialInput({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 4,
        color: T.text,
        padding: '9px 11px',
        fontSize: 13,
        fontFamily: FONTS.sans,
        boxSizing: 'border-box',
        outline: 'none',
      }}
    />
  )
}

function EditorialSelect({ children, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        {...props}
        style={{
          width: '100%',
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          color: T.text,
          padding: '9px 30px 9px 11px',
          fontSize: 13,
          fontFamily: FONTS.sans,
          boxSizing: 'border-box',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <span style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)',
        color: T.muted, fontSize: 12,
        pointerEvents: 'none',
      }}>▾</span>
    </div>
  )
}

function FieldNote({ children, tone = 'muted' }) {
  const color = tone === 'gold' ? T.gold
              : tone === 'red'  ? T.red
              : tone === 'teal' ? T.teal
              :                   T.muted
  return (
    <div style={{
      marginTop: 6,
      fontFamily: FONTS.serif,
      fontVariationSettings: "'opsz' 14, 'wght' 400",
      fontStyle: 'italic',
      fontSize: 12, color, lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active ? T.accent : 'transparent',
        border: `1px solid ${active ? T.accent : (hover ? T.borderHi : T.border)}`,
        color: active ? T.bg : (hover ? T.text : T.muted),
        padding: '5px 11px', borderRadius: 3,
        fontSize: 10, fontWeight: 600,
        letterSpacing: '.08em', textTransform: 'uppercase',
        fontFamily: FONTS.sans,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background .15s, border-color .15s, color .15s',
      }}
    >{label}</button>
  )
}

function PrimaryButton({ onClick, disabled, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, padding: '12px 16px',
        background: disabled ? T.surface : (hover ? T.accentHi : T.accent),
        color: disabled ? T.muted : T.bg,
        border: disabled ? `1px dashed ${T.border}` : 'none',
        borderRadius: 4,
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .15s',
      }}
    >{children}</button>
  )
}

function SecondaryButton({ onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, padding: '12px 16px',
        background: 'transparent',
        color: hover ? T.text : T.muted,
        border: `1px solid ${hover ? T.borderHi : T.border}`,
        borderRadius: 4,
        fontFamily: FONTS.sans,
        fontSize: 11, fontWeight: 700, letterSpacing: '.16em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'color .15s, border-color .15s',
      }}
    >{children}</button>
  )
}
