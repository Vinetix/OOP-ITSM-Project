// Technician home: the availability switch, work profile and (soon) the queue.
import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/api/usersApi'
import { useAuth } from '@/auth/AuthContext'
import { EmptyState } from '@/components/EmptyState'
import { InfoList } from '@/components/InfoList'
import { Lamp } from '@/components/Lamp'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getErrorMessage } from '@/lib/errors'

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function AvailabilityCard() {
  const { user, updateUser } = useAuth()
  const [available, setAvailable] = useState(Boolean(user.available))
  const [saving, setSaving] = useState(false)

  // Flip the switch straight away, then confirm with the server; undo it if that fails.
  async function handleChange(next) {
    setAvailable(next)
    setSaving(true)
    try {
      const updated = await usersApi.setMyAvailability(next)
      updateUser(updated)
      setAvailable(Boolean(updated.available))
      toast.success(
        next ? 'You’re available for new incidents' : 'You won’t be assigned new incidents',
      )
    } catch (error) {
      setAvailable(!next)
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Availability</CardTitle>
        <CardDescription>
          While you’re unavailable, new incidents go to other technicians. Work already assigned to
          you stays with you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-popover px-4 py-4">
          <div className="flex items-center gap-3">
            <Lamp tone={available ? 'go' : 'off'} className="size-3" />
            <Label htmlFor="availability" className="text-base font-semibold">
              {available ? 'Available for new incidents' : 'Not taking new incidents'}
            </Label>
          </div>
          <Switch
            id="availability"
            checked={available}
            onCheckedChange={handleChange}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default function TechnicianHomePage() {
  const { user } = useAuth()
  const firstName = user.fullName.split(' ')[0]

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Set whether you can take new incidents, and check your work profile."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">My queue</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Inbox}
              title="Your queue is empty"
              description="Incidents assigned to you will be listed here, most urgent first."
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
