// The unread-notification count, shared by the bell and the menu badge.
// There's no push from the server, so it asks every 30 seconds while signed in,
// skips while the tab is hidden, asks once on coming back, and ignores errors
// quietly (a toast every 30 seconds would be awful). Screens call refresh()
// right after an action so the badge doesn't wait for the next poll.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { notificationsApi } from '@/api/notificationsApi'
import { useAuth } from '@/auth/AuthContext'

const POLL_MS = 30_000
const NotificationsContext = createContext({ unread: 0, refresh: () => {} })

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    try {
      setUnread(await notificationsApi.unreadCount())
    } catch {
      // polling must stay silent; a real 401 is handled by the API client anyway
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const first = setTimeout(refresh, 0) // straight after sign-in
    const whenVisible = () => document.visibilityState === 'visible' && refresh()
    const timer = setInterval(whenVisible, POLL_MS)
    document.addEventListener('visibilitychange', whenVisible)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', whenVisible)
    }
  }, [isAuthenticated, refresh])

  // after logout the last count would linger, so show 0 instead
  const value = { unread: isAuthenticated ? unread : 0, refresh }
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationsContext)
