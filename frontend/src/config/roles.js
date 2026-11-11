// What the UI needs to know about each role.

export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  TECHNICIAN: 'TECHNICIAN',
  ADMIN: 'ADMIN',
}

export const ROLE_CONFIG = {
  EMPLOYEE: {
    label: 'Employee',
    home: '/employee',
    accent: '#1f5fad', // matches the data-role colours in index.css
  },
  TECHNICIAN: {
    label: 'Technician',
    home: '/technician',
    accent: '#0e7c78',
  },
  ADMIN: {
    label: 'Admin',
    home: '/admin',
    accent: '#3b3f9e',
  },
}

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] ?? null
}

export function getRoleHome(role) {
  return ROLE_CONFIG[role]?.home ?? '/login'
}

// After login, go back to the page you were sent away from, but only if it
// belongs to your role. Otherwise, your home page.
export function getPostLoginPath(user, from) {
  const home = getRoleHome(user?.role)
  const wanted = from?.pathname
  if (wanted && (wanted === home || wanted.startsWith(`${home}/`))) {
    return `${wanted}${from.search ?? ''}`
  }
  return home
}
