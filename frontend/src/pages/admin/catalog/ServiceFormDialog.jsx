// Add or edit an IT service: name, description, criticality and an optional
// default category (pre-selected when someone reports an incident on it).
import { servicesApi } from '@/api/catalogApi'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CRITICALITIES } from '@/config/catalog'
import { useFormState } from '@/hooks/useFormState'
import { optionalText } from '@/lib/validation'

const NONE = 'NONE' // a select option can't have an empty value

function validateService(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Enter a name'
  else if (values.name.trim().length > 100) errors.name = 'Use 100 characters or fewer'
  if (values.description.trim().length > 500) errors.description = 'Use 500 characters or fewer'
  if (!values.criticality) errors.criticality = 'Choose how critical this service is'
  return errors
}

export function ServiceFormDialog({ open, onOpenChange, service, categories, onSaved }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      {(dialog) => (
        <ServiceForm service={service} categories={categories} onSaved={onSaved} {...dialog} />
      )}
    </FormDialog>
  )
}

function ServiceForm({ service, categories, onSaved, busy, setBusy, close }) {
  const isEdit = Boolean(service)
  const form = useFormState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    criticality: service?.criticality ?? '',
    defaultCategoryId: service?.defaultCategory ? String(service.defaultCategory.id) : NONE,
  })
  const { values, setField, field } = form

  // keep a since-deactivated default category selectable, so saving doesn't drop it
  const current = service?.defaultCategory
  const categoryOptions = [
    { value: NONE, label: 'None' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ...(current && !categories.some((c) => c.id === current.id)
      ? [{ value: String(current.id), label: `${current.name} (inactive)` }]
      : []),
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateService(values)
    if (Object.keys(found).length) return form.showErrors(found)

    const body = {
      name: values.name.trim(),
      description: optionalText(values.description) ?? null,
      criticality: values.criticality,
      defaultCategoryId:
        values.defaultCategoryId === NONE ? null : Number(values.defaultCategoryId),
    }
    setBusy(true)
    try {
      const saved = isEdit
        ? await servicesApi.update(service.id, body)
        : await servicesApi.create(body)
      onSaved(saved, { created: !isEdit })
      close()
    } catch (error) {
      form.applyServerError(error, { DUPLICATE_RESOURCE: 'name' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {isEdit ? `Edit ${service.name}` : 'Add a service'}
        </DialogTitle>
        <DialogDescription>
          An IT service is something people rely on that can break, like VPN or Payment Gateway.
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={form.formError} />
      <FormField label="Name" autoComplete="off" {...field('name')} />
      <FormField label="Description" optional as={Textarea} {...field('description')} />
      <SelectField
        id="criticality"
        label="Business criticality"
        value={values.criticality}
        onChange={(v) => setField('criticality', v)}
        options={CRITICALITIES}
        hint="Feeds into incident priority: the more critical, the higher the priority."
        error={form.errors.criticality}
      />
      <SelectField
        id="defaultCategoryId"
        label="Default category"
        optional
        value={values.defaultCategoryId}
        onChange={(v) => setField('defaultCategoryId', v)}
        options={categoryOptions}
        hint="Pre-selected when someone reports an incident on this service."
      />

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add service'}
        </Button>
      </DialogFooter>
    </form>
  )
}
