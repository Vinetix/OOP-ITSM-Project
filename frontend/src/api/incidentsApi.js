// Incidents: report, list, read, edit, notes, and the nine lifecycle actions.
// Every action returns the updated incident, so pages just swap it in.
import { axiosClient } from './axiosClient'

const data = (res) => res.data
const action = (id, name, body) => axiosClient.post(`/api/incidents/${id}/${name}`, body).then(data)

export const incidentsApi = {
  report: (body) => axiosClient.post('/api/incidents', body).then(data),

  // every filter is optional and they combine with AND; lists are comma-joined
  // ('AWAITING_INFO,RESOLVED', 'P1,P2'); empty ones are left out of the URL
  list: ({ page = 0, size = 20, sort = 'createdAt,desc', ...filters } = {}) =>
    axiosClient
      .get('/api/incidents', {
        params: {
          ...Object.fromEntries(
            Object.entries(filters).filter(
              ([, v]) => v !== undefined && v !== null && v !== '' && v !== false,
            ),
          ),
          page,
          size,
          sort,
        },
      })
      .then(data),

  get: (id) => axiosClient.get(`/api/incidents/${id}`).then(data),

  // send only the fields that changed
  update: (id, changes) => axiosClient.patch(`/api/incidents/${id}`, changes).then(data),

  addNote: (id, message) => action(id, 'notes', { message }),

  // duplicates: candidates (admin or assigned technician), link and unlink
  similar: (id) => axiosClient.get(`/api/incidents/${id}/similar`).then(data),
  linkDuplicate: (id, primaryIncidentId) =>
    axiosClient.post(`/api/incidents/${id}/duplicate-of`, { primaryIncidentId }).then(data),
  unlinkDuplicate: (id) => axiosClient.delete(`/api/incidents/${id}/duplicate-of`).then(data),

  assign: (id, technicianId) => action(id, 'assign', { technicianId }),
  // the active strategy's top candidate (skips the current technician)
  autoAssign: (id) => action(id, 'auto-assign'),
  // ranking without assigning; strategy empty = the active one
  recommendations: (id, strategy) =>
    axiosClient
      .get(`/api/incidents/${id}/recommendations`, { params: strategy ? { strategy } : undefined })
      .then(data),
  acknowledge: (id) => action(id, 'acknowledge'),
  start: (id) => action(id, 'start'),
  requestInfo: (id, message) => action(id, 'request-info', { message }),
  provideInfo: (id, message) => action(id, 'provide-info', { message }),
  resolve: (id, { resolutionSummary, rootCause }) =>
    action(id, 'resolve', { resolutionSummary, rootCause }),
  verify: (id, { rating, feedback } = {}) => action(id, 'verify', { rating, feedback }),
  reopen: (id, message) => action(id, 'reopen', { message }),
  close: (id, closureNote) => action(id, 'close', { closureNote }),
}
