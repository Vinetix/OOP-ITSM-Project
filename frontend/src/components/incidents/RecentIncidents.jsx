// A short incident list in a card (the newest five, the most urgent, or one
// set of statuses), with a link to the full list. Used on the home pages.
import { Inbox } from 'lucide-react'
import { Link } from 'react-router'
import { incidentsApi } from '@/api/incidentsApi'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsync } from '@/hooks/useAsync'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { IncidentTable } from './IncidentTable'

export function RecentIncidents({
  title,
  status,
  size = 5,
  description,
  listPath,
  sort,
  columns,
  rowTag,
  empty,
  emptyAction,
  className,
}) {
  const list = useAsync(() => incidentsApi.list({ status, size, sort }), [status, size, sort])
  useAutoRefresh(() => list.reload({ silent: true }))
  const incidents = list.data?.content

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to={listPath}>View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      {list.error ? (
        <div className="px-6">
          <ErrorAlert error={list.error} title="Couldn’t load incidents" onRetry={list.reload} />
        </div>
      ) : incidents && incidents.length === 0 ? (
        <div className="px-6">
          <EmptyState icon={Inbox} title={empty} action={emptyAction} />
        </div>
      ) : (
        <div className="border-t border-border">
          <IncidentTable
            incidents={incidents}
            loading={list.loading}
            columns={columns}
            basePath={listPath}
            rowTag={rowTag}
            skeletonRows={3}
          />
        </div>
      )}
    </Card>
  )
}
