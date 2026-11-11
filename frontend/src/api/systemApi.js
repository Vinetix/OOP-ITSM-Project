import { axiosClient } from './axiosClient'

export const systemApi = {
  getInfo: () => axiosClient.get('/api/system/info').then((res) => res.data),
}
