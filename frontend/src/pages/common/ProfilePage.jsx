// The signed-in user's own profile: edit name and phone, change password,
// and see the account details only an admin can change.
import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/api/usersApi'
import { useAuth } from '@/auth/AuthContext'
import { FormField } from '@/components/FormField'
import { InfoList } from '@/components/InfoList'
import { PageHeader } from '@/components/PageHeader'
import { PasswordInput } from '@/components/PasswordInput'
import { RoleBadge } from '@/components/RoleBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { focusFirstError, optionalText, rules, validate } from '@/lib/validation'

function FormAlert({ message }) {
  if (!message) return null
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function DetailsForm() {
  const { user, updateUser } = useAuth()
  const [values, setValues] = useState({ fullName: user.fullName, phone: user.phone ?? '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const changed =
    values.fullName.trim() !== user.fullName || values.phone.trim() !== (user.phone ?? '')

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(values, { fullName: rules.fullName, phone: rules.phone })
    if (Object.keys(found).length) {
      setErrors(found)
      return focusFirstError(found)
    }

    setSaving(true)
    try {
      const updated = await usersApi.updateMe({
        fullName: values.fullName.trim(),
        phone: optionalText(values.phone) ?? null, // null clears the phone
      })
      updateUser(updated) // top bar and other pages pick up the new name
      setValues({ fullName: updated.fullName, phone: updated.phone ?? '' })
      toast.success('Profile saved')
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      else setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Your details</CardTitle>
        <CardDescription>Your name appears on incidents you report or work on.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <FormAlert message={formError} />
          <FormField
            id="fullName"
            label="Full name"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            error={errors.fullName}
          />
          <FormField
            id="phone"
            label="Phone"
            optional
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            hint="Leave empty to remove it."
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            error={errors.phone}
          />
          <div>
            <Button type="submit" disabled={saving || !changed}>
              {saving ? 'Saving…' : 'Save details'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' }

function PasswordForm() {
  const [values, setValues] = useState(EMPTY_PASSWORDS)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError(null)
  }

  function showErrors(found) {
    setErrors(found)
    focusFirstError(found)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(values, {
      currentPassword: (v) => (v ? undefined : 'Enter your current password'),
      newPassword: rules.newPassword,
      confirmPassword: (v) => (v === values.newPassword ? undefined : 'The passwords don’t match'),
    })
    if (!found.newPassword && values.newPassword && values.newPassword === values.currentPassword) {
      found.newPassword = 'Choose a password different from your current one'
    }
    if (Object.keys(found).length) return showErrors(found)

    setSaving(true)
    try {
      await usersApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setValues(EMPTY_PASSWORDS)
      toast.success('Password changed. Use the new one next time you sign in.')
    } catch (error) {
      // The backend answers 400 INVALID_REQUEST with one of two messages.
      const message = getErrorMessage(error)
      if (getErrorCode(error) === 'INVALID_REQUEST' && /current password/i.test(message)) {
        showErrors({ currentPassword: message })
      } else if (getErrorCode(error) === 'INVALID_REQUEST' && /different/i.test(message)) {
        showErrors({ newPassword: 'Choose a password different from your current one' })
      } else if (Object.keys(getFieldErrors(error)).length) {
        showErrors(getFieldErrors(error))
      } else {
        setFormError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Change password</CardTitle>
        <CardDescription>You’ll stay signed in on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <FormAlert message={formError} />
          <FormField
            id="currentPassword"
            label="Current password"
            as={PasswordInput}
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(e) => setField('currentPassword', e.target.value)}
            error={errors.currentPassword}
          />
          <FormField
            id="newPassword"
            label="New password"
            as={PasswordInput}
            autoComplete="new-password"
            hint="8 to 72 characters, with at least one letter and one digit."
            value={values.newPassword}
            onChange={(e) => setField('newPassword', e.target.value)}
            error={errors.newPassword}
          />
          <FormField
            id="confirmPassword"
            label="Confirm new password"
            as={PasswordInput}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
          />
          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Changing…' : 'Change password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function AccountCard() {
  const { user } = useAuth()
  const isTechnician = user.role === 'TECHNICIAN'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Account</CardTitle>
        <CardDescription>Only an admin can change these.</CardDescription>
      </CardHeader>
      <CardContent>
        <InfoList
          items={[
            { label: 'Email', value: user.email },
            { label: 'Role', value: <RoleBadge role={user.role} /> },
            user.role === 'EMPLOYEE' && {
              label: 'Department',
              value: user.department || 'Not set',
            },
            isTechnician && {
              label: 'Seniority',
              value: user.senior ? 'Senior technician' : 'Technician',
            },
            isTechnician && { label: 'Experience', value: `${user.experienceYears ?? 0} years` },
            isTechnician && {
              label: 'Max workload',
              value: `${user.maxActiveIncidents} active incidents`,
            },
            isTechnician && {
              label: 'Availability',
              value: <StatusBadge status={user.available ? 'AVAILABLE' : 'UNAVAILABLE'} />,
            },
            { label: 'Member since', value: formatDate(user.createdAt) },
          ].filter(Boolean)}
        />
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your contact details and password." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid gap-6">
          <DetailsForm />
          <PasswordForm />
        </div>
        <AccountCard />
      </div>
    </>
  )
}