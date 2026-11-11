// Loading indicator: three signal lamps lighting in turn.
// fullPage centres it on the screen (used while the session is restored).
import { cn } from '@/lib/utils'

export function LoadingState({ label = 'Loading', fullPage = false, className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-4 text-muted-foreground',
        fullPage ? 'min-h-svh' : 'py-16',
        className,
      )}
    >
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2.5 animate-pulse rounded-full bg-role"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <p className="text-sm">{label}…</p>
    </div>
  )
}