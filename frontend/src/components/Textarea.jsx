// Multi-line text input styled like the other inputs. Works with FormField's `as`.
import { cn } from '@/lib/utils'

export function Textarea({ className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full min-w-0 rounded-lg border border-input bg-popover px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
        'h-auto resize-y', // FormField passes a fixed input height; a textarea needs its own
      )}
      {...props}
    />
  )
}
