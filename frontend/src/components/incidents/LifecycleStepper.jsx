// Where an incident is in its life, drawn as stations on a track (like the
// sidebar). Done stations are ticked, the current one is lit in the role colour.
// Waiting for the reporter hangs off "In progress". Horizontal on wide screens,
// vertical on phones.
import { Check } from 'lucide-react'
import { LIFECYCLE, STATUSES } from '@/config/incidents'
import { cn } from '@/lib/utils'

const LABELS = {
  CLASSIFIED: 'Classified',
  ASSIGNED: 'Assigned',
  ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  VERIFIED: 'Verified',
  CLOSED: 'Closed',
}

function stepState(index, current, status) {
  if (status === 'CLOSED') return 'done' // the end of the line counts as done
  if (index < current) return 'done'
  if (index === current) return 'current'
  return 'todo'
}

function Station({ state }) {
  return (
    <span
      className={cn(
        'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-card',
        state === 'done' && 'border-lamp-go bg-lamp-go text-white',
        state === 'current' && 'border-role ring-4 ring-role/20',
        state === 'todo' && 'border-dashed border-lamp-off',
      )}
    >
      {state === 'done' && <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />}
      {state === 'current' && <span className="size-2.5 rounded-full bg-role" />}
    </span>
  )
}

export function LifecycleStepper({ status, className }) {
  const waiting = status === 'AWAITING_INFO'
  const current = LIFECYCLE.indexOf(
    waiting ? 'IN_PROGRESS' : status === 'NEW' ? 'CLASSIFIED' : status,
  )

  return (
    <ol
      aria-label={`Progress: ${STATUSES[status]?.label ?? status}`}
      className={cn('flex flex-col gap-0 md:flex-row md:items-start', className)}
    >
      {LIFECYCLE.map((step, i) => {
        const state = stepState(i, current, status)
        const last = i === LIFECYCLE.length - 1
        const lineDone = state === 'done' && (i + 1 <= current || status === 'CLOSED')
        return (
          <li
            key={step}
            aria-current={state === 'current' ? 'step' : undefined}
            className="relative flex gap-3 pb-5 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-2 md:pb-0 md:text-center"
          >
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[11px] top-6 bottom-0 w-0.5 md:top-[11px] md:left-1/2 md:right-[-50%] md:bottom-auto md:h-0.5 md:w-auto',
                  lineDone
                    ? 'bg-lamp-go'
                    : 'border-l-2 border-dashed border-lamp-off bg-transparent md:border-l-0 md:border-t-2',
                )}
              />
            )}
            <Station state={state} />
            <span className="grid gap-1 pt-0.5 md:pt-0">
              <span
                className={cn(
                  'text-sm leading-tight',
                  state === 'current' ? 'font-bold text-foreground' : 'text-muted-foreground',
                  state === 'done' && 'text-foreground',
                )}
              >
                {LABELS[step]}
              </span>
              {step === 'IN_PROGRESS' && waiting && (
                <span className="w-fit rounded-sm border border-[color:var(--tone-purple)]/40 bg-[color:color-mix(in_oklab,var(--tone-purple)_10%,transparent)] px-1.5 py-0.5 text-xs font-semibold text-[color:color-mix(in_oklab,var(--tone-purple)_75%,black)] md:mx-auto">
                  Waiting for reporter
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
