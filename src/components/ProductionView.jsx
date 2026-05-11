import { useState, useMemo, useEffect } from 'react'
import { T } from '../theme.js'
import {
  CATEGORIES, MARKETING_TIERS, RUN_LENGTHS, MOVIES, MONTHS,
  PROD_DESIGN_TIERS, SFX_TIERS, MUSIC_TIERS, AUDIO_TIERS, SUBTITLE_TIERS, VIDEO_TIERS,
  SPORTS_LEAGUES,
} from '../constants.js'
import { HTag, SectionTitle, Card } from './ui.jsx'
import {
  findDirector, findStar, findIP, findLeague, findMovie,
  activeRoster, activeIPLicenses, ownsLicense,
  estimateProgramQH, programBuildCost,
  productionMethodFor, productionMonthsFor,
  unlockedTechFor, findTechOption,
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
 */
export function ProductionView({
  station, research, year, monthIdx,
  onBegin, onClose,
}) {
  // ── BUILD TYPE: script | movie | sports ─────────────────────────────────
  const readyScripts = (station.scripts || []).filter(s => s.status === 'ready')
  const [buildType, setBuildType] = useState(readyScripts.length > 0 ? 'script' : 'movie')

  // ── PRIMARY SELECTION ────────────────────────────────────────────────────
  const [scriptId, setScriptId] = useState(readyScripts[0]?.id || null)
  const [movieId, setMovieId] = useState(null)
  const [sportsLeagueId, setSportsLeagueId] = useState(null)

  // ── NAME ─────────────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const script = scriptId ? readyScripts.find(s => s.id === scriptId) : null
  const movie = movieId ? findMovie(movieId) : null
  const league = sportsLeagueId ? findLeague(sportsLeagueId) : null

  // Auto-fill name from selected entity once
  useEffect(() => {
    if (name) return
    if (buildType === 'script' && script) setName(script.name)
    else if (buildType === 'movie' && movie) setName(movie.name)
    else if (buildType === 'sports' && league) setName(`${league.label} ${year}`)
  }, [buildType, scriptId, movieId, sportsLeagueId])

  // ── DERIVED CATEGORY/TOPIC/IP ─────────────────────────────────────────────
  // For script-based: category/topic/ip come from the script.
  // For movie: category = 'movie' — no affinity applies, no crew needed.
  // For sports: category = 'sports', topic = 'live'
  const categoryId =
    buildType === 'script' ? script?.categoryId
    : buildType === 'movie' ? 'movie'
    : 'sports'
  const topicId =
    buildType === 'script' ? script?.topicId
    : buildType === 'movie' ? 'movie'
    : 'live'
  const ipId = buildType === 'script' ? (script?.ipId || null) : null

  // ── CREW (skipped for movies) ────────────────────────────────────────────
  const roster = useMemo(() => activeRoster(station), [station.hiredDirectors, station.hiredStars])
  const needsCrew = buildType !== 'movie'

  // Pre-filter to talent specialized in category (allowed to pick any; just sorted)
  const dirsSorted = useMemo(() => sortBySpecialty(roster.directors, categoryId), [roster.directors, categoryId])
  const starsSorted = useMemo(() => sortBySpecialty(roster.stars, categoryId), [roster.stars, categoryId])
  const [directorId, setDirectorId] = useState(dirsSorted[0]?.id || null)
  const [starId, setStarId] = useState(starsSorted[0]?.id || null)

  // Reset crew when category changes
  useEffect(() => {
    if (!needsCrew) return
    if (!directorId || !roster.directors.find(d => d.id === directorId)) {
      setDirectorId(dirsSorted[0]?.id || null)
    }
    if (!starId || !roster.stars.find(s => s.id === starId)) {
      setStarId(starsSorted[0]?.id || null)
    }
  }, [categoryId, needsCrew])

  // ── TIERS (blind — no good/bad badges) ───────────────────────────────────
  const [prodDesignId, setProdDesignId] = useState('pd_realnormal')
  const [sfxId, setSfxId] = useState('sfx_none')
  const [musicId, setMusicId] = useState('mus_basic')

  // ── TECH ─────────────────────────────────────────────────────────────────
  const audioOpts = unlockedTechFor('audio', research)
  const subsOpts  = unlockedTechFor('subtitles', research)
  const videoOpts = unlockedTechFor('video', research)
  const [audioId, setAudioId] = useState(audioOpts[0]?.id || 'audio_mono')
  const [subsId,  setSubsId]  = useState(subsOpts[0]?.id  || 'subs_none')
  const [videoId, setVideoId] = useState(videoOpts[0]?.id || 'video_sd')

  // ── MARKETING ────────────────────────────────────────────────────────────
  const [marketingId, setMarketingId] = useState('none')

  // ── PLANNED RUN LENGTH (cosmetic for build; drives prod time) ────────────
  const [plannedRunMonths, setPlannedRunMonths] = useState(
    buildType === 'movie' ? 1 : (buildType === 'sports' ? 12 : 1)
  )
  // Force valid lengths
  useEffect(() => {
    if (buildType === 'movie') setPlannedRunMonths(1)
    else if (buildType === 'sports') setPlannedRunMonths(12)
  }, [buildType])

  // ── BUILD OPTS ASSEMBLY ──────────────────────────────────────────────────
  const opts = useMemo(() => ({
    name: name.trim(),
    scriptId: buildType === 'script' ? scriptId : null,
    movieId: buildType === 'movie' ? movieId : null,
    sportsLeagueId: buildType === 'sports' ? sportsLeagueId : null,
    categoryId, topicId, ipId,
    directorId: needsCrew ? directorId : null,
    starId: needsCrew ? starId : null,
    prodDesignId, sfxId, musicId,
    audioId, subsId, videoId,
    marketingId,
    plannedRunMonths,
  }), [name, buildType, scriptId, movieId, sportsLeagueId, categoryId, topicId, ipId,
       needsCrew, directorId, starId, prodDesignId, sfxId, musicId,
       audioId, subsId, videoId, marketingId, plannedRunMonths])

  // ── LIVE ESTIMATE (re-rolls slightly each toggle due to noise; that's OK) ──
  // Use a deterministic seed-ish display: estimate once per change, but we'll
  // refresh on tier toggles. Keep noise minimal by recalc-ing only on relevant
  // option changes (useMemo handles it).
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

  // ── COST ─────────────────────────────────────────────────────────────────
  const totalCost = useMemo(() => {
    if (buildType === 'script' && !scriptId) return 0
    if (buildType === 'movie' && !movieId) return 0
    if (buildType === 'sports' && !sportsLeagueId) return 0
    try { return programBuildCost(opts, station, research, year) }
    catch (e) { return 0 }
  }, [opts, station, research, year])

  // ── PRODUCTION TIMING ────────────────────────────────────────────────────
  const method = useMemo(() => productionMethodFor(opts), [opts])
  const prodMonths = useMemo(() => productionMonthsFor(method, plannedRunMonths), [method, plannedRunMonths])

  // Cost split (mirrors engine math, for display)
  const { prepCost, perAiring } = useMemo(() => {
    if (totalCost <= 0) return { prepCost: 0, perAiring: 0 }
    if (method === 'instant') return { prepCost: totalCost, perAiring: 0 }
    if (method === 'live') {
      const prep = Math.round(totalCost * 0.25 * 10) / 10
      const remain = totalCost - prep
      return { prepCost: prep, perAiring: Math.round((remain / Math.max(1, plannedRunMonths)) * 100) / 100 }
    }
    // preproduced
    const prep = Math.round(totalCost * 0.9 * 10) / 10
    const remain = totalCost - prep
    return { prepCost: prep, perAiring: Math.round((remain / Math.max(1, plannedRunMonths)) * 100) / 100 }
  }, [totalCost, method, plannedRunMonths])

  // ── VALIDATION ───────────────────────────────────────────────────────────
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

  // Sports-availability messaging (need 2-month lead: script+1mo prep)
  const sportsLeadMsg = useMemo(() => {
    if (buildType !== 'sports' || !sportsLeagueId) return null
    const lg = findLeague(sportsLeagueId)
    if (!lg) return null
    // Next month they can air = monthIdx + 1 (after prep)
    const nextAir = (monthIdx + 1) % 12
    const inSeason = lg.season.includes(nextAir)
    if (inSeason) {
      return { ok: true, msg: `Production ready by ${MONTHS[nextAir]} — ${lg.label} is in-season then.` }
    }
    // Find first in-season month after prep
    let m = nextAir
    let count = 0
    while (count < 12 && !lg.season.includes(m)) { m = (m + 1) % 12; count++ }
    return {
      ok: false,
      msg: `Production ready by ${MONTHS[nextAir]}, but ${lg.label}'s next in-season month is ${MONTHS[m]} — you'll miss earlier games.`,
    }
  }, [buildType, sportsLeagueId, monthIdx])

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <Modal onClose={onClose}>
      <div style={{
        position: 'sticky', top: -18, marginTop: -18, marginLeft: -18, marginRight: -18,
        padding: '14px 18px', background: T.surface, borderBottom: `1px solid ${T.border}`,
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="bebas" style={{ fontSize: 18, color: T.accent, letterSpacing: '.08em' }}>
            🎬 NEW PRODUCTION
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: T.muted,
            fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1,
          }}>✕</button>
        </div>
      </div>

      <div style={{ paddingTop: 12 }}>

        {/* ── BUILD TYPE ─────────────────────────────────────────────── */}
        <Field label="Source">
          <div style={{ display: 'flex', gap: 6 }}>
            <TypeChip label="📝 From Script" active={buildType === 'script'}
              disabled={readyScripts.length === 0}
              onClick={() => { setBuildType('script'); setEstVersion(v => v+1) }} />
            <TypeChip label="🎞 Movie" active={buildType === 'movie'}
              onClick={() => { setBuildType('movie'); setEstVersion(v => v+1) }} />
            <TypeChip label="🏆 Sports Rights" active={buildType === 'sports'}
              disabled={(station.sportsLicenses || []).filter(l => l.year === year).length === 0}
              onClick={() => { setBuildType('sports'); setEstVersion(v => v+1) }} />
          </div>
          {readyScripts.length === 0 && buildType === 'script' && (
            <div style={{ fontSize: 11, color: T.gold, marginTop: 6 }}>
              No ready scripts. Commission one in Content → Scripts first.
            </div>
          )}
        </Field>

        {/* ── PRIMARY SELECTION ──────────────────────────────────────── */}
        {buildType === 'script' && readyScripts.length > 0 && (
          <Field label="Script">
            <select value={scriptId || ''} onChange={e => { setScriptId(e.target.value); setEstVersion(v => v+1) }} style={inputStyle}>
              {readyScripts.map(s => {
                const cat = CATEGORIES[s.categoryId]
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} · {cat?.label || s.categoryId} · hype {Math.round(s.hype)}
                    {s.timesUsed > 0 ? ` (${s.timesUsed} uses)` : ''}
                  </option>
                )
              })}
            </select>
            {script && script.timesUsed > 0 && (
              <div style={{ fontSize: 10, color: T.gold, marginTop: 4 }}>
                ⚠ Already used {script.timesUsed} time(s). Each use decays hype 20%.
              </div>
            )}
          </Field>
        )}

        {buildType === 'movie' && (
          <Field label="Movie">
            <select value={movieId || ''} onChange={e => { setMovieId(e.target.value); setEstVersion(v => v+1) }} style={inputStyle}>
              <option value="">— pick a movie —</option>
              {MOVIES.map(m => (
                <option key={m.id} value={m.id}>{m.name} · {m.tier} · {fmtM(m.cost)}</option>
              ))}
            </select>
          </Field>
        )}

        {buildType === 'sports' && (
          <Field label="Sports Rights">
            <select value={sportsLeagueId || ''} onChange={e => { setSportsLeagueId(e.target.value); setEstVersion(v => v+1) }} style={inputStyle}>
              <option value="">— pick a league —</option>
              {(station.sportsLicenses || [])
                .filter(l => l.year === year)
                .map(l => {
                  const lg = findLeague(l.leagueId)
                  return <option key={l.leagueId} value={l.leagueId}>{lg?.icon} {lg?.label}</option>
                })}
            </select>
            {sportsLeadMsg && (
              <div style={{
                fontSize: 11, marginTop: 6, padding: '6px 8px', borderRadius: 4,
                background: sportsLeadMsg.ok ? T.green + '15' : T.gold + '15',
                color: sportsLeadMsg.ok ? T.green : T.gold,
                border: `1px solid ${sportsLeadMsg.ok ? T.green : T.gold}44`,
              }}>{sportsLeadMsg.msg}</div>
            )}
          </Field>
        )}

        {/* ── NAME ───────────────────────────────────────────────────── */}
        <Field label="Program Title">
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. The Last Frontier"
            style={inputStyle}
            maxLength={48}
          />
        </Field>

        {/* ── CREW ───────────────────────────────────────────────────── */}
        {needsCrew && (
          <>
            <Field label="Director">
              <select value={directorId || ''} onChange={e => { setDirectorId(e.target.value); setEstVersion(v => v+1) }} style={inputStyle}>
                {dirsSorted.length === 0 && <option value="">— no directors on roster —</option>}
                {dirsSorted.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.tier} · best at {d.specialty}{d.specialty === categoryId ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Star">
              <select value={starId || ''} onChange={e => { setStarId(e.target.value); setEstVersion(v => v+1) }} style={inputStyle}>
                {starsSorted.length === 0 && <option value="">— no stars on roster —</option>}
                {starsSorted.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.tier} · best at {s.specialty}{s.specialty === categoryId ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {/* ── TIERS (BLIND) ─────────────────────────────────────────── */}
        {buildType !== 'movie' ? (
          <>
            <Field label="Production Design">
              <TierPicker
                tiers={PROD_DESIGN_TIERS}
                selectedId={prodDesignId}
                onPick={(id) => { setProdDesignId(id); setEstVersion(v => v+1) }}
              />
            </Field>

            <Field label="Special Effects">
              <TierPicker
                tiers={SFX_TIERS}
                selectedId={sfxId}
                onPick={(id) => { setSfxId(id); setEstVersion(v => v+1) }}
              />
            </Field>

            <Field label="Music">
              <TierPicker
                tiers={MUSIC_TIERS}
                selectedId={musicId}
                onPick={(id) => { setMusicId(id); setEstVersion(v => v+1) }}
              />
            </Field>
          </>
        ) : (
          <div style={{
            padding: '10px 12px', marginBottom: 12, fontSize: 11,
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
            color: T.muted, lineHeight: 1.4,
          }}>
            Movies arrive already finished. You're just licensing the film and packaging it for air — pick marketing &amp; tech below.
          </div>
        )}

        {/* ── TECH ───────────────────────────────────────────────────── */}
        <details style={{ marginBottom: 10 }}>
          <summary style={{
            fontSize: 10, color: T.muted, letterSpacing: '.1em',
            textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none',
            marginBottom: 4,
          }}>Technical Quality (tap to expand)</summary>
          <TechRow label="Audio"     options={audioOpts}  selectedId={audioId} onPick={(id) => { setAudioId(id); setEstVersion(v => v+1) }} />
          <TechRow label="Subtitles" options={subsOpts}   selectedId={subsId}  onPick={(id) => { setSubsId(id);  setEstVersion(v => v+1) }} />
          <TechRow label="Video"     options={videoOpts}  selectedId={videoId} onPick={(id) => { setVideoId(id); setEstVersion(v => v+1) }} />
        </details>

        {/* ── MARKETING ──────────────────────────────────────────────── */}
        <Field label="Launch Marketing">
          <select value={marketingId} onChange={e => { setMarketingId(e.target.value); setEstVersion(v => v+1) }} style={inputStyle}>
            {MARKETING_TIERS.map(m => (
              <option key={m.id} value={m.id}>
                {m.label} {m.cost > 0 ? `· ${fmtM(m.cost)}` : '· free'}
              </option>
            ))}
          </select>
        </Field>

        {/* ── RUN LENGTH (preproduced/live only) ─────────────────────── */}
        {buildType === 'script' && (
          <Field label="Planned Airing Length">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RUN_LENGTHS.map(rl => (
                <button key={rl.id}
                  onClick={() => { setPlannedRunMonths(rl.months); setEstVersion(v => v+1) }}
                  style={{
                    background: plannedRunMonths === rl.months ? T.accent + '33' : 'transparent',
                    border: `1px solid ${plannedRunMonths === rl.months ? T.accent : T.border}`,
                    color: plannedRunMonths === rl.months ? T.accent : T.muted,
                    borderRadius: 4, padding: '6px 12px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>{rl.label}</button>
              ))}
            </div>
          </Field>
        )}

        {/* ── ESTIMATE (live, sticky-ish) ────────────────────────────── */}
        <div style={{
          marginTop: 14, padding: 12,
          background: T.bg, border: `1px solid ${T.accent}55`, borderRadius: 6,
        }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: '.1em', marginBottom: 6 }}>
            ESTIMATE
          </div>
          {!estimate ? (
            <div style={{ fontSize: 11, color: T.muted, fontStyle: 'italic' }}>
              Pick a source to see estimate.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.07em', textTransform: 'uppercase' }}>Quality</div>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 18, color: T.text, fontWeight: 700,
                }}>{estimate.qRange[0]}–{estimate.qRange[1]}</div>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.07em', textTransform: 'uppercase' }}>Hype</div>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 18, color: T.gold, fontWeight: 700,
                }}>{estimate.hRange[0]}–{estimate.hRange[1]}</div>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 9, color: T.muted, letterSpacing: '.07em', textTransform: 'uppercase' }}>Production</div>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 14, color: T.text, fontWeight: 600,
                }}>
                  {method === 'instant' ? 'Instant' : `${prodMonths} mo`}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                  {method === 'instant' ? 'Movie' : method === 'live' ? 'Live (per-airing cost)' : 'Pre-produced'}
                </div>
              </div>
            </div>
          )}

          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`,
            display: 'flex', gap: 14, fontSize: 11,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Upfront</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: insufficient ? T.red : T.text, fontWeight: 700 }}>
                {fmtM(prepCost)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Per Airing</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: T.text, fontWeight: 700 }}>
                {perAiring > 0 ? fmtM(perAiring) : '—'}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase' }}>Total Cost</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: T.text, fontWeight: 700 }}>
                {fmtM(totalCost)}
              </div>
            </div>
          </div>
        </div>

        {insufficient && (
          <div style={{
            marginTop: 8, padding: '6px 10px', fontSize: 11,
            background: T.red + '15', border: `1px solid ${T.red}55`, color: T.red, borderRadius: 4,
          }}>Not enough cash — you have {fmtM(station.cash)} but need {fmtM(prepCost)} upfront.</div>
        )}

        {/* ── BUTTONS ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button
            onClick={() => canBegin && onBegin(opts)}
            disabled={!canBegin}
            style={{ ...btnPrimary, opacity: canBegin ? 1 : 0.4, cursor: canBegin ? 'pointer' : 'not-allowed' }}
          >
            Begin Production {prodMonths > 0 && `(${prodMonths} mo)`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── SUBCOMPONENTS ──────────────────────────────────────────────────────────
function TierPicker({ tiers, selectedId, onPick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
      {tiers.map(t => {
        const isSel = t.id === selectedId
        return (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            style={{
              background: isSel ? T.accent + '22' : T.card,
              border: `1.5px solid ${isSel ? T.accent : T.border}`,
              borderRadius: 5, padding: '8px 10px',
              textAlign: 'left', cursor: 'pointer',
              color: T.text,
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: isSel ? T.accent : T.text,
              marginBottom: 3, lineHeight: 1.2,
            }}>{t.label}</div>
            <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.3 }}>{t.desc}</div>
            <div style={{
              fontSize: 10, color: T.text, marginTop: 5,
              fontFamily: "'DM Mono',monospace", fontWeight: 600,
            }}>
              {t.cost > 0 ? fmtM(t.cost) : 'free'}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function TechRow({ label, options, selectedId, onPick }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{label}</div>
      <select value={selectedId} onChange={e => onPick(e.target.value)} style={inputStyle}>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.label} {o.cost ? `· ${fmtM(o.cost)}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

function TypeChip({ label, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: '8px 6px',
      background: active ? T.accent + '33' : T.card,
      border: `1.5px solid ${active ? T.accent : T.border}`,
      borderRadius: 5,
      color: active ? T.accent : (disabled ? T.muted : T.text),
      fontSize: 11, fontWeight: active ? 700 : 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
    }}>{label}</button>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        fontSize: 10, color: T.muted, letterSpacing: '.1em',
        textTransform: 'uppercase', display: 'block', marginBottom: 4,
      }}>{label}</label>
      {children}
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

const inputStyle = {
  width: '100%',
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: 4,
  color: T.text,
  padding: '7px 9px',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const btnPrimary = {
  flex: 1, padding: '9px 12px',
  background: T.accent, color: T.bg,
  border: 'none', borderRadius: 4,
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
const btnSecondary = {
  flex: 1, padding: '9px 12px',
  background: 'transparent', color: T.muted,
  border: `1px solid ${T.border}`, borderRadius: 4,
  fontSize: 12, cursor: 'pointer',
}

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 12,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 18,
          width: '100%',
          maxWidth: 580,
          maxHeight: '95vh',
          overflow: 'auto',
        }}
      >{children}</div>
    </div>
  )
}
