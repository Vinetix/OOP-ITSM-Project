// Confirm, then let the active strategy pick a technician. If nobody fits, the
// server says why, and the admin can switch to choosing manually.
import { useState } from 'react'
import { WandSparkles } from 'lucide-react'
import { assignmentApi } from '@/api/assignmentApi'
import { incidentsApi } from '@/api/incidentsApi'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { strategyLabel } from '@/config/assignment'
import { useAsync } from '@/hooks/useAsync'
import { getErrorCode, getErrorMessage } from '@/lib/errors'

export function AutoAssignDialog({ open, onOpenChange, ...props }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      {(dialog) => <AutoAssignForm {...props} {...dialog} />}
    </FormDialog>
  )
}

function AutoAssignForm({ incident, onDone, onError, onChooseManually, busy, setBusy, close }) {
  // only for the wording; if it fails we just say "the active strategy"
  const settings = useAsync(() => assignmentApi.getSettings(), [])
  const strategy = settings.data
    ? `the ${strategyLabel(settings.data.activeStrategy)} strategy`
    : 'the active strategy'
  const [noOne, setNoOne] = useState(null) // the server's "nobody fits" message
  const [error, setError] = useState(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const updated = await incidentsApi.autoAssign(incident.id)
      onDone(updated, `Assigned to ${updated.assignedTechnician?.fullName ?? 'a technician'}`)
      close()
    } catch (err) {
      if (getErrorCode(err) === 'NO_ELIGIBLE_TECHNICIAN') setNoOne(getErrorMessage(err))
      else if (onError(err)) close()
      else setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Auto-assign {incident.number}</DialogTitle>
        <DialogDescription>
          {incident.assignedTechnician
            ? `Let ${strategy} choose someone other than ${incident.assignedTechnician.fullName}?`
            : `Let ${strategy} choose a technician?`}
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={error} />
      {noOne && (
        <div
          role="alert"
          className="grid gap-2 rounded-lg border border-lamp-caution/40 bg-lamp-caution/5 p-4 text-sm"
        >
          <p className="font-semibold">No technician fits right now</p>
          <p className="text-muted-foreground">{noOne}</p>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        {noOne ? (
          <Button onClick={onChooseManually}>Choose manually</Button>
        ) : (
          <Button onClick={run} disabled={busy}>
            <WandSparkles aria-hidden="true" />
            {busy ? 'Assigning…' : 'Auto-assign'}
          </Button>
        )}
      </DialogFooter>
    </div>
  )
}
