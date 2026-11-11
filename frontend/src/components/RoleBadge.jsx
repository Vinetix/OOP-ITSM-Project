// Shows a role in that role's own colour (blue / teal / indigo),
// regardless of who is looking: an admin's user table shows all three.
import { ROLE_CONFIG } from '@/config/roles'
import { cn } from '@/lib/utils'

// Written out in full so Tailwind can find the class names in the source.
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