// Shown when a signed-in user opens a page that belongs to another role.
import { useAuth } from '@/auth/AuthContext'
import { StatusScreen } from '@/components/StatusScreen'
import { getRoleConfig } from '@/config/roles'

export default function ForbiddenPage() {
  const { user } = useAuth()
  const role = getRoleConfig(user?.role)

  return (
    <StatusScreen tone="stop" code={403} title="This page belongs to another role">
      {role ? (
        <p>
          You’re signed in as {user.fullName} ({role.label}). Your pages start at {role.home}.
        </p>
      ) : (
        <p>Sign in with an account that has access to this page.</p>
      )}
    </StatusScreen>
  )
}
