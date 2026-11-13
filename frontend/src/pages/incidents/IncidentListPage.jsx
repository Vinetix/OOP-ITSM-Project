// Incident list for every role: employees see what they reported, technicians
// their queue, admins everything (the server decides). Status, sort and page
// live in the URL, so refresh and shared links keep them.
import { useEffect } from 'react'
import { FilePlus, Inbox } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { incidentsApi } from '@/api/incidentsApi'
import { useAuth } from '@/auth/AuthContext'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { IncidentTable } from '@/components/incidents/IncidentTable'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SORTS, STATUSES } from '@/config/incidents'
import { getRoleHome } from '@/config/roles'
import { useAsync } from '@/hooks/useAsync'
import { getErrorStatus } from '@/lib/errors'
import { cn } from '@/lib/utils'

const ALL = 'ALL'
const PAGE_SIZES = [10, 20, 50]

const ROLE_VIEWS = {
  EMPLOYEE: {
    title: 'My incidents',
    description: 'Everything you’ve reported, newest first.',
    columns: [
      'number',
      'title',
      'priority',
      'status',
      'service',
      'category',
      'technician',
      'created',
      'sla',
    ],
    defaultSort: 'createdAt,desc',
    rowTag: (i) => (['AWAITING_INFO', 'RESOLVED'].includes(i.status) ? 'Action needed' : null),
    empty: 'You haven’t reported any incidents yet.',
  },
  TECHNICIAN: {
    title: 'My queue',
    description: 'Incidents assigned to you, most urgent deadline first.',
    columns: [
      'number',
      'title',
      'priority',
      'status',
      'service',
      'category',
      'reporter',
      'created',
      'sla',
    ],
    defaultSort: 'sla.resolutionDueAt,asc',
    rowTag: (i) => (i.status === 'ASSIGNED' ? 'Needs acknowledgement' : null),
    empty: 'Nothing is assigned to you right now.',
  },
  ADMIN: {
    title: 'All incidents',
    description: 'Every incident in the organisation.',
    columns: [
      'number',
      'title',
      'priority',
      'status',
      'service',
      'category',
      'reporter',
      'technician',
      'created',
      'sla',
    ],
    defaultSort: 'createdAt,desc',
    rowTag: () => null,
    empty: 'No incidents have been reported yet.',
    chips: [
      { label: 'All', status: '' },
      { label: 'Unassigned', status: 'CLASSIFIED' },
      { label: 'In progress', status: 'ACKNOWLEDGED,IN_PROGRESS' },
      { label: 'Awaiting info', status: 'AWAITING_INFO' },
      { label: 'Resolved', status: 'RESOLVED' },
    ],
  },
}

// "ACKNOWLEDGED,IN_PROGRESS" is fine; anything unknown is dropped
function cleanStatus(raw) {
  const parts = (raw ?? '').split(',').filter((s) => STATUSES[s])
  return parts.join(',')
}

export default function IncidentListPage() {
  const { user } = useAuth()
  const view = ROLE_VIEWS[user.role]
  const basePath = `${getRoleHome(user.role)}/incidents`
  const [params, setParams] = useSearchParams()

  const status = cleanStatus(params.get('status'))
  const sort = SORTS.some((s) => s.value === params.get('sort'))
    ? params.get('sort')
    : view.defaultSort
  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0)
  const size = PAGE_SIZES.includes(Number(params.get('size'))) ? Number(params.get('size')) : 20

  // any filter change goes back to page 1; default values stay out of the URL
  function update(changes) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          const isDefault =
            value === '' ||
            value === ALL ||
            (key === 'sort' && value === view.defaultSort) ||
            (key === 'page' && value === 0) ||
            (key === 'size' && value === 20)
          if (isDefault) next.delete(key)
          else next.set(key, String(value))
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const list = useAsync(
    () => incidentsApi.list({ status: status || undefined, sort, page, size }),
    [status, sort, page, size],
  )

  // if the server ever rejects a sort, fall back to the default instead of breaking
  useEffect(() => {
    if (list.error && getErrorStatus(list.error) === 400 && sort !== view.defaultSort) {
      toast.error('That sort isn’t available, showing the default order')
      update({ sort: view.defaultSort })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.error])

  const statusOptions = Object.entries(STATUSES).filter(([key]) => key !== 'NEW')
  const combined = status.includes(',') // a quick-filter chip such as "In progress"
  const filtering = status !== ''
  const incidents = list.data?.content

  return (
    <>
      <PageHeader
        title={view.title}
        description={view.description}
        actions={
          user.role === 'EMPLOYEE' && (
            <Button asChild size="lg" className="h-10">
              <Link to="/employee/incidents/new">
                <FilePlus aria-hidden="true" />
                Report incident
              </Link>
            </Button>
          )
        }
      />

      {view.chips && (
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Quick filters">
          {view.chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              aria-pressed={status === chip.status}
              onClick={() => update({ status: chip.status })}
              className={cn(
                'rounded-full border px-3 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                status === chip.status
                  ? 'border-role bg-role text-primary-foreground'
                  : 'border-border bg-card hover:bg-accent',
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={status || ALL} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="h-9 w-56 bg-popover" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {combined && (
              <SelectItem value={status}>
                {status
                  .split(',')
                  .map((s) => STATUSES[s].label)
                  .join(' or ')}
              </SelectItem>
            )}
            {statusOptions.map(([key, s]) => (
              <SelectItem key={key} value={key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-9 w-60 bg-popover" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtering && (
          <Button variant="ghost" className="h-9" onClick={() => update({ status: '' })}>
            Clear filter
          </Button>
        )}
      </div>

      {list.error && getErrorStatus(list.error) !== 400 ? (
        <ErrorAlert error={list.error} title="Couldn’t load incidents" onRetry={list.reload} />
      ) : (
        <Card className="gap-0 py-0">
          <IncidentTable
            incidents={incidents}
            loading={list.loading}
            columns={view.columns}
            basePath={basePath}
            rowTag={view.rowTag}
          />
          {list.data && incidents.length === 0 && (
            <div className="p-5">
              <EmptyState
                icon={Inbox}
                title={filtering ? 'No incidents match this filter' : view.empty}
                description={filtering ? 'Try another status, or clear the filter.' : undefined}
                action={
                  filtering ? (
                    <Button variant="outline" onClick={() => update({ status: '' })}>
                      Clear filter
                    </Button>
                  ) : (
                    user.role === 'EMPLOYEE' && (
                      <Button asChild variant="outline">
                        <Link to="/employee/incidents/new">Report an incident</Link>
                      </Button>
                    )
                  )
                }
              />
            </div>
          )}
          {list.data && list.data.totalElements > 0 && (
            <div className="border-t border-border px-5 py-3">
              <Pagination
                page={page}
                totalPages={list.data.totalPages}
                totalElements={list.data.totalElements}
                size={size}
                sizes={PAGE_SIZES}
                itemLabel={list.data.totalElements === 1 ? 'incident' : 'incidents'}
                disabled={list.loading}
                onPageChange={(next) => update({ page: next })}
                onSizeChange={(next) => update({ size: next })}
              />
            </div>
          )}
        </Card>
      )}
    </>
  )
}
