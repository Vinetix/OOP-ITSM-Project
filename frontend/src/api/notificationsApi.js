// The signed-in user's own notifications. The backend creates them; we only
// read them and mark them read.
import { axiosClient } from './axiosClient'

const data = (res) => res.data

export const notificationsApi = {
  list: ({ unreadOnly = false, page = 0, size = 20 } = {}) =>
    axiosClient
      .get('/api/notifications', {
        params: { ...(unreadOnly ? { unreadOnly: true } : {}), page, size },
      })
      .then(data),
  unreadCount: () =>
    axiosClient.get('/api/notifications/unread-count').then((res) => res.data.unread),
  markRead: (id) => axiosClient.post(`/api/notifications/${id}/read`).then(data),
  markAllRead: () => axiosClient.post('/api/notifications/read-all').then(data),
}
