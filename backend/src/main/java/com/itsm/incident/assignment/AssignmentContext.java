package com.itsm.incident.assignment;

import com.itsm.incident.priority.Priority;

import java.util.List;

/** Everything a strategy needs to know: the incident's key facts and the available technicians. */
public record AssignmentContext(
        Long incidentId,
        String categoryCode,
        String serviceName,
        Priority priority,
        List<CandidateProfile> candidates
) {

    public AssignmentContext {
        candidates = List.copyOf(candidates);
    }

    /** P1 and P2 incidents benefit from a senior technician. */
    public boolean isUrgent() {
        return priority == Priority.P1 || priority == Priority.P2;
    }
}
