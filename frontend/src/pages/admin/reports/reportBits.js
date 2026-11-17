// Shared report helpers: number formatting where a missing value shows "–",
// and the chart colours (taken from the app's theme so charts match the badges,
// in light and dark).
import { formatMinutes } from '@/lib/format'

export const dash = '–'
export const minutes = (v) => (v === null || v === undefined ? dash : formatMinutes(Math.round(v)))
export const percent = (v) => (v === null || v === undefined ? dash : `${Number(v).toFixed(1)}%`)
export const rating = (v) => (v === null || v === undefined ? dash : `${Number(v).toFixed(1)} ★`)

export const complianceTone = (v) =>
  v === null || v === undefined ? 'off' : v >= 90 ? 'go' : v >= 75 ? 'caution' : 'stop'

export const COLORS = {
  reported: 'var(--role)',
  resolved: 'var(--lamp-go)',
  violations: 'var(--lamp-stop)',
  critical: 'var(--tone-red)',
  total: 'var(--role)',
  grid: 'var(--border)',
  axis: 'var(--muted-foreground)',
}
export const PALETTE = [
  'var(--tone-blue)',
  'var(--tone-teal)',
  'var(--tone-amber)',
  'var(--tone-purple)',
  'var(--tone-orange)',
  'var(--tone-indigo)',
  'var(--tone-green)',
  'var(--tone-red)',
  'var(--tone-slate)',
  'var(--tone-yellow)',
]

export const axisProps = {
  tick: { fill: COLORS.axis, fontSize: 12 },
  axisLine: { stroke: COLORS.grid },
  tickLine: false,
}
export const tooltipStyle = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
  },
  labelStyle: { fontWeight: 600, color: 'var(--foreground)' },
}
