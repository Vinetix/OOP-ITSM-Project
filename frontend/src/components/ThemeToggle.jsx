// The theme button: shows the current choice (sun, moon or monitor) and opens a
// small menu with Light, Dark and System.
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/theme/ThemeProvider'

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Pale enamel panels' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easier on the eyes at night' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follow this device’s setting' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2]
  const Icon = current.icon

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Theme: ${current.label}. Change theme`}>
          <Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {THEME_OPTIONS.map(({ value, label, icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <OptionIcon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
