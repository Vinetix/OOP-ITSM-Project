// The detail page's side column: the incident's facts, why it got its
// priority, and its SLA deadlines with live countdowns.
import { ChevronDown } from 'lucide-react'
import { CategoryCode } from '@/components/CategoryCode'
import { CriticalityBadge } from '@/components/CriticalityBadge'
import { InfoList } from '@/components/InfoList'
import { PriorityBadge } from '@/components/PriorityBadge'
import { SlaCountdown } from '@/components/incidents/SlaCountdown'
import { SlaStatusBadge } from '@/components/incidents/SlaStatusBadge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IMPACTS, URGENCIES, labelOf } from '@/config/incidents'
import { formatDateTime, formatMinutes } from '@/lib/format'

export function DetailsCard({ incident, action }) {
  const i = incident
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Details</CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        <InfoList
          items={[
            {
              label: 'Service',
              value: (
                <span className="flex flex-wrap items-center gap-2">
                  {i.service?.name}
                  <CriticalityBadge criticality={i.service?.criticality} />
                </span>
              ),
            },
            {
              label: 'Category',
              value: i.category ? (
                <span className="flex flex-wrap items-center gap-2">
                  <CategoryCode code={i.category.code} />
                  {i.category.name}
                </span>
              ) : (
                '—'
              ),
            },
            { label: 'Impact', value: labelOf(IMPACTS, i.impact) },
            { label: 'Urgency', value: labelOf(URGENCIES, i.urgency) },
            { label: 'Affected users', value: i.affectedUsers?.toLocaleString('en-IN') },
            { label: 'Reporter', value: i.reporter?.fullName },
            {
              label: 'Technician',
              value: i.assignedTechnician ? (
                <span className="grid">
                  {i.assignedTechnician.fullName}
                  {i.assignedAt && (
                    <span className="text-xs font-normal text-muted-foreground">
                      assigned {formatDateTime(i.assignedAt)}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              ),
            },
            { label: 'Reported', value: formatDateTime(i.createdAt) },
            { label: 'Last updated', value: formatDateTime(i.updatedAt) },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function PriorityCard({ incident }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Priority</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center gap-3">
          <PriorityBadge priority={incident.priority} className="text-sm" />
          {incident.priorityScore !== undefined && (
            <span className="text-sm text-muted-foreground">
              score <span className="font-semibold text-foreground">{incident.priorityScore}</span>
            </span>
          )}
        </div>
        {incident.priorityReason && (
          <details className="group rounded-lg border border-border bg-popover px-3 py-2 text-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Why this priority?
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-2 font-mono text-xs leading-relaxed break-words text-muted-foreground">
              {incident.priorityReason}
            </p>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

export function SlaCard({ sla }) {
  if (!sla) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">SLA</CardTitle>
        <CardAction>
          <SlaStatusBadge status={sla.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <span className="w-fit rounded-sm bg-muted px-2 py-0.5 text-xs font-semibold">
          {sla.scope === 'SERVICE' ? 'Service-specific SLA' : 'Default SLA'}
        </span>
        <dl className="grid gap-4">
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">
              First response within {formatMinutes(sla.responseTargetMinutes)}
            </dt>
            <dd>
              <SlaCountdown
                dueAt={sla.responseDueAt}
                doneAt={sla.respondedAt}
                breached={sla.responseBreached}
                doneLabel="Responded"
              />
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">
              Resolution within {formatMinutes(sla.resolutionTargetMinutes)}
            </dt>
            <dd>
              <SlaCountdown
                dueAt={sla.resolutionDueAt}
                doneAt={sla.resolvedAt}
                breached={sla.resolutionBreached}
                doneLabel="Resolved"
              />
            </dd>
          </div>
        </dl>
        {(sla.responseBreached || sla.resolutionBreached) && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive">
            {sla.responseBreached && sla.resolutionBreached
              ? 'Both deadlines were missed.'
              : sla.responseBreached
                ? 'The response deadline was missed.'
                : 'The resolution deadline was missed.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
