// Add a note under the timeline. Technicians write work notes; reporters and
// admins write comments (the server decides the type from who's writing).
import { useState } from 'react'
import { incidentsApi } from '@/api/incidentsApi'
import { Textarea } from '@/components/Textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/errors'
import { validateMessage } from '../incidentRules'

export function NoteBox({ incident, role, onDone, onError }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const label = role === 'TECHNICIAN' ? 'Add work note' : 'Add comment'

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validateMessage(text, 2000, 'a note')
    if (problem) return setError(problem)
    setBusy(true)
    try {
      onDone(await incidentsApi.addNote(incident.id, text.trim()), 'Note added')
      setText('')
    } catch (err) {
      if (!onError(err)) setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-2 border-t border-border pt-4">
      <Label htmlFor="note">{label}</Label>
      <Textarea
        id="note"
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby="note-help"
        placeholder={
          role === 'TECHNICIAN'
            ? 'What did you check or change?'
            : 'Anything the technician should know?'
        }
      />
      <div className="flex items-center justify-between gap-3">
        <p
          id="note-help"
          className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
        >
          {error ?? `${text.length}/2000 characters`}
        </p>
        <Button type="submit" disabled={busy} className="h-9">
          {busy ? 'Adding…' : label}
        </Button>
      </div>
    </form>
  )
}
