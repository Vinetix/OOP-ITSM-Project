// The latest few notifications in a card, for the home pages. It reloads
// whenever the unread count changes, so it never lags behind the bell.
import { BellOff } from 'lucide-react'
import { Link } from 'react-router'
import { notificationsApi } from '@/api/notificationsApi'
import { useAuth } from '@/auth/AuthContext'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getRoleHome } from '@/config/roles'
import { useAsync } from '@/hooks/useAsync'
import { useNotifications } from '@/notifications/NotificationsContext'
import { useOpenNotification } from '@/notifications/useOpenNotification'
import { NotificationItem } from './NotificationItem'

export function RecentNotifications({ size = 3, className }) {
  const { user } = useAuth()
  const { unread } = useNotifications()
  const list = useAsync(() => notificationsApi.list({ size }), [size, unread])
  const { open } = useOpenNotification({ onGone: list.reload })
  const items = list.data?.content

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Recent notifications</CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to={`${getRoleHome(user.role)}/notifications`}>View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      {list.error ? (
        <div className="px-6">
          <ErrorAlert
            error={list.error}
            title="Couldn’t load notifications"
            onRetry={list.reload}
          />
        </div>
      ) : !items ? (
        <div className="grid gap-2 px-6">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="flex items-center gap-2 px-6 text-sm text-muted-foreground">
          <BellOff aria-hidden="true" className="size-4" />
          Nothing yet.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationItem notification={n} onOpen={open} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
