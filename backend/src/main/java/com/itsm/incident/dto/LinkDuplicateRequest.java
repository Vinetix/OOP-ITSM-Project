package com.itsm.incident.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record LinkDuplicateRequest(
        @Schema(example = "9", description = "The primary incident this one duplicates")
        @NotNull Long primaryIncidentId
) {
}
