package com.itsm.incident.event;

import com.itsm.incident.NoteType;

import java.time.Instant;

public record IncidentNoteAddedEvent(
        Long incidentId, Long actorId, Instant occurredAt,
        NoteType type
) implements IncidentEvent {
}
