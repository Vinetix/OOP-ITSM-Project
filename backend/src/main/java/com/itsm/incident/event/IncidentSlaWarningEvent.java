package com.itsm.incident.event;

import com.itsm.incident.sla.SlaTarget;

import java.time.Instant;

/** 75% of an SLA target's time has been used (published once per target by the SLA monitor). */
public record IncidentSlaWarningEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        SlaTarget target, int targetMinutes, Instant dueAt
) implements IncidentEvent {
}
