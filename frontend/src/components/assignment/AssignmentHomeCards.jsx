// Home page cards for Phase F4: the admin's assignment set-up and team
// workload at a glance, and a technician's own load. Each links to its page.
import { Link } from 'react-router'
import { assignmentApi } from '@/api/assignmentApi'
import { workloadApi } from '@/api/workloadApi'
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
import { StrategyBadge } from './StrategyBadge'
import { WorkloadBar } from './WorkloadBar'

function OpenLink({ to, children }) {
  return (
    <CardAction>
      <Button asChild variant="outline" size="sm">
        <Link to={to}>{children}</Link>
      </Button>
    </CardAction>
  )
}

export function AssignmentCard({ className }) {
  const settings = useAsync(() => assignmentApi.getSettings(), [])
  const s = settings.data
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Assignment</CardTitle>
        <CardDescription>How new incidents find a technician.</CardDescription>
        <OpenLink to="/admin/assignment">Change</OpenLink>
      </CardHeader>
      <CardContent>
        {settings.error ? (
          <ErrorAlert
            error={settings.error}
            title="Couldn’t load the settings"
            onRetry={settings.reload}
          />
        ) : !s ? (
          <Skeleton className="h-14 w-full" />
        ) : (
          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Strategy</dt>
              <dd>
                <StrategyBadge name={s.activeStrategy} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Auto-assign on report</dt>
              <dd className="flex items-center gap-2 font-semibold">
                <Lamp tone={s.autoAssignOnReport ? 'go' : 'off'} />
                {s.autoAssignOnReport ? 'On' : 'Off'}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}

export function TeamWorkloadCard({ className }) {
  const workload = useAsync(() => workloadApi.getAll(), [])
  useAutoRefresh(() => workload.reload({ silent: true }))
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Workload</CardTitle>
        <CardDescription>Active incidents against each technician’s limit.</CardDescription>
        <OpenLink to="/admin/workload">Details</OpenLink>
      </CardHeader>
      <CardContent>
        {workload.error ? (
          <ErrorAlert
            error={workload.error}
            title="Couldn’t load workload"
            onRetry={workload.reload}
          />
        ) : !workload.data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <ul className="grid gap-3">
            {workload.data.map((w) => (
              <li
                key={w.technicianId}
                className="grid grid-cols-[minmax(7rem,10rem)_1fr] items-center gap-4"
              >
                <span className="truncate text-sm font-medium">{w.fullName}</span>
                <WorkloadBar workload={w} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function MyWorkloadCard({ className }) {
  const mine = useAsync(() => workloadApi.getMine(), [])
  useAutoRefresh(() => mine.reload({ silent: true }))
  const w = mine.data
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">My workload</CardTitle>
        <CardDescription>
          {w
            ? `${w.activeIncidents} of ${w.maxActiveIncidents} active incidents`
            : 'Your active incidents'}
        </CardDescription>
        <OpenLink to="/technician/workload">Details</OpenLink>
      </CardHeader>
      <CardContent>
        {mine.error ? (
          <ErrorAlert
            error={mine.error}
            title="Couldn’t load your workload"
            onRetry={mine.reload}
          />
        ) : w ? (
          <WorkloadBar workload={w} size="lg" />
        ) : (
          <Skeleton className="h-8 w-full" />
        )}
      </CardContent>
    </Card>
  )
}
