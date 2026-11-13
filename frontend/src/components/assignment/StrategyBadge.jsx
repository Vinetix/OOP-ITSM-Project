// The name of an assignment strategy as a pill.
import { strategyLabel } from '@/config/assignment'
import { cn } from '@/lib/utils'

export function StrategyBadge({ name, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-role/30 bg-role-soft px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        className,
      )}
    >
      {strategyLabel(name)}
    </span>
  )
}
