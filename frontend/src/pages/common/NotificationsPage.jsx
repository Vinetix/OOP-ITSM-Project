// Every notification for the signed-in user, 20 per page, All or Unread.
// The tab and page live in the URL.
import { BellOff, CheckCheck } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { notificationsApi } from '@/api/notificationsApi'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { useNotifications } from '@/notifications/NotificationsContext'
import { useOpenNotification } from '@/notifications/useOpenNotification'

const SIZE = 20

export default function NotificationsPage() {
  const [params, setParams] = useSearchParams()
  const unreadOnly = params.get('tab') === 'unread'
  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0)
  const { unread, refresh } = useNotifications()

  const list = useAsync(
    () => notificationsApi.list({ unreadOnly, page, size: SIZE }),
    [unreadOnly, page],
  )
  const replace = (updated) =>
    list.setData(
      (p) => p && { ...p, content: p.content.map((n) => (n.id === updated.id ? updated : n)) },
    )
  const { open, markRead } = useOpenNotification({ onChanged: replace, onGone: list.reload })

  function go(changes) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(changes)) {
          if (!v) next.delete(k)
          else next.set(k, String(v))
        }
        return next
      },
      { replace: true },
    )
  }

  async function markAll() {
    try {
      const { updated } = await notificationsApi.markAllRead()
      refresh()
      list.reload() // on the Unread tab this empties the list
      toast.success(updated ? `Marked ${updated} as read` : 'Nothing to mark')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const items = list.data?.content
  return (
    <>
      <PageHeader
        title="Notifications"
        description="What’s happened on the incidents you’re involved in."
        actions={
          <Button variant="outline" className="h-10" onClick={markAll} disabled={unread === 0}>
            <CheckCheck aria-hidden="true" />
            Mark all read
          </Button>
        }
      />

      <Tabs
        value={unreadOnly ? 'unread' : 'all'}
        onValueChange={(v) => go({ tab: v === 'unread' ? 'unread' : '', page: '' })}
      >
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="all" className="px-3">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="px-3">
            Unread{unread > 0 && ` (${unread})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {list.error ? (
        <ErrorAlert error={list.error} title="Couldn’t load notifications" onRetry={list.reload} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          {!items ? (
            <div className="grid gap-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={BellOff}
                title={unreadOnly ? 'You’re all caught up' : 'No notifications yet'}
                description={
                  unreadOnly
                    ? 'Nothing unread right now.'
                    : 'You’ll hear here when something happens to your incidents.'
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationItem notification={n} onOpen={open} onMarkRead={markRead} />
                </li>
              ))}
            </ul>
          )}
          {list.data && list.data.totalElements > 0 && (
            <div className="border-t border-border px-5 py-3">
              <Pagination
                page={page}
                totalPages={list.data.totalPages}
                totalElements={list.data.totalElements}
                size={SIZE}
                itemLabel={list.data.totalElements === 1 ? 'notification' : 'notifications'}
                disabled={list.loading}
                onPageChange={(next) => go({ page: next || '' })}
              />
            </div>
          )}
        </Card>
      )}
    </>
  )
}
