package com.itsm.security;

import com.itsm.config.AppProperties;
import com.itsm.user.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * Issues and verifies JSON Web Tokens signed with HMAC-SHA (HS256+).
 * The token carries the user id (subject) plus email and role, which the
 * frontend may decode to decide which screens to show. The server never trusts
 * those claims for authorization: it reloads the user from the database each request.
 */
@Service
public class JwtService {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey signingKey;
    private final Duration validity;

    public JwtService(AppProperties properties) {
        this.signingKey = Keys.hmacShaKeyFor(properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.validity = Duration.ofMinutes(properties.jwt().expirationMinutes());
    }

    public IssuedToken issue(Long userId, String email, Role role) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(validity);
        String token = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_EMAIL, email)
                .claim(CLAIM_ROLE, role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
        return new IssuedToken(token, expiresAt);
    }

    /**
     * Verifies signature and expiry, then returns the user id.
     * Throws io.jsonwebtoken.JwtException (e.g. ExpiredJwtException) if the token is invalid.
     */
    public Long extractUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.valueOf(claims.getSubject());
    }

    public record IssuedToken(String token, Instant expiresAt) {
    }
}
