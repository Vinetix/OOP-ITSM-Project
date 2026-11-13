// Sidebar drawn as a track: one line through every page, the current page's
// lamp lit in the role colour, unbuilt pages with a dashed lamp and "Soon".
import { NavLink, useLocation } from 'react-router'
import { Lamp } from '@/components/Lamp'
import { SoonTag } from '@/components/SoonTag'
import { NAVIGATION } from '@/config/navigation'
import { ROLE_CONFIG } from '@/config/roles'
import { cn } from '@/lib/utils'

export function SidebarNav({ role, onNavigate }) {
  const items = NAVIGATION[role] ?? []
  const home = ROLE_CONFIG[role]?.home
  const { pathname } = useLocation()

  // an item can list sub-paths that belong to another item (My incidents vs Report incident)
  const lit = (matched, item) =>
    matched && !(item.except ?? []).some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <nav aria-label="Main">
      <ul className="relative space-y-0.5">
        {/* the track: above row backgrounds, below the lamps */}
        <span
          aria-hidden="true"
          className="absolute top-4 bottom-4 left-[19px] z-10 w-px bg-foreground/20"
        />
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === home}
              onClick={onNavigate}
              className={({ isActive: matched }) => {
                const isActive = lit(matched, item)
                return cn(
                  'group flex items-center gap-3 rounded-lg py-2 pr-3 pl-[15px] text-[0.95rem] transition-colors outline-none',
                  'focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'bg-role-soft font-semibold text-foreground'
                    : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground',
                  item.soon && !isActive && 'text-muted-foreground',
                )
              }}
            >
              {({ isActive: matched }) => {
                const isActive = lit(matched, item)
                return (
                  <>
                    <span className="relative z-20 flex size-2.5 items-center justify-center rounded-full bg-sidebar">
                      {isActive ? (
                        // the key makes the lamp switch on again on every visit
                        <Lamp
                          key={item.path}
                          tone="role"
                          className="size-2.5 animate-in fade-in zoom-in-0 animation-duration-300"
                        />
                      ) : item.soon ? (
                        <Lamp lit={false} className="size-2.5" />
                      ) : (
                        <span className="size-2.5 rounded-full border-[1.5px] border-foreground/35 bg-sidebar group-hover:border-foreground/60" />
                      )}
                    </span>
                    <item.icon
                      aria-hidden="true"
                      className={cn('size-4 shrink-0', isActive ? 'text-role' : 'opacity-60')}
                    />
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                    {item.soon && <SoonTag />}
                  </>
                )
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
