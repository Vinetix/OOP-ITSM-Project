// The detail page's side column: the incident's facts, why it got its
// priority, and its SLA deadlines with live countdowns.
import { ChevronDown } from 'lucide-react'
import { CategoryCode } from '@/components/CategoryCode'
import { CriticalityBadge } from '@/components/CriticalityBadge'
import { InfoList } from '@/components/InfoList'
import { PriorityBadge } from '@/components/PriorityBadge'
import { SlaCountdown } from '@/components/incidents/SlaCountdown'
import { SlaProgress } from '@/components/incidents/SlaProgress'
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

// One deadline: target, due time, live countdown, progress, and when it stopped.
function SlaRow({ title, targetMinutes, startedAt, dueAt, stoppedAt, stoppedLabel, breached }) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-semibold">
          {title}{' '}
          <span className="font-normal text-muted-foreground">
            · {formatMinutes(targetMinutes)}
          </span>
        </span>
        <SlaCountdown
          dueAt={dueAt}
          startedAt={startedAt}
          stoppedAt={stoppedAt}
          breached={breached}
        />
      </div>
      <SlaProgress startedAt={startedAt} dueAt={dueAt} stoppedAt={stoppedAt} />
      <p className="text-xs text-muted-foreground">
        {stoppedAt ? `${stoppedLabel} ${formatDateTime(stoppedAt)} · ` : ''}Due{' '}
        {formatDateTime(dueAt)}
      </p>
    </div>
  )
}

export function SlaCard({ sla }) {
  if (!sla) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">SLA</CardTitle>
        <CardAction className="flex items-center gap-2">
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-semibold">
            {sla.scope === 'SERVICE' ? 'Service policy' : 'Default policy'}
          </span>
          <SlaStatusBadge status={sla.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        <SlaRow
          title="Response"
          targetMinutes={sla.responseTargetMinutes}
          startedAt={sla.startedAt}
          dueAt={sla.responseDueAt}
          stoppedAt={sla.respondedAt}
          stoppedLabel="Acknowledged"
          breached={sla.responseBreached}
        />
        <SlaRow
          title="Resolution"
          targetMinutes={sla.resolutionTargetMinutes}
          startedAt={sla.startedAt}
          dueAt={sla.resolutionDueAt}
          stoppedAt={sla.resolvedAt}
          stoppedLabel="Resolved"
          breached={sla.resolutionBreached}
        />
      </CardContent>
    </Card>
  )
}
