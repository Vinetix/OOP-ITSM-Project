// The bell in the top bar: a red count when there's anything unread, and a
// dropdown with the latest 8, fetched each time it opens (not on every poll).
import { useState } from 'react'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { notificationsApi } from '@/api/notificationsApi'
import { useAuth } from '@/auth/AuthContext'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { getRoleHome } from '@/config/roles'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/notifications/NotificationsContext'
import { useOpenNotification } from '@/notifications/useOpenNotification'
import { NotificationContent } from './NotificationItem'

export const countLabel = (n) => (n > 99 ? '99+' : String(n))

export function NotificationBell() {
  const { user } = useAuth()
  const { unread, refresh } = useNotifications()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    setError(null)
    try {
      setItems((await notificationsApi.list({ size: 8 })).content)
    } catch (err) {
      setError(err)
    }
  }

  const { open } = useOpenNotification({
    onChanged: (updated) =>
      setItems((list) => list?.map((n) => (n.id === updated.id ? updated : n))),
    onGone: load,
  })

  async function markAll(event) {
    event.preventDefault() // keep the dropdown open
    try {
      await notificationsApi.markAllRead()
      setItems((list) => list?.map((n) => ({ ...n, read: true })))
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <DropdownMenu modal={false} onOpenChange={(isOpen) => isOpen && load()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] leading-none font-bold text-white ring-2 ring-background">
              {countLabel(unread)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="font-bold">Notifications</span>
          <Button variant="ghost" size="sm" onClick={markAll} disabled={unread === 0}>
            <CheckCheck aria-hidden="true" />
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[60svh] overflow-y-auto">
          {error ? (
            <div className="p-3">
              <ErrorAlert error={error} title="Couldn’t load notifications" onRetry={load} />
            </div>
          ) : !items ? (
            <div className="grid gap-2 p-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
              <BellOff aria-hidden="true" className="size-5" />
              You’re all caught up.
            </div>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => open(n)}
                className={cn(
                  'rounded-none border-l-[3px] px-4 py-3',
                  n.important ? 'border-l-lamp-caution' : 'border-l-transparent',
                  !n.read && 'bg-role-soft/50',
                )}
              >
                <NotificationContent notification={n} />
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild className="justify-center rounded-none py-2.5 font-semibold">
          <Link to={`${getRoleHome(user.role)}/notifications`}>View all</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
