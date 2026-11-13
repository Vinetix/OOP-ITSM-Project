// Labels, descriptions and colours for incident values (status, impact, urgency,
// SLA status, note type) and the list options shared by every incident screen.

export const STATUSES = {
  NEW: { label: 'New', tone: 'grey' },
  CLASSIFIED: { label: 'Awaiting assignment', tone: 'slate' },
  ASSIGNED: { label: 'Assigned', tone: 'blue' },
  ACKNOWLEDGED: { label: 'Acknowledged', tone: 'indigo' },
  IN_PROGRESS: { label: 'In progress', tone: 'amber' },
  AWAITING_INFO: { label: 'Waiting for reporter', tone: 'purple' },
  RESOLVED: { label: 'Resolved', tone: 'teal' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  CLOSED: { label: 'Closed', tone: 'ink' },
}

// the main line the stepper draws; AWAITING_INFO hangs off IN_PROGRESS
export const LIFECYCLE = [
  'CLASSIFIED',
  'ASSIGNED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
]

export const IMPACTS = [
  { value: 'LOW', label: 'Low', description: 'Affects a single user' },
  { value: 'MEDIUM', label: 'Medium', description: 'Affects a team' },
  { value: 'HIGH', label: 'High', description: 'Affects a department, site or many users' },
  {
    value: 'CRITICAL',
    label: 'Critical',
    description: 'Affects the whole organisation or customers',
  },
]

export const URGENCIES = [
  { value: 'LOW', label: 'Low', description: 'Can wait; a workaround exists' },
  { value: 'MEDIUM', label: 'Medium', description: 'Work is slowed down' },
  { value: 'HIGH', label: 'High', description: 'Work is blocked' },
  { value: 'CRITICAL', label: 'Critical', description: 'Immediate business or financial loss' },
]

// SLA status uses the status lamps: one colour, one meaning
export const SLA_STATUSES = {
  ON_TRACK: { label: 'On track', tone: 'go' },
  AT_RISK: { label: 'At risk', tone: 'caution' },
  BREACHED: { label: 'Breached', tone: 'stop' },
  MET: { label: 'Met', tone: 'go' },
}

export const NOTE_TYPES = {
  COMMENT: { label: 'Comment' },
  WORK_NOTE: { label: 'Work note' },
  INFO_REQUEST: { label: 'Question from technician' },
  INFO_RESPONSE: { label: 'Answer from reporter' },
  REOPEN: { label: 'Reopen reason' },
}

export const SORTS = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'priority,asc', label: 'Priority (P1 first)' },
  { value: 'sla.resolutionDueAt,asc', label: 'Deadline (soonest first)' },
]

export const labelOf = (list, value) => list.find((x) => x.value === value)?.label ?? value
