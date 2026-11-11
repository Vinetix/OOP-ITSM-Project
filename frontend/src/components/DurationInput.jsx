// A duration as a number plus a unit (min, h, d), reported back in minutes.
// It opens in the clearest unit: 1440 shows as 1 d, 120 as 2 h, 90 as 90 min.
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatMinutes } from '@/lib/format'
import { cn } from '@/lib/utils'

const FACTORS = { min: 1, h: 60, d: 1440 }

function startingPoint(minutes) {
  if (!minutes) return { amount: '', unit: 'min' }
  if (minutes % 1440 === 0) return { amount: String(minutes / 1440), unit: 'd' }
  if (minutes % 60 === 0) return { amount: String(minutes / 60), unit: 'h' }
  return { amount: String(minutes), unit: 'min' }
}

function toMinutes({ amount, unit }) {
  const n = Number(amount)
  if (amount.trim() === '' || !Number.isFinite(n) || n <= 0) return null
  return Math.round(n * FACTORS[unit])
}

export function DurationInput({ id, value, onChange, invalid = false, describedBy, className }) {
  const [state, setState] = useState(() => startingPoint(value))

  function update(next) {
    setState(next)
    onChange(toMinutes(next))
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={state.amount}
        onChange={(e) => update({ ...state, amount: e.target.value })}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-9 w-24 bg-popover"
      />
      <Select value={state.unit} onValueChange={(unit) => update({ ...state, unit })}>
        <SelectTrigger className="h-9 w-20 bg-popover" aria-label="Unit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="min">min</SelectItem>
          <SelectItem value="h">h</SelectItem>
          <SelectItem value="d">d</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {value ? `= ${formatMinutes(value)}` : ''}
      </span>
    </div>
  )
}
