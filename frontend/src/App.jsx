// Root of every route. It sits inside the router so AuthContext can navigate.
import { Outlet } from 'react-router'
import { AuthProvider } from '@/auth/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotificationsProvider } from '@/notifications/NotificationsContext'
import { useTheme } from '@/theme/ThemeProvider'

export default function App() {
  const { resolvedTheme } = useTheme()
  return (
    <AuthProvider>
      <NotificationsProvider>
        <TooltipProvider delayDuration={300}>
          <Outlet />
          <Toaster theme={resolvedTheme} />
        </TooltipProvider>
      </NotificationsProvider>
    </AuthProvider>
  )
}
