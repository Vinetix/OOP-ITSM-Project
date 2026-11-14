// An incident's audit trail as a vertical line of events: what happened, who
// did it (or System), any status change, the details, and when.
import { auditAction } from '@/config/audit'
import { formatDateTime } from '@/lib/format'
import { timeSince } from '@/lib/time'
import { cn } from '@/lib/utils'
import { ActorLabel } from './ActorLabel'
import { StatusChange } from './StatusChange'

export function AuditTimeline({ entries }) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">No history yet.</p>

  return (
    <ol className="relative grid gap-0">
      {entries.map((entry, n) => {
        const action = auditAction(entry.action)
        const Icon = action.icon
        const last = n === entries.length - 1
        return (
          <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className="absolute top-8 bottom-0 left-[15px] w-px bg-border"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card',
                entry.system
                  ? 'border-dashed border-lamp-off text-muted-foreground'
                  : 'border-border text-foreground',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="grid min-w-0 flex-1 gap-1.5 pt-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-bold">{action.label}</span>
                <span className="text-muted-foreground">by</span>
                <ActorLabel entry={entry} />
                <time
                  dateTime={entry.occurredAt}
                  title={formatDateTime(entry.occurredAt)}
                  className="ml-auto text-xs text-muted-foreground"
                >
                  {timeSince(entry.occurredAt)}
                </time>
              </div>
              <StatusChange from={entry.fromStatus} to={entry.toStatus} />
              {entry.details && (
                <p className="text-sm break-words text-muted-foreground">{entry.details}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
