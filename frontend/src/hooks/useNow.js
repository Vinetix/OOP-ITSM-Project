// The current time, refreshed every `ms` milliseconds, for live countdowns.
import { useEffect, useState } from 'react'

export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(timer)
  }, [ms])
  return now
}
