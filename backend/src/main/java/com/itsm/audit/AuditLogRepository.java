package com.itsm.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    /** Oldest first; id breaks ties between events in the same instant (e.g. report → classify → assign). */
    List<AuditLog> findByIncidentIdOrderByOccurredAtAscIdAsc(Long incidentId);
}
