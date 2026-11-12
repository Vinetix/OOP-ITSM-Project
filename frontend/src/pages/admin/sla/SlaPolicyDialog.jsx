// Edit an SLA policy's times, or create one. Creating a service override asks
// for the service and priority; a missing default only asks for the times.
import { Lock } from 'lucide-react'
import { slaApi } from '@/api/slaApi'
import { DurationInput } from '@/components/DurationInput'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { PriorityBadge } from '@/components/PriorityBadge'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PRIORITIES } from '@/config/catalog'
import { useFormState } from '@/hooks/useFormState'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import { formatMinutes } from '@/lib/format'
import { validateSla } from './slaRules'

// policy: the one being edited. draft: { serviceId, priority } for a new one,
// where serviceId null means a DEFAULT and undefined means "let the admin choose".
export function SlaPolicyDialog({ open, onOpenChange, ...props }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      {(dialog) => <SlaPolicyForm {...props} {...dialog} />}
    </FormDialog>
  )
}

function SlaPolicyForm({
  policy,
  draft = {},
  services = [],
  policies = [],
  onSaved,
  busy,
  setBusy,
  close,
}) {
  const isEdit = Boolean(policy)
  const isDefault = isEdit ? policy.scope === 'DEFAULT' : draft.serviceId === null
  const choosing = !isEdit && !isDefault // a new override: pick service and priority

  const form = useFormState({
    serviceId: draft.serviceId ? String(draft.serviceId) : '',
    priority: isEdit ? policy.priority : (draft.priority ?? ''),
    responseMinutes: policy?.responseMinutes ?? null,
    resolutionMinutes: policy?.resolutionMinutes ?? null,
  })
  const { values, setField, errors } = form

  const defaults = policies.filter((p) => p.scope === 'DEFAULT')
  const defaultFor = (priority) => defaults.find((p) => p.priority === priority)
  const shownDefault = !isDefault && values.priority ? defaultFor(values.priority) : null

  // a service can only have one override per priority
  const takenPriorities = new Set(
    policies
      .filter((p) => p.scope === 'SERVICE' && String(p.service?.id) === values.serviceId)
      .map((p) => p.priority),
  )
  const priorityOptions = PRIORITIES.filter((p) => !takenPriorities.has(p.value)).map((p) => ({
    value: p.value,
    label: `${p.value} · ${p.label}`,
  }))

  const serviceName = isEdit
    ? policy.service?.name
    : services.find((s) => String(s.id) === values.serviceId)?.name

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateSla(values)
    if (choosing && !values.serviceId) found.serviceId = 'Choose a service'
    if (choosing && !values.priority) found.priority = 'Choose a priority'
    if (Object.keys(found).length) return form.showErrors(found)

    const minutes = {
      responseMinutes: values.responseMinutes,
      resolutionMinutes: values.resolutionMinutes,
    }
    setBusy(true)
    try {
      const saved = isEdit
        ? await slaApi.update(policy.id, minutes)
        : await slaApi.create({
            serviceId: isDefault ? null : Number(values.serviceId),
            priority: values.priority,
            ...minutes,
          })
      onSaved(saved, { created: !isEdit })
      close()
    } catch (error) {
      const code = getErrorCode(error)
      if (code === 'INVALID_REQUEST') form.showErrors({ resolutionMinutes: getErrorMessage(error) })
      else if (code === 'DUPLICATE_RESOURCE' && choosing) {
        form.showErrors({ priority: getErrorMessage(error) })
      } else form.applyServerError(error)
    } finally {
      setBusy(false)
    }
  }

  const title = isEdit
    ? isDefault
      ? `Edit the default ${policy.priority} policy`
      : `Edit ${serviceName}’s ${policy.priority} override`
    : isDefault
      ? `Set the default ${values.priority} policy`
      : 'Add a service override'

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        <DialogDescription>
          {isDefault
            ? 'Applies to every incident of this priority, unless its service has an override.'
            : 'Replaces the default for incidents of this priority on this service only.'}
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={form.formError} />

      {choosing ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="serviceId"
            label="Service"
            value={values.serviceId}
            onChange={(v) => {
              setField('serviceId', v)
              setField('priority', '') // the free priorities depend on the service
            }}
            options={services.map((s) => ({ value: String(s.id), label: s.name }))}
            error={errors.serviceId}
          />
          <SelectField
            id="priority"
            label="Priority"
            value={values.priority}
            onChange={(v) => setField('priority', v)}
            options={priorityOptions}
            placeholder={values.serviceId ? 'Choose…' : 'Choose a service first'}
            disabled={!values.serviceId || priorityOptions.length === 0}
            hint={
              values.serviceId && priorityOptions.length === 0
                ? 'This service already has an override for every priority.'
                : undefined
            }
            error={errors.priority}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted px-3 py-2.5 text-sm">
          <PriorityBadge priority={values.priority} />
          <span className="font-medium">{isDefault ? 'Default policy' : serviceName}</span>
          {isDefault && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Lock aria-hidden="true" className="size-3.5" />
              can’t be deleted
            </span>
          )}
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="responseMinutes">First response within</Label>
        <DurationInput
          id="responseMinutes"
          value={values.responseMinutes}
          onChange={(v) => setField('responseMinutes', v)}
          invalid={Boolean(errors.responseMinutes)}
          describedBy="responseMinutes-note"
        />
        <p
          id="responseMinutes-note"
          className={
            errors.responseMinutes ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'
          }
        >
          {errors.responseMinutes ??
            (shownDefault
              ? `Default: ${formatMinutes(shownDefault.responseMinutes)}`
              : 'Up to 7 days.')}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="resolutionMinutes">Resolved within</Label>
        <DurationInput
          id="resolutionMinutes"
          value={values.resolutionMinutes}
          onChange={(v) => setField('resolutionMinutes', v)}
          invalid={Boolean(errors.resolutionMinutes)}
          describedBy="resolutionMinutes-note"
        />
        <p
          id="resolutionMinutes-note"
          className={
            errors.resolutionMinutes ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'
          }
        >
          {errors.resolutionMinutes ??
            (shownDefault
              ? `Default: ${formatMinutes(shownDefault.resolutionMinutes)}`
              : 'Up to 30 days, and no quicker than the first response.')}
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Save policy'}
        </Button>
      </DialogFooter>
    </form>
  )
}
