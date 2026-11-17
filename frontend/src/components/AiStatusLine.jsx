// One line for the admin dashboard: whether category suggestions come from an
// AI model or from keyword matching. Hidden while loading and if the call
// fails (older backends don't have this endpoint).
import { intelligenceApi } from '@/api/intelligenceApi'
import { Lamp } from '@/components/Lamp'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/utils'

// "GEMINI" → "Gemini"; unknown names are shown the same way
function providerName(provider) {
  if (!provider) return null
  const text = String(provider).replace(/[_-]+/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function AiStatusLine({ className }) {
  const { data } = useAsync(() => intelligenceApi.status(), [])
  if (!data || typeof data.aiEnabled !== 'boolean') return null

  const on = data.aiEnabled
  const provider = providerName(data.provider)
  return (
    <p className={cn('flex items-center gap-2 text-sm', className)}>
      <Lamp tone={on ? 'go' : 'off'} />
      <span>
        <span className="text-muted-foreground">AI suggestions: </span>
        <span className="font-semibold">{on ? 'On' : 'Off'}</span>
        <span className="text-muted-foreground">
          {on ? (provider ? ` (${provider})` : '') : ' (keyword matching)'}
        </span>
      </span>
    </p>
  )
}
