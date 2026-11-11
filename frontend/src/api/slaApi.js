// SLA policies (admin only): a DEFAULT policy per priority, plus optional
// overrides for individual services.
import { axiosClient } from './axiosClient'

export const slaApi = {
  // with serviceId: only that service's overrides
  list: ({ serviceId } = {}) =>
    axiosClient
      .get('/api/sla-policies', { params: serviceId ? { serviceId } : undefined })
      .then((res) => res.data),

  // what an incident would actually get: the override if there is one, else the default
  effective: ({ priority, serviceId }) =>
    axiosClient
      .get('/api/sla-policies/effective', {
        params: serviceId ? { priority, serviceId } : { priority },
      })
      .then((res) => res.data),

  // serviceId null creates a DEFAULT policy
  create: ({ serviceId = null, priority, responseMinutes, resolutionMinutes }) =>
    axiosClient
      .post('/api/sla-policies', { serviceId, priority, responseMinutes, resolutionMinutes })
      .then((res) => res.data),

  // only the minutes can change, never the service or priority
  update: (id, { responseMinutes, resolutionMinutes }) =>
    axiosClient
      .put(`/api/sla-policies/${id}`, { responseMinutes, resolutionMinutes })
      .then((res) => res.data),

  // the backend refuses (422) to delete a DEFAULT policy
  remove: (id) => axiosClient.delete(`/api/sla-policies/${id}`).then(() => undefined),
}
