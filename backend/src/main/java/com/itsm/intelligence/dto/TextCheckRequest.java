package com.itsm.intelligence.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The text being typed on the report form. serviceId is optional (improves duplicate matching). */
public record TextCheckRequest(
        @Schema(example = "Payment transaction failing")
        @NotBlank @Size(max = 150) String title,

        @Schema(example = "Checkout returns an error after entering card details.")
        @Size(max = 4000) String description,

        @Schema(example = "1")
        Long serviceId
) {
}
