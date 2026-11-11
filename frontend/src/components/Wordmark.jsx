// The I-ITSM mark and name.
import { cn } from '@/lib/utils'

export function Wordmark({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#1d2421" />
        <path d="M10 6v20" stroke="#8e9890" strokeWidth="2" />
        <circle cx="10" cy="9" r="3" fill="#2f8f4e" />
        <circle cx="10" cy="16" r="3" fill="#c8871a" />
        <circle cx="10" cy="23" r="3" fill="#c2362f" />
        <path d="M10 16h9a4 4 0 0 1 4 4v6" stroke="#8e9890" strokeWidth="2" fill="none" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight">I-ITSM</span>
    </span>
  )
}
