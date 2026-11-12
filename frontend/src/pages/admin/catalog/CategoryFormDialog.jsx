// Add or edit an incident category. The code is typed once, in capitals, and
// never changes; keywords will drive automatic category suggestions later.
import { categoriesApi } from '@/api/catalogApi'
import { CategoryCode } from '@/components/CategoryCode'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { KeywordInput } from '@/components/KeywordInput'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hooks/useFormState'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import { optionalText } from '@/lib/validation'

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,29}$/

function validateCategory(values, isEdit) {
  const errors = {}
  if (!isEdit) {
    if (!values.code) errors.code = 'Enter a code'
    else if (!CODE_PATTERN.test(values.code)) {
      errors.code = 'Use 2–30 letters, digits or _, starting with a letter'
    }
  }
  if (!values.name.trim()) errors.name = 'Enter a name'
  else if (values.name.trim().length > 100) errors.name = 'Use 100 characters or fewer'
  if (values.description.trim().length > 500) errors.description = 'Use 500 characters or fewer'
  return errors
}

export function CategoryFormDialog({ open, onOpenChange, category, onSaved }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      {(dialog) => <CategoryForm category={category} onSaved={onSaved} {...dialog} />}
    </FormDialog>
  )
}

function CategoryForm({ category, onSaved, busy, setBusy, close }) {
  const isEdit = Boolean(category)
  const form = useFormState({
    code: category?.code ?? '',
    name: category?.name ?? '',
    description: category?.description ?? '',
    keywords: category?.keywords ?? [],
  })
  const { values, setField, field } = form

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateCategory(values, isEdit)
    if (Object.keys(found).length) return form.showErrors(found)

    const body = {
      code: values.code, // ignored by the backend on edit
      name: values.name.trim(),
      description: optionalText(values.description) ?? null,
      keywords: values.keywords,
    }
    setBusy(true)
    try {
      const saved = isEdit
        ? await categoriesApi.update(category.id, body)
        : await categoriesApi.create(body)
      onSaved(saved, { created: !isEdit })
      close()
    } catch (error) {
      // codes and names are both unique; the message says which one clashed
      if (getErrorCode(error) === 'DUPLICATE_RESOURCE') {
        const target = !isEdit && /code/i.test(getErrorMessage(error)) ? 'code' : 'name'
        form.showErrors({ [target]: getErrorMessage(error) })
      } else {
        form.applyServerError(error)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {isEdit ? `Edit ${category.name}` : 'Add a category'}
        </DialogTitle>
        <DialogDescription>
          A category says what kind of problem an incident is, like Network or Printing.
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={form.formError} />

      {isEdit ? (
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Code</span>
          <div className="flex items-center gap-3">
            <CategoryCode code={category.code} className="text-sm" />
            <span className="text-sm text-muted-foreground">
              Codes can’t change after creation.
            </span>
          </div>
        </div>
      ) : (
        <FormField
          id="code"
          label="Code"
          autoComplete="off"
          placeholder="PRINTING"
          hint="2–30 letters, digits or _, starting with a letter. It can’t change later."
          className="[&_input]:font-mono"
          value={values.code}
          onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
          error={form.errors.code}
        />
      )}

      <FormField label="Name" autoComplete="off" {...field('name')} />
      <FormField label="Description" optional as={Textarea} {...field('description')} />

      <div className="grid gap-1.5">
        <Label htmlFor="keywords" className="gap-1">
          Keywords <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <KeywordInput
          id="keywords"
          value={values.keywords}
          onChange={(next) => setField('keywords', next)}
          invalid={Boolean(form.errors.keywords)}
        />
        {form.errors.keywords && <p className="text-sm text-destructive">{form.errors.keywords}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
        </Button>
      </DialogFooter>
    </form>
  )
}
