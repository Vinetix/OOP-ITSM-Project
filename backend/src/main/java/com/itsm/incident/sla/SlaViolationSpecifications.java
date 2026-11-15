package com.itsm.incident.sla;

import com.itsm.incident.priority.Priority;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

final class SlaViolationSpecifications {

    private SlaViolationSpecifications() {
    }

    static Specification<SlaViolation> target(SlaTarget target) {
        return target == null ? null : (root, query, cb) -> cb.equal(root.get("target"), target);
    }

    static Specification<SlaViolation> priority(Priority priority) {
        return priority == null ? null : (root, query, cb) -> cb.equal(root.get("priority"), priority);
    }

    static Specification<SlaViolation> incidentNumber(String number) {
        return number == null || number.isBlank() ? null
                : (root, query, cb) -> cb.equal(cb.upper(root.get("incidentNumber")), number.trim().toUpperCase(Locale.ROOT));
    }
}
