package com.itsm.incident.event;

import java.time.Instant;
import java.util.List;

public record IncidentDetailsUpdatedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        List<String> changedFields
) implements IncidentEvent {
}
