// Shown once an incident has been escalated. While it's still waiting to be
// acknowledged it's urgent (red at level 3) and the assigned technician gets
// "Acknowledge now"; afterwards it stays as a neutral note of what happened.
import { Siren } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ESCALATION_LEVELS } from '@/config/sla'
import { formatDateTime } from '@/lib/format'
import { timeSince } from '@/lib/time'
import { cn } from '@/lib/utils'

export function EscalationBanner({ incident, user, onAction }) {
  const level = incident.escalationLevel
  const info = ESCALATION_LEVELS[level]
  if (!info) return null

  const waiting = incident.status === 'ASSIGNED'
  const canAcknowledge =
    waiting &&
    incident.assignedTechnician?.id === user.id &&
    incident.allowedActions?.includes('ACKNOWLEDGE')

  return (
    <div
      role={waiting ? 'alert' : 'status'}
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        !waiting && 'border-border bg-muted/60',
        waiting && level === 3 && 'border-lamp-stop/40 bg-lamp-stop/8',
        waiting && level < 3 && 'border-lamp-caution/40 bg-lamp-caution/8',
      )}
    >
      <p className="flex items-start gap-2 text-sm">
        <Siren
          aria-hidden="true"
          className={cn(
            'mt-0.5 size-4 shrink-0',
            waiting && level === 3
              ? 'text-lamp-stop'
              : waiting
                ? 'text-lamp-caution'
                : 'text-muted-foreground',
          )}
        />
        {waiting ? (
          <span>
            <span className="font-bold">Escalated to level {level}:</span> {info.alerted}
            {incident.escalatedAt && (
              <span className="text-muted-foreground" title={formatDateTime(incident.escalatedAt)}>
                {' '}
                · {timeSince(incident.escalatedAt)}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Was escalated to level {level} before it was acknowledged.
          </span>
        )}
      </p>
      {canAcknowledge && (
        <Button
          size="sm"
          variant={level === 3 ? 'destructive' : 'default'}
          onClick={() => onAction('ACKNOWLEDGE')}
        >
          Acknowledge now
        </Button>
      )}
    </div>
  )
}
