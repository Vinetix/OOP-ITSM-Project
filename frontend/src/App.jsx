// Root of every route. It sits inside the router so AuthContext can navigate.
import { Outlet } from 'react-router'
import { AuthProvider } from '@/auth/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={300}>
        <Outlet />
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  )
}
