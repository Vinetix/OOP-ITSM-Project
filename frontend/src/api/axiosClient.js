// The one Axios instance every API module uses. It adds the token to each
// request and ends the session when the server answers 401.
import axios from 'axios'

const TOKEN_KEY = 'itsm.accessToken'

// Never send a token to these, and never treat their 401 as "session expired".
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register', '/api/system/info']

// Kept in localStorage so a refresh doesn't log you out. Only this file touches it.
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
      // storage blocked (strict private mode): the session lasts until refresh
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

// AuthContext plugs a function in here, so this file never imports React.
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
