// Top-bar account menu: avatar with initials, name, and a dropdown
// with Profile and Log out.
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getRoleHome } from '@/config/roles'

function initials(name = '') {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase()
}

export function UserMenu() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 outline-none hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-foreground/5"
        aria-label={`Account menu for ${user.fullName}`}
      >
        <Avatar>
          <AvatarFallback className="bg-role text-xs font-bold text-primary-foreground">
            {initials(user.fullName)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-40 truncate font-semibold sm:block">{user.fullName}</span>
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block font-semibold text-foreground">{user.fullName}</span>
          <span className="block truncate text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`${getRoleHome(user.role)}/profile`}>
            <UserRound aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={logout}>
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}