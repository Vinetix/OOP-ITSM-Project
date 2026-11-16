package com.itsm.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.incident.priority.Priority;

import java.util.List;

/**
 * SLA compliance. "measured" = incidents whose outcome is known (resolved, or already breached);
 * "met" = measured without any breach (neither response nor resolution).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SlaReport(
        Double compliancePercent,
        long measured,
        long met,
        long breached,
        long responseViolations,
        long resolutionViolations,
        List<PriorityRow> byPriority
) {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PriorityRow(Priority priority, long measured, long met, long breached, Double compliancePercent,
                              long responseViolations, long resolutionViolations) {
    }
}
