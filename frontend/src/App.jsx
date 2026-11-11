// Root of every route: makes the auth session and toasts available everywhere.
// (It sits inside the router so AuthContext can use navigation.)
import { Outlet } from 'react-router'
import { AuthProvider } from '@/auth/AuthContext'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  )
}