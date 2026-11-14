// The latest audit entries across all incidents, for the admin dashboard.
import { Link } from 'react-router'
import { auditApi } from '@/api/auditApi'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { auditAction } from '@/config/audit'
import { useAsync } from '@/hooks/useAsync'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { formatDateTime } from '@/lib/format'
import { timeSince } from '@/lib/time'
import { ActorLabel } from './ActorLabel'

function Entry({ entry }) {
  const action = auditAction(entry.action)
  const Icon = action.icon
  return (
    <li className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="grid min-w-0 flex-1 gap-1 text-sm">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{action.label}</span>
          <Link
            to={`/admin/incidents/${entry.incidentId}`}
            className="font-mono text-[0.8rem] font-semibold hover:underline"
          >
            {entry.incidentNumber}
          </Link>
          <time
            dateTime={entry.occurredAt}
            title={formatDateTime(entry.occurredAt)}
            className="ml-auto text-xs text-muted-foreground"
          >
            {timeSince(entry.occurredAt)}
          </time>
        </span>
        <ActorLabel entry={entry} />
      </div>
    </li>
  )
}

export function RecentActivity({ className }) {
  const recent = useAsync(() => auditApi.search({ size: 5 }), [])
  useAutoRefresh(() => recent.reload({ silent: true }))
  const entries = recent.data?.content

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Recent activity</CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/audit">Audit log</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {recent.error ? (
          <ErrorAlert error={recent.error} title="Couldn’t load activity" onRetry={recent.reload} />
        ) : !entries ? (
          <Skeleton className="h-32 w-full" />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((e) => (
              <Entry key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
