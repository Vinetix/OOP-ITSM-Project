// Layout for /login and /register.
// Large screens: a panel on the left shows how an incident travels through
// the system, as stations on a track whose lamps light up one after another.
// Small screens: just the wordmark above the form.
import { Outlet } from 'react-router'
import { BackendStatus } from '@/components/BackendStatus'
import { Lamp } from '@/components/Lamp'
import { Wordmark } from '@/components/Wordmark'

// The real lifecycle of an incident, in order (so a sequence is justified here).
const STATIONS = [
  { name: 'Reported', detail: 'An employee describes what is broken.' },
  { name: 'Prioritised', detail: 'Ranked P1 to P4 by impact and urgency.' },
  { name: 'Assigned', detail: 'Routed to an available technician.' },
  { name: 'Resolved', detail: 'Closed within its SLA, with every step logged.' },
]

function IncidentTrack() {
  return (
    <ol className="relative space-y-7" aria-label="How an incident is handled">
      {/* the track: one line through every station */}
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-[3px] w-px bg-foreground/25" />
      {STATIONS.map((station, i) => (
        <li key={station.name} className="relative flex gap-5">
          <Lamp
            tone="go"
            className="relative mt-2 animate-in fade-in zoom-in-0 fill-mode-both animation-duration-500"
            style={{ animationDelay: `${300 + i * 450}ms` }}
          />
          <div>
            <p className="text-lg font-bold">{station.name}</p>
            <p className="text-muted-foreground">{station.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between gap-12 border-r border-sidebar-border bg-sidebar px-12 py-10 lg:flex xl:px-16">
        <Wordmark />
        <div className="max-w-md space-y-12">
          <p className="text-5xl leading-[1.05] font-extrabold tracking-tight text-balance">
            Every IT incident, from report to resolution.
          </p>
          <IncidentTrack />
        </div>
        <p className="text-sm text-muted-foreground">
          Intelligent IT Service Management. OOP course project, BITS Pilani Hyderabad.
        </p>
      </aside>

      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Wordmark className="lg:invisible" />
          <BackendStatus />
        </div>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}