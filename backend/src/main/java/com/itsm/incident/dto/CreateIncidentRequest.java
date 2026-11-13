package com.itsm.incident.dto;

import com.itsm.incident.priority.Impact;
import com.itsm.incident.priority.Urgency;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateIncidentRequest(
        @Schema(example = "Payment application unavailable")
        @NotBlank @Size(min = 5, max = 150) String title,

        @Schema(example = "Users are unable to complete transactions. The checkout page shows error 503.")
        @NotBlank @Size(max = 4000) String description,

        @Schema(example = "1", description = "Affected IT service id")
        @NotNull Long serviceId,

        @Schema(example = "8", description = "Optional. If omitted, the service's default category is used.")
        Long categoryId,

        @Schema(example = "CRITICAL")
        @NotNull Impact impact,

        @Schema(example = "CRITICAL")
        @NotNull Urgency urgency,

        @Schema(example = "500")
        @NotNull @Min(1) @Max(1_000_000) Integer affectedUsers
) {
}
