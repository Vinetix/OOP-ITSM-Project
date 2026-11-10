package com.itsm.security.dto;

import com.itsm.user.dto.UserResponse;

import java.time.Instant;

/** Returned by login and register. The frontend stores accessToken and sends it on every request. */
public record AuthResponse(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        UserResponse user
) {
}
