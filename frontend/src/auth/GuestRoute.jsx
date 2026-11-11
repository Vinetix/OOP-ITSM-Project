// Signed-out users only, so a signed-in user is sent on to their pages.
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
