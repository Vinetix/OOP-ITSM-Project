package com.itsm.user;

import com.itsm.user.dto.CreateUserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Factory pattern: the ONLY place that decides which User subclass to instantiate.
 * Callers (registration, admin user creation, demo seeder) just say "create a user with this role"
 * and get back the right object, with the password already hashed.
 * Adding a new role means changing this one switch, not every caller.
 */
@Component
@RequiredArgsConstructor
public class UserFactory {

    private final PasswordEncoder passwordEncoder;

    public User create(CreateUserRequest request) {
        String passwordHash = passwordEncoder.encode(request.password());

        return switch (request.role()) {
            case EMPLOYEE -> new Employee(
                    request.fullName(), request.email(), passwordHash, request.phone(), request.department());
            case TECHNICIAN -> new Technician(
                    request.fullName(), request.email(), passwordHash, request.phone(),
                    Objects.requireNonNullElse(request.senior(), false),
                    Objects.requireNonNullElse(request.maxActiveIncidents(), Technician.DEFAULT_MAX_ACTIVE_INCIDENTS),
                    Objects.requireNonNullElse(request.experienceYears(), 0));
            case ADMIN -> new Admin(
                    request.fullName(), request.email(), passwordHash, request.phone());
        };
    }
}
