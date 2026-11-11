// Categories, IT services and skills share one shape of endpoints, so one
// factory builds the same set of methods for each of them.
import { axiosClient } from './axiosClient'

function catalogResource(path) {
  return {
    // active items only, unless an admin asks for the inactive ones too
    list: ({ includeInactive = false } = {}) =>
      axiosClient
        .get(path, { params: includeInactive ? { includeInactive: true } : undefined })
        .then((res) => res.data),
    get: (id) => axiosClient.get(`${path}/${id}`).then((res) => res.data),
    create: (data) => axiosClient.post(path, data).then((res) => res.data),
    update: (id, data) => axiosClient.put(`${path}/${id}`, data).then((res) => res.data),
    activate: (id) => axiosClient.patch(`${path}/${id}/activate`).then((res) => res.data),
    deactivate: (id) => axiosClient.patch(`${path}/${id}/deactivate`).then((res) => res.data),
  }
}

export const categoriesApi = catalogResource('/api/categories')
export const servicesApi = catalogResource('/api/services')
export const skillsApi = catalogResource('/api/skills')
