// The backend's priority formula, used only for the "estimated priority" hint on
// the report form. The server's answer is always the one that counts.

const WEIGHTS = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }

export function estimatePriority(impact, urgency, criticality, affectedUsers = 1) {
  if (!WEIGHTS[impact] || !WEIGHTS[urgency] || !WEIGHTS[criticality]) return null
  const base = WEIGHTS[impact] * WEIGHTS[urgency] * WEIGHTS[criticality]
  const users = Number(affectedUsers) || 1
  const multiplier = users >= 1000 ? 1.5 : users >= 100 ? 1.25 : 1
  const score = Math.round(base * multiplier)
  const priority = score >= 32 ? 'P1' : score >= 16 ? 'P2' : score >= 6 ? 'P3' : 'P4'
  return { score, priority, base, multiplier }
}
