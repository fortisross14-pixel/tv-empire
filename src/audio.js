/**
 * audio.js — procedural audio for TV Empire.
 *
 * Synthesizes UI and event sounds at runtime with Web Audio API.
 * Zero asset files. ~3KB of code, infinite headroom for tuning.
 *
 * Public API:
 *   play(name)        — fire a sound by name (no-op if muted or unsupported)
 *   setMuted(bool)    — toggle global mute (persisted to localStorage)
 *   isMuted()         — read mute state
 *   initOnGesture()   — resume the audio context on first user interaction
 *
 * Sounds: tick · tap · confirm · error · production_start · script_start
 *         month_advance · results_reveal · hit · flop · award
 */

const STORAGE_KEY = 'tv-empire-muted'
const THROTTLE_MS = 40   // don't fire the same sound twice within this window
const MASTER_GAIN = 0.32 // 0..1 — UI sounds should never be loud

let ctx = null
let masterGain = null
let muted = loadMutedPref()
const lastPlayed = new Map()  // name → timestamp

function loadMutedPref() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' }
  catch { return false }
}

function saveMutedPref(m) {
  try { localStorage.setItem(STORAGE_KEY, m ? '1' : '0') } catch {}
}

function ensureCtx() {
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    masterGain = ctx.createGain()
    masterGain.gain.value = MASTER_GAIN
    masterGain.connect(ctx.destination)
  } catch {
    ctx = null
  }
  return ctx
}

// Lazy-resume context on first user gesture. Browsers require this.
export function initOnGesture() {
  if (!ensureCtx()) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
}

export function setMuted(m) {
  muted = !!m
  saveMutedPref(muted)
}

export function isMuted() { return muted }

export function toggleMuted() {
  setMuted(!muted)
  return muted
}

// ─── PRIMITIVES ──────────────────────────────────────────────────────────

// Quick exponential decay envelope on a gain node.
function envelope(gainNode, peak, attackTime, decayTime, t0) {
  const t = t0 ?? ctx.currentTime
  gainNode.gain.setValueAtTime(0.0001, t)
  gainNode.gain.exponentialRampToValueAtTime(peak, t + attackTime)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attackTime + decayTime)
}

// A single oscillator with envelope.
function blip({ freq, type = 'sine', dur = 0.08, peak = 0.5, attack = 0.005, slideTo, t0 }) {
  if (!ctx) return
  const t = t0 ?? ctx.currentTime
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  }
  envelope(g, peak, attack, dur, t)
  osc.connect(g).connect(masterGain)
  osc.start(t)
  osc.stop(t + dur + attack + 0.02)
}

// Short noise burst (filtered) — for clicks and clap-like transients.
function noiseBurst({ dur = 0.05, peak = 0.4, freq = 2000, q = 1, type = 'bandpass', t0 }) {
  if (!ctx) return
  const t = t0 ?? ctx.currentTime
  const bufferSize = Math.floor(ctx.sampleRate * (dur + 0.02))
  const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = q
  const g = ctx.createGain()
  envelope(g, peak, 0.002, dur, t)
  src.connect(filter).connect(g).connect(masterGain)
  src.start(t)
  src.stop(t + dur + 0.05)
}

// ─── SOUNDS ──────────────────────────────────────────────────────────────
// Each sound is a small composition of blips and noise bursts.

