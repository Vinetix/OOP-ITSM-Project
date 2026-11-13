// One incident, for whoever may see it: reporter, assigned technician or admin.
// Phase F3 Step 1: read-only. Step 2 adds the action bar, dialogs, edit and notes box.
import { ArrowLeft, FileSearch } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { incidentsApi } from '@/api/incidentsApi'
import { useAuth } from '@/auth/AuthContext'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { IncidentStatusBadge } from '@/components/incidents/IncidentStatusBadge'
import { LifecycleStepper } from '@/components/incidents/LifecycleStepper'
import { NotesTimeline } from '@/components/incidents/NotesTimeline'
import { SlaStatusBadge } from '@/components/incidents/SlaStatusBadge'
import { StarRating } from '@/components/incidents/StarRating'
import { LoadingState } from '@/components/LoadingState'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoleHome } from '@/config/roles'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getErrorStatus } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { DetailsCard, PriorityCard, SlaCard } from './detail/IncidentSideCards'

function TextCard({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-relaxed">{children}</CardContent>
    </Card>
  )
}

export default function IncidentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const listPath = `${getRoleHome(user.role)}/incidents`
  const { data: incident, error, reload } = useAsync(() => incidentsApi.get(id), [id])
  usePageTitle(incident ? `${incident.number} ${incident.title}` : 'Incident')

  const back = (
    <Button asChild variant="ghost" className="-ml-2 mb-3 h-8 text-muted-foreground">
      <Link to={listPath}>
        <ArrowLeft aria-hidden="true" />
        Back to{' '}
        {user.role === 'ADMIN'
          ? 'all incidents'
          : user.role === 'TECHNICIAN'
            ? 'my queue'
            : 'my incidents'}
      </Link>
    </Button>
  )

  if (error) {
    if (getErrorStatus(error) === 403) return <Navigate to="/forbidden" replace />
    if (getErrorStatus(error) === 404) {
      return (
        <>
          {back}
          <EmptyState
            icon={FileSearch}
            title="This incident doesn’t exist"
            description="It may have been typed wrongly, or the link is old."
            action={
              <Button asChild variant="outline">
                <Link to={listPath}>Go to the list</Link>
              </Button>
            }
          />
        </>
      )
    }
    return (
      <>
        {back}
        <ErrorAlert error={error} title="Couldn’t load this incident" onRetry={reload} />
      </>
    )
  }
  if (!incident) return <LoadingState label="Loading incident" />

  const i = incident
  return (
    <>
      {back}
      <header className="mb-6 grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-muted-foreground">{i.number}</span>
          <IncidentStatusBadge status={i.status} />
          <PriorityBadge priority={i.priority} />
          <SlaStatusBadge status={i.sla?.status} className="ml-1" />
        </div>
        <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
          {i.title}
        </h1>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <Card>
            <CardContent>
              <LifecycleStepper status={i.status} />
            </CardContent>
          </Card>

          <TextCard title="Description">
            <p className="whitespace-pre-wrap">{i.description}</p>
          </TextCard>

          {i.resolutionSummary && (
            <TextCard title="Resolution">
              <p className="whitespace-pre-wrap">{i.resolutionSummary}</p>
              {i.rootCause && (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Root cause: </span>
                  {i.rootCause}
                </p>
              )}
            </TextCard>
          )}

          {(i.feedbackRating || i.feedbackComment) && (
            <TextCard title="Reporter’s feedback">
              {i.feedbackRating && <StarRating value={i.feedbackRating} />}
              {i.feedbackComment && <p className="whitespace-pre-wrap">“{i.feedbackComment}”</p>}
              {i.verifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Confirmed {formatDateTime(i.verifiedAt)}
                </p>
              )}
            </TextCard>
          )}

          {i.closedAt && (
            <TextCard title="Closed">
              <p className="text-muted-foreground">{formatDateTime(i.closedAt)}</p>
              {i.closureNote && <p className="whitespace-pre-wrap">{i.closureNote}</p>}
            </TextCard>
          )}

          <TextCard title="Activity">
            <NotesTimeline notes={i.notes} />
          </TextCard>
        </div>

        <div className="grid gap-6">
          <SlaCard sla={i.sla} />
          <PriorityCard incident={i} />
          <DetailsCard incident={i} />
        </div>
      </div>
    </>
  )
}
