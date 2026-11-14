// Label and icon per audit action. Unknown actions (Phase 6 adds SLA and
// escalation ones) show their raw name with a history icon.
import {
  Archive,
  BadgeCheck,
  CircleCheck,
  FilePlus,
  Gauge,
  Hand,
  History,
  MessageCircleQuestion,
  MessageCircleReply,
  MessageSquare,
  PencilLine,
  RotateCcw,
  Tags,
  UserCheck,
  Wrench,
} from 'lucide-react'

export const AUDIT_ACTIONS = [
  { value: 'REPORTED', label: 'Reported', icon: FilePlus },
  { value: 'CLASSIFY', label: 'Classified', icon: Tags },
  { value: 'ASSIGN', label: 'Assigned', icon: UserCheck },
  { value: 'ACKNOWLEDGE', label: 'Acknowledged', icon: Hand },
  { value: 'START', label: 'Investigation started', icon: Wrench },
  { value: 'REQUEST_INFO', label: 'Information requested', icon: MessageCircleQuestion },
  { value: 'PROVIDE_INFO', label: 'Information provided', icon: MessageCircleReply },
  { value: 'RESOLVE', label: 'Resolved', icon: CircleCheck },
  { value: 'VERIFY', label: 'Verified', icon: BadgeCheck },
  { value: 'REOPEN', label: 'Reopened', icon: RotateCcw },
  { value: 'CLOSE', label: 'Closed', icon: Archive },
  { value: 'PRIORITY_CHANGED', label: 'Priority changed', icon: Gauge },
  { value: 'DETAILS_UPDATED', label: 'Details updated', icon: PencilLine },
  { value: 'NOTE_ADDED', label: 'Note added', icon: MessageSquare },
]

export function auditAction(value) {
  return AUDIT_ACTIONS.find((a) => a.value === value) ?? { value, label: value, icon: History }
}
