// Employee home: what needs their action, their latest incidents, their details.
import { FilePlus } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { IncidentCounts } from '@/components/incidents/IncidentCounts'
import { RecentIncidents } from '@/components/incidents/RecentIncidents'
import { InfoList } from '@/components/InfoList'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'

const LIST = '/employee/incidents'

export default function EmployeeHomePage() {
  const { user } = useAuth()
  const firstName = user.fullName.split(' ')[0]

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Report IT problems here and follow each one until it’s fixed."
        actions={
          <Button asChild size="lg" className="h-10">
            <Link to="/employee/incidents/new">
              <FilePlus aria-hidden="true" />
              Report an incident
            </Link>
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-6">
          <IncidentCounts
            listPath={LIST}
            tiles={[
              {
                label: 'Needs your action',
                status: 'AWAITING_INFO,RESOLVED',
                tone: 'purple',
                hint: 'Answer a question or confirm a fix',
              },
              { label: 'All my incidents', status: '', tone: 'slate' },
            ]}
          />
          <RecentIncidents
            title="My recent incidents"
            listPath={LIST}
            columns={['number', 'title', 'priority', 'status', 'sla']}
            rowTag={(i) =>
              ['AWAITING_INFO', 'RESOLVED'].includes(i.status) ? 'Action needed' : null
            }
            empty="You haven’t reported any incidents yet."
            emptyAction={
              <Button asChild variant="outline">
                <Link to="/employee/incidents/new">Report an incident</Link>
              </Button>
            }
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Your details</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoList
              items={[
                { label: 'Name', value: user.fullName },
                { label: 'Department', value: user.department || 'Not set' },
                { label: 'Email', value: user.email },
                { label: 'Member since', value: formatDate(user.createdAt) },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
