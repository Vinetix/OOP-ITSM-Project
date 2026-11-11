package com.itsm.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @Schema(example = "Password@123")
        @NotBlank String currentPassword,

        @Schema(example = "NewPassword@456")
        @NotBlank @Size(min = ValidationRules.PASSWORD_MIN_LENGTH, max = ValidationRules.PASSWORD_MAX_LENGTH)
        @Pattern(regexp = ValidationRules.PASSWORD_PATTERN, message = ValidationRules.PASSWORD_MESSAGE) String newPassword
) {
}
