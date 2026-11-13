// One dialog for every lifecycle action except Assign. Its title, fields and
// API call come from actions.js. Errors that mean "the incident changed" are
// handed back to the page (which reloads); anything else shows here.
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { StarRating } from '@/components/incidents/StarRating'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hooks/useFormState'
import { ACTIONS } from './actions'

export function ActionDialog({ action, open, onOpenChange, incident, onDone, onError }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      {(dialog) =>
        action && (
          <ActionForm
            config={ACTIONS[action]}
            incident={incident}
            onDone={onDone}
            onError={onError}
            {...dialog}
          />
        )
      }
    </FormDialog>
  )
}

function ActionForm({ config, incident, onDone, onError, busy, setBusy, close }) {
  const initial = Object.fromEntries(
    config.fields.map((f) => [f.name, f.kind === 'stars' ? 0 : '']),
  )
  const form = useFormState(initial)
  const { values, setField, errors } = form
  const question = config.showQuestion
    ? [...(incident.notes ?? [])].reverse().find((n) => n.type === 'INFO_REQUEST')
    : null

  function validate() {
    const found = {}
    for (const f of config.fields) {
      if (f.kind === 'stars') continue
      const text = values[f.name]
      if (f.required && !text.trim()) found[f.name] = `Fill in “${f.label}”`
      else if (f.max && text.length > f.max) found[f.name] = `Use ${f.max} characters or fewer`
    }
    return found
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate()
    if (Object.keys(found).length) return form.showErrors(found)
    setBusy(true)
    try {
      const updated = await config.run(incident.id, values)
      onDone(updated, config.done)
      close()
    } catch (error) {
      if (onError(error)) close()
      else form.applyServerError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{config.title}</DialogTitle>
        <DialogDescription>{config.description}</DialogDescription>
      </DialogHeader>

      <FormAlert message={form.formError} />

      {question && (
        <figure className="rounded-xl rounded-tl-sm border border-[color:color-mix(in_oklab,var(--tone-purple)_35%,transparent)] bg-[color:color-mix(in_oklab,var(--tone-purple)_7%,transparent)] p-4 text-sm">
          <figcaption className="mb-1 font-semibold">{question.author?.fullName} asked:</figcaption>
          <p className="whitespace-pre-wrap">{question.text}</p>
        </figure>
      )}

      {config.fields.map((f) =>
        f.kind === 'stars' ? (
          <div key={f.name} className="grid gap-1.5">
            <Label>{f.label}</Label>
            <StarRating
              value={values[f.name]}
              onChange={(v) => setField(f.name, v)}
              label={f.label}
            />
          </div>
        ) : (
          <FormField
            key={f.name}
            id={f.name}
            label={f.label}
            optional={f.optional}
            as={Textarea}
            rows={f.rows ?? 4}
            value={values[f.name]}
            onChange={(e) => setField(f.name, e.target.value)}
            hint={f.max ? `${values[f.name].length}/${f.max} characters` : undefined}
            error={errors[f.name]}
          />
        ),
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant={config.destructive ? 'destructive' : 'default'}
          disabled={busy}
        >
          {busy ? 'Working…' : config.confirm}
        </Button>
      </DialogFooter>
    </form>
  )
}
