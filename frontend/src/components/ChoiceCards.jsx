// A row of selectable cards (a radio group), each with a label and a short
// description. Used for impact and urgency on the report form.
import { cn } from '@/lib/utils'

export function ChoiceCards({ name, label, options, value, onChange, error }) {
  const errorId = error ? `${name}-error` : undefined
  return (
    <fieldset className="grid gap-2" aria-describedby={errorId}>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((o) => {
          const id = `${name}-${o.value}`
          const checked = value === o.value
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={cn(
                'relative grid cursor-pointer gap-1 rounded-lg border bg-popover p-3 transition-colors',
                'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                checked ? 'border-role bg-role-soft' : 'border-input hover:bg-accent',
                error && !value && 'border-destructive',
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-3.5 items-center justify-center rounded-full border-[1.5px]',
                    checked ? 'border-role' : 'border-input',
                  )}
                >
                  {checked && <span className="size-1.5 rounded-full bg-role" />}
                </span>
                {o.label}
              </span>
              <span className="text-xs leading-snug text-muted-foreground">{o.description}</span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
