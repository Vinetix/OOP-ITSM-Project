// Small indicator that pings GET /api/system/info:
// green "Server online" or red "Server offline". Re-checks every 30 seconds
// and when the user clicks it, so it recovers once the backend is started.
import { useCallback, useEffect, useState } from 'react'
import { systemApi } from '@/api/systemApi'
import { cn } from '@/lib/utils'
import { Lamp } from './Lamp'

const RECHECK_MS = 30_000

export function BackendStatus({ className }) {
  const [state, setState] = useState('checking') // 'checking' | 'online' | 'offline'

  const check = useCallback(async () => {
    try {
      const info = await systemApi.getInfo()
      setState(info?.status === 'UP' ? 'online' : 'offline')
    } catch {
      setState('offline')
    }
  }, [])

  useEffect(() => {
    // first check right away, then on a timer
    const first = setTimeout(check, 0)
    const timer = setInterval(check, RECHECK_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [check])

  const view = {
    checking: { tone: 'off', label: 'Checking server', pulse: true },
    online: { tone: 'go', label: 'Server online' },
    offline: { tone: 'stop', label: 'Server offline' },
  }[state]

  return (
    <button
      type="button"
      onClick={() => {
        setState('checking')
        check()
      }}
      title="Check the server again"
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      <Lamp tone={view.tone} pulse={view.pulse} />
      <span aria-live="polite">{view.label}</span>
    </button>
  )
}