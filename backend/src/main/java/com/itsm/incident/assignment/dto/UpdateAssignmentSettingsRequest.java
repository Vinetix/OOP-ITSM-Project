package com.itsm.incident.assignment.dto;

import jakarta.validation.constraints.Size;

/** Both fields optional; null means "leave unchanged". */
public record UpdateAssignmentSettingsRequest(
        @Size(max = 40) String strategy,
        Boolean autoAssignOnReport
) {
}
