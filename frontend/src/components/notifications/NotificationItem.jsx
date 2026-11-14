// One notification: icon, title, two lines of body, when. Unread ones get a dot
// and a bold title; important ones (someone has to act) get an amber edge.
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notificationIcon } from '@/config/notifications'
import { formatDateTime } from '@/lib/format'
import { timeSince } from '@/lib/time'
import { cn } from '@/lib/utils'

export function NotificationContent({ notification: n }) {
  const Icon = notificationIcon(n.type)
  return (
    <span className="flex w-full min-w-0 items-start gap-3 text-left">
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          n.important
            ? 'bg-lamp-caution/15 text-[color:color-mix(in_oklab,var(--lamp-caution)_70%,black)]'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="flex items-start gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 text-sm leading-snug',
              n.read ? 'font-medium' : 'font-bold',
            )}
          >
            {n.title}
          </span>
          {!n.read && (
            <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-role" />
          )}
        </span>
        {n.body && <span className="line-clamp-2 text-sm text-muted-foreground">{n.body}</span>}
        <time
          dateTime={n.createdAt}
          title={formatDateTime(n.createdAt)}
          className="text-xs text-muted-foreground"
        >
          {timeSince(n.createdAt)}
          {n.important && ' · needs action'}
        </time>
      </span>
    </span>
  )
}

// a full row for lists: the whole row opens it; unread rows get a small "Mark read" button
export function NotificationItem({ notification: n, onOpen, onMarkRead }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 border-l-[3px] px-4 py-3 transition-colors',
        n.important ? 'border-l-lamp-caution' : 'border-l-transparent',
        !n.read && 'bg-role-soft/50',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(n)}
        className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <NotificationContent notification={n} />
      </button>
      {!n.read && onMarkRead && (
        <Button variant="ghost" size="sm" onClick={() => onMarkRead(n)} className="shrink-0">
          <Check aria-hidden="true" />
          Mark read
        </Button>
      )}
    </div>
  )
}
