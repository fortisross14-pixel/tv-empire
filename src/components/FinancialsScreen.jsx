import { useState, useMemo } from 'react'
import { T, FONTS } from '../theme.js'
import { MONTHS } from '../constants.js'
import { ledgerForMonth, summarizeLedger, fmtM } from '../engine.js'
import { Icon } from '../icons.jsx'

/**
 * FinancialsScreen — monthly P&L derived from game.ledger.
 *
 * Default view: previous calendar month (the one whose results just rolled in).
 * User can step back/forward through any prior month with a chevron picker.
 *
 * Structure:
 *   PROGRAM REVENUE    (section, sum)
 *     ↳ Program A      revenue
 *   PROGRAM EXPENSES   (section, sum)
 *     ↳ Program C      build/airing cost
 *   PROGRAM MARGIN     (subtotal)
 *
 *   OTHER ITEMS        (section, sum)
 *     ↳ subgroups: rights, salaries, research, marketing, etc.
 *
 *   NET INCOME         (grand total)
 */
export function FinancialsScreen({ game, onBack }) {
  const initial = useMemo(() => {
    const m = game.monthIdx - 1
    if (m < 0) return { year: game.year - 1, month: 11 }
    return { year: game.year, month: m }
  }, [game.monthIdx, game.year])

  const [selected, setSelected] = useState(initial)

  const availableMonths = useMemo(() => {
    const set = new Set()
    ;(game.ledger || []).forEach(e => set.add(`${e.year}-${e.month}`))
    const arr = Array.from(set).map(k => {
      const [y, m] = k.split('-').map(Number)
      return { year: y, month: m }
    })
    arr.sort((a, b) => a.year - b.year || a.month - b.month)
    return arr
  }, [game.ledger])

  const currentIndex = availableMonths.findIndex(
    m => m.year === selected.year && m.month === selected.month
  )
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < availableMonths.length - 1

  const entries = useMemo(
    () => ledgerForMonth(game.ledger, selected.year, selected.month),
    [game.ledger, selected]
  )
  const summary = useMemo(() => summarizeLedger(entries), [entries])

  return (
    <div className="view-wrap" style={{ maxWidth: 980, margin: '0 auto', padding: '0 32px 48px' }}>
      <BackLink onClick={onBack} />

      {/* ─── HERO ─── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        gap: 20, flexWrap: 'wrap',
        padding: '24px 0 28px',
      }}>
        <div>
          <div style={{
            width: 36, height: 2,
            background: `linear-gradient(90deg, ${T.accent} 0%, transparent 100%)`,
            marginBottom: 14,
          }} />
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.2em',
            textTransform: 'uppercase', color: T.accent, marginBottom: 14,
          }}>
            P&amp;L · Income Statement
          </div>
          <h1 className="editorial" style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 144, 'wght' 600",
            fontSize: 52, lineHeight: 0.95, letterSpacing: '-.025em',
            color: T.text, marginBottom: 12,
          }}>
            Financials
          </h1>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 14, 'wght' 400",
            fontStyle: 'italic',
            fontSize: 14, color: T.textDim, lineHeight: 1.55, maxWidth: 480,
          }}>
            Where the money came from. Where it went. What's left.
          </div>
        </div>

        {/* Month stepper */}
        <MonthStepper
          label={`${MONTHS[selected.month]} · Y${selected.year}`}
          hasPrev={hasPrev} hasNext={hasNext}
          onPrev={() => hasPrev && setSelected(availableMonths[currentIndex - 1])}
          onNext={() => hasNext && setSelected(availableMonths[currentIndex + 1])}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <Statement summary={summary} />
      )}
    </div>
  )
}

function BackLink({ onClick }) {
  return (
    <div style={{ paddingTop: 24 }}>
      <button onClick={onClick} style={{
        background: 'transparent', border: 'none',
        color: T.muted, padding: '4px 0', cursor: 'pointer',
        fontSize: 11, fontWeight: 500, letterSpacing: '.08em',
        textTransform: 'uppercase', display: 'inline-flex',
        alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 14 }}>←</span> Back
      </button>
    </div>
  )
}

/** Month stepper — chevrons + label card, shared pattern with Market. */
function MonthStepper({ label, hasPrev, hasNext, onPrev, onNext }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <ChevButton disabled={!hasPrev} onClick={onPrev}>‹</ChevButton>
      <div style={{
        background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
        border: `1px solid ${T.border}`,
        padding: '10px 22px', borderRadius: 4,
        minWidth: 180, textAlign: 'center',
      }}>
        <div className="mono" style={{
          fontSize: 9.5, color: T.muted,
          letterSpacing: '.16em', textTransform: 'uppercase',
        }}>
          Reporting period
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 36, 'wght' 600",
          fontSize: 18, color: T.text, letterSpacing: '-.01em',
          marginTop: 4,
        }}>
          {label}
        </div>
      </div>
      <ChevButton disabled={!hasNext} onClick={onNext}>›</ChevButton>
    </div>
  )
}

