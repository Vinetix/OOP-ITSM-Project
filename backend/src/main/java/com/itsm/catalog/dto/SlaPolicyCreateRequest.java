package com.itsm.catalog.dto;

import com.itsm.incident.priority.Priority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SlaPolicyCreateRequest(
        @Schema(example = "4", description = "Service id for a service-specific override; null for a DEFAULT policy")
        Long serviceId,

        @Schema(example = "P1")
        @NotNull Priority priority,

        @Schema(example = "10", description = "Minutes to acknowledge (max 7 days)")
        @NotNull @Min(1) @Max(10080) Integer responseMinutes,

        @Schema(example = "60", description = "Minutes to resolve (max 30 days)")
        @NotNull @Min(1) @Max(43200) Integer resolutionMinutes
) {
}
