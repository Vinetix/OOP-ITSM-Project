// Every change to every incident, newest first, with filters kept in the URL
// (?incidentNumber=INC00006&action=RESOLVE&page=1) so a view survives refresh.
import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { auditApi } from '@/api/auditApi'
import { usersApi } from '@/api/usersApi'
import { ActorLabel } from '@/components/audit/ActorLabel'
import { StatusChange } from '@/components/audit/StatusChange'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AUDIT_ACTIONS, auditAction } from '@/config/audit'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/format'

const SIZE = 20
const ANY = 'ANY'
const SYSTEM = 'SYSTEM'
const FIELDS = ['incidentNumber', 'actor', 'action', 'from', 'to']

function ActionLabel({ action }) {
  const a = auditAction(action)
  const Icon = a.icon
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      {a.label}
    </span>
  )
}

export default function AuditLogPage() {
  const [params, setParams] = useSearchParams()
  const applied = Object.fromEntries(FIELDS.map((f) => [f, params.get(f) ?? '']))
  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0)
  const [draft, setDraft] = useState(applied)
  const [dateError, setDateError] = useState(null)

  // everyone, for the Actor list (one large page; sorted by name here)
  const users = useAsync(() => usersApi.list({ size: 100 }).then((p) => p.content), [])
  const actorOptions = [
    { value: ANY, label: 'Anyone' },
    { value: SYSTEM, label: 'System only' },
    ...[...(users.data ?? [])]
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map((u) => ({ value: String(u.id), label: u.fullName })),
  ]

  const results = useAsync(
    () =>
      auditApi.search({
        incidentNumber: applied.incidentNumber.trim(),
        actorId: applied.actor && applied.actor !== SYSTEM ? applied.actor : undefined,
        systemOnly: applied.actor === SYSTEM,
        action: applied.action,
        from: applied.from,
        to: applied.to,
        page,
        size: SIZE,
      }),
    [params.toString()],
  )

  function write(values, nextPage = 0) {
    const next = new URLSearchParams()
    for (const f of FIELDS) if (values[f]) next.set(f, values[f])
    if (nextPage) next.set('page', String(nextPage))
    setParams(next, { replace: true })
  }

  function apply(event) {
    event.preventDefault()
    // dates come as YYYY-MM-DD, so comparing the strings compares the dates
    if (draft.from && draft.to && draft.to < draft.from) {
      setDateError('“To” can’t be before “From”')
      return
    }
    setDateError(null)
    write({ ...draft, incidentNumber: draft.incidentNumber.trim() })
  }

  function clear() {
    const empty = Object.fromEntries(FIELDS.map((f) => [f, '']))
    setDraft(empty)
    setDateError(null)
    write(empty)
  }

  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }))
  const filtering = FIELDS.some((f) => applied[f])
  const entries = results.data?.content

  return (
    <>
      <PageHeader title="Audit log" description="Every change to every incident, newest first." />

      <Card className="mb-4 p-4">
        <form
          onSubmit={apply}
          noValidate
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto_auto]"
        >
          <FormField
            id="incidentNumber"
            label="Incident number"
            placeholder="INC00006"
            value={draft.incidentNumber}
            onChange={(e) => set('incidentNumber')(e.target.value)}
          />
          <SelectField
            id="actor"
            label="Actor"
            value={draft.actor || ANY}
            onChange={(v) => set('actor')(v === ANY ? '' : v)}
            options={actorOptions}
          />
          <SelectField
            id="action"
            label="Action"
            value={draft.action || ANY}
            onChange={(v) => set('action')(v === ANY ? '' : v)}
            options={[
              { value: ANY, label: 'Any' },
              ...AUDIT_ACTIONS.map((a) => ({ value: a.value, label: a.label })),
            ]}
          />
          <FormField
            id="from"
            label="From"
            type="date"
            value={draft.from}
            onChange={(e) => set('from')(e.target.value)}
          />
          <FormField
            id="to"
            label="To"
            type="date"
            value={draft.to}
            onChange={(e) => {
              set('to')(e.target.value)
              setDateError(null)
            }}
            error={dateError}
          />
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-5 xl:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={clear}
              disabled={!filtering && !FIELDS.some((f) => draft[f])}
            >
              Clear
            </Button>
            <Button type="submit">Apply</Button>
          </div>
        </form>
      </Card>

      {results.error ? (
        <ErrorAlert
          error={results.error}
          title="Couldn’t search the audit log"
          onRetry={results.reload}
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          {!entries ? (
            <div className="grid gap-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ScrollText}
                title={filtering ? 'Nothing matches these filters' : 'Nothing recorded yet'}
                description={
                  filtering ? 'Try fewer filters, or Clear to see everything.' : undefined
                }
              />
            </div>
          ) : (
            <>
              {/* wide screens: a table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      {['Time', 'Incident', 'Actor', 'Action', 'Status', 'Details'].map((h, n) => (
                        <th
                          key={h}
                          scope="col"
                          className={`py-2.5 font-medium ${n === 0 ? 'pl-5' : ''} ${n === 5 ? 'pr-5' : ''} pr-3`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={
                      results.loading
                        ? 'divide-y divide-border opacity-60'
                        : 'divide-y divide-border'
                    }
                  >
                    {entries.map((e) => (
                      <tr key={e.id} className="align-top">
                        <td className="py-3 pr-3 pl-5 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(e.occurredAt)}
                        </td>
                        <td className="py-3 pr-3">
                          <Link
                            to={`/admin/incidents/${e.incidentId}`}
                            className="font-mono text-[0.8rem] font-semibold hover:underline"
                          >
                            {e.incidentNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-3">
                          <ActorLabel entry={e} />
                        </td>
                        <td className="py-3 pr-3">
                          <ActionLabel action={e.action} />
                        </td>
                        <td className="py-3 pr-3">
                          <StatusChange from={e.fromStatus} to={e.toStatus} fallback="–" />
                        </td>
                        <td className="max-w-72 py-3 pr-5">
                          <span className="line-clamp-2 text-muted-foreground" title={e.details}>
                            {e.details ?? '–'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* phones: stacked cards */}
              <ul className="divide-y divide-border md:hidden">
                {entries.map((e) => (
                  <li key={e.id} className="grid gap-2 px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <ActionLabel action={e.action} />
                      <Link
                        to={`/admin/incidents/${e.incidentId}`}
                        className="font-mono text-[0.8rem] font-semibold hover:underline"
                      >
                        {e.incidentNumber}
                      </Link>
                    </div>
                    <ActorLabel entry={e} />
                    <StatusChange from={e.fromStatus} to={e.toStatus} />
                    {e.details && <p className="text-muted-foreground">{e.details}</p>}
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.occurredAt)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {results.data && results.data.totalElements > 0 && (
            <div className="border-t border-border px-5 py-3">
              <Pagination
                page={page}
                totalPages={results.data.totalPages}
                totalElements={results.data.totalElements}
                size={SIZE}
                itemLabel={results.data.totalElements === 1 ? 'entry' : 'entries'}
                disabled={results.loading}
                onPageChange={(next) => write(applied, next)}
              />
            </div>
          )}
        </Card>
      )}
    </>
  )
}
