// The same rules the backend applies, checked before sending. Each rule
// returns an error message, or nothing when the value is fine.

// name@domain.tld: no spaces, no leading, trailing or double dots, domain parts
// can't start or end with "-", and the ending is at least two letters.
const EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/
const PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/

export const rules = {
  fullName(value = '') {
    const v = value.trim()
    if (!v) return 'Enter a full name'
    if (v.length > 100) return 'Use 100 characters or fewer'
  },

  email(value = '') {
    const v = value.trim()
    if (!v) return 'Enter an email address'
    if (v.length > 150) return 'Use 150 characters or fewer'
    if (!EMAIL_PATTERN.test(v)) return 'Enter a valid email address, like name@itsm.com'
  },

  // login only: old accounts may predate the strict rule, so let the server decide
  emailShape(value = '') {
    const v = value.trim()
    if (!v) return 'Enter your email address'
    if (!/^\S+@\S+$/.test(v)) return 'Enter your email address, like name@itsm.com'
  },

  // login only checks that something was typed
  passwordPresent(value = '') {
    if (!value) return 'Enter your password'
  },

  newPassword(value = '') {
    if (!value) return 'Enter a password'
    if (value.length < 8 || value.length > 72) return 'Use 8 to 72 characters'
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      return 'Include at least one letter and one digit'
    }
  },

  phone(value = '') {
    const v = value.trim()
    if (v && !PHONE_PATTERN.test(v)) return 'Use 7–20 digits, spaces or + - ( )'
  },

  department(value = '') {
    if (value.trim().length > 100) return 'Use 100 characters or fewer'
  },
}

// validate({ email: 'x' }, { email: rules.email }) → { email: 'Enter a valid…' }
export function validate(values, ruleMap) {
  const errors = {}
  for (const [field, rule] of Object.entries(ruleMap)) {
    const message = rule(values[field])
    if (message) errors[field] = message
  }
  return errors
}

// Empty optional fields become undefined, so they're left out of the request.
export function optionalText(value) {
  const v = (value ?? '').trim()
  return v === '' ? undefined : v
}

export function focusFirstError(errors) {
  const first = Object.keys(errors)[0]
  if (first) document.getElementById(first)?.focus()
}
