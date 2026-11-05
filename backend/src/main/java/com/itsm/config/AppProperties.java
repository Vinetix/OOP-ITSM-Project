package com.itsm.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * All custom "app.*" settings in one immutable, type-safe object.
 * Validated at startup: if the JWT secret is missing or too short, the app
 * refuses to start with a clear message instead of failing later at login.
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @NotNull @Valid Jwt jwt,
        @NotNull @Valid Cors cors
) {

    public record Jwt(
            @NotBlank @Size(min = 32, message = "app.jwt.secret must be at least 32 characters") String secret,
            @Positive long expirationMinutes
    ) {
    }

    public record Cors(
            @NotEmpty List<String> allowedOrigins
    ) {
    }
}
