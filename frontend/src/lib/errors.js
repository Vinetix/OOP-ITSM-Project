// Helpers for reading errors from the backend.
// Every failed request returns the same JSON shape (see API contract 6.1):
//   { status, code, message, fieldErrors? }
// Components call these helpers instead of digging into Axios error objects.

export const NETWORK_ERROR_MESSAGE = 'Cannot reach the server. Is the backend running?'

// Codes where we show our own wording instead of the server's message.
const FRIENDLY_MESSAGES = {
  AUTHENTICATION_FAILED: 'Invalid email or password',
  DATABASE_UNAVAILABLE: 'Service temporarily unavailable. Try again in a moment.',
  INTERNAL_ERROR: 'Something went wrong on the server. Try again.',
  CONCURRENT_MODIFICATION: 'Changed by someone else — reloading',
}

/** True when the request never got a response (backend down, wrong URL, CORS). */
export function isNetworkError(error) {
  return Boolean(error?.isAxiosError && !error.response)
}

/** The backend's error body, or null. */
function getErrorBody(error) {
  const data = error?.response?.data
  return data && typeof data === 'object' ? data : null
}

/** The machine-readable code, e.g. "VALIDATION_FAILED", or null. */
export function getErrorCode(error) {
  return getErrorBody(error)?.code ?? null
}

/** The HTTP status, e.g. 409, or null for network errors. */
export function getErrorStatus(error) {
  return error?.response?.status ?? null
}

/** One human-readable sentence describing what went wrong. */
export function getErrorMessage(error, fallback = 'Something went wrong. Try again.') {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE

  const body = getErrorBody(error)
  if (body?.code && FRIENDLY_MESSAGES[body.code]) return FRIENDLY_MESSAGES[body.code]
  if (body?.message) return body.message

  // Not an API error at all (e.g. a bug in our own code)
  if (error instanceof Error && !error.isAxiosError) return error.message || fallback
  return fallback
}

/** Per-field validation messages, e.g. { password: "must contain..." }. Empty object if none. */
export function getFieldErrors(error) {
  const fieldErrors = getErrorBody(error)?.fieldErrors
  return fieldErrors && typeof fieldErrors === 'object' ? fieldErrors : {}
}