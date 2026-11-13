// Pick a technician. Only available technicians are listed; those with a skill
// in the incident's category are marked "Skill match" and come first.
import { useState } from 'react'
import { usersApi } from '@/api/usersApi'
import { incidentsApi } from '@/api/incidentsApi'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { SkillChips } from '@/components/SkillChips'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

export function AssignDialog({ open, onOpenChange, incident, onDone, onError }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      {(dialog) => <AssignForm incident={incident} onDone={onDone} onError={onError} {...dialog} />}
    </FormDialog>
  )
}

function AssignForm({ incident, onDone, onError, busy, setBusy, close }) {
  const technicians = useAsync(() => usersApi.listTechnicians({ availableOnly: true }), [])
  const [selected, setSelected] = useState(null)
  const [formError, setFormError] = useState(null)
  const current = incident.assignedTechnician
  const code = incident.category?.code

  const matches = (t) => (t.skills ?? []).some((s) => s.categoryCode === code)
  const ranked = [...(technicians.data ?? [])].sort(
    (a, b) =>
      Number(matches(b)) - Number(matches(a)) ||
      Number(Boolean(b.senior)) - Number(Boolean(a.senior)) ||
      a.fullName.localeCompare(b.fullName),
  )
  const currentListed = current && ranked.some((t) => t.id === current.id)

  async function assign() {
    if (!selected) return setFormError('Choose a technician')
    setBusy(true)
    try {
      const updated = await incidentsApi.assign(incident.id, selected.id)
      onDone(updated, `Assigned to ${selected.fullName}`)
      close()
    } catch (error) {
      // unavailable, at their limit, or already assigned: say so here and stay open
      if (onError(error)) close()
      else setFormError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {current ? 'Re-assign' : 'Assign'} {incident.number}
        </DialogTitle>
        <DialogDescription>
          Available technicians only. Those with a skill in{' '}
          {incident.category?.name ?? 'this category'} come first.
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={formError} />

      {current && !currentListed && technicians.data && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          Currently assigned to <span className="font-semibold">{current.fullName}</span>, who isn’t
          available for new work.
        </p>
      )}

      {technicians.error ? (
        <ErrorAlert
          error={technicians.error}
          title="Couldn’t load technicians"
          onRetry={technicians.reload}
        />
      ) : !technicians.data ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : ranked.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input p-4 text-sm text-muted-foreground">
          No technician is available right now.
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-label="Technician"
          className="grid max-h-[50svh] gap-2 overflow-y-auto pr-1"
        >
          {ranked.map((t) => {
            const isCurrent = current?.id === t.id
            const isSelected = selected?.id === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isCurrent}
                onClick={() => {
                  setSelected(t)
                  setFormError(null)
                }}
                className={cn(
                  'grid gap-2 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isSelected
                    ? 'border-role bg-role-soft'
                    : 'border-input bg-popover hover:bg-accent',
                  isCurrent && 'cursor-not-allowed opacity-60 hover:bg-popover',
                )}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{t.fullName}</span>
                  {matches(t) && (
                    <span className="rounded-sm bg-lamp-go/15 px-1.5 py-0.5 text-xs font-semibold text-[color:color-mix(in_oklab,var(--lamp-go)_75%,black)]">
                      Skill match
                    </span>
                  )}
                  {t.senior && (
                    <span className="rounded-sm border border-technician/30 px-1.5 py-0.5 text-xs font-semibold text-technician">
                      Senior
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-xs text-muted-foreground">Current assignee</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t.experienceYears ?? 0} yrs · max {t.maxActiveIncidents} active
                  </span>
                </span>
                {/* every skill, no "+N more": that's a button, and this card is one already */}
                <SkillChips skills={t.skills} />
              </button>
            )
          })}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        <Button onClick={assign} disabled={busy || !technicians.data}>
          {busy
            ? 'Assigning…'
            : selected
              ? `Assign to ${selected.fullName.split(' ')[0]}`
              : 'Assign'}
        </Button>
      </DialogFooter>
    </div>
  )
}
