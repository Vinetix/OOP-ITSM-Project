// What people see instead of a white screen when something breaks while
// drawing a page. Deliberately simple: no data, no router, nothing that could fail again.
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from './Wordmark'

export function CrashScreen({ error }) {
  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <Wordmark />
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="grid max-w-lg gap-5">
          <h1 className="text-4xl leading-tight font-extrabold">Something went wrong</h1>
          <p className="text-lg text-muted-foreground">
            This page hit an unexpected problem. Reloading usually fixes it; your data is safe on
            the server.
          </p>
          {error?.message && (
            <p className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs break-words text-muted-foreground">
              {error.message}
            </p>
          )}
          <div>
            <Button size="lg" className="h-10" onClick={() => window.location.reload()}>
              <RotateCw aria-hidden="true" />
              Reload
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
