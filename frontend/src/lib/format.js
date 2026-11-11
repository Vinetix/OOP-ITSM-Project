// The API sends UTC timestamps; these show them in local time,
// the same way on every screen: "05 Nov 2026, 3:00 PM".

function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const dateParts = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeParts = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

// 05 Nov 2026
export function formatDate(value) {
  const date = toDate(value)
  return date ? dateParts.format(date) : '—'
}

// 3:00 PM
export function formatTime(value) {
  const date = toDate(value)
  return date ? timeParts.format(date) : '—'
}

// 05 Nov 2026, 3:00 PM
export function formatDateTime(value) {
  const date = toDate(value)
  return date ? `${formatDate(date)}, ${formatTime(date)}` : '—'
}

// Minutes as people say them: 5 → "5 min", 90 → "1 h 30 min", 1680 → "1 d 4 h".
export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) return '—'
  const total = Math.max(0, Math.round(Number(minutes)))
  if (total === 0) return '0 min'
  const days = Math.floor(total / 1440)
  const hours = Math.floor((total % 1440) / 60)
  const mins = total % 60
  return [days && `${days} d`, hours && `${hours} h`, mins && `${mins} min`]
    .filter(Boolean)
    .join(' ')
}
