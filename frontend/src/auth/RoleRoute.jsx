// Guard for role-specific sections. Used inside ProtectedRoute,
// so the user is already known to be logged in here.
// Wrong role → /forbidden.
import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'

export function RoleRoute({ allow }) {
  const { user } = useAuth()
  if (!allow.includes(user?.role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}