// Only the given roles; anyone else sees Forbidden.
import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'

export function RoleRoute({ allow }) {
  const { user } = useAuth()
  if (!allow.includes(user?.role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
