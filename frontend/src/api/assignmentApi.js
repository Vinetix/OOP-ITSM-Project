// The admin's assignment settings: which strategy ranks technicians, and
// whether new incidents are assigned automatically.
import { axiosClient } from './axiosClient'

export const assignmentApi = {
  getSettings: () => axiosClient.get('/api/assignment/settings').then((res) => res.data),
  // send only what changed: { strategy } and/or { autoAssignOnReport }
  updateSettings: (changes) =>
    axiosClient.put('/api/assignment/settings', changes).then((res) => res.data),
}
