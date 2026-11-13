// A technician's skills as small chips; anything beyond `max` folds into "+N more".
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function SkillChips({ skills = [], max, empty = 'No skills yet', className }) {
  if (!skills.length) return <span className="text-sm text-muted-foreground">{empty}</span>

  const sorted = [...skills].sort((a, b) => a.name.localeCompare(b.name))
  const visible = max ? sorted.slice(0, max) : sorted
  const hidden = sorted.slice(visible.length)

  return (
    <span className={cn('flex flex-wrap gap-1', className)}>
      {visible.map((skill) => (
        <span
          key={skill.id}
          title={skill.categoryCode ?? skill.category?.name}
          className="rounded-sm border border-technician/25 bg-technician/5 px-1.5 py-0.5 text-xs leading-tight font-medium text-foreground"
        >
          {skill.name}
        </span>
      ))}
      {hidden.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-sm px-1 py-0.5 text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              +{hidden.length} more
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            {hidden.map((s) => s.name).join(', ')}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  )
}