function ChevButton({ children, onClick, disabled }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: disabled
          ? 'transparent'
          : (hover ? T.cardHi : 'transparent'),
        border: `1px solid ${disabled ? T.border : (hover ? T.borderHi : T.border)}`,
        color: disabled ? T.mutedDim : T.text,
        width: 36, height: 44, borderRadius: 4,
        fontFamily: FONTS.serif, fontSize: 20,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s, border-color .15s',
      }}
    >{children}</button>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      background: T.surface, border: `1px dashed ${T.borderHi}`,
      borderRadius: 6, padding: '40px 32px', textAlign: 'center',
    }}>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 36, 'wght' 500",
        fontStyle: 'italic',
        fontSize: 17, color: T.textDim, marginBottom: 6,
      }}>
        No ledger entries for this period.
      </div>
      <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55, maxWidth: 420, margin: '0 auto' }}>
        The books are empty. Pick a different month from the stepper above.
      </div>
    </div>
  )
}

// ─── STATEMENT ────────────────────────────────────────────────────────
function Statement({ summary }) {
  const { byProgram, other, totals } = summary

  const revBearing = byProgram.filter(p => p.revenue > 0)
  const expBearing = byProgram.filter(p => p.airingCost < 0 || p.buildCost < 0)

  return (
    <div style={{
      background: `linear-gradient(180deg, ${T.cardGradTop} 0%, ${T.cardGradBot} 100%)`,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      {/* ─── PROGRAM REVENUE ─── */}
      <Section title="Program revenue" total={totals.programRevenue} totalColor={T.green}>
        {revBearing.length === 0 ? (
          <EmptyRow note="No airings earned revenue this month" />
        ) : (
          revBearing.map(p => (
            <Row
              key={p.programId}
              label={p.name}
              amount={p.revenue}
              positive
            />
          ))
        )}
      </Section>

      {/* ─── PROGRAM EXPENSES ─── */}
      <Section
        title="Program expenses"
        subtitle="Production builds + airing / transmission costs"
        total={totals.programExpense}
        totalColor={T.red}
      >
        {expBearing.length === 0 ? (
          <EmptyRow note="No program costs incurred this month" />
        ) : (
          expBearing.map(p => {
            const lines = []
            if (p.buildCost < 0) lines.push({ label: 'Production build', amount: p.buildCost })
            if (p.airingCost < 0) lines.push({ label: 'Airing / transmission', amount: p.airingCost })
            return (
              <ProgramExpenseRow
                key={p.programId}
                name={p.name}
                total={p.buildCost + p.airingCost}
                lines={lines}
              />
            )
          })
        )}
      </Section>

      {/* ─── PROGRAM MARGIN ─── */}
      <SubtotalRow
        label="Direct programming margin"
        amount={totals.programMargin}
      />

      {/* ─── OTHER ITEMS ─── */}
      <Section
        title="Other items"
        subtitle="Rights, salaries, research, and overhead"
        total={totals.otherNet}
        totalColor={totals.otherNet >= 0 ? T.green : T.red}
      >
        {other.sportsRights.length > 0 && (
          <Subgroup label="Sports rights">
            {other.sportsRights.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.ipRights.length > 0 && (
          <Subgroup label="IP licenses">
            {other.ipRights.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {(other.salaries.talent !== 0 || other.salaries.writer !== 0 || other.salaries.staff !== 0) && (
          <Subgroup label="Salaries" subtotal={other.salaries.total}>
            {other.salaries.talent !== 0 && <Row label="Talent (permanent contracts)" amount={other.salaries.talent} />}
            {other.salaries.writer !== 0 && <Row label="Writers" amount={other.salaries.writer} />}
            {other.salaries.staff  !== 0 && <Row label="Staff (department heads)" amount={other.salaries.staff} />}
          </Subgroup>
        )}
        {other.research.length > 0 && (
          <Subgroup label="Research">
            {other.research.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.marketing.length > 0 && (
          <Subgroup label="Marketing">
            {other.marketing.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.hires.length > 0 && (
          <Subgroup label="Hires / signings">
            {other.hires.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.firePenalties.length > 0 && (
          <Subgroup label="Penalties">
            {other.firePenalties.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.infrastructure && other.infrastructure.length > 0 && (
          <Subgroup label="Infrastructure">
            {other.infrastructure.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.promotion && other.promotion.length > 0 && (
          <Subgroup label="Market expansion">
            {other.promotion.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.awards.length > 0 && (
          <Subgroup label="Award bonuses">
            {other.awards.map((r, i) => <Row key={i} label={r.label} amount={r.amount} positive />)}
          </Subgroup>
        )}
        {other.misc.length > 0 && (
          <Subgroup label="Other">
            {other.misc.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}

        {other.sportsRights.length === 0 && other.ipRights.length === 0 &&
          other.salaries.total === 0 && other.research.length === 0 &&
          other.marketing.length === 0 && other.hires.length === 0 &&
          other.firePenalties.length === 0 && other.awards.length === 0 &&
          (!other.infrastructure || other.infrastructure.length === 0) &&
          (!other.promotion || other.promotion.length === 0) &&
          other.misc.length === 0 && (
          <EmptyRow note="No other transactions this month" />
        )}
      </Section>

      {/* ─── NET INCOME ─── */}
      <NetRow amount={totals.net} />
    </div>
  )
}

// ─── ATOMIC COMPONENTS ────────────────────────────────────────────────

function Section({ title, subtitle, total, totalColor, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      {/* Section header — Fraunces title + italic subtitle + Fraunces total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '16px 22px',
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        gap: 16,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: FONTS.serif,
            fontVariationSettings: "'opsz' 144, 'wght' 500",
            fontSize: 20, color: T.text, letterSpacing: '-.01em',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontFamily: FONTS.serif,
              fontVariationSettings: "'opsz' 14, 'wght' 400",
              fontStyle: 'italic',
              fontSize: 12.5, color: T.muted, marginTop: 2,
            }}>{subtitle}</div>
          )}
        </div>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 96, 'wght' 600",
          fontSize: 22, letterSpacing: '-.015em',
          color: totalColor || T.text,
        }}>{fmtM(total)}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Subgroup({ label, subtotal, children }) {
  return (
    <div style={{
      padding: '12px 22px 14px',
      borderTop: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 8,
      }}>
        <div className="mono" style={{
          fontSize: 9.5, color: T.textDim,
          letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700,
        }}>{label}</div>
        {subtotal !== undefined && (
          <div className="mono" style={{
            fontSize: 12, color: T.muted, letterSpacing: '-.01em',
          }}>
            {fmtM(subtotal)}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Row({ label, amount, positive, indent = 0 }) {
  const isPos = positive || amount > 0
  const color = isPos ? T.green : (amount < 0 ? T.text : T.muted)
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 0',
      paddingLeft: indent * 14,
      gap: 12,
    }}>
      <div style={{
        fontSize: 13, color: T.textDim, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: 8,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        <span style={{ color: T.mutedDim, fontSize: 10 }}>↳</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div className="mono" style={{
        fontSize: 13, color, fontWeight: 600, flexShrink: 0, letterSpacing: '-.01em',
      }}>{fmtM(amount)}</div>
    </div>
  )
}

function ProgramExpenseRow({ name, total, lines }) {
  return (
    <div style={{ padding: '10px 22px', borderTop: `1px solid ${T.border}` }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 5,
      }}>
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 24, 'wght' 600",
          fontSize: 14, color: T.text, letterSpacing: '-.005em',
        }}>
          {name}
        </div>
        <div className="mono" style={{
          fontSize: 13, color: T.text, fontWeight: 700, letterSpacing: '-.01em',
        }}>
          {fmtM(total)}
        </div>
      </div>
      <div style={{ paddingLeft: 14 }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', padding: '2px 0',
          }}>
            <span className="mono" style={{ fontSize: 11, color: T.muted, letterSpacing: '.04em' }}>· {l.label}</span>
            <span className="mono" style={{ fontSize: 11, color: T.muted, letterSpacing: '-.01em' }}>{fmtM(l.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyRow({ note }) {
  return (
    <div style={{
      padding: '14px 22px',
      fontFamily: FONTS.serif,
      fontVariationSettings: "'opsz' 14, 'wght' 400",
      fontStyle: 'italic',
      fontSize: 12.5, color: T.muted,
    }}>{note}</div>
  )
}

function SubtotalRow({ label, amount }) {
  const positive = amount >= 0
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 22px',
      background: T.bg,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div className="mono" style={{
        fontSize: 10, color: T.textDim, letterSpacing: '.16em',
        textTransform: 'uppercase', fontWeight: 700,
      }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 96, 'wght' 600",
        fontSize: 22, letterSpacing: '-.02em',
        color: positive ? T.green : T.red,
      }}>{fmtM(amount)}</div>
    </div>
  )
}

function NetRow({ amount }) {
  const positive = amount >= 0
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '22px 22px',
      background: `linear-gradient(90deg, ${positive ? 'rgba(91, 214, 135, .14)' : 'rgba(239, 69, 101, .14)'}, transparent 70%)`,
      borderTop: `2px solid ${positive ? T.green : T.red}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon
          name={positive ? 'chart_up' : 'chart_down'}
          size={22}
          color={positive ? T.green : T.red}
        />
        <div style={{
          fontFamily: FONTS.serif,
          fontVariationSettings: "'opsz' 144, 'wght' 500",
          fontSize: 22, color: T.text, letterSpacing: '-.01em',
        }}>
          Net Income
        </div>
      </div>
      <div style={{
        fontFamily: FONTS.serif,
        fontVariationSettings: "'opsz' 144, 'wght' 600",
        fontSize: 32, letterSpacing: '-.025em',
        color: positive ? T.green : T.red,
      }}>{fmtM(amount)}</div>
    </div>
  )
}
