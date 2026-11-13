// SLA status with a lamp: on track (green), at risk (amber), breached (red),
// met (green tick).
import { CircleCheck } from 'lucide-react'
import { Lamp } from '@/components/Lamp'
import { SLA_STATUSES } from '@/config/incidents'
import { cn } from '@/lib/utils'

export function SlaStatusBadge({ status, className }) {
  const s = SLA_STATUSES[status]
  if (!s) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap',
        status === 'BREACHED' && 'text-destructive',
        className,
      )}
    >
      {status === 'MET' ? (
        <CircleCheck aria-hidden="true" className="size-3.5 text-lamp-go" />
      ) : (
        <Lamp tone={s.tone} />
      )}
      {s.label}
    </span>
  )
}
