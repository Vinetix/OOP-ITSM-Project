package com.itsm.notification;

import com.itsm.incident.Incident;
import com.itsm.incident.NoteType;
import com.itsm.incident.event.IncidentAssignedEvent;
import com.itsm.incident.event.IncidentCreatedEvent;
import com.itsm.incident.event.IncidentDetailsUpdatedEvent;
import com.itsm.incident.event.IncidentEvent;
import com.itsm.incident.event.IncidentNoteAddedEvent;
import com.itsm.incident.event.IncidentPriorityChangedEvent;
import com.itsm.incident.event.IncidentStatusChangedEvent;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.Role;
import com.itsm.user.User;
import com.itsm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Who hears about what. Turns one incident event into zero or more messages, one per recipient.
 * Nobody is notified about their own action, and deactivated users get nothing.
 * Important messages (also emailed) are those that need someone to act, or concern P1/P2 incidents.
 */
@Component
@RequiredArgsConstructor
public class IncidentNotificationRules {

    private final UserRepository userRepository;

    public List<NotificationMessage> messagesFor(IncidentEvent event, Incident incident) {
        Messages out = new Messages(event.actorId(), incident);
        switch (event) {
            case IncidentCreatedEvent e -> out.add(incident.getReporter(), NotificationType.INCIDENT_REPORTED,
                    incident.getNumber() + " received",
                    "We logged \"" + incident.getTitle() + "\" with priority " + incident.getPriority()
                            + ". You'll be notified as it progresses.", false);
            case IncidentAssignedEvent e -> assigned(out, e, incident);
            case IncidentStatusChangedEvent e -> statusChanged(out, e, incident);
            case IncidentPriorityChangedEvent e -> {
                String body = incident.getNumber() + " is now " + e.toPriority() + " (was " + e.fromPriority() + ").";
                boolean important = e.toPriority() == Priority.P1;
                out.add(incident.getReporter(), NotificationType.PRIORITY_CHANGED, "Priority changed on " + incident.getNumber(), body, important);
                out.add(incident.getAssignedTechnician(), NotificationType.PRIORITY_CHANGED, "Priority changed on " + incident.getNumber(), body, important);
            }
            case IncidentNoteAddedEvent e -> {
                if (e.type() == NoteType.COMMENT && incident.isReportedBy(e.actorId())) {
                    out.add(incident.getAssignedTechnician(), NotificationType.COMMENT_ADDED,
                            "New comment on " + incident.getNumber(),
                            incident.getReporter().getFullName() + " added information to \"" + incident.getTitle() + "\".", false);
                }
            }
            case IncidentDetailsUpdatedEvent e -> out.add(incident.getAssignedTechnician(), NotificationType.DETAILS_UPDATED,
                    incident.getNumber() + " was updated", "Changed: " + String.join(", ", e.changedFields()) + ".", false);
            default -> { /* no notification */ }
        }
        return out.list();
    }

    private void assigned(Messages out, IncidentAssignedEvent event, Incident incident) {
        User technician = incident.getAssignedTechnician();
        if (technician == null) {
            return;
        }
        out.add(technician, NotificationType.INCIDENT_ASSIGNED, "You've been assigned " + incident.getNumber(),
                "\"" + incident.getTitle() + "\" (" + incident.getPriority() + ", " + incident.getService().getName()
                        + "). Please acknowledge it.", isUrgent(incident));
        out.add(incident.getReporter(), NotificationType.INCIDENT_ASSIGNED,
                incident.getNumber() + " assigned to " + technician.getFullName(),
                technician.getFullName() + " will handle \"" + incident.getTitle() + "\".", false);
        if (event.previousTechnicianId() != null) {
            userRepository.findById(event.previousTechnicianId()).ifPresent(previous ->
                    out.add(previous, NotificationType.INCIDENT_REASSIGNED, incident.getNumber() + " re-assigned",
                            "It is now handled by " + technician.getFullName() + ". No further action needed from you.", false));
        }
    }

    private void statusChanged(Messages out, IncidentStatusChangedEvent event, Incident incident) {
        String number = incident.getNumber();
        String details = sentence(event.details());
        User reporter = incident.getReporter();
        User technician = incident.getAssignedTechnician();
        switch (event.action()) {
            case CLASSIFY -> {
                // Checked after commit: if auto-assignment worked, the incident is no longer CLASSIFIED.
                if (incident.getStatus() == IncidentStatus.CLASSIFIED) {
                    for (User admin : activeAdmins()) {
                        out.add(admin, NotificationType.INCIDENT_UNASSIGNED, number + " needs a technician",
                                "\"" + incident.getTitle() + "\" (" + incident.getPriority() + ", "
                                        + incident.getService().getName() + ") is waiting for assignment.", isUrgent(incident));
                    }
                }
            }
            case ASSIGN -> { /* handled by IncidentAssignedEvent, which knows the previous technician */ }
            case ACKNOWLEDGE -> out.add(reporter, NotificationType.INCIDENT_ACKNOWLEDGED, number + " acknowledged",
                    name(technician) + " has picked up \"" + incident.getTitle() + "\".", false);
            case START -> out.add(reporter, NotificationType.WORK_STARTED, "Work started on " + number,
                    name(technician) + " is investigating \"" + incident.getTitle() + "\".", false);
            case REQUEST_INFO -> out.add(reporter, NotificationType.INFO_REQUESTED, number + ": the technician needs information",
                    details + "Open the incident to answer.", true);
            case PROVIDE_INFO -> out.add(technician, NotificationType.INFO_PROVIDED, "Reporter answered on " + number,
                    details + "The incident is back in progress.", false);
            case RESOLVE -> out.add(reporter, NotificationType.INCIDENT_RESOLVED, number + " resolved: please confirm",
                    details + "Please confirm the fix, or reopen the incident if the problem remains.", true);
            case VERIFY -> out.add(technician, NotificationType.RESOLUTION_VERIFIED, "Fix confirmed on " + number,
                    details + "It can now be closed.", false);
            case REOPEN -> out.add(technician, NotificationType.INCIDENT_REOPENED, number + " was reopened",
                    details + "The reporter says the problem isn't fixed.", true);
            case CLOSE -> out.add(reporter, NotificationType.INCIDENT_CLOSED, number + " closed",
                    "\"" + incident.getTitle() + "\" is now closed. Thank you for reporting it.", false);
        }
    }

    /** Small user list, so loading all users and filtering is fine (avoids changing B's repository). */
    private List<User> activeAdmins() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN && u.isActive())
                .toList();
    }

    private static boolean isUrgent(Incident incident) {
        return incident.getPriority() == Priority.P1 || incident.getPriority() == Priority.P2;
    }

    /** "text" -> "text. " (no double full stop); null -> "". */
    private static String sentence(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        return text.endsWith(".") ? text + " " : text + ". ";
    }

    private static String name(User user) {
        return user == null ? "A technician" : user.getFullName();
    }

    /** Collects messages and applies the common rules (skip missing, inactive and the actor). */
    private static final class Messages {

        private final Long actorId;
        private final Incident incident;
        private final List<NotificationMessage> list = new ArrayList<>();

        Messages(Long actorId, Incident incident) {
            this.actorId = actorId;
            this.incident = incident;
        }

        void add(User recipient, NotificationType type, String title, String body, boolean important) {
            if (recipient == null || !recipient.isActive() || recipient.getId().equals(actorId)) {
                return;
            }
            list.add(new NotificationMessage(recipient, type, title, body, incident.getId(), incident.getNumber(), important));
        }

        List<NotificationMessage> list() {
            return list;
        }
    }
}
