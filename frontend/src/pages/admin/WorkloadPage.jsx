// Every technician's active incidents against their limit, with who can take more.
import { useState } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { workloadApi } from '@/api/workloadApi'
import { StatusBreakdown } from '@/components/assignment/StatusBreakdown'
import { WorkloadBar } from '@/components/assignment/WorkloadBar'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Lamp } from '@/components/Lamp'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { availabilityOf } from '@/config/assignment'
import { useAsync } from '@/hooks/useAsync'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { cn } from '@/lib/utils'

export default function WorkloadPage() {
  const workload = useAsync(() => workloadApi.getAll(), [])
  useAutoRefresh(() => workload.reload({ silent: true }))
  const [sort, setSort] = useState('name')
  const rows = workload.data ?? []

  // the server sends them by name; "load" re-orders a copy, fullest first
  const shown = sort === 'load' ? [...rows].sort((a, b) => b.loadPercent - a.loadPercent) : rows
  const summary = [
    { label: 'Accepting work', value: rows.filter((w) => w.acceptingWork).length },
    { label: 'Active incidents', value: rows.reduce((n, w) => n + w.activeIncidents, 0) },
    {
      label: 'At their limit',
      value: rows.filter((w) => w.active && w.activeIncidents >= w.maxActiveIncidents).length,
    },
  ]

  return (
    <>
      <PageHeader
        title="Technician workload"
        description="Active incidents (assigned, acknowledged, in progress or awaiting info) against each technician’s limit."
        actions={
          <Button
            variant="outline"
            className="h-10"
            onClick={() => workload.reload()}
            disabled={workload.loading}
          >
            <RefreshCw aria-hidden="true" className={cn(workload.loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {workload.error ? (
        <ErrorAlert
          error={workload.error}
          title="Couldn’t load workload"
          onRetry={workload.reload}
        />
      ) : (
        <div className="grid gap-6">
          <ul
            aria-label="Summary"
            className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-foreground/10"
          >
            {summary.map((s) => (
              <li key={s.label} className="grid gap-1 bg-card p-4">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                {workload.data ? (
                  <span className="text-3xl leading-none font-extrabold tabular-nums">
                    {s.value}
                  </span>
                ) : (
                  <Skeleton className="h-8 w-10" />
                )}
              </li>
            ))}
          </ul>

          <div className="flex justify-end">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-48 bg-popover" aria-label="Sort technicians">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by name</SelectItem>
                <SelectItem value="load">Sort by load (fullest first)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="gap-0 py-0">
            {!workload.data ? (
              <div className="grid gap-3 p-5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Users}
                  title="No technicians yet"
                  description="Add technicians on the Users page."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {shown.map((w) => {
                  const availability = availabilityOf(w)
                  return (
                    <li
                      key={w.technicianId}
                      className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(10rem,1.2fr)_minmax(9rem,1fr)_minmax(0,1.6fr)_7rem] md:items-center md:gap-6"
                    >
                      <div className="grid gap-1">
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {w.fullName}
                          {w.senior && (
                            <span className="rounded-sm border border-technician/30 px-1.5 py-0.5 text-xs font-semibold text-technician">
                              Senior
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Lamp tone={availability.tone} />
                          {availability.label}
                        </span>
                      </div>
                      <WorkloadBar workload={w} />
                      <StatusBreakdown byStatus={w.byStatus} />
                      <span
                        className={cn(
                          'text-sm font-semibold md:text-right',
                          w.acceptingWork
                            ? 'text-[color:color-mix(in_oklab,var(--lamp-go)_75%,black)]'
                            : 'text-muted-foreground',
                        )}
                      >
                        {w.acceptingWork
                          ? 'Accepting work'
                          : w.active && w.available
                            ? 'Full'
                            : 'Not accepting'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
