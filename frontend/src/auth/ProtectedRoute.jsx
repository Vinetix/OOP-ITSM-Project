// Signed-in users only. Others go to /login, which remembers where they were heading.
import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '@/components/LoadingState'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState fullPage label="Restoring your session" />
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
