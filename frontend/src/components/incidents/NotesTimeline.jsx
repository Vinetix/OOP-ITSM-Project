// The incident's notes, oldest first. A technician's question and the reporter's
// answer are drawn as speech bubbles so the conversation stands out; a reopen
// reason is marked in amber.
import {
  MessageCircleQuestion,
  MessageCircleReply,
  MessageSquare,
  RotateCcw,
  Wrench,
} from 'lucide-react'
import { RoleBadge } from '@/components/RoleBadge'
import { NOTE_TYPES } from '@/config/incidents'
import { formatDateTime } from '@/lib/format'
import { timeSince } from '@/lib/time'
import { cn } from '@/lib/utils'

const LOOK = {
  COMMENT: { icon: MessageSquare, box: 'bg-card border-border' },
  WORK_NOTE: { icon: Wrench, box: 'bg-card border-border' },
  INFO_REQUEST: {
    icon: MessageCircleQuestion,
    box: 'border-[color:color-mix(in_oklab,var(--tone-purple)_35%,transparent)] bg-[color:color-mix(in_oklab,var(--tone-purple)_7%,transparent)] rounded-tl-sm',
  },
  INFO_RESPONSE: {
    icon: MessageCircleReply,
    box: 'border-[color:color-mix(in_oklab,var(--tone-teal)_35%,transparent)] bg-[color:color-mix(in_oklab,var(--tone-teal)_7%,transparent)] rounded-tr-sm sm:ml-10',
  },
  REOPEN: { icon: RotateCcw, box: 'border-lamp-caution/40 bg-lamp-caution/5' },
}

export function NotesTimeline({ notes = [] }) {
  if (!notes.length) {
    return <p className="text-sm text-muted-foreground">No notes yet.</p>
  }

  return (
    <ol className="grid gap-3">
      {notes.map((note) => {
        const look = LOOK[note.type] ?? LOOK.COMMENT
        const Icon = look.icon
        return (
          <li key={note.id} className={cn('rounded-xl border p-4', look.box)}>
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
              <span className="font-semibold">{note.author?.fullName ?? 'System'}</span>
              {note.author?.role && <RoleBadge role={note.author.role} />}
              <span className="text-muted-foreground">
                · {NOTE_TYPES[note.type]?.label ?? note.type}
              </span>
              <time
                dateTime={note.createdAt}
                title={formatDateTime(note.createdAt)}
                className="ml-auto text-xs text-muted-foreground"
              >
                {timeSince(note.createdAt)}
              </time>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.text}</p>
          </li>
        )
      })}
    </ol>
  )
}
