// TEMPORARY (Phase F2 Step 2). Replaced in Step 3.
import { Layers } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

export function ServicesTab() {
  return (
    <EmptyState
      icon={Layers}
      title="The services list arrives in the next steps"
      description="The tab itself, and the ?tab= address, work already."
    />
  )
}
