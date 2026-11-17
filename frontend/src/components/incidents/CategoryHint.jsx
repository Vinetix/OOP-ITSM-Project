// The line under the report form's Category field when a suggestion is
// selected: an AI pick shows a badge and its reason, a keyword pick shows
// which words matched (as in F7).
import { useLayoutEffect, useRef, useState } from 'react'
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
