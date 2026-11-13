// Calls refresh() when the tab comes back into view, and every `intervalMs`
// while it's visible, so pages shared by several people don't go stale.
import { useEffect, useRef } from 'react'

export function useAutoRefresh(refresh, { enabled = true, intervalMs = 30_000 } = {}) {
  const latest = useRef(refresh)
  useEffect(() => {
    latest.current = refresh
  })

  useEffect(() => {
    if (!enabled) return
    const run = () => document.visibilityState === 'visible' && latest.current()
    const timer = setInterval(run, intervalMs)
    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', run)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', run)
    }
  }, [enabled, intervalMs])
}
