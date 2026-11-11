// Toasts. Replaces shadcn's version, which needed next-themes; we have one theme.
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react'
import { Toaster as Sonner } from 'sonner'

function Toaster(props) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-4 text-lamp-go" />,
        info: <Info className="size-4 text-role" />,
        warning: <TriangleAlert className="size-4 text-lamp-caution" />,
        error: <CircleAlert className="size-4 text-lamp-stop" />,
        loading: <LoaderCircle className="size-4 animate-spin" />,
      }}
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius-xl)',
      }}
      toastOptions={{ className: 'font-sans' }}
      {...props}
    />
  )
}

export { Toaster }
