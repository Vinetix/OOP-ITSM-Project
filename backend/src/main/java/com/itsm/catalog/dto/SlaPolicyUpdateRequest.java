package com.itsm.catalog.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Only the targets can change; to change service or priority, create a new policy. */
public record SlaPolicyUpdateRequest(
        @Schema(example = "10")
        @NotNull @Min(1) @Max(10080) Integer responseMinutes,

        @Schema(example = "60")
        @NotNull @Min(1) @Max(43200) Integer resolutionMinutes
) {
}
