package com.itsm.incident.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Used for notes, information requests/answers and reopen reasons. */
public record MessageRequest(
        @Schema(example = "Which browser are you using, and do you see an error code?")
        @NotBlank @Size(max = 2000) String message
) {
}
