package com.itsm.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Any logged-in user edits their own basic profile. */
public record UpdateProfileRequest(
        @Schema(example = "Rahul Verma")
        @NotBlank @Size(max = 100) String fullName,

        @Schema(example = "+91 90000 11111")
        @Pattern(regexp = ValidationRules.PHONE_PATTERN, message = ValidationRules.PHONE_MESSAGE) String phone
) {
}
