import { axiosClient } from './axiosClient'

export const systemApi = {
  /** GET /api/system/info → { application, status, serverTime } */
  getInfo: () => axiosClient.get('/api/system/info').then((res) => res.data),
}