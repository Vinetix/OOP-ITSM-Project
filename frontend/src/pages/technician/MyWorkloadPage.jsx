// A technician's own workload: how full they are, their availability, and the
// incidents they're working on, most urgent first.
import { workloadApi } from '@/api/workloadApi'
import { StatusBreakdown } from '@/components/assignment/StatusBreakdown'
import { WorkloadBar } from '@/components/assignment/WorkloadBar'
import { AvailabilityCard } from '@/components/AvailabilityCard'
import { ErrorAlert } from '@/components/ErrorAlert'
import { RecentIncidents } from '@/components/incidents/RecentIncidents'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

const ACTIVE = 'ASSIGNED,ACKNOWLEDGED,IN_PROGRESS,AWAITING_INFO'

export default function MyWorkloadPage() {
  const mine = useAsync(() => workloadApi.getMine(), [])
  useAutoRefresh(() => mine.reload({ silent: true }))
  const w = mine.data
  const free = w ? Math.max(w.maxActiveIncidents - w.activeIncidents, 0) : 0

  return (
    <>
      <PageHeader
        title="My workload"
        description="What’s on your plate, and whether you can take more."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {mine.error ? (
          <ErrorAlert
            error={mine.error}
            title="Couldn’t load your workload"
            onRetry={mine.reload}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Current load</CardTitle>
              <CardDescription>
                Assigned, acknowledged, in progress or awaiting info.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {w ? (
                <>
                  <WorkloadBar workload={w} size="lg" />
                  <StatusBreakdown byStatus={w.byStatus} />
                  <p className="font-semibold">
                    {!w.available
                      ? 'You’re unavailable, so no new incidents will come to you.'
                      : free > 0
                        ? `You can take ${free} more.`
                        : 'You’re at your limit.'}
                  </p>
                </>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </CardContent>
          </Card>
        )}
        <AvailabilityCard onChanged={() => mine.reload({ silent: true })} />
        <RecentIncidents
          className="lg:col-span-2"
          title="My active incidents"
          description="Most urgent deadline first."
          listPath="/technician/incidents"
          status={ACTIVE}
          size={20}
          sort="sla.resolutionDueAt,asc"
          columns={['number', 'title', 'priority', 'status', 'reporter', 'sla']}
          rowTag={(i) => (i.status === 'ASSIGNED' ? 'Needs acknowledgement' : null)}
          empty="You have no active incidents."
        />
      </div>
    </>
  )
}
