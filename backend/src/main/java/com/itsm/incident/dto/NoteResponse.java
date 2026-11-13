package com.itsm.incident.dto;

import com.itsm.incident.IncidentNote;
import com.itsm.incident.NoteType;

import java.time.Instant;

public record NoteResponse(Long id, NoteType type, String text, PersonRef author, Instant createdAt) {

    public static NoteResponse from(IncidentNote note) {
        return new NoteResponse(note.getId(), note.getType(), note.getText(),
                PersonRef.from(note.getAuthor()), note.getCreatedAt());
    }
}
