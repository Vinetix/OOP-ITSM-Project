// Technician home: queue counts, the most urgent work, the availability switch,
// work profile and skills.
import { useEffect } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { IncidentCounts } from '@/components/incidents/IncidentCounts'
import { RecentIncidents } from '@/components/incidents/RecentIncidents'
import { InfoList } from '@/components/InfoList'
import { MyWorkloadCard } from '@/components/assignment/AssignmentHomeCards'
import { AvailabilityCard } from '@/components/AvailabilityCard'
import { PageHeader } from '@/components/PageHeader'
import { SkillChips } from '@/components/SkillChips'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export default function TechnicianHomePage() {
  const { user, refreshMe } = useAuth()
  const firstName = user.fullName.split(' ')[0]

  // an admin may have changed skills or workload since sign-in, so fetch the latest
  useEffect(() => {
    refreshMe().catch(() => {}) // the signed-in copy is fine to show meanwhile
  }, [refreshMe])

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Set whether you can take new incidents, and check your work profile."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <IncidentCounts
          className="lg:col-span-2"
          listPath="/technician/incidents"
          tiles={[
            { label: 'Needs acknowledgement', status: 'ASSIGNED', tone: 'blue' },
            { label: 'In progress', status: 'ACKNOWLEDGED,IN_PROGRESS', tone: 'amber' },
            { label: 'Waiting for reporter', status: 'AWAITING_INFO', tone: 'purple' },
          ]}
        />
        <RecentIncidents
          className="lg:col-span-2"
          title="My queue"
          description="Most urgent deadline first."
          listPath="/technician/incidents"
          sort="sla.resolutionDueAt,asc"
          columns={['number', 'title', 'priority', 'status', 'reporter', 'sla']}
          rowTag={(i) => (i.status === 'ASSIGNED' ? 'Needs acknowledgement' : null)}
          empty="Nothing is assigned to you right now."
        />
        <MyWorkloadCard />
        <AvailabilityCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Work profile</CardTitle>
            <CardDescription>Set by your admin. Used when incidents are assigned.</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoList
              items={[
                { label: 'Seniority', value: user.senior ? 'Senior technician' : 'Technician' },
                { label: 'Experience', value: plural(user.experienceYears ?? 0, 'year') },
                {
                  label: 'Max workload',
                  value: `${plural(user.maxActiveIncidents ?? 0, 'active incident')} at once`,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">My skills</CardTitle>
            <CardDescription>
              Set by your admin. From Phase 4, incidents are matched to technicians by these.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillChips skills={user.skills} empty="No skills yet. Ask your admin to add yours." />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
