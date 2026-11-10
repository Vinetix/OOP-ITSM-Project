package com.itsm.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @Schema(example = "Password@123")
        @NotBlank String currentPassword,

        @Schema(example = "NewPassword@456")
        @NotBlank @Size(min = PasswordRules.MIN_LENGTH, max = PasswordRules.MAX_LENGTH)
        @Pattern(regexp = PasswordRules.PATTERN, message = PasswordRules.MESSAGE) String newPassword
) {
}
