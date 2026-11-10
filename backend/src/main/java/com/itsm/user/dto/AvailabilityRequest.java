package com.itsm.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/** A technician marks themselves available / unavailable (e.g. on leave). */
public record AvailabilityRequest(
        @Schema(example = "false")
        @NotNull Boolean available
) {
}
