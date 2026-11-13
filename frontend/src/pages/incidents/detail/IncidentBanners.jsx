// A nudge at the top of the page when the viewer is the one the incident waits for.
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function IncidentBanners({ incident, user, onAction }) {
  const isReporter = incident.reporter?.id === user.id
  const isAssignee = incident.assignedTechnician?.id === user.id
  const can = (a) => incident.allowedActions?.includes(a)

  let banner = null
  if (isReporter && incident.status === 'AWAITING_INFO') {
    banner = {
      text: 'The technician needs more information from you.',
      buttons: can('PROVIDE_INFO') ? [['PROVIDE_INFO', 'Answer question']] : [],
    }
  } else if (isReporter && incident.status === 'RESOLVED') {
    banner = {
      text: 'Please confirm whether the fix works.',
      buttons: [
        can('VERIFY') && ['VERIFY', 'Confirm fix'],
        can('REOPEN') && ['REOPEN', 'Not fixed: reopen'],
      ].filter(Boolean),
    }
  } else if (isAssignee && incident.status === 'ASSIGNED') {
    banner = {
      text: 'Acknowledge to stop the response clock.',
      buttons: can('ACKNOWLEDGE') ? [['ACKNOWLEDGE', 'Acknowledge']] : [],
    }
  }
  if (!banner) return null

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-role/30 bg-role-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-2 font-semibold">
        <Info aria-hidden="true" className="size-4 shrink-0 text-role" />
        {banner.text}
      </p>
      <div className="flex flex-wrap gap-2">
        {banner.buttons.map(([action, label], n) => (
          <Button
            key={action}
            size="sm"
            variant={n === 0 ? 'default' : 'outline'}
            onClick={() => onAction(action)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
