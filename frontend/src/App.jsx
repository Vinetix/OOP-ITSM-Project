// Root of every route. It sits inside the router so AuthContext can navigate.
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
