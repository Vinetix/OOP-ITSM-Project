// Small shared pieces for the reports page: the card frame with its own loading
// and error state, number formatting where a missing value shows "–", and the
// chart colours (taken from the app's theme so charts match the badges).
import { ErrorAlert } from '@/components/ErrorAlert'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

export function ReportCard({
  title,
  description,
  state,
  action,
  className,
  children,
  height = 'h-64',
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        {state.error ? (
          <ErrorAlert
            error={state.error}
            title={`Couldn’t load “${title}”`}
            onRetry={state.reload}
          />
        ) : !state.data ? (
          <Skeleton className={`${height} w-full`} />
        ) : (
          children(state.data)
        )}
      </CardContent>
    </Card>
  )
}
