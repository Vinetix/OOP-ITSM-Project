// TEMPORARY (Phase F2 Step 2): shows the new shared components and two live
// SLA lookups. Replaced by the real SLA policies page in Step 6.
import { useState } from 'react'
import { slaApi } from '@/api/slaApi'
import { CategoryCode } from '@/components/CategoryCode'
import { CriticalityBadge } from '@/components/CriticalityBadge'
import { DurationInput } from '@/components/DurationInput'
import { ErrorAlert } from '@/components/ErrorAlert'
import { KeywordInput } from '@/components/KeywordInput'
import { PageHeader } from '@/components/PageHeader'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Label } from '@/components/ui/label'
import { useAsync } from '@/hooks/useAsync'
import { formatMinutes } from '@/lib/format'

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

export default function SlaPoliciesPage() {
  const [keywords, setKeywords] = useState(['printer', 'toner'])
  const [minutes, setMinutes] = useState(1680)
  const lookup = useAsync(
    () =>
      Promise.all([
        slaApi.effective({ priority: 'P1', serviceId: 1 }),
        slaApi.effective({ priority: 'P1' }),
      ]),
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="SLA policies" description="Component check for Phase F2 Step 2." />

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((c) => (
            <CriticalityBadge key={c} criticality={c} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['P1', 'P2', 'P3', 'P4'].map((p) => (
            <PriorityBadge key={p} priority={p} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['NETWORK', 'DATABASE', 'AUTHENTICATION'].map((c) => (
            <CategoryCode key={c} code={c} />
          ))}
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-lg gap-1.5">
          <Label htmlFor="kw">Keywords</Label>
          <KeywordInput id="kw" value={keywords} onChange={setKeywords} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dur">Resolution time</Label>
          <DurationInput id="dur" value={minutes} onChange={setMinutes} />
          <p className="text-sm text-muted-foreground">
            Stored value: <span className="font-semibold text-foreground">{minutes ?? 'none'}</span>{' '}
            minutes
          </p>
        </div>
      </Section>

      <Section title="Live SLA lookup (P1)">
        {lookup.error ? (
          <ErrorAlert error={lookup.error} onRetry={lookup.reload} />
        ) : lookup.data ? (
          <ul className="space-y-1">
            <li>
              Payment Gateway: {formatMinutes(lookup.data[0].resolutionMinutes)} (
              {lookup.data[0].scope})
            </li>
            <li>
              No specific service: {formatMinutes(lookup.data[1].resolutionMinutes)} (
              {lookup.data[1].scope})
            </li>
          </ul>
        ) : (
          <p className="text-muted-foreground">Loading…</p>
        )}
      </Section>
    </div>
  )
}
