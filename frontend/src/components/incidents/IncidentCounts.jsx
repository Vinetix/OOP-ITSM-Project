// A row of incident counts, each one request with size=1 (only totalElements is
// needed). Each tile opens the list filtered to that status.
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { incidentsApi } from '@/api/incidentsApi'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { cn } from '@/lib/utils'

// tiles: [{ label, status, tone, hint? }]; status may be "A,B" or '' for all
export function IncidentCounts({ tiles, listPath, title = 'Incident counts', className }) {
  const counts = useAsync(
    () =>
      Promise.all(
        tiles.map((t) =>
          incidentsApi
            .list({ status: t.status || undefined, size: 1 })
            .then((p) => p.totalElements),
        ),
      ),
    [],
  )
  useAutoRefresh(() => counts.reload({ silent: true }))

  if (counts.error) {
    return (
      <ErrorAlert error={counts.error} title="Couldn’t load the counts" onRetry={counts.reload} />
    )
  }

  return (
    <ul
      aria-label={title}
      className={cn(
        'grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-foreground/10',
        tiles.length >= 5
          ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
          : tiles.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-2',
        className,
      )}
    >
      {tiles.map((tile, i) => (
        <li key={tile.label} className="bg-card">
          <Link
            to={tile.status ? `${listPath}?status=${tile.status}` : listPath}
            className="group flex h-full flex-col gap-2 p-4 outline-none hover:bg-foreground/[0.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {/* square marker, like the status tags (round lamps are for SLA and availability) */}
              <span
                aria-hidden="true"
                className="size-2.5 rounded-[3px]"
                style={{ background: `var(--tone-${tile.tone})` }}
              />
              {tile.label}
            </span>
            {counts.data ? (
              <span className="text-3xl leading-none font-extrabold tabular-nums">
                {counts.data[i]}
              </span>
            ) : (
              <Skeleton className="h-8 w-12" />
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
              {tile.hint ?? 'View list'}
              <ArrowRight aria-hidden="true" className="size-3" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
