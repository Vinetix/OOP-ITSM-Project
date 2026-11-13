// An incident's status as a square tag, e.g. "Waiting for reporter".
import { ToneTag } from '@/components/ToneTag'
import { STATUSES } from '@/config/incidents'

export function IncidentStatusBadge({ status, className }) {
  const s = STATUSES[status] ?? { label: status, tone: 'grey' }
  return (
    <ToneTag tone={s.tone} className={className}>
      {s.label}
    </ToneTag>
  )
}
