// "From → to" as two status tags, or nothing when the status didn't change.
import { ArrowRight } from 'lucide-react'
import { IncidentStatusBadge } from '@/components/incidents/IncidentStatusBadge'

export function StatusChange({ from, to, fallback = null }) {
  if (!from || !to) return fallback
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <IncidentStatusBadge status={from} />
      <ArrowRight aria-label="to" className="size-3.5 text-muted-foreground" />
      <IncidentStatusBadge status={to} />
    </span>
  )
}
