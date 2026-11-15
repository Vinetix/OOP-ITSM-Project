// Time used from start to due, as a bar with a tick at 75%. Green, then amber
// past 75%, then a full red bar with "+x%" once the deadline has passed.
import { useNow } from '@/hooks/useNow'
import { elapsedFraction } from '@/lib/sla'
import { cn } from '@/lib/utils'

export function SlaProgress({ startedAt, dueAt, stoppedAt, className }) {
  const now = useNow()
  const used = elapsedFraction(startedAt, dueAt, stoppedAt, now)
  const fill = used > 1 ? 'bg-lamp-stop' : used >= 0.75 ? 'bg-lamp-caution' : 'bg-lamp-go'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="meter"
        aria-label="Share of the SLA time used"
        aria-valuemin={0}
        aria-valuemax={150}
        aria-valuenow={Math.round(used * 100)}
        className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10 ring-inset"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-1000',
            fill,
            stoppedAt && 'opacity-70',
          )}
          style={{ width: `${Math.min(used, 1) * 100}%` }}
        />
        <span aria-hidden="true" className="absolute inset-y-0 left-3/4 w-px bg-foreground/40" />
      </div>
      <span
        className={cn(
          'w-12 text-right text-xs tabular-nums',
          used > 1 ? 'font-bold text-destructive' : 'text-muted-foreground',
        )}
      >
        {used > 1 ? `+${Math.round((used - 1) * 100)}%` : `${Math.round(used * 100)}%`}
      </span>
    </div>
  )
}
