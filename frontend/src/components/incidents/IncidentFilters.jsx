// Search box, "Filters" panel and active-filter chips for every incident list.
// Values come in parsed from the URL; every change goes out through onChange,
// which writes the URL (so a search survives refresh and can be shared).
import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { categoriesApi, servicesApi } from '@/api/catalogApi'
import { usersApi } from '@/api/usersApi'
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
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { PRIORITIES } from '@/config/catalog'
import { STATUSES } from '@/config/incidents'
import { SLA_STATUSES } from '@/config/sla'
import { useAsync } from '@/hooks/useAsync'
import { daysAgo, localIsoDate } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { countActive } from '@/pages/incidents/incidentFilters'

const ANY = 'ANY'
const STATUS_KEYS = Object.keys(STATUSES).filter((s) => s !== 'NEW')

function useWideScreen() {
  const query = '(min-width: 768px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setWide(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return wide
}

// options for the selects, and names for the chips
function useFilterOptions(isAdmin) {
  const options = useAsync(
    () =>
      Promise.all([
        categoriesApi.list(),
        servicesApi.list(),
        isAdmin ? usersApi.listTechnicians() : [],
        isAdmin ? usersApi.list({ role: 'EMPLOYEE', size: 100 }).then((p) => p.content) : [],
      ]).then(([categories, services, technicians, reporters]) => ({
        categories,
        services,
        technicians,
        reporters: [...reporters].sort((a, b) => a.fullName.localeCompare(b.fullName)),
      })),
    [isAdmin],
  )
  return options.data ?? { categories: [], services: [], technicians: [], reporters: [] }
}

function ChipGroup({ label, options, values, onChange }) {
  const toggle = (v) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = values.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                on
                  ? 'border-role bg-role text-primary-foreground'
                  : 'border-border bg-popover hover:bg-accent',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function PickOne({ id, label, value, onChange, options, anyLabel }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? '' : v)}>
        <SelectTrigger id={id} className="h-9 w-full bg-popover">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DateRange({ from, to, onChange }) {
  const [draft, setDraft] = useState({ from, to })
  const [error, setError] = useState(null)
  useEffect(() => setDraft({ from, to }), [from, to]) // eslint-disable-line react-hooks/set-state-in-effect

  // only valid ranges reach the URL, so no request goes out with "to" before "from"
  function apply(next) {
    setDraft(next)
    if (next.from && next.to && next.to < next.from) {
      setError('“To” can’t be before “From”')
      return
    }
    setError(null)
    onChange({ reportedFrom: next.from, reportedTo: next.to })
  }

  const today = localIsoDate()
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">Reported</legend>
      <div className="flex flex-wrap gap-1.5">
        {[
          ['Today', today, today],
          ['Last 7 days', daysAgo(6), today],
          ['Last 30 days', daysAgo(29), today],
        ].map(([label, f, t]) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => apply({ from: f, to: t })}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label htmlFor="reportedFrom" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="reportedFrom"
            type="date"
            value={draft.from}
            onChange={(e) => apply({ ...draft, from: e.target.value })}
            className="h-9 bg-popover"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="reportedTo" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="reportedTo"
            type="date"
            value={draft.to}
            onChange={(e) => apply({ ...draft, to: e.target.value })}
            aria-invalid={error ? true : undefined}
            className="h-9 bg-popover"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  )
}

function FilterFields({ filters, onChange, isAdmin, options }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <div className="sm:col-span-2 xl:col-span-3">
        <ChipGroup
          label="Status"
          options={STATUS_KEYS.map((s) => ({ value: s, label: STATUSES[s].label }))}
          values={filters.status}
          onChange={(v) => onChange({ status: v })}
        />
      </div>
      <ChipGroup
        label="Priority"
        options={PRIORITIES.map((p) => ({ value: p.value, label: p.value }))}
        values={filters.priority}
        onChange={(v) => onChange({ priority: v })}
      />
      <PickOne
        id="f-category"
        label="Category"
        anyLabel="Any category"
        value={filters.categoryId}
        onChange={(v) => onChange({ categoryId: v })}
        options={options.categories.map((c) => ({ value: String(c.id), label: c.name }))}
      />
      <PickOne
        id="f-service"
        label="Service"
        anyLabel="Any service"
        value={filters.serviceId}
        onChange={(v) => onChange({ serviceId: v })}
        options={options.services.map((s) => ({ value: String(s.id), label: s.name }))}
      />
      {isAdmin && (
        <>
          <PickOne
            id="f-technician"
            label="Technician"
            anyLabel="Any technician"
            value={filters.technicianId}
            onChange={(v) => onChange({ technicianId: v })}
            options={options.technicians.map((t) => ({ value: String(t.id), label: t.fullName }))}
          />
          <PickOne
            id="f-reporter"
            label="Reporter"
            anyLabel="Any reporter"
            value={filters.reporterId}
            onChange={(v) => onChange({ reporterId: v })}
            options={options.reporters.map((u) => ({ value: String(u.id), label: u.fullName }))}
          />
        </>
      )}
      <PickOne
        id="f-sla"
        label="SLA status"
        anyLabel="Any SLA status"
        value={filters.slaStatus}
        onChange={(v) => onChange({ slaStatus: v })}
        options={Object.entries(SLA_STATUSES).map(([value, s]) => ({ value, label: s.label }))}
      />
      <DateRange from={filters.reportedFrom} to={filters.reportedTo} onChange={onChange} />
      <div className="flex items-center gap-3 self-end pb-1">
        <Switch
          id="f-escalated"
          checked={filters.escalatedOnly}
          onCheckedChange={(v) => onChange({ escalatedOnly: v })}
        />
        <Label htmlFor="f-escalated">Escalated only</Label>
      </div>
    </div>
  )
}

