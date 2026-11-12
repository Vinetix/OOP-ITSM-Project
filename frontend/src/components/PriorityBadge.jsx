// An incident priority, e.g. "P1 · Critical".
import { priorityOf } from '@/config/catalog'
import { ToneTag } from './ToneTag'

export function PriorityBadge({ priority, className }) {
  const p = priorityOf(priority)
  if (!p) return null
  return (
    <ToneTag tone={p.tone} className={className}>
      <span className="font-extrabold">{p.value}</span>
      {/* spacing set by hand: Overpass draws the middle dot with almost no room after it */}
      <span aria-hidden="true" className="mx-0.5 opacity-60">
        ·
      </span>
      <span>{p.label}</span>
    </ToneTag>
  )
}
