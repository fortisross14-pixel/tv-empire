import { useEffect, useState } from 'react'
import { T } from '../theme.js'
import { currentTutorialStep } from '../tutorial.js'

/**
 * TutorialPointer — a small accent-colored "→" arrow that hovers next to
 * the DOM element matching the current tutorial step's `pointTo` id.
 *
 * The pointer reads `game.tutorial` to find the active step, looks up the
 * target element by `id`, measures its position, and renders an animated
 * arrow just to its left (or above, depending on the element).
 *
 * If the target element isn't in the DOM (e.g. user is on the wrong screen),
 * the pointer renders nothing. The coach panel's text already tells the
 * player where to go, so a missing pointer is graceful degradation.
 */
export function TutorialPointer({ game }) {
  const step = currentTutorialStep(game)
  const targetId = step?.pointTo || null
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!targetId) {
      setPos(null)
      return
    }
    let cancelled = false

    function update() {
      if (cancelled) return
      const el = document.getElementById(targetId)
      if (!el) {
        setPos(null)
        return
      }
      const r = el.getBoundingClientRect()
      setPos({
        // Anchor to the left edge of the target, vertically centered.
        // We render the arrow just left of the target, pointing right.
        top: r.top + r.height / 2,
        left: r.left,
      })
    }

    update()
    // Re-measure on resize / scroll. Use intervals to catch layout changes
    // we can't otherwise observe (e.g. a parent re-rendering).
    const onScroll = () => update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', onScroll, true)
    const interval = setInterval(update, 600)
    return () => {
      cancelled = true
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', onScroll, true)
      clearInterval(interval)
    }
  }, [targetId, game])

  if (!pos || !targetId) return null

  return (
    <div style={{
      position: 'fixed',
      top: pos.top, left: pos.left,
      transform: 'translate(calc(-100% - 4px), -50%)',
      zIndex: 55,
      pointerEvents: 'none',
      fontFamily: 'Anton, sans-serif',
      fontSize: 22,
      color: T.accent,
      textShadow: `0 0 12px ${T.accent}aa, 0 0 4px ${T.accent}`,
      animation: 'tutorialArrow 1.2s ease-in-out infinite',
    }}>
      →
      <style>{`
        @keyframes tutorialArrow {
          0%, 100% { transform: translate(calc(-100% - 4px), -50%); opacity: 1; }
          50%      { transform: translate(calc(-100% - 10px), -50%); opacity: .65; }
        }
      `}</style>
    </div>
  )
}
