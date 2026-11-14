// Who did it: a person with their role tag, or "System" for automatic steps.
import { Bot } from 'lucide-react'
import { RoleBadge } from '@/components/RoleBadge'
import { cn } from '@/lib/utils'

export function ActorLabel({ entry, className }) {
  if (entry.system) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs font-semibold',
          className,
        )}
      >
        <Bot aria-hidden="true" className="size-3.5" />
        System
      </span>
    )
  }
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      <span className="font-medium">{entry.actorName}</span>
      {entry.actorRole && <RoleBadge role={entry.actorRole} />}
    </span>
  )
}
