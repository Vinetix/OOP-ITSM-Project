package com.itsm.incident.event;

import java.time.Instant;

public record IncidentCreatedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        String number, String title
) implements IncidentEvent {
}
