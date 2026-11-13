package com.itsm.incident.event;

import com.itsm.incident.state.IncidentAction;
import com.itsm.incident.state.IncidentStatus;

import java.time.Instant;

public record IncidentStatusChangedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        IncidentStatus fromStatus, IncidentStatus toStatus, IncidentAction action, String details
) implements IncidentEvent {
}
