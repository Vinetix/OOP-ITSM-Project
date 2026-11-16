package com.itsm.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.state.IncidentStatus;

import java.time.LocalDate;
import java.util.Map;

/** Averages are in minutes (one decimal) and absent when there is nothing to average. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OverviewReport(
        LocalDate from,
        LocalDate to,
        long totalIncidents,
        long openIncidents,
        long criticalOpenIncidents,
        long resolvedIncidents,
        long escalatedOpenIncidents,
        long slaViolations,
        Double slaCompliancePercent,
        Double averageResponseMinutes,
        Double averageResolutionMinutes,
        Double averageRating,
        Map<IncidentStatus, Long> byStatus,
        Map<Priority, Long> byPriority
) {
}
