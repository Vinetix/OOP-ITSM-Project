package com.itsm.security.dto;

import com.itsm.user.Role;
import com.itsm.user.dto.CreateUserRequest;
import com.itsm.user.dto.ValidationRules;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Public self-registration. No role field: the role is always EMPLOYEE. */
public record RegisterRequest(
        @Schema(example = "Neha Gupta")
        @NotBlank @Size(max = 100) String fullName,

        @Schema(example = "neha.gupta@itsm.com")
        @NotBlank @Size(max = ValidationRules.EMAIL_MAX_LENGTH)
        @Pattern(regexp = ValidationRules.EMAIL_PATTERN, message = ValidationRules.EMAIL_MESSAGE) String email,

        @Schema(example = "Password@123")
        @NotBlank @Size(min = ValidationRules.PASSWORD_MIN_LENGTH, max = ValidationRules.PASSWORD_MAX_LENGTH)
        @Pattern(regexp = ValidationRules.PASSWORD_PATTERN, message = ValidationRules.PASSWORD_MESSAGE) String password,

        @Schema(example = "+91 91234 56789")
        @Pattern(regexp = ValidationRules.PHONE_PATTERN, message = ValidationRules.PHONE_MESSAGE) String phone,

        @Schema(example = "Marketing")
        @Size(max = 100) String department
) {

    public CreateUserRequest toCreateUserRequest() {
        return new CreateUserRequest(Role.EMPLOYEE, fullName, email, password, phone, department,
                null, null, null);
    }
}
