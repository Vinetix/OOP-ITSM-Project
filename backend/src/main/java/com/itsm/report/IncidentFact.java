package com.itsm.report;

import com.itsm.incident.priority.Priority;
import com.itsm.incident.state.IncidentStatus;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

/**
 * The facts about one incident that the reports need, loaded in a single query (no entity graphs).
 * All report numbers are computed from a list of these, so every report uses the same definitions.
 */
public record IncidentFact(
        Long id,
        IncidentStatus status,
        Priority priority,
        String categoryCode,
        String categoryName,
        String serviceName,
        Long technicianId,
        String technicianName,
        Instant reportedAt,
        Instant respondedAt,
        Instant resolvedAt,
        boolean responseBreached,
        boolean resolutionBreached,
        int escalationLevel,
        Integer feedbackRating
) {

    static final Set<IncidentStatus> FINISHED = EnumSet.of(IncidentStatus.RESOLVED, IncidentStatus.VERIFIED, IncidentStatus.CLOSED);

    public boolean isOpen() {
        return !FINISHED.contains(status);
    }

    public boolean isResolved() {
        return resolvedAt != null;
    }

    public boolean isBreached() {
        return responseBreached || resolutionBreached;
    }

    /** Counted for SLA compliance once the outcome is known: resolved, or already breached. */
    public boolean isSlaMeasured() {
        return isResolved() || isBreached();
    }

    public Double responseMinutes() {
        return respondedAt == null ? null : Duration.between(reportedAt, respondedAt).toSeconds() / 60.0;
    }

    public Double resolutionMinutes() {
        return resolvedAt == null ? null : Duration.between(reportedAt, resolvedAt).toSeconds() / 60.0;
    }
}