function activeChips(f, options) {
  const name = (list, idValue, key = 'name') =>
    list.find((x) => String(x.id) === idValue)?.[key] ?? `#${idValue}`
  const chips = []
  if (f.q) chips.push({ key: 'q', label: `Search: “${f.q}”`, clear: { q: '' } })
  if (f.status.length)
    chips.push({
      key: 'status',
      label: `Status: ${f.status.map((s) => STATUSES[s].label).join(', ')}`,
      clear: { status: [] },
    })
  if (f.priority.length)
    chips.push({
      key: 'priority',
      label: `Priority: ${f.priority.join(', ')}`,
      clear: { priority: [] },
    })
  if (f.categoryId)
    chips.push({
      key: 'categoryId',
      label: `Category: ${name(options.categories, f.categoryId)}`,
      clear: { categoryId: '' },
    })
  if (f.serviceId)
    chips.push({
      key: 'serviceId',
      label: `Service: ${name(options.services, f.serviceId)}`,
      clear: { serviceId: '' },
    })
  if (f.technicianId)
    chips.push({
      key: 'technicianId',
      label: `Technician: ${name(options.technicians, f.technicianId, 'fullName')}`,
      clear: { technicianId: '' },
    })
  if (f.reporterId)
    chips.push({
      key: 'reporterId',
      label: `Reporter: ${name(options.reporters, f.reporterId, 'fullName')}`,
      clear: { reporterId: '' },
    })
  if (f.reportedFrom || f.reportedTo) {
    const range = [
      f.reportedFrom && `from ${formatDate(f.reportedFrom)}`,
      f.reportedTo && `to ${formatDate(f.reportedTo)}`,
    ]
      .filter(Boolean)
      .join(' ')
    chips.push({
      key: 'reported',
      label: `Reported ${range}`,
      clear: { reportedFrom: '', reportedTo: '' },
    })
  }
  if (f.slaStatus)
    chips.push({
      key: 'slaStatus',
      label: `SLA: ${SLA_STATUSES[f.slaStatus].label}`,
      clear: { slaStatus: '' },
    })
  if (f.escalatedOnly)
    chips.push({ key: 'escalatedOnly', label: 'Escalated only', clear: { escalatedOnly: false } })
  return chips
}

export function IncidentFilters({ filters, onChange, onClearAll, isAdmin, resultCount }) {
  const options = useFilterOptions(isAdmin)
  const wide = useWideScreen()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(filters.q)
  const active = countActive(filters)
  const chips = activeChips(filters, options)

  // the search box waits until typing pauses
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() !== filters.q) onChange({ q: query.trim() })
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])
  useEffect(() => setQuery(filters.q), [filters.q]) // eslint-disable-line react-hooks/set-state-in-effect

  const fields = (
    <FilterFields filters={filters} onChange={onChange} isAdmin={isAdmin} options={options} />
  )

  return (
    <div className="mb-4 grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, description or INC number"
            aria-label="Search incidents"
            className="h-9 bg-popover pl-9"
          />
        </div>
        <Button
          variant="outline"
          className="h-9"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <SlidersHorizontal aria-hidden="true" />
          Filters
          {active > 0 && (
            <span className="rounded-full bg-role px-1.5 text-xs leading-5 font-bold text-primary-foreground">
              {active}
            </span>
          )}
        </Button>
        {(active > 0 || filters.q) && (
          <Button variant="ghost" className="h-9" onClick={onClearAll}>
            Clear all
          </Button>
        )}
        {resultCount !== undefined && (
          <span className="ml-auto text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">{resultCount}</span>{' '}
            {resultCount === 1 ? 'incident' : 'incidents'}
          </span>
        )}
      </div>

      {wide ? (
        open && <div className="rounded-xl border border-border bg-card p-4">{fields}</div>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85svh] gap-0 overflow-y-auto rounded-t-xl p-5"
          >
            <SheetTitle className="mb-1 text-lg font-bold">Filters</SheetTitle>
            <SheetDescription className="mb-4">
              Every filter narrows the list further.
            </SheetDescription>
            {fields}
            <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
              Show {resultCount ?? ''} {resultCount === 1 ? 'incident' : 'incidents'}
            </Button>
          </SheetContent>
        </Sheet>
      )}

      {chips.length > 0 && (
        <ul aria-label="Active filters" className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onChange(c.clear)}
                className="inline-flex items-center gap-1 rounded-full border border-role/30 bg-role-soft py-0.5 pr-1.5 pl-2.5 text-xs font-medium outline-none hover:bg-role/15 focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label}
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
