package com.itsm.incident.sla;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SlaViolationRepository extends JpaRepository<SlaViolation, Long>, JpaSpecificationExecutor<SlaViolation> {
}
