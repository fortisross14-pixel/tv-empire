import { useState } from 'react'
import { T } from '../theme.js'
import { currentTutorialStep, TOTAL_TUTORIAL_STEPS } from '../tutorial.js'

/**
 * TutorialPanel — pinned coach card showing the current tutorial step.
 *
 * Reads `game.tutorial` and the current step's title/body/why text.
 * Shows progress (X / Y), a "Why?" expandable explanation, and a "Skip" button.
 *
 * Auto-advance is driven by App.jsx (a useEffect that watches game state
 * and calls onAdvance() when the current step's `isDone` predicate returns
 * true). The panel itself is read-only beyond the skip/expand buttons.
 *
 * Layout:
 *  - Desktop (>= 600px): bottom-right pinned card, ~300px wide
 *  - Mobile: full-width band along the bottom of the screen
 */
export function TutorialPanel({ game, onSkip, onDismissFinal }) {
  const [whyOpen, setWhyOpen] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)

  const step = currentTutorialStep(game)
  if (!step) return null

  const t = game.tutorial
  const stepNum = (t.currentStepIdx || 0) + 1
  const totalSteps = TOTAL_TUTORIAL_STEPS

  // Final step renders a slightly different "you're set" card with a single
  // dismiss button instead of progress + skip.
  if (step.isFinal) {
    return (
      <FinalCard
        step={step}
        onDismiss={onDismissFinal}
      />
    )
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          zIndex: 60,
          background: T.surface,
          border: `1.5px solid ${T.accent}`,
          borderRadius: 8,
          boxShadow: `0 12px 32px rgba(0,0,0,.55), 0 0 24px ${T.accent}22`,
          padding: 14,
          // Desktop: pinned bottom-right, fixed width.
          // Mobile: full-width band along bottom (handled via media query in CSS,
          // but inline we use vw-based fallback).
          right: 16,
          bottom: 16,
          width: 'min(320px, calc(100vw - 32px))',
          maxHeight: 'min(60vh, 480px)',
          overflowY: 'auto',
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, color: T.muted, letterSpacing: '.12em',
            textTransform: 'uppercase',
          }}>
            Tutorial · Turn {step.turn} · Step {stepNum}/{totalSteps}
          </div>
          <button
            onClick={() => setConfirmSkip(true)}
            style={{
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.muted, fontSize: 10,
              padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
            }}
            title="Skip the tutorial"
          >Skip</button>
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 18, color: T.text, lineHeight: 1.15,
          marginBottom: 8, letterSpacing: '.02em',
        }}>
          {step.title}
        </div>

        {/* Body */}
        <div style={{
          fontSize: 12.5, color: T.textDim, lineHeight: 1.5,
          marginBottom: 10,
        }}>
          {step.body}
        </div>

        {/* Why expandable */}
        {step.why && (
          <div>
            <button
              onClick={() => setWhyOpen(!whyOpen)}
              style={{
                background: 'transparent', border: 'none',
                color: T.accent, fontSize: 11,
                padding: 0, cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {whyOpen ? 'Hide explanation' : 'Why?'}
            </button>
            {whyOpen && (
              <div style={{
                marginTop: 6,
                fontSize: 11.5, color: T.muted, lineHeight: 1.5,
                fontStyle: 'italic',
                background: T.bg, padding: '8px 10px', borderRadius: 4,
                border: `1px solid ${T.border}`,
              }}>
                {step.why}
              </div>
            )}
          </div>
        )}

        {/* Progress dots */}
        <ProgressDots current={stepNum - 1} total={totalSteps} />
      </div>

      {/* Skip confirmation modal */}
      {confirmSkip && (
        <SkipConfirm
          onConfirm={() => { setConfirmSkip(false); onSkip() }}
          onCancel={() => setConfirmSkip(false)}
        />
      )}
    </>
  )
}

function ProgressDots({ current, total }) {
  // Group dots by 6-per-row to avoid horizontal overflow
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 4,
      marginTop: 12,
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const isCur = i === current
        return (
          <div key={i} style={{
            width: isCur ? 14 : 6, height: 6, borderRadius: 3,
            background: isCur ? T.accent : (done ? T.green : T.border),
            transition: 'width .2s',
          }} />
        )
      })}
    </div>
  )
}

function SkipConfirm({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 8, padding: 22, maxWidth: 380, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
      }}>
        <div style={{
          fontFamily: 'Anton, sans-serif', fontSize: 20, color: T.text,
          marginBottom: 8,
        }}>Skip the tutorial?</div>
        <div style={{
          fontSize: 13, color: T.textDim, lineHeight: 1.5, marginBottom: 18,
        }}>
          You'll keep your current cash and roster, and the tutorial won't
          appear again for this save. You can still play normally.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 14px',
            background: T.card, color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 4,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Keep going</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 14px',
            background: T.red, color: '#fff',
            border: 'none', borderRadius: 4,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Skip</button>
        </div>
      </div>
    </div>
  )
}

function FinalCard({ step, onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      right: 16, bottom: 16, zIndex: 60,
      background: T.surface,
      border: `1.5px solid ${T.green}`,
      borderRadius: 8,
      boxShadow: `0 12px 32px rgba(0,0,0,.55), 0 0 32px ${T.green}33`,
      padding: 16,
      width: 'min(320px, calc(100vw - 32px))',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10, color: T.green, letterSpacing: '.15em',
        textTransform: 'uppercase', marginBottom: 8,
      }}>
        ✓ Tutorial Complete
      </div>
      <div style={{
        fontFamily: 'Anton, sans-serif',
        fontSize: 22, color: T.text, lineHeight: 1.1,
        marginBottom: 10,
      }}>
        {step.title}
      </div>
      <div style={{
        fontSize: 12.5, color: T.textDim, lineHeight: 1.5,
        marginBottom: 14,
      }}>
        {step.body}
      </div>
      <button
        onClick={onDismiss}
        style={{
          width: '100%', padding: '10px 14px',
          background: T.green, color: T.bg,
          border: 'none', borderRadius: 4,
          fontFamily: 'Anton, sans-serif', fontSize: 13,
          letterSpacing: '.1em', cursor: 'pointer', fontWeight: 700,
        }}
      >
        Got it ▶
      </button>
    </div>
  )
}
