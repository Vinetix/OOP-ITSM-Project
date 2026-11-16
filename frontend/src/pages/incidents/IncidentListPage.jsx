// Incident list for every role: employees see what they reported, technicians
// their assignments, admins everything (the server decides). Search, filters,
// sort and page all live in the URL, so a search survives refresh and can be shared.
import { useEffect } from 'react'
import { FilePlus, Inbox, RefreshCw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { incidentsApi } from '@/api/incidentsApi'
import { useAuth } from '@/auth/AuthContext'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { IncidentFilters } from '@/components/incidents/IncidentFilters'
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
import { SORTS } from '@/config/incidents'
import { getRoleHome } from '@/config/roles'
import { useAsync } from '@/hooks/useAsync'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { getErrorMessage, getErrorStatus } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { FILTER_KEYS, countActive, parseFilters, toApiParams, toParam } from './incidentFilters'

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

export default function IncidentListPage() {
  const { user } = useAuth()
  const view = ROLE_VIEWS[user.role]
  const isAdmin = user.role === 'ADMIN'
  const basePath = `${getRoleHome(user.role)}/incidents`
  const [params, setParams] = useSearchParams()

  const filters = parseFilters(params)
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
          const v = FILTER_KEYS.includes(key) ? toParam(key, value) : value
          const isDefault =
            v === '' ||
            (key === 'sort' && v === view.defaultSort) ||
            (key === 'page' && v === 0) ||
            (key === 'size' && v === 20)
          if (isDefault) next.delete(key)
          else next.set(key, String(v))
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  function clearAll() {
    update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])))
  }

  const list = useAsync(
    () => incidentsApi.list({ ...toApiParams(filters), sort, page, size }),
    [params.toString(), sort, page, size],
  )
  useAutoRefresh(() => list.reload({ silent: true }))

  // a sort the server doesn't know falls back to the default instead of breaking
  useEffect(() => {
    if (list.error && getErrorStatus(list.error) === 400 && sort !== view.defaultSort) {
      toast.error('That sort isn’t available, showing the default order')
      update({ sort: view.defaultSort })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.error])

  const filtering = countActive(filters) > 0 || Boolean(filters.q)
  const incidents = list.data?.content
  const presetStatus = filters.status.join(',')

  return (
    <>
      <PageHeader
        title={view.title}
        description={view.description}
        actions={
          <>
            {/* countdowns tick by themselves; this re-reads statuses and escalations */}
            <Button
              variant="outline"
              size="lg"
              className="h-10"
              onClick={() => list.reload()}
              disabled={list.loading}
            >
              <RefreshCw aria-hidden="true" className={list.loading ? 'animate-spin' : undefined} />
              Refresh
            </Button>
            {user.role === 'EMPLOYEE' && (
              <Button asChild size="lg" className="h-10">
                <Link to="/employee/incidents/new">
                  <FilePlus aria-hidden="true" />
                  Report incident
                </Link>
              </Button>
            )}
          </>
        }
      />

      {view.chips && (
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Quick filters">
          {view.chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              aria-pressed={presetStatus === chip.status}
              onClick={() => update({ status: chip.status ? chip.status.split(',') : [] })}
              className={cn(
                'rounded-full border px-3 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                presetStatus === chip.status
                  ? 'border-role bg-role text-primary-foreground'
                  : 'border-border bg-card hover:bg-accent',
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <IncidentFilters
            filters={filters}
            onChange={update}
            onClearAll={clearAll}
            isAdmin={isAdmin}
            resultCount={list.data?.totalElements}
          />
        </div>
        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-9 w-56 bg-popover" aria-label="Sort by">
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
      </div>

      {list.error && !(getErrorStatus(list.error) === 400 && sort !== view.defaultSort) ? (
        <ErrorAlert error={list.error} title={getErrorMessage(list.error)} onRetry={list.reload} />
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
                title={filtering ? 'No incidents match these filters' : view.empty}
                action={
                  filtering ? (
                    <Button variant="outline" onClick={clearAll}>
                      Clear filters
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
