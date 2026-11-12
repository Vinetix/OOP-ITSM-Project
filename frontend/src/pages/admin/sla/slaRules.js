// The backend's SLA limits, checked before saving.
import { formatMinutes } from '@/lib/format'

export const MAX_RESPONSE = 10080 // 7 days
export const MAX_RESOLUTION = 43200 // 30 days

export function validateSla({ responseMinutes, resolutionMinutes }) {
  const errors = {}
  if (!responseMinutes) errors.responseMinutes = 'Enter a response time'
  else if (responseMinutes > MAX_RESPONSE) {
    errors.responseMinutes = `Use at most ${formatMinutes(MAX_RESPONSE)}`
  }
  if (!resolutionMinutes) errors.resolutionMinutes = 'Enter a resolution time'
  else if (resolutionMinutes > MAX_RESOLUTION) {
    errors.resolutionMinutes = `Use at most ${formatMinutes(MAX_RESOLUTION)}`
  } else if (responseMinutes && resolutionMinutes < responseMinutes) {
    errors.resolutionMinutes = 'Resolution can’t be quicker than the first response'
  }
  return errors
}
