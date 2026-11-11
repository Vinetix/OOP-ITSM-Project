// A role in its own colour, whoever is looking.
import { ROLE_CONFIG } from '@/config/roles'
import { cn } from '@/lib/utils'

// spelled out in full so Tailwind can find the class names
const STYLES = {
  EMPLOYEE: 'border-employee/30 bg-employee/10 text-employee',
  TECHNICIAN: 'border-technician/30 bg-technician/10 text-technician',
  ADMIN: 'border-admin/30 bg-admin/10 text-admin',
}

export function RoleBadge({ role, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs leading-none font-semibold whitespace-nowrap',
        STYLES[role] ?? 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      {ROLE_CONFIG[role]?.label ?? role}
    </span>
  )
}
