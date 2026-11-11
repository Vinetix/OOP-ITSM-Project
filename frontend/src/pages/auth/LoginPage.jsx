// Sign in. Once the session exists, GuestRoute takes care of the redirect.
import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { FormField } from '@/components/FormField'
import { PasswordInput } from '@/components/PasswordInput'
import { RoleBadge } from '@/components/RoleBadge'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getErrorMessage, getFieldErrors } from '@/lib/errors'
import { focusFirstError, rules, validate } from '@/lib/validation'

const DEMO_PASSWORD = 'Password@123'
// No names here: they can be edited in the app, and this list can't see that.
const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@itsm.com', does: 'Manages users and settings' },
  { role: 'TECHNICIAN', email: 'ravi.kumar@itsm.com', does: 'Works on assigned incidents' },
  { role: 'EMPLOYEE', email: 'rahul.verma@itsm.com', does: 'Reports IT problems' },
]

const LOGIN_RULES = { email: rules.emailShape, password: rules.passwordPresent }

export default function LoginPage() {
  usePageTitle('Sign in')
  const { login } = useAuth()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError(null)
  }

  function fillDemo(account) {
    setValues({ email: account.email, password: DEMO_PASSWORD })
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const clientErrors = validate(values, LOGIN_RULES)
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      focusFirstError(clientErrors)
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      await login(values.email.trim(), values.password)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      else setFormError(getErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold">Sign in</h1>
        <p className="text-muted-foreground">Use your work email and password.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <Alert variant="destructive" className="bg-card" role="alert">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="name@itsm.com"
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          error={errors.email}
        />
        <FormField
          id="password"
          label="Password"
          as={PasswordInput}
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          error={errors.password}
        />

        <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link
            to="/register"
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Create an employee account
          </Link>
        </p>
      </form>

      <section aria-labelledby="demo-heading" className="space-y-3">
        <div>
          <h2 id="demo-heading" className="font-bold">
            Demo accounts
          </h2>
          <p className="text-sm text-muted-foreground">
            Fills in the form. Every demo password is {DEMO_PASSWORD}.
          </p>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => fillDemo(account)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <RoleBadge role={account.role} className="w-20 justify-center" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{account.email}</span>
                  <span className="block text-sm text-muted-foreground">{account.does}</span>
                </span>
                <span className="text-sm font-semibold text-muted-foreground">Use</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
