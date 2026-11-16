package com.itsm.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ServiceReportRow(
        String serviceName,
        long totalIncidents,
        long openIncidents,
        long criticalIncidents,
        long slaViolations,
        Double averageResolutionMinutes
) {
}
