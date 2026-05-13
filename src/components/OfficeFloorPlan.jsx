import { T } from '../theme.js'
import { STAFF_ROLES, DIRECTOR_ROLES, MARKETS } from '../constants.js'
import { talentCount, talentCapacity, directorCount } from '../engine.js'

/**
 * OfficeFloorPlan — visual representation of the player's office.
 *
 * Renders one of three floor plans based on station.market:
 *   - local    : 4 rooms  (CEO, Talent X/10,  2 VP slots)
 *   - metro    : 6 rooms  (CEO, Talent X/15,  4 VP slots)
 *   - national : 12 rooms (CEO, Talent X/15-25, 5 VP-rooms + 5 director-rooms)
 *
 * National talent cap rises 15 → 25 only when Director of Talent is hired.
 *
 * Rooms are NOT clickable. The floor plan is a status board: it updates passively
 * as the player hires VPs and directors through Operations → Staff.
 *
 * Slot assignment for Local/Metro (where any VP can occupy any "Available" slot):
 *   - canonical role order = STAFF_ROLES order (personnel, innovation, operations,
 *     marketing, content)
 *   - the Nth VP in canonical order fills the Nth Available slot
 *   - this means the layout is stable regardless of hire order
 *
 * At National every VP has a dedicated room — no fallback needed.
 * Each VP also has an adjacent "directors" room with one circle per child director;
 * scheduling has up to 4 circles and they fill left-to-right as you hire them.
 *
 * Below the floor plan, a roster lists every current VP with name, tier.
 */

// ─── HELPERS ─────────────────────────────────────────────────────────────────
/** Returns the list of hired VPs in canonical (STAFF_ROLES) order. */
function hiredVPsInOrder(station) {
  const result = []
  for (const role of STAFF_ROLES) {
    const rec = station.staff?.[role.id]
    if (rec) result.push({ ...rec, roleId: role.id, roleLabel: role.label })
  }
  return result
}

/** Returns the list of hired directors in DIRECTOR_ROLES order. */
function hiredDirectorsInOrder(station) {
  const result = []
  for (const role of DIRECTOR_ROLES) {
    const cur = directorCount(station, role.id)
    if (cur > 0) result.push({ roleId: role.id, roleLabel: role.label, count: cur, max: role.maxCount || 1 })
  }
  return result
}

/** Short room title for a VP — "VP MARKETING" rather than "VP OF MARKETING". */
function vpShortLabel(roleId) {
  const role = STAFF_ROLES.find(r => r.id === roleId)
  if (!role) return roleId.toUpperCase()
  return `VP ${role.label.replace('VP of ', '').toUpperCase()}`
}

// ─── COLORS ──────────────────────────────────────────────────────────────────
// Filled rooms use a desaturated version of the accent so they pop against the
// dark canvas without screaming for attention. Empty rooms use muted gray.
const WALL = T.textDim
const ROOM_BG = T.surface
const EMPTY_RING = T.muted
const EMPTY_TEXT = T.muted
const FILLED_RING = T.gold
const FILLED_FILL = T.gold + '22'
const FILLED_TEXT = T.text
const BAR_BG = T.cardHi
const BAR_FILL = T.gold

// ─── ROOM PRIMITIVES ─────────────────────────────────────────────────────────
function Room({ x, y, w, h, children }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h}
            fill={ROOM_BG} stroke={WALL} strokeWidth={2} />
      {children}
    </g>
  )
}

function PersonIcon({ cx, cy, r, color }) {
  // simple seated-figure glyph; sized relative to the slot radius.
  const headR = r * 0.32
  return (
    <g>
      <circle cx={cx} cy={cy - r * 0.3} r={headR} fill={color} />
      <path d={`M ${cx - r * 0.55} ${cy + r * 0.45}
                Q ${cx} ${cy - r * 0.05} ${cx + r * 0.55} ${cy + r * 0.45}
                L ${cx + r * 0.55} ${cy + r * 0.7}
                L ${cx - r * 0.55} ${cy + r * 0.7} Z`}
            fill={color} />
    </g>
  )
}

function FilledSlot({ cx, cy, r, label }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill={FILLED_FILL} stroke={FILLED_RING} strokeWidth={1.5} />
      <PersonIcon cx={cx} cy={cy} r={r} color={FILLED_RING} />
      {label && (
        <text x={cx} y={cy + r + 16} textAnchor="middle"
              fontSize={10} fill={FILLED_TEXT}
              style={{ letterSpacing: '0.08em', fontWeight: 600 }}>
          {label.toUpperCase()}
        </text>
      )}
    </g>
  )
}

