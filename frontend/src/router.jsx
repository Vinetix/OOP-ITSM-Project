// Every route in the app.
//   /login, /register   signed-out only
//   /employee/...       employees    ┐
//   /technician/...     technicians  ├ inside the app shell, built from NAVIGATION
//   /admin/...          admins       ┘
//   /forbidden, *       anyone
import { createBrowserRouter, Navigate } from 'react-router'
import App from './App'
import { useAuth } from '@/auth/AuthContext'
import { GuestRoute } from '@/auth/GuestRoute'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { RoleRoute } from '@/auth/RoleRoute'
import { LoadingState } from '@/components/LoadingState'
import { NAVIGATION } from '@/config/navigation'
import { ROLE_CONFIG, getRoleHome } from '@/config/roles'
import { AppShell } from '@/layouts/AppShell'
import { AuthLayout } from '@/layouts/AuthLayout'
import AdminHomePage from '@/pages/admin/AdminHomePage'
import AssignmentSettingsPage from '@/pages/admin/AssignmentSettingsPage'
import WorkloadPage from '@/pages/admin/WorkloadPage'
import CatalogPage from '@/pages/admin/catalog/CatalogPage'
import SlaPoliciesPage from '@/pages/admin/sla/SlaPoliciesPage'
import UsersPage from '@/pages/admin/UsersPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ComingSoonPage from '@/pages/common/ComingSoonPage'
import IncidentDetailPage from '@/pages/incidents/IncidentDetailPage'
import IncidentListPage from '@/pages/incidents/IncidentListPage'
import ReportIncidentPage from '@/pages/incidents/ReportIncidentPage'
import ForbiddenPage from '@/pages/common/ForbiddenPage'
import NotFoundPage from '@/pages/common/NotFoundPage'
import ProfilePage from '@/pages/common/ProfilePage'
import EmployeeHomePage from '@/pages/employee/EmployeeHomePage'
import MyWorkloadPage from '@/pages/technician/MyWorkloadPage'
import TechnicianHomePage from '@/pages/technician/TechnicianHomePage'

// Pages built so far. Any other nav item gets the Coming Soon page.
const PAGES = {
  '/employee': <EmployeeHomePage />,
  '/employee/profile': <ProfilePage />,
  '/technician': <TechnicianHomePage />,
  '/technician/profile': <ProfilePage />,
  '/admin': <AdminHomePage />,
  '/admin/users': <UsersPage />,
  '/admin/assignment': <AssignmentSettingsPage />,
  '/admin/workload': <WorkloadPage />,
  '/technician/workload': <MyWorkloadPage />,
  '/admin/incidents': <IncidentListPage />,
  '/employee/incidents': <IncidentListPage />,
  '/employee/incidents/new': <ReportIncidentPage />,
  '/technician/incidents': <IncidentListPage />,
  '/admin/catalog': <CatalogPage />,
  '/admin/sla-policies': <SlaPoliciesPage />,
  '/admin/profile': <ProfilePage />,
}

function roleSection(role) {
  const home = ROLE_CONFIG[role].home
  return {
    path: home,
    element: <RoleRoute allow={[role]} />,
    children: [
      {
        element: <AppShell />,
        children: NAVIGATION[role]
          .map((item) => {
            const element =
              !item.soon && PAGES[item.path] ? (
                PAGES[item.path]
              ) : (
                <ComingSoonPage feature={item.label} />
              )
            return item.path === home ? { index: true, element } : { path: item.path, element }
          })
          .concat({ path: `${home}/incidents/:id`, element: <IncidentDetailPage /> }),
      },
    ],
  }
}

function RootRedirect() {
  const { status, user } = useAuth()
  if (status === 'loading') return <LoadingState fullPage label="Restoring your session" />
  return <Navigate to={status === 'authenticated' ? getRoleHome(user.role) : '/login'} replace />
}

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <RootRedirect /> },
      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [roleSection('EMPLOYEE'), roleSection('TECHNICIAN'), roleSection('ADMIN')],
      },
      { path: '/forbidden', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
