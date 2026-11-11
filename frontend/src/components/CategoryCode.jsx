// A category's permanent code, e.g. NETWORK, in monospace because it's an identifier.
import { cn } from '@/lib/utils'

export function CategoryCode({ code, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.72rem] leading-none font-semibold tracking-wide whitespace-nowrap text-foreground',
        className,
      )}
    >
      {code}
    </span>
  )
}
