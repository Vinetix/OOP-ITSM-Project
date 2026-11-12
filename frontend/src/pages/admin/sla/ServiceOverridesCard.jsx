// Service overrides, grouped by service, each shown next to the default it replaces.
import { Pencil, Plus, Timer, Trash2 } from 'lucide-react'
import { CriticalityBadge } from '@/components/CriticalityBadge'
import { EmptyState } from '@/components/EmptyState'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatMinutes } from '@/lib/format'

export const ALL_SERVICES = 'ALL'

function groupByService(overrides) {
  const groups = new Map()
  for (const policy of overrides) {
    const id = policy.service.id
    if (!groups.has(id)) groups.set(id, { service: policy.service, policies: [] })
    groups.get(id).policies.push(policy)
  }
  return [...groups.values()]
}

function Time({ minutes, defaultMinutes }) {
  return (
    <span className="grid">
      <span className="font-semibold tabular-nums">{formatMinutes(minutes)}</span>
      {defaultMinutes !== undefined && (
        <span className="text-xs text-muted-foreground">
          default {formatMinutes(defaultMinutes)}
        </span>
      )}
    </span>
  )
}

export function ServiceOverridesCard({
  policies,
  services,
  serviceFilter: requestedFilter,
  onServiceFilter,
  onAdd,
  onEdit,
  onDelete,
}) {
  const defaults = new Map(
    policies.filter((p) => p.scope === 'DEFAULT').map((p) => [p.priority, p]),
  )
  const overrides = policies.filter((p) => p.scope === 'SERVICE')
  const activeIds = new Set(services.map((s) => s.id))

  // filter choices: active services, plus any inactive service that still has overrides
  const filterOptions = [
    ...new Map(
      [...services, ...overrides.map((p) => p.service)].map((s) => [String(s.id), s]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name))

  // an unknown ?serviceId= in the address falls back to "All services"
  const serviceFilter = filterOptions.some((s) => String(s.id) === requestedFilter)
    ? requestedFilter
    : ALL_SERVICES

  const filtered =
    serviceFilter === ALL_SERVICES
      ? overrides
      : overrides.filter((p) => String(p.service.id) === serviceFilter)
  const groups = groupByService(filtered)
  const filteredService = filterOptions.find((s) => String(s.id) === serviceFilter)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1.5">
          <CardTitle className="text-lg font-bold">Service overrides</CardTitle>
          <CardDescription>
            Stricter (or looser) targets for one service. Everything else uses the defaults.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={serviceFilter} onValueChange={onServiceFilter}>
            <SelectTrigger className="h-9 w-56 bg-popover" aria-label="Filter by service">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SERVICES}>All services</SelectItem>
              {filterOptions.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                  {!activeIds.has(s.id) && ' (inactive)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAdd} className="h-9">
            <Plus aria-hidden="true" />
            Add override
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {groups.length === 0 ? (
          <EmptyState
            icon={Timer}
            title={
              filteredService ? `${filteredService.name} has no overrides` : 'No overrides yet'
            }
            description={
              filteredService
                ? 'Its incidents use the default policies.'
                : 'Every service uses the default policies.'
            }
            action={
              <Button variant="outline" onClick={onAdd}>
                <Plus aria-hidden="true" />
                Add override
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th scope="col" className="pb-2 font-medium">
                    Priority
                  </th>
                  <th scope="col" className="pb-2 font-medium">
                    First response
                  </th>
                  <th scope="col" className="pb-2 font-medium">
                    Resolution
                  </th>
                  <th scope="col" className="pb-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              {groups.map(({ service, policies: rows }) => (
                <tbody key={service.id} className="border-b border-border last:border-b-0">
                  <tr>
                    <th scope="rowgroup" colSpan={4} className="pt-4 pb-1 text-left">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{service.name}</span>
                        <CriticalityBadge criticality={service.criticality} />
                        {!activeIds.has(service.id) && (
                          <span className="text-sm font-normal text-muted-foreground">
                            (inactive service)
                          </span>
                        )}
                      </span>
                    </th>
                  </tr>
                  {rows.map((policy) => {
                    const fallback = defaults.get(policy.priority)
                    return (
                      <tr key={policy.id}>
                        <td className="py-2.5">
                          <PriorityBadge priority={policy.priority} />
                        </td>
                        <td className="py-2.5">
                          <Time
                            minutes={policy.responseMinutes}
                            defaultMinutes={fallback?.responseMinutes}
                          />
                        </td>
                        <td className="py-2.5">
                          <Time
                            minutes={policy.resolutionMinutes}
                            defaultMinutes={fallback?.resolutionMinutes}
                          />
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEdit(policy)}
                            aria-label={`Edit ${service.name}’s ${policy.priority} override`}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDelete(policy)}
                            aria-label={`Delete ${service.name}’s ${policy.priority} override`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
