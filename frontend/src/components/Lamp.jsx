// The status dot used everywhere. One colour, one meaning:
// go = active/online/available, caution = soon, stop = inactive/offline, off = n/a.
import { cn } from '@/lib/utils'

const TONES = {
  go: 'bg-lamp-go text-lamp-go',
  caution: 'bg-lamp-caution text-lamp-caution',
  stop: 'bg-lamp-stop text-lamp-stop',
  off: 'bg-lamp-off text-lamp-off',
  role: 'bg-role text-role',
}

export function Lamp({ tone = 'go', lit = true, pulse = false, className, ...props }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        lit
          ? cn(TONES[tone], 'ring-[3px] ring-current/20')
          : 'border-[1.5px] border-dashed border-lamp-off bg-transparent',
        pulse && 'animate-pulse',
        className,
      )}
      {...props}
    />
  )
}
