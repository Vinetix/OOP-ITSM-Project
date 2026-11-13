// A technician's active incidents by status, as small tags; zeros are muted.
import { ToneTag } from '@/components/ToneTag'
import { STATUSES } from '@/config/incidents'
import { cn } from '@/lib/utils'

const KEYS = ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'AWAITING_INFO']

export function StatusBreakdown({ byStatus = {}, className }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {KEYS.map((key) => {
        const count = byStatus[key] ?? 0
        return (
          <ToneTag key={key} tone={STATUSES[key].tone} className={cn(!count && 'opacity-40')}>
            <span className="font-extrabold tabular-nums">{count}</span> {STATUSES[key].label}
          </ToneTag>
        )
      })}
    </div>
  )
}
