// How much the business depends on a service: Low, Medium, High, Critical.
import { criticalityOf } from '@/config/catalog'
import { ToneTag } from './ToneTag'

export function CriticalityBadge({ criticality, className }) {
  const c = criticalityOf(criticality)
  if (!c) return null
  return (
    <ToneTag tone={c.tone} title={c.hint} className={className}>
      {c.label}
    </ToneTag>
  )
}
