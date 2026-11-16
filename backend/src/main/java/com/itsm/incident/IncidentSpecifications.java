package com.itsm.incident;

import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.SlaStatus;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.security.UserPrincipal;
import com.itsm.user.Role;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Collection;
import java.util.Locale;

/** Query building blocks for incident lists and search. Each filter returns null when it has no value. */
public final class IncidentSpecifications {

    private static final java.util.regex.Pattern NUMBER =
            java.util.regex.Pattern.compile("(?i)inc0*(\\d{1,9})");

    private IncidentSpecifications() {
    }

    /** Employees see what they reported, technicians what is assigned to them, admins everything. */
    public static Specification<Incident> visibleTo(UserPrincipal user) {
        if (user.getRole() == Role.ADMIN) {
            return (root, query, cb) -> cb.conjunction();
        }
        if (user.getRole() == Role.TECHNICIAN) {
            return (root, query, cb) -> cb.equal(root.get("assignedTechnician").get("id"), user.getId());
        }
        return (root, query, cb) -> cb.equal(root.get("reporter").get("id"), user.getId());
    }

    public static Specification<Incident> hasStatus(IncidentStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    /** Matches any of the given statuses, e.g. "in progress" = ACKNOWLEDGED or IN_PROGRESS. */
    public static Specification<Incident> hasStatusIn(Collection<IncidentStatus> statuses) {
        return isEmpty(statuses) ? null : (root, query, cb) -> root.get("status").in(statuses);
    }

    public static Specification<Incident> hasPriorityIn(Collection<Priority> priorities) {
        return isEmpty(priorities) ? null : (root, query, cb) -> root.get("priority").in(priorities);
    }

    public static Specification<Incident> inCategory(Long categoryId) {
        return categoryId == null ? null : (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Incident> onService(Long serviceId) {
        return serviceId == null ? null : (root, query, cb) -> cb.equal(root.get("service").get("id"), serviceId);
    }

    public static Specification<Incident> assignedTo(Long technicianId) {
        return technicianId == null ? null
                : (root, query, cb) -> cb.equal(root.get("assignedTechnician").get("id"), technicianId);
    }

    public static Specification<Incident> reportedBy(Long reporterId) {
        return reporterId == null ? null : (root, query, cb) -> cb.equal(root.get("reporter").get("id"), reporterId);
    }

    /** Reported at or after this instant (SLA start = report time). */
    public static Specification<Incident> reportedFrom(Instant from) {
        return from == null ? null
                : (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("sla").get("slaStartedAt"), from);
    }

    /** Reported before this instant. */
    public static Specification<Incident> reportedBefore(Instant before) {
        return before == null ? null : (root, query, cb) -> cb.lessThan(root.get("sla").get("slaStartedAt"), before);
    }

    public static Specification<Incident> escalatedOnly(Boolean escalatedOnly) {
        return Boolean.TRUE.equals(escalatedOnly) ? (root, query, cb) -> cb.greaterThan(root.get("escalationLevel"), 0) : null;
    }

    /**
     * Free text: an incident number ("INC00008", "inc8"; the number is derived from the id), or a word or
     * phrase in the title or description (case-insensitive).
     */
    public static Specification<Incident> matchesText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String trimmed = text.trim();
        java.util.regex.Matcher number = NUMBER.matcher(trimmed);
        if (number.matches()) {
            long id = Long.parseLong(number.group(1));
            return (root, query, cb) -> cb.equal(root.get("id"), id);
        }
        String pattern = "%" + trimmed.toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), pattern, '\\'),
                cb.like(cb.lower(root.get("description")), pattern, '\\'));
    }

    /**
     * Same rules as SlaTracking.statusAt(now), expressed as a database condition:
     *   MET      resolved within the resolution target
     *   BREACHED resolved late, or still open with a breach flag or a passed deadline
     *   AT_RISK  open, not breached, and past the stored 75% point of a running target
     *   ON_TRACK open and none of the above
     */
    public static Specification<Incident> hasSlaStatus(SlaStatus status, Instant now) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> {
            Path<Object> sla = root.get("sla");
            Predicate hasSla = cb.isNotNull(sla.get("slaStartedAt"));
            Predicate resolved = cb.isNotNull(sla.get("resolvedAt"));
            Predicate open = cb.isNull(sla.get("resolvedAt"));
            Predicate notResponded = cb.isNull(sla.get("respondedAt"));
            Predicate breachedOpen = cb.and(open, cb.or(
                    cb.isTrue(sla.get("responseBreached")),
                    cb.isTrue(sla.get("resolutionBreached")),
                    cb.lessThan(sla.get("resolutionDueAt"), now),
                    cb.and(notResponded, cb.lessThan(sla.get("responseDueAt"), now))));
            Predicate breached = cb.or(cb.and(resolved, cb.isTrue(sla.get("resolutionBreached"))), breachedOpen);
            Predicate atRisk = cb.and(open, cb.not(breachedOpen), cb.or(
                    cb.lessThanOrEqualTo(sla.get("resolutionAtRiskAt"), now),
                    cb.and(notResponded, cb.lessThanOrEqualTo(sla.get("responseAtRiskAt"), now))));
            return switch (status) {
                case MET -> cb.and(hasSla, resolved, cb.isFalse(sla.get("resolutionBreached")));
                case BREACHED -> cb.and(hasSla, breached);
                case AT_RISK -> cb.and(hasSla, atRisk);
                case ON_TRACK -> cb.and(hasSla, open, cb.not(breachedOpen), cb.not(atRisk));
            };
        };
    }

    private static boolean isEmpty(Collection<?> values) {
        return values == null || values.isEmpty();
    }
}
