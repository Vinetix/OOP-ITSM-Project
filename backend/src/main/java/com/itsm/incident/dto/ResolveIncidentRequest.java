package com.itsm.incident.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveIncidentRequest(
        @Schema(example = "Restarted the payment service and renewed the expired TLS certificate.")
        @NotBlank @Size(max = 2000) String resolutionSummary,

        @Schema(example = "TLS certificate for the bank API expired at midnight.")
        @Size(max = 1000) String rootCause
) {
}
