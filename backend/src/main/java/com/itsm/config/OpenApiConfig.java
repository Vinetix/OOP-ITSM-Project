package com.itsm.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI: http://localhost:8080/swagger-ui.html
 * The "bearerAuth" scheme adds an Authorize button where you paste the JWT
 * returned by /api/auth/login (from Phase 1 onward).
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "I-ITSM API",
                version = "v1",
                description = "Intelligent IT Service Management & Incident Resolution System"
        ),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {
}
