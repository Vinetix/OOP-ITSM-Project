package com.itsm.audit;

import com.itsm.incident.Incident;
import com.itsm.incident.IncidentRepository;
import com.itsm.incident.NoteType;
import com.itsm.incident.sla.EscalationPolicy;
import com.itsm.incident.event.IncidentCreatedEvent;
import com.itsm.incident.event.IncidentDetailsUpdatedEvent;
import com.itsm.incident.event.IncidentDuplicateLinkedEvent;
import com.itsm.incident.event.IncidentEscalatedEvent;
import com.itsm.incident.event.IncidentEvent;
import com.itsm.incident.event.IncidentNoteAddedEvent;
import com.itsm.incident.event.IncidentPriorityChangedEvent;
import com.itsm.incident.event.IncidentSlaBreachedEvent;
import com.itsm.incident.event.IncidentSlaWarningEvent;
import com.itsm.incident.event.IncidentStatusChangedEvent;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.User;
import com.itsm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Observer: turns incident events into audit rows.
 *
 * Runs BEFORE_COMMIT, i.e. inside the same transaction as the change. If the audit row can't be
 * written, the change is rolled back too, so the history can never miss a step. (Notifications do
 * the opposite: they run after commit, see NotificationEventListener.)
 *
 * IncidentAssignedEvent is not recorded: every assignment also publishes a status change (ASSIGN)
 * whose details already say who was assigned and how, so recording both would duplicate the line.
 */
@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditLogRepository auditLogRepository;
    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void on(IncidentEvent event) {
        switch (event) {
            case IncidentCreatedEvent e ->
                    record(e, AuditAction.REPORTED, null, IncidentStatus.NEW, "Reported: " + e.title());
            case IncidentStatusChangedEvent e ->
                    record(e, AuditAction.of(e.action()), e.fromStatus(), e.toStatus(), e.details());
            case IncidentPriorityChangedEvent e ->
                    record(e, AuditAction.PRIORITY_CHANGED, null, null,
                            "Priority changed from " + e.fromPriority() + " to " + e.toPriority()
                                    + (e.reason() == null ? "" : ": " + e.reason()));
            case IncidentDetailsUpdatedEvent e ->
                    record(e, AuditAction.DETAILS_UPDATED, null, null, "Updated " + String.join(", ", e.changedFields()));
            case IncidentNoteAddedEvent e -> recordNote(e);
            case IncidentSlaWarningEvent e -> record(e, AuditAction.SLA_WARNING, null, null,
                    label(e.target().name()) + " SLA at risk: 75% of the " + e.targetMinutes() + "-minute target used");
            case IncidentSlaBreachedEvent e -> record(e, AuditAction.SLA_BREACHED, null, null,
                    label(e.target().name()) + " SLA breached: " + e.targetMinutes() + "-minute target missed");
            case IncidentDuplicateLinkedEvent e -> record(e,
                    e.linked() ? AuditAction.DUPLICATE_LINKED : AuditAction.DUPLICATE_UNLINKED, null, null,
                    (e.linked() ? "Marked as a duplicate of " : "No longer a duplicate of ") + e.primaryNumber());
            case IncidentEscalatedEvent e -> record(e, AuditAction.ESCALATED, null, null,
                    "Escalated to level " + e.level() + " (" + EscalationPolicy.describe(e.level()) + "). " + e.reason());
            default -> { /* not audited (see class comment) */ }
        }
    }

    /** Questions, answers and reopen reasons are already recorded by their status change. */
    private void recordNote(IncidentNoteAddedEvent event) {
        if (event.type() == NoteType.COMMENT) {
            record(event, AuditAction.NOTE_ADDED, null, null, "Added a comment");
        } else if (event.type() == NoteType.WORK_NOTE) {
            record(event, AuditAction.NOTE_ADDED, null, null, "Added a work note");
        }
    }

    private static String label(String target) {
        return target.charAt(0) + target.substring(1).toLowerCase();
    }

    private void record(IncidentEvent event, AuditAction action, IncidentStatus from, IncidentStatus to, String details) {
        Incident incident = incidentRepository.getReferenceById(event.incidentId());
        User actor = event.actorId() == null ? null : userRepository.findById(event.actorId()).orElse(null);
        auditLogRepository.save(new AuditLog(
                event.occurredAt(),
                event.incidentId(),
                incident.getNumber(),
                event.actorId(),
                actor == null ? AuditLog.SYSTEM_ACTOR : actor.getFullName(),
                actor == null ? null : actor.getRole(),
                action, from, to, details));
    }
}
