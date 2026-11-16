package com.itsm.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CategoryReportRow(
        String code,
        String name,
        long totalIncidents,
        long openIncidents,
        Double averageResolutionMinutes
) {
}
