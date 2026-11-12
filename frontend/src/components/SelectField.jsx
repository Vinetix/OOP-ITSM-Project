// A labelled dropdown. Options may carry a hint, shown in the list but not in
// the closed field.
//   <SelectField id="criticality" label="Criticality" value={v} onChange={set}
//     options={[{ value: 'HIGH', label: 'High', hint: '...' }]} error={errors.criticality} />
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  error,
  hint,
  optional = false,
  disabled = false,
  className,
}) {
  const selected = options.find((o) => o.value === value)
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint && !error ? `${id}-hint` : undefined

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id} className="gap-1">
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          className="h-9 w-full bg-popover"
        >
          <SelectValue placeholder={placeholder}>{selected?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.hint ? (
                <span className="grid gap-0.5 py-0.5">
                  <span className="font-medium">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.hint}</span>
                </span>
              ) : (
                o.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
