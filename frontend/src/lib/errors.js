// Every failed request returns { status, code, message, fieldErrors? }.
// Pages use these helpers instead of digging through Axios error objects.

export const NETWORK_ERROR_MESSAGE = 'Cannot reach the server. Is the backend running?'

// Codes where we show our own wording instead of the server's message.
const FRIENDLY_MESSAGES = {
  AUTHENTICATION_FAILED: 'Invalid email or password',
  DATABASE_UNAVAILABLE: 'Service temporarily unavailable. Try again in a moment.',
  INTERNAL_ERROR: 'Something went wrong on the server. Try again.',
  CONCURRENT_MODIFICATION: 'Changed by someone else — reloading',
}

// No response at all: backend down, wrong URL or a CORS problem.
export function isNetworkError(error) {
  return Boolean(error?.isAxiosError && !error.response)
}

function getErrorBody(error) {
  const data = error?.response?.data
  return data && typeof data === 'object' ? data : null
}

export function getErrorCode(error) {
  return getErrorBody(error)?.code ?? null
}

export function getErrorStatus(error) {
  return error?.response?.status ?? null
}

export function getErrorMessage(error, fallback = 'Something went wrong. Try again.') {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE

  const body = getErrorBody(error)
  if (body?.code && FRIENDLY_MESSAGES[body.code]) return FRIENDLY_MESSAGES[body.code]
  if (body?.message) return body.message

  // not from the API at all, e.g. a bug in our own code
  if (error instanceof Error && !error.isAxiosError) return error.message || fallback
  return fallback
}

export function getFieldErrors(error) {
  const fieldErrors = getErrorBody(error)?.fieldErrors
  return fieldErrors && typeof fieldErrors === 'object' ? fieldErrors : {}
}
