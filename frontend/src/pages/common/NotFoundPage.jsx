// Shown for any address that doesn't match a route.
import { useLocation } from 'react-router'
import { StatusScreen } from '@/components/StatusScreen'

export default function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <StatusScreen lit={false} code={404} title="There’s no page at this address">
      <p>
        Nothing lives at <span className="font-semibold break-all text-foreground">{pathname}</span>.
        Check the address, or head back to your home page.
      </p>
    </StatusScreen>
  )
}