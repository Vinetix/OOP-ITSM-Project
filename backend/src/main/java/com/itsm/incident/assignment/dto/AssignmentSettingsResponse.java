package com.itsm.incident.assignment.dto;

import java.time.Instant;
import java.util.List;

public record AssignmentSettingsResponse(
        String activeStrategy,
        boolean autoAssignOnReport,
        Instant updatedAt,
        List<StrategyInfo> strategies
) {
}
