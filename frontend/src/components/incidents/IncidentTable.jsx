// The incident list used by every role. Pick the columns; a row opens the
// incident. `rowTag` can flag rows that need the viewer's attention.
import { Link, useNavigate } from 'react-router'
import { CategoryCode } from '@/components/CategoryCode'
import { Lamp } from '@/components/Lamp'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateTime } from '@/lib/format'
import { nextDeadline } from '@/lib/sla'
import { timeSince } from '@/lib/time'
import { cn } from '@/lib/utils'
import { EscalationBadge } from './EscalationBadge'
import { IncidentStatusBadge } from './IncidentStatusBadge'
import { SlaCountdown } from './SlaCountdown'
import { SlaStatusBadge } from './SlaStatusBadge'

const COLUMNS = {
  number: {
    head: 'Number',
    cell: (i, basePath) => (
      <span className="inline-flex items-center gap-1.5">
        <Link
          to={`${basePath}/${i.id}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-sm font-mono text-[0.8rem] font-semibold whitespace-nowrap outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {i.number}
        </Link>
        <EscalationBadge level={i.escalationLevel} />
      </span>
    ),
  },
  title: {
    head: 'Title',
    className: 'min-w-48 whitespace-normal',
    cell: (i, _, tag) => (
      <span className="grid gap-1">
        <span className="line-clamp-2 max-w-sm font-semibold">{i.title}</span>
        {tag && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[color:color-mix(in_oklab,var(--lamp-caution)_70%,black)]">
            <Lamp tone="caution" />
            {tag}
          </span>
        )}
      </span>
    ),
  },
  priority: { head: 'Priority', cell: (i) => <PriorityBadge priority={i.priority} /> },
  status: { head: 'Status', cell: (i) => <IncidentStatusBadge status={i.status} /> },
  service: {
    head: 'Service',
    className: 'hidden xl:table-cell',
    cell: (i) => <span className="text-muted-foreground">{i.service?.name}</span>,
  },
  category: {
    head: 'Category',
    className: 'hidden 2xl:table-cell',
    cell: (i) => (i.category ? <CategoryCode code={i.category.code} /> : '—'),
  },
  reporter: {
    head: 'Reporter',
    className: 'hidden md:table-cell',
    cell: (i) => i.reporter?.fullName ?? '—',
  },
  technician: {
    head: 'Technician',
    className: 'hidden md:table-cell',
    cell: (i) =>
      i.assignedTechnician?.fullName ?? <span className="text-muted-foreground">Unassigned</span>,
  },
  created: {
    head: 'Created',
    className: 'hidden sm:table-cell',
    cell: (i) => (
      <time
        dateTime={i.createdAt}
        title={formatDateTime(i.createdAt)}
        className="text-muted-foreground whitespace-nowrap"
      >
        {timeSince(i.createdAt)}
      </time>
    ),
  },
  sla: {
    head: 'SLA',
    cell: (i) => {
      // the deadline still ticking: response until acknowledged, then resolution
      const next = nextDeadline(i)
      return (
        <span className="grid gap-0.5">
          {next?.dueAt ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  className="w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <SlaStatusBadge status={i.slaStatus} />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {next.kind === 'response' ? 'Response' : 'Resolution'} due{' '}
                {formatDateTime(next.dueAt)}
              </TooltipContent>
            </Tooltip>
          ) : (
            <SlaStatusBadge status={i.slaStatus} />
          )}
          {next?.dueAt && (
            <span className="text-xs text-muted-foreground">
              {next.kind === 'response' ? 'Response ' : 'Resolution '}
              <SlaCountdown dueAt={next.dueAt} compact />
            </span>
          )}
        </span>
      )
    },
  },
}

export function IncidentTable({ incidents, loading, columns, basePath, rowTag, skeletonRows = 6 }) {
  const navigate = useNavigate()
  const cols = columns.map((key) => ({ key, ...COLUMNS[key] }))

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {cols.map((c, n) => (
            <TableHead
              key={c.key}
              className={cn(c.className, n === 0 && 'pl-5', n === cols.length - 1 && 'pr-5')}
            >
              {c.head}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody aria-busy={loading}>
        {loading && !incidents
          ? Array.from({ length: skeletonRows }, (_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={cols.length} className="pl-5">
                  <Skeleton className="h-9 w-full" />
                </TableCell>
              </TableRow>
            ))
          : (incidents ?? []).map((incident) => {
              const tag = rowTag?.(incident)
              return (
                <TableRow
                  key={incident.id}
                  onClick={() => navigate(`${basePath}/${incident.id}`)}
                  className={cn(
                    'cursor-pointer',
                    loading && 'opacity-60',
                    tag && 'bg-lamp-caution/[0.04]',
                  )}
                >
                  {cols.map((c, n) => (
                    <TableCell
                      key={c.key}
                      className={cn(
                        'py-3',
                        c.className,
                        n === 0 && 'pl-5',
                        n === cols.length - 1 && 'pr-5',
                        // a thin coloured edge for SLA trouble (drawn on the first cell: rows can't have borders)
                        n === 0 &&
                          incident.slaStatus === 'BREACHED' &&
                          'shadow-[inset_3px_0_0_var(--lamp-stop)]',
                        n === 0 &&
                          incident.slaStatus === 'AT_RISK' &&
                          'shadow-[inset_3px_0_0_var(--lamp-caution)]',
                      )}
                    >
                      {c.cell(incident, basePath, tag)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
      </TableBody>
    </Table>
  )
}
