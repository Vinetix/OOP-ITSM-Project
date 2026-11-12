// Labels, hints and tag colours for the catalog's fixed value sets.

export const CRITICALITIES = [
  { value: 'LOW', label: 'Low', tone: 'grey', hint: 'Inconvenient, but people can work around it' },
  { value: 'MEDIUM', label: 'Medium', tone: 'blue', hint: 'Slows a team down' },
  { value: 'HIGH', label: 'High', tone: 'amber', hint: 'A whole department can’t work normally' },
  { value: 'CRITICAL', label: 'Critical', tone: 'red', hint: 'Core business stops' },
]

export const PRIORITIES = [
  { value: 'P1', label: 'Critical', tone: 'red' },
  { value: 'P2', label: 'High', tone: 'orange' },
  { value: 'P3', label: 'Medium', tone: 'yellow' },
  { value: 'P4', label: 'Low', tone: 'slate' },
]

export const criticalityOf = (value) => CRITICALITIES.find((c) => c.value === value)
export const priorityOf = (value) => PRIORITIES.find((p) => p.value === value)

// "P1 – Critical", for dropdowns (plain text, so no styled dot)
export const priorityLabel = (p) => `${p.value} – ${p.label}`
