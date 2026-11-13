// One SLA deadline, live: "Due in 12 min" or "3 min overdue" (red), refreshed
// every 30 seconds. Once the step is done it shows when, and whether in time.
import { useNow } from '@/hooks/useNow'
import { formatDateTime } from '@/lib/format'
import { isPast, timeUntil } from '@/lib/time'
import { cn } from '@/lib/utils'

export function SlaCountdown({ dueAt, doneAt, breached, doneLabel = 'Done', className }) {
  const now = useNow()

  if (doneAt) {
    const late = breached || new Date(doneAt) > new Date(dueAt)
    return (
      <span className={cn('grid', className)}>
        <span className={cn('font-semibold', late ? 'text-destructive' : 'text-lamp-go')}>
          {late ? `${doneLabel}, late` : `${doneLabel} in time`}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateTime(doneAt)}</span>
      </span>
    )
  }

  const overdue = isPast(dueAt, now)
  return (
    <span className={cn('grid', className)} title={`Due ${formatDateTime(dueAt)}`}>
      <span className={cn('font-semibold tabular-nums', overdue && 'text-destructive')}>
        {overdue ? timeUntil(dueAt, now) : `Due ${timeUntil(dueAt, now)}`}
      </span>
      <span className="text-xs text-muted-foreground">{formatDateTime(dueAt)}</span>
    </span>
  )
}
