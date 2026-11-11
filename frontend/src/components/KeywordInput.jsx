// Chip input for keywords: Enter or comma adds, ✕ or Backspace removes.
// Keywords are kept lowercase and unique, the way the backend stores them.
import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KeywordInput({
  id,
  value = [],
  onChange,
  max = 30,
  maxLength = 50,
  placeholder = 'Type a keyword and press Enter',
  invalid = false,
  describedBy,
}) {
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState(null)
  const inputRef = useRef(null)
  const full = value.length >= max

  function add(text) {
    const words = text
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
    setDraft('')
    if (!words.length) return
    const next = [...value]
    let problem = null
    for (const word of words) {
      if (word.length > maxLength) problem = `Keep each keyword to ${maxLength} characters`
      else if (next.includes(word)) problem = `“${word}” is already in the list`
      else if (next.length >= max) problem = `Up to ${max} keywords`
      else next.push(word)
    }
    if (next.length !== value.length) onChange(next)
    setNote(problem)
  }

  function remove(word) {
    onChange(value.filter((w) => w !== word))
    setNote(null)
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault() // Enter would otherwise submit the form
      add(draft)
    } else if (event.key === 'Backspace' && draft === '' && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="grid gap-1.5">
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-9 cursor-text flex-wrap items-center gap-1.5 rounded-lg border bg-popover px-2 py-1.5 transition-colors',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          invalid ? 'border-destructive' : 'border-input',
        )}
      >
        {value.map((word) => (
          <span
            key={word}
            className="inline-flex items-center gap-1 rounded-sm bg-muted py-0.5 pr-0.5 pl-2 text-sm"
          >
            {word}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                remove(word)
              }}
              aria-label={`Remove ${word}`}
              className="rounded-sm p-0.5 text-muted-foreground outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          disabled={full}
          onChange={(e) => {
            // a pasted "printer, toner" adds both at once
            if (e.target.value.includes(',')) add(e.target.value)
            else setDraft(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={full ? '' : placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="min-w-32 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex justify-between gap-3 text-sm text-muted-foreground">
        <span aria-live="polite">{note ?? 'Separate keywords with Enter or a comma.'}</span>
        <span className={cn('tabular-nums', full && 'font-semibold text-foreground')}>
          {value.length}/{max}
        </span>
      </div>
    </div>
  )
}
