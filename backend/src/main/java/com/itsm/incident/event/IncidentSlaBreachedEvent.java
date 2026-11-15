package com.itsm.incident.event;

import com.itsm.incident.sla.SlaTarget;

import java.time.Instant;

/** An SLA deadline was missed and a violation was recorded (published once per target). */
public record IncidentSlaBreachedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        SlaTarget target, int targetMinutes, Instant dueAt
) implements IncidentEvent {
}
