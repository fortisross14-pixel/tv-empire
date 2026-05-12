import { useState, useMemo } from 'react'
import { T } from '../theme.js'
import { MONTHS } from '../constants.js'
import { ledgerForMonth, summarizeLedger, fmtM } from '../engine.js'
import { Icon } from '../icons.jsx'

/**
 * FinancialsScreen — monthly P&L derived from game.ledger.
 *
 * Default view: previous calendar month (the one whose results just rolled in).
 * User can step back/forward through any prior month with a chevron picker.
 *
 * Structure mirrors what the user asked for:
 *   PROGRAM REVENUE    (group, sum)
 *     ↳ Program A      revenue
 *     ↳ Program B      revenue
 *   PROGRAM EXPENSES   (group, sum)
 *     ↳ Program C      build/airing cost
 *     ↳ Program B      airing cost
 *   PROGRAM MARGIN     (subtotal)
 *
 *   OTHER ITEMS        (group, sum)
 *     ↳ Sports rights  (per-league)
 *     ↳ IP rights      (per-IP)
 *     ↳ Salaries       (talent / writer / staff broken out)
 *     ↳ Research
 *     ↳ Marketing
 *     ↳ Hires / Penalties / Awards / Misc
 *
 *   NET INCOME         (grand total)
 */
export function FinancialsScreen({ game, onBack }) {
  // The "current" displayed month — defaults to the month we just finished.
  // game.monthIdx is the *next* month to play (0..11), so the just-finished
  // month is (monthIdx - 1) with year wrap if monthIdx === 0.
  const initial = useMemo(() => {
    const m = game.monthIdx - 1
    if (m < 0) return { year: game.year - 1, month: 11 }
    return { year: game.year, month: m }
  }, [game.monthIdx, game.year])

  const [selected, setSelected] = useState(initial)

  // Build a sorted list of months that have ledger entries so we know
  // what to allow stepping into.
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
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 18 }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: `1px solid ${T.border}`,
          color: T.muted, padding: '8px 14px', borderRadius: 5,
          fontSize: 11.5, fontWeight: 500, marginBottom: 16, cursor: 'pointer',
        }}
      >← Back</button>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 22, gap: 14, flexWrap: 'wrap',
      }}>
        <div>
          <div className="mono" style={{
            fontSize: 11, color: T.muted, letterSpacing: '.15em', marginBottom: 4,
          }}>P&amp;L · INCOME STATEMENT</div>
          <h1 className="display" style={{
            fontSize: 36, color: T.text, letterSpacing: '.04em',
            textTransform: 'uppercase', lineHeight: 1,
          }}>Financials</h1>
        </div>

        {/* Month picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevButton disabled={!hasPrev} onClick={() => hasPrev && setSelected(availableMonths[currentIndex - 1])}>
            ‹
          </ChevButton>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            padding: '8px 18px', borderRadius: 4, minWidth: 140, textAlign: 'center',
          }}>
            <div className="mono" style={{ fontSize: 9.5, color: T.muted, letterSpacing: '.1em' }}>
              REPORTING PERIOD
            </div>
            <div className="display" style={{
              fontSize: 18, color: T.text, letterSpacing: '.04em', marginTop: 2,
            }}>
              {MONTHS[selected.month]} · Y{selected.year}
            </div>
          </div>
          <ChevButton disabled={!hasNext} onClick={() => hasNext && setSelected(availableMonths[currentIndex + 1])}>
            ›
          </ChevButton>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <Statement summary={summary} />
      )}
    </div>
  )
}

// ─── EMPTY STATE ────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 6, padding: 32, textAlign: 'center',
    }}>
      <Icon name="chart_up" size={28} color={T.muted} />
      <div style={{ fontSize: 14, color: T.text, marginTop: 12, marginBottom: 4 }}>
        No transactions in this period.
      </div>
      <div style={{ fontSize: 11.5, color: T.muted }}>
        Advance a month to see your network's revenue and expenses here.
      </div>
    </div>
  )
}

// ─── STATEMENT ──────────────────────────────────────────────────────────
function Statement({ summary }) {
  const { byProgram, other, totals } = summary

  // Programs split into revenue-bearing and expense-bearing buckets.
  // A single program can appear in both (it earned and it cost).
  const revBearing = byProgram.filter(p => p.revenue > 0)
  const expBearing = byProgram.filter(p => p.airingCost < 0 || p.buildCost < 0)

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
      overflow: 'hidden',
    }}>
      {/* ─── PROGRAM REVENUE ─── */}
      <Section title="Program Revenue" total={totals.programRevenue} totalColor={T.green}>
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
        title="Program Expenses"
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

      {/* ─── PROGRAM MARGIN (subtotal line) ─── */}
      <SubtotalRow
        label="Direct Programming Margin"
        amount={totals.programMargin}
      />

      {/* ─── OTHER ITEMS ─── */}
      <Section
        title="Other Items"
        subtitle="Rights, salaries, research & overhead"
        total={totals.otherNet}
        totalColor={totals.otherNet >= 0 ? T.green : T.red}
      >
        {/* Rights */}
        {other.sportsRights.length > 0 && (
          <Subgroup label="Sports Rights">
            {other.sportsRights.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}
        {other.ipRights.length > 0 && (
          <Subgroup label="IP Licenses">
            {other.ipRights.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}

        {/* Salaries */}
        {(other.salaries.talent !== 0 || other.salaries.writer !== 0 || other.salaries.staff !== 0) && (
          <Subgroup label="Salaries" subtotal={other.salaries.total}>
            {other.salaries.talent !== 0 && <Row label="Talent (permanent contracts)" amount={other.salaries.talent} />}
            {other.salaries.writer !== 0 && <Row label="Writers" amount={other.salaries.writer} />}
            {other.salaries.staff  !== 0 && <Row label="Staff (department heads)" amount={other.salaries.staff} />}
          </Subgroup>
        )}

        {/* Research */}
        {other.research.length > 0 && (
          <Subgroup label="Research">
            {other.research.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}

        {/* Marketing */}
        {other.marketing.length > 0 && (
          <Subgroup label="Marketing">
            {other.marketing.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}

        {/* Hires */}
        {other.hires.length > 0 && (
          <Subgroup label="Hires / Signings">
            {other.hires.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}

        {/* Fire penalties */}
        {other.firePenalties.length > 0 && (
          <Subgroup label="Penalties">
            {other.firePenalties.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}

        {/* Award bonuses */}
        {other.awards.length > 0 && (
          <Subgroup label="Award Bonuses">
            {other.awards.map((r, i) => <Row key={i} label={r.label} amount={r.amount} positive />)}
          </Subgroup>
        )}

        {/* Misc / unclassified */}
        {other.misc.length > 0 && (
          <Subgroup label="Other">
            {other.misc.map((r, i) => <Row key={i} label={r.label} amount={r.amount} />)}
          </Subgroup>
        )}

        {other.sportsRights.length === 0 && other.ipRights.length === 0 &&
          other.salaries.total === 0 && other.research.length === 0 &&
          other.marketing.length === 0 && other.hires.length === 0 &&
          other.firePenalties.length === 0 && other.awards.length === 0 &&
          other.misc.length === 0 && (
          <EmptyRow note="No other transactions this month" />
        )}
      </Section>

      {/* ─── NET INCOME ─── */}
      <NetRow amount={totals.net} />
    </div>
  )
}

// ─── ATOMIC COMPONENTS ──────────────────────────────────────────────────

function Section({ title, subtitle, total, totalColor, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      {/* Section header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 18px',
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div>
          <div className="display" style={{
            fontSize: 14, color: T.text, letterSpacing: '.08em', textTransform: 'uppercase',
          }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 10.5, color: T.muted, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <div className="mono" style={{
          fontSize: 16, fontWeight: 700,
          color: totalColor || T.text,
          letterSpacing: '-.01em',
        }}>{fmtM(total)}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Subgroup({ label, subtotal, children }) {
  return (
    <div style={{
      padding: '10px 18px 12px 18px',
      borderTop: `1px dashed ${T.border}`,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6,
      }}>
        <div className="mono" style={{
          fontSize: 10, color: T.textDim, letterSpacing: '.12em', textTransform: 'uppercase',
        }}>{label}</div>
        {subtotal !== undefined && (
          <div className="mono" style={{ fontSize: 11.5, color: T.muted }}>
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
        fontSize: 12.5, color: T.textDim, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        <span style={{ color: T.mutedDim, fontSize: 10 }}>↳</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div className="mono" style={{
        fontSize: 12.5, color, fontWeight: 500, flexShrink: 0,
      }}>{fmtM(amount)}</div>
    </div>
  )
}

function ProgramExpenseRow({ name, total, lines }) {
  return (
    <div style={{ padding: '8px 18px 8px 18px', borderTop: `1px dashed ${T.border}` }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
      }}>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>
          ↳ {name}
        </div>
        <div className="mono" style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>
          {fmtM(total)}
        </div>
      </div>
      <div style={{ paddingLeft: 14 }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '2px 0',
          }}>
            <span style={{ color: T.muted }}>· {l.label}</span>
            <span className="mono" style={{ color: T.muted }}>{fmtM(l.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyRow({ note }) {
  return (
    <div style={{
      padding: '10px 18px', fontSize: 11.5, color: T.muted, fontStyle: 'italic',
    }}>{note}</div>
  )
}

function SubtotalRow({ label, amount }) {
  const positive = amount >= 0
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 18px',
      background: T.bg,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div className="display" style={{
        fontSize: 13, color: T.textDim, letterSpacing: '.07em', textTransform: 'uppercase',
      }}>{label}</div>
      <div className="mono" style={{
        fontSize: 18, fontWeight: 700,
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
      padding: '18px 18px',
      background: `linear-gradient(90deg, ${positive ? 'rgba(91, 214, 135, .12)' : 'rgba(239, 69, 101, .12)'}, transparent)`,
      borderTop: `2px solid ${positive ? T.green : T.red}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon
          name={positive ? 'chart_up' : 'chart_down'}
          size={20}
          color={positive ? T.green : T.red}
        />
        <div className="display" style={{
          fontSize: 18, color: T.text, letterSpacing: '.06em', textTransform: 'uppercase',
        }}>Net Income</div>
      </div>
      <div className="mono" style={{
        fontSize: 26, fontWeight: 700,
        color: positive ? T.green : T.red,
        letterSpacing: '-.02em',
      }}>{fmtM(amount)}</div>
    </div>
  )
}

function ChevButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        color: disabled ? T.mutedDim : T.text,
        width: 36, height: 36,
        borderRadius: 4,
        fontSize: 20,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit',
        transition: 'all .15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = T.borderHi }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
    >{children}</button>
  )
}
