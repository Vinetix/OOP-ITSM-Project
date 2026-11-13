// 1–5 stars. With onChange it's an input (a radio group, keyboard friendly);
// without, it just shows a rating.
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({ value = 0, onChange, size = 'md', label = 'Rating' }) {
  const sizeClass = size === 'sm' ? 'size-4' : 'size-6'

  if (!onChange) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${value} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden="true"
            className={cn(
              sizeClass,
              n <= value ? 'fill-lamp-caution text-lamp-caution' : 'text-lamp-off',
            )}
          />
        ))}
      </span>
    )
  }

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
          onClick={() => onChange(value === n ? 0 : n)} // pressing the same star again clears it
          className="rounded-md p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Star
            aria-hidden="true"
            className={cn(
              sizeClass,
              'transition-colors',
              n <= value
                ? 'fill-lamp-caution text-lamp-caution'
                : 'text-lamp-off hover:text-lamp-caution',
            )}
          />
        </button>
      ))}
    </div>
  )
}
