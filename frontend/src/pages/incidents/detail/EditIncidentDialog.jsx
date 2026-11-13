// Edit an open incident's details. Only changed fields are sent; the server
// recalculates priority and SLA, and the page reports a priority change.
import { categoriesApi, servicesApi } from '@/api/catalogApi'
import { incidentsApi } from '@/api/incidentsApi'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { LoadingState } from '@/components/LoadingState'
import { SelectField } from '@/components/SelectField'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IMPACTS, URGENCIES } from '@/config/incidents'
import { useAsync } from '@/hooks/useAsync'
import { useFormState } from '@/hooks/useFormState'
import { validateIncident } from '../incidentRules'

const toChoices = (list) =>
  list.map((o) => ({ value: o.value, label: o.label, hint: o.description }))

export function EditIncidentDialog({ open, onOpenChange, incident, onDone, onError }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      {(dialog) => <EditLoader incident={incident} onDone={onDone} onError={onError} {...dialog} />}
    </FormDialog>
  )
}

function EditLoader(props) {
  const services = useAsync(() => servicesApi.list(), [])
  const categories = useAsync(() => categoriesApi.list(), [])
  const error = services.error ?? categories.error
  if (error)
    return <ErrorAlert error={error} title="Couldn’t load the form" onRetry={services.reload} />
  if (!services.data || !categories.data) return <LoadingState label="Loading" />
  return <EditForm services={services.data} categories={categories.data} {...props} />
}

function EditForm({ incident, services, categories, onDone, onError, busy, setBusy, close }) {
  const original = {
    title: incident.title,
    description: incident.description,
    serviceId: String(incident.service.id),
    categoryId: incident.category ? String(incident.category.id) : '',
    impact: incident.impact,
    urgency: incident.urgency,
    affectedUsers: String(incident.affectedUsers),
  }
  const form = useFormState(original)
  const { values, setField, errors } = form

  // keep the incident's own service and category selectable even if since deactivated
  const serviceOptions = services.map((s) => ({ value: String(s.id), label: s.name }))
  if (!services.some((s) => String(s.id) === original.serviceId)) {
    serviceOptions.push({ value: original.serviceId, label: `${incident.service.name} (inactive)` })
  }
  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name }))
  if (incident.category && !categories.some((c) => String(c.id) === original.categoryId)) {
    categoryOptions.push({
      value: original.categoryId,
      label: `${incident.category.name} (inactive)`,
    })
  }

  const changes = {}
  if (values.title.trim() !== original.title) changes.title = values.title.trim()
  if (values.description.trim() !== original.description)
    changes.description = values.description.trim()
  if (values.serviceId !== original.serviceId) changes.serviceId = Number(values.serviceId)
  if (values.categoryId !== original.categoryId) changes.categoryId = Number(values.categoryId)
  if (values.impact !== original.impact) changes.impact = values.impact
  if (values.urgency !== original.urgency) changes.urgency = values.urgency
  if (values.affectedUsers !== original.affectedUsers)
    changes.affectedUsers = Number(values.affectedUsers)
  const changed = Object.keys(changes).length > 0

  function chooseService(id) {
    setField('serviceId', id)
    const chosen = services.find((s) => String(s.id) === id)
    if (chosen?.defaultCategory) setField('categoryId', String(chosen.defaultCategory.id))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateIncident(values, { partial: true })
    if (Object.keys(found).length) return form.showErrors(found)
    setBusy(true)
    try {
      const updated = await incidentsApi.update(incident.id, changes)
      const message =
        updated.priority !== incident.priority
          ? `Priority changed from ${incident.priority} to ${updated.priority}`
          : 'Details saved'
      onDone(updated, message)
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
        <DialogTitle className="text-xl font-bold">Edit {incident.number}</DialogTitle>
        <DialogDescription>
          Priority and SLA targets are recalculated when you save. Deadlines still count from when
          it was reported.
        </DialogDescription>
      </DialogHeader>
      <FormAlert message={form.formError} />
      <FormField
        id="title"
        label="Title"
        {...form.field('title')}
        hint={`${values.title.trim().length}/150 characters`}
      />
      <FormField
        id="description"
        label="Description"
        as={Textarea}
        rows={4}
        {...form.field('description')}
        hint={`${values.description.length}/4000 characters`}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id="serviceId"
          label="Service"
          value={values.serviceId}
          onChange={chooseService}
          options={serviceOptions}
          error={errors.serviceId}
        />
        <SelectField
          id="categoryId"
          label="Category"
          value={values.categoryId}
          onChange={(v) => setField('categoryId', v)}
          options={categoryOptions}
          error={errors.categoryId}
        />
        <SelectField
          id="impact"
          label="Impact"
          value={values.impact}
          onChange={(v) => setField('impact', v)}
          options={toChoices(IMPACTS)}
          error={errors.impact}
        />
        <SelectField
          id="urgency"
          label="Urgency"
          value={values.urgency}
          onChange={(v) => setField('urgency', v)}
          options={toChoices(URGENCIES)}
          error={errors.urgency}
        />
      </div>
      <FormField
        id="affectedUsers"
        label="People affected"
        type="number"
        inputMode="numeric"
        min={1}
        className="sm:max-w-56"
        {...form.field('affectedUsers')}
      />
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !changed}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogFooter>
    </form>
  )
}
