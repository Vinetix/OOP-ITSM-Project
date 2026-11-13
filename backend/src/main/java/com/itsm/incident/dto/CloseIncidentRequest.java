package com.itsm.incident.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

public record CloseIncidentRequest(
        @Schema(example = "Confirmed by reporter; monitoring added for certificate expiry.")
        @Size(max = 1000) String closureNote
) {
}
