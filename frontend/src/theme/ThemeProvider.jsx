// Light, Dark or System (the default, which follows the operating system and
// switches live when it changes). The choice is saved per browser under
// "itsm-theme". index.html applies it before React starts, so there's no flash.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'itsm-theme'
const THEMES = ['light', 'dark', 'system']
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function savedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

function apply(resolved) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved // native date pickers, selects and scrollbars follow
}

const ThemeContext = createContext({ theme: 'system', resolvedTheme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(savedTheme)
  const [systemDark, setSystemDark] = useState(() => media().matches)
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  // follow the operating system live (only matters while "system" is chosen)
  useEffect(() => {
    const m = media()
    const onChange = () => setSystemDark(m.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])

  useEffect(() => apply(resolvedTheme), [resolvedTheme])

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage blocked: the choice lasts until the page is closed
    }
    setThemeState(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext)
