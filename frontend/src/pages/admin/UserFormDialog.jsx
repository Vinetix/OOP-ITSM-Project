// Add or edit a user. Matches CreateUserRequest / UpdateUserRequest in the API
// contract: email and role are fixed after creation, department is for
// employees only, and technicians get seniority, experience and workload.
import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/api/usersApi'
import { FormField } from '@/components/FormField'
import { PasswordInput } from '@/components/PasswordInput'
import { RoleBadge } from '@/components/RoleBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/errors'
import { focusFirstError, optionalText, rules, validate } from '@/lib/validation'

function initialValues(user) {
  return {
    role: user?.role ?? 'EMPLOYEE',
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    password: '',
    phone: user?.phone ?? '',
    department: user?.department ?? '',
    senior: user?.senior ?? false,
    experienceYears: String(user?.experienceYears ?? 0),
    maxActiveIncidents: String(user?.maxActiveIncidents ?? 5),
    available: user?.available ?? true,
  }
}

function wholeNumber(min, max) {
  return (value = '') => {
    if (value.trim() === '') return 'Enter a number'
    const n = Number(value)
    if (!Number.isInteger(n)) return 'Use a whole number'
    if (n < min || n > max) return `Use a number from ${min} to ${max}`
  }
}

function rulesFor(values, isEdit) {
  const map = { fullName: rules.fullName, phone: rules.phone }
  if (values.role === 'EMPLOYEE') map.department = rules.department
  if (!isEdit) {
    map.email = rules.email
    map.password = rules.newPassword
  }
  if (values.role === 'TECHNICIAN') {
    map.experienceYears = wholeNumber(0, 60)
    map.maxActiveIncidents = wholeNumber(1, 50)
  }
  return map
}

function toRequest(values, user) {
  const body = {
    fullName: values.fullName.trim(),
    phone: optionalText(values.phone) ?? null,
  }
  if (values.role === 'EMPLOYEE') {
    // On edit, "" clears the department (null would keep the old one).
    body.department = user ? values.department.trim() : optionalText(values.department)
  }
  if (!user) {
    body.role = values.role
    body.email = values.email.trim()
    body.password = values.password
  }
  if (values.role === 'TECHNICIAN') {
    body.senior = values.senior
    body.experienceYears = Number(values.experienceYears)
    body.maxActiveIncidents = Number(values.maxActiveIncidents)
    if (user) body.available = values.available
  }
  return body
}

export function UserFormDialog({ open, user, onOpenChange, onSaved, onConflict }) {
  const [saving, setSaving] = useState(false)

  // The form only exists while the dialog is open, so it starts fresh each time.
  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <UserForm
          user={user}
          saving={saving}
          setSaving={setSaving}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
          onConflict={onConflict}
        />
      </DialogContent>
    </Dialog>
  )
}

function UserForm({ user, saving, setSaving, onClose, onSaved, onConflict }) {
  const isEdit = Boolean(user)
  const [values, setValues] = useState(() => initialValues(user))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError(null)
  }

  function field(name) {
    return {
      id: name,
      value: values[name],
      onChange: (e) => setField(name, e.target.value),
      error: errors[name],
    }
  }

  function showErrors(found) {
    setErrors(found)
    focusFirstError(found)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const clientErrors = validate(values, rulesFor(values, isEdit))
    if (Object.keys(clientErrors).length) return showErrors(clientErrors)

    setSaving(true)
    try {
      const body = toRequest(values, user)
      const saved = isEdit ? await usersApi.update(user.id, body) : await usersApi.create(body)
      onSaved(saved, { created: !isEdit })
      onClose()
    } catch (error) {
      const code = getErrorCode(error)
      if (code === 'DUPLICATE_RESOURCE') {
        showErrors({ email: 'An account with this email already exists' })
      } else if (code === 'CONCURRENT_MODIFICATION') {
        toast.error(getErrorMessage(error))
        onClose()
        onConflict?.()
      } else if (Object.keys(getFieldErrors(error)).length) {
        showErrors(getFieldErrors(error))
      } else {
        setFormError(getErrorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const isTechnician = values.role === 'TECHNICIAN'

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {isEdit ? `Edit ${user.fullName}` : 'Add a user'}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Email and role stay the same. Changes apply the next time they load a page.'
            : 'They can sign in straight away with the email and password you set.'}
        </DialogDescription>
      </DialogHeader>

      {formError && (
        <Alert variant="destructive" role="alert">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {isEdit ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted px-3 py-2.5 text-sm">
          <RoleBadge role={user.role} />
          <span className="font-medium">{user.email}</span>
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={values.role} onValueChange={(value) => setField('role', value)}>
            <SelectTrigger id="role" className="h-9 w-full bg-popover">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="TECHNICIAN">Technician</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <FormField label="Full name" autoComplete="off" {...field('fullName')} />

      {!isEdit && (
        <>
          <FormField label="Email" type="email" autoComplete="off" {...field('email')} />
          <FormField
            label="Temporary password"
            as={PasswordInput}
            autoComplete="new-password"
            hint="8 to 72 characters, with at least one letter and one digit. Share it with them securely."
            {...field('password')}
          />
        </>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Phone" optional type="tel" autoComplete="off" {...field('phone')} />
        {values.role === 'EMPLOYEE' && (
          <FormField label="Department" optional autoComplete="off" {...field('department')} />
        )}
      </div>

      {isTechnician && (
        <fieldset className="grid gap-4 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Technician details</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Experience (years)"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              {...field('experienceYears')}
            />
            <FormField
              label="Max active incidents"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              {...field('maxActiveIncidents')}
            />
          </div>
          <SwitchRow
            id="senior"
            label="Senior technician"
            hint="Senior technicians can be given the most urgent incidents."
            checked={values.senior}
            onChange={(checked) => setField('senior', checked)}
          />
          {isEdit && (
            <SwitchRow
              id="available"
              label="Available for new incidents"
              hint="Technicians can also change this themselves."
              checked={values.available}
              onChange={(checked) => setField('available', checked)}
            />
          )}
        </fieldset>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add user'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function SwitchRow({ id, label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </div>
  )
}