function EmptySlot({ cx, cy, r, label = 'AVAILABLE', dashed = true }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill="none" stroke={EMPTY_RING} strokeWidth={1.5}
              strokeDasharray={dashed ? '4 3' : undefined} />
      {label && (
        <text x={cx} y={cy + r + 16} textAnchor="middle"
              fontSize={10} fill={EMPTY_TEXT}
              style={{ letterSpacing: '0.12em' }}>
          {label}
        </text>
      )}
    </g>
  )
}

function RoomTitle({ x, y, text }) {
  return (
    <text x={x} y={y} textAnchor="middle"
          fontSize={10} fill={EMPTY_TEXT}
          style={{ letterSpacing: '0.15em', fontWeight: 600 }}>
      {text}
    </text>
  )
}

function TalentRoom({ x, y, w, h, count, cap }) {
  const barW = Math.min(w - 40, 140)
  const barH = 12
  const barX = x + (w - barW) / 2
  const barY = y + h / 2 - barH / 2
  const pct = Math.min(1, count / cap)
  return (
    <>
      <RoomTitle x={x + w / 2} y={y + 22} text="TALENT" />
      <rect x={barX} y={barY} width={barW} height={barH}
            fill={BAR_BG} rx={2} />
      {pct > 0 && (
        <rect x={barX} y={barY} width={Math.max(2, barW * pct)} height={barH}
              fill={BAR_FILL} rx={2} />
      )}
      <text x={x + w / 2} y={barY + barH + 22}
            textAnchor="middle" fontSize={13}
            fill={FILLED_TEXT} fontWeight={600}>
        {count} / {cap}
      </text>
    </>
  )
}

function CEORoom({ x, y, w, h }) {
  // Match the VP slot size (radius 22) for visual consistency across rooms.
  const r = 22
  return (
    <>
      <RoomTitle x={x + w / 2} y={y + 22} text="CEO" />
      <g style={{ transform: 'none' }}>
        <circle cx={x + w / 2} cy={y + h / 2 + 4} r={r}
                fill={FILLED_FILL} stroke={FILLED_RING} strokeWidth={1.5} />
        <PersonIcon cx={x + w / 2} cy={y + h / 2 + 4} r={r} color={FILLED_RING} />
      </g>
    </>
  )
}

// ─── LAYOUTS ─────────────────────────────────────────────────────────────────

