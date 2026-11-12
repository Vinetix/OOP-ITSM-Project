// SLA policies: the default targets per priority, service overrides, and a
// preview of which one an incident would get. ?serviceId= filters the overrides,
// which is where "View SLA" on the Services tab lands.
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { servicesApi } from '@/api/catalogApi'
import { slaApi } from '@/api/slaApi'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorAlert } from '@/components/ErrorAlert'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { formatMinutes } from '@/lib/format'
import { DefaultPoliciesCard } from './DefaultPoliciesCard'
import { EffectiveSlaCard } from './EffectiveSlaCard'
import { ALL_SERVICES, ServiceOverridesCard } from './ServiceOverridesCard'
import { SlaPolicyDialog } from './SlaPolicyDialog'

export default function SlaPoliciesPage() {
  const policies = useAsync(() => slaApi.list(), [])
  const services = useAsync(() => servicesApi.list(), [])
  const [params, setParams] = useSearchParams()
  const [dialog, setDialog] = useState({ open: false, policy: null, draft: undefined })
  const [deleting, setDeleting] = useState({ open: false, policy: null })
  const [refreshKey, setRefreshKey] = useState(0) // tells the preview to look again

  const serviceFilter = params.get('serviceId') ?? ALL_SERVICES
  function setServiceFilter(value) {
    setParams(value === ALL_SERVICES ? {} : { serviceId: value }, { replace: true })
  }

  function handleSaved(saved, { created }) {
    policies.setData((list) =>
      created ? [...(list ?? []), saved] : (list ?? []).map((p) => (p.id === saved.id ? saved : p)),
    )
    setRefreshKey((k) => k + 1)
    toast.success(created ? 'Policy saved' : 'Changes saved')
  }

  async function confirmDelete() {
    const { policy } = deleting
    try {
      await slaApi.remove(policy.id)
      policies.setData((list) => (list ?? []).filter((p) => p.id !== policy.id))
      setRefreshKey((k) => k + 1)
      toast.success(`${policy.service.name}’s ${policy.priority} override deleted`)
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw error
    }
  }

  const deletingDefault = (policies.data ?? []).find(
    (p) => p.scope === 'DEFAULT' && p.priority === deleting.policy?.priority,
  )
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
        <div className="grid gap-6">
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
          <ServiceOverridesCard
            policies={policies.data}
            services={services.data}
            serviceFilter={serviceFilter}
            onServiceFilter={setServiceFilter}
            onAdd={() =>
              setDialog({
                open: true,
                policy: null,
                // pre-select the filtered service; undefined lets the admin choose
                draft: { serviceId: serviceFilter === ALL_SERVICES ? undefined : serviceFilter },
              })
            }
            onEdit={(policy) => setDialog({ open: true, policy, draft: undefined })}
            onDelete={(policy) => setDeleting({ open: true, policy })}
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

      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => setDeleting((d) => ({ ...d, open }))}
        title={`Delete ${deleting.policy?.service?.name ?? ''}’s ${deleting.policy?.priority ?? ''} override?`}
        description={
          deletingDefault
            ? `New ${deletingDefault.priority} incidents on this service will use the default: ${formatMinutes(deletingDefault.responseMinutes)} to respond, ${formatMinutes(deletingDefault.resolutionMinutes)} to resolve.`
            : 'New incidents on this service will use the default policy.'
        }
        confirmLabel="Delete override"
        pendingLabel="Deleting…"
        destructive
        onConfirm={confirmDelete}
      />
    </>
  )
}
