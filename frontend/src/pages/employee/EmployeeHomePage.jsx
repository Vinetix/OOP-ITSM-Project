// Employee home: a welcome with their details, the (future) report button,
// and an empty "My recent incidents" section until incidents exist.
import { FilePlus, ListTodo } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { EmptyState } from '@/components/EmptyState'
import { InfoList } from '@/components/InfoList'
import { PageHeader } from '@/components/PageHeader'
import { SoonTag } from '@/components/SoonTag'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'

export default function EmployeeHomePage() {
  const { user } = useAuth()
  const firstName = user.fullName.split(' ')[0]

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Report IT problems here and follow each one until it’s fixed."
        actions={
          <Button size="lg" className="h-10" disabled>
            <FilePlus aria-hidden="true" />
            Report an incident
            <SoonTag className="ml-1 border-primary-foreground/40 text-primary-foreground" />
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">My recent incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ListTodo}
              title="No incidents yet"
              description="Incidents you report will appear here with their priority, assigned technician and progress."
            />
          </CardContent>
        </Card>

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