const SOUNDS = {
  // Generic UI click — sharp high blip + tiny noise tick
  tick() {
    blip({ freq: 1800, type: 'square', dur: 0.025, peak: 0.18 })
    noiseBurst({ dur: 0.012, peak: 0.12, freq: 3500, q: 2 })
  },

  // Tab/pill — softer than tick
  tap() {
    blip({ freq: 900, type: 'sine', dur: 0.04, peak: 0.18 })
  },

  // Successful commit — two-note rising chime
  confirm() {
    const t = ctx.currentTime
    blip({ freq: 740, type: 'triangle', dur: 0.08, peak: 0.22, t0: t })
    blip({ freq: 1100, type: 'triangle', dur: 0.12, peak: 0.22, t0: t + 0.06 })
  },

  // Blocked / cash-out — low dissonant pulse
  error() {
    const t = ctx.currentTime
    blip({ freq: 220, type: 'square', dur: 0.08, peak: 0.18, t0: t })
    blip({ freq: 180, type: 'square', dur: 0.12, peak: 0.18, t0: t + 0.07 })
  },

  // Production starts — like a film slate clap + a low woody hit
  production_start() {
    const t = ctx.currentTime
    // The "clap"
    noiseBurst({ dur: 0.04, peak: 0.45, freq: 2400, q: 0.8, t0: t })
    noiseBurst({ dur: 0.06, peak: 0.25, freq: 800,  q: 1.2, t0: t + 0.01 })
    // Low body resonance
    blip({ freq: 130, type: 'triangle', dur: 0.15, peak: 0.3, slideTo: 90, t0: t + 0.005 })
  },

  // Script starts — typewriter-ish ding (high bell + soft mechanical click)
  script_start() {
    const t = ctx.currentTime
    noiseBurst({ dur: 0.02, peak: 0.2, freq: 3000, q: 3, t0: t })
    blip({ freq: 2400, type: 'sine', dur: 0.18, peak: 0.18, t0: t + 0.005 })
    blip({ freq: 3200, type: 'sine', dur: 0.16, peak: 0.10, t0: t + 0.01 })
  },

  // Month advance — short tape-transport whoosh
  month_advance() {
    const t = ctx.currentTime
    noiseBurst({ dur: 0.18, peak: 0.18, freq: 600, q: 0.8, type: 'lowpass', t0: t })
    blip({ freq: 200, type: 'sine', dur: 0.2, peak: 0.16, slideTo: 480, t0: t })
  },

  // Results reveal — cinematic "and we're back" rising tone
  results_reveal() {
    const t = ctx.currentTime
    // Low body
    blip({ freq: 110, type: 'sine', dur: 0.45, peak: 0.25, slideTo: 220, t0: t })
    // Mid sparkle
    blip({ freq: 440, type: 'triangle', dur: 0.4, peak: 0.18, slideTo: 660, t0: t + 0.05 })
    // High shimmer
    blip({ freq: 880, type: 'sine', dur: 0.35, peak: 0.10, slideTo: 1320, t0: t + 0.1 })
  },

  // Hit — bright two-note ding
  hit() {
    const t = ctx.currentTime
    blip({ freq: 1320, type: 'triangle', dur: 0.08, peak: 0.22, t0: t })
    blip({ freq: 1760, type: 'triangle', dur: 0.14, peak: 0.22, t0: t + 0.05 })
  },

  // Flop — descending semitone, dry
  flop() {
    const t = ctx.currentTime
    blip({ freq: 330, type: 'sawtooth', dur: 0.12, peak: 0.18, t0: t })
    blip({ freq: 247, type: 'sawtooth', dur: 0.18, peak: 0.18, t0: t + 0.09 })
  },

  // Award — gold-tone arpeggio
  award() {
    const t = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
    notes.forEach((f, i) => {
      blip({ freq: f, type: 'triangle', dur: 0.4, peak: 0.22, t0: t + i * 0.09 })
    })
  },
}

export function play(name) {
  if (muted) return
  if (!ensureCtx()) return
  if (ctx.state === 'suspended') {
    // Browser hasn't unlocked audio yet. Caller should have called initOnGesture.
    // Try anyway; if it fails, silent drop.
    ctx.resume().catch(() => {})
    return
  }
  // Throttle identical events
  const now = performance.now()
  const last = lastPlayed.get(name) || 0
  if (now - last < THROTTLE_MS) return
  lastPlayed.set(name, now)

  const fn = SOUNDS[name]
  if (!fn) return
  try { fn() } catch {}
}
