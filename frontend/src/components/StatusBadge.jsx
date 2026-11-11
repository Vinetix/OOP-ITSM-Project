// A lamp plus a word, for states such as Active / Inactive / Available.
// Add new statuses (e.g. incident states in Phase F2) to STATUSES below.
import { cn } from '@/lib/utils'
import { Lamp } from './Lamp'

const STATUSES = {
  ACTIVE: { label: 'Active', tone: 'go' },
  INACTIVE: { label: 'Inactive', tone: 'stop' },
  AVAILABLE: { label: 'Available', tone: 'go' },
  UNAVAILABLE: { label: 'Unavailable', tone: 'off' },
  ONLINE: { label: 'Server online', tone: 'go' },
  OFFLINE: { label: 'Server offline', tone: 'stop' },
}

export function StatusBadge({ status, label, className }) {
  const config = STATUSES[status] ?? { label: status, tone: 'off' }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap text-foreground',
        className,
      )}
    >
      <Lamp tone={config.tone} />
      {label ?? config.label}
    </span>
  )
}