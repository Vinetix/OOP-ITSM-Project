// Guard for /login and /register: only for people who are NOT logged in.
// A logged-in user is sent on: to the page they originally wanted
// (if it belongs to their role) or to their role home.
import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '@/components/LoadingState'
import { getPostLoginPath } from '@/config/roles'
import { useAuth } from './AuthContext'

export function GuestRoute() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState fullPage label="Restoring your session" />
  if (status === 'authenticated') {
    return <Navigate to={getPostLoginPath(user, location.state?.from)} replace />
  }
  return <Outlet />
}