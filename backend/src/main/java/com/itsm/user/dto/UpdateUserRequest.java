package com.itsm.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Admin edits a user. Role and email cannot be changed.
 * Role-specific fields left null keep their current value.
 */
public record UpdateUserRequest(
        @Schema(example = "Meera Iyer")
        @NotBlank @Size(max = 100) String fullName,

        @Schema(example = "+91 98765 43210")
        @Pattern(regexp = ValidationRules.PHONE_PATTERN, message = ValidationRules.PHONE_MESSAGE) String phone,

        @Schema(description = "EMPLOYEE only")
        @Size(max = 100) String department,

        @Schema(description = "TECHNICIAN only")
        Boolean available,

        @Schema(description = "TECHNICIAN only")
        Boolean senior,

        @Schema(description = "TECHNICIAN only")
        @Min(1) @Max(50) Integer maxActiveIncidents,

        @Schema(description = "TECHNICIAN only")
        @Min(0) @Max(60) Integer experienceYears
) {
}
