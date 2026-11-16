package com.itsm.incident.dto;

import com.itsm.incident.Incident;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.state.IncidentStatus;

/** A short reference to another incident (used for duplicate links). */
public record IncidentRef(Long id, String number, String title, IncidentStatus status, Priority priority) {

    public static IncidentRef from(Incident incident) {
        return incident == null ? null : new IncidentRef(incident.getId(), incident.getNumber(), incident.getTitle(),
                incident.getStatus(), incident.getPriority());
    }
}
