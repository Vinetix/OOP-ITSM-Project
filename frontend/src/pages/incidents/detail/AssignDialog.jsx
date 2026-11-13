// Assign from a ranked list. The server ranks the technicians who can take the
// incident (any strategy can be previewed) and says why; the admin picks one.
import { useState } from 'react'
import { UserSearch } from 'lucide-react'
import { assignmentApi } from '@/api/assignmentApi'
import { incidentsApi } from '@/api/incidentsApi'
import { CandidateCard } from '@/components/assignment/CandidateCard'
import { CategoryCode } from '@/components/CategoryCode'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { PriorityBadge } from '@/components/PriorityBadge'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { strategyLabel } from '@/config/assignment'
import { useAsync } from '@/hooks/useAsync'
import { getErrorCode, getErrorMessage } from '@/lib/errors'

// the numbers have moved under us: show why, keep the dialog open, rank again
const RECHECK = new Set([
  'TECHNICIAN_UNAVAILABLE',
  'TECHNICIAN_WORKLOAD_EXCEEDED',
  'BUSINESS_RULE_VIOLATION',
])

export function AssignDialog({ open, onOpenChange, incident, onDone, onError }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-2xl">
      {(dialog) => <AssignForm incident={incident} onDone={onDone} onError={onError} {...dialog} />}
    </FormDialog>
  )
}

function AssignForm({ incident, onDone, onError, busy, setBusy, close }) {
  const settings = useAsync(() => assignmentApi.getSettings().catch(() => null), [])
  const [strategy, setStrategy] = useState('') // '' = the active one
  const recs = useAsync(
    () => incidentsApi.recommendations(incident.id, strategy),
    [incident.id, strategy],
  )
  const [error, setError] = useState(null)

  const active =
    settings.data?.activeStrategy ?? (recs.data?.activeStrategy ? recs.data.strategy : null)
  // what the dropdown shows: the choice, else the active one (known from settings or the ranking)
  const shown = strategy || active || recs.data?.strategy || ''
  const options = (
    settings.data?.strategies ?? (active ? [{ name: active, active: true }] : [])
  ).map((s) => ({
    value: s.name,
    label: `${strategyLabel(s.name)}${s.name === active ? ' (active)' : ''}`,
  }))

  async function assign(candidate) {
    setBusy(true)
    setError(null)
    try {
      const updated = await incidentsApi.assign(incident.id, candidate.technicianId)
      onDone(updated, `Assigned to ${candidate.fullName}`)
      close()
    } catch (err) {
      if (RECHECK.has(getErrorCode(err))) {
        setError(getErrorMessage(err))
        recs.reload()
      } else if (onError(err)) close()
      else setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const data = recs.data
  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {incident.assignedTechnician ? 'Re-assign' : 'Assign'} {incident.number}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={incident.priority} />
            {incident.category && <CategoryCode code={incident.category.code} />}
            <span>{incident.service?.name}</span>
            {incident.assignedTechnician && (
              <span>· now with {incident.assignedTechnician.fullName}</span>
            )}
          </div>
        </DialogDescription>
      </DialogHeader>

      {options.length > 0 && (
        <div className="grid gap-1.5">
          <SelectField
            id="strategy"
            label="Rank by"
            value={shown}
            onChange={(v) => setStrategy(v === active ? '' : v)}
            options={options}
          />
          {data && !data.activeStrategy && active && (
            <p className="text-sm text-[color:color-mix(in_oklab,var(--lamp-caution)_70%,black)]">
              Preview only: auto-assign uses {strategyLabel(active)}.
            </p>
          )}
        </div>
      )}

      <FormAlert message={error} />

      {recs.error ? (
        <ErrorAlert
          error={recs.error}
          title="Couldn’t load recommendations"
          onRetry={recs.reload}
        />
      ) : !data || (recs.loading && data.strategy !== shown) ? (
        <div className="grid gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          {data.candidates.length === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="Nobody fits this strategy"
              description={data.message}
            />
          ) : (
            <ol className={recs.loading ? 'grid gap-3 opacity-60' : 'grid gap-3'}>
              {data.candidates.map((c, n) => (
                <li key={c.technicianId}>
                  <CandidateCard candidate={c} rank={n + 1} onAssign={assign} busy={busy} />
                </li>
              ))}
            </ol>
          )}

          {data.unavailable?.length > 0 && (
            <details className="group rounded-lg border border-border bg-popover px-4 py-3 text-sm">
              <summary className="cursor-pointer font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Unavailable ({data.unavailable.length})
              </summary>
              <ul className="mt-2 grid gap-1 text-muted-foreground">
                {data.unavailable.map((u) => (
                  <li key={u.technicianId} className="flex flex-wrap justify-between gap-x-3">
                    <span className="font-medium">{u.fullName}</span>
                    <span>{u.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Close
        </Button>
      </DialogFooter>
    </div>
  )
}
