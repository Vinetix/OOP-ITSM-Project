// Assignment settings: which strategy ranks technicians, and whether new
// incidents are assigned automatically. Changes wait until Save.
import { useState } from 'react'
import { toast } from 'sonner'
import { assignmentApi } from '@/api/assignmentApi'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormAlert } from '@/components/FormAlert'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SMART_FACTORS, strategyLabel } from '@/config/assignment'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { timeSince } from '@/lib/time'
import { cn } from '@/lib/utils'

export default function AssignmentSettingsPage() {
  const settings = useAsync(() => assignmentApi.getSettings(), [])

  return (
    <>
      <PageHeader
        title="Assignment"
        description="How the system chooses a technician for new incidents."
      />
      {settings.error ? (
        <ErrorAlert
          error={settings.error}
          title="Couldn’t load the settings"
          onRetry={settings.reload}
        />
      ) : !settings.data ? (
        <LoadingState label="Loading settings" />
      ) : (
        // keyed on updatedAt, so saved data resets the form to what the server holds
        <SettingsForm
          key={settings.data.updatedAt}
          saved={settings.data}
          onSaved={settings.setData}
        />
      )}
    </>
  )
}

function SettingsForm({ saved, onSaved }) {
  const [strategy, setStrategy] = useState(saved.activeStrategy)
  const [autoAssign, setAutoAssign] = useState(saved.autoAssignOnReport)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const changes = {}
  if (strategy !== saved.activeStrategy) changes.strategy = strategy
  if (autoAssign !== saved.autoAssignOnReport) changes.autoAssignOnReport = autoAssign
  const changed = Object.keys(changes).length > 0

  function discard() {
    setStrategy(saved.activeStrategy)
    setAutoAssign(saved.autoAssignOnReport)
    setError(null)
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      onSaved(await assignmentApi.updateSettings(changes))
      toast.success('Assignment settings saved')
    } catch (err) {
      setError(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Strategy</CardTitle>
          <CardDescription>
            Ranks the technicians who can take an incident. Auto-assign picks the one at the top.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <FormAlert message={error} />
          <fieldset className="grid gap-3">
            <legend className="sr-only">Assignment strategy</legend>
            {saved.strategies.map((s) => {
              const id = `strategy-${s.name}`
              const checked = strategy === s.name
              return (
                <label
                  key={s.name}
                  htmlFor={id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                    checked
                      ? 'border-role bg-role-soft'
                      : 'border-input bg-popover hover:bg-accent',
                  )}
                >
                  <input
                    id={id}
                    type="radio"
                    name="strategy"
                    value={s.name}
                    checked={checked}
                    onChange={() => setStrategy(s.name)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                      checked ? 'border-role' : 'border-input',
                    )}
                  >
                    {checked && <span className="size-2 rounded-full bg-role" />}
                  </span>
                  <span className="grid gap-1">
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {strategyLabel(s.name)}
                      {s.active && (
                        <span className="rounded-sm bg-lamp-go/15 px-1.5 py-0.5 text-xs font-semibold text-[color:color-mix(in_oklab,var(--lamp-go)_75%,black)]">
                          Active
                        </span>
                      )}
                      {checked && !s.active && (
                        <span className="rounded-sm bg-lamp-caution/15 px-1.5 py-0.5 text-xs font-semibold text-[color:color-mix(in_oklab,var(--lamp-caution)_70%,black)]">
                          Not saved
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">{s.description}</span>
                  </span>
                </label>
              )
            })}
          </fieldset>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-popover p-4">
            <div className="grid gap-1">
              <Label htmlFor="auto-assign" className="text-base font-semibold">
                Assign new incidents automatically
              </Label>
              <p className="text-sm text-muted-foreground">
                When off, new incidents wait in “Awaiting assignment” until an admin assigns them.
              </p>
            </div>
            <Switch id="auto-assign" checked={autoAssign} onCheckedChange={setAutoAssign} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" title={formatDateTime(saved.updatedAt)}>
              Last changed {timeSince(saved.updatedAt)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={discard} disabled={!changed || busy}>
                Discard
              </Button>
              <Button onClick={save} disabled={!changed || busy}>
                {busy ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">How Smart scoring works</CardTitle>
          <CardDescription>A score out of 100; the highest gets the incident.</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="pb-2 font-medium">
                  Factor
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SMART_FACTORS.map((f) => (
                <tr key={f.factor}>
                  <td className="py-2 pr-3">{f.factor}</td>
                  <td className="py-2 text-right font-semibold whitespace-nowrap">{f.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
