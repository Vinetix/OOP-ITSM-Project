package com.itsm.report.dto;

import java.time.LocalDate;

/** One day: incidents reported, incidents resolved, SLA violations recorded. */
public record TrendPoint(LocalDate date, long reported, long resolved, long slaViolations) {
}
