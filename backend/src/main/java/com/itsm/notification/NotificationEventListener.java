package com.itsm.notification;

import com.itsm.incident.IncidentRepository;
import com.itsm.incident.event.IncidentAssignedEvent;
import com.itsm.incident.event.IncidentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Observer: sends notifications for incident events.
 *
 * Runs AFTER_COMMIT, so nobody is told about a change that was rolled back, and a notification
 * problem can never undo an incident action. Because the original transaction has already finished,
 * this listener needs its own new transaction (REQUIRES_NEW) to read the incident and store messages.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final IncidentRepository incidentRepository;
    private final IncidentNotificationRules rules;
    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(IncidentEvent event) {
        try {
            incidentRepository.findById(event.incidentId()).ifPresent(incident ->
                    rules.messagesFor(event, incident).forEach(notificationService::send));
            if (event instanceof IncidentAssignedEvent) {
                notificationService.resolveUnassignedAlerts(event.incidentId());
            }
        } catch (RuntimeException e) {
            log.warn("Notifications for {} on incident {} failed: {}",
                    event.getClass().getSimpleName(), event.incidentId(), e.getMessage(), e);
        }
    }
}
