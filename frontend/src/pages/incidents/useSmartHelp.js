// Asks the server for a suggested category and similar open incidents ~600 ms
// after typing stops (title of 5+ characters). The two run separately, so a
// slow AI answer never holds back the duplicate check, and only the newest
// answer of each may update the form.
import { useEffect, useRef, useState } from 'react'
import { intelligenceApi } from '@/api/intelligenceApi'

const DEBOUNCE_MS = 600
const MIN_TITLE = 5
const SPINNER_DELAY_MS = 250 // instant keyword answers shouldn't flash a spinner

export function useSmartHelp({ title, description, serviceId }) {
  const [suggestions, setSuggestions] = useState([])
  const [suggesting, setSuggesting] = useState(false)
  const [showWaiting, setShowWaiting] = useState(false)
  const [similar, setSimilar] = useState([])
  const latestCategory = useRef(0)
  const latestDuplicates = useRef(0)

  function stopWaiting() {
    setSuggesting(false)
    setShowWaiting(false)
  }

  const cleanTitle = title.trim()
  const cleanDescription = description.trim()

  // category: depends on the text only, so changing the service doesn't ask the AI again
  useEffect(() => {
    const timer = setTimeout(async () => {
      const ticket = ++latestCategory.current
      if (cleanTitle.length < MIN_TITLE) {
        setSuggestions([])
        stopWaiting()
        return
      }
      setSuggesting(true)
      let items
      try {
        items = await intelligenceApi.suggestCategory({
          title: cleanTitle,
          description: cleanDescription,
        })
      } catch {
        items = [] // help is a bonus: a failure just means no hint
      }
      if (ticket !== latestCategory.current) return
      setSuggestions(items)
      stopWaiting()
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [cleanTitle, cleanDescription])

  // the "Finding the best category…" note only appears if the answer is slow
  useEffect(() => {
    if (!suggesting) return
    const timer = setTimeout(() => setShowWaiting(true), SPINNER_DELAY_MS)
    return () => clearTimeout(timer)
  }, [suggesting])

  // similar open incidents: also narrowed by the chosen service
  useEffect(() => {
    const timer = setTimeout(async () => {
      const ticket = ++latestDuplicates.current
      if (cleanTitle.length < MIN_TITLE) {
        setSimilar([])
        return
      }
      const found = await intelligenceApi
        .checkDuplicates({ title: cleanTitle, description: cleanDescription, serviceId })
        .catch(() => null)
      if (ticket !== latestDuplicates.current) return
      if (found) setSimilar(found)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [cleanTitle, cleanDescription, serviceId])

  return { suggestions, suggesting: suggesting && showWaiting, similar }
}
