package com.itsm.incident;

import com.itsm.incident.state.IncidentStatus;
import com.itsm.security.UserPrincipal;
import com.itsm.user.Role;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;

/** Query building blocks for incident lists. */
public final class IncidentSpecifications {

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
        return (root, query, cb) -> root.get("status").in(statuses);
    }
}
