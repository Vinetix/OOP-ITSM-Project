// One user's details. Shows the row we have, then refreshes it from the server.
import { useEffect, useState } from 'react'
import { usersApi } from '@/api/usersApi'
import { InfoList } from '@/components/InfoList'
import { RoleBadge } from '@/components/RoleBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/format'

export function UserDetailsDialog({ open, user, onOpenChange, onEdit }) {
  const [fresh, setFresh] = useState(null)

  useEffect(() => {
    if (!open || !user) return
    let current = true
    usersApi
      .getById(user.id)
      .then((latest) => current && setFresh(latest))
      .catch(() => {}) // the row we already have is good enough to show
    return () => {
      current = false
    }
  }, [open, user])

  // only trust the fetched copy if it belongs to the user being shown
  const shown = fresh?.id === user?.id ? fresh : user
  const isTechnician = shown?.role === 'TECHNICIAN'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {shown && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{shown.fullName}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-3">
                <RoleBadge role={shown.role} />
                <StatusBadge status={shown.active ? 'ACTIVE' : 'INACTIVE'} />
              </DialogDescription>
            </DialogHeader>

            <InfoList
              items={[
                { label: 'Email', value: shown.email },
                { label: 'Phone', value: shown.phone || '—' },
                shown.role === 'EMPLOYEE' && {
                  label: 'Department',
                  value: shown.department || '—',
                },
                isTechnician && {
                  label: 'Seniority',
                  value: shown.senior ? 'Senior technician' : 'Technician',
                },
                isTechnician && {
                  label: 'Experience',
                  value: `${shown.experienceYears ?? 0} years`,
                },
                isTechnician && {
                  label: 'Max workload',
                  value: `${shown.maxActiveIncidents} active incidents`,
                },
                isTechnician && {
                  label: 'Availability',
                  value: <StatusBadge status={shown.available ? 'AVAILABLE' : 'UNAVAILABLE'} />,
                },
                { label: 'Created', value: formatDateTime(shown.createdAt) },
              ].filter(Boolean)}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => onEdit(shown)}>Edit</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
