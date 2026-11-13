// Sidebar items per role. The router builds its routes from this list too.
// Items marked soon lead to the Coming Soon page.
import {
  Bell,
  ChartColumn,
  FilePlus,
  Gauge,
  House,
  Inbox,
  Layers,
  LayoutDashboard,
  ListTodo,
  Route,
  ScrollText,
  Timer,
  UserRound,
  Users,
} from 'lucide-react'

export const NAVIGATION = {
  EMPLOYEE: [
    { label: 'Home', path: '/employee', icon: House },
    { label: 'Report incident', path: '/employee/incidents/new', icon: FilePlus },
    {
      label: 'My incidents',
      path: '/employee/incidents',
      icon: ListTodo,
      except: ['/employee/incidents/new'], // that page has its own item
    },
    { label: 'Notifications', path: '/employee/notifications', icon: Bell, soon: true },
    { label: 'Profile', path: '/employee/profile', icon: UserRound },
  ],
  TECHNICIAN: [
    { label: 'Home', path: '/technician', icon: House },
    { label: 'My queue', path: '/technician/incidents', icon: Inbox },
    { label: 'Workload', path: '/technician/workload', icon: Gauge, soon: true },
    { label: 'Notifications', path: '/technician/notifications', icon: Bell, soon: true },
    { label: 'Profile', path: '/technician/profile', icon: UserRound },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'All incidents', path: '/admin/incidents', icon: ListTodo },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Services & categories', path: '/admin/catalog', icon: Layers },
    { label: 'SLA policies', path: '/admin/sla-policies', icon: Timer },
    { label: 'Assignment settings', path: '/admin/assignment', icon: Route, soon: true },
    { label: 'Reports', path: '/admin/reports', icon: ChartColumn, soon: true },
    { label: 'Audit log', path: '/admin/audit', icon: ScrollText, soon: true },
    { label: 'Profile', path: '/admin/profile', icon: UserRound },
  ],
}
