package com.itsm.incident;

import com.itsm.incident.state.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;

public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {

    /** Technician workload = incidents assigned to them that are still being worked on. */
    long countByAssignedTechnicianIdAndStatusIn(Long technicianId, Collection<IncidentStatus> statuses);
}
