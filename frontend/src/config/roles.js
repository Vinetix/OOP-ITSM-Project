// Everything the UI needs to know about each role, in one place.
// The app shell, route guards and login redirect all read from here.

export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  TECHNICIAN: 'TECHNICIAN',
  ADMIN: 'ADMIN',
}

export const ROLE_CONFIG = {
  EMPLOYEE: {
    label: 'Employee',
    home: '/employee',
    accent: '#1f5fad', // signal blue (the CSS reads this via data-role)
  },
  TECHNICIAN: {
    label: 'Technician',
    home: '/technician',
    accent: '#0e7c78', // signal teal
  },
  ADMIN: {
    label: 'Admin',
    home: '/admin',
    accent: '#3b3f9e', // signal indigo
  },
}

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] ?? null
}

export function getRoleHome(role) {
  return ROLE_CONFIG[role]?.home ?? '/login'
}

/**
 * Where to send a user right after login.
 * If they were bounced to /login from a page that belongs to their role,
 * return them there; otherwise go to their role home. (This stops an
 * employee who logs in after an admin's session ended landing on Forbidden.)
 */
export function getPostLoginPath(user, from) {
  const home = getRoleHome(user?.role)
  const wanted = from?.pathname
  if (wanted && (wanted === home || wanted.startsWith(`${home}/`))) {
    return `${wanted}${from.search ?? ''}`
  }
  return home
}