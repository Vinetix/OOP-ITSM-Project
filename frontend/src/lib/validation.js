// Client-side validation that mirrors the backend's rules (API contract 6.3).
// Each rule returns an error message, or undefined when the value is fine.
// The server still validates everything; its fieldErrors are shown too.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

  /** For login: only checks that something was typed. */
  passwordPresent(value = '') {
    if (!value) return 'Enter your password'
  },

  /** For new passwords: the full strength rules. */
  newPassword(value = '') {
    if (!value) return 'Enter a password'
    if (value.length < 8 || value.length > 72) return 'Use 8 to 72 characters'
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      return 'Include at least one letter and one digit'
    }
  },

  /** Optional: empty is fine. */
  phone(value = '') {
    const v = value.trim()
    if (v && !PHONE_PATTERN.test(v)) return 'Use 7–20 digits, spaces or + - ( )'
  },

  /** Optional: empty is fine. */
  department(value = '') {
    if (value.trim().length > 100) return 'Use 100 characters or fewer'
  },
}

/**
 * Runs a rule per field and returns only the failures.
 *   validate({ email: 'x' }, { email: rules.email }) → { email: 'Enter a valid…' }
 */
export function validate(values, ruleMap) {
  const errors = {}
  for (const [field, rule] of Object.entries(ruleMap)) {
    const message = rule(values[field])
    if (message) errors[field] = message
  }
  return errors
}

/** Trimmed text, or undefined when empty (so optional fields are left out of the request). */
export function optionalText(value) {
  const v = (value ?? '').trim()
  return v === '' ? undefined : v
}

/** Moves keyboard focus to the first field with an error. */
export function focusFirstError(errors) {
  const first = Object.keys(errors)[0]
  if (first) document.getElementById(first)?.focus()
}