// The signed-in user, shared with the whole app:  const { user, login, logout } = useAuth()
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { authApi } from '@/api/authApi'
import { setUnauthorizedHandler, TOKEN_KEY, tokenStorage } from '@/api/axiosClient'
import { usersApi } from '@/api/usersApi'
import { getRoleConfig } from '@/config/roles'

const AuthContext = createContext(null)
const NOTICE_KEY = 'itsm.sessionNotice'

// read once per page load (not in an effect, which runs twice in development)
const startupNotice = (() => {
  try {
    const notice = sessionStorage.getItem(NOTICE_KEY)
    sessionStorage.removeItem(NOTICE_KEY)
    return notice
  } catch {
    return null
  }
})()

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  // 'loading' while a saved token is checked, then 'authenticated' or 'anonymous'
  const [status, setStatus] = useState(() => (tokenStorage.get() ? 'loading' : 'anonymous'))

  // the 401 handler runs outside React, so it reads status from a ref
  const statusRef = useRef(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // On startup, ask the server who a saved token belongs to.
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
        // On a network error the token is kept, so a refresh works once the server is back.
        if (!cancelled) setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Any 401 ends the session; the route guards then send the user to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      const wasRestoring = statusRef.current === 'loading'
      setUser(null)
      setStatus('anonymous')
      if (!wasRestoring) {
        // the id stops several failed requests stacking identical toasts
        toast.error('Your session has expired, please log in again', { id: 'session-ended' })
      }
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // a notice left by a sign-in switch from another tab (see below)
  useEffect(() => {
    if (!startupNotice) return
    const timer = setTimeout(() => toast.info(startupNotice, { id: 'session-changed' }), 0)
    return () => clearTimeout(timer)
  }, [])

  // All tabs share one saved token. If another tab signs out or signs in as
  // someone else, follow it here too, so this tab never acts as a different
  // person than the one it shows.
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])
  useEffect(() => {
    const onStorage = async (event) => {
      if (event.key !== TOKEN_KEY && event.key !== null) return
      const token = tokenStorage.get()
      if (!token) {
        if (!userRef.current) return
        setUser(null)
        setStatus('anonymous')
        toast.info('You signed out in another tab', { id: 'session-changed' })
        navigate('/login', { replace: true })
        return
      }
      try {
        const me = await usersApi.getMe()
        if (userRef.current?.id === me.id) {
          setUser(me)
          setStatus('authenticated')
          return
        }
        // someone else now: reload at their home, so nothing from the previous
        // person's pages survives; the notice is shown after the reload
        try {
          sessionStorage.setItem(
            NOTICE_KEY,
            `You’re now signed in as ${me.fullName} (from another tab)`,
          )
        } catch {
          // no notice then, the switch still happens
        }
        window.location.replace(getRoleConfig(me.role)?.home ?? '/')
      } catch {
        // a bad token ends in the 401 handler above
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [navigate])

  // The accent colour follows the role (see data-role in index.css).
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
      updateUser: setUser, // for when an API call already returned the fresh user
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
