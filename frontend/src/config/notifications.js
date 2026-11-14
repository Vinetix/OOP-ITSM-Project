// Icon per notification type. Unknown types (Phase 6 adds SLA ones) get a bell.
import {
  Archive,
  ArrowRightLeft,
  BadgeCheck,
  Bell,
  CircleCheck,
  Gauge,
  Hand,
  Inbox,
  MessageCircleQuestion,
  MessageCircleReply,
  MessageSquare,
  PencilLine,
  RotateCcw,
  UserCheck,
  UserX,
  Wrench,
} from 'lucide-react'

const ICONS = {
  INCIDENT_REPORTED: Inbox,
  INCIDENT_UNASSIGNED: UserX,
  INCIDENT_ASSIGNED: UserCheck,
  INCIDENT_REASSIGNED: ArrowRightLeft,
  INCIDENT_ACKNOWLEDGED: Hand,
  WORK_STARTED: Wrench,
  INFO_REQUESTED: MessageCircleQuestion,
  INFO_PROVIDED: MessageCircleReply,
  INCIDENT_RESOLVED: CircleCheck,
  RESOLUTION_VERIFIED: BadgeCheck,
  INCIDENT_REOPENED: RotateCcw,
  INCIDENT_CLOSED: Archive,
  PRIORITY_CHANGED: Gauge,
  DETAILS_UPDATED: PencilLine,
  COMMENT_ADDED: MessageSquare,
}

export const notificationIcon = (type) => ICONS[type] ?? Bell
