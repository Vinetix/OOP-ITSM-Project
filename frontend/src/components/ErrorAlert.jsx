// A failed load, with the reason and a Retry button.
import { CircleAlert, RotateCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

export function ErrorAlert({ error, title = 'Couldn’t load this', onRetry, className }) {
  if (!error) return null
  return (
    <Alert variant="destructive" className={cn('bg-card', className)}>
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{getErrorMessage(error)}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            <RotateCw aria-hidden="true" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
