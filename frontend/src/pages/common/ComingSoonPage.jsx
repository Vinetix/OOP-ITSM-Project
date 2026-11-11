// Shown for sidebar sections that arrive in a later phase.
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Lamp } from '@/components/Lamp'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { getRoleHome } from '@/config/roles'

export default function ComingSoonPage({ feature }) {
  const { user } = useAuth()

  return (
    <>
      <PageHeader title={feature} />
      <section className="max-w-xl space-y-4 rounded-xl border border-dashed border-input p-8">
        <div className="flex items-center gap-3">
          <Lamp tone="caution" />
          <p className="font-semibold">Coming in a later phase</p>
        </div>
        <p className="text-muted-foreground">
          {feature} will appear here once the backend supports it. Everything else in the sidebar
          with a lit lamp works today.
        </p>
        <Button asChild variant="outline">
          <Link to={getRoleHome(user.role)}>Back to home</Link>
        </Button>
      </section>
    </>
  )
}
