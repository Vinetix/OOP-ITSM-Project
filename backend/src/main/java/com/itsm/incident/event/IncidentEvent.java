package com.itsm.incident.event;

import java.time.Instant;

/**
 * Observer pattern: IncidentService publishes these events; listeners (notifications, audit log,
 * Phase 5) subscribe to them. The incident code doesn't know who is listening.
 * actorId is null when the system itself acted (classification, automatic escalation).
 */
public interface IncidentEvent {

    Long incidentId();

    Long actorId();

    Instant occurredAt();
}
