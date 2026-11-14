// The History tab: the incident's audit trail, oldest first (or flipped).
// `version` changes whenever the incident does, so the newest step shows up
// straight after an action, or when someone else's change is picked up.
import { useState } from 'react'
import { ArrowDownUp } from 'lucide-react'
import { auditApi } from '@/api/auditApi'
import { AuditTimeline } from '@/components/audit/AuditTimeline'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'

export function IncidentHistory({ incidentId, version }) {
  const history = useAsync(() => auditApi.incidentHistory(incidentId), [incidentId, version])
  const [newestFirst, setNewestFirst] = useState(false)

  if (history.error) {
    return (
      <ErrorAlert
        error={history.error}
        title="Couldn’t load the history"
        onRetry={history.reload}
      />
    )
  }
  if (!history.data) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  const entries = newestFirst ? [...history.data].reverse() : history.data
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {history.data.length} {history.data.length === 1 ? 'event' : 'events'}, recorded by the
          system and never changed.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNewestFirst((v) => !v)}
          aria-pressed={newestFirst}
        >
          <ArrowDownUp aria-hidden="true" />
          {newestFirst ? 'Newest first' : 'Oldest first'}
        </Button>
      </div>
      <AuditTimeline entries={entries} />
    </div>
  )
}
