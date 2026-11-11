// Date formatting in one place, so every screen shows dates the same way.
// The API sends UTC timestamps ("2026-11-05T09:30:00Z"); these helpers
// display them in the browser's local time, e.g. "05 Nov 2026, 3:00 PM".

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

/** "05 Nov 2026" */
export function formatDate(value) {
  const date = toDate(value)
  return date ? dateParts.format(date) : '—'
}

/** "3:00 PM" */
export function formatTime(value) {
  const date = toDate(value)
  return date ? timeParts.format(date) : '—'
}

/** "05 Nov 2026, 3:00 PM" */
export function formatDateTime(value) {
  const date = toDate(value)
  return date ? `${formatDate(date)}, ${formatTime(date)}` : '—'
}