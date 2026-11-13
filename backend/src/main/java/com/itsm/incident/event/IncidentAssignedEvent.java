package com.itsm.incident.event;

import java.time.Instant;

public record IncidentAssignedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        Long technicianId, Long previousTechnicianId
) implements IncidentEvent {
}
