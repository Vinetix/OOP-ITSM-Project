package com.itsm.incident.event;

import java.time.Instant;

/**
 * An assigned, unacknowledged P1/P2 incident moved up the escalation chain.
 * level 1 = assigned technician reminded, 2 = senior technicians alerted, 3 = admins alerted.
 */
public record IncidentEscalatedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        int previousLevel, int level, Long assignedTechnicianId, String reason
) implements IncidentEvent {
}
