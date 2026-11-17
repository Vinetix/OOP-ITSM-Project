// "Similar open incidents already reported": information only, submitting
// stays allowed. Numbers are links for staff; employees see plain text
// (they usually can't open other people's incidents).
import { Info } from 'lucide-react'
import { Link } from 'react-router'
import { formatDateTime } from '@/lib/format'
import { timeSince } from '@/lib/time'
import { IncidentStatusBadge } from './IncidentStatusBadge'

export function IncidentNumber({ number, id, linkTo, newTab = false }) {
  if (!linkTo) return <span className="font-mono text-[0.8rem] font-semibold">{number}</span>
  return (
    <Link
      to={`${linkTo}/${id}`}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
      className="font-mono text-[0.8rem] font-semibold underline-offset-2 hover:underline"
    >
      {number}
    </Link>
  )
}

export function SharedWords({ words = [] }) {
  if (!words.length) return null
  return (
    <span className="flex flex-wrap gap-1">
      {words.map((w) => (
        <span key={w} className="rounded-sm bg-muted px-1.5 py-0.5 text-xs">
          {w}
        </span>
      ))}
    </span>
  )
}

export function SimilarIncidentsBox({ items, linkTo }) {
  if (!items.length) return null
  return (
    <section
      aria-labelledby="similar-heading"
      className="grid gap-3 rounded-xl border border-lamp-caution/40 bg-lamp-caution/5 p-4"
    >
      <h2 id="similar-heading" className="flex items-center gap-2 font-semibold">
        <Info
          aria-hidden="true"
          className="size-4 text-[color:color-mix(in_oklab,var(--lamp-caution)_70%,var(--tint-ink))]"
        />
        Similar open incidents already reported
      </h2>
      <ul className="grid gap-3">
        {items.map((s) => (
          <li
            key={s.incidentId}
            className="grid gap-1.5 rounded-lg border border-border bg-card p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <IncidentNumber number={s.number} id={s.incidentId} linkTo={linkTo} newTab />
              <span className="min-w-0 flex-1 font-medium">{s.title}</span>
              <IncidentStatusBadge status={s.status} />
              <span className="font-semibold tabular-nums">{s.score}% match</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {s.serviceName} ·{' '}
              <time dateTime={s.reportedAt} title={formatDateTime(s.reportedAt)}>
                reported {timeSince(s.reportedAt)}
              </time>
            </p>
            <SharedWords words={s.sharedWords} />
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        If it’s the same problem, it’s already being handled. You can still submit your report.
      </p>
    </section>
  )
}
