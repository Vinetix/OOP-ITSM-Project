// The small amber "Soon" tag for features that arrive in a later phase.
import { cn } from '@/lib/utils'

export function SoonTag({ className }) {
  return (
    <span
      className={cn(
        'rounded-sm border border-lamp-caution/40 px-1 py-px text-[0.7rem] leading-none font-semibold text-[color-mix(in_oklab,var(--lamp-caution)_60%,black)]',
        className,
      )}
    >
      Soon
    </span>
  )
}