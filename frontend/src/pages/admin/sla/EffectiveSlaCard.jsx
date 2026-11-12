// "What SLA would this incident get?" Pick a priority and, optionally, a
// service: the backend answers with the override if there is one, else the default.
import { useState } from 'react'
import { Lamp } from '@/components/Lamp'
import { SelectField } from '@/components/SelectField'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PRIORITIES } from '@/config/catalog'
import { slaApi } from '@/api/slaApi'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { formatMinutes } from '@/lib/format'

const NO_SERVICE = 'NONE'

export function EffectiveSlaCard({ services, policies, refreshKey }) {
  const [priority, setPriority] = useState('P1')
  const [serviceId, setServiceId] = useState(NO_SERVICE)
  const service = services.find((s) => String(s.id) === serviceId)

  const result = useAsync(
    () => slaApi.effective({ priority, serviceId: service ? service.id : undefined }),
    [priority, serviceId, refreshKey],
  )
  const sla = result.data
  const fallback = policies.find((p) => p.scope === 'DEFAULT' && p.priority === priority)
  const overridden = sla?.scope === 'SERVICE'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Effective SLA</CardTitle>
        <CardDescription>The targets an incident would actually get.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <SelectField
            id="preview-priority"
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={PRIORITIES.map((p) => ({ value: p.value, label: `${p.value} · ${p.label}` }))}
          />
          <SelectField
            id="preview-service"
            label="Service"
            value={serviceId}
            onChange={setServiceId}
            options={[
              { value: NO_SERVICE, label: 'No specific service' },
              ...services.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
        </div>

        <div aria-live="polite" className="rounded-lg border border-border bg-popover p-4">
          {result.error ? (
            <p className="text-sm text-destructive">{getErrorMessage(result.error)}</p>
          ) : !sla ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className={result.loading ? 'opacity-60' : undefined}>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">First response</dt>
                  <dd className="text-3xl font-extrabold tabular-nums">
                    {formatMinutes(sla.responseMinutes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Resolved within</dt>
                  <dd className="text-3xl font-extrabold tabular-nums">
                    {formatMinutes(sla.resolutionMinutes)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 flex items-start gap-2 text-sm">
                <Lamp tone={overridden ? 'role' : 'off'} className="mt-1.5" />
                <span>
                  {overridden ? (
                    <>
                      <span className="font-semibold">{service?.name}</span> has its own {priority}{' '}
                      override.
                      {fallback && (
                        <span className="text-muted-foreground">
                          {' '}
                          Without it: {formatMinutes(fallback.responseMinutes)} /{' '}
                          {formatMinutes(fallback.resolutionMinutes)}.
                        </span>
                      )}
                    </>
                  ) : service ? (
                    <>
                      {service.name} has no {priority} override, so the{' '}
                      <span className="font-semibold">default policy</span> applies.
                    </>
                  ) : (
                    <>
                      The <span className="font-semibold">default {priority} policy</span>.
                    </>
                  )}
                </span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
