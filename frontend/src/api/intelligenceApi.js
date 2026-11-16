// Smart help for the report form: which category the text sounds like, and
// whether a similar open incident already exists. Both need a non-blank title.
import { axiosClient } from './axiosClient'

export const intelligenceApi = {
  suggestCategory: ({ title, description }) =>
    axiosClient
      .post('/api/intelligence/category-suggestion', {
        title,
        description: description || undefined,
      })
      .then((res) => res.data),
  checkDuplicates: ({ title, description, serviceId }) =>
    axiosClient
      .post('/api/intelligence/duplicates/check', {
        title,
        description: description || undefined,
        serviceId: serviceId ? Number(serviceId) : undefined,
      })
      .then((res) => res.data),
}
