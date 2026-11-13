package com.itsm.incident.assignment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.incident.assignment.RankedCandidate;
import com.itsm.incident.priority.Priority;

import java.util.List;

/**
 * Ranked technicians for one incident under one strategy.
 * message is present only when candidates is empty and explains why.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RecommendationResponse(
        Long incidentId,
        String incidentNumber,
        Priority priority,
        String categoryCode,
        String serviceName,
        String strategy,
        boolean activeStrategy,
        List<RankedCandidate> candidates,
        List<IneligibleTechnician> unavailable,
        String message
) {
}
