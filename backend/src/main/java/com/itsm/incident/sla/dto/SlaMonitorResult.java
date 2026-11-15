package com.itsm.incident.sla.dto;

import java.time.Instant;

/** What one monitor run did. skipped = changed by a user at the same moment (retried next run). */
public record SlaMonitorResult(Instant ranAt, int checked, int warnings, int breaches, int escalations,
                               int skipped, int failed) {
}
