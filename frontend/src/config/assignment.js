// Friendly names for the assignment strategies, and the Smart score's factors
// (from the API contract) for the "How Smart scoring works" panel.

const STRATEGY_LABELS = {
  SKILL_BASED: 'Skill-based',
  LEAST_LOADED: 'Least loaded',
  SMART: 'Smart (recommended)',
}

export const strategyLabel = (name) => STRATEGY_LABELS[name] ?? name

export const SMART_FACTORS = [
  { factor: 'Has a skill in the incident’s category', points: '40' },
  { factor: 'Free capacity (share of their limit unused)', points: 'up to 25' },
  { factor: 'Earlier incidents resolved on the same service', points: '5 each, up to 15' },
  { factor: 'Experience', points: '1 per year, up to 10' },
  { factor: 'Senior technician on a P1 or P2 incident', points: '10' },
]

// a technician's availability in words, with the lamp tone to show it
export function availabilityOf(w) {
  if (!w.active) return { label: 'Deactivated', tone: 'stop' }
  if (!w.available) return { label: 'Unavailable', tone: 'off' }
  return { label: 'Available', tone: 'go' }
}
