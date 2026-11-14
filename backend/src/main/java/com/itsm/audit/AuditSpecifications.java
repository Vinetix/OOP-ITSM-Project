package com.itsm.audit;

import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Locale;

/** Filters for the admin audit search; each returns null (= no filter) when its value is absent. */
final class AuditSpecifications {

    private AuditSpecifications() {
    }

    static Specification<AuditLog> incidentNumber(String number) {
        return number == null || number.isBlank() ? null
                : (root, query, cb) -> cb.equal(cb.upper(root.get("incidentNumber")),
                number.trim().toUpperCase(Locale.ROOT));
    }

    static Specification<AuditLog> actor(Long actorId) {
        return actorId == null ? null : (root, query, cb) -> cb.equal(root.get("actorId"), actorId);
    }

    static Specification<AuditLog> systemOnly(Boolean systemOnly) {
        return Boolean.TRUE.equals(systemOnly) ? (root, query, cb) -> cb.isNull(root.get("actorId")) : null;
    }

    static Specification<AuditLog> action(AuditAction action) {
        return action == null ? null : (root, query, cb) -> cb.equal(root.get("action"), action);
    }

    static Specification<AuditLog> from(Instant from) {
        return from == null ? null : (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("occurredAt"), from);
    }

    static Specification<AuditLog> before(Instant before) {
        return before == null ? null : (root, query, cb) -> cb.lessThan(root.get("occurredAt"), before);
    }
}
