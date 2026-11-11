import { axiosClient } from './axiosClient'

// Drops empty filters so we send "?role=ADMIN" rather than "?role=&search=".
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )
}

export const usersApi = {
  // ---- Self-service (any logged-in role) ----

  /** GET /api/users/me → UserResponse */
  getMe: () => axiosClient.get('/api/users/me').then((res) => res.data),

  /** PUT /api/users/me  { fullName, phone } → UserResponse */
  updateMe: ({ fullName, phone }) =>
    axiosClient.put('/api/users/me', { fullName, phone }).then((res) => res.data),

  /** PUT /api/users/me/password → 204 (no body) */
  changePassword: ({ currentPassword, newPassword }) =>
    axiosClient
      .put('/api/users/me/password', { currentPassword, newPassword })
      .then(() => undefined),

  /** PATCH /api/users/me/availability → UserResponse (TECHNICIAN only) */
  setMyAvailability: (available) =>
    axiosClient.patch('/api/users/me/availability', { available }).then((res) => res.data),

  // ---- Management (ADMIN only) ----

  /**
   * GET /api/users → Page { content, page, size, totalElements, totalPages, last }
   * @param {{ page?: number, size?: number, sort?: string,
   *           role?: string, active?: boolean, search?: string }} params
   */
  list: ({ page = 0, size = 20, sort = 'createdAt,desc', ...filters } = {}) =>
    axiosClient
      .get('/api/users', { params: cleanParams({ page, size, sort, ...filters }) })
      .then((res) => res.data),

  /** GET /api/users/technicians → UserResponse[] sorted by name */
  listTechnicians: ({ availableOnly = false } = {}) =>
    axiosClient
      .get('/api/users/technicians', {
        params: cleanParams({ availableOnly: availableOnly || undefined }),
      })
      .then((res) => res.data),

  /** GET /api/users/{id} → UserResponse */
  getById: (id) => axiosClient.get(`/api/users/${id}`).then((res) => res.data),

  /** POST /api/users  CreateUserRequest → UserResponse */
  create: (data) => axiosClient.post('/api/users', data).then((res) => res.data),

  /** PUT /api/users/{id}  UpdateUserRequest → UserResponse */
  update: (id, data) => axiosClient.put(`/api/users/${id}`, data).then((res) => res.data),

  /** PATCH /api/users/{id}/activate → UserResponse */
  activate: (id) => axiosClient.patch(`/api/users/${id}/activate`).then((res) => res.data),

  /** PATCH /api/users/{id}/deactivate → UserResponse (422 if it is yourself) */
  deactivate: (id) => axiosClient.patch(`/api/users/${id}/deactivate`).then((res) => res.data),
}