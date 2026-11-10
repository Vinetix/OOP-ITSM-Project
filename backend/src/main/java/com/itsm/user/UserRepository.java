package com.itsm.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * Repository pattern: the rest of the app asks for users by meaning
 * ("find by email") and never writes SQL. Spring Data generates the implementation.
 * Queries on User are polymorphic: they return Employee/Technician/Admin objects.
 */
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
