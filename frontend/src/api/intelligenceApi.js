// Smart help for the report form: which category the text sounds like, and
// whether a similar open incident already exists. Both need a non-blank title.
import { axiosClient } from './axiosClient'

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
  suggestCategory: ({ title, description }) =>
    axiosClient
      .post('/api/intelligence/category-suggestion', {
        title,
        description: description || undefined,
      })
      .then((res) => (Array.isArray(res.data) ? res.data.map(normaliseSuggestion) : [])),
  checkDuplicates: ({ title, description, serviceId }) =>
    axiosClient
      .post('/api/intelligence/duplicates/check', {
        title,
        description: description || undefined,
        serviceId: serviceId ? Number(serviceId) : undefined,
      })
      .then((res) => res.data),
  // { aiEnabled, provider? }: whether category suggestions come from an AI model
  status: () => axiosClient.get('/api/intelligence/status').then((res) => res.data),
}
