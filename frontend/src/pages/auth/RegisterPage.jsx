// Self-registration. The backend always creates an EMPLOYEE account and
// returns a session, so on success the user is signed in and GuestRoute
// takes them to /employee.
import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import { FormField } from '@/components/FormField'
import { PasswordInput } from '@/components/PasswordInput'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/errors'
import { focusFirstError, optionalText, rules, validate } from '@/lib/validation'

const REGISTER_RULES = {
  fullName: rules.fullName,
  email: rules.email,
  password: rules.newPassword,
  phone: rules.phone,
  department: rules.department,
}

const EMPTY = { fullName: '', email: '', password: '', phone: '', department: '' }

export default function RegisterPage() {
  const { register } = useAuth()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError(null)
  }

  // Shorthand for the props every text field needs.
  function field(name) {
    return {
      id: name,
      value: values[name],
      onChange: (e) => setField(name, e.target.value),
      error: errors[name],
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const clientErrors = validate(values, REGISTER_RULES)
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      focusFirstError(clientErrors)
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const user = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: optionalText(values.phone), // left out of the request when empty
        department: optionalText(values.department),
      })
      toast.success(`Account created. Welcome, ${user.fullName.split(' ')[0]}.`)
    } catch (error) {
      if (getErrorCode(error) === 'DUPLICATE_RESOURCE') {
        const duplicate = { email: 'An account with this email already exists' }
        setErrors(duplicate)
        focusFirstError(duplicate)
      } else if (Object.keys(getFieldErrors(error)).length) {
        setErrors(getFieldErrors(error))
        focusFirstError(getFieldErrors(error))
      } else {
        setFormError(getErrorMessage(error))
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold">Create your account</h1>
        <p className="text-muted-foreground">
          For employees who need to report IT problems. Technician and admin accounts are
          created by an admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <Alert variant="destructive" className="bg-card" role="alert">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField label="Full name" autoComplete="name" {...field('fullName')} />
        <FormField
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="name@itsm.com"
          {...field('email')}
        />
        <FormField
          label="Password"
          as={PasswordInput}
          autoComplete="new-password"
          hint="8 to 72 characters, with at least one letter and one digit."
          {...field('password')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Phone"
            optional
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            {...field('phone')}
          />
          <FormField
            label="Department"
            optional
            autoComplete="organization-title"
            placeholder="Finance"
            {...field('department')}
          />
        </div>

        <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}