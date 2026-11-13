package com.itsm.incident.event;

import com.itsm.incident.priority.Priority;

import java.time.Instant;

public record IncidentPriorityChangedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        Priority fromPriority, Priority toPriority, String reason
) implements IncidentEvent {
}
