// The admin reports dashboard. The period lives in the URL (?period=14d, or
// ?from=…&to=… for Custom). Every card loads on its own, so one failing report
// never blanks the page.
import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { reportsApi } from '@/api/reportsApi'
import { Lamp } from '@/components/Lamp'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { downloadCsv } from '@/lib/csv'
import { daysAgo, isIsoDate, localIsoDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import {
  CategoriesChart,
  MixChart,
  ServicesChart,
  SlaByPriorityChart,
  TrendChart,
} from './ReportCharts'
import { complianceTone, minutes, percent, rating, ReportCard } from './reportBits'
import { TechnicianReport } from './TechnicianReport'

const PERIODS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '14d', label: 'Last 14 days', days: 14 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
]
const OPEN = 'NEW,CLASSIFIED,ASSIGNED,ACKNOWLEDGED,IN_PROGRESS,AWAITING_INFO'

function usePeriod() {
  const [params, setParams] = useSearchParams()
  const from = isIsoDate(params.get('from')) ? params.get('from') : ''
  const to = isIsoDate(params.get('to')) ? params.get('to') : ''
  const period =
    from || to ? 'custom' : (PERIODS.find((p) => p.value === params.get('period'))?.value ?? '14d')
  const preset = PERIODS.find((p) => p.value === period)
  // "last N days" = today and the N-1 days before it, in local dates
  const range = preset?.days
    ? { from: daysAgo(preset.days - 1), to: localIsoDate() }
    : period === 'all'
      ? {}
      : { from, to }
  const trendDays = preset?.days ?? 30
  const label = preset?.days
    ? preset.value
    : period === 'all'
      ? 'all-time'
      : `${from || 'start'}_to_${to || 'today'}`

  function choose(value) {
    if (value === 'custom') setParams({ from: daysAgo(13), to: localIsoDate() }, { replace: true })
    else setParams(value === '14d' ? {} : { period: value }, { replace: true })
  }
  const setCustom = (next) =>
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)), { replace: true })
  return { period, range, trendDays, label, from, to, choose, setCustom }
}

function Kpi({ label, value, to, tone, hint }) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {tone && <Lamp tone={tone} />}
        {label}
      </span>
      <span className="text-2xl leading-none font-extrabold tabular-nums sm:text-3xl">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </>
  )
  const cls = 'flex h-full flex-col gap-2 bg-card p-4'
  return (
    <li>
      {to ? (
        <Link
          to={to}
          className={cn(
            cls,
            'outline-none hover:bg-foreground/[0.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
          )}
        >
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  )
}

function KpiGrid({ state }) {
  if (state.error)
    return (
      <ReportCard title="Overview" state={state}>
        {() => null}
      </ReportCard>
    )
  const o = state.data
  if (!o) return <Skeleton className="h-48 w-full rounded-xl" />
  const kpis = [
    { label: 'Total incidents', value: o.totalIncidents },
    {
      label: 'Open',
      value: o.openIncidents,
      to: `/admin/incidents?status=${OPEN}`,
      hint: 'View list',
    },
    {
      label: 'Critical open (P1)',
      value: o.criticalOpenIncidents,
      to: `/admin/incidents?status=${OPEN}&priority=P1`,
      hint: 'View list',
    },
    { label: 'Resolved', value: o.resolvedIncidents },
    { label: 'SLA violations', value: o.slaViolations },
    {
      label: 'Escalated open',
      value: o.escalatedOpenIncidents,
      to: `/admin/incidents?status=${OPEN}&escalatedOnly=true`,
      hint: 'View list',
    },
    {
      label: 'SLA compliance',
      value: percent(o.slaCompliancePercent),
      tone: complianceTone(o.slaCompliancePercent),
    },
    { label: 'Avg response', value: minutes(o.averageResponseMinutes) },
    { label: 'Avg resolution', value: minutes(o.averageResolutionMinutes) },
    { label: 'Avg rating', value: rating(o.averageRating), hint: 'out of 5' },
  ]
  return (
    <ul
      aria-label="Key figures"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-foreground/10 sm:grid-cols-3 lg:grid-cols-5"
    >
      {kpis.map((k) => (
        <Kpi key={k.label} {...k} />
      ))}
    </ul>
  )
}

export default function ReportsPage() {
  const p = usePeriod()
  const [refresh, setRefresh] = useState(0)
  const key = [p.range.from, p.range.to, refresh]
  const overview = useAsync(() => reportsApi.overview(p.range), key)
  const technicians = useAsync(() => reportsApi.technicians(p.range), key)
  const services = useAsync(() => reportsApi.services(p.range), key)
  const categories = useAsync(() => reportsApi.categories(p.range), key)
  const sla = useAsync(() => reportsApi.sla(p.range), key)
  const trends = useAsync(() => reportsApi.trends(p.trendDays), [p.trendDays, refresh])
  // the date inputs are a draft: only a valid range reaches the URL (and the server)
  const [draft, setDraft] = useState({ from: p.from, to: p.to })
  const customError =
    draft.from && draft.to && draft.to < draft.from ? '“To” can’t be before “From”' : null
  function changeDate(next) {
    setDraft(next)
    if (!(next.from && next.to && next.to < next.from)) p.setCustom(next)
  }

  const servicesCsv = () =>
    downloadCsv(
      `services-${p.label}.csv`,
      [
        { header: 'Service', value: (r) => r.serviceName },
        { header: 'Total incidents', value: (r) => r.totalIncidents },
        { header: 'Open', value: (r) => r.openIncidents },
        { header: 'Critical', value: (r) => r.criticalIncidents },
        { header: 'SLA violations', value: (r) => r.slaViolations },
        { header: 'Avg resolution (min)', value: (r) => r.averageResolutionMinutes ?? '' },
      ],
      services.data,
    )

  return (
    <>
      <PageHeader
        title="Reports"
        description="How the service desk is doing: volumes, speed, SLA and people."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Select
              value={p.period}
              onValueChange={(v) => {
                if (v === 'custom') setDraft({ from: daysAgo(13), to: localIsoDate() })
                p.choose(v)
              }}
            >
              <SelectTrigger className="h-10 w-44 bg-popover" aria-label="Period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((x) => (
                  <SelectItem key={x.value} value={x.value}>
                    {x.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-10" onClick={() => setRefresh((n) => n + 1)}>
              <RefreshCw aria-hidden="true" />
              Refresh
            </Button>
          </div>
        }
      />

      {p.period === 'custom' && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label htmlFor="r-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="r-from"
              type="date"
              value={draft.from}
              onChange={(e) => changeDate({ ...draft, from: e.target.value })}
              className="h-9 w-44 bg-popover"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="r-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="r-to"
              type="date"
              value={draft.to}
              onChange={(e) => changeDate({ ...draft, to: e.target.value })}
              className="h-9 w-44 bg-popover"
              aria-invalid={customError ? true : undefined}
            />
          </div>
          {customError && <p className="pb-2 text-sm text-destructive">{customError}</p>}
        </div>
      )}

      <div className="grid gap-6">
        <KpiGrid state={overview} />
        <TrendChart state={trends} days={p.trendDays} />
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <SlaByPriorityChart state={sla} />
          <MixChart state={overview} />
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ServicesChart
            state={services}
            action={
              services.data?.length > 0 && (
                <Button variant="outline" size="sm" onClick={servicesCsv}>
                  <Download aria-hidden="true" />
                  Download CSV
                </Button>
              )
            }
          />
          <CategoriesChart state={categories} />
        </div>
        <TechnicianReport state={technicians} periodLabel={p.label} />
      </div>
    </>
  )
}
