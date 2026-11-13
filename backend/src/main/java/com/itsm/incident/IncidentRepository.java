package com.itsm.incident;

import com.itsm.incident.state.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {

    /** Technician workload = incidents assigned to them that are still being worked on. */
    long countByAssignedTechnicianIdAndStatusIn(Long technicianId, Collection<IncidentStatus> statuses);

    /** Counts for ALL technicians in one query (used for workload overview and assignment candidates). */
    @Query("""
            select i.assignedTechnician.id as technicianId, i.status as status, count(i) as total
            from Incident i
            where i.assignedTechnician is not null and i.status in :statuses
            group by i.assignedTechnician.id, i.status
            """)
    List<TechnicianStatusCount> countByTechnicianAndStatus(@Param("statuses") Collection<IncidentStatus> statuses);

    /** Same, limited to one service: "who has resolved incidents on this service before?" */
    @Query("""
            select i.assignedTechnician.id as technicianId, i.status as status, count(i) as total
            from Incident i
            where i.service.id = :serviceId and i.assignedTechnician is not null and i.status in :statuses
            group by i.assignedTechnician.id, i.status
            """)
    List<TechnicianStatusCount> countByTechnicianAndStatusForService(@Param("serviceId") Long serviceId,
                                                                     @Param("statuses") Collection<IncidentStatus> statuses);
}
