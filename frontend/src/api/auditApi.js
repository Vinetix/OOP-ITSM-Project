// The write-once audit trail: one incident's history, or a filtered search (admin).
import { axiosClient } from './axiosClient'

const data = (res) => res.data

// drop empty filters: never send actorId= or action= with nothing after them
function clean(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && v !== false,
    ),
  )
}

export const auditApi = {
  incidentHistory: (incidentId) =>
    axiosClient.get(`/api/incidents/${incidentId}/history`).then(data),
  search: ({ incidentNumber, actorId, systemOnly, action, from, to, page = 0, size = 20 } = {}) =>
    axiosClient
      .get('/api/audit', {
        params: clean({ incidentNumber, actorId, systemOnly, action, from, to, page, size }),
      })
      .then(data),
}
