// A small square tag with a coloured strip on the left. Used for criticality
// and priority, so they never look like the round status lamps.
import { cn } from '@/lib/utils'

export function ToneTag({ tone = 'grey', className, children, ...props }) {
  return (
    <span
      style={{ '--tag': `var(--tone-${tone})` }}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border border-l-[3px] px-1.5 py-0.5 text-xs leading-none font-semibold whitespace-nowrap',
        'border-[color:color-mix(in_oklab,var(--tag)_35%,transparent)] border-l-[color:var(--tag)]',
        'bg-[color:color-mix(in_oklab,var(--tag)_9%,transparent)] text-[color:color-mix(in_oklab,var(--tag)_72%,black)]',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
