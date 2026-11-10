package com.itsm.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * BCrypt: a slow, salted one-way hash. Even if the database leaks, the original
 * passwords cannot be read back. Code depends on the PasswordEncoder interface,
 * so the algorithm could be swapped without touching any caller.
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
