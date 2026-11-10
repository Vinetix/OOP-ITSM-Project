package com.itsm.security.dto;

import com.itsm.user.Role;
import com.itsm.user.dto.CreateUserRequest;
import com.itsm.user.dto.PasswordRules;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Public self-registration. No role field: the role is always EMPLOYEE. */
public record RegisterRequest(
        @Schema(example = "Neha Gupta")
        @NotBlank @Size(max = 100) String fullName,

        @Schema(example = "neha.gupta@itsm.com")
        @NotBlank @Email @Size(max = 150) String email,

        @Schema(example = "Password@123")
        @NotBlank @Size(min = PasswordRules.MIN_LENGTH, max = PasswordRules.MAX_LENGTH)
        @Pattern(regexp = PasswordRules.PATTERN, message = PasswordRules.MESSAGE) String password,

        @Schema(example = "+91 91234 56789")
        @Pattern(regexp = PasswordRules.PHONE_PATTERN, message = PasswordRules.PHONE_MESSAGE) String phone,

        @Schema(example = "Marketing")
        @Size(max = 100) String department
) {

    public CreateUserRequest toCreateUserRequest() {
        return new CreateUserRequest(Role.EMPLOYEE, fullName, email, password, phone, department,
                null, null, null);
    }
}
