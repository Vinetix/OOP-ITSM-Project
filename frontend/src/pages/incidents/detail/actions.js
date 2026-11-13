// Everything the action bar needs to know about each lifecycle action: its
// button, its dialog, the API call and the success message. The server's
// allowedActions decide which of these appear; this file only describes them.
import {
  Archive,
  CheckCheck,
  CircleCheckBig,
  MessageCircleQuestion,
  MessageCircleReply,
  Play,
  RotateCcw,
  ThumbsUp,
  UserPlus,
  WandSparkles,
} from 'lucide-react'
import { incidentsApi } from '@/api/incidentsApi'
import { optionalText } from '@/lib/validation'

export const ACTIONS = {
  ASSIGN: {
    label: (incident) => (incident.assignedTechnician ? 'Re-assign…' : 'Assign…'),
    icon: UserPlus,
    primary: true,
    custom: 'assign', // its own dialog: ranked recommendations to choose from
  },
  // not a server action of its own: offered alongside ASSIGN (see ActionBar)
  AUTO_ASSIGN: {
    label: 'Auto-assign',
    icon: WandSparkles,
    custom: 'auto',
  },
  ACKNOWLEDGE: {
    label: 'Acknowledge',
    icon: CircleCheckBig,
    primary: true,
    title: 'Acknowledge this incident?',
    description: 'This stops the response clock and tells the reporter you’ve picked it up.',
    confirm: 'Acknowledge',
    fields: [],
    run: (id) => incidentsApi.acknowledge(id),
    done: 'Incident acknowledged',
  },
  START: {
    label: 'Start work',
    icon: Play,
    primary: true,
    title: 'Start working on it?',
    description: 'The status changes to In progress.',
    confirm: 'Start work',
    fields: [],
    run: (id) => incidentsApi.start(id),
    done: 'Work started',
  },
  PROVIDE_INFO: {
    label: 'Answer question',
    icon: MessageCircleReply,
    primary: true,
    title: 'Answer the technician',
    description: 'Once you answer, the technician carries on.',
    showQuestion: true,
    confirm: 'Send answer',
    fields: [{ name: 'message', label: 'Your answer', required: true, max: 2000 }],
    run: (id, v) => incidentsApi.provideInfo(id, v.message.trim()),
    done: 'Answer sent',
  },
  RESOLVE: {
    label: 'Resolve',
    icon: CheckCheck,
    primary: true,
    title: 'Resolve this incident',
    description: 'The reporter will be asked to confirm that the fix works.',
    confirm: 'Resolve',
    fields: [
      { name: 'resolutionSummary', label: 'What fixed it?', required: true, max: 2000 },
      { name: 'rootCause', label: 'Root cause', optional: true, max: 1000, rows: 2 },
    ],
    run: (id, v) =>
      incidentsApi.resolve(id, {
        resolutionSummary: v.resolutionSummary.trim(),
        rootCause: optionalText(v.rootCause),
      }),
    done: 'Incident resolved',
  },
  VERIFY: {
    label: 'Confirm fix',
    icon: ThumbsUp,
    primary: true,
    title: 'Confirm the fix works',
    description: 'If you like, rate how it was handled. Both are optional.',
    confirm: 'Confirm fix',
    fields: [
      { name: 'rating', kind: 'stars', label: 'Rating' },
      { name: 'feedback', label: 'Feedback', optional: true, max: 1000, rows: 3 },
    ],
    run: (id, v) =>
      incidentsApi.verify(id, {
        rating: v.rating || undefined,
        feedback: optionalText(v.feedback),
      }),
    done: 'Thanks, the fix is confirmed',
  },
  CLOSE: {
    label: 'Close incident',
    icon: Archive,
    primary: true,
    title: 'Close this incident',
    description: 'A closed incident can’t be changed or commented on.',
    confirm: 'Close incident',
    fields: [{ name: 'closureNote', label: 'Closure note', optional: true, max: 1000, rows: 3 }],
    run: (id, v) => incidentsApi.close(id, optionalText(v.closureNote)),
    done: 'Incident closed',
  },
  REQUEST_INFO: {
    label: 'Ask reporter',
    icon: MessageCircleQuestion,
    title: 'Ask the reporter a question',
    description: 'The incident waits for their answer. Note: the SLA clock keeps running.',
    confirm: 'Send question',
    fields: [{ name: 'message', label: 'Your question', required: true, max: 2000 }],
    run: (id, v) => incidentsApi.requestInfo(id, v.message.trim()),
    done: 'Question sent to the reporter',
  },
  REOPEN: {
    label: 'Not fixed: reopen',
    icon: RotateCcw,
    title: 'Reopen this incident',
    description: 'It goes back to the technician with your reason.',
    confirm: 'Reopen incident',
    destructive: true,
    fields: [{ name: 'message', label: 'What’s still not working?', required: true, max: 2000 }],
    run: (id, v) => incidentsApi.reopen(id, v.message.trim()),
    done: 'Incident reopened',
  },
}

// button order: the natural next steps first, side paths last
export const ACTION_ORDER = [
  'ASSIGN',
  'ACKNOWLEDGE',
  'START',
  'PROVIDE_INFO',
  'RESOLVE',
  'VERIFY',
  'CLOSE',
  'REQUEST_INFO',
  'REOPEN',
]

export const actionLabel = (name, incident) => {
  const label = ACTIONS[name]?.label
  return typeof label === 'function' ? label(incident) : label
}
