import { axiosClient } from './axiosClient'

// Leave out empty filters so the URL stays clean (?role=ADMIN, not ?role=&search=).
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )
}

export const usersApi = {
  // Any signed-in user, about themselves
  getMe: () => axiosClient.get('/api/users/me').then((res) => res.data),

  updateMe: ({ fullName, phone }) =>
    axiosClient.put('/api/users/me', { fullName, phone }).then((res) => res.data),

  changePassword: ({ currentPassword, newPassword }) =>
    axiosClient
      .put('/api/users/me/password', { currentPassword, newPassword })
      .then(() => undefined),

  // technicians only
  setMyAvailability: (available) =>
    axiosClient.patch('/api/users/me/availability', { available }).then((res) => res.data),

  // Admin only
  list: ({ page = 0, size = 20, sort = 'createdAt,desc', ...filters } = {}) =>
    axiosClient
      .get('/api/users', { params: cleanParams({ page, size, sort, ...filters }) })
      .then((res) => res.data),

  listTechnicians: ({ availableOnly = false } = {}) =>
    axiosClient
      .get('/api/users/technicians', {
        params: cleanParams({ availableOnly: availableOnly || undefined }),
      })
      .then((res) => res.data),

  getById: (id) => axiosClient.get(`/api/users/${id}`).then((res) => res.data),

  create: (data) => axiosClient.post('/api/users', data).then((res) => res.data),

  update: (id, data) => axiosClient.put(`/api/users/${id}`, data).then((res) => res.data),

  activate: (id) => axiosClient.patch(`/api/users/${id}/activate`).then((res) => res.data),

  // the backend refuses (422) if you try to deactivate yourself
  deactivate: (id) => axiosClient.patch(`/api/users/${id}/deactivate`).then((res) => res.data),

  // replaces the technician's whole skill list; [] removes them all
  replaceTechnicianSkills: (id, skillIds) =>
    axiosClient.put(`/api/users/${id}/skills`, { skillIds }).then((res) => res.data),
}
