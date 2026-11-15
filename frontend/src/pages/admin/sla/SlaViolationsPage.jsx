// Every missed SLA deadline, newest first, with filters kept in the URL and a
// button to run the SLA check now instead of waiting for the next minute.
import { useState } from 'react'
import { AlarmClockOff, Play } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { slaMonitorApi } from '@/api/slaMonitorApi'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PRIORITIES, priorityLabel } from '@/config/catalog'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatMinutes } from '@/lib/format'
import { timeSince } from '@/lib/time'

const SIZE = 20
const ANY = 'ANY'
const TARGETS = { RESPONSE: 'Response', RESOLUTION: 'Resolution' }
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function lateBy(v) {
  const minutes = Math.round((new Date(v.detectedAt) - new Date(v.dueAt)) / 60000)
  return minutes < 1 ? '<1 min' : formatMinutes(minutes)
}

export default function SlaViolationsPage() {
  const [params, setParams] = useSearchParams()
  const target = TARGETS[params.get('target')] ? params.get('target') : ''
  const priority = PRIORITIES.some((p) => p.value === params.get('priority'))
    ? params.get('priority')
    : ''
  const incidentNumber = params.get('incidentNumber') ?? ''
  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0)
  const [numberDraft, setNumberDraft] = useState(incidentNumber)
  const [running, setRunning] = useState(false)

  const filters = { priority, incidentNumber }
  const list = useAsync(
    () => slaMonitorApi.violations({ ...filters, target, page, size: SIZE }),
    [target, priority, incidentNumber, page],
  )
  // response vs resolution counts for the chips: two tiny requests, same other filters
  const split = useAsync(
    () =>
      Promise.all(
        ['RESPONSE', 'RESOLUTION'].map((t) =>
          slaMonitorApi.violations({ ...filters, target: t, size: 1 }).then((p) => p.totalElements),
        ),
      ),
    [priority, incidentNumber, list.data],
  )

  function update(changes) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(changes)) {
          if (!v || v === ANY) next.delete(k)
          else next.set(k, String(v))
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  async function runCheck() {
    setRunning(true)
    try {
      const r = await slaMonitorApi.runMonitor()
      toast.success(
        `Checked ${plural(r.checked, 'incident')} · ${plural(r.breaches, 'breach', 'breaches')} · ${plural(r.escalations, 'escalation')}`,
      )
      list.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setRunning(false)
    }
  }

  const rows = list.data?.content
  const filtering = Boolean(target || priority || incidentNumber)
  const chips = [
    { label: 'Total', value: list.data?.totalElements },
    { label: 'Response', value: split.data?.[0] },
    { label: 'Resolution', value: split.data?.[1] },
  ]

  return (
    <>
      <PageHeader
        title="SLA violations"
        description="Every missed response or resolution deadline."
        actions={
          <div className="grid justify-items-end gap-1">
            <Button className="h-10" onClick={runCheck} disabled={running}>
              <Play aria-hidden="true" />
              {running ? 'Checking…' : 'Run SLA check now'}
            </Button>
            <span className="text-xs text-muted-foreground">
              It also runs automatically every minute.
            </span>
          </div>
        }
      />

      <ul aria-label="Totals" className="mb-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <li
            key={c.label}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm"
          >
            <span className="text-muted-foreground">{c.label}</span>
            <span className="font-bold tabular-nums">{c.value ?? '…'}</span>
          </li>
        ))}
      </ul>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select value={target || ANY} onValueChange={(v) => update({ target: v })}>
          <SelectTrigger className="h-9 w-44 bg-popover" aria-label="Target">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any target</SelectItem>
            <SelectItem value="RESPONSE">Response</SelectItem>
            <SelectItem value="RESOLUTION">Resolution</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority || ANY} onValueChange={(v) => update({ priority: v })}>
          <SelectTrigger className="h-9 w-44 bg-popover" aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any priority</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {priorityLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            update({ incidentNumber: numberDraft.trim() })
          }}
        >
          <Input
            value={numberDraft}
            onChange={(e) => setNumberDraft(e.target.value)}
            placeholder="Incident number"
            aria-label="Incident number"
            className="h-9 w-44 bg-popover"
          />
          <Button type="submit" variant="outline" className="h-9">
            Search
          </Button>
        </form>
        {filtering && (
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => {
              setNumberDraft('')
              update({ target: '', priority: '', incidentNumber: '' })
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {list.error ? (
        <ErrorAlert error={list.error} title="Couldn’t load violations" onRetry={list.reload} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          {!rows ? (
            <div className="grid gap-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={AlarmClockOff}
                title={filtering ? 'No violations match these filters' : 'No SLA violations'}
                description={
                  filtering ? 'Try fewer filters, or Clear.' : 'Every deadline so far has been met.'
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      {[
                        'Detected',
                        'Incident',
                        'Priority',
                        'Target',
                        'Service',
                        'Technician',
                        'Allowed',
                        'Due',
                        'Late by',
                      ].map((h, n) => (
                        <th
                          key={h}
                          scope="col"
                          className={`py-2.5 pr-3 font-medium whitespace-nowrap ${n === 0 ? 'pl-5' : ''}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={
                      list.loading ? 'divide-y divide-border opacity-60' : 'divide-y divide-border'
                    }
                  >
                    {rows.map((v) => (
                      <tr key={v.id}>
                        <td className="py-3 pr-3 pl-5 whitespace-nowrap">
                          <span className="grid">
                            {formatDateTime(v.detectedAt)}
                            <span className="text-xs text-muted-foreground">
                              {timeSince(v.detectedAt)}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <Link
                            to={`/admin/incidents/${v.incidentId}`}
                            className="font-mono text-[0.8rem] font-semibold hover:underline"
                          >
                            {v.incidentNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-3">
                          <PriorityBadge priority={v.priority} />
                        </td>
                        <td className="py-3 pr-3">{TARGETS[v.target] ?? v.target}</td>
                        <td className="py-3 pr-3">{v.serviceName}</td>
                        <td className="py-3 pr-3">
                          {v.technicianName ?? (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {formatMinutes(v.targetMinutes)}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(v.dueAt)}
                        </td>
                        <td className="py-3 pr-5 font-semibold whitespace-nowrap text-destructive">
                          {lateBy(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-border md:hidden">
                {rows.map((v) => (
                  <li key={v.id} className="grid gap-1.5 px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to={`/admin/incidents/${v.incidentId}`}
                        className="font-mono text-[0.8rem] font-semibold hover:underline"
                      >
                        {v.incidentNumber}
                      </Link>
                      <PriorityBadge priority={v.priority} />
                    </div>
                    <p>
                      <span className="font-semibold">{TARGETS[v.target] ?? v.target}</span> missed
                      by <span className="font-semibold text-destructive">{lateBy(v)}</span>{' '}
                      (allowed {formatMinutes(v.targetMinutes)})
                    </p>
                    <p className="text-muted-foreground">
                      {v.serviceName} · {v.technicianName ?? 'Unassigned'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Detected {formatDateTime(v.detectedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {list.data && list.data.totalElements > 0 && (
            <div className="border-t border-border px-5 py-3">
              <Pagination
                page={page}
                totalPages={list.data.totalPages}
                totalElements={list.data.totalElements}
                size={SIZE}
                itemLabel={list.data.totalElements === 1 ? 'violation' : 'violations'}
                disabled={list.loading}
                onPageChange={(next) => update({ page: next || '' })}
              />
            </div>
          )}
        </Card>
      )}
    </>
  )
}
