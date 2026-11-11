// TEMPORARY (Phase F2 Step 2). Replaced in Step 5.
import { Layers } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

export function SkillsTab() {
  return (
    <EmptyState
      icon={Layers}
      title="The skills list arrives in the next steps"
      description="The tab itself, and the ?tab= address, work already."
    />
  )
}
