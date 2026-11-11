// Label/value pairs for details panels.
import { cn } from '@/lib/utils'

export function InfoList({ items, className }) {
  return (
    <dl className={cn('divide-y divide-border', className)}>
      {items
        .filter((item) => item.value !== undefined)
        .map((item) => (
          <div
            key={item.label}
            className="grid gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-4"
          >
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="min-w-0 font-medium break-words">{item.value}</dd>
          </div>
        ))}
    </dl>
  )
}
