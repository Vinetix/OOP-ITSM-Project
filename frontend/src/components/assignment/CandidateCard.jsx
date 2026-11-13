// One technician in a recommendation list: rank, name, score, the reasons
// behind it (Smart reasons show their points), and an Assign button.
import { Button } from '@/components/ui/button'
import { splitReason } from '@/lib/reasons'
import { cn } from '@/lib/utils'
import { ScoreBadge } from './ScoreBadge'

export function CandidateCard({ candidate, rank, onAssign, busy, disabled }) {
  const best = rank === 1
  return (
    <article
      aria-label={`${rank}. ${candidate.fullName}, score ${candidate.score}`}
      className={cn(
        'grid gap-3 rounded-xl border bg-popover p-4',
        best ? 'border-role ring-2 ring-role/15' : 'border-border',
      )}
    >
      <header className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-muted-foreground tabular-nums">{rank}.</span>
        <ScoreBadge score={candidate.score} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="font-semibold">{candidate.fullName}</span>
          {best && (
            <span className="w-fit rounded-sm bg-role px-1.5 py-0.5 text-[0.7rem] font-semibold text-primary-foreground">
              Best match
            </span>
          )}
        </span>
        <Button
          size="sm"
          variant={best ? 'default' : 'outline'}
          onClick={() => onAssign(candidate)}
          disabled={busy || disabled}
        >
          Assign
        </Button>
      </header>
      {candidate.reasons?.length > 0 && (
        <ul className="grid gap-1 border-t border-border pt-3 text-sm">
          {candidate.reasons.map((reason) => {
            const { text, points } = splitReason(reason)
            return (
              <li key={reason} className="flex items-start justify-between gap-3">
                <span className={cn(points === 0 && 'text-muted-foreground')}>{text}</span>
                {points !== null && (
                  <span
                    className={cn(
                      'shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-bold tabular-nums',
                      points > 0
                        ? 'bg-lamp-go/12 text-[color:color-mix(in_oklab,var(--lamp-go)_75%,black)]'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    +{points}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
