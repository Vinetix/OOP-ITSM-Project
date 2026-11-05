package com.itsm.common.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/** Public health check. The frontend can call this to show "backend offline" banners. */
@RestController
@RequestMapping("/api/system")
@Tag(name = "System", description = "Health and server information")
public class SystemInfoController {

    private final String applicationName;

    public SystemInfoController(@Value("${spring.application.name}") String applicationName) {
        this.applicationName = applicationName;
    }

    @GetMapping("/info")
    @Operation(summary = "Check that the backend is running (no login required)")
    public SystemInfo info() {
        return new SystemInfo(applicationName, "UP", Instant.now());
    }

    public record SystemInfo(String application, String status, Instant serverTime) {
    }
}
