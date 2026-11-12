// Loads one catalog list (services, categories or skills) and keeps it in step
// with changes made on the page, without reloading everything.
import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'

export function useCatalogList(api) {
  const [includeInactive, setIncludeInactive] = useState(false)
  const list = useAsync(() => api.list({ includeInactive }), [includeInactive])

  // swap in the server's new version of an item; a deactivated one leaves the
  // list unless inactive items are being shown
  function replaceItem(updated) {
    list.setData((items) =>
      (items ?? [])
        .map((item) => (item.id === updated.id ? updated : item))
        .filter((item) => includeInactive || item.active),
    )
  }

  return { ...list, items: list.data ?? [], includeInactive, setIncludeInactive, replaceItem }
}

// Case-insensitive match against any of the given text fields.
export function matchesSearch(query, ...texts) {
  const q = query.trim().toLowerCase()
  return !q || texts.some((t) => t && t.toLowerCase().includes(q))
}
