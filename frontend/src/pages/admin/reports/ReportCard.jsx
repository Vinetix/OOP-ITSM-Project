// The frame every report card shares: title, optional action, and its own
// loading and error state, so one failing report never blanks the page.
import { ErrorAlert } from '@/components/ErrorAlert'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ReportCard({
  title,
  description,
  state,
  action,
  className,
  children,
  height = 'h-64',
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        {state.error ? (
          <ErrorAlert
            error={state.error}
            title={`Couldn’t load “${title}”`}
            onRetry={state.reload}
          />
        ) : !state.data ? (
          <Skeleton className={`${height} w-full`} />
        ) : (
          children(state.data)
        )}
      </CardContent>
    </Card>
  )
}
