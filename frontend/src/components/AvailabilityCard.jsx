// The technician's own availability switch. It flips straight away, then
// confirms with the server, and goes back if that fails.
import { useState } from 'react'
import { toast } from 'sonner'
import { usersApi } from '@/api/usersApi'
import { useAuth } from '@/auth/AuthContext'
import { Lamp } from '@/components/Lamp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getErrorMessage } from '@/lib/errors'

// onChanged: called after a successful change (e.g. to refetch the workload)
export function AvailabilityCard({ onChanged }) {
  const { user, updateUser } = useAuth()
  // while a change is being saved the switch shows it; otherwise it follows the server
  const [pending, setPending] = useState(null)
  const available = pending ?? Boolean(user.available)

  // Flip the switch straight away, then confirm with the server; undo it if that fails.
  async function handleChange(next) {
    setPending(next)
    try {
      updateUser(await usersApi.setMyAvailability(next))
      onChanged?.()
      toast.success(
        next ? 'You’re available for new incidents' : 'You won’t be assigned new incidents',
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setPending(null) // back to the server's value: the new one, or the old one on failure
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
            disabled={pending !== null}
          />
        </div>
      </CardContent>
    </Card>
  )
}
