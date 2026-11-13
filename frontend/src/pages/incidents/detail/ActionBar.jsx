// The buttons for exactly the actions the server allows. The first "next step"
// gets the primary style; the rest are outlined. When ASSIGN is allowed,
// Auto-assign sits right after it (both use the same permission).
import { Button } from '@/components/ui/button'
import { ACTION_ORDER, ACTIONS, actionLabel } from './actions'

export function ActionBar({ incident, onAction }) {
  const allowed = ACTION_ORDER.filter((name) => incident.allowedActions?.includes(name)).flatMap(
    (name) => (name === 'ASSIGN' ? ['ASSIGN', 'AUTO_ASSIGN'] : [name]),
  )
  if (!allowed.length) return null
  const primary = allowed.find((name) => ACTIONS[name].primary)

  return (
    <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Incident actions">
      {allowed.map((name) => {
        const { icon: Icon, destructive } = ACTIONS[name]
        return (
          <Button
            key={name}
            variant={name === primary ? 'default' : destructive ? 'destructive' : 'outline'}
            className="h-9"
            onClick={() => onAction(name)}
          >
            <Icon aria-hidden="true" />
            {actionLabel(name, incident)}
          </Button>
        )
      })}
    </div>
  )
}
