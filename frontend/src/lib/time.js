// Relative times: "in 12 min", "3 h 5 min overdue", "5 min ago".
// Two units at most, because "1 d 4 h 12 min" is more than anyone reads at a glance.

function span(minutes) {
  const m = Math.round(Math.abs(minutes))
  if (m < 1) return 'less than a minute'
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const min = m % 60
  const parts = [d && `${d} d`, h && `${h} h`, min && `${min} min`].filter(Boolean)
  return parts.slice(0, 2).join(' ')
}

const minutesFrom = (iso, now) => (new Date(iso).getTime() - now) / 60000

/** "in 12 min", or "3 h 5 min overdue" once the time has passed. */
export function timeUntil(iso, now = Date.now()) {
  if (!iso) return '—'
  const m = minutesFrom(iso, now)
  return m >= 0 ? `in ${span(m)}` : `${span(m)} overdue`
}

/** "5 min ago", "2 d 3 h ago", or "just now". */
export function timeSince(iso, now = Date.now()) {
  if (!iso) return '—'
  const m = -minutesFrom(iso, now)
  return m < 1 ? 'just now' : `${span(m)} ago`
}

export const isPast = (iso, now = Date.now()) => Boolean(iso) && new Date(iso).getTime() < now
