// The five chart cards: trend, SLA compliance by priority, services, categories,
// and the status and priority mix.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { priorityOf } from '@/config/catalog'
import { STATUSES } from '@/config/incidents'
import { formatDate } from '@/lib/format'
import { ReportCard } from './ReportCard'
import { COLORS, PALETTE, axisProps, dash, percent, tooltipStyle } from './reportBits'

const shortDate = (iso) => formatDate(iso).slice(0, 6) // "02 Nov"

export function TrendChart({ state, days }) {
  return (
    <ReportCard
      title="Incident trend"
      description={`Reported and resolved per day over the last ${days} days, with SLA violations as bars.`}
      state={state}
    >
      {(points) => (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} minTickGap={16} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip {...tooltipStyle} labelFormatter={formatDate} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar
              dataKey="slaViolations"
              name="SLA violations"
              fill={COLORS.violations}
              barSize={10}
              radius={[3, 3, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="reported"
              name="Reported"
              stroke={COLORS.reported}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              name="Resolved"
              stroke={COLORS.resolved}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ReportCard>
  )
}

function SlaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow-sm">
      <p className="font-semibold">
        {p.priority}: {percent(p.compliancePercent)}
      </p>
      <p>
        {p.met} met · {p.breached} breached of {p.measured}
      </p>
      <p className="text-muted-foreground">
        {p.responseViolations} response · {p.resolutionViolations} resolution violations
      </p>
    </div>
  )
}

export function SlaByPriorityChart({ state }) {
  return (
    <ReportCard
      title="SLA compliance by priority"
      description="Share of incidents that met their SLA. A dash means nothing to measure yet."
      state={state}
    >
      {(sla) => (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sla.byPriority} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="priority" {...axisProps} />
            <YAxis domain={[0, 100]} unit="%" {...axisProps} />
            <Tooltip content={<SlaTooltip />} cursor={{ fill: 'var(--accent)' }} />
            <Bar dataKey="compliancePercent" name="Compliance" radius={[4, 4, 0, 0]}>
              {sla.byPriority.map((p) => (
                <Cell
                  key={p.priority}
                  fill={`var(--tone-${priorityOf(p.priority)?.tone ?? 'slate'})`}
                />
              ))}
              <LabelList
                dataKey="compliancePercent"
                position="top"
                formatter={(v) => (v === null || v === undefined ? dash : `${Math.round(v)}%`)}
                style={{ fill: COLORS.axis, fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ReportCard>
  )
}

export function ServicesChart({ state, action }) {
  return (
    <ReportCard
      title="Incidents by service"
      description="Total incidents, with how many were critical (P1)."
      state={state}
      action={action}
    >
      {(rows) =>
        rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No incidents in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34 + 40)}>
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="serviceName" width={150} {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--accent)' }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar
                dataKey="totalIncidents"
                name="Total"
                fill={COLORS.total}
                radius={[0, 4, 4, 0]}
                barSize={12}
              />
              <Bar
                dataKey="criticalIncidents"
                name="Critical"
                fill={COLORS.critical}
                radius={[0, 4, 4, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    </ReportCard>
  )
}

function Donut({ data, height = 220, inner = 55 }) {
  if (!data.length)
    return <p className="text-sm text-muted-foreground">Nothing to show for this period.</p>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={inner}
          outerRadius={inner + 30}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} stroke="var(--card)" />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function CategoriesChart({ state }) {
  return (
    <ReportCard
      title="Incidents by category"
      description="What kind of problems were reported."
      state={state}
    >
      {(rows) => (
        <Donut
          height={260}
          data={rows
            .filter((r) => r.totalIncidents > 0)
            .map((r, i) => ({
              name: r.name,
              value: r.totalIncidents,
              color: PALETTE[i % PALETTE.length],
            }))}
        />
      )}
    </ReportCard>
  )
}

export function MixChart({ state }) {
  return (
    <ReportCard
      title="Status and priority mix"
      description="Where incidents in this period stand, and how urgent they were."
      state={state}
    >
      {(o) => (
        <div className="grid gap-2 sm:grid-cols-2">
          <Donut
            inner={40}
            data={Object.entries(o.byStatus ?? {}).map(([s, v]) => ({
              name: STATUSES[s]?.label ?? s,
              value: v,
              color: `var(--tone-${STATUSES[s]?.tone ?? 'slate'})`,
            }))}
          />
          <Donut
            inner={40}
            data={Object.entries(o.byPriority ?? {})
              .filter(([, v]) => v > 0)
              .map(([p, v]) => ({
                name: p,
                value: v,
                color: `var(--tone-${priorityOf(p)?.tone ?? 'slate'})`,
              }))}
          />
        </div>
      )}
    </ReportCard>
  )
}
