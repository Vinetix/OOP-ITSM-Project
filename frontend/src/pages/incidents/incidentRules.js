// The backend's incident rules, checked before sending (report and edit).

export function validateIncident(values, { partial = false } = {}) {
  const errors = {}
  const title = values.title.trim()
  if (title.length < 5 || title.length > 150) errors.title = 'Use 5 to 150 characters'
  if (!values.description.trim()) errors.description = 'Describe what’s happening'
  else if (values.description.length > 4000) errors.description = 'Use 4000 characters or fewer'
  if (!partial) {
    if (!values.serviceId) errors.serviceId = 'Choose the affected service'
    if (!values.impact) errors.impact = 'Choose the impact'
    if (!values.urgency) errors.urgency = 'Choose the urgency'
  }
  if (!values.categoryId) errors.categoryId = 'Choose a category'
  const users = Number(values.affectedUsers)
  if (!Number.isInteger(users) || users < 1 || users > 1_000_000) {
    errors.affectedUsers = 'Use a whole number from 1 to 1,000,000'
  }
  return errors
}

// required message fields (questions, answers, reopen reasons, notes)
export function validateMessage(text, max = 2000, what = 'a message') {
  if (!text.trim()) return `Write ${what}`
  if (text.length > max) return `Use ${max} characters or fewer`
}
