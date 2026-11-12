// Add or edit a technician skill. Every skill belongs to one category, which is
// how incidents will later be matched to technicians who can fix them.
import { skillsApi } from '@/api/catalogApi'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFormState } from '@/hooks/useFormState'
import { optionalText } from '@/lib/validation'

function validateSkill(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Enter a name'
  else if (values.name.trim().length > 100) errors.name = 'Use 100 characters or fewer'
  if (values.description.trim().length > 500) errors.description = 'Use 500 characters or fewer'
  if (!values.categoryId) errors.categoryId = 'Choose a category'
  return errors
}

export function SkillFormDialog({ open, onOpenChange, skill, categories, onSaved }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      {(dialog) => (
        <SkillForm skill={skill} categories={categories} onSaved={onSaved} {...dialog} />
      )}
    </FormDialog>
  )
}

function SkillForm({ skill, categories, onSaved, busy, setBusy, close }) {
  const isEdit = Boolean(skill)
  const form = useFormState({
    name: skill?.name ?? '',
    description: skill?.description ?? '',
    categoryId: skill?.category ? String(skill.category.id) : '',
  })
  const { values, setField, field } = form

  // keep a since-deactivated category selectable, so saving doesn't change it
  const current = skill?.category
  const categoryOptions = [
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ...(current && !categories.some((c) => c.id === current.id)
      ? [{ value: String(current.id), label: `${current.name} (inactive)` }]
      : []),
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateSkill(values)
    if (Object.keys(found).length) return form.showErrors(found)

    const body = {
      name: values.name.trim(),
      description: optionalText(values.description) ?? null,
      categoryId: Number(values.categoryId),
    }
    setBusy(true)
    try {
      const saved = isEdit ? await skillsApi.update(skill.id, body) : await skillsApi.create(body)
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
          {isEdit ? `Edit ${skill.name}` : 'Add a skill'}
        </DialogTitle>
        <DialogDescription>
          Something a technician knows how to fix, like Cisco Networking or Payment Systems.
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={form.formError} />
      <FormField label="Name" autoComplete="off" {...field('name')} />
      <FormField label="Description" optional as={Textarea} {...field('description')} />
      <SelectField
        id="categoryId"
        label="Category"
        value={values.categoryId}
        onChange={(v) => setField('categoryId', v)}
        options={categoryOptions}
        hint="Incidents in this category will look for technicians with this skill."
        error={form.errors.categoryId}
      />

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add skill'}
        </Button>
      </DialogFooter>
    </form>
  )
}
