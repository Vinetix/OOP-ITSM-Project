// One SLA deadline, ticking every second: "4m 12s left" (amber once 75% of the
// time is used), "Overdue 3m 10s" in red, or once stopped "Met in 3m 20s"
// (green) or "Late by 1m 05s" (red).
import { useNow } from '@/hooks/useNow'
import { formatDateTime } from '@/lib/format'
import { clockState, elapsedFraction, formatRemaining, remainingMs } from '@/lib/sla'
import { cn } from '@/lib/utils'

export function SlaCountdown({
  dueAt,
  startedAt,
  stoppedAt,
  breached,
  compact = false,
  className,
}) {
  const now = useNow()
  if (!dueAt) return null
  const state = clockState(dueAt, stoppedAt, breached, now)
  const used = elapsedFraction(startedAt, dueAt, stoppedAt, now)

  let text
  let tone
  if (state === 'stopped-met') {
    text = `Met in ${formatRemaining(new Date(stoppedAt) - new Date(startedAt ?? stoppedAt))}`
    tone = 'text-[color:color-mix(in_oklab,var(--lamp-go)_75%,black)]'
  } else if (state === 'stopped-late') {
    text = `Late by ${formatRemaining(Math.max(new Date(stoppedAt) - new Date(dueAt), 0))}`
    tone = 'text-destructive'
  } else if (state === 'overdue') {
    text = formatRemaining(remainingMs(dueAt, now)) // "Overdue …"
    tone = 'text-destructive'
  } else {
    text = `${formatRemaining(remainingMs(dueAt, now))} left`
    tone =
      used >= 0.75
        ? 'text-[color:color-mix(in_oklab,var(--lamp-caution)_70%,black)]'
        : 'text-foreground'
  }

  return (
    <span
      title={`Due ${formatDateTime(dueAt)}`}
      className={cn(
        'font-semibold whitespace-nowrap tabular-nums',
        compact ? 'text-xs' : 'text-base',
        tone,
        className,
      )}
    >
      {text}
    </span>
  )
}
