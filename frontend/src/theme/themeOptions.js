// The three theme choices, shared by the top-bar toggle and the Profile page.
import { Monitor, Moon, Sun } from 'lucide-react'

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Pale enamel panels' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easier on the eyes at night' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follow this device’s setting' },
]
