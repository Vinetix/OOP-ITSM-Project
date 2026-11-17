// The router's error page: a crash while showing a route lands here.
import { useRouteError } from 'react-router'
import { CrashScreen } from '@/components/CrashScreen'

export default function RouteErrorPage() {
  const error = useRouteError()
  return <CrashScreen error={error instanceof Error ? error : null} />
}
