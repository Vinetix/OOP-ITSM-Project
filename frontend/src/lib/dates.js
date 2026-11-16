// Local calendar dates as YYYY-MM-DD (what date inputs and the API use).

export function localIsoDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** today minus n days, as YYYY-MM-DD */
export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localIsoDate(d)
}

export const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')
