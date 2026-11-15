package com.itsm.incident.sla;

import com.itsm.incident.Incident;
import com.itsm.incident.IncidentRepository;
import com.itsm.incident.event.IncidentEscalatedEvent;
import com.itsm.incident.event.IncidentSlaBreachedEvent;
import com.itsm.incident.event.IncidentSlaWarningEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Checks ONE incident: warnings, breaches (with violation records) and escalation.
 * Each call runs in its own transaction, so a problem with one incident never affects the others.
 * Everything here is done by the system, so every event has actorId = null.
 */
@Service
@RequiredArgsConstructor
public class SlaCheckService {

    private final IncidentRepository incidentRepository;
    private final SlaViolationRepository violationRepository;
    private final EscalationPolicy escalationPolicy;
    private final ApplicationEventPublisher events;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SlaCheckResult check(Long incidentId, Instant now) {
        Incident incident = incidentRepository.findById(incidentId).orElse(null);
        if (incident == null || incident.getSla() == null) {
            return SlaCheckResult.NONE;
        }
        SlaTracking sla = incident.getSla();
        int warnings = 0;
        int breaches = 0;
        int escalations = 0;

        for (SlaTarget target : incident.takeNewSlaWarnings(now)) {
            events.publishEvent(new IncidentSlaWarningEvent(incidentId, null, now, target,
                    sla.targetMinutes(target), sla.dueAt(target)));
            warnings++;
        }

        for (SlaTarget target : incident.takeUnrecordedSlaViolations(now)) {
            violationRepository.save(new SlaViolation(incident, target, now));
            events.publishEvent(new IncidentSlaBreachedEvent(incidentId, null, now, target,
                    sla.targetMinutes(target), sla.dueAt(target)));
            breaches++;
        }

        int previousLevel = incident.getEscalationLevel();
        int levelDue = escalationPolicy.levelDue(incident, now);
        if (incident.escalateTo(levelDue, now)) {
            long minutes = Duration.between(sla.getSlaStartedAt(), now).toMinutes();
            String reason = "Not acknowledged after " + minutes + " min (" + incident.getPriority()
                    + " response target " + sla.getResponseTargetMinutes() + " min)";
            events.publishEvent(new IncidentEscalatedEvent(incidentId, null, now, previousLevel, levelDue,
                    incident.getAssignedTechnician() == null ? null : incident.getAssignedTechnician().getId(),
                    reason));
            escalations++;
        }
        return new SlaCheckResult(warnings, breaches, escalations);
    }

    public record SlaCheckResult(int warnings, int breaches, int escalations) {

        static final SlaCheckResult NONE = new SlaCheckResult(0, 0, 0);
    }
}
