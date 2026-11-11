package com.itsm.user.dto;

import com.itsm.user.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Admin creates a user of any role. Role-specific fields are optional and ignored
 * for other roles: department (EMPLOYEE); senior, maxActiveIncidents, experienceYears (TECHNICIAN).
 */
public record CreateUserRequest(
        @Schema(example = "TECHNICIAN")
        @NotNull Role role,

        @Schema(example = "Meera Iyer")
        @NotBlank @Size(max = 100) String fullName,

        @Schema(example = "meera.iyer@itsm.com")
        @NotBlank @Size(max = ValidationRules.EMAIL_MAX_LENGTH)
        @Pattern(regexp = ValidationRules.EMAIL_PATTERN, message = ValidationRules.EMAIL_MESSAGE) String email,

        @Schema(example = "Password@123")
        @NotBlank @Size(min = ValidationRules.PASSWORD_MIN_LENGTH, max = ValidationRules.PASSWORD_MAX_LENGTH)
        @Pattern(regexp = ValidationRules.PASSWORD_PATTERN, message = ValidationRules.PASSWORD_MESSAGE) String password,

        @Schema(example = "+91 98765 43210")
        @Pattern(regexp = ValidationRules.PHONE_PATTERN, message = ValidationRules.PHONE_MESSAGE) String phone,

        @Schema(example = "Finance", description = "EMPLOYEE only")
        @Size(max = 100) String department,

        @Schema(example = "false", description = "TECHNICIAN only")
        Boolean senior,

        @Schema(example = "5", description = "TECHNICIAN only")
        @Min(1) @Max(50) Integer maxActiveIncidents,

        @Schema(example = "3", description = "TECHNICIAN only")
        @Min(0) @Max(60) Integer experienceYears
) {
}
