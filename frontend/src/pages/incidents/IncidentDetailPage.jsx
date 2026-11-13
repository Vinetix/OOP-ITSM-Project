// One incident, for whoever may see it: reporter, assigned technician or admin.
// The buttons come from the server's allowedActions; every action returns the
// updated incident, which simply replaces what's on screen.
import { useState } from 'react'
import { ArrowLeft, FileSearch, Pencil } from 'lucide-react'
import { toast } from 'sonner'
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
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getErrorCode, getErrorMessage, getErrorStatus } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { ActionBar } from './detail/ActionBar'
import { ActionDialog } from './detail/ActionDialog'
import { ACTIONS } from './detail/actions'
import { AssignDialog } from './detail/AssignDialog'
import { AutoAssignDialog } from './detail/AutoAssignDialog'
import { EditIncidentDialog } from './detail/EditIncidentDialog'
import { IncidentBanners } from './detail/IncidentBanners'
import { DetailsCard, PriorityCard, SlaCard } from './detail/IncidentSideCards'
import { NoteBox } from './detail/NoteBox'

// errors that mean "this incident has changed under you": say so and reload it
const RELOAD_CODES = new Set([
  'INVALID_STATE_TRANSITION',
  'INCIDENT_NOT_EDITABLE',
  'CONCURRENT_MODIFICATION',
  'UNAUTHORIZED_OPERATION',
])

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
  const { data: incident, error, reload, setData } = useAsync(() => incidentsApi.get(id), [id])
  // which dialog is open; the name stays while it fades out
  const [dialog, setDialog] = useState({ open: false, name: null })
  // someone else may move the incident on; look again quietly, but not mid-dialog
  useAutoRefresh(() => reload({ silent: true }), { enabled: !dialog.open && !error })
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
  const openAction = (name) => setDialog({ open: true, name })
  const closeDialog = (open) => setDialog((d) => ({ ...d, open }))

  function applyUpdate(updated, message) {
    setData(updated)
    toast.success(message)
  }

  // returns true when handled here (toast and reload), false to let the dialog show it
  function handleActionError(err) {
    if (!RELOAD_CODES.has(getErrorCode(err))) return false
    toast.error(getErrorMessage(err))
    reload()
    return true
  }

  const custom = dialog.name === 'EDIT' || ACTIONS[dialog.name]?.custom
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
          <IncidentBanners incident={i} user={user} onAction={openAction} />

          <Card>
            <CardContent className="grid gap-6">
              <LifecycleStepper status={i.status} />
              <ActionBar incident={i} onAction={openAction} />
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
            {i.canAddNote && (
              <NoteBox
                incident={i}
                role={user.role}
                onDone={applyUpdate}
                onError={handleActionError}
              />
            )}
          </TextCard>
        </div>

        <div className="grid gap-6">
          <SlaCard sla={i.sla} />
          <PriorityCard incident={i} />
          <DetailsCard
            incident={i}
            action={
              i.canEdit && (
                <Button variant="outline" size="sm" onClick={() => openAction('EDIT')}>
                  <Pencil aria-hidden="true" />
                  Edit details
                </Button>
              )
            }
          />
        </div>
      </div>

      <ActionDialog
        action={custom ? null : dialog.name}
        open={dialog.open && !custom}
        onOpenChange={closeDialog}
        incident={i}
        onDone={applyUpdate}
        onError={handleActionError}
      />
      <AutoAssignDialog
        open={dialog.open && dialog.name === 'AUTO_ASSIGN'}
        onOpenChange={closeDialog}
        incident={i}
        onDone={applyUpdate}
        onError={handleActionError}
        onChooseManually={() => openAction('ASSIGN')}
      />
      <AssignDialog
        open={dialog.open && dialog.name === 'ASSIGN'}
        onOpenChange={closeDialog}
        incident={i}
        onDone={applyUpdate}
        onError={handleActionError}
      />
      <EditIncidentDialog
        open={dialog.open && dialog.name === 'EDIT'}
        onOpenChange={closeDialog}
        incident={i}
        onDone={applyUpdate}
        onError={handleActionError}
      />
    </>
  )
}
