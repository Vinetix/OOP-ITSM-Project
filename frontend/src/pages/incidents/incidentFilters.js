// The incident search filters: reading them from the URL (dropping anything
// invalid), turning them into API parameters, and describing them as chips.
import { PRIORITIES } from '@/config/catalog'
import { STATUSES } from '@/config/incidents'
import { SLA_STATUSES } from '@/config/sla'
import { isIsoDate } from '@/lib/dates'

export const FILTER_KEYS = [
  'q',
  'status',
  'priority',
  'categoryId',
  'serviceId',
  'technicianId',
  'reporterId',
  'reportedFrom',
  'reportedTo',
  'slaStatus',
  'escalatedOnly',
]

const list = (raw, allowed) => (raw ?? '').split(',').filter((v) => allowed(v))
const id = (raw) => (/^\d+$/.test(raw ?? '') ? raw : '')

export function parseFilters(params) {
  return {
    q: (params.get('q') ?? '').trim(),
    status: list(params.get('status'), (s) => STATUSES[s]),
    priority: list(params.get('priority'), (p) => PRIORITIES.some((x) => x.value === p)),
    categoryId: id(params.get('categoryId')),
    serviceId: id(params.get('serviceId')),
    technicianId: id(params.get('technicianId')),
    reporterId: id(params.get('reporterId')),
    reportedFrom: isIsoDate(params.get('reportedFrom')) ? params.get('reportedFrom') : '',
    reportedTo: isIsoDate(params.get('reportedTo')) ? params.get('reportedTo') : '',
    slaStatus: SLA_STATUSES[params.get('slaStatus')] ? params.get('slaStatus') : '',
    escalatedOnly: params.get('escalatedOnly') === 'true',
  }
}

// only what's set; lists joined with commas, as the API expects
export function toApiParams(f) {
  return {
    q: f.q || undefined,
    status: f.status.join(',') || undefined,
    priority: f.priority.join(',') || undefined,
    categoryId: f.categoryId || undefined,
    serviceId: f.serviceId || undefined,
    technicianId: f.technicianId || undefined,
    reporterId: f.reporterId || undefined,
    reportedFrom: f.reportedFrom || undefined,
    reportedTo: f.reportedTo || undefined,
    slaStatus: f.slaStatus || undefined,
    escalatedOnly: f.escalatedOnly || undefined,
  }
}

// how a filter is written back into the URL ('' removes it)
export function toParam(key, value) {
  if (Array.isArray(value)) return value.join(',')
  if (typeof value === 'boolean') return value ? 'true' : ''
  return value ?? ''
}

// the panel's filters (search box excluded), counted for the "Filters (3)" button
export function countActive(f) {
  return [
    f.status.length,
    f.priority.length,
    f.categoryId,
    f.serviceId,
    f.technicianId,
    f.reporterId,
    f.reportedFrom || f.reportedTo,
    f.slaStatus,
    f.escalatedOnly,
  ].filter(Boolean).length
}
