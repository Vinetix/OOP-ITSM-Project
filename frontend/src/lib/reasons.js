// "Skill in DATABASE (+40)" → { text: 'Skill in DATABASE', points: 40 }.
// Skill-based and Least-loaded reasons carry no points: { text, points: null }.

const WITH_POINTS = /^(.*)\s\(\+(\d+)\)$/

export function splitReason(reason = '') {
  const match = reason.match(WITH_POINTS)
  return match ? { text: match[1], points: Number(match[2]) } : { text: reason, points: null }
}
