// Admin dashboard card: SLA compliance and incident total for the last 14 days,
// linking to the full reports.
import { Link } from 'react-router'
import { reportsApi } from '@/api/reportsApi'
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
import { daysAgo, localIsoDate } from '@/lib/dates'
import { complianceTone, percent } from '@/pages/admin/reports/reportBits'

export function ReportsSummaryCard({ className }) {
  const overview = useAsync(
    () => reportsApi.overview({ from: daysAgo(13), to: localIsoDate() }),
    [],
  )
  const o = overview.data
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Reports</CardTitle>
        <CardDescription>The last 14 days at a glance.</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/reports">Open reports</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {overview.error ? (
          <ErrorAlert
            error={overview.error}
            title="Couldn’t load the report"
            onRetry={overview.reload}
          />
        ) : !o ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            <div className="grid gap-1 rounded-lg border border-border bg-popover p-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lamp tone={complianceTone(o.slaCompliancePercent)} />
                SLA compliance
              </dt>
              <dd className="text-2xl leading-none font-extrabold tabular-nums">
                {percent(o.slaCompliancePercent)}
              </dd>
            </div>
            <div className="grid gap-1 rounded-lg border border-border bg-popover p-3">
              <dt className="text-xs text-muted-foreground">Incidents</dt>
              <dd className="text-2xl leading-none font-extrabold tabular-nums">
                {o.totalIncidents}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
