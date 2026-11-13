package com.itsm.incident.dto;

import com.itsm.incident.priority.Impact;
import com.itsm.incident.priority.Urgency;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Every field is optional: null means "keep the current value". Priority and SLA are recalculated. */
public record UpdateIncidentRequest(
        @Size(min = 5, max = 150) String title,
        @Size(max = 4000) String description,
        Long serviceId,
        Long categoryId,
        Impact impact,
        Urgency urgency,
        @Min(1) @Max(1_000_000) Integer affectedUsers
) {
}
