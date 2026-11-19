// Smart help for the report form: which category the text sounds like, and
// whether a similar open incident already exists. Both need a non-blank title.
import { axiosClient } from './axiosClient'

const MIN_TITLE = 5
const MAX_TITLE = 150 // backend limits: longer text gets 400
const MAX_DESCRIPTION = 4000

// Only ever send what the backend accepts: a trimmed title of 5–150 characters,
// an optional description of up to 4000, and serviceId as a number or not at all.
// Returns null when there is nothing worth asking about yet.
function smartHelpBody({ title, description, serviceId }) {
  const cleanTitle = (title ?? '').trim().slice(0, MAX_TITLE)
  if (cleanTitle.length < MIN_TITLE) return null
  const id = Number(serviceId)
  return {
    title: cleanTitle,
    description: (description ?? '').trim().slice(0, MAX_DESCRIPTION) || undefined,
    serviceId: serviceId && Number.isInteger(id) ? id : undefined,
  }
}

// Older servers send no `source`, and AI picks may omit keyword fields:
// fill the gaps here so the screens can trust the shape.
function normaliseSuggestion(item) {
  const source = item.source === 'AI' ? 'AI' : 'KEYWORDS'
  return {
    ...item,
    source,
    reason: source === 'AI' && item.reason ? String(item.reason).trim() : undefined,
    matchCount: item.matchCount ?? 0,
    matchedKeywords: Array.isArray(item.matchedKeywords) ? item.matchedKeywords : [],
  }
}

export const intelligenceApi = {
  suggestCategory: async ({ title, description }) => {
    const body = smartHelpBody({ title, description })
    if (!body) return []
    const res = await axiosClient.post('/api/intelligence/category-suggestion', {
      title: body.title,
      description: body.description,
    })
    return Array.isArray(res.data) ? res.data.map(normaliseSuggestion) : []
  },
  checkDuplicates: async ({ title, description, serviceId }) => {
    const body = smartHelpBody({ title, description, serviceId })
    if (!body) return []
    const res = await axiosClient.post('/api/intelligence/duplicates/check', body)
    return Array.isArray(res.data) ? res.data : []
  },
  // { aiEnabled, provider? }: whether category suggestions come from an AI model
  status: () => axiosClient.get('/api/intelligence/status').then((res) => res.data),
}
