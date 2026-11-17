// The report form's category help: the line under the Category field when a
// suggestion is selected (an AI pick shows a badge and its reason, a keyword
// pick shows which words matched), and the row of suggestion chips.
import { useLayoutEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AiBadge({ className }) {
  return (
    <span
      style={{ '--tag': 'var(--tone-purple)' }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-px align-[0.1em] text-xs leading-tight font-semibold whitespace-nowrap',
        'border-[color:color-mix(in_oklab,var(--tag)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--tag)_12%,transparent)]',
        'text-[color:color-mix(in_oklab,var(--tag)_75%,var(--tint-ink))]',
        className,
      )}
    >
      <span aria-hidden="true">✨</span>
      AI suggestion
    </span>
  )
}

export function CategoryHint({ suggestion }) {
  if (!suggestion) return null
  // keyed by the reason so a new AI answer starts collapsed again
  if (suggestion.source === 'AI') {
    return <AiHint key={suggestion.reason} reason={suggestion.reason} />
  }
  const words = suggestion.matchedKeywords
  return (
    <span>
      {words.length ? `Suggested from: ${words.join(', ')}` : 'Suggested from your description'}
    </span>
  )
}

// two lines at most, with "more" only when the reason really doesn't fit
function AiHint({ reason }) {
  const textRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el || expanded) return
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [reason, expanded])

  return (
    <span className="block">
      <span ref={textRef} className={cn('block leading-relaxed', !expanded && 'line-clamp-2')}>
        <AiBadge />
        {reason && (
          <>
            <span aria-hidden="true"> · </span>
            <span>{reason}</span>
          </>
        )}
      </span>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-0.5 rounded-sm text-xs font-semibold text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {expanded ? 'less' : 'more'}
        </button>
      )}
    </span>
  )
}

// every suggestion as a chip: the AI pick has a sparkle, keyword picks show
// how many of their words matched
export function SuggestionChips({ suggestions, selectedId, onChoose }) {
  if (!suggestions.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">Suggestions:</span>
      {suggestions.map((s) => {
        const ai = s.source === 'AI'
        const count = !ai && s.matchCount > 0 ? s.matchCount : null
        return (
          <button
            key={s.categoryId}
            type="button"
            aria-pressed={selectedId === String(s.categoryId)}
            onClick={() => onChoose(String(s.categoryId))}
            title={ai ? s.reason || 'Suggested by AI' : `Matched: ${s.matchedKeywords.join(', ')}`}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-popover px-2 py-0.5 font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-role aria-pressed:bg-role-soft"
          >
            {ai && (
              <Sparkles
                aria-hidden="true"
                className="size-3 text-[color:color-mix(in_oklab,var(--tone-purple)_80%,var(--tint-ink))]"
              />
            )}
            {s.name}
            {ai && <span className="sr-only">, suggested by AI</span>}
            {count && (
              <>
                <span
                  aria-hidden="true"
                  className="min-w-4 rounded-full bg-foreground/8 px-1 text-center text-[0.6875rem] leading-4 text-muted-foreground tabular-nums"
                >
                  {count}
                </span>
                <span className="sr-only">
                  , {count} matching {count === 1 ? 'word' : 'words'}
                </span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
