// The sidebar navigation, drawn as a signal-box track:
// one line runs through every page (a "station"). The current page's lamp is
// lit in the role colour; pages that aren't built yet have a dashed, unlit
// lamp and a "Soon" tag. Used in the desktop sidebar and the mobile menu.
import { NavLink } from 'react-router'
import { Lamp } from '@/components/Lamp'
import { SoonTag } from '@/components/SoonTag'
import { NAVIGATION } from '@/config/navigation'
import { ROLE_CONFIG } from '@/config/roles'
import { cn } from '@/lib/utils'

export function SidebarNav({ role, onNavigate }) {
  const items = NAVIGATION[role] ?? []
  const home = ROLE_CONFIG[role]?.home

  return (
    <nav aria-label="Main">
      <ul className="relative space-y-0.5">
        {/* the track line, behind the lamps but above row backgrounds */}
        <span
          aria-hidden="true"
          className="absolute top-4 bottom-4 left-[19px] z-10 w-px bg-foreground/20"
        />
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === home} // "Home" is only active on the home page itself
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg py-2 pr-3 pl-[15px] text-[0.95rem] transition-colors outline-none',
                  'focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'bg-role-soft font-semibold text-foreground'
                    : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground',
                  item.soon && !isActive && 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-20 flex size-2.5 items-center justify-center rounded-full bg-sidebar">
                    {isActive ? (
                      // key={item.path}: the lamp "switches on" each time you arrive
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
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}