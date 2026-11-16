// Admin reports. Every report takes an optional from/to (YYYY-MM-DD, `to`
// inclusive); trends takes a number of days instead and ignores the range.
import { axiosClient } from './axiosClient'

const get = (path, { from, to } = {}) =>
  axiosClient
    .get(`/api/reports/${path}`, { params: { ...(from ? { from } : {}), ...(to ? { to } : {}) } })
    .then((res) => res.data)

export const reportsApi = {
  overview: (range) => get('overview', range),
  technicians: (range) => get('technicians', range),
  services: (range) => get('services', range),
  categories: (range) => get('categories', range),
  sla: (range) => get('sla', range),
  trends: (days) =>
    axiosClient.get('/api/reports/trends', { params: { days } }).then((res) => res.data),
}
