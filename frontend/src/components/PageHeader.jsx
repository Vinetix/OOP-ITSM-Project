// Page title and description, with optional actions on the right.
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description, actions, className }) {
  usePageTitle(title)
  return (
    <header
      className={cn(
        'flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="max-w-[65ch] space-y-1.5">
        <h1 className="text-3xl leading-tight font-extrabold sm:text-4xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
