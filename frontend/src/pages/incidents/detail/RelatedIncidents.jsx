// Duplicates on the incident page. The banner says when this incident is a
// duplicate of another; the card lists its own duplicates and (for admins and
// the assigned technician) possible duplicates to link. The server enforces
// the rules; a refusal (422 or 403) is shown inside the card.
import { useState } from 'react'
import { ChevronDown, Link2, Unlink } from 'lucide-react'
import { incidentsApi } from '@/api/incidentsApi'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormAlert } from '@/components/FormAlert'
import { IncidentStatusBadge } from '@/components/incidents/IncidentStatusBadge'
import { IncidentNumber, SharedWords } from '@/components/incidents/SimilarIncidentsBox'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getRoleHome } from '@/config/roles'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'

export function canManageDuplicates(incident, user) {
  return (
    user.role === 'ADMIN' ||
    (user.role === 'TECHNICIAN' && incident.assignedTechnician?.id === user.id)
  )
}

// staff can open other incidents; employees usually can't (403), so plain text for them
const linkBase = (user) => (user.role === 'EMPLOYEE' ? null : `${getRoleHome(user.role)}/incidents`)

export function DuplicateOfBanner({ incident, user, onUpdated }) {
  const [confirm, setConfirm] = useState(false)
  const primary = incident.duplicateOf
  if (!primary) return null

  async function unlink() {
    try {
      onUpdated(await incidentsApi.unlinkDuplicate(incident.id), 'Duplicate link removed')
    } catch (error) {
      onUpdated(null, null, getErrorMessage(error)) // shown as an error toast by the page
    }
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-role/30 bg-role-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="grid gap-1 text-sm">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link2 aria-hidden="true" className="size-4 text-role" />
          <span className="font-semibold">This incident is a duplicate of</span>
          <IncidentNumber number={primary.number} id={primary.id} linkTo={linkBase(user)} />
          <span>· {primary.title}</span>
          <IncidentStatusBadge status={primary.status} />
        </p>
        {user.role === 'EMPLOYEE' && (
          <p className="text-muted-foreground">Updates will come through {primary.number}.</p>
        )}
      </div>
      {canManageDuplicates(incident, user) && (
        <>
          <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>
            <Unlink aria-hidden="true" />
            Unlink
          </Button>
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title={`Unlink from ${primary.number}?`}
            description="This incident will be handled on its own again, and its reporter is told."
            confirmLabel="Unlink"
            pendingLabel="Unlinking…"
            onConfirm={unlink}
          />
        </>
      )}
    </div>
  )
}

function PossibleDuplicates({ incident, onLink, busy }) {
  const similar = useAsync(() => incidentsApi.similar(incident.id), [incident.id])
  if (similar.error)
    return (
      <ErrorAlert
        error={similar.error}
        title="Couldn’t look for duplicates"
        onRetry={similar.reload}
      />
    )
  if (!similar.data) return <Skeleton className="h-20 w-full" />
  if (!similar.data.length)
    return (
      <p className="text-sm text-muted-foreground">No similar open incidents in the last 7 days.</p>
    )

  return (
    <ul className="grid gap-3">
      {similar.data.map((c) => {
        // a candidate that is itself a duplicate: offer its primary instead (if it's in the list)
        const primary =
          c.duplicateOfNumber && similar.data.find((x) => x.number === c.duplicateOfNumber)
        return (
          <li
            key={c.incidentId}
            className="grid gap-2 rounded-lg border border-border bg-popover p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <IncidentNumber number={c.number} id={c.incidentId} linkTo={incident.linkBase} />
              <span className="min-w-0 flex-1 font-medium">{c.title}</span>
              <IncidentStatusBadge status={c.status} />
              <span className="font-semibold tabular-nums">{c.score}% match</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {c.sameService && (
                <span className="rounded-sm bg-role-soft px-1.5 py-0.5 text-xs font-semibold">
                  Same service
                </span>
              )}
              {c.sameCategory && (
                <span className="rounded-sm bg-role-soft px-1.5 py-0.5 text-xs font-semibold">
                  Same category
                </span>
              )}
              <SharedWords words={c.sharedWords} />
            </div>
            {c.duplicateOfNumber ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Itself a duplicate of {c.duplicateOfNumber}.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !primary}
                  title={
                    primary
                      ? undefined
                      : `${c.duplicateOfNumber} isn’t in this list, open it to link`
                  }
                  onClick={() => onLink({ id: primary.incidentId, number: primary.number })}
                >
                  Link to {c.duplicateOfNumber} instead
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                disabled={busy}
                onClick={() => onLink({ id: c.incidentId, number: c.number })}
              >
                <Link2 aria-hidden="true" />
                Mark this incident as a duplicate of {c.number}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function RelatedIncidentsCard({ incident, user, onUpdated }) {
  const manage = canManageDuplicates(incident, user)
  const [open, setOpen] = useState(false)
  const [linking, setLinking] = useState(null) // { id, number } waiting for confirmation
  const [error, setError] = useState(null)
  const duplicates = incident.duplicates ?? []
  const showPossible = manage && !incident.duplicateOf && incident.status !== 'CLOSED'
  if (!duplicates.length && !showPossible) return null

  async function link() {
    setError(null)
    try {
      onUpdated(
        await incidentsApi.linkDuplicate(incident.id, linking.id),
        `Linked to ${linking.number}`,
      )
      setOpen(false)
    } catch (err) {
      setError(getErrorMessage(err)) // e.g. "INC00033 is itself a duplicate of INC00001…"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Related incidents</CardTitle>
        <CardDescription>Duplicates are handled through one primary incident.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <FormAlert message={error} />

        {duplicates.length > 0 && (
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold">
              Duplicates of this incident ({duplicates.length})
            </h3>
            <ul className="grid gap-2">
              {duplicates.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-popover px-3 py-2 text-sm"
                >
                  <IncidentNumber number={d.number} id={d.id} linkTo={linkBase(user)} />
                  <span className="min-w-0 flex-1">{d.title}</span>
                  <IncidentStatusBadge status={d.status} />
                  <PriorityBadge priority={d.priority} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {showPossible && (
          <section className="grid gap-3">
            <Button
              variant="ghost"
              className="w-fit px-0 font-semibold"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <ChevronDown
                aria-hidden="true"
                className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
              Possible duplicates
            </Button>
            {open && (
              <PossibleDuplicates
                incident={{ ...incident, linkBase: linkBase(user) }}
                onLink={setLinking}
                busy={Boolean(linking)}
              />
            )}
          </section>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(linking)}
        onOpenChange={(v) => !v && setLinking(null)}
        title={`Mark ${incident.number} as a duplicate of ${linking?.number ?? ''}?`}
        description={`Work continues on ${linking?.number ?? 'the primary incident'}, and this incident’s reporter is told which incident handles their problem.`}
        confirmLabel="Mark as duplicate"
        pendingLabel="Linking…"
        onConfirm={link}
      />
    </Card>
  )
}
