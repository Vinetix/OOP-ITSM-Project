// A signal lamp: the small coloured dot used for every status in the app.
// lit = solid with a soft halo; unlit = hollow ring.
// One tone, one meaning: go (active/online/available), caution (soon/warning),
// stop (inactive/offline), off (not applicable), role (current role colour).
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