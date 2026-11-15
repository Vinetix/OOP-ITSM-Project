// "L1" / "L2" / "L3" with a siren, in amber, orange or red. Hidden at level 0.
// The tooltip says what the level means and when it happened.
import { Siren } from 'lucide-react'
import { ToneTag } from '@/components/ToneTag'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ESCALATION_LEVELS } from '@/config/sla'
import { timeSince } from '@/lib/time'

export function EscalationBadge({ level, escalatedAt, className }) {
  const info = ESCALATION_LEVELS[level]
  if (!info) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ToneTag
            tone={info.tone}
            className={className}
            aria-label={`Escalation level ${level}: ${info.label}`}
          >
            <Siren aria-hidden="true" className="size-3" />L{level}
          </ToneTag>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Level {level}: {info.label}
        {escalatedAt && ` · ${timeSince(escalatedAt)}`}
      </TooltipContent>
    </Tooltip>
  )
}
