// What happens when someone clicks a notification: mark it read (if unread),
// update the badge, then open its incident if it has one. Also a plain
// "mark read" for the per-item button. onChanged gets the updated notification.
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { notificationsApi } from '@/api/notificationsApi'
import { useAuth } from '@/auth/AuthContext'
import { getRoleHome } from '@/config/roles'
import { getErrorMessage, getErrorStatus } from '@/lib/errors'
import { useNotifications } from './NotificationsContext'

export function useOpenNotification({ onChanged, onGone } = {}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refresh } = useNotifications()

  async function markRead(notification) {
    if (notification.read) return notification
    try {
      const updated = await notificationsApi.markRead(notification.id)
      onChanged?.(updated)
      refresh()
      return updated
    } catch (error) {
      toast.error(getErrorMessage(error))
      if (getErrorStatus(error) === 404) onGone?.() // not ours (or gone): reload the list
      return null
    }
  }

  async function open(notification) {
    const result = await markRead(notification)
    if (result && notification.incidentId) {
      navigate(`${getRoleHome(user.role)}/incidents/${notification.incidentId}`)
    }
  }

  return { open, markRead }
}
