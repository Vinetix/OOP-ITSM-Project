// Admin dashboard: live user counts, the technicians and whether they can
// take work, and shortcuts to every admin section (most arrive in later phases).
import { ArrowRight, Users } from 'lucide-react'
import { Link } from 'react-router'
import { usersApi } from '@/api/usersApi'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Lamp } from '@/components/Lamp'
import { PageHeader } from '@/components/PageHeader'
import { SoonTag } from '@/components/SoonTag'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NAVIGATION } from '@/config/navigation'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/utils'

// Each count is one request with size=1: we only need totalElements.
async function loadCounts() {
  const count = (filters) => usersApi.list({ ...filters, size: 1 }).then((p) => p.totalElements)
  const [employees, technicians, admins, inactive] = await Promise.all([
    count({ role: 'EMPLOYEE' }),
    count({ role: 'TECHNICIAN' }),
    count({ role: 'ADMIN' }),
    count({ active: false }),
  ])
  return { employees, technicians, admins, inactive }
}

// Each tile links to the Users page with the matching filter applied.
const COUNT_TILES = [
  { key: 'employees', label: 'Employees', lamp: 'bg-employee text-employee', to: '/admin/users?role=EMPLOYEE' },
  { key: 'technicians', label: 'Technicians', lamp: 'bg-technician text-technician', to: '/admin/users?role=TECHNICIAN' },
  { key: 'admins', label: 'Admins', lamp: 'bg-admin text-admin', to: '/admin/users?role=ADMIN' },
  { key: 'inactive', label: 'Inactive users', lamp: 'bg-lamp-stop text-lamp-stop', to: '/admin/users?active=false' },
]

const SECTION_DESCRIPTIONS = {
  '/admin/incidents': 'Every incident across the organisation.',
  '/admin/users': 'Create accounts, edit details, activate or deactivate.',
  '/admin/services': 'The IT services incidents are reported against.',
  '/admin/sla': 'Response and resolution targets per priority.',
  '/admin/assignment': 'How incidents are routed to technicians.',
  '/admin/reports': 'Volumes, SLA performance and workload.',
  '/admin/audit': 'A record of every action taken.',
}

function CountsPanel() {
  const { data, error, loading, reload } = useAsync(loadCounts, [])

  if (error) return <ErrorAlert error={error} title="Couldn’t load user counts" onRetry={reload} />

  return (
    <Card className="py-0">
      {/* 2×2 on phones, one row of 4 on laptops, with hairline rules between tiles */}
      <ul className="grid grid-cols-2 lg:grid-cols-4">
        {COUNT_TILES.map((tile, i) => (
          <li
            key={tile.key}
            className={cn(
              'border-border',
              i < 2 && 'border-b lg:border-b-0',
              i % 2 === 0 && 'border-r',
              i < 3 ? 'lg:border-r' : 'lg:border-r-0',
            )}
          >
            <Link
              to={tile.to}
              className="group flex h-full flex-col gap-3 p-5 outline-none hover:bg-foreground/[0.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className={cn('size-2 rounded-full ring-[3px] ring-current/20', tile.lamp)}
                />
                {tile.label}
              </span>
              {loading && !data ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="text-4xl leading-none font-extrabold">{data?.[tile.key]}</span>
              )}
              <span className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                View list
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function TechniciansCard() {
  const { data: technicians, error, loading, reload } = useAsync(
    () => usersApi.listTechnicians(),
    [],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Technicians</CardTitle>
        <CardDescription>Who can take new incidents right now.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorAlert error={error} title="Couldn’t load technicians" onRetry={reload} />
        ) : loading && !technicians ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : technicians.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No technicians yet"
            description="Add a technician from the Users page so incidents can be assigned."
          />
        ) : (
          <ul className="divide-y divide-border">
            {technicians.map((tech) => (
              <li
                key={tech.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-semibold">{tech.fullName}</span>
                  {tech.senior && (
                    <span className="rounded-sm border border-technician/30 px-1.5 py-0.5 text-xs leading-none font-semibold text-technician">
                      Senior
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  Max {tech.maxActiveIncidents} active
                </span>
                {tech.active === false ? (
                  <StatusBadge status="INACTIVE" className="w-28" />
                ) : (
                  <StatusBadge
                    status={tech.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                    className="w-28"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function SectionsCard() {
  const sections = NAVIGATION.ADMIN.filter((item) => SECTION_DESCRIPTIONS[item.path])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Admin sections</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="-mx-2 space-y-0.5">
          {sections.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  'flex items-start gap-3 rounded-lg px-2 py-2 outline-none hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50',
                  item.soon && 'text-muted-foreground',
                )}
              >
                {item.soon ? (
                  <Lamp lit={false} className="mt-1.5" />
                ) : (
                  <Lamp tone="role" className="mt-1.5" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className={cn(!item.soon && 'text-foreground')}>{item.label}</span>
                    {item.soon && <SoonTag />}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {SECTION_DESCRIPTIONS[item.path]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function AdminHomePage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Who uses I-ITSM, and which technicians can take new incidents."
        actions={
          <Button asChild size="lg" className="h-10">
            <Link to="/admin/users">
              <Users aria-hidden="true" />
              Manage users
            </Link>
          </Button>
        }
      />
      <div className="space-y-6">
        <CountsPanel />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <TechniciansCard />
          <SectionsCard />
        </div>
      </div>
    </>
  )
}