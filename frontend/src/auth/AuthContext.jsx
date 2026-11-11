// Holds the logged-in user for the whole app and exposes login/register/logout.
// Any component can read it with:  const { user, login, logout } = useAuth()
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { authApi } from '@/api/authApi'
import { setUnauthorizedHandler, tokenStorage } from '@/api/axiosClient'
import { usersApi } from '@/api/usersApi'
import { getErrorMessage } from '@/lib/errors'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  // 'loading' while we check a saved token, then 'authenticated' or 'anonymous'
  const [status, setStatus] = useState(() => (tokenStorage.get() ? 'loading' : 'anonymous'))

  // The 401 handler below runs outside React's render cycle, so it reads
  // the latest status from a ref instead of a stale closure.
  const statusRef = useRef(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // 1. On app start: if a token was saved, ask the server who it belongs to.
  useEffect(() => {
    if (!tokenStorage.get()) return
    let cancelled = false
    usersApi
      .getMe()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        // 401: the interceptor already removed the expired token.
        // Network error: keep the token so a refresh works once the server is back.
        if (!cancelled) setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 2. When any request comes back 401 (token expired or invalid), end the session.
  //    The route guards then send the user to /login and remember the page.
  useEffect(() => {
    setUnauthorizedHandler((error) => {
      const wasRestoring = statusRef.current === 'loading'
      setUser(null)
      setStatus('anonymous')
      if (!wasRestoring) {
        // id stops several failing requests from stacking identical toasts
        toast.error(getErrorMessage(error), { id: 'session-ended' })
      }
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // 3. The page accent follows the role: <html data-role="ADMIN"> etc. (see index.css)
  useEffect(() => {
    const root = document.documentElement
    if (user?.role) root.dataset.role = user.role
    else delete root.dataset.role
  }, [user?.role])

  const startSession = useCallback((authResponse) => {
    tokenStorage.set(authResponse.accessToken)
    setUser(authResponse.user)
    setStatus('authenticated')
    return authResponse.user
  }, [])

  const login = useCallback(
    async (email, password) => startSession(await authApi.login({ email, password })),
    [startSession],
  )

  const register = useCallback(
    async (data) => startSession(await authApi.register(data)),
    [startSession],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('anonymous')
    navigate('/login', { replace: true })
  }, [navigate])

  /** Re-read the user from the server (e.g. after editing the profile). */
  const refreshMe = useCallback(async () => {
    const me = await usersApi.getMe()
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      refreshMe,
      updateUser: setUser, // when an API call already returned the fresh user
    }),
    [user, status, login, register, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}