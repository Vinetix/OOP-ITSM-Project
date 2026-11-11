import { axiosClient } from './axiosClient'

export const authApi = {
  login: ({ email, password }) =>
    axiosClient.post('/api/auth/login', { email, password }).then((res) => res.data),

  register: (data) => axiosClient.post('/api/auth/register', data).then((res) => res.data),
}
