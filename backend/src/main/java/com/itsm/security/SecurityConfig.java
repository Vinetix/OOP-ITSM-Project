package com.itsm.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * PHASE 0 VERSION: stateless REST setup, but every endpoint is still open.
 * Phase 1 replaces this file: adds the JWT filter, locks /api/** behind login,
 * and enables role checks (@PreAuthorize).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**",
            "/api/system/**",
            "/error"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // No cookies/sessions -> CSRF protection is not needed for a token-based API
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults()) // uses CorsConfig.corsConfigurationSource
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        // TEMPORARY (Phase 0 only): Phase 1 changes this to .authenticated()
                        .anyRequest().permitAll()
                );
        return http.build();
    }
}
