import { axiosClient } from './axiosClient'

export const authApi = {
  /** POST /api/auth/login → AuthResponse { accessToken, expiresAt, user } */
  login: ({ email, password }) =>
    axiosClient.post('/api/auth/login', { email, password }).then((res) => res.data),

  /** POST /api/auth/register → AuthResponse. Always creates an EMPLOYEE. */
  register: (data) => axiosClient.post('/api/auth/register', data).then((res) => res.data),
}