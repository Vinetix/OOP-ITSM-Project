// The frame around every signed-in page: a top bar across the full width,
// the track sidebar on the left (a slide-out sheet on phones), and the page.
// Everything role-specific (colour, home, navigation) comes from config/,
// so the same shell renders three visibly different interfaces.
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Link, Outlet } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { BackendStatus } from '@/components/BackendStatus'
import { RoleBadge } from '@/components/RoleBadge'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { getRoleHome } from '@/config/roles'
import { SidebarNav } from './SidebarNav'
import { UserMenu } from './UserMenu'

export function AppShell() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const home = getRoleHome(user.role)

  return (
    <div className="min-h-svh">
      {/* Top bar. The thin line in the role colour marks whose interface this is. */}
      <header className="sticky top-0 z-40 border-t-[3px] border-b border-t-role border-b-sidebar-border bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <Link
            to={home}
            className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Wordmark />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <RoleBadge role={user.role} className="hidden sm:inline-flex" />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-[60px] hidden h-[calc(100svh-60px)] w-72 shrink-0 flex-col justify-between overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
          <SidebarNav role={user.role} />
          <BackendStatus className="mx-2 mt-6 self-start" />
        </aside>

        {/* Mobile menu: the same navigation in a slide-out sheet */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
            <div className="border-b border-sidebar-border px-5 py-4">
              <SheetTitle asChild>
                <div>
                  <Wordmark />
                </div>
              </SheetTitle>
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
            </div>
            <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-5">
              <SidebarNav role={user.role} onNavigate={() => setMenuOpen(false)} />
              <div className="mx-2 mt-6 flex items-center justify-between gap-2">
                <RoleBadge role={user.role} />
                <BackendStatus />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}