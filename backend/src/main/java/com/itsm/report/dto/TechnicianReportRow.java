package com.itsm.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TechnicianReportRow(
        Long technicianId,
        String fullName,
        boolean senior,
        boolean available,
        long activeIncidents,
        int maxActiveIncidents,
        long resolvedIncidents,
        Double averageResolutionMinutes,
        long slaViolations,
        Double averageRating
) {
}
