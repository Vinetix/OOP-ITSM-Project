// SLA policies: the default targets per priority, service overrides, and a
// preview of which one an incident would get.
import { useState } from 'react'
import { toast } from 'sonner'
import { servicesApi } from '@/api/catalogApi'
import { slaApi } from '@/api/slaApi'
import { ErrorAlert } from '@/components/ErrorAlert'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { DefaultPoliciesCard } from './DefaultPoliciesCard'
import { EffectiveSlaCard } from './EffectiveSlaCard'
import { SlaPolicyDialog } from './SlaPolicyDialog'

export default function SlaPoliciesPage() {
  const policies = useAsync(() => slaApi.list(), [])
  const services = useAsync(() => servicesApi.list(), [])
  const [dialog, setDialog] = useState({ open: false, policy: null, draft: undefined })
  const [refreshKey, setRefreshKey] = useState(0) // tells the preview to look again

  function handleSaved(saved, { created }) {
    if (created) policies.setData((list) => [...(list ?? []), saved])
    else policies.setData((list) => (list ?? []).map((p) => (p.id === saved.id ? saved : p)))
    setRefreshKey((k) => k + 1)
    toast.success(created ? 'Policy saved' : 'Changes saved')
  }

  const loadError = policies.error ?? services.error
  const ready = policies.data && services.data

  return (
    <>
      <PageHeader
        title="SLA policies"
        description="How quickly incidents must get a first response and be resolved, by priority. A service can have stricter targets than the default."
      />

      {loadError ? (
        <ErrorAlert
          error={loadError}
          title="Couldn’t load SLA policies"
          onRetry={() => {
            policies.reload()
            services.reload()
          }}
        />
      ) : !ready ? (
        <LoadingState label="Loading SLA policies" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <DefaultPoliciesCard
            policies={policies.data}
            onEdit={(policy) => setDialog({ open: true, policy, draft: undefined })}
            onCreate={(priority) =>
              setDialog({ open: true, policy: null, draft: { serviceId: null, priority } })
            }
          />
          <EffectiveSlaCard
            services={services.data}
            policies={policies.data}
            refreshKey={refreshKey}
          />
        </div>
      )}

      <SlaPolicyDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        policy={dialog.policy}
        draft={dialog.draft}
        services={services.data ?? []}
        policies={policies.data ?? []}
        onSaved={handleSaved}
      />
    </>
  )
}
