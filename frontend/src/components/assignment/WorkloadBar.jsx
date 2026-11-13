// Active incidents against the limit, as a bar with "2 / 6". Green under 60%,
// amber from 60%, red when full; grey when the technician can't take work.
import { cn } from '@/lib/utils'

export function WorkloadBar({ workload, size = 'md', className }) {
  const {
    activeIncidents = 0,
    maxActiveIncidents = 0,
    active = true,
    available = true,
  } = workload ?? {}
  const share = maxActiveIncidents ? Math.min(activeIncidents / maxActiveIncidents, 1) : 0
  const off = !active || !available
  const tone = off
    ? 'bg-lamp-off'
    : share >= 1
      ? 'bg-lamp-stop'
      : share >= 0.6
        ? 'bg-lamp-caution'
        : 'bg-lamp-go'
  const note = !active ? 'Deactivated' : !available ? 'Unavailable' : null

  return (
    <div className={cn('grid gap-1', off && 'opacity-70', className)}>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={maxActiveIncidents}
        aria-valuenow={activeIncidents}
        aria-label={`${activeIncidents} of ${maxActiveIncidents} active incidents${note ? `, ${note.toLowerCase()}` : ''}`}
        className={cn(
          'w-full overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10 ring-inset',
          size === 'lg' ? 'h-3.5' : size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', tone)}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <div className={cn('flex justify-between gap-2', size === 'lg' ? 'text-sm' : 'text-xs')}>
        <span className="font-semibold tabular-nums">
          {activeIncidents} / {maxActiveIncidents}
        </span>
        {note && <span className="text-muted-foreground">{note}</span>}
      </div>
    </div>
  )
}
