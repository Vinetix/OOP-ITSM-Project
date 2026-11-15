// SLA time maths for countdowns and progress bars. Status and escalation always
// come from the server; these only turn due times into what ticks on screen.

const ms = (iso) => (iso ? new Date(iso).getTime() : null)

export const remainingMs = (dueAt, now = Date.now()) => ms(dueAt) - now

// 4m 12s · 1h 05m · 2d 3h, and "Overdue 3m 10s" once negative
export function formatRemaining(value) {
  const overdue = value < 0
  const total = Math.floor(Math.abs(value) / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  const text = d ? `${d}d ${h}h` : h ? `${h}h ${pad(m)}m` : `${m}m ${pad(s)}s`
  return overdue ? `Overdue ${text}` : text
}

// share of the time used, from start to due (stopping at stopAt if given), 0–1.5
export function elapsedFraction(startedAt, dueAt, stopAt, now = Date.now()) {
  const start = ms(startedAt)
  const due = ms(dueAt)
  if (start === null || due === null || due <= start) return 0
  const end = ms(stopAt) ?? now
  return Math.min(Math.max((end - start) / (due - start), 0), 1.5)
}

// running · overdue · stopped-met · stopped-late
export function clockState(dueAt, stoppedAt, breached, now = Date.now()) {
  if (stoppedAt) return breached || ms(stoppedAt) > ms(dueAt) ? 'stopped-late' : 'stopped-met'
  return remainingMs(dueAt, now) < 0 ? 'overdue' : 'running'
}

// the deadline that's still ticking: response until acknowledged, then resolution
export function nextDeadline(summary) {
  if (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(summary.status)) return null
  if (['NEW', 'CLASSIFIED', 'ASSIGNED'].includes(summary.status)) {
    return { kind: 'response', dueAt: summary.responseDueAt }
  }
  return { kind: 'resolution', dueAt: summary.resolutionDueAt }
}
