package com.itsm.incident.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record AssignIncidentRequest(
        @Schema(example = "3", description = "User id of the technician")
        @NotNull Long technicianId
) {
}
