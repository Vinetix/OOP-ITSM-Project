// Label, input, hint and error for one field, connected for screen readers.
//   <FormField id="email" label="Email" error={errors.email} ... />
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FormField({
  id,
  label,
  error,
  hint,
  optional = false,
  as: Control = Input,
  className,
  ...inputProps
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id} className="gap-1">
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Control
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className="h-9 bg-popover"
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
