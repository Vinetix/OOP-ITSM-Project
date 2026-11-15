// SLA status labels and lamp tones, and what each escalation level means.

export const SLA_STATUSES = {
  ON_TRACK: { label: 'On track', tone: 'go' },
  AT_RISK: { label: 'At risk', tone: 'caution' },
  BREACHED: { label: 'Breached', tone: 'stop' },
  MET: { label: 'Met', tone: 'go' },
}

// level → what happened, and the tag colour (amber, orange, red)
export const ESCALATION_LEVELS = {
  1: {
    label: 'Technician reminded',
    alerted: 'the assigned technician was reminded',
    tone: 'amber',
  },
  2: { label: 'Seniors alerted', alerted: 'senior technicians alerted', tone: 'orange' },
  3: { label: 'Admins alerted', alerted: 'admins alerted', tone: 'red' },
}
