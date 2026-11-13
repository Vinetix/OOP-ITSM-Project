// A candidate's score out of 100: green from 70, amber from 40, grey below.
import { cn } from '@/lib/utils'

export function ScoreBadge({ score, className }) {
  const tone =
    score >= 70
      ? 'border-lamp-go bg-lamp-go/10 text-[color:color-mix(in_oklab,var(--lamp-go)_75%,black)]'
      : score >= 40
        ? 'border-lamp-caution bg-lamp-caution/10 text-[color:color-mix(in_oklab,var(--lamp-caution)_70%,black)]'
        : 'border-lamp-off bg-muted text-muted-foreground'
  return (
    <span
      role="img"
      aria-label={`Score ${score} out of 100`}
      className={cn(
        'inline-flex size-11 shrink-0 flex-col items-center justify-center rounded-full border-2 leading-none',
        tone,
        className,
      )}
    >
      <span className="text-base font-extrabold tabular-nums">{score}</span>
      <span className="text-[0.6rem] font-semibold opacity-80">/100</span>
    </span>
  )
}
