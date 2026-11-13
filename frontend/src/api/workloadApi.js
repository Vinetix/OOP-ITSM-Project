// Technician workload: active incidents against each technician's limit.
import { axiosClient } from './axiosClient'

export const workloadApi = {
  getAll: () => axiosClient.get('/api/workload').then((res) => res.data), // admin, by name
  getMine: () => axiosClient.get('/api/workload/me').then((res) => res.data), // technician
}
