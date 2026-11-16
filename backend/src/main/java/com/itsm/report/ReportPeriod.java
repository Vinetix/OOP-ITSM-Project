package com.itsm.report;

import com.itsm.common.exception.InvalidRequestException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** A date range in the reports time zone, "to" inclusive; both ends optional (null = all time). */
record ReportPeriod(LocalDate from, LocalDate to, Instant start, Instant end) {

    static ReportPeriod of(LocalDate from, LocalDate to, ZoneId zone) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new InvalidRequestException("'to' must not be before 'from'");
        }
        return new ReportPeriod(from, to,
                from == null ? null : from.atStartOfDay(zone).toInstant(),
                to == null ? null : to.plusDays(1).atStartOfDay(zone).toInstant());
    }

    boolean contains(Instant instant) {
        return instant != null && (start == null || !instant.isBefore(start)) && (end == null || instant.isBefore(end));
    }
}
