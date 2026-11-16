package com.itsm.incident.event;

import java.time.Instant;

/** The incident was linked to (linked = true) or unlinked from (false) the primary incident it duplicates. */
public record IncidentDuplicateLinkedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        Long primaryIncidentId, String primaryNumber, boolean linked
) implements IncidentEvent {
}
