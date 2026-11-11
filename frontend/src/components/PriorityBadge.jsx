// An incident priority, e.g. "P1 · Critical".
import { priorityOf } from '@/config/catalog'
import { ToneTag } from './ToneTag'

export function PriorityBadge({ priority, className }) {
  const p = priorityOf(priority)
  if (!p) return null
  return (
    <ToneTag tone={p.tone} className={className}>
      <span className="font-extrabold">{p.value}</span>
      <span aria-hidden="true" className="opacity-60">
        ·
      </span>
      {p.label}
    </ToneTag>
  )
}
