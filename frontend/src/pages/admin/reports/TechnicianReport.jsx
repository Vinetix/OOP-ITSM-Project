// Technician performance: a sortable table (with CSV download) and a small chart
// of resolved incidents against SLA violations per technician.
import { useState } from 'react'
import { ArrowDown, ArrowUp, Download } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { WorkloadBar } from '@/components/assignment/WorkloadBar'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import { COLORS, ReportCard, axisProps, minutes, rating, tooltipStyle } from './reportBits'

const COLUMNS = [
  { key: 'fullName', label: 'Technician' },
  { key: 'activeIncidents', label: 'Active / max' },
  { key: 'resolvedIncidents', label: 'Resolved' },
  { key: 'averageResolutionMinutes', label: 'Avg resolution' },
  { key: 'slaViolations', label: 'SLA violations' },
  { key: 'averageRating', label: 'Avg rating' },
]

function sortRows(rows, { key, dir }) {
  return [...rows].sort((a, b) => {
    const x = a[key]
    const y = b[key]
    if (x === undefined || x === null) return 1 // missing values always last
    if (y === undefined || y === null) return -1
    const order = typeof x === 'string' ? x.localeCompare(y) : x - y
    return dir === 'asc' ? order : -order
  })
}

export function technicianCsv(rows, label) {
  downloadCsv(
    `technicians-${label}.csv`,
    [
      { header: 'Technician', value: (r) => r.fullName },
      { header: 'Senior', value: (r) => (r.senior ? 'yes' : 'no') },
      { header: 'Active incidents', value: (r) => r.activeIncidents },
      { header: 'Max active', value: (r) => r.maxActiveIncidents },
      { header: 'Resolved', value: (r) => r.resolvedIncidents },
      { header: 'Avg resolution (min)', value: (r) => r.averageResolutionMinutes ?? '' },
      { header: 'SLA violations', value: (r) => r.slaViolations },
      { header: 'Avg rating', value: (r) => r.averageRating ?? '' },
    ],
    rows,
  )
}

export function TechnicianReport({ state, periodLabel }) {
  const [sort, setSort] = useState({ key: 'fullName', dir: 'asc' })
  const toggle = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'fullName' ? 'asc' : 'desc' },
    )

  return (
    <ReportCard
      title="Technician performance"
      description="Resolved incidents, speed, SLA violations and ratings in this period. Click a column to sort."
      state={state}
      height="h-72"
      action={
        state.data && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => technicianCsv(state.data, periodLabel)}
          >
            <Download aria-hidden="true" />
            Download CSV
          </Button>
        )
      }
    >
      {(rows) => (
        <div className="grid gap-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={
                        sort.key === c.key
                          ? sort.dir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="py-2 pr-3 font-medium"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(c.key)}
                        className="inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {c.label}
                        {sort.key === c.key &&
                          (sort.dir === 'asc' ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          ))}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortRows(rows, sort).map((r) => (
                  <tr key={r.technicianId}>
                    <td className="py-2.5 pr-3">
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {r.fullName}
                        {r.senior && (
                          <span className="rounded-sm border border-technician/30 px-1.5 py-0.5 text-xs text-technician">
                            Senior
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="w-40 py-2.5 pr-3">
                      <WorkloadBar workload={{ ...r, active: true }} size="sm" />
                    </td>
                    <td className="py-2.5 pr-3 font-semibold tabular-nums">
                      {r.resolvedIncidents}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {minutes(r.averageResolutionMinutes)}
                    </td>
                    <td
                      className={`py-2.5 pr-3 tabular-nums ${r.slaViolations ? 'font-semibold text-destructive' : ''}`}
                    >
                      {r.slaViolations}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{rating(r.averageRating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="fullName" {...axisProps} tickFormatter={(n) => n.split(' ')[0]} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--accent)' }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar
                dataKey="resolvedIncidents"
                name="Resolved"
                fill={COLORS.resolved}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="slaViolations"
                name="SLA violations"
                fill={COLORS.violations}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ReportCard>
  )
}