/** LOCAL — 4 rooms in a 2x2 grid: CEO, Talent, 2 VP slots */
function LocalPlan({ station }) {
  const vps = hiredVPsInOrder(station)
  const slotCount = 2
  const W = 480, H = 320
  const colW = W / 2
  const rowH = H / 2
  const slotR = 22

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
         style={{ display: 'block', maxWidth: 520, margin: '0 auto' }}>
      {/* CEO (0,0) */}
      <Room x={0} y={0} w={colW} h={rowH} />
      <CEORoom x={0} y={0} w={colW} h={rowH} />

      {/* Talent (1,0) */}
      <Room x={colW} y={0} w={colW} h={rowH} />
      <TalentRoom x={colW} y={0} w={colW} h={rowH}
                  count={talentCount(station)} cap={talentCapacity(station)} />

      {/* Bottom row: 2 VP slots */}
      {Array.from({ length: slotCount }).map((_, i) => {
        const x = i * colW
        const y = rowH
        const cx = x + colW / 2
        const cy = y + rowH / 2 + 4
        const vp = vps[i]
        return (
          <g key={i}>
            <Room x={x} y={y} w={colW} h={rowH} />
            <RoomTitle x={cx} y={y + 22}
                       text={vp ? vpShortLabel(vp.roleId) : 'AVAILABLE'} />
            {vp ? (
              <FilledSlot cx={cx} cy={cy} r={slotR} label={null} />
            ) : (
              <EmptySlot cx={cx} cy={cy} r={slotR} label={null} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** METRO — 6 rooms in a 3x2 grid: CEO, Talent, 4 VP slots */
function MetroPlan({ station }) {
  const vps = hiredVPsInOrder(station)
  const slotCount = 4
  const W = 600, H = 320
  const colW = W / 3
  const rowH = H / 2
  const slotR = 22

  // Fixed rooms: CEO at (0,0), Talent at (1,0). The other 4 slots are:
  // (2,0), (0,1), (1,1), (2,1) — top-right, then bottom-row L→R.
  const slotPositions = [
    { col: 2, row: 0 },
    { col: 0, row: 1 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
         style={{ display: 'block', maxWidth: 640, margin: '0 auto' }}>
      {/* CEO (0,0) */}
      <Room x={0} y={0} w={colW} h={rowH} />
      <CEORoom x={0} y={0} w={colW} h={rowH} />

      {/* Talent (1,0) */}
      <Room x={colW} y={0} w={colW} h={rowH} />
      <TalentRoom x={colW} y={0} w={colW} h={rowH}
                  count={talentCount(station)} cap={talentCapacity(station)} />

      {/* 4 VP slots */}
      {slotPositions.map((pos, i) => {
        const x = pos.col * colW
        const y = pos.row * rowH
        const cx = x + colW / 2
        const cy = y + rowH / 2 + 4
        const vp = vps[i]
        return (
          <g key={i}>
            <Room x={x} y={y} w={colW} h={rowH} />
            <RoomTitle x={cx} y={y + 22}
                       text={vp ? vpShortLabel(vp.roleId) : 'AVAILABLE'} />
            {vp ? (
              <FilledSlot cx={cx} cy={cy} r={slotR} label={null} />
            ) : (
              <EmptySlot cx={cx} cy={cy} r={slotR} label={null} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** NATIONAL — 12 rooms in a 4x3 grid.
 *  Top row:    CEO, Talent, VP Marketing, Marketing Directors
 *  Middle row: VP Operations, Ops Directors, VP Content, Content Directors
 *  Bottom row: VP Personnel, Personnel Directors, VP Innovation, Innovation Dir
 */
function NationalPlan({ station }) {
  const W = 720, H = 360
  const colW = W / 4
  const rowH = H / 3
  const slotR = 20
  const dirR = 13

  // Hardcoded grid: each cell knows what it is.
  // For each VP cell: roleId of the matching VP.
  // For each Directors cell: roleId of the parent + number of director circles.
  const cells = [
    { kind: 'ceo',    col: 0, row: 0 },
    { kind: 'talent', col: 1, row: 0 },
    { kind: 'vp',     col: 2, row: 0, roleId: 'marketing' },
    { kind: 'dirs',   col: 3, row: 0, parentVP: 'marketing',
      label: 'MKT DIRECTORS', dirIds: ['marketing', 'merchandising'] },
    { kind: 'vp',     col: 0, row: 1, roleId: 'operations' },
    { kind: 'dirs',   col: 1, row: 1, parentVP: 'operations',
      label: 'OPS DIRECTORS', dirIds: ['scheduling'], schedulingMax: 4 },
    { kind: 'vp',     col: 2, row: 1, roleId: 'content' },
    { kind: 'dirs',   col: 3, row: 1, parentVP: 'content',
      label: 'CONTENT DIRECTORS', dirIds: ['production', 'creative'] },
    { kind: 'vp',     col: 0, row: 2, roleId: 'personnel' },
    { kind: 'dirs',   col: 1, row: 2, parentVP: 'personnel',
      label: 'PERS DIRECTORS', dirIds: ['talent', 'staff'] },
    { kind: 'vp',     col: 2, row: 2, roleId: 'innovation' },
    { kind: 'dirs',   col: 3, row: 2, parentVP: 'innovation',
      label: 'INNOVATION DIR', dirIds: ['techinnov'] },
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
         style={{ display: 'block', maxWidth: 760, margin: '0 auto' }}>
      {cells.map((c, i) => {
        const x = c.col * colW
        const y = c.row * rowH
        const cx = x + colW / 2
        const cy = y + rowH / 2 + 4

        if (c.kind === 'ceo') {
          return (
            <g key={i}>
              <Room x={x} y={y} w={colW} h={rowH} />
              <CEORoom x={x} y={y} w={colW} h={rowH} />
            </g>
          )
        }
        if (c.kind === 'talent') {
          return (
            <g key={i}>
              <Room x={x} y={y} w={colW} h={rowH} />
              <TalentRoom x={x} y={y} w={colW} h={rowH}
                          count={talentCount(station)} cap={talentCapacity(station)} />
            </g>
          )
        }
        if (c.kind === 'vp') {
          const vp = station.staff?.[c.roleId]
          return (
            <g key={i}>
              <Room x={x} y={y} w={colW} h={rowH} />
              <RoomTitle x={cx} y={y + 22} text={vpShortLabel(c.roleId)} />
              {vp ? (
                <FilledSlot cx={cx} cy={cy} r={slotR} label={null} />
              ) : (
                <EmptySlot cx={cx} cy={cy} r={slotR} label={null} />
              )}
            </g>
          )
        }
        // dirs
        // Build the list of circles to draw. For most rooms, dirIds is the
        // list of (1 or 2) director roles, each as one circle. For the
        // operations room, scheduling is special — show schedulingMax circles
        // filling left-to-right as the count rises.
        let circles
        if (c.dirIds.length === 1 && c.schedulingMax) {
          const cur = directorCount(station, c.dirIds[0])
          circles = Array.from({ length: c.schedulingMax }, (_, idx) => ({
            roleId: c.dirIds[0],
            filled: idx < cur,
          }))
        } else {
          circles = c.dirIds.map(rid => ({
            roleId: rid,
            filled: directorCount(station, rid) > 0,
          }))
        }
        const positions = circlePositions(circles.length, cx, cy, colW, rowH, dirR)
        return (
          <g key={i}>
            <Room x={x} y={y} w={colW} h={rowH} />
            <RoomTitle x={cx} y={y + 22} text={c.label} />
            {positions.map((p, j) => (
              circles[j].filled
                ? <FilledSlot key={j} cx={p.x} cy={p.y} r={dirR} label={null} />
                : <EmptySlot  key={j} cx={p.x} cy={p.y} r={dirR} label={null} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/** Distribute N circles inside a room (rectangle centered at (cx, cy)). */
function circlePositions(n, cx, cy, w, h, r) {
  const usableW = w - 30
  const usableH = h - 50
  if (n === 1) return [{ x: cx, y: cy + 6 }]
  if (n === 2) {
    return [
      { x: cx - usableW / 4, y: cy + 6 },
      { x: cx + usableW / 4, y: cy + 6 },
    ]
  }
  if (n === 3) {
    return [
      { x: cx - usableW / 4, y: cy + 6 },
      { x: cx,              y: cy + 6 },
      { x: cx + usableW / 4, y: cy + 6 },
    ]
  }
  // 4 — 2x2 grid
  return [
    { x: cx - usableW / 4, y: cy - usableH / 6 },
    { x: cx + usableW / 4, y: cy - usableH / 6 },
    { x: cx - usableW / 4, y: cy + usableH / 4 },
    { x: cx + usableW / 4, y: cy + usableH / 4 },
  ]
}

// ─── ROSTER LIST (below the floor plan) ──────────────────────────────────────
function VPRoster({ station }) {
  const vps = hiredVPsInOrder(station)
  const dirs = hiredDirectorsInOrder(station)
  if (vps.length === 0 && dirs.length === 0) {
    return (
      <div style={{
        marginTop: 14, padding: '10px 12px',
        background: T.bg, border: `1px dashed ${T.border}`, borderRadius: 5,
        fontSize: 11, color: T.muted, fontStyle: 'italic',
      }}>
        No staff hired yet. Use the panel below to open a position.
      </div>
    )
  }
  return (
    <div style={{ marginTop: 14 }}>
      {vps.length > 0 && (
        <>
          <div style={{
            fontSize: 10, color: T.muted, letterSpacing: '.1em',
            marginBottom: 6,
          }}>CURRENT VPs · {vps.length}</div>
          <div style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
            {vps.map(vp => (
              <div key={vp.roleId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px',
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 4,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                    {vp.name}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
                    {vp.roleLabel} · {vp.tier}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {dirs.length > 0 && (
        <>
          <div style={{
            fontSize: 10, color: T.muted, letterSpacing: '.1em',
            marginBottom: 6,
          }}>CURRENT DIRECTORS · {dirs.reduce((n, d) => n + d.count, 0)}</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {dirs.map(d => (
              <div key={d.roleId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px',
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 4,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                    {d.roleLabel}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
                    {d.max > 1 ? `${d.count} / ${d.max}` : 'Common'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function OfficeFloorPlan({ station }) {
  const market = station.market || 'local'
  const marketLabel = (MARKETS[market]?.label || market).toUpperCase()
  const roomCount = { local: 4, metro: 6, national: 12 }[market] || 4

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10, color: T.muted, letterSpacing: '.15em',
        marginBottom: 8,
      }}>
        {marketLabel} OFFICE · {roomCount} ROOMS
      </div>
      <div style={{
        padding: 12,
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
      }}>
        {market === 'local'    && <LocalPlan    station={station} />}
        {market === 'metro'    && <MetroPlan    station={station} />}
        {market === 'national' && <NationalPlan station={station} />}
      </div>
      <VPRoster station={station} />
    </div>
  )
}
