package com.itsm.user;

import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

/**
 * Small, reusable query building blocks that can be combined with and().
 * The same technique is used for the incident search in Phase 7.
 */
public final class UserSpecifications {

    private UserSpecifications() {
    }

    /** Neutral starting point: matches every user. */
    public static Specification<User> all() {
        return (root, query, cb) -> cb.conjunction();
    }

    public static Specification<User> hasRole(Role role) {
        Class<? extends User> type = switch (role) {
            case EMPLOYEE -> Employee.class;
            case TECHNICIAN -> Technician.class;
            case ADMIN -> Admin.class;
        };
        return (root, query, cb) -> cb.equal(root.type(), type);
    }

    public static Specification<User> isActive(boolean active) {
        return (root, query, cb) -> cb.equal(root.get("active"), active);
    }

    public static Specification<User> nameOrEmailContains(String text) {
        String pattern = "%" + text.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("fullName")), pattern),
                cb.like(cb.lower(root.get("email")), pattern)
        );
    }
}
