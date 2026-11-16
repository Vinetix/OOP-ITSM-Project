// Home page SLA cards. "Needs attention" for technicians; "SLA health" and
// "Escalated now" for admins. All read the open incidents once (the server
// already limits a technician to their own) and filter in the browser.
import { AlarmClockOff, ShieldCheck, Siren } from 'lucide-react'
import { Link } from 'react-router'
import { incidentsApi } from '@/api/incidentsApi'
import { slaMonitorApi } from '@/api/slaMonitorApi'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Lamp } from '@/components/Lamp'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { nextDeadline } from '@/lib/sla'
import { IncidentTable } from './IncidentTable'

const ACTIVE = 'ASSIGNED,ACKNOWLEDGED,IN_PROGRESS,AWAITING_INFO'
const OPEN = `CLASSIFIED,${ACTIVE}`

const inTrouble = (i) => ['AT_RISK', 'BREACHED'].includes(i.slaStatus) || i.escalationLevel > 0
const dueTime = (i) => new Date(nextDeadline(i)?.dueAt ?? 8.64e15).getTime()

function useOpenIncidents(status) {
  const list = useAsync(
    () => incidentsApi.list({ status, size: 100, sort: 'sla.resolutionDueAt,asc' }),
    [status],
  )
  useAutoRefresh(() => list.reload({ silent: true }), { intervalMs: 60_000 })
  return list
}

function ListCard({ title, description, icon, empty, list, rows, basePath, columns, className }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to={basePath}>View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      {list.error ? (
        <CardContent>
          <ErrorAlert error={list.error} title="Couldn’t load incidents" onRetry={list.reload} />
        </CardContent>
      ) : !list.data ? (
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      ) : rows.length === 0 ? (
        <CardContent>
          <EmptyState icon={ShieldCheck} title={empty} />
        </CardContent>
      ) : (
        <div className="border-t border-border">
          <IncidentTable incidents={rows} loading={false} columns={columns} basePath={basePath} />
        </div>
      )}
    </Card>
  )
}

export function NeedsAttentionCard({ className }) {
  const list = useOpenIncidents(ACTIVE)
  const rows = (list.data?.content ?? []).filter(inTrouble).sort((a, b) => dueTime(a) - dueTime(b))
  return (
    <ListCard
      className={className}
      title="Needs attention"
      description="At risk, breached or escalated: soonest deadline first."
      icon={<Lamp tone={rows.length ? 'stop' : 'go'} />}
      empty="Nothing at risk. Nice."
      list={list}
      rows={rows}
      basePath="/technician/incidents"
      columns={['number', 'title', 'priority', 'status', 'sla']}
    />
  )
}

export function AdminSlaCards() {
  const list = useOpenIncidents(OPEN)
  const violations = useAsync(
    () => slaMonitorApi.violations({ size: 1 }).then((p) => p.totalElements),
    [],
  )
  const open = list.data?.content ?? []
  const escalated = open
    .filter((i) => i.escalationLevel > 0)
    .sort((a, b) => b.escalationLevel - a.escalationLevel)
  const health = [
    {
      label: 'At risk',
      value: open.filter((i) => i.slaStatus === 'AT_RISK').length,
      tone: 'caution',
    },
    {
      label: 'Breached',
      value: open.filter((i) => i.slaStatus === 'BREACHED').length,
      tone: 'stop',
    },
    { label: 'Violations so far', value: violations.data, tone: 'off' },
  ]

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <AlarmClockOff aria-hidden="true" className="size-4" />
            SLA health
          </CardTitle>
          <CardDescription>Open incidents right now, and every missed deadline.</CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/sla">Violations</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {list.error ? (
            <ErrorAlert error={list.error} title="Couldn’t load incidents" onRetry={list.reload} />
          ) : (
            <dl className="grid grid-cols-3 gap-3">
              {health.map((h) => (
                <div
                  key={h.label}
                  className="grid gap-1 rounded-lg border border-border bg-popover p-3"
                >
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lamp tone={h.tone} />
                    {h.label}
                  </dt>
                  <dd className="text-2xl leading-none font-extrabold tabular-nums">
                    {list.data && h.value !== undefined ? h.value : '…'}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>
      <ListCard
        title="Escalated now"
        description="Open incidents that were escalated, highest level first."
        icon={<Siren aria-hidden="true" className="size-4" />}
        empty="Nothing escalated."
        list={list}
        rows={escalated}
        basePath="/admin/incidents"
        columns={['number', 'title', 'priority', 'status', 'technician', 'sla']}
      />
    </div>
  )
}
