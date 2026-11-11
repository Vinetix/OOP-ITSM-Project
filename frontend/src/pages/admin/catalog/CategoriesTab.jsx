// TEMPORARY (Phase F2 Step 2). Replaced in Step 4.
import { Layers } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

export function CategoriesTab() {
  return (
    <EmptyState
      icon={Layers}
      title="The categories list arrives in the next steps"
      description="The tab itself, and the ?tab= address, work already."
    />
  )
}
