// The single Axios instance used by every API module.
// - Base URL comes from .env (VITE_API_BASE_URL).
// - A request interceptor attaches "Authorization: Bearer <token>".
// - A response interceptor reacts to 401s: the session is cleared and the
//   app is told, so it can redirect to /login.
import axios from 'axios'

const TOKEN_KEY = 'itsm.accessToken'

// Paths that must never send a token and never trigger "session expired".
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register', '/api/system/info']

/*
  Token storage. localStorage keeps you logged in across refreshes.
  Trade-off: any script running on the page (an XSS bug) could read it;
  an httpOnly cookie would be safer but needs backend support. Acceptable
  for this course project. Only this file touches localStorage.
*/
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Storage blocked (e.g. strict private mode): the session lasts until refresh.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // nothing to clear
    }
  },
}

// AuthContext registers a function here so this file never needs to import
// React or the router. (The API layer stays independent of the UI layer.)
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

function isPublicPath(url = '') {
  return PUBLIC_PATHS.some((path) => url.startsWith(path))
}

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

axiosClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token && !isPublicPath(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401 && !isPublicPath(error.config?.url)) {
      tokenStorage.clear()
      unauthorizedHandler?.(error)
    }
    return Promise.reject(error)
  },
)