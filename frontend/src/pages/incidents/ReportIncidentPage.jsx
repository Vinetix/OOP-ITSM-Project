// The report form. The estimated priority uses the same formula as the server,
// but only as a hint: the server's priority is the one the incident gets.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { categoriesApi, servicesApi } from '@/api/catalogApi'
import { incidentsApi } from '@/api/incidentsApi'
import { ChoiceCards } from '@/components/ChoiceCards'
import { CriticalityBadge } from '@/components/CriticalityBadge'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormAlert } from '@/components/FormAlert'
import { FormField } from '@/components/FormField'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { PriorityBadge } from '@/components/PriorityBadge'
import { SelectField } from '@/components/SelectField'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { criticalityOf } from '@/config/catalog'
import { IMPACTS, URGENCIES } from '@/config/incidents'
import { useAsync } from '@/hooks/useAsync'
import { useFormState } from '@/hooks/useFormState'
import { useNotifications } from '@/notifications/NotificationsContext'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import { estimatePriority } from '@/lib/priority'
import { validateIncident } from './incidentRules'

export default function ReportIncidentPage() {
  const services = useAsync(() => servicesApi.list(), [])
  const categories = useAsync(() => categoriesApi.list(), [])

  if (services.error || categories.error) {
    return (
      <ErrorAlert
        error={services.error ?? categories.error}
        title="Couldn’t load the form"
        onRetry={() => {
          services.reload()
          categories.reload()
        }}
      />
    )
  }
  if (!services.data || !categories.data) return <LoadingState label="Loading the form" />
  return <ReportForm services={services.data} categories={categories.data} />
}

function ReportForm({ services, categories }) {
  const navigate = useNavigate()
  const notifications = useNotifications()
  const [submitting, setSubmitting] = useState(false)
  const form = useFormState({
    serviceId: '',
    categoryId: '',
    title: '',
    description: '',
    impact: '',
    urgency: '',
    affectedUsers: '1',
  })
  const { values, setField, errors } = form

  const service = services.find((s) => String(s.id) === values.serviceId)
  const defaultCategoryId = service?.defaultCategory ? String(service.defaultCategory.id) : null
  const estimate =
    service &&
    estimatePriority(values.impact, values.urgency, service.criticality, values.affectedUsers)

  function chooseService(id) {
    setField('serviceId', id)
    const chosen = services.find((s) => String(s.id) === id)
    // pre-select the service's default category; with no default the user must pick one
    setField('categoryId', chosen?.defaultCategory ? String(chosen.defaultCategory.id) : '')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateIncident(values)
    if (Object.keys(found).length) return form.showErrors(found)

    setSubmitting(true)
    try {
      const incident = await incidentsApi.report({
        title: values.title.trim(),
        description: values.description.trim(),
        serviceId: Number(values.serviceId),
        categoryId: Number(values.categoryId),
        impact: values.impact,
        urgency: values.urgency,
        affectedUsers: Number(values.affectedUsers),
      })
      // auto-assignment may already have picked someone: say what actually happened
      toast.success(
        incident.status === 'ASSIGNED' && incident.assignedTechnician
          ? `${incident.number} reported (${incident.priority}), assigned to ${incident.assignedTechnician.fullName}`
          : `${incident.number} reported (${incident.priority}), waiting for a technician`,
      )
      notifications.refresh()
      navigate(`/employee/incidents/${incident.id}`)
    } catch (error) {
      // a service without a default category comes back as a business rule
      if (getErrorCode(error) === 'BUSINESS_RULE_VIOLATION') {
        form.showErrors({ categoryId: getErrorMessage(error) })
      } else {
        form.applyServerError(error)
      }
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Report an incident"
        description="Tell us what’s broken. It’s prioritised and given deadlines as soon as you submit."
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <Card>
          <CardContent className="grid gap-6">
            <FormAlert message={form.formError} />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <SelectField
                  id="serviceId"
                  label="Affected service"
                  value={values.serviceId}
                  onChange={chooseService}
                  options={services.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                    hint: `${criticalityOf(s.criticality)?.label} criticality`,
                  }))}
                  error={errors.serviceId}
                />
                {service && (
                  <CriticalityBadge criticality={service.criticality} className="w-fit" />
                )}
              </div>
              <SelectField
                id="categoryId"
                label="Category"
                value={values.categoryId}
                onChange={(v) => setField('categoryId', v)}
                options={categories.map((c) => ({
                  value: String(c.id),
                  label:
                    String(c.id) === defaultCategoryId ? `${c.name} (service default)` : c.name,
                }))}
                placeholder={service ? 'Choose a category' : 'Choose a service first'}
                disabled={!service}
                hint={
                  service && !defaultCategoryId
                    ? 'This service has no default, so please choose one.'
                    : undefined
                }
                error={errors.categoryId}
              />
            </div>

            <FormField
              id="title"
              label="Title"
              placeholder="e.g. Payment page shows an error at checkout"
              value={values.title}
              onChange={(e) => setField('title', e.target.value)}
              hint={`${values.title.trim().length}/150 characters, at least 5`}
              error={errors.title}
            />
            <FormField
              id="description"
              label="What’s happening?"
              as={Textarea}
              rows={5}
              placeholder="What were you doing, what did you expect, and what happened instead?"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              hint={`${values.description.length}/4000 characters`}
              error={errors.description}
            />

            <ChoiceCards
              name="impact"
              label="Impact: how widely is this felt?"
              options={IMPACTS}
              value={values.impact}
              onChange={(v) => setField('impact', v)}
              error={errors.impact}
            />
            <ChoiceCards
              name="urgency"
              label="Urgency: how badly does it stop work?"
              options={URGENCIES}
              value={values.urgency}
              onChange={(v) => setField('urgency', v)}
              error={errors.urgency}
            />

            <FormField
              id="affectedUsers"
              label="Roughly how many people are affected?"
              type="number"
              inputMode="numeric"
              min={1}
              className="sm:max-w-56"
              value={values.affectedUsers}
              onChange={(e) => setField('affectedUsers', e.target.value)}
              error={errors.affectedUsers}
            />

            <div className="flex justify-end">
              <Button type="submit" size="lg" className="h-10" disabled={submitting}>
                {submitting ? 'Reporting…' : 'Report incident'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Estimated priority</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3" aria-live="polite">
            {estimate ? (
              <>
                <div className="flex items-center gap-3">
                  <PriorityBadge priority={estimate.priority} className="text-sm" />
                  <span className="text-sm text-muted-foreground">
                    score <span className="font-semibold text-foreground">{estimate.score}</span>
                  </span>
                </div>
                <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                  {estimate.base}
                  {estimate.multiplier > 1 &&
                    ` × ${estimate.multiplier} (${Number(values.affectedUsers).toLocaleString('en-IN')} people)`}{' '}
                  = {estimate.score}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a service, impact and urgency to see an estimate.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Final priority is calculated by the system when you submit.
            </p>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
