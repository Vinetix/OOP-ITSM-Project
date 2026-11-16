// Asks the server for a suggested category and similar open incidents ~600 ms
// after typing stops (title of 5+ characters). Only the newest request may
// update the form, so a slow old answer can't overwrite a fresh one.
import { useEffect, useRef, useState } from 'react'
import { intelligenceApi } from '@/api/intelligenceApi'

export function useSmartHelp({ title, description, serviceId }) {
  const [suggestions, setSuggestions] = useState([])
  const [similar, setSimilar] = useState([])
  const latest = useRef(0)

  useEffect(() => {
    const text = { title: title.trim(), description: description.trim() }
    const timer = setTimeout(async () => {
      const ticket = ++latest.current
      if (text.title.length < 5) {
        setSuggestions([])
        setSimilar([])
        return
      }
      // each part fails quietly: help is a bonus, never a blocker
      const [cats, dups] = await Promise.all([
        intelligenceApi.suggestCategory(text).catch(() => null),
        intelligenceApi.checkDuplicates({ ...text, serviceId }).catch(() => null),
      ])
      if (ticket !== latest.current) return
      if (cats) setSuggestions(cats)
      if (dups) setSimilar(dups)
    }, 600)
    return () => clearTimeout(timer)
  }, [title, description, serviceId])

  return { suggestions, similar }
}
