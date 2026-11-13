package com.itsm.incident.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Reporter confirms the fix; rating and feedback are optional. */
public record VerifyIncidentRequest(
        @Schema(example = "5")
        @Min(1) @Max(5) Integer rating,

        @Schema(example = "Fixed quickly, thank you!")
        @Size(max = 1000) String feedback
) {
}
