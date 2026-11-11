// Full-page message used by Forbidden and Not Found:
// a large lamp, a plain explanation, and a way back.
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/Wordmark'
import { getRoleConfig } from '@/config/roles'
import { cn } from '@/lib/utils'
import { Lamp } from './Lamp'

export function StatusScreen({ tone, lit = true, code, title, children }) {
  const { user } = useAuth()
  const roleConfig = getRoleConfig(user?.role)

  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <Link
        to={roleConfig?.home ?? '/login'}
        className="self-start rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Wordmark />
      </Link>
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="max-w-lg space-y-6">
          <div className="flex items-center gap-4">
            <Lamp tone={tone} lit={lit} className={cn('size-5', lit ? 'ring-[6px]' : 'border-2')} />
            <span className="font-semibold text-muted-foreground">Error {code}</span>
          </div>
          <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">{title}</h1>
          <div className="space-y-2 text-lg text-muted-foreground">{children}</div>
          <Button asChild size="lg" className="h-10">
            {roleConfig ? (
              <Link to={roleConfig.home}>Go to your {roleConfig.label.toLowerCase()} home</Link>
            ) : (
              <Link to="/login">Go to sign in</Link>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}