// SLA violations and the background monitor (admin only).
import { axiosClient } from './axiosClient'

const clean = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )

export const slaMonitorApi = {
  violations: ({
    target,
    priority,
    incidentNumber,
    page = 0,
    size = 20,
    sort = 'detectedAt,desc',
  } = {}) =>
    axiosClient
      .get('/api/sla/violations', {
        params: clean({ target, priority, incidentNumber, page, size, sort }),
      })
      .then((res) => res.data),
  // runs the same check the backend does every minute, right now
  runMonitor: () => axiosClient.post('/api/sla/monitor/run').then((res) => res.data),
}
